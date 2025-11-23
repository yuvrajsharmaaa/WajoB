/**
 * Job Service - API calls for job-related operations
 */

import apiClient from '../utils/api';
import { API_ENDPOINTS } from '../config/api';

export const jobService = {
  /**
   * Get paginated list of jobs with filters
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (1-based)
   * @param {number} params.limit - Items per page
   * @param {string} params.status - Job status filter (POSTED, ASSIGNED, COMPLETED, CANCELLED)
   * @param {string} params.category - Category filter
   * @param {string} params.search - Search query
   * @returns {Promise<{jobs: Array, total: number, page: number, totalPages: number}>}
   */
  async getJobs(params = {}) {
    const { page = 1, limit = 20, status, category, search } = params;
    
    const queryParams = new URLSearchParams({
      page,
      limit,
      ...(status && { status }),
      ...(category && { category }),
      ...(search && { search }),
    });
    
    return apiClient.get(`${API_ENDPOINTS.jobs.list}?${queryParams}`);
  },

  /**
   * Get job by ID
   * @param {number} jobId - Job ID
   * @returns {Promise<Object>} Job details
   */
  async getJobById(jobId) {
    return apiClient.get(API_ENDPOINTS.jobs.getById(jobId));
  },

  /**
   * Create new job (will trigger blockchain transaction)
   * @param {Object} jobData - Job data
   * @param {string} jobData.title - Job title
   * @param {string} jobData.description - Job description
   * @param {string} jobData.wages - Wages in TON
   * @param {number} jobData.duration - Duration in hours
   * @param {string} jobData.category - Job category
   * @param {string} jobData.location - Job location
   * @param {string} jobData.txHash - Blockchain transaction hash
   * @returns {Promise<Object>} Created job
   */
  async createJob(jobData) {
    return apiClient.post(API_ENDPOINTS.jobs.create, jobData);
  },

  /**
   * Accept job (worker accepts a job)
   * @param {number} jobId - Job ID
   * @param {Object} data - Acceptance data
   * @param {string} data.workerAddress - Worker's TON address
   * @param {string} data.txHash - Blockchain transaction hash
   * @returns {Promise<Object>} Updated job
   */
  async acceptJob(jobId, data) {
    return apiClient.post(API_ENDPOINTS.jobs.accept(jobId), data);
  },

  /**
   * Complete job (employer marks job as completed)
   * @param {number} jobId - Job ID
   * @param {Object} data - Completion data
   * @param {string} data.txHash - Blockchain transaction hash
   * @returns {Promise<Object>} Updated job
   */
  async completeJob(jobId, data) {
    return apiClient.post(API_ENDPOINTS.jobs.complete(jobId), data);
  },

  /**
   * Cancel job
   * @param {number} jobId - Job ID
   * @param {Object} data - Cancellation data
   * @param {string} data.reason - Cancellation reason
   * @param {string} data.txHash - Blockchain transaction hash
   * @returns {Promise<Object>} Updated job
   */
  async cancelJob(jobId, data) {
    return apiClient.post(API_ENDPOINTS.jobs.cancel(jobId), data);
  },

  /**
   * Get job statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStats() {
    return apiClient.get(API_ENDPOINTS.jobs.stats);
  },
};
