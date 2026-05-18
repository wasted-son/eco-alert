// ═══════════════════════════════════════════════════════
//  EcoAlert — Report Module
//  Fixed: submit works even without Supabase configured.
//         Shows exact error so you always know what's wrong.
// ═══════════════════════════════════════════════════════

const ReportModule = (() => {
  let selectedCategory = null;
  let photoBase64      = null;
  let pinnedLat        = null;
  let pinnedLng        = null;

  // ── Build category grid ────────────────────────────
  function buildCategoryGrid() {
    const grid = document.getElementById('category-grid');
    grid.innerHTML = '';
    CONFIG.CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.className  = 'category-btn';
      btn.dataset.id = cat.id;
      btn.type       = 'button';
      btn.innerHTML  = `<span class="category-emoji">${cat.emoji}</span><span>${cat.label}</span>`;
      btn.addEventListener('click', () => selectCategory(cat));
      grid.appendChild(btn);
    });
  }

  function selectCategory(cat) {
    selectedCategory = cat;
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'));
    document.querySelector(`.category-btn[data-id="${cat.id}"]`).classList.add('selected');
    checkReady();
  }

  // ── Photo ──────────────────────────────────────────
  function initPhoto() {
    const area        = document.getElementById('photo-area');
    const input       = document.getElementById('photo-input');
    const placeholder = document.getElementById('photo-placeholder');
    const preview     = document.getElementById('photo-preview');

    area.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let w = img.width, h = img.height, MAX = 800;
          if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
          if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          photoBase64 = canvas.toDataURL('image/jpeg', 0.7);
          preview.src = photoBase64;
          preview.classList.remove('hidden');
          placeholder.classList.add('hidden');
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ── Location ───────────────────────────────────────
  function updateLocation(lat, lng) {
    document.querySelector('.loc-dot').classList.remove('pulsing');
    document.getElementById('location-text').textContent =
      `${parseFloat(lat).toFixed(5)}°, ${parseFloat(lng).toFixed(5)}°`;
  }

  function checkReady() {
    document.getElementById('btn-submit-report').disabled = !selectedCategory;
  }

  // ── Show error in modal ────────────────────────────
  function showError(msg) {
    const el = document.getElementById('submit-error');
    el.innerHTML = `❌ ${msg}`;
    el.classList.remove('hidden');
  }

  function clearMessages() {
    document.getElementById('submit-error').classList.add('hidden');
    document.getElementById('submit-success').classList.add('hidden');
  }

  // ── Open modal ─────────────────────────────────────
  function openModal() {
    const loc = MapModule.getUserLocation();
    pinnedLat = loc.lat;
    pinnedLng = loc.lng;
    updateLocation(pinnedLat, pinnedLng);

    selectedCategory = null;
    photoBase64      = null;
    document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('photo-preview').classList.add('hidden');
    document.getElementById('photo-placeholder').classList.remove('hidden');
    document.getElementById('photo-input').value        = '';
    document.getElementById('report-description').value = '';
    document.getElementById('char-remaining').textContent = '300';
    clearMessages();
    checkReady();
    document.getElementById('report-modal').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('report-modal').classList.add('hidden');
  }

  // ── Submit ─────────────────────────────────────────
  async function submitReport() {
    clearMessages();

    // ── Pre-flight checks before even hitting the network ──
    if (!selectedCategory) {
      showError('Please select a category first.');
      return;
    }

    const loc = MapModule.getUserLocation();
    const lat = (pinnedLat != null) ? pinnedLat : loc.lat;
    const lng = (pinnedLng != null) ? pinnedLng : loc.lng;

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      showError('Location not detected yet. Wait a moment for GPS or tap the map to pin your location.');
      return;
    }

    const description = document.getElementById('report-description').value.trim();

    // ── UI: loading ────────────────────────────────────
    const submitBtn     = document.getElementById('btn-submit-report');
    const submitLabel   = document.getElementById('submit-label');
    const submitSpinner = document.getElementById('submit-spinner');
    submitBtn.disabled  = true;
    submitLabel.classList.add('hidden');
    submitSpinner.classList.remove('hidden');

    const payload = {
      category:         selectedCategory.id,
      severity:         selectedCategory.severity,
      description:      description || 'No description provided.',
      lat:              lat,
      lng:              lng,
      photo_base64:     photoBase64 || null,
      weather_category: selectedCategory.weather || false,
    };

    try {
      // ── Check backend is reachable first ────────────
      let res;
      try {
        res = await fetch(`${CONFIG.API_BASE}/api/reports`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
      } catch (networkErr) {
        // fetch() itself threw — backend is not reachable
        throw new Error(
          `Cannot reach the backend at ${CONFIG.API_BASE}. ` +
          `Make sure the backend is running: cd backend && npm start`
        );
      }

      // ── Parse response ─────────────────────────────
      let data = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        const rawText = await res.text().catch(() => '');
        if (rawText) {
          throw new Error(`Server returned status ${res.status} with body: ${rawText}`);
        }
        throw new Error(`Server returned status ${res.status} with no JSON body.`);
      }

      if (!res.ok) {
        // Server returned 4xx/5xx — show the exact error message
        throw new Error(data.error || `Server error ${res.status}`);
      }

      // ── Success! ───────────────────────────────────
      const storageNote = data._storage === 'memory'
        ? ' (saved to memory — set up Supabase for persistence)'
        : '';

      document.getElementById('submit-success').innerHTML =
        `✅ Report submitted!${storageNote} Pin dropping on map now.`;
      document.getElementById('submit-success').classList.remove('hidden');

      if (data.report) MapModule.upsertPin(data.report);
      RealtimeModule.refresh();
      setTimeout(closeModal, 3000);

    } catch (err) {
      showError(err.message);
    } finally {
      submitBtn.disabled = false;
      submitLabel.classList.remove('hidden');
      submitSpinner.classList.add('hidden');
    }
  }

  // ── Init ───────────────────────────────────────────
  function init() {
    buildCategoryGrid();
    initPhoto();

    document.getElementById('fab-report').addEventListener('click', openModal);
    document.getElementById('modal-close').addEventListener('click', closeModal);
    document.getElementById('modal-backdrop').addEventListener('click', closeModal);
    document.getElementById('btn-submit-report').addEventListener('click', submitReport);

    document.getElementById('report-description').addEventListener('input', e => {
      document.getElementById('char-remaining').textContent = 300 - e.target.value.length;
    });

    MapModule.onMapClick((lat, lng) => {
      pinnedLat = lat;
      pinnedLng = lng;
      updateLocation(lat, lng);
    });
  }

  return { init, openModal, closeModal };
})();
