// ═══════════════════════════════════════════════════════
//  EcoAlert — Reports Router
//  Falls back to in-memory storage if Supabase is not
//  configured, so the app works immediately out of the box.
// ═══════════════════════════════════════════════════════

const express = require('express');
const router  = express.Router();
const fetch   = require('node-fetch');

// ── In-memory fallback store ────────────────────────────
// Used automatically when Supabase keys are not set.
// Data is lost on server restart — good enough for local dev.
const memStore = [];
let memIdCounter = 1;

// ── Check if Supabase is configured ────────────────────
function isSupabaseConfigured() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  return url && key &&
    url !== 'https://your-project-id.supabase.co' &&
    key !== 'your_supabase_service_role_key_here';
}

// Lazily require supabase only when configured
function getSupabase() {
  if (!isSupabaseConfigured()) return null;
  return require('../supabase');
}

const VALID_CATEGORIES = [
  'illegal_dump', 'blocked_drain', 'air_quality', 'water_pollution',
  'noise_pollution', 'deforestation', 'flooding', 'road_hazard', 'other',
];

// ─────────────────────────────────────────────────────────
//  GET /api/reports
// ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const supabase = getSupabase();

  if (!supabase) {
    // Return in-memory reports sorted newest first
    return res.json([...memStore].reverse());
  }

  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error('[GET /reports]', err.message);
    res.status(500).json({ error: 'Failed to load reports: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────
//  POST /api/reports
// ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { category, severity, description, lat, lng, photo_base64, weather_category } = req.body;

    // Validation — return the exact reason so the frontend can show it
    if (!category) {
      return res.status(400).json({ error: 'No category selected.' });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Unknown category: "${category}"` });
    }
    if (lat === undefined || lat === null || lat === '') {
      return res.status(400).json({ error: 'GPS location missing. Allow location access and try again.' });
    }
    if (isNaN(Number(lat)) || isNaN(Number(lng))) {
      return res.status(400).json({ error: 'Invalid GPS coordinates received.' });
    }
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      return res.status(400).json({ error: 'GPS coordinates out of range.' });
    }

    const resolvedSeverity = ['critical','moderate','resolved'].includes(severity)
      ? severity : 'moderate';

    // Weather context (non-fatal)
    let weather_context = null;
    if (weather_category && process.env.OPENWEATHER_KEY &&
        process.env.OPENWEATHER_KEY !== 'your_openweather_api_key_here') {
      try {
        weather_context = await getWeatherContext(lat, lng);
      } catch (e) {
        console.warn('[Weather context skipped]', e.message);
      }
    }

    const supabase = getSupabase();

    if (!supabase) {
      // ── FALLBACK: save to memory ──
      const report = {
        id:              String(memIdCounter++),
        category,
        severity:        resolvedSeverity,
        description:     (description || 'No description.').slice(0, 300),
        lat:             parseFloat(lat),
        lng:             parseFloat(lng),
        photo_url:       null,
        weather_context,
        confirmations:   0,
        created_at:      new Date().toISOString(),
      };
      memStore.push(report);
      console.log(`[Memory] Report saved (${memStore.length} total). Supabase not configured.`);
      return res.status(201).json({ success: true, report, _storage: 'memory' });
    }

    // ── Photo upload (non-fatal) ──
    let photo_url = null;
    if (photo_base64 && photo_base64.startsWith('data:image/')) {
      try {
        photo_url = await uploadPhoto(supabase, photo_base64);
      } catch (e) {
        console.warn('[Photo skipped]', e.message);
      }
    }

    // ── Save to Supabase ──
    const { data, error } = await supabase
      .from('reports')
      .insert([{
        category,
        severity:        resolvedSeverity,
        description:     (description || 'No description.').slice(0, 300),
        lat:             parseFloat(lat),
        lng:             parseFloat(lng),
        photo_url,
        weather_context,
        confirmations:   0,
      }])
      .select()
      .single();

    if (error) {
      console.error('[Supabase insert error]', error);
      throw new Error(error.message || JSON.stringify(error));
    }

    res.status(201).json({ success: true, report: data, _storage: 'supabase' });

  } catch (err) {
    console.error('[POST /reports]', err.message);
    res.status(500).json({ error: 'Failed to save report: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────
//  PATCH /api/reports/:id/confirm
// ─────────────────────────────────────────────────────────
router.patch('/:id/confirm', async (req, res) => {
  const { id } = req.params;
  const supabase = getSupabase();

  if (!supabase) {
    const report = memStore.find(r => r.id === id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    report.confirmations = (report.confirmations || 0) + 1;
    return res.json({ success: true, report });
  }

  try {
    const { data: current } = await supabase
      .from('reports').select('confirmations').eq('id', id).single();
    if (!current) return res.status(404).json({ error: 'Report not found' });

    const { data, error } = await supabase
      .from('reports')
      .update({ confirmations: (current.confirmations || 0) + 1 })
      .eq('id', id).select().single();
    if (error) throw error;
    res.json({ success: true, report: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
//  PATCH /api/reports/:id/resolve  (admin only)
// ─────────────────────────────────────────────────────────
const { verifyAdminToken } = require('../middleware/auth');

router.patch('/:id/resolve', verifyAdminToken, async (req, res) => {
  const { id } = req.params;
  const supabase = getSupabase();

  if (!supabase) {
    const report = memStore.find(r => r.id === id);
    if (!report) return res.status(404).json({ error: 'Report not found' });
    report.severity    = 'resolved';
    report.resolved_at = new Date().toISOString();
    return res.json({ success: true, report });
  }

  try {
    const { data, error } = await supabase
      .from('reports')
      .update({ severity: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Report not found' });
    res.json({ success: true, report: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────
//  GET /api/status  — tells frontend what's configured
// ─────────────────────────────────────────────────────────
router.get('/status', (req, res) => {
  res.json({
    storage:  isSupabaseConfigured() ? 'supabase' : 'memory',
    weather:  !!(process.env.OPENWEATHER_KEY &&
                 process.env.OPENWEATHER_KEY !== 'your_openweather_api_key_here'),
    reports:  isSupabaseConfigured() ? null : memStore.length,
  });
});

// ─────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────
async function uploadPhoto(supabase, base64String) {
  const matches = base64String.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid base64 image');

  const mimeType  = matches[1];
  const buffer    = Buffer.from(matches[2], 'base64');
  const ext       = mimeType.split('/')[1] || 'jpg';
  const filename  = `report_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('report-photos')
    .upload(filename, buffer, { contentType: mimeType, upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from('report-photos').getPublicUrl(filename);
  return data.publicUrl;
}

async function getWeatherContext(lat, lng) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.OPENWEATHER_KEY}&units=metric`;
  const r = await fetch(url, { timeout: 4000 });
  if (!r.ok) throw new Error('OWM ' + r.status);
  const d = await r.json();
  return [d.weather?.[0]?.description, d.main?.temp ? Math.round(d.main.temp) + '°C' : '']
    .filter(Boolean).join(', ');
}

module.exports = router;
