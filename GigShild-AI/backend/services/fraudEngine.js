/**
 * Fraud Detection Engine
 * Analyzes claims for fraudulent patterns
 */

const Claim = require('../models/Claim');

/**
 * Calculate fraud score for a claim
 * Higher score = higher fraud risk
 */
async function calculateFraudScore(user, claims, trigger) {
  let score = 0;
  const fraudReasons = [];

  // 1. Location mismatch - is user in the affected city?
  if (user.city !== trigger.city) {
    score += 40;
    fraudReasons.push('Location mismatch with trigger city');
  }

  // 2. Claim frequency - have they claimed too recently?
  const recentClaims = claims.filter(c => {
    const daysDiff = (new Date() - c.createdAt) / (1000 * 60 * 60 * 24);
    return daysDiff < 7; // Claims in last 7 days
  });

  if (recentClaims.length > 2) {
    score += 30;
    fraudReasons.push(`Multiple claims in short period (${recentClaims.length})`);
  }

  // 3. Duplicate claim for same trigger
  const duplicateClaim = claims.find(c => c.triggerId.toString() === trigger._id.toString());
  if (duplicateClaim) {
    score += 60;
    fraudReasons.push('Duplicate claim for same trigger event');
  }

  return {
    score: Math.min(score, 100),
    fraudReasons
  };
}

/**
 * Determine if claim should be approved or flagged
 */
function makeFraudDecision(fraudScore) {
  if (fraudScore >= 70) return 'FLAGGED';
  if (fraudScore >= 40) return 'REVIEW'; // Optional: manual review category
  return 'APPROVED';
}

module.exports = {
  calculateFraudScore,
  makeFraudDecision
};
