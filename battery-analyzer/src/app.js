/**
 * Battery Analyzer — live BMS / charging / cell-balance dashboard.
 *
 * Drinks signals from the v2 bridge (`car.identity` / `car.read` /
 * `car.subscribe` / `car.connection.subscribe`). Renders SoC, cell-
 * voltage spread, thermal spread, regen/discharge flow, charging
 * status, lifetime stats — each with a plain-English hint and
 * verdict so the user understands what's healthy and what isn't.
 *
 * Resilient to missing signals: any name the host doesn't yet
 * surface stays as "—". Signals are pure reads; no writes.
 */

// ── Safe global ─────────────────────────────────────────────────
// Defensive: most DiLink WebViews are modern (the L5 test unit is
// Chromium 95, which has `globalThis`), but some older BYD ROM
// WebViews predate `globalThis` (ES2020) — and esbuild's es2019
// target down-levels *syntax* (`?.`/`??`) but NOT this global
// identifier, so a bare `globalThis` would `ReferenceError` there.
// Resolve a safe global once (in a WebView `window` is always the
// global). `typeof` on an undeclared name never throws, so this
// probe is itself safe. Mirrors the `typeof globalThis ===
// 'undefined'` guard in _shared/l5compat.js. NOTE: this was NOT the
// cause of the "all —" L5 bug — see resolveHost() below.
const G =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
      ? window
      : typeof self !== 'undefined'
        ? self
        : {};

// Host resolution: prefer the branded `__i99dashHost` (car-i99dash
// injects `window.__i99dashHost = window.flutter_inappwebview` via an
// AT_DOCUMENT_START user script), fall back to the plugin's
// transport global, and accept ONLY a candidate that actually
// exposes `callHandler`.
function resolveHost() {
  const branded = G.__i99dashHost;
  if (branded && typeof branded.callHandler === 'function') return branded;
  const legacy = G.flutter_inappwebview;
  if (legacy && typeof legacy.callHandler === 'function') return legacy;
  return null;
}

// THE L5 "all —" ROOT CAUSE — a readiness race, NOT a crash or the
// wrong host object (confirmed on-car: the "Not inside i99dash host"
// notice was showing, i.e. resolveHost() returned null at script
// time). `flutter_inappwebview`'s `callHandler` is not guaranteed
// wired at initial synchronous script execution; the plugin signals
// readiness via the `flutterInAppWebViewPlatformReady` window event.
// The old code resolved the host ONCE, eagerly, and immediately
// bailed to the notice — L8's faster WebView wins that race, the slower
// DiLink 5.0 loses it (host still null → notice → every value "—").
//
// Fix: wait for the host. Resolve immediately if it's already there
// (L8 path — zero behaviour change); otherwise resolve on the
// readiness event AND poll as a belt-and-suspenders, capped by a
// timeout after which we conclude we're genuinely not in a host
// (e.g. opened in a plain browser) and show the notice.
let host = resolveHost();

function whenHostReady(timeoutMs = 8000) {
  return new Promise((resolve) => {
    const found = resolveHost();
    if (found) return resolve(found);
    let settled = false;
    const finish = (h) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('flutterInAppWebViewPlatformReady', onReady);
      clearInterval(poll);
      clearTimeout(timer);
      resolve(h);
    };
    const tryNow = () => {
      const h = resolveHost();
      if (h) finish(h);
    };
    const onReady = () => tryNow();
    window.addEventListener('flutterInAppWebViewPlatformReady', onReady);
    const poll = setInterval(tryNow, 150);
    const timer = setTimeout(() => finish(resolveHost()), timeoutMs);
  });
}

async function call(handler, payload = {}) {
  if (!host) throw new Error('not_inside_host');
  return host.callHandler(handler, payload);
}

