import { ethers } from 'ethers';

// Contract Addresses on Mezo Testnet
export const CONTRACTS = {
  MUSD: import.meta.env.VITE_MUSD_CONTRACT || '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503',
  REWARDS: import.meta.env.VITE_REWARDS_CONTRACT || '0x105982Df4Bf219244116A2e814B68A62f4802421',
};

// mUSD Token ABI (ERC20)
export const MUSD_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)',
];

// EduFund Rewards Contract ABI
export const REWARDS_ABI = [
  'function claimReward(bytes32 questId, uint256 amount, bytes signature)',
  'function hasClaimedReward(bytes32 questId, address user) view returns (bool)',
  'function getContractBalance() view returns (uint256)',
  'function totalRewardsDistributed() view returns (uint256)',
];

/**
 * Get mUSD balance for an address
 */
export async function getMUSDBalance(address: string): Promise<string> {
  if (typeof window.ethereum === 'undefined') {
    return '0';
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACTS.MUSD, MUSD_ABI, provider);
    const balance = await contract.balanceOf(address);
    const decimals = await contract.decimals();
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    console.error('Failed to fetch mUSD balance:', error);
    return '0';
  }
}

/**
 * Check if user has claimed a quest reward
 */
export async function hasClaimedReward(
  questId: string,
  userAddress: string
): Promise<boolean> {
  if (!CONTRACTS.REWARDS || typeof window.ethereum === 'undefined') {
    return false;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACTS.REWARDS, REWARDS_ABI, provider);
    const questIdBytes = ethers.keccak256(ethers.toUtf8Bytes(questId));
    return await contract.hasClaimedReward(questIdBytes, userAddress);
  } catch (error) {
    console.error('Failed to check claim status:', error);
    return false;
  }
}

/**
 * Claim reward from smart contract
 */
export async function claimRewardFromContract(
  questId: string,
  amount: number,
  signature: string
): Promise<string> {
  if (!CONTRACTS.REWARDS || typeof window.ethereum === 'undefined') {
    throw new Error('Rewards contract not deployed');
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACTS.REWARDS, REWARDS_ABI, signer);
    
    const questIdBytes = ethers.keccak256(ethers.toUtf8Bytes(questId));
    const amountWei = ethers.parseEther(amount.toString());
    
    const tx = await contract.claimReward(questIdBytes, amountWei, signature);
    await tx.wait();
    
    return tx.hash;
  } catch (error: any) {
    console.error('Failed to claim reward:', error);
    throw new Error(error.message || 'Transaction failed');
  }
}

