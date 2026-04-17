/**
 * Trigger Service
 * Manages trigger creation and detection
 */

const Trigger = require('../models/Trigger');

/**
 * Create environment-based trigger
 */
async function createTrigger(type, city, value) {
  try {
    // Determine severity
    let severity = 'low';
    if (type === 'RAIN' && value > 50) severity = 'high';
    if (type === 'RAIN' && value > 75) severity = 'critical';
    if (type === 'AQI' && value > 300) severity = 'high';
    if (type === 'AQI' && value > 400) severity = 'critical';

    const trigger = new Trigger({
      type,
      city,
      value,
      severity,
      processed: false
    });

    await trigger.save();
    console.log(`[Trigger] Created ${type} trigger for ${city}: ${value} (${severity})`);
    return trigger;
  } catch (error) {
    console.error('Create trigger error:', error.message);
    return null;
  }
}

/**
 * Get unprocessed triggers
 */
async function getUnprocessedTriggers() {
  return await Trigger.find({ processed: false }).lean();
}

/**
 * Mark trigger as processed
 */
async function markTriggerProcessed(triggerId) {
  await Trigger.findByIdAndUpdate(triggerId, { processed: true });
}

/**
 * Get triggers by city
 */
async function getTriggersByCity(city, hours = 24) {
  const sinceTime = new Date();
  sinceTime.setHours(sinceTime.getHours() - hours);

  return await Trigger.find({
    city,
    createdAt: { $gte: sinceTime }
  }).lean();
}

module.exports = {
  createTrigger,
  getUnprocessedTriggers,
  markTriggerProcessed,
  getTriggersByCity
};