G.__i99dashEvents = G.__i99dashEvents ?? {
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

// ── Signal names (all from BYD public catalog) ──────────────────
const SIGNALS = [
  // Core
  'battery_pct',
  'range_ev_km',
  'range_fuel_km',
  'battery_wh', // pack remaining Wh
  // BMS health
  'stat_battery_health',
  'battery_blade_coolant_life',
  'battery_capacity',
  'battery_voltage_level',
  'battery_available_power',
  // Cell balance
  'stat_battery_max_v',
  'stat_battery_min_v',
  // Thermal
  'stat_battery_avg_temp',
  'stat_battery_max_temp',
  'stat_battery_min_temp',
  // Power flow
  'battery_max_chg_kw',
  'battery_max_dis_kw',
  'regen_power',
  'stat_instant_elec',
  // Charging
  'chg_work_state',
  'chg_connect_state',
  'chg_fault_state',
  'chg_power',
  'chg_target_soc',
  'chg_eta_h',
  'chg_eta_m',
  'chg_battery_volt',
  'chg_current',
  'chg_cap_ac',
  'chg_cap_dc',
  // Lifetime
  'stat_total_elec_kwh',
  'stat_total_fuel_l',
];

// ── State ───────────────────────────────────────────────────────
const state = Object.create(null);
for (const name of SIGNALS) state[name] = null;
let lastUpdateAt = 0;
let currentSubscriptionId = null;

// ── Bootstrap ───────────────────────────────────────────────────
async function main() {
  if (!host) return;

  // Brand badge
  call('car.identity')
    .then((id) => {
      const text = `${(id?.brand ?? 'unknown').toString().toUpperCase()} · ${id?.modelDisplay ?? id?.modelCode ?? '—'}`;
      document.getElementById('brand-badge').textContent = text;
    })
    .catch(() => {
      document.getElementById('brand-badge').textContent = 'identity unavailable';
    });

  // Connection
  G.__i99dashEvents.on('car.connection', (payload) => {
    const s = payload?.state ?? payload;
    const dot = document.getElementById('conn-dot');
    const text = document.getElementById('conn-text');
    dot.classList.remove('connected', 'degraded', 'disconnected');
    dot.classList.add(s);
    text.textContent = s;
  });
  call('car.connection.subscribe').catch((err) =>
    console.warn('connection subscribe failed:', err),
  );

  // Subscribe to signal stream
  G.__i99dashEvents.on('car.signal', (payload) => {
    const ev = payload?.data ?? payload;
    if (!ev?.name) return;
    if (currentSubscriptionId && payload?.subscriptionId && payload.subscriptionId !== currentSubscriptionId) {
      return;
    }
    state[ev.name] = ev.value;
    lastUpdateAt = Date.now();
  });

  // Seed
  try {
    const seed = await call('car.read', { names: SIGNALS });
    if (seed?.values) {
      Object.assign(state, seed.values);
      lastUpdateAt = Date.now();
    }
  } catch (err) {
    console.warn('initial car.read failed:', err);
  }

  // Subscribe
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

function paint() {
  paintSoc();
  paintHealth();
  paintBalance();
  paintThermal();
  paintPowerFlow();
  paintCharging();
  paintLifetime();
  paintHeaderFreshness();
  requestAnimationFrame(paint);
}

function paintSoc() {
  const pct = state.battery_pct;
  const ev = state.range_ev_km;
  const fuel = state.range_fuel_km;
  const wh = state.battery_wh;
  document.getElementById('soc-pct').textContent = pct == null ? '—' : pct;
  document.getElementById('soc-fill').style.width = `${Math.max(0, Math.min(100, pct ?? 0))}%`;
  document.getElementById('range-ev').textContent = ev == null ? '— km' : `${ev} km`;
  document.getElementById('range-fuel').textContent = fuel == null ? '— km' : `${fuel} km`;
  document.getElementById('pack-wh').textContent =
    wh == null ? '— Wh' : `${wh.toLocaleString()} Wh`;

  // Optional target SoC tick.
  const target = state.chg_target_soc;
  const tick = document.getElementById('soc-target-tick');
  if (target != null && target > 0 && target <= 100) {
    tick.style.display = 'block';
    tick.style.left = `${target}%`;
  } else {
    tick.style.display = 'none';
  }
}

function paintHealth() {
  const bms = state.stat_battery_health;
  const coolant = state.battery_blade_coolant_life;
  const cap = state.battery_capacity;

  document.getElementById('bms-health').textContent = bms == null ? '—' : bms;
  document.getElementById('coolant-life').textContent = coolant == null ? '—' : coolant;
  document.getElementById('pack-capacity').textContent = cap == null ? '—' : cap;
  // Pack voltage fallback chain:
  //   1. battery_voltage_level (preferred — nominal HV bus rating)
  //   2. chg_battery_volt while plugged-in (live DC bus from the
  //      charger). Useful diagnostic; not the nominal rating.
  //   3. estimate from cell V × cell count when neither is available.
  //      Leopard 8 Blade pack = 104 cells in series.
  document.getElementById('pack-volts').textContent = computePackVolts();

  // Health verdict — derived from BMS health %, cell-v spread, and thermal spread.
  const verdict = document.getElementById('health-verdict');
  const icon = document.getElementById('health-icon');
  const head = document.getElementById('health-head');
  const detail = document.getElementById('health-detail');

  const vDelta = computeVDelta();
  const tDelta = computeTDelta();

  verdict.classList.remove('warn', 'bad');

  if (bms == null && vDelta == null && tDelta == null) {
    icon.textContent = '…';
    head.textContent = 'Waiting for BMS';
    detail.textContent = 'The battery management system has not reported readings yet. This is normal for a few seconds after the car wakes.';
    return;
  }

  const issues = [];
  if (bms != null && bms < 80) issues.push(`BMS health at ${bms}% (factory new = 100%)`);
  if (vDelta != null && vDelta > 50) issues.push(`Cell-voltage spread ${vDelta} mV is high (target < 30 mV)`);
  if (tDelta != null && tDelta > 8) issues.push(`Cell-temperature spread ${tDelta.toFixed(1)}°C is high (target < 5°C)`);

  if (issues.length === 0) {
    icon.textContent = '✓';
    head.textContent = 'Battery is healthy';
    const parts = [];
    if (bms != null) parts.push(`BMS reports ${bms}% capacity`);
    if (vDelta != null) parts.push(`cell-voltage spread ${vDelta} mV`);
    if (tDelta != null) parts.push(`temperature spread ${tDelta.toFixed(1)}°C`);
    detail.textContent = `Everything inside tolerance — ${parts.join(', ')}.`;
  } else if (issues.length === 1) {
    verdict.classList.add('warn');
    icon.textContent = '!';
    head.textContent = 'One thing to watch';
    detail.textContent = issues[0] + '. Driving / charging continues normally; book a check at your next service if this persists for more than a week.';
  } else {
    verdict.classList.add('bad');
    icon.textContent = '!!';
    head.textContent = 'Multiple anomalies detected';
    detail.textContent = issues.join('. ') + '. Book a service visit soon.';
  }
}

function computeVDelta() {
  const mx = state.stat_battery_max_v;
  const mn = state.stat_battery_min_v;
  if (mx == null || mn == null) return null;
  // Pack voltage readings come in millivolts on most BYD ROMs.
  return Math.max(0, mx - mn);
}

function computeTDelta() {
  const mx = state.stat_battery_max_temp;
  const mn = state.stat_battery_min_temp;
  if (mx == null || mn == null) return null;
  return Math.max(0, mx - mn);
}

function paintBalance() {
  const mx = state.stat_battery_max_v;
  const mn = state.stat_battery_min_v;
  const delta = computeVDelta();
  const avg = mx != null && mn != null ? (mx + mn) / 2 : null;

  // Voltage chart: fixed ±50 mV window centred on avg so a tight 3 mV
  // pack renders visibly tight (markers cluster centre) and a loose
  // 60 mV pack spreads to the edges. Healthy zone = ±15 mV (= 30 mV
  // spread threshold from the docs).
  drawBalanceChart('v', { min: mn, max: mx, avg, halfWindow: 50, halfHealthy: 15, suffix: '' });
  document.getElementById('v-delta-text').textContent = delta == null ? '—' : delta;
}

function paintThermal() {
  const mx = state.stat_battery_max_temp;
  const mn = state.stat_battery_min_temp;
  const avg = state.stat_battery_avg_temp;
  const delta = computeTDelta();
  // Temperature chart: ±10 °C window centred on avg, healthy zone
  // = ±2.5 °C (= 5 °C spread threshold).
  drawBalanceChart('t', { min: mn, max: mx, avg, halfWindow: 10, halfHealthy: 2.5, suffix: '°C' });
  document.getElementById('t-delta-text').textContent = delta == null ? '—' : delta.toFixed(1);
}

/**
 * Position the markers + fill + axis-labels on a balance chart so the
 * chart actually visualises the spread instead of staying static.
 *
 * Strategy: pick a fixed ±halfWindow around the live `avg`. Anything
 * inside ±halfHealthy is the green band; markers position
 * proportionally inside the window so a tight spread looks tight
 * and a wide spread looks wide.
 *
 * @param prefix    DOM-id prefix — 'v' or 't' for voltage / temperature charts.
 * @param data.min  Minimum value (or null when not yet reported).
 * @param data.max  Maximum value.
 * @param data.avg  Mid-point — also the chart's centre.
 * @param data.halfWindow   Half the chart's axis range (so window = [avg - hw, avg + hw]).
 * @param data.halfHealthy  Half the healthy-zone width.
 * @param data.suffix       Unit suffix appended to numeric labels (e.g. '°C').
 */
function drawBalanceChart(prefix, { min, max, avg, halfWindow, halfHealthy, suffix }) {
  const labels = {
    min: document.getElementById(`${prefix}min-label`),
    max: document.getElementById(`${prefix}max-label`),
    avg: document.getElementById(`${prefix}avg-label`),
    axisLo: document.getElementById(`${prefix}-axis-low`),
    axisHi: document.getElementById(`${prefix}-axis-high`),
  };
  const markers = {
    min: document.getElementById(`${prefix}min-marker`),
    max: document.getElementById(`${prefix}max-marker`),
    avg: document.getElementById(`${prefix}avg-marker`),
  };
  const fill = document.getElementById(`${prefix}-fill`);
  const healthy = document.getElementById(`${prefix}-healthy`);

  // No data yet — leave labels as "—" and hide the markers + fill.
  if (min == null || max == null || avg == null) {
    labels.min.textContent = '—';
    labels.max.textContent = '—';
    labels.avg.textContent = 'avg';
    labels.axisLo.textContent = '—';
    labels.axisHi.textContent = '—';
    for (const el of [markers.min, markers.max, markers.avg, fill, healthy]) {
      el.style.display = 'none';
    }
    return;
  }
  for (const el of [markers.min, markers.max, markers.avg, fill, healthy]) {
    el.style.display = '';
  }

  // Compute the chart's window: [avg - halfWindow, avg + halfWindow].
  // Clamp the min/max markers to keep them inside even on extreme drift.
  const lo = avg - halfWindow;
  const hi = avg + halfWindow;
  const pct = (v) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo)) * 100));

  const minPct = pct(min);
  const maxPct = pct(max);
  const avgPct = 50;

  // Axis-end labels show the window bounds as numbers so the user
  // can tell what the chart's scale is.
  labels.axisLo.textContent = formatVal(lo, suffix);
  labels.axisHi.textContent = formatVal(hi, suffix);

  // Markers stay at their proportional positions; the spread fill
  // below carries the visual story even when the markers cluster.
  markers.min.style.left = `${minPct}%`;
  markers.max.style.left = `${maxPct}%`;
  markers.avg.style.left = `${avgPct}%`;

  // Labels need overlap protection — when the spread is tight (e.g.
  // 3 mV), min/avg/max all sit at ~50% and the three text labels
  // collide. When the spread is huge (Δ > 2 × halfWindow) min/max
  // are clamped to chart edges and translateX(-50%) puts half the
  // label outside the chart's overflow:hidden box, truncating to
  // garbled text like "47" instead of "3447". Pin those edge cases
  // to the chart's inner edges with no transform.
  const MIN_GAP = 12;
  const EDGE_THRESHOLD = 6; // % from chart edge before we pin
  const spreadPct = maxPct - minPct;
  labels.min.textContent = formatVal(min, suffix);
  labels.max.textContent = formatVal(max, suffix);
  labels.avg.style.left = `${avgPct}%`;
  labels.avg.style.right = '';
  labels.avg.style.transform = '';

  // Pin min label to left edge when it'd otherwise clip; same for max
  // at right edge. Otherwise centre over the marker.
  if (minPct < EDGE_THRESHOLD) {
    labels.min.style.left = '6px';
    labels.min.style.transform = 'none';
  } else {
    labels.min.style.left = `${minPct}%`;
    labels.min.style.transform = '';
  }
  if (maxPct > 100 - EDGE_THRESHOLD) {
    labels.max.style.left = '';
    labels.max.style.right = '6px';
    labels.max.style.transform = 'none';
  } else {
    labels.max.style.left = `${maxPct}%`;
    labels.max.style.right = '';
    labels.max.style.transform = '';
  }

  if (spreadPct < MIN_GAP * 2) {
    // Tight pack — collapse to a single centred label that shows the
    // mid-point. min/max are visible via the marker ticks and the
    // numeric Δ in the hint below.
    labels.avg.textContent = formatVal(avg, suffix);
    labels.min.style.visibility = 'hidden';
    labels.max.style.visibility = 'hidden';
  } else {
    labels.avg.textContent = `avg ${formatVal(avg, suffix)}`;
    labels.min.style.visibility = '';
    labels.max.style.visibility = '';
  }

  // Spread fill — from min marker to max marker.
  fill.style.left = `${minPct}%`;
  fill.style.right = `${100 - maxPct}%`;

  // Healthy zone — ±halfHealthy around avg.
  const healthyLoPct = pct(avg - halfHealthy);
  const healthyHiPct = pct(avg + halfHealthy);
  healthy.style.left = `${healthyLoPct}%`;
  healthy.style.right = `${100 - healthyHiPct}%`;
}

