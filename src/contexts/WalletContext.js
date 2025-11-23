import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTonWallet } from '../hooks/useTonWallet';
import toast from 'react-hot-toast';

const WalletContext = createContext(null);

export const WalletProvider = ({ children }) => {
  const walletHook = useTonWallet();
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [error, setError] = useState(null);

  useEffect(() => {
    if (walletHook.connected && walletHook.address) {
      setConnectionStatus('connected');
      setError(null);
    } else if (walletHook.connected && !walletHook.address) {
      setConnectionStatus('connecting');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [walletHook.connected, walletHook.address]);

  const connectWallet = async () => {
    try {
      setConnectionStatus('connecting');
      setError(null);
      await walletHook.connect();
      toast.success('Wallet connected successfully!');
    } catch (err) {
      setConnectionStatus('error');
      setError(err.message || 'Failed to connect wallet');
      toast.error(err.message || 'Failed to connect wallet');
      throw err;
    }
  };

  const disconnectWallet = async () => {
    try {
      await walletHook.disconnect();
      setConnectionStatus('disconnected');
      setError(null);
      toast.success('Wallet disconnected');
    } catch (err) {
      setError(err.message || 'Failed to disconnect wallet');
      toast.error(err.message || 'Failed to disconnect wallet');
      throw err;
    }
  };

  const value = {
    ...walletHook,
    connectionStatus,
    error,
    connect: connectWallet,
    disconnect: disconnectWallet,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWalletContext = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within WalletProvider');
  }
  return context;
};
