// ═══════════════════════════════════════════════════════
//  EcoAlert — Map Module
//  Handles: Leaflet init, GPS, pins, marker icons
// ═══════════════════════════════════════════════════════

const MapModule = (() => {
  let map = null;
  let markers = {}; // reportId → Leaflet marker
  let userMarker = null;
  let userLat = CONFIG.DEFAULT_LAT;
  let userLng = CONFIG.DEFAULT_LNG;
  let pinClickCallback = null;
  let mapClickCallback = null;

  // ── Custom marker icon ─────────────────────────────
  function createMarkerIcon(severity) {
    const colours = {
      critical: '#f85149',
      moderate: '#d29922',
      resolved: '#3fb950',
    };
    const c = colours[severity] || colours.moderate;

    return L.divIcon({
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -28],
      html: `
        <div style="
          position:relative;
          width:24px;height:24px;
        ">
          <div style="
            width:24px;height:24px;
            background:${c};
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            border:2px solid rgba(255,255,255,0.4);
            box-shadow:0 2px 8px rgba(0,0,0,0.6);
          "></div>
          <div style="
            position:absolute;
            top:-6px;left:-6px;
            width:36px;height:36px;
            border-radius:50%;
            border:2px solid ${c};
            animation:ring-pulse 2s ease-out infinite;
            opacity:0;
          "></div>
        </div>
        <style>
          @keyframes ring-pulse{
            0%{opacity:.7;transform:scale(.7)}
            100%{opacity:0;transform:scale(1.8)}
          }
        </style>
      `,
    });
  }

  // ── User location marker ───────────────────────────
  function createUserIcon() {
    return L.divIcon({
      className: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      html: `<div style="
        width:16px;height:16px;
        border-radius:50%;
        background:#58a6ff;
        border:3px solid #fff;
        box-shadow:0 0 0 3px rgba(88,166,255,0.3);
      "></div>`,
    });
  }

  // ── Init map ───────────────────────────────────────
  function init() {
    map = L.map('map', {
      center: [CONFIG.DEFAULT_LAT, CONFIG.DEFAULT_LNG],
      zoom: CONFIG.DEFAULT_ZOOM,
      zoomControl: false,
    });

    // OpenStreetMap tiles — completely free
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Move zoom control
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Map click for custom pin placement
    map.on('click', (e) => {
      if (mapClickCallback) mapClickCallback(e.latlng.lat, e.latlng.lng);
    });

    locateUser();
  }

  // ── GPS locate user ────────────────────────────────
  function locateUser() {
    const overlay = document.getElementById('gps-overlay');

    if (!navigator.geolocation) {
      overlay.classList.add('hidden');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;

        map.setView([userLat, userLng], CONFIG.DEFAULT_ZOOM);

        // Place blue user dot
        if (userMarker) userMarker.remove();
        userMarker = L.marker([userLat, userLng], { icon: createUserIcon() })
          .addTo(map)
          .bindPopup('<b>You are here</b>');

        overlay.classList.add('hidden');
      },
      () => {
        // GPS denied or unavailable — just hide overlay and use default
        overlay.classList.add('hidden');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  }

  // ── Add / update a pin ─────────────────────────────
  function upsertPin(report) {
    const { id, lat, lng, severity, category, description, created_at, photo_url, confirmations } = report;

    const icon = createMarkerIcon(severity);
    const catInfo = CONFIG.CATEGORIES.find(c => c.id === category) || { emoji: '📌', label: category };
    const timeAgo = formatTimeAgo(created_at);

    if (markers[id]) {
      markers[id].setLatLng([lat, lng]);
      markers[id].setIcon(icon);
    } else {
      const marker = L.marker([lat, lng], { icon }).addTo(map);

      marker.on('click', () => {
        if (pinClickCallback) pinClickCallback(report);
      });

      markers[id] = marker;
    }

    // Store current report data on the marker for later access
    markers[id]._reportData = report;
  }

  // ── Remove a pin ───────────────────────────────────
  function removePin(id) {
    if (markers[id]) {
      markers[id].remove();
      delete markers[id];
    }
  }

  // ── Render all reports ─────────────────────────────
  function renderReports(reports) {
    const currentIds = new Set(reports.map(r => r.id));

    // Remove stale pins
    Object.keys(markers).forEach(id => {
      if (!currentIds.has(id)) removePin(id);
    });

    // Add/update pins
    reports.forEach(upsertPin);
  }

  // ── Helpers ────────────────────────────────────────
  function formatTimeAgo(iso) {
    if (!iso) return 'just now';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  // ── Public API ─────────────────────────────────────
  return {
    init,
    renderReports,
    upsertPin,
    removePin,
    getUserLocation: () => ({ lat: userLat, lng: userLng }),
    onPinClick: (cb) => { pinClickCallback = cb; },
    onMapClick: (cb) => { mapClickCallback = cb; },
    getMap: () => map,
    formatTimeAgo,
  };
})();
