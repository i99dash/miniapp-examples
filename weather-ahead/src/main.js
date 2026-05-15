// Weather Ahead — main entry.
//
// Data flow:
//   1. MiniAppClient.fromWindow() — read host context (locale + theme).
//   2. client.location.getSnapshot() — initial lat/lng for first fetch.
//   3. fetchWeather(lat, lng) — Open-Meteo hourly forecast (24h).
//   4. Render header (now), three ahead-cards (T+30/60/90), precip SVG
//      chart (6h), and detail row (wind/humidity/UV).
//   5. client.location.onChange — debounced to 5 min; re-fetches when
//      the vehicle has moved significantly.
//   6. Manual refresh button — immediate re-fetch.
//
// No localStorage needed for v1. State is in-memory only.

import {
  MiniAppClient,
  NotInsideHostError,
  LocationUnavailableError,
} from 'i99dash';

// ── Location helper ──────────────────────────────────────────────
//
// Mini-apps used to call client.location.getSnapshot() / onChange()
// — that path went through a bespoke host bridge that was never
// wired up. The host now grants the standard browser
// `navigator.geolocation` API to mini-apps that declare
// `location.read` in their manifest, so we use the standard API
// directly. Wraps each callback into the same {lat, lng, …} shape
// the existing applyLocation() expects so the rest of the file
// doesn't need to know about the swap.
function _toSnapshot(p) {
  return {
    lat: p.coords.latitude,
    lng: p.coords.longitude,
    heading:
      typeof p.coords.heading === 'number' && !Number.isNaN(p.coords.heading)
        ? p.coords.heading
        : null,
    speedMps:
      typeof p.coords.speed === 'number' && !Number.isNaN(p.coords.speed)
        ? p.coords.speed
        : null,
    accuracyM:
      typeof p.coords.accuracy === 'number' && Number.isFinite(p.coords.accuracy)
        ? p.coords.accuracy
        : null,
    at: new Date(p.timestamp).toISOString(),
  };
}

// Prefer the host bridge — Chromium's `navigator.geolocation` in
// the Leopard 8 WebView times out indefinitely even when the OS
// LocationManager has a fresh fix (verified). The host's
// `location.read` JS handler routes through Geolocator which goes
// straight to LocationManager. Fall back to `navigator.geolocation`
// only when the bridge isn't available (running outside the host,
// dev preview, etc.).
async function getLocationSnapshot() {
  if (
    typeof window !== 'undefined' &&
    window.flutter_inappwebview &&
    typeof window.flutter_inappwebview.callHandler === 'function'
  ) {
    try {
      const raw = await window.flutter_inappwebview.callHandler('location.read');
      if (raw && raw.success === false) {
        throw new LocationUnavailableError(
          (raw.error && raw.error.message) || 'location bridge denied',
        );
      }
      const data = (raw && raw.data) || raw;
      return data;
    } catch (e) {
      throw e instanceof LocationUnavailableError
        ? e
        : new LocationUnavailableError(e.message || String(e));
    }
  }
  // Browser fallback (dev preview).
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return reject(new LocationUnavailableError('navigator.geolocation not available'));
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(_toSnapshot(p)),
      (err) => reject(new LocationUnavailableError(err.message || 'geolocation failed')),
      { enableHighAccuracy: false, timeout: 30_000, maximumAge: 5 * 60_000 },
    );
  });
}

// Poll the bridge instead of `navigator.geolocation.watchPosition`
// — the latter hits Chromium's broken-on-Leopard-8 watch path and
// never fires. 60 s cadence is generous; a moving car only matters
// for re-fetching weather every few minutes anyway.
function watchLocation(cb) {
  let stopped = false;
  let timer = null;
  const tick = async () => {
    if (stopped) return;
    try {
      const snap = await getLocationSnapshot();
      cb(snap);
    } catch (e) {
      console.warn('[weather-ahead] location poll error:', e.message);
    }
    if (!stopped) timer = setTimeout(tick, 60_000);
  };
  // Skip the first tick — caller already fetched the initial fix
  // via getLocationSnapshot() before subscribing. Start the cadence
  // 60 s out so we don't double-fetch on launch.
  timer = setTimeout(tick, 60_000);
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}