function formatVal(v, suffix) {
  if (Number.isInteger(v)) return `${v}${suffix}`;
  return `${v.toFixed(1)}${suffix}`;
}

function paintPowerFlow() {
  // The catalog declares units: 'kw' for max-charge / max-discharge,
  // but DiLink 5.1 / Leopard 8 reports raw watts. A typical Blade pack
  // peaks at ~200 kW discharge — anything > 1000 must be watts. Scale
  // any value above 1000 by 1/1000 so we present a kW figure
  // regardless of the ROM's encoding.
  const maxChg = scaleToKw(state.battery_max_chg_kw);
  const maxDis = scaleToKw(state.battery_max_dis_kw);
  const regen = scaleToKw(state.regen_power);
  const inst = state.stat_instant_elec; // kWh/100km — positive = consumption

  document.getElementById('max-chg-kw').textContent =
    maxChg == null ? '—' : Math.round(maxChg);
  document.getElementById('max-dis-kw').textContent =
    maxDis == null ? '—' : Math.round(maxDis);

  // Needle position. The ROM either reports `regen_power` (signed:
  // + regen, − discharge) or null. Fall back to 0 when null so the
  // needle stays centred at "idle".
  const flowKw = regen != null ? regen : 0;
  const span = Math.max(1, Math.max(maxChg ?? 60, maxDis ?? 200));
  const pct = 50 + (flowKw / span) * 50;
  const clamped = Math.max(2, Math.min(98, pct));
  document.getElementById('power-needle').style.left = `${clamped}%`;

  const readout = document.getElementById('power-readout');
  readout.classList.remove('regen', 'discharge');
  if (regen == null) {
    readout.textContent = '— kW';
  } else if (regen > 0.1) {
    readout.classList.add('regen');
    readout.innerHTML = `+${regen.toFixed(1)}<span class="u">kW regen</span>`;
  } else if (regen < -0.1) {
    readout.classList.add('discharge');
    readout.innerHTML = `${regen.toFixed(1)}<span class="u">kW out</span>`;
  } else {
    readout.innerHTML = `0<span class="u">kW idle</span>`;
  }

  // Regen-now footer: distinct from the gauge readout. Shows the
  // numeric value the car is currently regen'ing OR discharging. A
  // parked car with regen_power=0 is a real reading, not absence.
  // When the signal isn't reported at all (truly null) we still call
  // that out as "n/a" — matches lifetime card semantics.
  const regenEl = document.getElementById('regen-now');
  if (regen == null) {
    regenEl.textContent = 'n/a';
  } else if (regen > 0) {
    regenEl.textContent = `+${regen.toFixed(1)}`;
  } else {
    regenEl.textContent = regen.toFixed(1);
  }
  document.getElementById('inst-elec').textContent =
    inst == null ? 'n/a' : inst;
}

