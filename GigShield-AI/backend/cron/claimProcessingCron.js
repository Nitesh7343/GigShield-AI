/**
 * Cron job to process triggers into claims
 * Runs periodically (e.g., every 5 minutes)
 */

const cron = require('node-cron');
const Trigger = require('../models/Trigger');
const { processTrigger } = require('../services/claimProcessingService');

/**
 * Process all unprocessed triggers
 */
async function processUnprocessedTriggers() {
  try {
    console.log('[Claim Cron] Checking for unprocessed triggers...');
    
    const unprocessed = await Trigger.find({ processed: false }).lean();
    
    if (unprocessed.length === 0) {
      console.log('[Claim Cron] No unprocessed triggers');
      return;
    }

    console.log(`[Claim Cron] Found ${unprocessed.length} unprocessed triggers`);

    for (const trigger of unprocessed) {
      await processTrigger(trigger._id);
    }

    console.log('[Claim Cron] Trigger processing complete');
  } catch (error) {
    console.error('Claim processing cron error:', error);
  }
}

/**
 * Initialize claim processing cron
 */
function initializeClaimProcessingCron() {
  // Run every 5 minutes: "*/5 * * * *"
  // For testing, use every minute: "* * * * *"
  const schedule = process.env.NODE_ENV === 'production' ? '*/5 * * * *' : '* * * * *';
  
  const job = cron.schedule(schedule, processUnprocessedTriggers);
  
  console.log(`[Cron] Claim processing scheduled: ${schedule}`);
  
  return job;
}

module.exports = {
  initializeClaimProcessingCron,
  processUnprocessedTriggers
};
