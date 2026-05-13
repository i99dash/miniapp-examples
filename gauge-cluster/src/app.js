/**
 * Gauge Cluster — drinks live BYD signals via the v2 bridge.
 *
 * Talks to the host directly through `window.flutter_inappwebview`
 * (`window.__i99dashHost`). No bundler, no external dependencies.
 * The wire shape it consumes is the same one
 * `lib/features/mini_apps/bridge/car_bridge_service.dart` on the
 * host emits — see https://docs-i99dash-prod-d3c9v.ondigitalocean.app
 * /docs/byd-api/catalog for the live signal list.
 *
 * Mirrors `client.car.read`/`subscribe`/`identity`/`connection.*`
 * from the npm `i99dash` SDK 1:1 — the SDK is a thin wrapper on
 * the same handlers.
 */

// ── Host bridge ─────────────────────────────────────────────────
const host = globalThis.flutter_inappwebview ?? globalThis.__i99dashHost;
if (!host) {
  document.getElementById('notice').classList.add('shown');
}

/** Call a host handler with a single payload argument. */
async function call(handler, payload = {}) {
  if (!host) throw new Error('not_inside_host');
  return host.callHandler(handler, payload);
}

// Listen for push events the host dispatches via
// `window.__i99dashEvents.dispatch('car.signal', payload)`.
globalThis.__i99dashEvents = globalThis.__i99dashEvents ?? {
  _handlers: Object.create(null),
  on(channel, fn) {
    (this._handlers[channel] ??= new Set()).add(fn);
    return () => this._handlers[channel].delete(fn);
  },
  dispatch(channel, payload) {
    const set = this._handlers[channel];
    if (!set) return;
    let parsed = payload;
    if (typeof payload === 'string') {
      try {
        parsed = JSON.parse(payload);
      } catch {
        /* leave as string */
      }
    }
    for (const fn of set) {
      try {
        fn(parsed);
      } catch (err) {
        console.error('__i99dashEvents listener error:', err);
      }
    }
  },
};

// ── Signal names (from the BYD public catalog) ──────────────────
const SIGNALS = [
  // Dynamics
  'speed_kmh',
  'accelerator_pct',
  'brake_pct',
  // Motors / engine
  'motor_f_rpm',
  'motor_r_rpm',
  'engine_rpm',
  // Battery + range
  'battery_pct',
  'range_ev_km',
  'range_fuel_km',
  // Climate
  'ac_cabin_temp',
  'ac_temp_out',
  'ac_fan',
  'ac_power',
  // Doors
  'door_lf',
  'door_rf',
  'door_lr',
  'door_rr',
  'trunk',
  // TPMS
  'tpms_pressure_lf',
  'tpms_pressure_rf',
  'tpms_pressure_lr',
  'tpms_pressure_rr',
];

// Some BYD signals are stored as integer × 10 (cabin temp in °C × 10).
// The catalog `units` field flags these as `celsius_x10`; hard-listed
// here for the v1 cluster.
const TENTH = new Set(['ac_cabin_temp', 'ac_temp_out']);

// ── State ───────────────────────────────────────────────────────
const state = Object.create(null);
for (const name of SIGNALS) state[name] = null;
let lastUpdateAt = 0;
let currentSubscriptionId = null;

