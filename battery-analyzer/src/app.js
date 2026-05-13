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

const host = globalThis.flutter_inappwebview ?? globalThis.__i99dashHost;
if (!host) {
  document.getElementById('notice').classList.add('shown');
}

async function call(handler, payload = {}) {
  if (!host) throw new Error('not_inside_host');
  return host.callHandler(handler, payload);
}

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
  globalThis.__i99dashEvents.on('car.connection', (payload) => {
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
  globalThis.__i99dashEvents.on('car.signal', (payload) => {
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
  const v = state.battery_voltage_level;

  document.getElementById('bms-health').textContent = bms == null ? '—' : bms;
  document.getElementById('coolant-life').textContent = coolant == null ? '—' : coolant;
  document.getElementById('pack-capacity').textContent = cap == null ? '—' : cap;
  document.getElementById('pack-volts').textContent = v == null ? '—' : v;

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
  const avg = mx != null && mn != null ? Math.round((mx + mn) / 2) : null;

  document.getElementById('vmin-label').innerHTML = mn == null ? 'min —' : `min ${mn}`;
  document.getElementById('vmax-label').innerHTML = mx == null ? 'max —' : `max ${mx}`;
  document.getElementById('vavg-label').innerHTML = avg == null ? 'avg —' : `avg ${avg}`;
  document.getElementById('v-delta-text').textContent = delta == null ? '—' : delta;
}

function paintThermal() {
  const mx = state.stat_battery_max_temp;
  const mn = state.stat_battery_min_temp;
  const avg = state.stat_battery_avg_temp;
  const delta = computeTDelta();
  document.getElementById('tmin-label').innerHTML = mn == null ? 'min —' : `min ${mn}°`;
  document.getElementById('tmax-label').innerHTML = mx == null ? 'max —' : `max ${mx}°`;
  document.getElementById('tavg-label').innerHTML = avg == null ? 'avg —' : `avg ${avg}°`;
  document.getElementById('t-delta-text').textContent = delta == null ? '—' : delta.toFixed(1);
}

function paintPowerFlow() {
  const maxChg = state.battery_max_chg_kw;
  const maxDis = state.battery_max_dis_kw;
  const regen = state.regen_power;
  const inst = state.stat_instant_elec; // kWh/100km — positive = consumption

  document.getElementById('max-chg-kw').textContent = maxChg == null ? '—' : maxChg;
  document.getElementById('max-dis-kw').textContent = maxDis == null ? '—' : maxDis;

  // Compute a single "current power" signal for the needle. The
  // ROM either reports `regen_power` (signed: + regen, − discharge),
  // or we estimate from instant consumption + speed elsewhere. Fall
  // back to 0 when no signal is live.
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

  document.getElementById('regen-now').textContent =
    regen == null ? '—' : (regen > 0 ? `+${regen.toFixed(1)}` : regen.toFixed(1));
  document.getElementById('inst-elec').textContent = inst == null ? '—' : inst;
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

  document.getElementById('chg-power').textContent = power == null ? '—' : power;
  document.getElementById('chg-target').textContent = target == null ? '—' : target;
  document.getElementById('chg-eta').textContent =
    h == null && m == null
      ? '—'
      : `${h ?? 0}h ${String(m ?? 0).padStart(2, '0')}m`;
  document.getElementById('chg-vi').textContent =
    volt == null && curr == null
      ? '— V · — A'
      : `${volt ?? '—'} V · ${curr ?? '—'} A`;

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
  if (fault != null && fault !== 0) {
    return {
      id: 'fault',
      label: 'FAULT',
      hint: `Charger reports fault code ${fault}. Unplug and retry; if it persists, call service.`,
    };
  }
  // Work-state enum varies by ROM. Conservative mapping:
  //   0 = idle, 1 = preparing, 2 = charging, 3 = finished, 4 = fault.
  if (work === 2) {
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
      hint: 'Handshake with the charger in progress. Power-flow starts in a few seconds.',
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
  const elec = state.stat_total_elec_kwh;
  const fuel = state.stat_total_fuel_l;
  document.getElementById('life-elec').textContent =
    elec == null ? '—' : Number(elec).toLocaleString();
  document.getElementById('life-fuel').textContent =
    fuel == null ? '—' : Number(fuel).toLocaleString();
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

function cryptoUuid() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

main().catch((err) => {
  console.error('battery-analyzer fatal:', err);
});
