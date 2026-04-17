const Policy = require('../models/Policy');
const User = require('../models/User');
const Pool = require('../models/Pool');
const { getPremium } = require('../services/riskEngine');

const createPolicy = async (req, res) => {
  try {
    const userId = req.userId;

    // Check if user has an active policy
    const existingPolicy = await Policy.findOne({
      userId,
      isActive: true,
      endDate: { $gt: new Date() }
    });

    if (existingPolicy) {
      return res.status(400).json({ message: 'User already has an active policy' });
    }

    // Get user to calculate premium
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate premium based on risk score
    const premium = getPremium(user.riskScore);

    // Step 1: Check wallet
    if (user.walletBalance < premium) {
      return res.status(400).json({ message: "INSUFFICIENT_BALANCE" });
    }

    // Step 2: Deduct from user
    user.walletBalance -= premium;

    // Step 3: Update pool
    const pool = await Pool.findOne();
    if (!pool) {
      return res.status(500).json({ message: "System error: Pool not initialized" });
    }

    pool.totalPremiumCollected += premium;
    pool.availableBalance += premium * 0.7;
    pool.reserveBalance += premium * 0.3;

    await pool.save();
    await user.save();

    // Policy starts 24 hours from now (waiting period)
    const startDate = new Date();
    startDate.setHours(startDate.getHours() + 24);

    // Policy ends 7 days after start
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    // Waiting period ends at startDate + 24h (so first payout can happen after 48h from now)
    const waitingPeriodEnds = new Date(startDate);
    waitingPeriodEnds.setHours(waitingPeriodEnds.getHours() + 24);

    const newPolicy = new Policy({
      userId,
      premium,
      startDate,
      endDate,
      isActive: true,
      weeklyPayoutUsed: 0,
      waitingPeriodEnds
    });

    await newPolicy.save();

    res.status(201).json({
      message: 'Policy created successfully',
      policy: {
        _id: newPolicy._id,
        premium: newPolicy.premium,
        startDate: newPolicy.startDate,
        endDate: newPolicy.endDate,
        isActive: newPolicy.isActive,
        waitingPeriodEnds: newPolicy.waitingPeriodEnds
      }
    });
  } catch (error) {
    console.error('Create policy error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMyPolicy = async (req, res) => {
  try {
    const userId = req.userId;

    // Get active policy
    const policy = await Policy.findOne({
      userId,
      isActive: true,
      endDate: { $gt: new Date() }
    }).lean();

    if (!policy) {
      return res.status(404).json({ message: 'No active policy found' });
    }

    // Calculate remaining weekly payout using User model
    const user = await User.findById(userId);
    const weeklyPayoutUsed = user ? user.weeklyPayoutUsed || 0 : 0;
    const remainingWeeklyPayout = Math.max(0, 300 - weeklyPayoutUsed);

    res.status(200).json({
      policy,
      remainingWeeklyPayout
    });
  } catch (error) {
    console.error('Get policy error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getAllPolicies = async (req, res) => {
  try {
    const userId = req.userId;
    const policies = await Policy.find({ userId }).lean();
    res.status(200).json({ policies });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createPolicy,
  getMyPolicy,
  getAllPolicies
};
