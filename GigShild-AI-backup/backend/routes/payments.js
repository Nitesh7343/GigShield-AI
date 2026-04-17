const express = require('express');
const { createPayment, getMyPayments, getPaymentDetails } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const WithdrawalRequest = require('../models/WithdrawalRequest');

const router = express.Router();

// All payment routes require authentication
router.use(authMiddleware);

router.post('/create', createPayment);
router.get('/my', getMyPayments);
router.get('/:paymentId', getPaymentDetails);

/**
 * POST /api/payments/withdrawal/request
 * User submits a withdrawal request
 * Body: { amount }
 */
router.post('/withdrawal/request', async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.userId;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has sufficient balance
    if (user.walletBalance < amount) {
      return res.status(400).json({
        message: `Insufficient balance. Your wallet has ₹${user.walletBalance}, but you requested ₹${amount}`
      });
    }

    // Create withdrawal request
    const withdrawalRequest = new WithdrawalRequest({
      userId,
      amount,
      status: 'PENDING'
    });

    await withdrawalRequest.save();

    res.status(201).json({
      message: '✅ Withdrawal request submitted successfully! Admin will review it shortly.',
      withdrawalRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating withdrawal request', error: error.message });
  }
});

/**
 * GET /api/payments/withdrawal/my-requests
 * Get user's withdrawal requests
 */
router.get('/withdrawal/my-requests', async (req, res) => {
  try {
    const userId = req.userId;

    const withdrawalRequests = await WithdrawalRequest.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      withdrawalRequests
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching withdrawal requests', error: error.message });
  }
});

module.exports = router;
