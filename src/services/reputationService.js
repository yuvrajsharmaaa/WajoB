/**
 * Reputation Service - API calls for reputation-related operations
 */

import apiClient from '../utils/api';
import { API_ENDPOINTS } from '../config/api';

export const reputationService = {
  /**
   * Get reputation by wallet address
   * @param {string} address - TON wallet address
   * @returns {Promise<Object>} Reputation data
   */
  async getReputationByAddress(address) {
    return apiClient.get(API_ENDPOINTS.reputation.getByAddress(address));
  },

  /**
   * Submit rating for a job
   * @param {Object} data - Rating data
   * @param {number} data.jobId - Job ID
   * @param {string} data.targetAddress - Address being rated
   * @param {number} data.rating - Rating (1-5)
   * @param {string} data.comment - Optional comment
   * @param {string} data.txHash - Blockchain transaction hash
   * @returns {Promise<Object>} Submitted rating
   */
  async submitRating(data) {
    return apiClient.post(API_ENDPOINTS.reputation.submit, data);
  },

  /**
   * Get ratings for a specific job
   * @param {number} jobId - Job ID
   * @returns {Promise<Array>} Ratings for the job
   */
  async getRatingsByJob(jobId) {
    return apiClient.get(API_ENDPOINTS.reputation.getByJob(jobId));
  },

  /**
   * Get reputation leaderboard
   * @param {Object} params - Query parameters
   * @param {number} params.limit - Number of results
   * @param {string} params.role - Filter by role (employer/worker)
   * @returns {Promise<Array>} Leaderboard data
   */
  async getLeaderboard(params = {}) {
    const { limit = 10, role } = params;
    
    const queryParams = new URLSearchParams({
      limit,
      ...(role && { role }),
    });
    
    return apiClient.get(`${API_ENDPOINTS.reputation.leaderboard}?${queryParams}`);
  },
};