/**
 * Normalise a power signal to kilowatts.
 *
 * BMS-side reporting varies by DiLink ROM:
 *   - Some report raw watts (e.g. 3822 = 3.822 kW)
 *   - Some report kW directly (e.g. 199)
 *
 * A Blade pack's physical max is ~250 kW. Any value above 1000 is
 * therefore watts; rescale. Below 1000 we trust the ROM.
 *
 * Returns null when the input is null/NaN so the rest of the painter
 * falls through to the "—" branch.
 */
function scaleToKw(v) {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.abs(n) > 1000 ? n / 1000 : n;
}

/**
 * Pack-voltage display value with a fallback chain.
 *
 * `battery_voltage_level` (Bodywork.BODYWORK_BATTERY_VOLTAGE_LEVEL) is
 * documented as the nominal HV bus rating but doesn't push on every
 * DiLink ROM. When it's absent we fall back to:
 *
 *   - `chg_battery_volt` while plugged in (live DC bus seen by the
 *     charger; not the nominal rating but a close real-time proxy).
 *   - cell V min × CELL_COUNT_DEFAULT as a last-resort estimate.
 *     Cell voltages are in millivolts; the Leopard 8 Blade pack uses
 *     104 cells in series, so total V ≈ avg-cell-mV × 104 / 1000.
 *
 * Returns a string suitable for direct insertion into the DOM.
 */
