const mongoose = require('mongoose');

const poolSchema = new mongoose.Schema({
  totalPremiumCollected: { type: Number, default: 0 },
  totalPayout: { type: Number, default: 0 },
  availableBalance: { type: Number, default: 0 },
  reserveBalance: { type: Number, default: 0 }
});

module.exports = mongoose.model("Pool", poolSchema);
