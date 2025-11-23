/**
 * React Query Hooks for Job Operations
 * Provides data fetching and caching for job-related data
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobService } from '../services/jobService';
import { QUERY_KEYS, CACHE_CONFIG } from '../config/api';
import toast from 'react-hot-toast';

/**
 * Hook to fetch paginated jobs list
 * @param {Object} filters - Filter parameters
 * @returns {Object} Query result with jobs data
 */
export const useJobs = (filters = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.jobs.list(filters),
    queryFn: () => jobService.getJobs(filters),
    staleTime: CACHE_CONFIG.staleTime.jobs,
    retry: 2,
  });
};

/**
 * Hook to fetch single job by ID
 * @param {number} jobId - Job ID
 * @returns {Object} Query result with job data
 */
export const useJob = (jobId) => {
  return useQuery({
    queryKey: QUERY_KEYS.jobs.detail(jobId),
    queryFn: () => jobService.getJobById(jobId),
    enabled: !!jobId,
    staleTime: CACHE_CONFIG.staleTime.jobs,
  });
};

/**
 * Hook to fetch job statistics
 * @returns {Object} Query result with stats data
 */
export const useJobStats = () => {
  return useQuery({
    queryKey: QUERY_KEYS.jobs.stats,
    queryFn: () => jobService.getStats(),
    staleTime: CACHE_CONFIG.staleTime.jobs * 2, // Cache longer
  });
};

/**
 * Hook to create new job
 * @returns {Object} Mutation object
 */
export const useCreateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (jobData) => jobService.createJob(jobData),
    onSuccess: () => {
      // Invalidate and refetch jobs list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs.all });
      toast.success('Job created successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create job');
    },
  });
};

/**
 * Hook to accept a job
 * @returns {Object} Mutation object
 */
export const useAcceptJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, data }) => jobService.acceptJob(jobId, data),
    onSuccess: (data, variables) => {
      // Update job detail cache
      queryClient.setQueryData(
        QUERY_KEYS.jobs.detail(variables.jobId),
        data
      );
      // Invalidate jobs list
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs.all });
      toast.success('Job accepted successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to accept job');
    },
  });
};

/**
 * Hook to complete a job
 * @returns {Object} Mutation object
 */
export const useCompleteJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, data }) => jobService.completeJob(jobId, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        QUERY_KEYS.jobs.detail(variables.jobId),
        data
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs.all });
      toast.success('Job marked as completed!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to complete job');
    },
  });
};

/**
 * Hook to cancel a job
 * @returns {Object} Mutation object
 */
export const useCancelJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ jobId, data }) => jobService.cancelJob(jobId, data),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        QUERY_KEYS.jobs.detail(variables.jobId),
        data
      );
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobs.all });
      toast.success('Job cancelled successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to cancel job');
    },
  });
};
