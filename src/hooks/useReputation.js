import { useState, useCallback } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Address, beginCell, toNano } from '@ton/core';
import { getContractAddresses } from '../config/contracts';

/**
 * Hook for interacting with Reputation smart contract
 * Handles rating submission and reputation queries
 */
export const useReputation = () => {
  const [tonConnectUI] = useTonConnectUI();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const contracts = getContractAddresses();

  /**
   * Submit rating for a user after job completion
   * @param {Object} ratingData
   * @param {number} ratingData.jobId - Job ID
   * @param {string} ratingData.targetUser - Address of user being rated
   * @param {number} ratingData.rating - Rating (1-5)
   */
  const submitRating = useCallback(async (ratingData) => {
    if (!tonConnectUI.connected) {
      throw new Error('Wallet not connected');
    }

    if (!contracts.reputation) {
      throw new Error('Reputation contract not deployed');
    }

    if (ratingData.rating < 1 || ratingData.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    setLoading(true);
    setError(null);

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: contracts.reputation.toString(),
            amount: toNano('0.02').toString(),
            payload: beginCell()
              .storeUint(0x9e6f2a84, 32) // op::submit_rating
              .storeUint(0, 64) // query_id
              .storeUint(ratingData.jobId, 64)
              .storeAddress(Address.parse(ratingData.targetUser))
              .storeUint(ratingData.rating, 8)
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
      setError(err.message || 'Failed to submit rating');
      setLoading(false);
      throw err;
    }
  }, [tonConnectUI, contracts.reputation]);

  return {
    submitRating,
    loading,
    error,
  };
};
