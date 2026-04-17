/**
 * Trigger Cron Job
 * Runs every 10 minutes to check for environmental disruptions
 * Creates triggers when thresholds are exceeded
 */

const cron = require('node-cron');
const { fetchWeather, fetchAQI } = require('../services/externalApiService');
const { createTrigger } = require('../services/triggerService');
const User = require('../models/User');

const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata'];

// Thresholds for triggering claims
const THRESHOLDS = {
  RAIN: 40, // mm
  AQI: 300
};

/**
 * Monitor weather and air quality
 */
async function monitorEnvironment() {
  console.log('[Cron] Starting environment monitoring...');

  for (const city of CITIES) {
    try {
      // Fetch weather data
      const weather = await fetchWeather(city);
      if (weather.rain > THRESHOLDS.RAIN) {
        await createTrigger('RAIN', city, weather.rain);
      }

      // Fetch AQI data
      const aqi = await fetchAQI(city);
      if (aqi.aqi > THRESHOLDS.AQI) {
        await createTrigger('AQI', city, aqi.aqi);
      }
    } catch (error) {
      console.error(`Error monitoring ${city}:`, error.message);
    }
  }

  console.log('[Cron] Environment monitoring complete');
}

/**
 * Initialize cron jobs
 * Must be called when server starts
 */
function initializeCronJobs() {
  // Run every 10 minutes: "*/10 * * * *"
  // For faster testing, we'll use every 2 minutes during development
  const schedule = process.env.NODE_ENV === 'production' ? '*/10 * * * *' : '*/2 * * * *';

  const job = cron.schedule(schedule, monitorEnvironment);

  console.log(`[Cron] Trigger monitoring scheduled: ${schedule}`);

  // Weekly limit reset
  const weeklySchedule = "0 0 * * 0";
  cron.schedule(weeklySchedule, async () => {
    try {
      await User.updateMany({}, { weeklyPayoutUsed: 0 });
      console.log('[Cron] Weekly payouts reset');
    } catch (error) {
      console.error('Error resetting weekly payouts:', error);
    }
  });
  console.log(`[Cron] Weekly limit reset scheduled: ${weeklySchedule}`);

  return job;
}

module.exports = {
  initializeCronJobs,
  monitorEnvironment
};
