import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, sepolia } from 'wagmi/chains';
import { defineChain } from 'viem';

// Define Mezo Testnet as a custom chain
// Official Mezo Testnet Network Details
export const mezoTestnet = defineChain({
  id: 31611, // Mezo Testnet Chain ID
  name: 'Mezo Testnet',
  nativeCurrency: {
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.test.mezo.org'],
      webSocket: ['wss://rpc-ws.test.mezo.org'],
    },
    public: {
      http: ['https://rpc.test.mezo.org'],
      webSocket: ['wss://rpc-ws.test.mezo.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Mezo Testnet Explorer',
      url: 'https://explorer.test.mezo.org',
    },
  },
  testnet: true,
});

export const config = getDefaultConfig({
  appName: 'EduFund',
  projectId: 'YOUR_PROJECT_ID', // Get from https://cloud.walletconnect.com/
  chains: [mainnet, sepolia, mezoTestnet], // Added Mezo!
  ssr: false,
});


