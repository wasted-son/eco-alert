// ═══════════════════════════════════════════════════════
//  EcoAlert — Realtime Module
//  Polls backend every N seconds for new/updated reports
//  and updates map pins + dashboard stats instantly.
//  (No WebSocket needed; polling works great for this scale)
// ═══════════════════════════════════════════════════════

const RealtimeModule = (() => {
  let pollTimer = null;
  let lastFetchTime = null;

  // ── Fetch all reports from backend ─────────────────
  async function fetchReports() {
    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/reports`);
      if (!res.ok) throw new Error('Fetch failed');
      return await res.json(); // array of report objects
    } catch (err) {
      console.warn('[Realtime] Fetch error:', err.message);
      return null;
    }
  }

  // ── Update dashboard stats ─────────────────────────
  function updateStats(reports) {
    const total    = reports.length;
    const critical = reports.filter(r => r.severity === 'critical').length;
    const moderate = reports.filter(r => r.severity === 'moderate').length;
    const resolved = reports.filter(r => r.severity === 'resolved').length;

    document.getElementById('count-total').textContent    = total;
    document.getElementById('count-critical').textContent = critical;
    document.getElementById('count-moderate').textContent = moderate;
    document.getElementById('count-resolved').textContent = resolved;
  }

  // ── One poll cycle ─────────────────────────────────
  async function poll() {
    const reports = await fetchReports();
    if (!reports) return;

    MapModule.renderReports(reports);
    updateStats(reports);
    lastFetchTime = Date.now();
  }

  // ── Start polling ──────────────────────────────────
  function start() {
    poll(); // immediate first load
    pollTimer = setInterval(poll, CONFIG.POLL_INTERVAL);
  }

  function stop() {
    if (pollTimer) clearInterval(pollTimer);
  }

  // ── Force a one-off refresh (e.g. after submit) ────
  function refresh() {
    poll();
  }

  return { start, stop, refresh };
})();
