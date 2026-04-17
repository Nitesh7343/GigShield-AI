/**
 * External API Service
 * Fetches real-time weather and AQI data
 */

const axios = require('axios');

const CITIES = {
  'Delhi': { lat: 28.6139, lon: 77.2090 },
  'Mumbai': { lat: 19.0760, lon: 72.8777 },
  'Bangalore': { lat: 12.9716, lon: 77.5946 },
  'Hyderabad': { lat: 17.3850, lon: 78.4867 },
  'Chennai': { lat: 13.0827, lon: 80.2707 },
  'Kolkata': { lat: 22.5726, lon: 88.3639 }
};

/**
 * Fetch weather data from OpenWeather API
 * For demo: returns mock data
 */
async function fetchWeather(city = 'Delhi') {
  try {
    const apiKey = process.env.OPENWEATHER_API_KEY;
    const { lat, lon } = CITIES[city] || CITIES['Delhi'];

    if (!apiKey) {
      // Mock data for demo
      return getMockWeatherData(city);
    }

    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`
    );

    const data = response.data;
    return {
      city,
      temp: Math.round(data.main.temp - 273.15), // Convert K to C
      rain: data.rain?.['1h'] || 0,
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Weather API error:', error.message);
    return getMockWeatherData(city);
  }
}

/**
 * Fetch AQI data from WAQI API
 * For demo: returns mock data
 */
async function fetchAQI(city = 'Delhi') {
  try {
    const apiKey = process.env.WAQI_API_KEY;

    if (!apiKey) {
      // Mock data for demo
      return getMockAQIData(city);
    }

    const response = await axios.get(
      `https://api.waqi.info/feed/${city}/?token=${apiKey}`
    );

    if (response.data.status === 'ok') {
      return {
        city,
        aqi: response.data.data.aqi,
        timestamp: new Date()
      };
    }

    return getMockAQIData(city);
  } catch (error) {
    console.error('AQI API error:', error.message);
    return getMockAQIData(city);
  }
}

/**
 * Mock weather data for testing
 */
function getMockWeatherData(city) {
  // Simulated realistic scenario: sometimes rain, sometimes clear
  const hasRain = Math.random() > 0.7; // 30% chance of rainfall

  return {
    city,
    temp: 25 + Math.random() * 15, // 25-40°C
    rain: hasRain ? 40 + Math.random() * 60 : 0, // 40-100 mm if rain
    timestamp: new Date()
  };
}

/**
 * Mock AQI data for testing
 */
function getMockAQIData(city) {
  // Simulated realistic scenario: sometimes poor AQI, sometimes good
  const hasPoorAQI = Math.random() > 0.85; // 15% chance of poor AQI

  return {
    city,
    aqi: hasPoorAQI ? 300 + Math.random() * 100 : 50 + Math.random() * 150,
    timestamp: new Date()
  };
}

/**
 * Get current weather and AQI for a city (public endpoint)
 */
async function getWeatherAndAQI(city = 'Delhi') {
  try {
    const weather = await fetchWeather(city);
    const aqi = await fetchAQI(city);

    return {
      city,
      weather: {
        temperature: Math.round(weather.temp),
        rainfall: Math.round(weather.rain * 10) / 10,
        condition: weather.rain > 40 ? '🌧️ Heavy Rain' : weather.rain > 20 ? '🌦️ Light Rain' : '☀️ Clear',
        risk: weather.rain > 40 ? 'HIGH' : 'LOW'
      },
      aqi: {
        value: Math.round(aqi.aqi),
        condition: aqi.aqi > 300 ? '😷 Poor' : aqi.aqi > 200 ? '😑 Unhealthy' : aqi.aqi > 100 ? '😐 Moderate' : '😊 Good',
        risk: aqi.aqi > 300 ? 'HIGH' : aqi.aqi > 200 ? 'MEDIUM' : 'LOW'
      },
      timestamp: new Date()
    };
  } catch (error) {
    console.error('Error getting weather and AQI:', error.message);
    return null;
  }
}

module.exports = {
  fetchWeather,
  fetchAQI,
  getWeatherAndAQI
};