// ── Constants ─────────────────────────────────────────────────────

const OPEN_METEO_URL = (lat, lng) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
  `&current=temperature_2m,weather_code,wind_speed_10m` +
  `&hourly=temperature_2m,weather_code,precipitation,relative_humidity_2m,uv_index` +
  `&forecast_hours=24&timezone=auto`;

// Reverse geocode: Nominatim (open, no key needed). Best-effort — if
// it fails the header falls back to coordinate string.
const NOMINATIM_URL = (lat, lng) =>
  `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=10`;

// Minimum seconds between location-triggered re-fetches (5 min).
const LOCATION_DEBOUNCE_MS = 5 * 60 * 1000;

// WMO weather code → emoji + summary text.
// Codes: https://open-meteo.com/en/docs#weathervariables
// Grouped into families for concise mapping. The switch covers all
// WMO 4677 codes Open-Meteo can emit.
function wmoToEmoji(code) {
  if (code === 0) return '☀️';
  if (code <= 2) return '🌤️';
  if (code === 3) return '☁️';
  if (code <= 49) return '🌫️'; // fog / freezing fog / rime
  if (code <= 57) return '🌦️'; // drizzle / freezing drizzle
  if (code <= 67) return '🌧️'; // rain / freezing rain
  if (code <= 77) return '❄️';  // snow / snow grains
  if (code <= 82) return '🌧️'; // rain showers
  if (code <= 86) return '🌨️'; // snow showers
  if (code <= 99) return '⛈️';  // thunderstorm
  return '🌡️';
}

function wmoToSummary(code, locale) {
  const en = summaryEn(code);
  if (locale !== 'ar') return en;
  return summaryAr(code) || en;
}

function summaryEn(code) {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code <= 9) return 'Fog';
  if (code <= 19) return 'Fog';
  if (code <= 29) return 'Fog likely';
  if (code <= 39) return 'Fog';
  if (code <= 49) return 'Fog';
  if (code <= 51) return 'Light drizzle';
  if (code <= 53) return 'Drizzle';
  if (code <= 55) return 'Heavy drizzle';
  if (code <= 57) return 'Freezing drizzle';
  if (code <= 61) return 'Light rain';
  if (code <= 63) return 'Moderate rain';
  if (code <= 65) return 'Heavy rain';
  if (code <= 67) return 'Freezing rain';
  if (code <= 71) return 'Light snow';
  if (code <= 73) return 'Moderate snow';
  if (code <= 75) return 'Heavy snow';
  if (code === 77) return 'Snow grains';
  if (code <= 80) return 'Light showers';
  if (code <= 81) return 'Moderate showers';
  if (code <= 82) return 'Heavy showers';
  if (code <= 86) return 'Snow showers';
  if (code <= 99) return 'Thunderstorm';
  return 'Unknown';
}

function summaryAr(code) {
  if (code === 0) return 'سماء صافية';
  if (code === 1) return 'صافٍ في معظمه';
  if (code === 2) return 'غائم جزئياً';
  if (code === 3) return 'غائم';
  if (code <= 49) return 'ضباب';
  if (code <= 55) return 'رذاذ';
  if (code <= 57) return 'رذاذ متجمد';
  if (code <= 61) return 'مطر خفيف';
  if (code <= 63) return 'مطر معتدل';
  if (code <= 65) return 'مطر غزير';
  if (code <= 67) return 'مطر متجمد';
  if (code <= 75) return 'ثلج';
  if (code === 77) return 'حبيبات ثلج';
  if (code <= 82) return 'زخات مطر';
  if (code <= 86) return 'زخات ثلج';
  if (code <= 99) return 'عاصفة رعدية';
  return null;
}

// Is this WMO code a "rain" event (precipitation likely)?
function isRainCode(code) {
  return (code >= 50 && code <= 67) || (code >= 80 && code <= 82) ||
         (code >= 95 && code <= 99);
}
// Is this WMO code a fog event?
function isFogCode(code) {
  return code >= 10 && code <= 49;
}

// ── State ─────────────────────────────────────────────────────────