// ── Bootstrap ───────────────────────────────────────────────────
async function main() {
  if (!host) return;

  // Identity — brand pill in the header.
  call('car.identity')
    .then((id) => {
      const text = `${(id?.brand ?? 'unknown').toString().toUpperCase()} · ${id?.modelDisplay ?? id?.modelCode ?? '—'}`;
      document.getElementById('brand-badge').textContent = text;
    })
    .catch(() => {
      document.getElementById('brand-badge').textContent = 'identity unavailable';
    });

  // Connection state subscription.
  globalThis.__i99dashEvents.on('car.connection', (payload) => {
    const s = payload?.state ?? payload;
    const dot = document.getElementById('conn-dot');
    const text = document.getElementById('conn-text');
    dot.classList.remove('connected', 'degraded', 'disconnected');
    dot.classList.add(s);
    text.textContent = s;
  });
  call('car.connection.subscribe').catch((err) =>
    console.warn('car.connection.subscribe failed:', err),
  );

  // Signal subscription. Use one subscriptionId so the demux works.
  globalThis.__i99dashEvents.on('car.signal', (payload) => {
    // Payload envelope: {subscriptionId, data: {name, value, at}} or
    // bare {name, value, at} depending on host-side wrapping.
    const ev = payload?.data ?? payload;
    if (!ev?.name) return;
    if (currentSubscriptionId && payload?.subscriptionId && payload.subscriptionId !== currentSubscriptionId) {
      return;
    }
    state[ev.name] = ev.value;
    lastUpdateAt = Date.now();
  });

  // Seed first.
  try {
    const seed = await call('car.read', { names: SIGNALS });
    if (seed?.values) {
      Object.assign(state, seed.values);
      lastUpdateAt = Date.now();
    }
  } catch (err) {
    console.warn('initial car.read failed:', err);
  }

  // Subscribe.
  try {
    const result = await call('car.subscribe', {
      names: SIGNALS,
      idempotencyKey: cryptoUuid(),
    });
    currentSubscriptionId = result?.subscriptionId ?? null;
    if (Array.isArray(result?.rejected) && result.rejected.length > 0) {
      console.warn('car.subscribe rejected:', result.rejected);
    }
  } catch (err) {
    console.warn('car.subscribe failed:', err);
  }

  requestAnimationFrame(paint);
}

// ── Painters ────────────────────────────────────────────────────

const SMOOTHED = Object.create(null);

function smooth(key, target, alpha = 0.18) {
  if (target == null) return SMOOTHED[key] ?? 0;
  const prev = SMOOTHED[key] ?? target;
  const next = prev + (target - prev) * alpha;
  SMOOTHED[key] = next;
  return next;
}

function paint() {
  paintSpeedometer();
  paintTachometer();
  paintBattery();
  paintFooter();
  paintHeaderFreshness();
  requestAnimationFrame(paint);
}

function drawNeedle(ctx, cx, cy, length, angle, color = '#22d3ee', width = 6) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.lineTo(length, 0);
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#0b0f17';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawArc(ctx, cx, cy, r, startAngle, endAngle, color, width) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, startAngle, endAngle);
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.stroke();
}

function drawTicks(ctx, cx, cy, r, startAngle, endAngle, count, color = '#3b4d72') {
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    const a = startAngle + (endAngle - startAngle) * t;
    const isMajor = i % 2 === 0;
    const inner = isMajor ? r - 18 : r - 10;
    const outer = r - 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.strokeStyle = color;
    ctx.lineWidth = isMajor ? 2 : 1;
    ctx.stroke();
  }
}

function gradient(t) {
  if (t < 0.6) return '#22d3ee';
  if (t < 0.85) return '#f59e0b';
  return '#ef4444';
}

function paintSpeedometer() {
  const canvas = document.getElementById('speed-gauge');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2 + 20;
  const r = W * 0.42;
  ctx.clearRect(0, 0, W, H);
  const startAngle = Math.PI * 0.8;
  const endAngle = Math.PI * 2.2;
  const MAX = 180;
  drawArc(ctx, cx, cy, r, startAngle, endAngle, '#1f2a44', 16);
  const raw = state.speed_kmh ?? 0;
  const val = smooth('speed', raw, 0.22);
  const t = Math.min(Math.max(val / MAX, 0), 1);
  const valEnd = startAngle + (endAngle - startAngle) * t;
  drawArc(ctx, cx, cy, r, startAngle, valEnd, gradient(t), 16);
  drawTicks(ctx, cx, cy, r - 22, startAngle, endAngle, 18);
  const angle = startAngle + (endAngle - startAngle) * t;
  drawNeedle(ctx, cx, cy, r - 30, angle, gradient(t), 6);
  document.getElementById('speed-text').textContent = Math.round(val);

  const accel = state.accelerator_pct ?? 0;
  const brake = state.brake_pct ?? 0;
  document.getElementById('accel-bar').style.width = Math.min(accel, 100) + '%';
  document.getElementById('brake-bar').style.width = Math.min(brake, 100) + '%';
}

