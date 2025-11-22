import React from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { NETWORK } from '../config/contracts';

const manifestUrl = 'https://raw.githubusercontent.com/yuvrajsharmaaa/WajoB/main/public/tonconnect-manifest.json';

export const TonConnectProvider = ({ children }) => {
  // Configure wallet options for testnet
  const walletOptions = {
    network: NETWORK.current === 'testnet' ? 'testnet' : undefined,
  };

  return (
    <TonConnectUIProvider 
      manifestUrl={manifestUrl}
      walletsListConfiguration={walletOptions}
    >
      {children}
    </TonConnectUIProvider>
  );
};
