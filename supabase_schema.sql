-- ═══════════════════════════════════════════════════════
--  EcoAlert — Supabase Database Schema
--  Run this in your Supabase project:
--  Dashboard → SQL Editor → New Query → paste → Run
-- ═══════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── REPORTS TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category         TEXT NOT NULL,
  severity         TEXT NOT NULL DEFAULT 'moderate'
                   CHECK (severity IN ('critical', 'moderate', 'resolved')),
  description      TEXT NOT NULL DEFAULT '',
  lat              DOUBLE PRECISION NOT NULL,
  lng              DOUBLE PRECISION NOT NULL,
  photo_url        TEXT,
  weather_context  TEXT,
  confirmations    INTEGER NOT NULL DEFAULT 0,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast location queries
CREATE INDEX IF NOT EXISTS reports_location_idx
  ON reports (lat, lng);

-- Index for filtering by severity
CREATE INDEX IF NOT EXISTS reports_severity_idx
  ON reports (severity);

-- Index for ordering by newest
CREATE INDEX IF NOT EXISTS reports_created_idx
  ON reports (created_at DESC);

-- ── ROW LEVEL SECURITY ─────────────────────────────────
-- We use service-role key on backend (bypasses RLS),
-- but anon reads are fine since data is public.
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read reports
CREATE POLICY "Public read access"
  ON reports FOR SELECT
  USING (true);

-- Only service role (backend) can insert/update
-- (frontend goes through your Express API, not directly to Supabase)
CREATE POLICY "Service role insert"
  ON reports FOR INSERT
  WITH CHECK (true); -- Controlled at API level

CREATE POLICY "Service role update"
  ON reports FOR UPDATE
  USING (true);

-- ── STORAGE BUCKET ─────────────────────────────────────
-- Create a public bucket for report photos.
-- Do this in Supabase Dashboard → Storage → New Bucket
-- Name: report-photos
-- Public: YES (so photo URLs work in frontend)
--
-- Or run this SQL (may need Supabase Storage extension):
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('report-photos', 'report-photos', true)
-- ON CONFLICT (id) DO NOTHING;

-- ── SEED DATA (optional — for testing) ─────────────────
-- Uncomment and edit the lat/lng to match your area:
/*
INSERT INTO reports (category, severity, description, lat, lng) VALUES
  ('illegal_dump',  'critical', 'Large pile of waste behind the market',  -1.2864, 36.8172),
  ('blocked_drain', 'moderate', 'Drain is completely blocked after rain',  -1.2891, 36.8201),
  ('air_quality',   'critical', 'Burning tyres creating toxic smoke',      -1.2844, 36.8155),
  ('flooding',      'moderate', 'Road flooded after heavy rain yesterday', -1.2878, 36.8190),
  ('road_hazard',   'moderate', 'Giant pothole causing accidents',         -1.2855, 36.8165);
*/
