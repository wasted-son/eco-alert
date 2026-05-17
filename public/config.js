// ═══════════════════════════════════════════════════════
//  EcoAlert — Frontend Configuration
//  ⭐ EDIT THIS FILE with your keys before running
// ═══════════════════════════════════════════════════════

let CONFIG = {

  // ── BACKEND URL ──────────────────────────────────────
  // Local dev:    'http://localhost:3000'
  // After deploy: 'https://your-app.onrender.com'
  // ⚠️  Always use a full URL — never leave this empty
  API_BASE: 'http://localhost:3000',

  // ── MAP DEFAULTS ─────────────────────────────────────
  // Change these to your city's coordinates
  // Find yours at: https://www.latlong.net
  DEFAULT_LAT: -1.286389,   // Nairobi
  DEFAULT_LNG: 36.817223,
  DEFAULT_ZOOM: 14,

  // ── REPORT CATEGORIES ────────────────────────────────
  CATEGORIES: [
    { id: 'illegal_dump',    label: 'Illegal Dump',    emoji: '🗑️',  severity: 'critical' },
    { id: 'blocked_drain',   label: 'Blocked Drain',   emoji: '🚰',  severity: 'moderate' },
    { id: 'air_quality',     label: 'Air Quality',     emoji: '🌫️',  severity: 'critical', weather: true },
    { id: 'water_pollution', label: 'Water Pollution', emoji: '💧',  severity: 'critical' },
    { id: 'noise_pollution', label: 'Noise',           emoji: '🔊',  severity: 'moderate' },
    { id: 'deforestation',   label: 'Deforestation',   emoji: '🌳',  severity: 'critical' },
    { id: 'flooding',        label: 'Flooding',        emoji: '🌊',  severity: 'critical', weather: true },
    { id: 'road_hazard',     label: 'Road Hazard',     emoji: '⚠️',  severity: 'moderate' },
    { id: 'other',           label: 'Other Issue',     emoji: '📌',  severity: 'moderate' },
  ],

  // ── LIVE POLL INTERVAL ────────────────────────────────
  // How often (ms) the map checks for new reports
  POLL_INTERVAL: 10000, // 10 seconds
};

// ── AUTO-DETECT API URL ON DEPLOYMENT ──────────────────
// Fetch the correct API URL from the server
// This allows the app to work on any deployment without manual config changes
(async () => {
  try {
    // Only fetch if we're not on localhost (i.e., on production/Render)
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    if (isProduction) {
      const response = await fetch('/api/config', { timeout: 2000 });
      if (response.ok) {
        const data = await response.json();
        CONFIG.API_BASE = data.apiBase;
        console.log('[CONFIG] Auto-detected API URL:', CONFIG.API_BASE);
      }
    }
  } catch (err) {
    console.warn('[CONFIG] Could not auto-detect API URL, using default:', CONFIG.API_BASE);
  }
  Object.freeze(CONFIG);
})();
