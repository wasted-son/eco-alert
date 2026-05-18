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
// If the frontend is served from another port on a local/private LAN host,
// assume the backend is still available on port 3000.
const host = window.location.hostname;
const isLocalhost = host === 'localhost' || host === '127.0.0.1';
const isPrivateHost = /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host);
const isHttpScheme = window.location.protocol === 'http:' || window.location.protocol === 'https:';
if (!isLocalhost && isHttpScheme) {
  const backendPort = '3000';
  if (isPrivateHost && window.location.port && window.location.port !== backendPort) {
    CONFIG.API_BASE = `${window.location.protocol}//${host}:${backendPort}`;
  } else {
    CONFIG.API_BASE = `${window.location.protocol}//${window.location.host}`;
  }
  console.log('[CONFIG] Using production API URL:', CONFIG.API_BASE);
}

Object.freeze(CONFIG);
