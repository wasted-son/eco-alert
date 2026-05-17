// ═══════════════════════════════════════════════════════
//  EcoAlert — Weather Module
//  Fetches live weather + AQI via OpenWeatherMap (free tier)
// ═══════════════════════════════════════════════════════

const WeatherModule = (() => {
  let weatherVisible = false;
  let lastLat = null;
  let lastLng = null;

  const WEATHER_ICONS = {
    '01': '☀️', '02': '⛅', '03': '☁️', '04': '☁️',
    '09': '🌧️', '10': '🌦️', '11': '⛈️', '13': '❄️', '50': '🌫️',
  };

  function getIcon(code) {
    const prefix = code?.slice(0, 2);
    return WEATHER_ICONS[prefix] || '🌤️';
  }

  // ── Fetch weather from backend proxy ──────────────
  async function fetchWeather(lat, lng) {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/weather?lat=${lat}&lng=${lng}`);
      if (!res.ok) throw new Error('Weather fetch failed');
      return await res.json();
    } catch (err) {
      console.warn('Weather error:', err.message);
      return null;
    }
  }

  // ── Fetch AQI ──────────────────────────────────────
  async function fetchAQI(lat, lng) {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/aqi?lat=${lat}&lng=${lng}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  // ── AQI label ──────────────────────────────────────
  function aqiLabel(aqi) {
    const labels = ['', 'Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    return labels[aqi] || 'Unknown';
  }

  // ── Show weather card ──────────────────────────────
  async function show(lat, lng) {
    lastLat = lat; lastLng = lng;
    const card = document.getElementById('weather-card');
    card.classList.remove('hidden');

    // Loading state
    document.getElementById('weather-temp').textContent = '…';
    document.getElementById('weather-city').textContent = 'Loading…';
    document.getElementById('weather-icon').textContent = '🌐';
    document.getElementById('weather-humidity').textContent = '…';
    document.getElementById('weather-wind').textContent = '…';
    document.getElementById('weather-aqi').textContent = '…';
    document.getElementById('weather-alert').classList.add('hidden');

    const [weather, aqiData] = await Promise.all([
      fetchWeather(lat, lng),
      fetchAQI(lat, lng),
    ]);

    if (!weather) {
      document.getElementById('weather-city').textContent = 'Unavailable';
      document.getElementById('weather-temp').textContent = '—';
      return;
    }

    const { name, main, weather: conditions, wind } = weather;
    const iconCode = conditions?.[0]?.icon || '01d';

    document.getElementById('weather-city').textContent = name || 'Your Area';
    document.getElementById('weather-icon').textContent = getIcon(iconCode);
    document.getElementById('weather-temp').textContent = `${Math.round(main.temp)}°C`;
    document.getElementById('weather-humidity').textContent = `${main.humidity}% humidity`;
    document.getElementById('weather-wind').textContent = `${Math.round(wind.speed)} m/s wind`;

    // AQI
    if (aqiData?.list?.[0]?.main?.aqi) {
      const aqi = aqiData.list[0].main.aqi;
      document.getElementById('weather-aqi').textContent = `${aqi} — ${aqiLabel(aqi)}`;

      if (aqi >= 4) {
        const alertEl = document.getElementById('weather-alert');
        alertEl.textContent = '⚠️ Poor air quality in your area. Limit outdoor exposure.';
        alertEl.classList.remove('hidden');
      }
    } else {
      document.getElementById('weather-aqi').textContent = 'N/A';
    }
  }

  function hide() {
    document.getElementById('weather-card').classList.add('hidden');
  }

  function toggle() {
    weatherVisible = !weatherVisible;
    if (weatherVisible) {
      const loc = MapModule.getUserLocation();
      show(loc.lat, loc.lng);
    } else {
      hide();
    }
  }

  // ── Public: get context string for a weather-related report ──
  async function getContextForReport(lat, lng) {
    const weather = await fetchWeather(lat, lng);
    if (!weather) return '';
    const desc = weather.weather?.[0]?.description || '';
    const temp = weather.main?.temp ? `${Math.round(weather.main.temp)}°C` : '';
    const humidity = weather.main?.humidity ? `${weather.main.humidity}% humidity` : '';
    return [desc, temp, humidity].filter(Boolean).join(', ');
  }

  function init() {
    document.getElementById('btn-weather-toggle').addEventListener('click', toggle);
    document.getElementById('weather-close').addEventListener('click', () => {
      weatherVisible = false;
      hide();
    });
  }

  return { init, show, hide, toggle, getContextForReport };
})();
