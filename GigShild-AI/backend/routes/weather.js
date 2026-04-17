const express = require('express');
const { getWeatherAndAQI } = require('../services/externalApiService');

const router = express.Router();

/**
 * GET /api/weather/:city
 * Get current weather and AQI for a city
 */
router.get('/:city', async (req, res) => {
  try {
    const { city } = req.params;

    if (!city) {
      return res.status(400).json({ message: 'City parameter required' });
    }

    const data = await getWeatherAndAQI(city);

    if (!data) {
      return res.status(500).json({ message: 'Failed to fetch weather data' });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Weather endpoint error:', error);
    res.status(500).json({ message: 'Error fetching weather', error: error.message });
  }
});

/**
 * GET /api/weather/all/cities
 * Get weather and AQI for all supported cities
 */
router.get('/all/cities', async (req, res) => {
  try {
    const CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata'];

    const weatherData = await Promise.all(
      CITIES.map(city => getWeatherAndAQI(city))
    );

    res.status(200).json({
      timestamp: new Date(),
      cities: weatherData.filter(data => data !== null)
    });
  } catch (error) {
    console.error('Weather all cities endpoint error:', error);
    res.status(500).json({ message: 'Error fetching weather data', error: error.message });
  }
});

module.exports = router;
