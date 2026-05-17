// ═══════════════════════════════════════════════════════
//  EcoAlert — Supabase Client
//  Uses the service-role key for backend operations.
//  The anon key is only for client-side if needed.
// ═══════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY, // service key bypasses RLS for backend
  {
    auth: { persistSession: false },
  }
);

module.exports = supabase;
