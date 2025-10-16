import { useState, useEffect, useCallback } from 'react';
import { mezoService } from '../services/mezo';

export function useMezo() {
  const [mezoAddress, setMezoAddress] = useState<string | null>(null);
  const [mezoBalance, setMezoBalance] = useState<string>('0.00');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await mezoService.isConnected();
      if (connected) {
        const address = await mezoService.getCurrentAddress();
        if (address) {
          setMezoAddress(address);
          setIsConnected(true);
          loadBalance(address);
        }
      }
    };
    checkConnection();
  }, []);

  // Load balance for an address
  const loadBalance = useCallback(async (address: string) => {
    try {
      const balance = await mezoService.getMUSDBalance(address);
      setMezoBalance(balance);
    } catch (err) {
      console.error('Failed to load balance:', err);
      setMezoBalance('0.00');
    }
  }, []);

  // Connect to Mezo
  const connectMezo = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const address = await mezoService.connect();
      setMezoAddress(address);
      setIsConnected(true);
      await loadBalance(address);
      return address;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, [loadBalance]);

  // Disconnect from Mezo
  const disconnectMezo = useCallback(() => {
    mezoService.disconnect();
    setMezoAddress(null);
    setMezoBalance('0.00');
    setIsConnected(false);
    setError(null);
  }, []);

  // Send mUSD
  const sendMUSD = useCallback(async (to: string, amount: number) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }
    return await mezoService.sendMUSD(to, amount);
  }, [isConnected]);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (mezoAddress) {
      await loadBalance(mezoAddress);
    }
  }, [mezoAddress, loadBalance]);

  return {
    mezoAddress,
    mezoBalance,
    isConnecting,
    isConnected,
    error,
    connectMezo,
    disconnectMezo,
    sendMUSD,
    refreshBalance,
  };
}