const CELL_COUNT_DEFAULT = 104;
function computePackVolts() {
  const explicit = state.battery_voltage_level;
  if (explicit != null) return String(explicit);
  const live = state.chg_battery_volt;
  if (live != null) return String(live);
  const mn = state.stat_battery_min_v;
  const mx = state.stat_battery_max_v;
  if (mn != null && mx != null) {
    const avgMv = (mn + mx) / 2;
    return `~${Math.round((avgMv * CELL_COUNT_DEFAULT) / 1000)}`;
  }
  return '—';
}

function paintCharging() {
  const work = state.chg_work_state;
  const connect = state.chg_connect_state;
  const fault = state.chg_fault_state;
  const power = state.chg_power;
  const target = state.chg_target_soc;
  const h = state.chg_eta_h;
  const m = state.chg_eta_m;
  const volt = state.chg_battery_volt;
  const curr = state.chg_current;
  const capAc = state.chg_cap_ac;
  const capDc = state.chg_cap_dc;

  const stateLabel = describeChargeState({ work, connect, fault });
  document.getElementById('chg-state').textContent = stateLabel.label;
  document.getElementById('chg-state-hint').textContent = stateLabel.hint;

  const card = document.getElementById('chg-card');
  card.classList.toggle('pulse-charging', stateLabel.id === 'charging');

  const badge = document.getElementById('charge-badge');
  badge.textContent = stateLabel.label;
  const dot = badge.querySelector('.dot');
  if (dot) dot.remove();

  // Charge power: during PREPARING handshake no current flows yet, so
  // chg_power is genuinely 0 — the BMS just doesn't push the zero.
  // Showing `—` is misleading; show explicit 0 with a hint. Same
  // applies to chg_current below.
  const powerEl = document.getElementById('chg-power');
  if (power != null) {
    powerEl.textContent = power;
  } else if (stateLabel.id === 'preparing' || stateLabel.id === 'plugged-idle') {
    powerEl.textContent = '0';
  } else if (volt != null && curr != null) {
    // Compute kW from live V × A when the dedicated chg_power signal
    // doesn't push (some Leopard 8 firmwares omit it).
    powerEl.textContent = ((volt * curr) / 1000).toFixed(1);
  } else {
    powerEl.textContent = '—';
  }
  document.getElementById('chg-target').textContent = target == null ? '—' : target;

  // ETA — only meaningful while CHARGING. The BMS reports 0xFF (255)
  // as a sentinel for "not computed yet" during PREPARING. Validate
  // each component against the catalog range
  // (chg_eta_m: range 0..59, chg_eta_h: <0..24h ideal). Anything
  // outside = treat as unknown per docs/guides/best-practices
  // ("defensive-read every optional field; absence is unknown").
  const etaH = sanitiseInt(h, 0, 99);
  const etaM = sanitiseInt(m, 0, 59);
  const etaEl = document.getElementById('chg-eta');
  if (stateLabel.id !== 'charging' && stateLabel.id !== 'preparing') {
    etaEl.textContent = '—';
  } else if (etaH == null && etaM == null) {
    etaEl.textContent = stateLabel.id === 'preparing' ? 'computing…' : '—';
  } else {
    etaEl.textContent = `${etaH ?? 0}h ${String(etaM ?? 0).padStart(2, '0')}m`;
  }

  // Voltage · Current — during PREPARING the bus voltage is live but
  // current is 0 (handshake hasn't authorised current flow yet). Show
  // explicit 0 A in that case rather than `—`, which would suggest
  // missing data when really the value IS zero.
  const viEl = document.getElementById('chg-vi');
  const isPreparing = stateLabel.id === 'preparing';
  const isPluggedIdle = stateLabel.id === 'plugged-idle';
  const isUnplugged = stateLabel.id === 'unplugged';
  const vStr = volt != null ? `${volt} V` : (isUnplugged ? '— V' : '—');
  const aStr = curr != null
    ? `${curr} A`
    : ((isPreparing || isPluggedIdle) ? '0 A' : (isUnplugged ? '— A' : '—'));
  if (volt == null && curr == null && (isPreparing || isPluggedIdle)) {
    viEl.textContent = isPreparing ? 'waiting for handshake' : 'no power flow';
  } else if (volt == null && curr == null) {
    viEl.textContent = '— V · — A';
  } else {
    viEl.textContent = `${vStr} · ${aStr}`;
  }

  // Capability hints — AC vs DC port support.
  if (capAc != null || capDc != null) {
    const parts = [];
    if (capAc === 1) parts.push('AC');
    if (capDc === 1) parts.push('DC');
    if (parts.length > 0) {
      stateLabel.hint += ` Port supports ${parts.join(' + ')}.`;
      document.getElementById('chg-state-hint').textContent = stateLabel.hint;
    }
  }
}

