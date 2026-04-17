const express = require('express');
const { getAdminStats, getFinancialAnalytics } = require('../services/claimProcessingService');
const { getPayoutStats } = require('../services/payoutEngine');
const { createTrigger } = require('../services/triggerService');
const Trigger = require('../models/Trigger');
const User = require('../models/User');
const Claim = require('../models/Claim');
const WithdrawalRequest = require('../models/WithdrawalRequest');
const Pool = require('../models/Pool');
const adminAuthMiddleware = require('../middleware/adminAuth');

const router = express.Router();

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', adminAuthMiddleware, async (req, res) => {
  try {
    const claimStats = await getAdminStats();
    const payoutStats = await getPayoutStats();
    const recentTriggers = await Trigger.find().sort({ createdAt: -1 }).limit(10).lean();
    
    // Get wallet stats
    const allUsers = await User.find().lean();
    const totalWalletBalance = allUsers.reduce((sum, user) => sum + (user.walletBalance || 0), 0);
    
    res.status(200).json({
      claimStats,
      payoutStats,
      recentTriggers,
      walletStats: {
        totalWalletBalance,
        totalUsers: allUsers.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
});

/**
 * GET /api/admin/analytics
 * Get detailed financial analytics and funds raised data
 */
router.get('/analytics', adminAuthMiddleware, async (req, res) => {
  try {
    const analytics = await getFinancialAnalytics();
    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching analytics', error: error.message });
  }
});

/**
 * GET /api/admin/wallets
 * Get all users' wallet balances and total
 */
router.get('/wallets', adminAuthMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('phone city walletBalance avgWeeklyIncome riskScore').lean();
    
    const totalWalletBalance = users.reduce((sum, user) => sum + (user.walletBalance || 0), 0);
    const usersWithWallet = users.filter(u => u.walletBalance && u.walletBalance > 0).length;
    const averageWalletBalance = users.length > 0 ? Math.round(totalWalletBalance / users.length) : 0;

    const sortedUsers = users.sort((a, b) => (b.walletBalance || 0) - (a.walletBalance || 0));

    res.status(200).json({
      totalWalletBalance,
      averageWalletBalance,
      usersWithWallet,
      totalUsers: users.length,
      users: sortedUsers
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching wallets', error: error.message });
  }
});

/**
 * GET /api/admin/users/detailed
 * Get all users with their payout history and claims summary (MUST COME BEFORE /users)
 */
router.get('/users/detailed', adminAuthMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    
    // Enrich users with claim counts and payout info
    const enrichedUsers = await Promise.all(users.map(async (user) => {
      const claims = await Claim.find({ userId: user._id }).lean();
      const approvedClaims = claims.filter(c => c.status === 'APPROVED' || c.status === 'PAID');
      const flaggedClaims = claims.filter(c => c.status === 'FLAGGED');
      const rejectedClaims = claims.filter(c => c.status === 'REJECTED');
      
      return {
        ...user,
        totalClaims: claims.length,
        approvedClaims: approvedClaims.length,
        flaggedClaims: flaggedClaims.length,
        rejectedClaims: rejectedClaims.length,
        totalPayoutTriggered: approvedClaims.reduce((sum, c) => sum + (c.amount || 0), 0),
        lastClaimDate: claims.length > 0 ? claims.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt : null
      };
    }));

    // Calculate total wallet balance across all users
    const totalWalletBalance = enrichedUsers.reduce((sum, user) => sum + (user.walletBalance || 0), 0);

    res.status(200).json({ 
      users: enrichedUsers,
      totalWalletBalance
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching detailed users', error: error.message });
  }
});

/**
 * GET /api/admin/users
 * Get all users
 */
router.get('/users', adminAuthMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password').lean();
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

/**
 * GET /api/admin/claims/all
 * Get all claims with user and trigger details
 */
router.get('/claims/all', adminAuthMiddleware, async (req, res) => {
  try {
    const claims = await Claim.find()
      .populate('userId', 'phone city avgWeeklyIncome riskScore')
      .populate('triggerId', 'type city value severity')
      .sort({ createdAt: -1 })
      .lean();
    
    res.status(200).json({ claims });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching claims', error: error.message });
  }
});

/**
 * GET /api/admin/triggers
 * Get all triggers with optional city filter
 */
router.get('/triggers', adminAuthMiddleware, async (req, res) => {
  try {
    const { city } = req.query;
    const query = city ? { city } : {};
    const triggers = await Trigger.find(query).sort({ createdAt: -1 }).lean();
    res.status(200).json({ triggers });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching triggers', error: error.message });
  }
});

/**
 * POST /api/admin/trigger/create
 * Admin manually creates a trigger (e.g., test RAIN or AQI event)
 * Body: { type: 'RAIN' | 'AQI', city, value }
 */
router.post('/trigger/create', adminAuthMiddleware, async (req, res) => {
  try {
    const { type, city, value } = req.body;

    if (!type || !city || value === undefined) {
      return res.status(400).json({ message: 'Missing required fields: type, city, value' });
    }

    if (!['RAIN', 'AQI'].includes(type)) {
      return res.status(400).json({ message: 'Type must be RAIN or AQI' });
    }

    const trigger = await createTrigger(type, city, value);
    res.status(201).json({
      message: `Manually triggered ${type} event for ${city}`,
      trigger
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating trigger', error: error.message });
  }
});

/**
 * POST /api/admin/manual-payout
 * Admin manually creates a payout for a specific user
 * Body: { userId, amount, reason }
 */
router.post('/manual-payout', adminAuthMiddleware, async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Missing required fields: userId, amount (>0)' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create a manual claim record
    const manualClaim = new Claim({
      userId,
      policyId: null, // Manual payout, no specific policy
      triggerId: null, // Manual payout, no trigger
      amount,
      status: 'PAID',
      fraudScore: 0,
      fraudReasons: [`Manual admin payout: ${reason || 'Admin initiated'}`],
      paidAt: new Date()
    });

    await manualClaim.save();

    // Credit user's wallet
    user.walletBalance = (user.walletBalance || 0) + amount;
    await user.save();

    res.status(201).json({
      message: `✅ Manual payout of ₹${amount} created for ${user.phone}`,
      claim: manualClaim,
      user: {
        phone: user.phone,
        walletBalance: user.walletBalance
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating manual payout', error: error.message });
  }
});

/**
 * GET /api/admin/withdrawal-requests
 * Get all pending withdrawal requests
 */
router.get('/withdrawal-requests', adminAuthMiddleware, async (req, res) => {
  try {
    const withdrawalRequests = await WithdrawalRequest.find()
      .populate('userId', 'phone city walletBalance avgWeeklyIncome')
      .sort({ createdAt: -1 })
      .lean();

    const pendingCount = withdrawalRequests.filter(wr => wr.status === 'PENDING').length;
    const approvedCount = withdrawalRequests.filter(wr => wr.status === 'APPROVED').length;
    const rejectedCount = withdrawalRequests.filter(wr => wr.status === 'REJECTED').length;

    res.status(200).json({
      withdrawalRequests,
      stats: {
        total: withdrawalRequests.length,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching withdrawal requests', error: error.message });
  }
});

/**
 * POST /api/admin/withdrawal-requests/:requestId/approve
 * Admin approves a withdrawal request
 */
router.post('/withdrawal-requests/:requestId/approve', adminAuthMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;

    const withdrawalRequest = await WithdrawalRequest.findById(requestId);
    if (!withdrawalRequest) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    if (withdrawalRequest.status !== 'PENDING') {
      return res.status(400).json({ message: `Request is already ${withdrawalRequest.status}` });
    }

    const user = await User.findById(withdrawalRequest.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Deduct from wallet
    if (user.walletBalance < withdrawalRequest.amount) {
      return res.status(400).json({
        message: `Insufficient wallet balance. User has ₹${user.walletBalance}, but requested ₹${withdrawalRequest.amount}`
      });
    }

    user.walletBalance -= withdrawalRequest.amount;
    await user.save();

    // Update withdrawal request
    withdrawalRequest.status = 'APPROVED';
    withdrawalRequest.approvedAt = new Date();
    await withdrawalRequest.save();

    res.status(200).json({
      message: `✅ Withdrawal request approved! ₹${withdrawalRequest.amount} will be transferred to ${user.phone}`,
      withdrawalRequest,
      user: {
        phone: user.phone,
        walletBalance: user.walletBalance
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error approving withdrawal request', error: error.message });
  }
});

/**
 * POST /api/admin/withdrawal-requests/:requestId/reject
 * Admin rejects a withdrawal request
 * Body: { rejectionReason }
 */
router.post('/withdrawal-requests/:requestId/reject', adminAuthMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const withdrawalRequest = await WithdrawalRequest.findById(requestId);
    if (!withdrawalRequest) {
      return res.status(404).json({ message: 'Withdrawal request not found' });
    }

    if (withdrawalRequest.status !== 'PENDING') {
      return res.status(400).json({ message: `Request is already ${withdrawalRequest.status}` });
    }

    const user = await User.findById(withdrawalRequest.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update withdrawal request
    withdrawalRequest.status = 'REJECTED';
    withdrawalRequest.rejectionReason = rejectionReason;
    withdrawalRequest.rejectedAt = new Date();
    await withdrawalRequest.save();

    res.status(200).json({
      message: `❌ Withdrawal request rejected for ${user.phone}. Reason: ${rejectionReason}`,
      withdrawalRequest,
      user: {
        phone: user.phone,
        walletBalance: user.walletBalance
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting withdrawal request', error: error.message });
  }
});
/**
 * GET /api/admin/pool
 * Get the current state of the central insurance pool
 */
router.get('/pool', adminAuthMiddleware, async (req, res) => {
  try {
    let pool = await Pool.findOne().lean();
    if (!pool) {
      // If not initialized yet, return zeros
      pool = {
        totalPremiumCollected: 0,
        totalPayout: 0,
        availableBalance: 0,
        reserveBalance: 0
      };
    }
    
    res.status(200).json({
      totalPremiumCollected: pool.totalPremiumCollected || 0,
      totalPayout: pool.totalPayout || 0,
      availableBalance: pool.availableBalance || 0,
      reserveBalance: pool.reserveBalance || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pool stats', error: error.message });
  }
});

module.exports = router;