let locale = 'en';
let coords = null;          // { lat, lng }
let coordsSource = 'none';  // 'live' | 'fallback' | 'denied' | 'none'
let weatherData = null;     // last successful Open-Meteo response
let lastFetchAt = null;     // Date of last successful fetch
let lastLocationChangeAt = 0; // timestamp for debounce
let fetchInFlight = false;

// ── i18n ──────────────────────────────────────────────────────────

const T = {
  en: {
    title: 'Weather Ahead',
    locating: 'Locating you…',
    locOk: (label) => `Live · ${label}`,
    locFallback: 'Location unavailable — showing fallback',
    locDenied: 'Location not granted',
    fetchErr: 'Could not load weather — tap Refresh',
    refresh: 'Refresh',
    refreshing: 'Refreshing…',
    precipTitle: 'Precipitation — next 6 hours',
    windLabel: 'km/h wind',
    humidityLabel: 'humidity',
    uvLabel: 'UV index',
    aheadLabel: (min) => `T + ${min} min`,
    lastUpdated: (s) => `Updated ${s}`,
    clear: 'Clear',
    rainEta: (min) => `Rain in ~${min} min`,
    fogLikely: 'Fog likely',
  },
  ar: {
    title: 'الطقس على الطريق',
    locating: 'جارٍ تحديد موقعك…',
    locOk: (label) => `مباشر · ${label}`,
    locFallback: 'الموقع غير متاح',
    locDenied: 'لم يُمنح إذن الموقع',
    fetchErr: 'تعذّر تحميل الطقس — اضغط تحديث',
    refresh: 'تحديث',
    refreshing: 'جارٍ التحديث…',
    precipTitle: 'الأمطار — الساعات الست القادمة',
    windLabel: 'كم/س رياح',
    humidityLabel: 'رطوبة',
    uvLabel: 'UV',
    aheadLabel: (min) => `+ ${min} دقيقة`,
    lastUpdated: (s) => `آخر تحديث ${s}`,
    clear: 'صافٍ',
    rainEta: (min) => `مطر خلال ~${min} د`,
    fogLikely: 'ضباب محتمل',
  },
};

function t() { return T[locale] || T.en; }

// ── DOM helpers ───────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

// ── Geocoding ─────────────────────────────────────────────────────

async function reversGeocode(lat, lng) {
  try {
    const r = await fetch(NOMINATIM_URL(lat, lng), {
      headers: { 'Accept-Language': locale },
    });
    if (!r.ok) return null;
    const j = await r.json();
    // Prefer city > town > village > county, in that order.
    return j.address?.city
      || j.address?.town
      || j.address?.village
      || j.address?.county
      || j.address?.state
      || null;
  } catch {
    return null;
  }
}

// ── Fetch ─────────────────────────────────────────────────────────

async function fetchWeather(lat, lng) {
  if (fetchInFlight) return;
  fetchInFlight = true;
  setRefreshLoading(true);
  try {
    const r = await fetch(OPEN_METEO_URL(lat, lng));
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    weatherData = await r.json();
    lastFetchAt = new Date();
    renderAll();
    // Best-effort reverse geocode after first weather fetch — don't
    // await in the main path so weather renders first.
    reversGeocode(lat, lng).then((city) => {
      if (city) $('city-name').textContent = city;
    });
  } catch (e) {
    console.error('Weather fetch error:', e);
    showFetchError();
  } finally {
    fetchInFlight = false;
    setRefreshLoading(false);
    updateLastUpdated();
  }
}

// ── Rendering ─────────────────────────────────────────────────────

function renderAll() {
  if (!weatherData) return;
  hideLoadingOverlay();
  renderNow();
  renderAheadCards();
  renderPrecipChart();
  renderDetails();
}

function renderNow() {
  const c = weatherData.current;
  if (!c) return;
  $('now-temp').textContent = `${Math.round(c.temperature_2m)}°`;
  $('now-icon').textContent = wmoToEmoji(c.weather_code);
  $('now-condition').textContent = wmoToSummary(c.weather_code, locale);
}

// Find the Open-Meteo hourly index closest to (now + offsetMinutes).
// Open-Meteo hourly timestamps are ISO8601 strings. Returns the index
// or null if out of range.
function hourlyIndexAt(hourlyTimes, offsetMinutes) {
  const target = Date.now() + offsetMinutes * 60 * 1000;
  let bestIdx = 0;
  let bestDelta = Infinity;
  for (let i = 0; i < hourlyTimes.length; i++) {
    const d = Math.abs(new Date(hourlyTimes[i]).getTime() - target);
    if (d < bestDelta) { bestDelta = d; bestIdx = i; }
  }
  return bestIdx;
}

