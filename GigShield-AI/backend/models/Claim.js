const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  policyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Policy',
    required: false,
    default: null
  },
  triggerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trigger',
    required: false,
    default: null
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  fraudScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['APPROVED', 'FLAGGED', 'REJECTED', 'PAID'],
    default: 'APPROVED'
  },
  fraudReasons: [{
    type: String
  }],
  paidAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Prevent duplicate claims per trigger per user (only for automatic claims)
claimSchema.index({ userId: 1, triggerId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Claim', claimSchema);
