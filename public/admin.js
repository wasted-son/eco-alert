// ═══════════════════════════════════════════════════════
//  EcoAlert — Admin Module
//  Authorities / volunteers log in to resolve reports.
//  Fixed: login form properly hides, panel shows on success
// ═══════════════════════════════════════════════════════

const AdminModule = (() => {
  let isLoggedIn = false;
  let adminToken = null;

  // ── Helpers ────────────────────────────────────────
  const el = (id) => document.getElementById(id);

  // ── Open modal ─────────────────────────────────────
  function openModal() {
    el('admin-modal').classList.remove('hidden');

    if (isLoggedIn) {
      // Already logged in → go straight to panel
      showLoginForm(false);
      showAdminPanel(true);
      loadReports();
    } else {
      // Show login form, hide panel
      showLoginForm(true);
      showAdminPanel(false);
      el('admin-error').classList.add('hidden');
      el('admin-password').value = '';
    }
  }

  function closeModal() {
    el('admin-modal').classList.add('hidden');
  }

  function showLoginForm(visible) {
    el('admin-login-section').classList.toggle('hidden', !visible);
  }

  function showAdminPanel(visible) {
    el('admin-panel').classList.toggle('hidden', !visible);
  }

  // ── Login ──────────────────────────────────────────
  async function login() {
    const pw = el('admin-password').value.trim();
    if (!pw) return;

    const loginBtn = el('btn-admin-login');
    loginBtn.textContent = 'Logging in…';
    loginBtn.disabled    = true;
    el('admin-error').classList.add('hidden');

    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/admin/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ password: pw }),
      });

      let data = {};
      try { data = await res.json(); } catch (_) {}

      if (!res.ok) throw new Error(data.error || 'Wrong password');

      // ✅ Login success
      isLoggedIn = true;
      adminToken = data.token;

      // Hide login form, show panel
      showLoginForm(false);
      showAdminPanel(true);
      loadReports();

    } catch (err) {
      el('admin-error').textContent = `❌ ${err.message}`;
      el('admin-error').classList.remove('hidden');
    } finally {
      loginBtn.textContent = 'Login';
      loginBtn.disabled    = false;
    }
  }

  // ── Load reports into panel ────────────────────────
  async function loadReports() {
    const listEl = el('admin-reports-list');
    listEl.innerHTML = '<p class="no-reports">Loading reports…</p>';

    try {
      const res     = await fetch(`${CONFIG.API_BASE}/api/reports`);
      const reports = await res.json();
      const pending = reports.filter(r => r.severity !== 'resolved');

      if (pending.length === 0) {
        listEl.innerHTML = '<p class="no-reports">✅ No active reports — all clear!</p>';
        return;
      }

      listEl.innerHTML = '';
      pending.forEach(report => {
        const cat  = CONFIG.CATEGORIES.find(c => c.id === report.category)
                     || { emoji: '📌', label: report.category };
        const card = document.createElement('div');
        card.className = 'admin-report-card';

        const severityColor = report.severity === 'critical' ? 'var(--red)' : 'var(--amber)';

        card.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">
            <h4 style="font-size:14px;">${cat.emoji} ${cat.label}</h4>
            <span style="font-family:'Space Mono',monospace;font-size:10px;color:${severityColor};
                         border:1px solid ${severityColor};padding:2px 8px;border-radius:20px;">
              ${report.severity?.toUpperCase()}
            </span>
          </div>
          <p style="font-size:12px;color:var(--text-muted);margin-bottom:6px;line-height:1.4;">
            ${escapeHtml(report.description)}
          </p>
          <p style="font-family:'Space Mono',monospace;font-size:10px;color:var(--border);margin-bottom:10px;">
            ${MapModule.formatTimeAgo(report.created_at)} · 
            ${report.lat?.toFixed(4)}, ${report.lng?.toFixed(4)}
          </p>
          <button class="btn-admin-resolve" data-id="${report.id}">✅ Mark Resolved</button>
        `;
        listEl.appendChild(card);
      });

      listEl.querySelectorAll('.btn-admin-resolve').forEach(btn => {
        btn.addEventListener('click', () => resolveReport(btn.dataset.id, btn));
      });

    } catch (err) {
      listEl.innerHTML = `<p class="no-reports" style="color:var(--red)">Error: ${err.message}</p>`;
    }
  }

  // ── Resolve a report ──────────────────────────────
  async function resolveReport(id, btn) {
    btn.textContent = 'Resolving…';
    btn.disabled    = true;

    try {
      const res = await fetch(`${CONFIG.API_BASE}/api/reports/${id}/resolve`, {
        method:  'PATCH',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Status ${res.status}`);
      }

      btn.textContent  = '✅ Resolved!';
      btn.style.opacity = '0.5';

      setTimeout(() => {
        RealtimeModule.refresh();
        loadReports();
      }, 800);

    } catch (err) {
      btn.textContent = `❌ Retry (${err.message})`;
      btn.disabled    = false;
    }
  }

  // ── Logout ─────────────────────────────────────────
  function logout() {
    isLoggedIn = false;
    adminToken = null;
    showLoginForm(true);
    showAdminPanel(false);
    el('admin-password').value = '';
    el('admin-error').classList.add('hidden');
  }

  // ── Called from pin detail panel ───────────────────
  async function resolveFromPin(id) {
    if (!isLoggedIn) {
      // Close pin panel, open admin login
      document.getElementById('pin-detail').classList.add('hidden');
      openModal();
      return;
    }

    // Fake button object for resolveReport
    const fakeBtn = { textContent: '', disabled: false, style: {} };
    await resolveReport(id, fakeBtn);
    RealtimeModule.refresh();
  }

  // ── Utility ────────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── Init ───────────────────────────────────────────
  function init() {
    el('btn-admin-toggle').addEventListener('click', openModal);
    el('admin-close').addEventListener('click', closeModal);
    el('admin-backdrop').addEventListener('click', closeModal);
    el('btn-admin-login').addEventListener('click', login);
    el('btn-logout').addEventListener('click', logout);
    el('admin-password').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') login();
    });
  }

  return { init, openModal, closeModal, resolveFromPin, isLoggedIn: () => isLoggedIn };
})();
