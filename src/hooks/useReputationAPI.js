/**
 * React Query Hooks for Reputation Operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reputationService } from '../services/reputationService';
import { QUERY_KEYS, CACHE_CONFIG } from '../config/api';
import toast from 'react-hot-toast';

/**
 * Hook to fetch reputation by address
 * @param {string} address - Wallet address
 * @returns {Object} Query result with reputation data
 */
export const useReputation = (address) => {
  return useQuery({
    queryKey: QUERY_KEYS.reputation.byAddress(address),
    queryFn: () => reputationService.getReputationByAddress(address),
    enabled: !!address,
    staleTime: CACHE_CONFIG.staleTime.reputation,
  });
};

/**
 * Hook to fetch ratings by job
 * @param {number} jobId - Job ID
 * @returns {Object} Query result with ratings data
 */
export const useJobRatings = (jobId) => {
  return useQuery({
    queryKey: QUERY_KEYS.reputation.byJob(jobId),
    queryFn: () => reputationService.getRatingsByJob(jobId),
    enabled: !!jobId,
    staleTime: CACHE_CONFIG.staleTime.reputation,
  });
};

/**
 * Hook to fetch reputation leaderboard
 * @param {Object} params - Filter parameters
 * @returns {Object} Query result with leaderboard data
 */
export const useLeaderboard = (params = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.reputation.leaderboard,
    queryFn: () => reputationService.getLeaderboard(params),
    staleTime: CACHE_CONFIG.staleTime.reputation,
  });
};

/**
 * Hook to submit rating
 * @returns {Object} Mutation object
 */
export const useSubmitRating = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data) => reputationService.submitRating(data),
    onSuccess: (data) => {
      // Invalidate reputation caches
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.reputation.all });
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.reputation.byAddress(data.targetAddress) 
      });
      toast.success('Rating submitted successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit rating');
    },
  });
};
