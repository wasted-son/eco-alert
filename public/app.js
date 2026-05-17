// ═══════════════════════════════════════════════════════
//  EcoAlert — App Entry Point
//  Bootstraps all modules and wires interactions together
// ═══════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {

  // 1. Init map (GPS locate + tile layer)
  MapModule.init();

  // 2. Init report form
  ReportModule.init();

  // 3. Init weather panel
  WeatherModule.init();

  // 4. Init admin panel
  AdminModule.init();

  // 5. Start live polling for reports
  RealtimeModule.start();

  // 6. Wire pin click → detail panel
  MapModule.onPinClick(showPinDetail);

  // ── PIN DETAIL PANEL ──────────────────────────────
  function showPinDetail(report) {
    const panel = document.getElementById('pin-detail');
    const body  = document.getElementById('pin-detail-body');
    const cat   = CONFIG.CATEGORIES.find(c => c.id === report.category) || { emoji: '📌', label: report.category };
    const time  = MapModule.formatTimeAgo(report.created_at);
    const sev   = report.severity || 'moderate';

    body.innerHTML = `
      <span class="pin-severity ${sev}">${sev.toUpperCase()}</span>
      <div class="pin-category">${cat.emoji} ${cat.label}</div>
      ${report.photo_url
        ? `<img class="pin-photo" src="${report.photo_url}" alt="Report photo" />`
        : ''}
      <div class="pin-description">${escapeHtml(report.description)}</div>
      <div class="pin-meta">📍 ${report.lat?.toFixed(5)}, ${report.lng?.toFixed(5)} · ⏱ ${time}</div>
      ${report.weather_context
        ? `<div class="pin-meta" style="color:var(--blue)">🌤 ${escapeHtml(report.weather_context)}</div>`
        : ''}
      ${report.confirmations > 0
        ? `<div class="pin-meta" style="color:var(--amber)">👥 ${report.confirmations} confirmation${report.confirmations !== 1 ? 's' : ''}</div>`
        : ''}
      <div class="pin-actions">
        ${sev !== 'resolved' ? `
          <button class="btn-confirm" id="btn-confirm-pin" data-id="${report.id}">
            👍 Confirm Issue
          </button>
          <button class="btn-resolve" id="btn-resolve-pin" data-id="${report.id}">
            ✅ Mark Resolved
          </button>
        ` : `
          <div style="color:var(--green);font-size:13px;text-align:center;width:100%;">
            ✅ This issue has been resolved.
          </div>
        `}
      </div>
    `;

    panel.classList.remove('hidden');

    // Confirm button — anyone can confirm
    const confirmBtn = document.getElementById('btn-confirm-pin');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => confirmReport(report.id, confirmBtn));
    }

    // Resolve button — admin only
    const resolveBtn = document.getElementById('btn-resolve-pin');
    if (resolveBtn) {
      resolveBtn.addEventListener('click', () => {
        AdminModule.resolveFromPin(report.id);
      });
    }
  }

  // ── Confirm report (public, no login) ─────────────
  async function confirmReport(id, btn) {
    btn.textContent = '⏳ Confirming…';
    btn.disabled = true;

    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/reports/${id}/confirm`, {
        method: 'PATCH',
      });

      if (!res.ok) throw new Error();

      btn.textContent = '✅ Confirmed!';
      setTimeout(() => RealtimeModule.refresh(), 500);

    } catch {
      btn.textContent = '❌ Retry';
      btn.disabled = false;
    }
  }

  // ── Close pin detail ───────────────────────────────
  document.getElementById('pin-close').addEventListener('click', () => {
    document.getElementById('pin-detail').classList.add('hidden');
  });

  // ── Utility ───────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  console.log('%c🌍 EcoAlert loaded', 'color:#3fb950;font-size:16px;font-weight:bold;');
});
