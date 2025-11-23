/**
 * Escrow Service - API calls for escrow-related operations
 */

import apiClient from '../utils/api';
import { API_ENDPOINTS } from '../config/api';

export const escrowService = {
  /**
   * Get escrow by job ID
   * @param {number} jobId - Job ID
   * @returns {Promise<Object>} Escrow details
   */
  async getEscrowByJob(jobId) {
    return apiClient.get(API_ENDPOINTS.escrow.getByJob(jobId));
  },

  /**
   * Get escrow by ID
   * @param {number} escrowId - Escrow ID
   * @returns {Promise<Object>} Escrow details
   */
  async getEscrowById(escrowId) {
    return apiClient.get(API_ENDPOINTS.escrow.getById(escrowId));
  },

  /**
   * Fund escrow (employer deposits funds)
   * @param {number} escrowId - Escrow ID
   * @param {Object} data - Funding data
   * @param {string} data.amount - Amount in TON
   * @param {string} data.txHash - Blockchain transaction hash
   * @returns {Promise<Object>} Updated escrow
   */
  async fundEscrow(escrowId, data) {
    return apiClient.post(API_ENDPOINTS.escrow.fund(escrowId), data);
  },

  /**
   * Release escrow (release funds to worker)
   * @param {number} escrowId - Escrow ID
   * @param {Object} data - Release data
   * @param {string} data.txHash - Blockchain transaction hash
   * @returns {Promise<Object>} Updated escrow
   */
  async releaseEscrow(escrowId, data) {
    return apiClient.post(API_ENDPOINTS.escrow.release(escrowId), data);
  },

  /**
   * Initiate dispute
   * @param {number} escrowId - Escrow ID
   * @param {Object} data - Dispute data
   * @param {string} data.reason - Dispute reason
   * @param {string} data.evidence - Evidence/details
   * @param {string} data.txHash - Blockchain transaction hash
   * @returns {Promise<Object>} Updated escrow
   */
  async disputeEscrow(escrowId, data) {
    return apiClient.post(API_ENDPOINTS.escrow.dispute(escrowId), data);
  },

  /**
   * Resolve dispute (admin/arbiter action)
   * @param {number} escrowId - Escrow ID
   * @param {Object} data - Resolution data
   * @param {string} data.resolution - Resolution decision
   * @param {string} data.txHash - Blockchain transaction hash
   * @returns {Promise<Object>} Updated escrow
   */
  async resolveDispute(escrowId, data) {
    return apiClient.post(API_ENDPOINTS.escrow.resolve(escrowId), data);
  },
};
