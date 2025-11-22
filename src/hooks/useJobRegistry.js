import { useState, useCallback } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address, beginCell, toNano } from '@ton/core';
import { getContractAddresses } from '../config/contracts';

/**
 * Hook for interacting with JobRegistry smart contract
 * Handles job creation, status updates, and worker assignment
 */
export const useJobRegistry = () => {
  const [tonConnectUI] = useTonConnectUI();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contracts = getContractAddresses();

  /**
   * Create a new job on the blockchain
   * @param {Object} jobData - Job details
   * @param {string} jobData.title - Job title
   * @param {string} jobData.description - Job description
   * @param {string} jobData.location - Job location
   * @param {string} jobData.wages - Wages in TON
   * @param {string} jobData.duration - Duration in hours
   * @param {string} jobData.category - Job category
   */
  const createJob = useCallback(async (jobData) => {
    if (!tonConnectUI.connected) {
      throw new Error('Wallet not connected');
    }

    if (!contracts.jobRegistry) {
      throw new Error('JobRegistry contract not deployed. Please deploy contracts first.');
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare metadata cell
      const metadata = beginCell()
        .storeStringTail(jobData.title)
        .storeRef(
          beginCell()
            .storeStringTail(jobData.description)
            .storeRef(
              beginCell()
                .storeStringTail(jobData.location)
                .storeStringTail(jobData.category)
                .storeUint(parseInt(jobData.duration), 32)
                .endCell()
            )
            .endCell()
        )
        .endCell();

      // Prepare transaction
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360, // 6 minutes
        messages: [
          {
            address: contracts.jobRegistry.toString(),
            amount: toNano('0.05').toString(), // Gas fee
            payload: beginCell()
              .storeUint(0x7362d09c, 32) // op::create_job
              .storeUint(0, 64) // query_id
              .storeCoins(toNano(jobData.wages))
              .storeRef(metadata)
              .endCell()
              .toBoc()
              .toString('base64'),
          },
        ],
      };

      // Send transaction
      const result = await tonConnectUI.sendTransaction(transaction);
      
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to create job');
      setLoading(false);
      throw err;
    }
  }, [tonConnectUI, contracts.jobRegistry]);

  /**
   * Update job status
   * @param {number} jobId - Job ID
   * @param {number} newStatus - New status (0-5)
   */
  const updateJobStatus = useCallback(async (jobId, newStatus) => {
    if (!tonConnectUI.connected) {
      throw new Error('Wallet not connected');
    }

    if (!contracts.jobRegistry) {
      throw new Error('JobRegistry contract not deployed');
    }

    setLoading(true);
    setError(null);

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: contracts.jobRegistry.toString(),
            amount: toNano('0.02').toString(),
            payload: beginCell()
              .storeUint(0x5fcc3d14, 32) // op::update_status
              .storeUint(0, 64) // query_id
              .storeUint(jobId, 64)
              .storeUint(newStatus, 8)
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
      setError(err.message || 'Failed to update job status');
      setLoading(false);
      throw err;
    }
  }, [tonConnectUI, contracts.jobRegistry]);

  /**
   * Assign worker to job
   * @param {number} jobId - Job ID
   * @param {string} workerAddress - Worker's TON address
   */
  const assignWorker = useCallback(async (jobId, workerAddress) => {
    if (!tonConnectUI.connected) {
      throw new Error('Wallet not connected');
    }

    if (!contracts.jobRegistry) {
      throw new Error('JobRegistry contract not deployed');
    }

    setLoading(true);
    setError(null);

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: contracts.jobRegistry.toString(),
            amount: toNano('0.02').toString(),
            payload: beginCell()
              .storeUint(0x235caf52, 32) // op::assign_worker
              .storeUint(0, 64) // query_id
              .storeUint(jobId, 64)
              .storeAddress(Address.parse(workerAddress))
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
      setError(err.message || 'Failed to assign worker');
      setLoading(false);
      throw err;
    }
  }, [tonConnectUI, contracts.jobRegistry]);

  return {
    createJob,
    updateJobStatus,
    assignWorker,
    loading,
    error,
  };
};
