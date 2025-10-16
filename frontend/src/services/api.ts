import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Quest {
  id: string;
  title: string;
  description: string;
  reward: number;
  difficulty: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  poolStatus?: {
    hasPool: boolean;
    companyName?: string;
    isFull?: boolean;
    isOutOfFunds?: boolean;
    remainingSlots?: number;
    remainingBalance?: number;
  };
  fundingPools?: any[];
}

export interface CompletedQuest {
  id: string;
  userId: string;
  questId: string;
  completedAt: string;
  rewardClaimed: boolean;
  quest: Quest;
}

export interface Reward {
  id: string;
  wallet: string;
  questId: string;
  amount: number;
  txHash: string | null;
  claimedAt: string;
  createdAt: string;
}

export interface RewardsResponse {
  rewards: Reward[];
  totalClaimed: number;
  count: number;
}

export interface UserProfile {
  id?: string;
  walletAddress: string;
  completedQuests: CompletedQuest[];
  totalRewards: number;
  createdAt?: string;
}

export const questApi = {
  // Get all quests
  getQuests: async (): Promise<Quest[]> => {
    const response = await api.get('/quests');
    return response.data;
  },

  // Create a new quest
  createQuest: async (questData: Omit<Quest, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quest> => {
    const response = await api.post('/quests', questData);
    return response.data;
  },

  // Complete a quest
  completeQuest: async (questId: string, walletAddress: string) => {
    const response = await api.post(`/quests/${questId}/complete`, { walletAddress });
    return response.data;
  },

  // Get user profile
  getUserProfile: async (walletAddress: string): Promise<UserProfile> => {
    const response = await api.get(`/users/${walletAddress}`);
    return response.data;
  },
};

export const rewardApi = {
  // Claim reward for a completed quest
  claimReward: async (walletAddress: string, questId: string, txHash?: string) => {
    const response = await api.post('/rewards/claim', {
      walletAddress,
      questId,
      txHash,
    });
    return response.data;
  },

  // Get all rewards for a wallet
  getRewards: async (wallet: string): Promise<RewardsResponse> => {
    const response = await api.get(`/rewards/${wallet}`);
    return response.data;
  },
};

export default api;


