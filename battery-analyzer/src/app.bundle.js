(() => {
  // src/app.js
  var G = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {};
  function resolveHost() {
    const branded = G.__i99dashHost;
    if (branded && typeof branded.callHandler === "function") return branded;
    const legacy = G.flutter_inappwebview;
    if (legacy && typeof legacy.callHandler === "function") return legacy;
    return null;
  }
  var host = resolveHost();
  function whenHostReady(timeoutMs = 8e3) {
    return new Promise((resolve) => {
      const found = resolveHost();
      if (found) return resolve(found);
      let settled = false;
      const finish = (h) => {
        if (settled) return;
        settled = true;
        window.removeEventListener("flutterInAppWebViewPlatformReady", onReady);
        clearInterval(poll);
        clearTimeout(timer);
        resolve(h);
      };
      const tryNow = () => {
        const h = resolveHost();
        if (h) finish(h);
      };
      const onReady = () => tryNow();
      window.addEventListener("flutterInAppWebViewPlatformReady", onReady);
      const poll = setInterval(tryNow, 150);
      const timer = setTimeout(() => finish(resolveHost()), timeoutMs);
    });
  }
  async function call(handler, payload = {}) {
    if (!host) throw new Error("not_inside_host");
    return host.callHandler(handler, payload);
  }
  var _a;
  G.__i99dashEvents = (_a = G.__i99dashEvents) != null ? _a : {
    _handlers: /* @__PURE__ */ Object.create(null),
    on(channel, fn) {
      var _a2, _b;
      ((_b = (_a2 = this._handlers)[channel]) != null ? _b : _a2[channel] = /* @__PURE__ */ new Set()).add(fn);
      return () => this._handlers[channel].delete(fn);
    },
    dispatch(channel, payload) {
      const set = this._handlers[channel];
      if (!set) return;
      let parsed = payload;
      if (typeof payload === "string") {
        try {
          parsed = JSON.parse(payload);
        } catch {
        }
      }
      for (const fn of set) {
        try {
          fn(parsed);
        } catch (err) {
          console.error("__i99dashEvents listener error:", err);
        }
      }
    }
  };
  var SIGNALS = [
    // Core
    "battery_pct",
    "range_ev_km",
    "range_fuel_km",
    "battery_wh",
    // pack remaining Wh
    // BMS health
    "stat_battery_health",
    "battery_blade_coolant_life",
    "battery_capacity",
    "battery_voltage_level",
    "battery_available_power",
    // Cell balance
    "stat_battery_max_v",
    "stat_battery_min_v",
    // Thermal
    "stat_battery_avg_temp",
    "stat_battery_max_temp",
    "stat_battery_min_temp",
    // Power flow
    "battery_max_chg_kw",
    "battery_max_dis_kw",
    "regen_power",
    "stat_instant_elec",
    // Charging
    "chg_work_state",
    "chg_connect_state",
    "chg_fault_state",
    "chg_power",
    "chg_target_soc",
    "chg_eta_h",
    "chg_eta_m",
    "chg_battery_volt",
    "chg_current",
    "chg_cap_ac",
    "chg_cap_dc",
    // Lifetime
    "stat_total_elec_kwh",
    "stat_total_fuel_l"
  ];
  var state = /* @__PURE__ */ Object.create(null);
  for (const name of SIGNALS) state[name] = null;
  var lastUpdateAt = 0;
  var currentSubscriptionId = null;
  async function main() {
    var _a2;
    if (!host) return;
    call("car.identity").then((id) => {
      var _a3, _b, _c;
      const text = `${((_a3 = id == null ? void 0 : id.brand) != null ? _a3 : "unknown").toString().toUpperCase()} \xB7 ${(_c = (_b = id == null ? void 0 : id.modelDisplay) != null ? _b : id == null ? void 0 : id.modelCode) != null ? _c : "\u2014"}`;
      document.getElementById("brand-badge").textContent = text;
    }).catch(() => {
      document.getElementById("brand-badge").textContent = "identity unavailable";
    });
    G.__i99dashEvents.on("car.connection", (payload) => {
      var _a3;
      const s = (_a3 = payload == null ? void 0 : payload.state) != null ? _a3 : payload;
      const dot = document.getElementById("conn-dot");
      const text = document.getElementById("conn-text");
      dot.classList.remove("connected", "degraded", "disconnected");
      dot.classList.add(s);
      text.textContent = s;
    });
    call("car.connection.subscribe").catch(
      (err) => console.warn("connection subscribe failed:", err)
    );
    G.__i99dashEvents.on("car.signal", (payload) => {
      var _a3;
      const ev = (_a3 = payload == null ? void 0 : payload.data) != null ? _a3 : payload;
      if (!(ev == null ? void 0 : ev.name)) return;
      if (currentSubscriptionId && (payload == null ? void 0 : payload.subscriptionId) && payload.subscriptionId !== currentSubscriptionId) {
        return;
      }
      state[ev.name] = ev.value;
      lastUpdateAt = Date.now();
    });
    try {
      const seed = await call("car.read", { names: SIGNALS });
      if (seed == null ? void 0 : seed.values) {
        Object.assign(state, seed.values);
        lastUpdateAt = Date.now();
      }
    } catch (err) {
      console.warn("initial car.read failed:", err);
    }
    try {
      const result = await call("car.subscribe", {
        names: SIGNALS,
        idempotencyKey: cryptoUuid()
      });
      currentSubscriptionId = (_a2 = result == null ? void 0 : result.subscriptionId) != null ? _a2 : null;
      if (Array.isArray(result == null ? void 0 : result.rejected) && result.rejected.length > 0) {
        console.warn("car.subscribe rejected:", result.rejected);
      }
    } catch (err) {
      console.warn("car.subscribe failed:", err);
    }
    requestAnimationFrame(paint);
  }
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
    document.getElementById("soc-pct").textContent = pct == null ? "\u2014" : pct;
    document.getElementById("soc-fill").style.width = `${Math.max(0, Math.min(100, pct != null ? pct : 0))}%`;
    document.getElementById("range-ev").textContent = ev == null ? "\u2014 km" : `${ev} km`;
    document.getElementById("range-fuel").textContent = fuel == null ? "\u2014 km" : `${fuel} km`;
    document.getElementById("pack-wh").textContent = wh == null ? "\u2014 Wh" : `${wh.toLocaleString()} Wh`;
    const target = state.chg_target_soc;
    const tick = document.getElementById("soc-target-tick");
    if (target != null && target > 0 && target <= 100) {
      tick.style.display = "block";
      tick.style.left = `${target}%`;
    } else {
      tick.style.display = "none";
    }
  }
  function paintHealth() {
    const bms = state.stat_battery_health;
    const coolant = state.battery_blade_coolant_life;
    const cap = state.battery_capacity;
    document.getElementById("bms-health").textContent = bms == null ? "\u2014" : bms;
    document.getElementById("coolant-life").textContent = coolant == null ? "\u2014" : coolant;
    document.getElementById("pack-capacity").textContent = cap == null ? "\u2014" : cap;
    document.getElementById("pack-volts").textContent = computePackVolts();
    const verdict = document.getElementById("health-verdict");
    const icon = document.getElementById("health-icon");
    const head = document.getElementById("health-head");
    const detail = document.getElementById("health-detail");
    const vDelta = computeVDelta();
    const tDelta = computeTDelta();
    verdict.classList.remove("warn", "bad");
    if (bms == null && vDelta == null && tDelta == null) {
      icon.textContent = "\u2026";
      head.textContent = "Waiting for BMS";
      detail.textContent = "The battery management system has not reported readings yet. This is normal for a few seconds after the car wakes.";
      return;
    }
    const issues = [];
    if (bms != null && bms < 80) issues.push(`BMS health at ${bms}% (factory new = 100%)`);
    if (vDelta != null && vDelta > 50) issues.push(`Cell-voltage spread ${vDelta} mV is high (target < 30 mV)`);
    if (tDelta != null && tDelta > 8) issues.push(`Cell-temperature spread ${tDelta.toFixed(1)}\xB0C is high (target < 5\xB0C)`);
    if (issues.length === 0) {
      icon.textContent = "\u2713";
      head.textContent = "Battery is healthy";
      const parts = [];
      if (bms != null) parts.push(`BMS reports ${bms}% capacity`);
      if (vDelta != null) parts.push(`cell-voltage spread ${vDelta} mV`);
      if (tDelta != null) parts.push(`temperature spread ${tDelta.toFixed(1)}\xB0C`);
      detail.textContent = `Everything inside tolerance \u2014 ${parts.join(", ")}.`;
    } else if (issues.length === 1) {
      verdict.classList.add("warn");
      icon.textContent = "!";
      head.textContent = "One thing to watch";
      detail.textContent = issues[0] + ". Driving / charging continues normally; book a check at your next service if this persists for more than a week.";
    } else {
      verdict.classList.add("bad");
      icon.textContent = "!!";
      head.textContent = "Multiple anomalies detected";
      detail.textContent = issues.join(". ") + ". Book a service visit soon.";
    }
  }
  function computeVDelta() {
    const mx = state.stat_battery_max_v;
    const mn = state.stat_battery_min_v;
    if (mx == null || mn == null) return null;
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
    drawBalanceChart("v", { min: mn, max: mx, avg, halfWindow: 50, halfHealthy: 15, suffix: "" });
    document.getElementById("v-delta-text").textContent = delta == null ? "\u2014" : delta;
  }
  function paintThermal() {
    const mx = state.stat_battery_max_temp;
    const mn = state.stat_battery_min_temp;
    const avg = state.stat_battery_avg_temp;
    const delta = computeTDelta();
    drawBalanceChart("t", { min: mn, max: mx, avg, halfWindow: 10, halfHealthy: 2.5, suffix: "\xB0C" });
    document.getElementById("t-delta-text").textContent = delta == null ? "\u2014" : delta.toFixed(1);
  }
  function drawBalanceChart(prefix, { min, max, avg, halfWindow, halfHealthy, suffix }) {
    const labels = {
      min: document.getElementById(`${prefix}min-label`),
      max: document.getElementById(`${prefix}max-label`),
      avg: document.getElementById(`${prefix}avg-label`),
      axisLo: document.getElementById(`${prefix}-axis-low`),
      axisHi: document.getElementById(`${prefix}-axis-high`)
    };
    const markers = {
      min: document.getElementById(`${prefix}min-marker`),
      max: document.getElementById(`${prefix}max-marker`),
      avg: document.getElementById(`${prefix}avg-marker`)
    };
    const fill = document.getElementById(`${prefix}-fill`);
    const healthy = document.getElementById(`${prefix}-healthy`);
    if (min == null || max == null || avg == null) {
      labels.min.textContent = "\u2014";
      labels.max.textContent = "\u2014";
      labels.avg.textContent = "avg";
      labels.axisLo.textContent = "\u2014";
      labels.axisHi.textContent = "\u2014";
      for (const el of [markers.min, markers.max, markers.avg, fill, healthy]) {
        el.style.display = "none";
      }
      return;
    }
    for (const el of [markers.min, markers.max, markers.avg, fill, healthy]) {
      el.style.display = "";
    }
    const lo = avg - halfWindow;
    const hi = avg + halfWindow;
    const pct = (v) => Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100));
    const minPct = pct(min);
    const maxPct = pct(max);
    const avgPct = 50;
    labels.axisLo.textContent = formatVal(lo, suffix);
    labels.axisHi.textContent = formatVal(hi, suffix);
    markers.min.style.left = `${minPct}%`;
    markers.max.style.left = `${maxPct}%`;
    markers.avg.style.left = `${avgPct}%`;
    const MIN_GAP = 12;
    const EDGE_THRESHOLD = 6;
    const spreadPct = maxPct - minPct;
    labels.min.textContent = formatVal(min, suffix);
    labels.max.textContent = formatVal(max, suffix);
    labels.avg.style.left = `${avgPct}%`;
    labels.avg.style.right = "";
    labels.avg.style.transform = "";
    if (minPct < EDGE_THRESHOLD) {
      labels.min.style.left = "6px";
      labels.min.style.transform = "none";
    } else {
      labels.min.style.left = `${minPct}%`;
      labels.min.style.transform = "";
    }
    if (maxPct > 100 - EDGE_THRESHOLD) {
      labels.max.style.left = "";
      labels.max.style.right = "6px";
      labels.max.style.transform = "none";
    } else {
      labels.max.style.left = `${maxPct}%`;
      labels.max.style.right = "";
      labels.max.style.transform = "";
    }
    if (spreadPct < MIN_GAP * 2) {
      labels.avg.textContent = formatVal(avg, suffix);
      labels.min.style.visibility = "hidden";
      labels.max.style.visibility = "hidden";
    } else {
      labels.avg.textContent = `avg ${formatVal(avg, suffix)}`;
      labels.min.style.visibility = "";
      labels.max.style.visibility = "";
    }
    fill.style.left = `${minPct}%`;
    fill.style.right = `${100 - maxPct}%`;
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
    const maxChg = scaleToKw(state.battery_max_chg_kw);
    const maxDis = scaleToKw(state.battery_max_dis_kw);
    const regen = scaleToKw(state.regen_power);
    const inst = state.stat_instant_elec;
    document.getElementById("max-chg-kw").textContent = maxChg == null ? "\u2014" : Math.round(maxChg);
    document.getElementById("max-dis-kw").textContent = maxDis == null ? "\u2014" : Math.round(maxDis);
    const flowKw = regen != null ? regen : 0;
    const span = Math.max(1, Math.max(maxChg != null ? maxChg : 60, maxDis != null ? maxDis : 200));
    const pct = 50 + flowKw / span * 50;
    const clamped = Math.max(2, Math.min(98, pct));
    document.getElementById("power-needle").style.left = `${clamped}%`;
    const readout = document.getElementById("power-readout");
    readout.classList.remove("regen", "discharge");
    if (regen == null) {
      readout.textContent = "\u2014 kW";
    } else if (regen > 0.1) {
      readout.classList.add("regen");
      readout.innerHTML = `+${regen.toFixed(1)}<span class="u">kW regen</span>`;
    } else if (regen < -0.1) {
      readout.classList.add("discharge");
      readout.innerHTML = `${regen.toFixed(1)}<span class="u">kW out</span>`;
    } else {
      readout.innerHTML = `0<span class="u">kW idle</span>`;
    }
    const regenEl = document.getElementById("regen-now");
    if (regen == null) {
      regenEl.textContent = "n/a";
    } else if (regen > 0) {
      regenEl.textContent = `+${regen.toFixed(1)}`;
    } else {
      regenEl.textContent = regen.toFixed(1);
    }
    document.getElementById("inst-elec").textContent = inst == null ? "n/a" : inst;
  }
  function scaleToKw(v) {
    if (v == null) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.abs(n) > 1e3 ? n / 1e3 : n;
  }
  var CELL_COUNT_DEFAULT = 104;
  function computePackVolts() {
    const explicit = state.battery_voltage_level;
    if (explicit != null) return String(explicit);
    const live = state.chg_battery_volt;
    if (live != null) return String(live);
    const mn = state.stat_battery_min_v;
    const mx = state.stat_battery_max_v;
    if (mn != null && mx != null) {
      const avgMv = (mn + mx) / 2;
      return `~${Math.round(avgMv * CELL_COUNT_DEFAULT / 1e3)}`;
    }
    return "\u2014";
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
    document.getElementById("chg-state").textContent = stateLabel.label;
    document.getElementById("chg-state-hint").textContent = stateLabel.hint;
    const card = document.getElementById("chg-card");
    card.classList.toggle("pulse-charging", stateLabel.id === "charging");
    const badge = document.getElementById("charge-badge");
    badge.textContent = stateLabel.label;
    const dot = badge.querySelector(".dot");
    if (dot) dot.remove();
    const powerEl = document.getElementById("chg-power");
    if (power != null) {
      powerEl.textContent = power;
    } else if (stateLabel.id === "preparing" || stateLabel.id === "plugged-idle") {
      powerEl.textContent = "0";
    } else if (volt != null && curr != null) {
      powerEl.textContent = (volt * curr / 1e3).toFixed(1);
    } else {
      powerEl.textContent = "\u2014";
    }
    document.getElementById("chg-target").textContent = target == null ? "\u2014" : target;
    const etaH = sanitiseInt(h, 0, 99);
    const etaM = sanitiseInt(m, 0, 59);
    const etaEl = document.getElementById("chg-eta");
    if (stateLabel.id !== "charging" && stateLabel.id !== "preparing") {
      etaEl.textContent = "\u2014";
    } else if (etaH == null && etaM == null) {
      etaEl.textContent = stateLabel.id === "preparing" ? "computing\u2026" : "\u2014";
    } else {
      etaEl.textContent = `${etaH != null ? etaH : 0}h ${String(etaM != null ? etaM : 0).padStart(2, "0")}m`;
    }
    const viEl = document.getElementById("chg-vi");
    const isPreparing = stateLabel.id === "preparing";
    const isPluggedIdle = stateLabel.id === "plugged-idle";
    const isUnplugged = stateLabel.id === "unplugged";
    const vStr = volt != null ? `${volt} V` : isUnplugged ? "\u2014 V" : "\u2014";
    const aStr = curr != null ? `${curr} A` : isPreparing || isPluggedIdle ? "0 A" : isUnplugged ? "\u2014 A" : "\u2014";
    if (volt == null && curr == null && (isPreparing || isPluggedIdle)) {
      viEl.textContent = isPreparing ? "waiting for handshake" : "no power flow";
    } else if (volt == null && curr == null) {
      viEl.textContent = "\u2014 V \xB7 \u2014 A";
    } else {
      viEl.textContent = `${vStr} \xB7 ${aStr}`;
    }
    if (capAc != null || capDc != null) {
      const parts = [];
      if (capAc === 1) parts.push("AC");
      if (capDc === 1) parts.push("DC");
      if (parts.length > 0) {
        stateLabel.hint += ` Port supports ${parts.join(" + ")}.`;
        document.getElementById("chg-state-hint").textContent = stateLabel.hint;
      }
    }
  }
  function describeChargeState({ work, connect, fault }) {
    if (work === 4) {
      return {
        id: "fault",
        label: "FAULT",
        hint: `BMS reports charging fault${fault ? ` (code ${fault})` : ""}. Unplug and retry; if it persists, call service.`
      };
    }
    if (work === 2) {
      if (fault != null && fault > 1) {
        return {
          id: "fault",
          label: "FAULT",
          hint: `Charger reports fault code ${fault}. Unplug and retry; if it persists, call service.`
        };
      }
      return {
        id: "charging",
        label: "CHARGING",
        hint: "Power is flowing into the pack. Live wall-to-pack rate below."
      };
    }
    if (work === 1) {
      return {
        id: "preparing",
        label: "PREPARING",
        hint: "Handshake with the charger in progress. Power flow starts in a few seconds."
      };
    }
    if (work === 3) {
      return {
        id: "finished",
        label: "FINISHED",
        hint: "Charge session complete. Safe to unplug."
      };
    }
    if (connect === 1) {
      return {
        id: "plugged-idle",
        label: "PLUGGED \xB7 IDLE",
        hint: "Cable connected but no power flowing. Check the charger panel."
      };
    }
    return {
      id: "unplugged",
      label: "UNPLUGGED",
      hint: "Plug in to start a charging session."
    };
  }
  function paintLifetime() {
    const elec = state.stat_total_elec_kwh;
    const fuel = state.stat_total_fuel_l;
    document.getElementById("life-elec").textContent = elec == null ? "n/a" : Number(elec).toLocaleString();
    document.getElementById("life-fuel").textContent = fuel == null ? "n/a" : Number(fuel).toLocaleString();
  }
  function paintHeaderFreshness() {
    const el = document.getElementById("updated-badge");
    if (!lastUpdateAt) {
      el.textContent = "no data yet";
      return;
    }
    const age = Math.round((Date.now() - lastUpdateAt) / 1e3);
    el.textContent = age === 0 ? "live" : `${age}s ago`;
  }
  function sanitiseInt(v, min, max) {
    if (v == null) return null;
    const n = Number(v);
    if (!Number.isFinite(n)) return null;
    if (n < min || n > max) return null;
    return Math.trunc(n);
  }
  function cryptoUuid() {
    if (G.crypto && typeof G.crypto.randomUUID === "function") {
      return G.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === "x" ? r : r & 3 | 8).toString(16);
    });
  }
  (async () => {
    host = await whenHostReady();
    if (!host) {
      document.getElementById("notice").classList.add("shown");
      return;
    }
    try {
      await main();
    } catch (err) {
      console.error("battery-analyzer fatal:", err);
    }
  })();
})();