function describeChargeState({ work, connect, fault }) {
  // Work-state takes priority over the fault flag. DiLink 5.1 / Leopard 8
  // reports chg_fault_state=1 even during normal pre-charge handshake
  // (the bit is "session armed", not "fault"). Only treat a fault as
  // real when the BMS work-state explicitly says fault (enum value 4),
  // or when the charger reports a fault while we know the work-state
  // is supposed to be active (work>=2).
  //
  // Work-state enum, conservative mapping:
  //   0 = idle, 1 = preparing, 2 = charging, 3 = finished, 4 = fault.
  if (work === 4) {
    return {
      id: 'fault',
      label: 'FAULT',
      hint: `BMS reports charging fault${fault ? ` (code ${fault})` : ''}. Unplug and retry; if it persists, call service.`,
    };
  }
  if (work === 2) {
    if (fault != null && fault > 1) {
      // Genuine fault during active charging — not the benign "session
      // armed" bit on Leopard 8.
      return {
        id: 'fault',
        label: 'FAULT',
        hint: `Charger reports fault code ${fault}. Unplug and retry; if it persists, call service.`,
      };
    }
    return {
      id: 'charging',
      label: 'CHARGING',
      hint: 'Power is flowing into the pack. Live wall-to-pack rate below.',
    };
  }
  if (work === 1) {
    return {
      id: 'preparing',
      label: 'PREPARING',
      hint: 'Handshake with the charger in progress. Power flow starts in a few seconds.',
    };
  }
  if (work === 3) {
    return {
      id: 'finished',
      label: 'FINISHED',
      hint: 'Charge session complete. Safe to unplug.',
    };
  }
  if (connect === 1) {
    return {
      id: 'plugged-idle',
      label: 'PLUGGED · IDLE',
      hint: 'Cable connected but no power flowing. Check the charger panel.',
    };
  }
  return {
    id: 'unplugged',
    label: 'UNPLUGGED',
    hint: 'Plug in to start a charging session.',
  };
}

