// ═══════════════════════════════════════════════════════
//  EcoAlert — Express Backend (API only)
//  Frontend lives in its own folder — open index.html
//  directly in browser or via VS Code Live Server.
// ═══════════════════════════════════════════════════════

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env'), override: true });

const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');

const reportsRouter = require('./routes/reports');
const adminRouter   = require('./routes/admin');
const weatherRouter = require('./routes/weather');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── CORS ─────────────────────────────────────────────────
// Dev: allow ALL origins so frontend (file:// or any port)
//      can call the backend freely.
// Prod: set ALLOWED_ORIGIN env var to lock down.
const isProd = process.env.NODE_ENV === 'production';
app.use(cors({
  origin: isProd ? (process.env.ALLOWED_ORIGIN || '*') : '*',
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── BODY PARSING ─────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// ── RATE LIMITING ─────────────────────────────────────────
const submitLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: { error: 'Too many reports. Please wait 10 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── ROUTES ────────────────────────────────────────────────
app.use('/api/reports', submitLimiter, reportsRouter);
app.use('/api/admin',   adminRouter);
app.use('/api',         weatherRouter);

// ── HEALTH CHECK ──────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'EcoAlert API' });
});

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.path}` });
});

// ── ERROR HANDLER ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── START ─────────────────────────────────────────────────
startServer();

async function startServer() {
  await validateSupabaseStartup();

  app.listen(PORT, () => {
    console.log('\n🌍 EcoAlert API  →  http://localhost:' + PORT);
    console.log('   Health check  →  http://localhost:' + PORT + '/health');
    console.log('   Open frontend →  open frontend/index.html in your browser\n');
    printStartupStatus();
  });
}

async function validateSupabaseStartup() {
  if (typeof reportsRouter.validateSupabase === 'function') {
    await reportsRouter.validateSupabase();
  }
}


// ── STARTUP DIAGNOSTIC ───────────────────────────────────
// Printed when you run `npm start` so you know immediately
// what is and isn't configured.
function printStartupStatus() {
  const checks = {
    'Supabase URL':      process.env.SUPABASE_URL && process.env.SUPABASE_URL !== 'https://your-project-id.supabase.co',
    'Supabase Key':      process.env.SUPABASE_SERVICE_KEY && process.env.SUPABASE_SERVICE_KEY !== 'your_supabase_service_role_key_here',
    'OpenWeather Key':   process.env.OPENWEATHER_KEY && process.env.OPENWEATHER_KEY !== 'your_openweather_api_key_here',
    'Admin Password':    process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD !== 'change_this_to_a_strong_password',
    'JWT Secret':        process.env.JWT_SECRET && process.env.JWT_SECRET !== 'change_this_to_a_random_64char_string_12345678901234567890',
  };

  console.log('\n┌─────────────────────────────────────────┐');
  console.log('│         EcoAlert Configuration          │');
  console.log('├─────────────────────────────────────────┤');
  Object.entries(checks).forEach(([name, ok]) => {
    const icon = ok ? '✅' : '⚠️ ';
    const pad  = ' '.repeat(Math.max(0, 22 - name.length));
    console.log(`│  ${icon}  ${name}${pad}│`);
  });

  const dbOk = checks['Supabase URL'] && checks['Supabase Key'];
  const invalidSupabase = typeof reportsRouter.isSupabaseHealthy === 'function' && reportsRouter.isSupabaseHealthy() === false;

  console.log('├─────────────────────────────────────────┤');
  if (dbOk && !invalidSupabase) {
    console.log('│  Storage: 💾 Supabase (persistent)                │');
  } else if (dbOk && invalidSupabase) {
    console.log('│  Storage: 🧠 Memory only (Supabase invalid)       │');
  } else {
    console.log('│  Storage: 🧠 Memory only (restart = data lost)    │');
  }
  console.log('└─────────────────────────────────────────┘');

  if (!dbOk) {
    console.log('\n  ℹ️  Reports will save to memory and appear on the map.');
    console.log('  ℹ️  To persist data, add Supabase keys to your .env file.\n');
  } else if (invalidSupabase) {
    console.log('\n  ❌ Supabase credentials are invalid.');
    console.log('  ℹ️  Reports will save to memory until credentials are fixed.\n');
  }
}
