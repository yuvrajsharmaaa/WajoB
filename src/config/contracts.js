import { Address } from '@ton/core';

// Network configuration
export const NETWORK = {
  // Use 'testnet' for development, 'mainnet' for production
  current: 'testnet',
  
  testnet: {
    name: 'Testnet',
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    explorerUrl: 'https://testnet.tonscan.org',
  },
  
  mainnet: {
    name: 'Mainnet',
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    explorerUrl: 'https://tonscan.org',
  }
};

// Contract addresses (will be updated after deployment)
export const CONTRACTS = {
  testnet: {
    // Deploy these contracts using: npx blueprint run deployDeployX --testnet
    // Then update these addresses
    jobRegistry: null, // Update after: npx blueprint run deployDeployJobRegistry --testnet
    escrow: null,      // Update after: npx blueprint run deployDeployEscrow --testnet
    reputation: null,  // Update after: npx blueprint run deployDeployReputation --testnet
  },
  
  mainnet: {
    // Only deploy to mainnet after thorough testnet testing
    jobRegistry: null,
    escrow: null,
    reputation: null,
  }
};

// Get current network config
export const getCurrentNetwork = () => {
  return NETWORK[NETWORK.current];
};

// Get current contract addresses
export const getContractAddresses = () => {
  const network = NETWORK.current;
  const contracts = CONTRACTS[network];
  
  return {
    jobRegistry: contracts.jobRegistry ? Address.parse(contracts.jobRegistry) : null,
    escrow: contracts.escrow ? Address.parse(contracts.escrow) : null,
    reputation: contracts.reputation ? Address.parse(contracts.reputation) : null,
  };
};

// Helper to check if contracts are deployed
export const areContractsDeployed = () => {
  const contracts = CONTRACTS[NETWORK.current];
  return !!(contracts.jobRegistry && contracts.escrow && contracts.reputation);
};

// Helper to get explorer URL for an address
export const getExplorerUrl = (address) => {
  const network = getCurrentNetwork();
  return `${network.explorerUrl}/address/${address}`;
};

// Helper to get explorer URL for a transaction
export const getTransactionUrl = (hash) => {
  const network = getCurrentNetwork();
  return `${network.explorerUrl}/tx/${hash}`;
};
