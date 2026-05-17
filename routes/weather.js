// ═══════════════════════════════════════════════════════
//  EcoAlert — Weather Routes
//  Proxy to OpenWeatherMap API with caching
// ═══════════════════════════════════════════════════════

const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

// Simple in-memory cache
const cache = {};
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCached(key) {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_TTL) {
    delete cache[key];
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  cache[key] = { data, time: Date.now() };
}

// ─────────────────────────────────────────────────────────
//  GET /api/weather
// ─────────────────────────────────────────────────────────
router.get('/weather', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  const cacheKey = `weather_${lat}_${lng}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  if (!process.env.OPENWEATHER_KEY || process.env.OPENWEATHER_KEY === 'your_openweather_api_key_here') {
    return res.status(503).json({ error: 'Weather service not configured' });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_KEY}&units=metric`;
    const response = await fetch(url, { timeout: 5000 });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'OpenWeatherMap API error' });
    }

    const data = await response.json();
    setCached(cacheKey, data);
    res.json(data);
  } catch (err) {
    console.error('[Weather fetch error]', err.message);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

// ─────────────────────────────────────────────────────────
//  GET /api/aqi
// ─────────────────────────────────────────────────────────
router.get('/aqi', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  const cacheKey = `aqi_${lat}_${lng}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  if (!process.env.OPENWEATHER_KEY || process.env.OPENWEATHER_KEY === 'your_openweather_api_key_here') {
    return res.status(503).json({ error: 'AQI service not configured' });
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_KEY}`;
    const response = await fetch(url, { timeout: 5000 });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'OpenWeatherMap API error' });
    }

    const data = await response.json();
    setCached(cacheKey, data);
    res.json(data);
  } catch (err) {
    console.error('[AQI fetch error]', err.message);
    res.status(500).json({ error: 'Failed to fetch AQI' });
  }
});

module.exports = router;
