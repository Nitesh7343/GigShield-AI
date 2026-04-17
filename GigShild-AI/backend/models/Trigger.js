const mongoose = require('mongoose');

const triggerSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['RAIN', 'AQI', 'TEMP'],
    required: true
  },
  city: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  processed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster city-based queries
triggerSchema.index({ city: 1, createdAt: -1 });

module.exports = mongoose.model('Trigger', triggerSchema);
