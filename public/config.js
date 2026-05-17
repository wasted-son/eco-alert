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
// On production (not localhost), use the current domain as API base
// This allows the app to work on any deployment without manual config changes
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  CONFIG.API_BASE = `${window.location.protocol}//${window.location.host}`;
  console.log('[CONFIG] Using production API URL:', CONFIG.API_BASE);
}

Object.freeze(CONFIG);
