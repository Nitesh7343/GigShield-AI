/**
 * Claim Processing Engine
 * Orchestrates the claim lifecycle:
 * 1. Trigger created
 * 2. Find affected users
 * 3. Check active policy
 * 4. Run fraud engine
 * 5. Approve/flag
 * 6. Assign payout
 */

const Claim = require('../models/Claim');
const User = require('../models/User');
const Policy = require('../models/Policy');
const Trigger = require('../models/Trigger');
const { calculateFraudScore, makeFraudDecision } = require('./fraudEngine');
const { hasActivePolicy, getActivePolicy, isInWaitingPeriod } = require('./policyService');
const { calculateEventPayout, deductFromPool, creditWallet } = require('./payoutEngine');

/**
 * Process a trigger event
 * Main entry point for claim generation
 */
async function processTrigger(triggerId) {
  try {
    const trigger = await Trigger.findById(triggerId);
    if (!trigger) {
      console.error(`Trigger ${triggerId} not found`);
      return;
    }

    console.log(`[Claim Processing] Processing trigger: ${trigger.type} in ${trigger.city}`);

    // Find all users in the affected city
    const affectedUsers = await User.find({ city: trigger.city }).lean();
    console.log(`[Claim Processing] Found ${affectedUsers.length} users in ${trigger.city}`);

    let claimsCreated = 0;
    let claimsRejected = 0;

    const payoutPerUser = await calculateEventPayout(affectedUsers.length);

    if (payoutPerUser > 0) {
      // Process each user
      for (const user of affectedUsers) {
        const result = await processClaim(user, trigger, payoutPerUser);
        if (result.created) {
          claimsCreated++;
        } else {
          claimsRejected++;
        }
      }
    } else {
      console.log('[Claim Processing] Payout is 0, skipping claims');
    }

    // Mark trigger as processed
    await Trigger.findByIdAndUpdate(triggerId, { processed: true });

    console.log(`[Claim Processing] Trigger processed: ${claimsCreated} approved, ${claimsRejected} rejected`);
    return { claimsCreated, claimsRejected };
  } catch (error) {
    console.error('Trigger processing error:', error);
  }
}

/**
 * Process a single user claim for a trigger
 */
async function processClaim(userObj, trigger, payoutAmount) {
  try {
    // Get full user object to ensure we can update it
    const user = await User.findById(userObj._id);

    // Step 1: Check if user has active policy
    const hasPolicy = await hasActivePolicy(user._id);
    if (!hasPolicy) {
      return { created: false, reason: 'No active policy' };
    }

    const policy = await getActivePolicy(user._id);

    // Step 2: Check waiting period
    if (isInWaitingPeriod(policy)) {
      return { created: false, reason: 'In waiting period' };
    }

    // Step 3: Check if claim already exists for this trigger-user pair
    const existingClaim = await Claim.findOne({
      userId: user._id,
      triggerId: trigger._id
    });

    if (existingClaim) {
      return { created: false, reason: 'Duplicate claim' };
    }

    // Step 4 is done previously (payoutAmount passed in)

    // Step 5: Check weekly payout cap (on user model)
    if (user.weeklyPayoutUsed >= 300 || user.weeklyPayoutUsed + payoutAmount > 300) {
      return { created: false, reason: 'Exceeds weekly payout cap' };
    }

    // Step 6: Run fraud detection
    const userClaims = await Claim.find({ userId: user._id }).lean();
    const fraudAnalysis = await calculateFraudScore(user, userClaims, trigger);
    const fraudDecision = makeFraudDecision(fraudAnalysis.score);

    // Step 7: Create claim
    const claim = new Claim({
      userId: user._id,
      policyId: policy._id,
      triggerId: trigger._id,
      amount: payoutAmount,
      fraudScore: fraudAnalysis.score,
      fraudReasons: fraudAnalysis.fraudReasons,
      status: fraudDecision === 'FLAGGED' ? 'FLAGGED' : 'APPROVED'
    });

    await claim.save();

    // Step 8: If approved, credit wallet and deduct from pool
    if (claim.status === 'APPROVED') {
      try {
        await deductFromPool(payoutAmount);
      } catch (err) {
        console.error(`[Claim] REJECTED: Insufficient pool funds for user ${user.phone}`);
        claim.status = 'REJECTED';
        claim.fraudReasons = [...claim.fraudReasons, 'System: Insufficient pool funds'];
        await claim.save();
        return { created: false, reason: 'Insufficient pool funds' };
      }

      await creditWallet(user._id, payoutAmount);
      
      user.weeklyPayoutUsed = (user.weeklyPayoutUsed || 0) + payoutAmount;
      await user.save();

      claim.paidAt = new Date();
      await claim.save();
      console.log(`[Claim] APPROVED: ₹${payoutAmount} to user ${user.phone}`);
    } else {
      console.log(`[Claim] FLAGGED: Fraud score ${fraudAnalysis.score} for user ${user.phone}`);
    }

    return { created: true, claim };
  } catch (error) {
    console.error('Process claim error:', error);
    return { created: false, reason: error.message };
  }
}