function paintLifetime() {
  // Lifetime aggregates live in the Statistic.* namespace. Some BMS
  // firmwares (DiLink 5.1 / Leopard 8) don't push these values at all
  // — they're either gated behind a service-mode reset or genuinely
  // not exposed. Render "n/a" (rather than `—`, which suggests
  // missing-but-coming-soon) when the signal stays null for a
  // few seconds after boot — the auto-warmup phase will have either
  // populated it or proven it's a hard gap.
  const elec = state.stat_total_elec_kwh;
  const fuel = state.stat_total_fuel_l;
  document.getElementById('life-elec').textContent =
    elec == null ? 'n/a' : Number(elec).toLocaleString();
  document.getElementById('life-fuel').textContent =
    fuel == null ? 'n/a' : Number(fuel).toLocaleString();
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

/**
 * Range-clamp a raw signal value to its catalog-declared bounds.
 * Returns null when the value is null, NaN, or outside [min, max].
 *
 * Per docs/byd-api/catalog, every entry may carry a `range` hint —
 * values outside it are sentinels (BMS encodings like 0xFF for
 * "not yet computed", 0xFFFF for "uninitialised"). The mini-app
 * treats them as absence per the defensive-read rule in
 * docs/guides/best-practices.
 */
function sanitiseInt(v, min, max) {
  if (v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  if (n < min || n > max) return null;
  return Math.trunc(n);
}

function cryptoUuid() {
  if (G.crypto && typeof G.crypto.randomUUID === 'function') {
    return G.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

(async () => {
  // Wait for the host bridge to actually be ready before concluding
  // anything (the L5 readiness race — see whenHostReady). Only after
  // the bounded wait do we show the "not inside a host" notice.
  host = await whenHostReady();
  if (!host) {
    document.getElementById('notice').classList.add('shown');
    return;
  }
  try {
    await main();
  } catch (err) {
    console.error('battery-analyzer fatal:', err);
  }
})();