function renderAheadCards() {
  const h = weatherData.hourly;
  if (!h) return;
  const nowTemp = weatherData.current?.temperature_2m ?? 0;
  const offsets = [30, 60, 90];
  for (const offset of offsets) {
    const idx = hourlyIndexAt(h.time, offset);
    const temp = Math.round(h.temperature_2m[idx] ?? 0);
    const code = h.weather_code[idx] ?? 0;
    const precip = h.precipitation[idx] ?? 0;
    const delta = temp - Math.round(nowTemp);
    const id = `ahead-${offset}`;
    $(id + '-label').textContent = t().aheadLabel(offset);
    $(id + '-icon').textContent = wmoToEmoji(code);
    $(id + '-temp').textContent = `${temp}°`;
    const deltaEl = $(id + '-delta');
    if (delta > 0) {
      deltaEl.textContent = `(+${delta}°)`;
      deltaEl.className = 'ahead-temp-delta delta-pos';
    } else if (delta < 0) {
      deltaEl.textContent = `(${delta}°)`;
      deltaEl.className = 'ahead-temp-delta delta-neg';
    } else {
      deltaEl.textContent = `(0°)`;
      deltaEl.className = 'ahead-temp-delta delta-zero';
    }
    // Summary line: prefer a rain/fog-specific line if relevant.
    let summary = wmoToSummary(code, locale);
    if (precip > 0.1 && isRainCode(code)) {
      summary = wmoToSummary(code, locale);
    }
    $(id + '-summary').textContent = summary;
    // Alert border classes.
    const card = $(id);
    card.classList.toggle('rain-alert', isRainCode(code) && precip > 0.1);
    card.classList.toggle('fog-alert', isFogCode(code));
  }
}

// ── Precipitation chart ───────────────────────────────────────────
//
// 6-hour SVG bar chart. viewBox 700×100. Layout:
//   * x: 0..700 divided into 6 equal columns (each 700/6 ≈ 116.7px wide)
//   * y: bars grow downward from y=80; max bar height = 70px (maps to
//     4 mm/h). Values above 4 mm/h are clamped so the chart scale
//     stays readable for light-rain scenarios, which are the relevant
//     driving cases.
//   * Grid lines at 0.5 mm/h and 2 mm/h, faint.
//   * Hour labels along y=95.

const CHART_W = 700;
const CHART_BAR_AREA_H = 70; // px available for bars
const CHART_BASE_Y = 80;     // baseline y (bottom of bars)
const MAX_MM = 4;             // mm/h that fills the full bar height
const SVG_NS = 'http://www.w3.org/2000/svg';