/**
 * Get claims for user
 */
async function getUserClaims(userId) {
  return await Claim.find({ userId })
    .populate('triggerId')
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Get admin dashboard data
 */
async function getAdminStats() {
  const Payment = require('../models/Payment');

  const totalUsers = await User.countDocuments();
  const totalClaims = await Claim.countDocuments();
  const approvedClaims = await Claim.countDocuments({ status: 'APPROVED' });
  const flaggedClaims = await Claim.countDocuments({ status: 'FLAGGED' });
  const totalPayouts = await Claim.aggregate([
    { $match: { status: 'APPROVED', paidAt: { $ne: null } } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  // Total funds collected from users
  const collectedPayments = await Payment.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const totalFundsCollected = collectedPayments[0]?.total || 0;

  return {
    totalUsers,
    totalClaims,
    approvedClaims,
    flaggedClaims,
    rejectedClaims: totalClaims - approvedClaims - flaggedClaims,
    totalPayouts: totalPayouts[0]?.total || 0,
    totalFundsCollected
  };
}

/**
 * Get detailed financial analytics and fund raised data
 */
async function getFinancialAnalytics() {
  try {
    const Payment = require('../models/Payment');

    // Total funds collected from users (successful payments)
    const collectedPayments = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalFundsCollected = collectedPayments[0]?.total || 0;

    // Total funds raised (approved payouts)
    const paidClaims = await Claim.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const approvedNotPaid = await Claim.aggregate([
      { $match: { status: 'APPROVED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const flaggedClaims = await Claim.aggregate([
      { $match: { status: 'FLAGGED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const rejectedClaims = await Claim.aggregate([
      { $match: { status: 'REJECTED' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalFundsPaid = paidClaims[0]?.total || 0;
    const totalFundsApproved = approvedNotPaid[0]?.total || 0;
    const totalFundsFlagged = flaggedClaims[0]?.total || 0;
    const totalFundsRejected = rejectedClaims[0]?.total || 0;
    const totalFundsRaised = totalFundsPaid + totalFundsApproved + totalFundsFlagged + totalFundsRejected;

    // Claims breakdown
    const claimsCount = await Claim.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const claimsBreakdown = {};
    claimsCount.forEach(item => {
      claimsBreakdown[item._id] = item.count;
    });

    // Average payout per user
    const usersWithClaims = await Claim.aggregate([
      { $match: { status: 'PAID' } },
      { $group: { _id: '$userId', totalAmount: { $sum: '$amount' } } }
    ]);
    const avgPayoutPerUser = usersWithClaims.length > 0 
      ? Math.round(usersWithClaims.reduce((sum, u) => sum + u.totalAmount, 0) / usersWithClaims.length)
      : 0;

    // Claims by city
    const claimsByCity = await Claim.aggregate([
      {
        $lookup: {
          from: 'triggers',
          localField: 'triggerId',
          foreignField: '_id',
          as: 'trigger'
        }
      },
      { $unwind: '$trigger' },
      {
        $group: {
          _id: '$trigger.city',
          claims: { $sum: 1 },
          payout: { $sum: '$amount' }
        }
      },
      { $sort: { payout: -1 } }
    ]);

    // Monthly trends (for last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyTrends = await Claim.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          claims: { $sum: 1 },
          payout: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return {
      totalFundsCollected,
      totalFundsRaised,
      fundByStatus: {
        paid: totalFundsPaid,
        approved: totalFundsApproved,
        flagged: totalFundsFlagged,
        rejected: totalFundsRejected
      },
      claimsBreakdown,
      usersWithPayouts: usersWithClaims.length,
      avgPayoutPerUser,
      claimsByCity,
      monthlyTrends
    };
  } catch (error) {
    console.error('Error getting financial analytics:', error);
    return null;
  }
}

module.exports = {
  processTrigger,
  processClaim,
  getUserClaims,
  getAdminStats,
  getFinancialAnalytics
};
