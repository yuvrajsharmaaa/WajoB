import { useState, useCallback } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address, beginCell, toNano } from '@ton/core';
import { getContractAddresses } from '../config/contracts';

/**
 * Hook for interacting with Escrow smart contract
 * Handles escrow creation, funding, locking, and releasing
 */
export const useEscrow = () => {
  const [tonConnectUI] = useTonConnectUI();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contracts = getContractAddresses();

  /**
   * Create escrow for a job
   * @param {Object} escrowData
   * @param {number} escrowData.jobId - Job ID from JobRegistry
   * @param {string} escrowData.employer - Employer address
   * @param {string} escrowData.worker - Worker address
   * @param {string} escrowData.amount - Amount in TON
   */
  const createEscrow = useCallback(async (escrowData) => {
    if (!tonConnectUI.connected) {
      throw new Error('Wallet not connected');
    }

    if (!contracts.escrow) {
      throw new Error('Escrow contract not deployed');
    }

    setLoading(true);
    setError(null);

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: contracts.escrow.toString(),
            amount: toNano('0.05').toString(),
            payload: beginCell()
              .storeUint(0x8f4a33db, 32) // op::create_escrow
              .storeUint(0, 64) // query_id
              .storeUint(escrowData.jobId, 64)
              .storeAddress(Address.parse(escrowData.employer))
              .storeAddress(Address.parse(escrowData.worker))
              .storeCoins(toNano(escrowData.amount))
              .endCell()
              .toBoc()
              .toString('base64'),
          },
        ],
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to create escrow');
      setLoading(false);
      throw err;
    }
  }, [tonConnectUI, contracts.escrow]);

  /**
   * Fund escrow (employer deposits TON)
   * @param {number} escrowId - Escrow ID
   * @param {string} amount - Amount to deposit in TON
   */
  const fundEscrow = useCallback(async (escrowId, amount) => {
    if (!tonConnectUI.connected) {
      throw new Error('Wallet not connected');
    }

    if (!contracts.escrow) {
      throw new Error('Escrow contract not deployed');
    }

    setLoading(true);
    setError(null);

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: contracts.escrow.toString(),
            amount: toNano(amount).toString(), // Amount + gas
            payload: beginCell()
              .storeUint(0x2fcb26a8, 32) // op::fund
              .storeUint(0, 64) // query_id
              .storeUint(escrowId, 64)
              .endCell()
              .toBoc()
              .toString('base64'),
          },
        ],
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to fund escrow');
      setLoading(false);
      throw err;
    }
  }, [tonConnectUI, contracts.escrow]);

  /**
   * Lock escrow (worker accepts job)
   * @param {number} escrowId - Escrow ID
   */
  const lockEscrow = useCallback(async (escrowId) => {
    if (!tonConnectUI.connected) {
      throw new Error('Wallet not connected');
    }

    if (!contracts.escrow) {
      throw new Error('Escrow contract not deployed');
    }

    setLoading(true);
    setError(null);

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: contracts.escrow.toString(),
            amount: toNano('0.02').toString(),
            payload: beginCell()
              .storeUint(0x5de7c0ab, 32) // op::lock
              .storeUint(0, 64) // query_id
              .storeUint(escrowId, 64)
              .endCell()
              .toBoc()
              .toString('base64'),
          },
        ],
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to lock escrow');
      setLoading(false);
      throw err;
    }
  }, [tonConnectUI, contracts.escrow]);

  /**
   * Confirm job completion (both parties must call)
   * @param {number} escrowId - Escrow ID
   */
  const confirmCompletion = useCallback(async (escrowId) => {
    if (!tonConnectUI.connected) {
      throw new Error('Wallet not connected');
    }

    if (!contracts.escrow) {
      throw new Error('Escrow contract not deployed');
    }

    setLoading(true);
    setError(null);

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: contracts.escrow.toString(),
            amount: toNano('0.02').toString(),
            payload: beginCell()
              .storeUint(0x6a8d4f12, 32) // op::confirm
              .storeUint(0, 64) // query_id
              .storeUint(escrowId, 64)
              .endCell()
              .toBoc()
              .toString('base64'),
          },
        ],
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to confirm completion');
      setLoading(false);
      throw err;
    }
  }, [tonConnectUI, contracts.escrow]);

  /**
   * Raise dispute
   * @param {number} escrowId - Escrow ID
   */
  const raiseDispute = useCallback(async (escrowId) => {
    if (!tonConnectUI.connected) {
      throw new Error('Wallet not connected');
    }

    if (!contracts.escrow) {
      throw new Error('Escrow contract not deployed');
    }

    setLoading(true);
    setError(null);

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: contracts.escrow.toString(),
            amount: toNano('0.02').toString(),
            payload: beginCell()
              .storeUint(0x7b3e5c91, 32) // op::dispute
              .storeUint(0, 64) // query_id
              .storeUint(escrowId, 64)
              .endCell()
              .toBoc()
              .toString('base64'),
          },
        ],
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to raise dispute');
      setLoading(false);
      throw err;
    }
  }, [tonConnectUI, contracts.escrow]);

  return {
    createEscrow,
    fundEscrow,
    lockEscrow,
    confirmCompletion,
    raiseDispute,
    loading,
    error,
  };
};
