import { useTonConnectUI } from '@tonconnect/ui-react';

export const useTonWallet = () => {
  const [tonConnectUI] = useTonConnectUI();
  
  const wallet = tonConnectUI.wallet;
  const connected = tonConnectUI.connected;

  const connect = async () => {
    try {
      await tonConnectUI.openModal();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnect = async () => {
    try {
      await tonConnectUI.disconnect();
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
    }
  };

  return {
    wallet,
    connected,
    connect,
    disconnect,
  };
};