function renderPrecipChart() {
  const h = weatherData.hourly;
  if (!h) return;
  $('precip-title').textContent = t().precipTitle;

  // Collect 6 hours starting from the current hour.
  const nowIdx = hourlyIndexAt(h.time, 0);
  const bars = [];
  for (let i = 0; i < 6; i++) {
    const idx = nowIdx + i;
    bars.push({
      mm: h.precipitation[idx] ?? 0,
      label: i === 0 ? (locale === 'ar' ? 'الآن' : 'now') : `+${i}h`,
    });
  }

  const barsGroup = $('precip-bars');
  const labelsGroup = $('precip-labels');
  const gridGroup = $('precip-grid');
  // Clear previous render.
  barsGroup.innerHTML = '';
  labelsGroup.innerHTML = '';
  gridGroup.innerHTML = '';

  const colW = CHART_W / bars.length;

  // Grid lines (faint horizontal) at 1mm and 2mm thresholds.
  for (const mm of [1, 2]) {
    const y = CHART_BASE_Y - (mm / MAX_MM) * CHART_BAR_AREA_H;
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('x2', String(CHART_W));
    line.setAttribute('y1', String(y));
    line.setAttribute('y2', String(y));
    line.setAttribute('stroke', 'currentColor');
    line.setAttribute('stroke-width', '0.8');
    line.setAttribute('opacity', '0.2');
    line.style.color = 'var(--muted)';
    gridGroup.appendChild(line);
    // mm label at left edge.
    const txt = document.createElementNS(SVG_NS, 'text');
    txt.setAttribute('x', '4');
    txt.setAttribute('y', String(y - 2));
    txt.setAttribute('font-size', '9');
    txt.setAttribute('fill', 'var(--muted)');
    txt.setAttribute('opacity', '0.7');
    txt.textContent = `${mm}mm`;
    gridGroup.appendChild(txt);
  }

  // Bars.
  for (let i = 0; i < bars.length; i++) {
    const { mm, label } = bars[i];
    const barH = Math.max(2, Math.min(mm / MAX_MM, 1) * CHART_BAR_AREA_H);
    const x = i * colW + colW * 0.15;
    const w = colW * 0.7;
    const y = CHART_BASE_Y - barH;

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x));
    rect.setAttribute('y', String(y));
    rect.setAttribute('width', String(w));
    rect.setAttribute('height', String(barH));
    rect.setAttribute('rx', '3');
    rect.setAttribute('fill', 'var(--rain)');
    rect.setAttribute('opacity', mm > 0.05 ? '0.85' : '0.2');
    barsGroup.appendChild(rect);

    // mm value label above bar (only if mm > 0.1 to avoid clutter).
    if (mm >= 0.1) {
      const valTxt = document.createElementNS(SVG_NS, 'text');
      valTxt.setAttribute('x', String(x + w / 2));
      valTxt.setAttribute('y', String(y - 3));
      valTxt.setAttribute('text-anchor', 'middle');
      valTxt.setAttribute('font-size', '9');
      valTxt.setAttribute('fill', 'var(--rain)');
      valTxt.setAttribute('font-weight', '700');
      valTxt.textContent = mm.toFixed(1);
      barsGroup.appendChild(valTxt);
    }

    // Hour label below.
    const ltxt = document.createElementNS(SVG_NS, 'text');
    ltxt.setAttribute('x', String(x + w / 2));
    ltxt.setAttribute('y', String(CHART_BASE_Y + 14));
    ltxt.setAttribute('text-anchor', 'middle');
    ltxt.setAttribute('font-size', '11');
    ltxt.setAttribute('fill', 'var(--muted)');
    ltxt.textContent = label;
    labelsGroup.appendChild(ltxt);
  }
}

function renderDetails() {
  const c = weatherData.current;
  const h = weatherData.hourly;
  if (!c) return;
  $('detail-wind').textContent = `${Math.round(c.wind_speed_10m)}`;
  $('detail-wind-label').textContent = t().windLabel;
  $('detail-humidity-label').textContent = t().humidityLabel;
  $('detail-uv-label').textContent = t().uvLabel;

  // Humidity and UV come from hourly at the current-hour index.
  if (h) {
    const nowIdx = hourlyIndexAt(h.time, 0);
    $('detail-humidity').textContent = `${Math.round(h.relative_humidity_2m[nowIdx] ?? 0)}%`;
    $('detail-uv').textContent = (h.uv_index[nowIdx] ?? 0).toFixed(1);
  }
}

// ── UI state helpers ──────────────────────────────────────────────

function setRefreshLoading(on) {
  const btn = $('refresh-btn');
  if (on) {
    btn.classList.add('loading');
    $('refresh-btn-label').textContent = t().refreshing;
  } else {
    btn.classList.remove('loading');
    $('refresh-btn-label').textContent = t().refresh;
  }
}

function hideLoadingOverlay() {
  const ol = $('loading-overlay');
  ol.classList.add('hidden');
  // Remove from DOM after fade so it doesn't block clicks.
  setTimeout(() => { if (ol.parentNode) ol.parentNode.removeChild(ol); }, 500);
}

function showFetchError() {
  const dot = $('loc-dot');
  const status = $('loc-status');
  status.textContent = t().fetchErr;
  status.className = 'status-text err';
  if ($('loading-overlay') && !$('loading-overlay').classList.contains('hidden')) {
    $('loading-msg').textContent = t().fetchErr;
  }
}

