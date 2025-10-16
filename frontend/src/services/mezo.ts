import { ethers } from 'ethers';

// Mezo Network Configuration
// Documentation: https://mezo.org/docs/developers/getting-started
// 
// To get these values:
// 1. Visit Mezo Portal or Developer Docs
// 2. Find "Network Details" or "Add to MetaMask" section
// 3. Update the values below
// Official Mezo Testnet Configuration
export const MEZO_CONFIG = {
  // Mezo Testnet Configuration
  TESTNET_RPC: 'https://rpc.test.mezo.org',
  TESTNET_WSS: 'wss://rpc-ws.test.mezo.org',
  CHAIN_ID: 0x7B7B, // 31611 in hex
  CHAIN_ID_DECIMAL: 31611,
  
  // Mezo Mainnet Configuration (for future use)
  MAINNET_RPC: 'https://rpc.mezo.org', // Update when mainnet launches
  MAINNET_CHAIN_ID: 0x0000, // TBD
  
  // mUSD Token Contract
  MUSD_CONTRACT: '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503', // Official Mezo Testnet mUSD
  MUSD_DECIMALS: 18,
  
  // Block Explorer
  EXPLORER_URL: 'https://explorer.test.mezo.org',
  
  // Faucet (for testnet BTC)
  FAUCET_URL: 'https://faucet.test.mezo.org',
  
  // Network Name
  NETWORK_NAME: 'Mezo Testnet',
  
  // Native Currency (BTC on Mezo)
  NATIVE_CURRENCY: {
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 18, // Confirmed: Mezo uses 18 decimals for BTC
  },
};

// mUSD ERC20 ABI (standard ERC20)
const MUSD_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

/**
 * Mezo Service for interacting with Mezo blockchain and mUSD
 */
export class MezoService {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;

  /**
   * Initialize connection with user's wallet
   */
  async connect(): Promise<string> {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('No Ethereum wallet found. Please install MetaMask or similar wallet.');
    }

    try {
      this.provider = new ethers.BrowserProvider(window.ethereum);
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      this.signer = await this.provider.getSigner();
      const address = await this.signer.getAddress();
      
      // Try to switch to Mezo network (will add if not exists)
      await this.switchToMezoNetwork();
      
      return address;
    } catch (error: any) {
      console.error('Failed to connect to Mezo:', error);
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  /**
   * Switch to Mezo testnet network
   * This adds Mezo to MetaMask if not already added
   */
  private async switchToMezoNetwork() {
    if (!window.ethereum) return;

    const chainIdHex = typeof MEZO_CONFIG.CHAIN_ID === 'string' 
      ? MEZO_CONFIG.CHAIN_ID 
      : `0x${MEZO_CONFIG.CHAIN_ID.toString(16)}`;

    try {
      // Try to switch to Mezo network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch (switchError: any) {
      // Chain not added to MetaMask (error code 4902)
      if (switchError.code === 4902) {
        try {
          // Add Mezo network to MetaMask
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: MEZO_CONFIG.NETWORK_NAME,
                nativeCurrency: MEZO_CONFIG.NATIVE_CURRENCY,
                rpcUrls: [MEZO_CONFIG.TESTNET_RPC],
                blockExplorerUrls: [MEZO_CONFIG.EXPLORER_URL],
              },
            ],
          });
          console.log('✅ Mezo network added to MetaMask');
        } catch (addError) {
          console.error('❌ Failed to add Mezo network:', addError);
          throw new Error('Failed to add Mezo network to wallet');
        }
      } else {
        throw switchError;
      }
    }
  }

  /**
   * Get mUSD balance for an address
   */
  async getMUSDBalance(address: string): Promise<string> {
    try {
      if (!this.provider) {
        // Use public provider if not connected
        this.provider = new ethers.JsonRpcProvider(MEZO_CONFIG.TESTNET_RPC);
      }

      const contract = new ethers.Contract(
        MEZO_CONFIG.MUSD_CONTRACT,
        MUSD_ABI,
        this.provider
      );

      const balance = await contract.balanceOf(address);
      const formatted = ethers.formatUnits(balance, MEZO_CONFIG.MUSD_DECIMALS);
      
      return formatted;
    } catch (error) {
      console.error('Failed to fetch mUSD balance:', error);
      // Return mock balance for testnet if contract not deployed
      return '0.00';
    }
  }

  /**
   * Send mUSD to an address (for reward claims)
   * In production, this would be handled by a backend with a treasury wallet
   * For now, this simulates the transaction
   */
  async sendMUSD(to: string, amount: number): Promise<string> {
    try {
      if (!this.signer) {
        throw new Error('No signer available. Please connect wallet first.');
      }

      // For testnet/demo: create a mock transaction hash
      // In production, this would be a real contract interaction
      const mockTxHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
      
      console.log(`[Mezo] Simulating mUSD transfer:`, {
        to,
        amount,
        txHash: mockTxHash
      });

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In production, uncomment this for real transaction:
      /*
      const contract = new ethers.Contract(
        MEZO_CONFIG.MUSD_CONTRACT,
        MUSD_ABI,
        this.signer
      );
      
      const amountWei = ethers.parseUnits(amount.toString(), MEZO_CONFIG.MUSD_DECIMALS);
      const tx = await contract.transfer(to, amountWei);
      await tx.wait();
      return tx.hash;
      */

      return mockTxHash;
    } catch (error: any) {
      console.error('Failed to send mUSD:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Get current connected address
   */
  async getCurrentAddress(): Promise<string | null> {
    if (!this.signer) return null;
    try {
      return await this.signer.getAddress();
    } catch {
      return null;
    }
  }

  /**
   * Check if wallet is connected to Mezo network
   */
  async isConnected(): Promise<boolean> {
    if (!window.ethereum) return false;
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const currentChainId = parseInt(chainId, 16);
      const mezoChainId = typeof MEZO_CONFIG.CHAIN_ID === 'string'
        ? parseInt(MEZO_CONFIG.CHAIN_ID, 16)
        : MEZO_CONFIG.CHAIN_ID;
      
      return currentChainId === mezoChainId || currentChainId === MEZO_CONFIG.CHAIN_ID_DECIMAL;
    } catch {
      return false;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect() {
    this.provider = null;
    this.signer = null;
  }
}

// Singleton instance
export const mezoService = new MezoService();

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
  }
}

