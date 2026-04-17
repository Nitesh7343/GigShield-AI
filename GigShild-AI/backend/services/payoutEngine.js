/**
 * Payout Engine
 * Manages payouts, budget allocation, and financial controls
 */

const User = require('../models/User');
const Pool = require('../models/Pool');

// Weekly cap per user
const MAX_WEEKLY_PAYOUT = 300;

/**
 * Calculate payout for a single event based on pool available balance
 */
async function calculateEventPayout(affectedUsersCount) {
  const pool = await Pool.findOne();
  if (!pool || pool.availableBalance <= 0) {
    console.log("⚠️ Pool depleted - stopping payouts");
    return 0;
  }
  
  const eventBudget = pool.availableBalance * 0.6;
  if (affectedUsersCount === 0) return 0;
  
  let payoutPerUser = eventBudget / affectedUsersCount;
  
  // Apply cap
  payoutPerUser = Math.min(payoutPerUser, MAX_WEEKLY_PAYOUT);
  
  return payoutPerUser;
}

/**
 * Process deduction from pool for the final payout amount
 */
async function deductFromPool(totalPayout) {
  const pool = await Pool.findOne();
  if (!pool) return false;

  if (pool.availableBalance < totalPayout) {
    const needed = totalPayout - pool.availableBalance;
    if (pool.reserveBalance >= needed) {
      pool.reserveBalance -= needed;
      pool.availableBalance += needed;
    } else {
      throw new Error("SYSTEM_INSUFFICIENT_FUNDS");
    }
  }

  pool.availableBalance -= totalPayout;
  pool.totalPayout += totalPayout;
  await pool.save();
  return true;
}

/**
 * Credit user wallet after claim approval
 */
async function creditWallet(userId, amount) {
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $inc: { walletBalance: amount } },
      { new: true }
    );
    
    console.log(`[Payout] ₹${amount} credited to wallet of ${user.phone}. New balance: ₹${user.walletBalance}`);
    return user;
  } catch (error) {
    console.error('Credit wallet error:', error);
    throw error;
  }
}

/**
 * Withdraw from user wallet (for future payouts/transfers)
 */
async function withdrawFromWallet(userId, amount) {
  try {
    const user = await User.findById(userId);
    
    if (user.walletBalance < amount) {
      throw new Error('Insufficient wallet balance');
    }
    
    const updated = await User.findByIdAndUpdate(
      userId,
      { $inc: { walletBalance: -amount } },
      { new: true }
    );
    
    console.log(`[Payout] ₹${amount} withdrawn from wallet of ${user.phone}. New balance: ₹${updated.walletBalance}`);
    return updated;
  } catch (error) {
    console.error('Withdraw error:', error);
    throw error;
  }
}

/**
 * Get user wallet balance
 */
async function getWalletBalance(userId) {
  const user = await User.findById(userId).select('walletBalance').lean();
  return user?.walletBalance || 0;
}

/**
 * Get payout statistics
 */
async function getPayoutStats() {
  const users = await User.find().lean();
  const totalInWallets = users.reduce((sum, u) => sum + (u.walletBalance || 0), 0);
  const avgWallet = totalInWallets / (users.length || 1);
  
  const pool = await Pool.findOne();
  
  return {
    totalInWallets,
    avgWallet,
    userCount: users.length,
    maxWeeklyCapPerUser: MAX_WEEKLY_PAYOUT,
    poolBalance: pool ? pool.availableBalance : 0
  };
}

module.exports = {
  calculateEventPayout,
  deductFromPool,
  creditWallet,
  withdrawFromWallet,
  getWalletBalance,
  getPayoutStats,
  MAX_WEEKLY_PAYOUT
};