function paintTachometer() {
  const canvas = document.getElementById('rpm-gauge');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2 + 18;
  const r = W * 0.42;
  ctx.clearRect(0, 0, W, H);
  const startAngle = Math.PI * 0.8;
  const endAngle = Math.PI * 2.2;
  const rawRpm =
    state.motor_f_rpm != null || state.motor_r_rpm != null
      ? Math.max(state.motor_f_rpm ?? 0, state.motor_r_rpm ?? 0)
      : (state.engine_rpm ?? 0);
  const MAX = 8000;
  const val = smooth('rpm', rawRpm, 0.18);
  const t = Math.min(Math.max(val / MAX, 0), 1);
  drawArc(ctx, cx, cy, r, startAngle, endAngle, '#1f2a44', 14);
  const valEnd = startAngle + (endAngle - startAngle) * t;
  drawArc(ctx, cx, cy, r, startAngle, valEnd, gradient(t), 14);
  drawTicks(ctx, cx, cy, r - 20, startAngle, endAngle, 16);
  const angle = startAngle + (endAngle - startAngle) * t;
  drawNeedle(ctx, cx, cy, r - 26, angle, gradient(t), 5);
  document.getElementById('rpm-text').textContent = Math.round(val).toLocaleString();
}

function paintBattery() {
  const canvas = document.getElementById('battery-gauge');
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;
  const cx = W / 2;
  const cy = H / 2 + 18;
  const r = W * 0.42;
  ctx.clearRect(0, 0, W, H);
  const startAngle = Math.PI * 0.8;
  const endAngle = Math.PI * 2.2;
  const val = smooth('battery', state.battery_pct ?? 0, 0.12);
  const t = Math.min(Math.max(val / 100, 0), 1);
  drawArc(ctx, cx, cy, r, startAngle, endAngle, '#1f2a44', 14);
  const valEnd = startAngle + (endAngle - startAngle) * t;
  const color = val < 15 ? '#ef4444' : val < 30 ? '#f59e0b' : '#22c55e';
  drawArc(ctx, cx, cy, r, startAngle, valEnd, color, 14);
  drawTicks(ctx, cx, cy, r - 20, startAngle, endAngle, 10);
  const angle = startAngle + (endAngle - startAngle) * t;
  drawNeedle(ctx, cx, cy, r - 26, angle, color, 5);
  document.getElementById('battery-text').textContent = Math.round(val);
  const ev = state.range_ev_km ?? '—';
  const fuel = state.range_fuel_km ?? '—';
  document.getElementById('range-text').textContent = `${ev} km EV · ${fuel} km fuel`;
}

function paintFooter() {
  for (const id of ['lf', 'rf', 'lr', 'rr']) {
    const el = document.getElementById(`d-${id}`);
    const v = state[`door_${id}`];
    el.classList.toggle('open', v === 1);
    el.querySelector('.state').textContent = v == null ? '—' : v === 1 ? 'OPEN' : 'CLOSED';
  }
  const trunk = document.getElementById('d-trunk');
  const tv = state.trunk;
  trunk.classList.toggle('open', tv === 1);
  trunk.querySelector('.state').textContent =
    tv == null ? '—' : tv === 1 ? 'OPEN' : 'CLOSED';

  for (const corner of ['lf', 'rf', 'lr', 'rr']) {
    const v = state[`tpms_pressure_${corner}`];
    document.getElementById(`t-${corner}-v`).textContent = v == null ? '—' : v;
  }

  const cabin = state.ac_cabin_temp;
  const out = state.ac_temp_out;
  document.getElementById('c-cabin').textContent =
    cabin == null ? '—' : displayTemp(cabin, 'ac_cabin_temp');
  document.getElementById('c-out').textContent =
    out == null ? '—' : displayTemp(out, 'ac_temp_out');
  document.getElementById('c-fan').textContent = state.ac_fan ?? '—';
  document.getElementById('c-ac').textContent =
    state.ac_power == null ? '—' : state.ac_power === 1 ? 'ON' : 'OFF';
}

function paintHeaderFreshness() {
  const el = document.getElementById('updated-badge');
  if (!lastUpdateAt) {
    el.textContent = 'no data yet';
    return;
  }
  const age = Math.round((Date.now() - lastUpdateAt) / 1000);
  el.textContent = age === 0 ? 'live' : `${age}s ago`;
}

function displayTemp(raw, name) {
  return TENTH.has(name) ? (raw / 10).toFixed(1) : raw;
}

function cryptoUuid() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // Fallback — Math.random based; only for older WebView builds.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

main().catch((err) => {
  console.error('gauge-cluster fatal:', err);
});
