const Payment = require('../models/Payment');
const User = require('../models/User');
const crypto = require('crypto');

const createPayment = async (req, res) => {
  try {
    const userId = req.userId;
    const { amount, paymentMethod } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate transaction ID
    const transactionId = 'TXN_' + Date.now() + '_' + crypto.randomBytes(4).toString('hex').toUpperCase();

    // Create payment record
    const payment = new Payment({
      userId,
      amount,
      paymentMethod: paymentMethod || 'UPI',
      status: 'pending',
      transactionId
    });

    await payment.save();

    // Simulate payment processing (in production, integrate with actual payment gateway)
    // For now, mark as completed and update wallet
    payment.status = 'completed';
    await payment.save();

    // Update user's wallet balance
    user.walletBalance += amount;
    user.updatedAt = new Date();
    await user.save();

    res.status(201).json({
      message: 'Payment successful',
      payment: {
        _id: payment._id,
        transactionId: payment.transactionId,
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt
      },
      newWalletBalance: user.walletBalance
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getMyPayments = async (req, res) => {
  try {
    const userId = req.userId;

    const payments = await Payment.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.status(200).json({
      payments
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getPaymentDetails = async (req, res) => {
  try {
    const userId = req.userId;
    const { paymentId } = req.params;

    const payment = await Payment.findOne({
      _id: paymentId,
      userId
    }).lean();

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.status(200).json({ payment });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createPayment,
  getMyPayments,
  getPaymentDetails
};
