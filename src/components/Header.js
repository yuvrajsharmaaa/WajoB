import React from 'react';
import { useWalletContext } from '../contexts/WalletContext';
import { TonConnectButton } from '@tonconnect/ui-react';

const Header = () => {
  const { connected, shortAddress, connectionStatus } = useWalletContext();

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
          {connected && shortAddress && (
            <div className="text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-400' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 
                  'bg-gray-400'
                }`} />
                <div>
                  <p className="text-xs opacity-75">
                    {connectionStatus === 'connecting' ? 'Connecting...' : 'Connected'}
                  </p>
                  <p className="font-mono text-xs">{shortAddress}</p>
                </div>
              </div>
            </div>
          )}
          <TonConnectButton />
        </div>
      </div>
    </header>
  );
};

export default Header;
