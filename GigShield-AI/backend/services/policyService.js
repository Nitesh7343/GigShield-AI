/**
 * Policy Service
 * Helper functions for policy operations
 */

const Policy = require('../models/Policy');

/**
 * Check if user has an active policy
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} - True if active policy exists
 */
const hasActivePolicy = async (userId) => {
  const policy = await Policy.findOne({
    userId,
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gt: new Date() }
  });
  return !!policy;
};

/**
 * Get active policy for user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Active policy or null
 */
const getActivePolicy = async (userId) => {
  return await Policy.findOne({
    userId,
    isActive: true,
    startDate: { $lte: new Date() },
    endDate: { $gt: new Date() }
  });
};

/**
 * Check if claim is within waiting period
 * @param {Object} policy - Policy object
 * @returns {boolean} - True if still in waiting period
 */
const isInWaitingPeriod = (policy) => {
  return new Date() < policy.waitingPeriodEnds;
};

// Weekly payout logic moved to User model

module.exports = {
  hasActivePolicy,
  getActivePolicy,
  isInWaitingPeriod
};
