import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface Company {
  id: string;
  name: string;
  email: string;
  walletAddress: string;
}

export interface FundingPool {
  id: string;
  companyId: string;
  courseName: string;
  totalFund: number;
  rewardPerStudent: number;
  maxParticipants: number;
  remainingBalance: number;
  contractAddress: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    rewards: number;
  };
}

export interface PoolDetails extends FundingPool {
  company: {
    name: string;
    email: string;
    walletAddress: string;
  };
  rewards: Array<{
    id: string;
    wallet: string;
    amount: number;
    txHash: string | null;
    claimedAt: string;
  }>;
}

export const companyApi = {
  // Register new company
  register: async (data: {
    name: string;
    email: string;
    walletAddress: string;
    password: string;
  }) => {
    const response = await axios.post(`${API_URL}/company/register`, data);
    return response.data;
  },

  // Login
  login: async (email: string, password: string) => {
    const response = await axios.post(`${API_URL}/company/login`, { email, password });
    return response.data;
  },

  // Create funding pool
  createPool: async (
    data: {
      courseName: string;
      totalFund: number;
      rewardPerStudent: number;
      maxParticipants: number;
    },
    token: string
  ) => {
    const response = await axios.post(`${API_URL}/pools/create`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get all pools for company
  getPools: async (token: string): Promise<{ pools: FundingPool[] }> => {
    const response = await axios.get(`${API_URL}/pools/list`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Get pool details
  getPoolDetails: async (poolId: string, token: string): Promise<{ pool: PoolDetails }> => {
    const response = await axios.get(`${API_URL}/pools/${poolId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // Delete/close a pool
  deletePool: async (poolId: string, token: string) => {
    const response = await axios.delete(`${API_URL}/pools/${poolId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

