import { useTonConnectUI } from '@tonconnect/ui-react';
import { useMemo } from 'react';
import { Address } from '@ton/core';

export const useTonWallet = () => {
  const [tonConnectUI] = useTonConnectUI();
  
  const wallet = tonConnectUI.wallet;
  const connected = tonConnectUI.connected;

  // Extract and format wallet address
  const address = useMemo(() => {
    if (!wallet?.account?.address) return null;
    
    try {
      // Parse and format the address
      const addr = Address.parse(wallet.account.address);
      return addr.toString();
    } catch (error) {
      console.error('Failed to parse wallet address:', error);
      return wallet.account.address;
    }
  }, [wallet?.account?.address]);

  // Get user-friendly address (shortened)
  const shortAddress = useMemo(() => {
    if (!address) return null;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address]);

  const connect = async () => {
    try {
      await tonConnectUI.openModal();
      return true;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw new Error('Failed to connect wallet. Please try again.');
    }
  };

  const disconnect = async () => {
    try {
      await tonConnectUI.disconnect();
      return true;
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      throw new Error('Failed to disconnect wallet. Please try again.');
    }
  };

  // Check if wallet is ready for transactions
  const isReady = connected && !!address;

  return {
    wallet,
    connected,
    address,
    shortAddress,
    isReady,
    connect,
    disconnect,
  };
};
