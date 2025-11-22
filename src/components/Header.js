import React from 'react';
import { useTonWallet } from '../hooks/useTonWallet';
import { TonConnectButton } from '@tonconnect/ui-react';

const Header = () => {
  const { wallet, connected } = useTonWallet();

  return (
    <header className="bg-ton-blue text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold">WajoB</h1>
          <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
            Daily Wage Jobs
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          {connected && wallet && (
            <div className="text-sm">
              <p className="text-xs opacity-75">Connected</p>
              <p className="font-mono text-xs">
                {wallet.account.address.slice(0, 6)}...{wallet.account.address.slice(-4)}
              </p>
            </div>
          )}
          <TonConnectButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