function updateLastUpdated() {
  if (!lastFetchAt) { $('last-updated').textContent = ''; return; }
  const diffMin = Math.round((Date.now() - lastFetchAt.getTime()) / 60000);
  const s = diffMin <= 0 ? (locale === 'ar' ? 'الآن' : 'just now') : `${diffMin} min ago`;
  $('last-updated').textContent = t().lastUpdated(s);
}

function renderLocationStatus() {
  const dot = $('loc-dot');
  const status = $('loc-status');
  status.className = 'status-text';
  if (coordsSource === 'live' && coords) {
    dot.className = 'dot live';
    status.textContent = t().locOk(
      `${coords.lat.toFixed(3)}°, ${coords.lng.toFixed(3)}°`
    );
  } else if (coordsSource === 'denied') {
    dot.className = 'dot';
    status.className = 'status-text warn';
    status.textContent = t().locDenied;
  } else {
    dot.className = 'dot';
    status.textContent = t().locFallback;
  }
}

function renderHeader() {
  document.documentElement.lang = locale === 'ar' ? 'ar' : 'en';
  document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
  $('city-name').textContent = t().title;
  $('refresh-btn-label').textContent = t().refresh;
}

function applyTheme(isDark) {
  document.body.dataset.theme = isDark ? 'dark' : 'light';
}

// ── Location handling ─────────────────────────────────────────────

function applyLocation(snapshot) {
  if (!snapshot || typeof snapshot.lat !== 'number') return;
  coords = { lat: snapshot.lat, lng: snapshot.lng };
  coordsSource = 'live';
  renderLocationStatus();
  const now = Date.now();
  // Debounce: only re-fetch if we haven't fetched in the last 5 min.
  if (now - lastLocationChangeAt < LOCATION_DEBOUNCE_MS && weatherData) return;
  lastLocationChangeAt = now;
  fetchWeather(coords.lat, coords.lng);
}

// ── Bootstrap ─────────────────────────────────────────────────────

async function main() {
  let client;
  try {
    client = MiniAppClient.fromWindow();
  } catch (e) {
    if (e instanceof NotInsideHostError) {
      console.warn('Running outside host — using fallback location.');
      coordsSource = 'fallback';
      // Riyadh as fallback — neutral, car-centric city.
      coords = { lat: 24.774265, lng: 46.738586 };
      renderHeader();
      renderLocationStatus();
      fetchWeather(coords.lat, coords.lng);
      return;
    }
    throw e;
  }

  try {
    const ctx = await client.getContext();
    locale = ctx.locale && ctx.locale.startsWith('ar') ? 'ar' : 'en';
    applyTheme(!!ctx.isDark);
  } catch (e) {
    console.warn('getContext failed; defaulting to en + light', e);
  }

  renderHeader();
  $('loading-msg').textContent = t().locating;

  try {
    const initial = await getLocationSnapshot();
    applyLocation(initial);
    // Polls every 60s through the host bridge — see watchLocation().
    watchLocation(applyLocation);
  } catch (e) {
    if (e instanceof LocationUnavailableError) {
      coordsSource = 'denied';
      renderLocationStatus();
      console.info('Location denied — no fallback in host mode.');
    } else {
      console.error('Location bridge error:', e);
      coordsSource = 'fallback';
      coords = { lat: 24.774265, lng: 46.738586 };
      renderLocationStatus();
      fetchWeather(coords.lat, coords.lng);
    }
  }

  // Wire refresh button.
  $('refresh-btn').addEventListener('click', () => {
    if (coords) {
      lastLocationChangeAt = 0; // bypass debounce
      fetchWeather(coords.lat, coords.lng);
    }
  });

  // Tick: update "last updated X min ago" stamp every 30 s.
  setInterval(updateLastUpdated, 30_000);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && coords) {
    // Re-fetch if stale (> 5 min since last fetch) when app becomes
    // visible again.
    const stale = !lastFetchAt ||
      Date.now() - lastFetchAt.getTime() > LOCATION_DEBOUNCE_MS;
    if (stale) fetchWeather(coords.lat, coords.lng);
  }
});

main().catch((e) => {
  console.error('Fatal mini-app error:', e);
  const lm = $('loading-msg');
  if (lm) lm.textContent = 'Something went wrong — see console.';
});
