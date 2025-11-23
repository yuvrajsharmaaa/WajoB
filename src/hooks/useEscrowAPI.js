/**
 * React Query Hooks for Escrow Operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { escrowService } from '../services/escrowService';
import { QUERY_KEYS, CACHE_CONFIG } from '../config/api';
import toast from 'react-hot-toast';

/**
 * Hook to fetch escrow by job ID
 * @param {number} jobId - Job ID
 * @returns {Object} Query result with escrow data
 */
export const useEscrowByJob = (jobId) => {
  return useQuery({
    queryKey: QUERY_KEYS.escrow.byJob(jobId),
    queryFn: () => escrowService.getEscrowByJob(jobId),
    enabled: !!jobId,
    staleTime: CACHE_CONFIG.staleTime.escrow,
    refetchInterval: CACHE_CONFIG.refetchInterval.escrow,
  });
};

/**
 * Hook to fetch escrow by ID
 * @param {number} escrowId - Escrow ID
 * @returns {Object} Query result with escrow data
 */
export const useEscrowById = (escrowId) => {
  return useQuery({
    queryKey: QUERY_KEYS.escrow.detail(escrowId),
    queryFn: () => escrowService.getEscrowById(escrowId),
    enabled: !!escrowId,
    staleTime: CACHE_CONFIG.staleTime.escrow,
    refetchInterval: CACHE_CONFIG.refetchInterval.escrow,
  });
};

/**
 * Hook to fund escrow
 * @returns {Object} Mutation object
 */
export const useFundEscrow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ escrowId, data }) => escrowService.fundEscrow(escrowId, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        QUERY_KEYS.escrow.detail(variables.escrowId),
        data
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.escrow.all });
      toast.success('Escrow funded successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to fund escrow');
    },
  });
};

/**
 * Hook to release escrow
 * @returns {Object} Mutation object
 */
export const useReleaseEscrow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ escrowId, data }) => escrowService.releaseEscrow(escrowId, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        QUERY_KEYS.escrow.detail(variables.escrowId),
        data
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.escrow.all });
      toast.success('Funds released successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to release escrow');
    },
  });
};

/**
 * Hook to initiate dispute
 * @returns {Object} Mutation object
 */
export const useDisputeEscrow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ escrowId, data }) => escrowService.disputeEscrow(escrowId, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        QUERY_KEYS.escrow.detail(variables.escrowId),
        data
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.escrow.all });
      toast.success('Dispute initiated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to initiate dispute');
    },
  });
};
