import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

// Extend Express Request type to include companyId
declare global {
  namespace Express {
    interface Request {
      companyId?: string;
    }
  }
}

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// JWT Secret for company authentication
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Company Pool Contract Address
const COMPANY_POOL_CONTRACT = process.env.COMPANY_POOL_CONTRACT || '0xC84c34835BEB8A4fb180979E1A4b567A6fC9F9dE';

// Initialize signer for smart contract signatures
// This should be the SAME wallet that deployed the contract (contract owner)
const signerPrivateKey = process.env.SIGNER_PRIVATE_KEY || process.env.PRIVATE_KEY;
let signerWallet: ethers.Wallet | null = null;

if (signerPrivateKey) {
  signerWallet = new ethers.Wallet(signerPrivateKey);
  console.log('🔐 Signer wallet initialized:', signerWallet.address);
} else {
  console.warn('⚠️  No SIGNER_PRIVATE_KEY found - signatures will not work!');
}

// Middleware to verify JWT token
const authenticateCompany = async (req: any, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.companyId = decoded.companyId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EduFund API is running' });
});

// GET /api/quests - Get all quests with pool status
app.get('/api/quests', async (req, res) => {
  try {
    const quests = await prisma.quest.findMany({
      include: {
        fundingPools: {
          where: { active: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            company: {
              select: { name: true }
            },
            _count: {
              select: { rewards: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add pool status to each quest
    const questsWithStatus = quests.map(quest => {
      const pool = quest.fundingPools[0];
      
      return {
        ...quest,
        poolStatus: pool ? {
          hasPool: true,
          companyName: pool.company.name,
          isFull: pool._count.rewards >= pool.maxParticipants,
          isOutOfFunds: pool.remainingBalance < pool.rewardPerStudent,
          remainingSlots: pool.maxParticipants - pool._count.rewards,
          remainingBalance: pool.remainingBalance
        } : {
          hasPool: false,
          isFull: false,
          isOutOfFunds: false
        }
      };
    });

    res.json(questsWithStatus);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

// POST /api/quests - Create a new quest (admin only for now)
app.post('/api/quests', async (req, res) => {
  try {
    const { title, description, reward, difficulty, content } = req.body;
    
    if (!title || !description || !reward || !difficulty || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const quest = await prisma.quest.create({
      data: {
        title,
        description,
        reward,
        difficulty,
        content
      }
    });
    
    res.status(201).json(quest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create quest' });
  }
});

// POST /api/quests/:id/complete - Mark quest as completed for a user
app.post('/api/quests/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress }
      });
    }

    // Check if quest exists and get associated funding pool
    const quest = await prisma.quest.findUnique({
      where: { id },
      include: {
        fundingPools: {
          where: { active: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!quest) {
      return res.status(404).json({ error: 'Quest not found' });
    }

    // Check if already completed
    const existing = await prisma.completedQuest.findUnique({
      where: {
        userId_questId: {
          userId: user.id,
          questId: id
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Quest already completed' });
    }

    // Check if quest has an active funding pool
    const fundingPool = quest.fundingPools[0];
    if (fundingPool) {
      // Check if pool has reached max participants
      const poolRewardsCount = await prisma.reward.count({
        where: { poolId: fundingPool.id }
      });

      if (poolRewardsCount >= fundingPool.maxParticipants) {
        return res.status(400).json({ 
          error: 'This quest has reached maximum participants. Pool is full.' 
        });
      }

      // Check if pool has sufficient balance
      if (fundingPool.remainingBalance < fundingPool.rewardPerStudent) {
        return res.status(400).json({ 
          error: 'Pool has insufficient funds. Please contact the company.' 
        });
      }
    }

    // Mark as completed
    const completedQuest = await prisma.completedQuest.create({
      data: {
        userId: user.id,
        questId: id
      }
    });

    // Generate signature for smart contract claim
    let signature = null;
    let questIdBytes = null;
    let poolIdBytes = null;
    let useCompanyPool = false;
    
    if (signerWallet) {
      try {
        questIdBytes = ethers.keccak256(ethers.toUtf8Bytes(id));
        
        // Check if this quest is funded by a company pool
        if (fundingPool) {
          // Generate signature for Company Pool contract
          // Message: keccak256(poolId, studentAddress, questId)
          poolIdBytes = ethers.keccak256(ethers.toUtf8Bytes(fundingPool.id));
          
          const messageHash = ethers.solidityPackedKeccak256(
            ['bytes32', 'address', 'bytes32'],
            [poolIdBytes, walletAddress, questIdBytes]
          );
          
          signature = await signerWallet.signMessage(ethers.getBytes(messageHash));
          useCompanyPool = true;
          
          console.log('✅ Generated Company Pool signature for pool:', fundingPool.id, 'user:', walletAddress);
        } else {
          // Generate signature for Student Rewards contract
          // Message: keccak256(questId, userAddress, amount)
          const amountWei = ethers.parseEther(quest.reward.toString());
          
          const messageHash = ethers.solidityPackedKeccak256(
            ['bytes32', 'address', 'uint256'],
            [questIdBytes, walletAddress, amountWei]
          );
          
          signature = await signerWallet.signMessage(ethers.getBytes(messageHash));
          
          console.log('✅ Generated Student Rewards signature for quest:', id, 'user:', walletAddress);
        }
      } catch (signError) {
        console.error('❌ Failed to generate signature:', signError);
      }
    }

    res.status(201).json({ 
      message: 'Quest completed successfully',
      completedQuest,
      reward: quest.reward,
      // Include signature and bytes for claiming
      signature,
      questIdBytes,
      poolIdBytes,
      poolId: fundingPool?.id,
      useCompanyPool,
      fundingPool: fundingPool ? {
        id: fundingPool.id,
        companyName: fundingPool.courseName,
        rewardPerStudent: fundingPool.rewardPerStudent
      } : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to complete quest' });
  }
});

// GET /api/users/:walletAddress - Get user profile and completed quests
app.get('/api/users/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    let user = await prisma.user.findUnique({
      where: { walletAddress },
      include: {
        completedQuests: {
          include: {
            quest: true
          },
          orderBy: { completedAt: 'desc' }
        }
      }
    });

    if (!user) {
      // Return empty user data if not found
      return res.json({
        walletAddress,
        completedQuests: [],
        totalRewards: 0
      });
    }

    const totalRewards = user.completedQuests.reduce((sum, cq) => sum + cq.quest.reward, 0);

    res.json({
      id: user.id,
      walletAddress: user.walletAddress,
      completedQuests: user.completedQuests,
      totalRewards,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// POST /api/rewards/claim - Claim reward for completed quest
app.post('/api/rewards/claim', async (req, res) => {
  try {
    const { walletAddress, questId, txHash } = req.body;

    if (!walletAddress || !questId) {
      return res.status(400).json({ error: 'Wallet address and quest ID are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Find completed quest with funding pool info
    const completedQuest = await prisma.completedQuest.findUnique({
      where: {
        userId_questId: {
          userId: user.id,
          questId
        }
      },
      include: {
        quest: {
          include: {
            fundingPools: {
              where: { active: true },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          }
        }
      }
    });

    if (!completedQuest) {
      return res.status(404).json({ error: 'Quest not completed yet' });
    }

    if (completedQuest.rewardClaimed) {
      return res.status(400).json({ error: 'Reward already claimed' });
    }

    // Check if quest has an active funding pool
    const fundingPool = completedQuest.quest.fundingPools[0];
    
    if (fundingPool) {
      // Double-check pool limits
      const poolRewardsCount = await prisma.reward.count({
        where: { poolId: fundingPool.id }
      });

      if (poolRewardsCount >= fundingPool.maxParticipants) {
        return res.status(400).json({ error: 'Pool has reached maximum participants' });
      }

      if (fundingPool.remainingBalance < fundingPool.rewardPerStudent) {
        return res.status(400).json({ error: 'Pool has insufficient funds' });
      }
    }

    // Create reward record (linked to pool if exists)
    const reward = await prisma.reward.create({
      data: {
        wallet: walletAddress,
        questId,
        amount: completedQuest.quest.reward,
        txHash,
        poolId: fundingPool?.id  // Link to pool if exists
      }
    });

    // Mark reward as claimed
    await prisma.completedQuest.update({
      where: {
        userId_questId: {
          userId: user.id,
          questId
        }
      },
      data: {
        rewardClaimed: true
      }
    });

    // Update pool balance if this claim is from a pool
    if (fundingPool) {
      await prisma.fundingPool.update({
        where: { id: fundingPool.id },
        data: {
          remainingBalance: {
            decrement: fundingPool.rewardPerStudent
          }
        }
      });
      
      console.log(`✅ Pool ${fundingPool.id} balance updated: -${fundingPool.rewardPerStudent} mUSD`);
    }

    res.status(201).json({
      message: 'Reward claimed successfully',
      reward,
      fromPool: fundingPool ? {
        poolId: fundingPool.id,
        companyName: fundingPool.courseName,
        remaining: fundingPool.remainingBalance - fundingPool.rewardPerStudent
      } : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to claim reward' });
  }
});

// GET /api/rewards/:wallet - Get all rewards for a wallet
app.get('/api/rewards/:wallet', async (req, res) => {
  try {
    const { wallet } = req.params;

    const rewards = await prisma.reward.findMany({
      where: { wallet },
      orderBy: { claimedAt: 'desc' }
    });

    const totalClaimed = rewards.reduce((sum, r) => sum + r.amount, 0);

    res.json({
      rewards,
      totalClaimed,
      count: rewards.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch rewards' });
  }
});

// ============================================
// COMPANY ENDPOINTS
// ============================================

// POST /api/company/register - Register a new company
app.post('/api/company/register', async (req, res) => {
  try {
    const { name, email, walletAddress, password } = req.body;

    if (!name || !email || !walletAddress || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if company already exists
    const existing = await prisma.company.findFirst({
      where: {
        OR: [
          { email },
          { walletAddress }
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Company with this email or wallet already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create company
    const company = await prisma.company.create({
      data: {
        name,
        email,
        walletAddress,
        password: hashedPassword
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { companyId: company.id, email: company.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Company registered successfully',
      token,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        walletAddress: company.walletAddress
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to register company' });
  }
});

// POST /api/company/login - Company login
app.post('/api/company/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find company
    const company = await prisma.company.findUnique({
      where: { email }
    });

    if (!company) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, company.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { companyId: company.id, email: company.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        walletAddress: company.walletAddress
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /api/pools/create - Create a new funding pool
app.post('/api/pools/create', authenticateCompany, async (req, res) => {
  try {
    const { courseName, totalFund, rewardPerStudent, maxParticipants, description, content } = req.body;
    const companyId = req.companyId;

    if (!courseName || !totalFund || !rewardPerStudent || !maxParticipants) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (totalFund < rewardPerStudent * maxParticipants) {
      return res.status(400).json({ 
        error: 'Total fund must be >= reward per student × max participants' 
      });
    }

    // Get company info for quest description
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    // Auto-create a Quest for students to see and complete
    const quest = await prisma.quest.create({
      data: {
        title: courseName,
        description: description || `Learn ${courseName} and earn ${rewardPerStudent} mUSD. Funded by ${company?.name || 'a company'}.`,
        reward: rewardPerStudent,
        difficulty: 'intermediate', // Default, can be customized
        content: content || `Complete this course to earn ${rewardPerStudent} mUSD!\n\nThis learning opportunity is funded by ${company?.name}.\n\nCourse: ${courseName}\n\nBy completing this quest, you'll gain valuable knowledge and earn real Bitcoin-backed rewards.`
      }
    });

    // Create pool in database and link to quest
    const pool = await prisma.fundingPool.create({
      data: {
        companyId,
        questId: quest.id,  // Link to the auto-created quest
        courseName,
        totalFund,
        rewardPerStudent,
        maxParticipants,
        remainingBalance: totalFund,
        contractAddress: COMPANY_POOL_CONTRACT
      },
      include: {
        company: {
          select: {
            name: true,
            walletAddress: true
          }
        },
        quest: true
      }
    });

    // Generate pool ID for smart contract
    const poolId = ethers.keccak256(ethers.toUtf8Bytes(pool.id));

    res.status(201).json({
      message: 'Funding pool and quest created successfully!',
      pool,
      quest,
      poolId,
      instructions: {
        step1: 'Approve MUSD spending',
        step2: 'Call createPool on contract',
        contractAddress: COMPANY_POOL_CONTRACT
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create pool' });
  }
});

// GET /api/pools/list - Get all pools for authenticated company
app.get('/api/pools/list', authenticateCompany, async (req, res) => {
  try {
    const companyId = req.companyId;

    const pools = await prisma.fundingPool.findMany({
      where: { companyId },
      include: {
        _count: {
          select: { rewards: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ pools });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch pools' });
  }
});

// GET /api/pools/:id - Get pool details
app.get('/api/pools/:id', authenticateCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId;

    const pool = await prisma.fundingPool.findFirst({
      where: {
        id,
        companyId
      },
      include: {
        company: {
          select: {
            name: true,
            email: true,
            walletAddress: true
          }
        },
        rewards: {
          orderBy: { claimedAt: 'desc' },
          take: 50
        }
      }
    });

    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }

    res.json({ pool });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch pool details' });
  }
});

// DELETE /api/pools/:id - Close/delete a funding pool
app.delete('/api/pools/:id', authenticateCompany, async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.companyId;

    const pool = await prisma.fundingPool.findFirst({
      where: {
        id,
        companyId
      }
    });

    if (!pool) {
      return res.status(404).json({ error: 'Pool not found' });
    }

    // Delete the associated quest first (if it exists)
    if (pool.questId) {
      try {
        // First delete completed quests referencing this quest
        await prisma.completedQuest.deleteMany({
          where: { questId: pool.questId }
        });
        
        // Then delete the quest
        await prisma.quest.delete({
          where: { id: pool.questId }
        });
      } catch (questError) {
        console.error('Failed to delete quest:', questError);
      }
    }

    // Mark pool as inactive
    await prisma.fundingPool.update({
      where: { id },
      data: { active: false }
    });

    res.json({
      message: 'Pool closed and quest removed successfully',
      refundAvailable: pool.remainingBalance > 0 ? pool.remainingBalance : 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to close pool' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});


