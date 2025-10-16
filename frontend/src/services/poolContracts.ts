import { ethers } from 'ethers';

// Company Pool Contract Configuration
export const POOL_CONTRACTS = {
  COMPANY_POOL: '0xC84c34835BEB8A4fb180979E1A4b567A6fC9F9dE',
  MUSD: '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503',
};

// Company Pool Contract ABI
export const COMPANY_POOL_ABI = [
  'function createPool(bytes32 poolId, string courseName, uint256 totalFund, uint256 rewardPerStudent, uint256 maxParticipants)',
  'function distributeReward(bytes32 poolId, address student, bytes32 questId, bytes signature)',
  'function refillPool(bytes32 poolId, uint256 amount)',
  'function closePool(bytes32 poolId)',
  'function getPool(bytes32 poolId) view returns (tuple(address company, string courseName, uint256 totalFund, uint256 rewardPerStudent, uint256 maxParticipants, uint256 remainingBalance, uint256 studentsRewarded, bool active))',
  'function hasClaimed(bytes32 poolId, address student) view returns (bool)',
];

// mUSD Token ABI
export const MUSD_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
];

/**
 * Create a funding pool on the blockchain
 */
export async function createPoolOnChain(
  poolId: string,
  courseName: string,
  totalFund: number,
  rewardPerStudent: number,
  maxParticipants: number
): Promise<string> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('No wallet found');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();

    // Convert poolId to bytes32
    const poolIdBytes = ethers.keccak256(ethers.toUtf8Bytes(poolId));
    const totalFundWei = ethers.parseEther(totalFund.toString());
    const rewardWei = ethers.parseEther(rewardPerStudent.toString());

    // Step 1: Approve mUSD spending
    const musdContract = new ethers.Contract(POOL_CONTRACTS.MUSD, MUSD_ABI, signer);
    
    const approveTx = await musdContract.approve(POOL_CONTRACTS.COMPANY_POOL, totalFundWei);
    await approveTx.wait();

    // Step 2: Create pool on contract
    const poolContract = new ethers.Contract(
      POOL_CONTRACTS.COMPANY_POOL,
      COMPANY_POOL_ABI,
      signer
    );

    const createTx = await poolContract.createPool(
      poolIdBytes,
      courseName,
      totalFundWei,
      rewardWei,
      maxParticipants
    );

    const receipt = await createTx.wait();
    return receipt.hash;
  } catch (error: any) {
    console.error('Failed to create pool on chain:', error);
    throw new Error(error.message || 'Transaction failed');
  }
}

/**
 * Get pool details from blockchain
 */
export async function getPoolFromChain(poolId: string) {
  if (typeof window.ethereum === 'undefined') {
    throw new Error('No wallet found');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const poolContract = new ethers.Contract(
      POOL_CONTRACTS.COMPANY_POOL,
      COMPANY_POOL_ABI,
      provider
    );

    const poolIdBytes = ethers.keccak256(ethers.toUtf8Bytes(poolId));
    const pool = await poolContract.getPool(poolIdBytes);

    return {
      company: pool[0],
      courseName: pool[1],
      totalFund: ethers.formatEther(pool[2]),
      rewardPerStudent: ethers.formatEther(pool[3]),
      maxParticipants: Number(pool[4]),
      remainingBalance: ethers.formatEther(pool[5]),
      studentsRewarded: Number(pool[6]),
      active: pool[7],
    };
  } catch (error) {
    console.error('Failed to get pool from chain:', error);
    return null;
  }
}

/**
 * Check mUSD balance
 */
export async function getMUSDBalance(address: string): Promise<string> {
  if (typeof window.ethereum === 'undefined') {
    return '0';
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const musdContract = new ethers.Contract(POOL_CONTRACTS.MUSD, MUSD_ABI, provider);
    const balance = await musdContract.balanceOf(address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Failed to get mUSD balance:', error);
    return '0';
  }
}

