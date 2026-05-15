(() => {
  // src/app.js
  var _a;
  var host = (_a = globalThis.flutter_inappwebview) != null ? _a : globalThis.__i99dashHost;
  if (!host) {
    document.getElementById("notice").classList.add("shown");
  }
  async function call(handler, payload = {}) {
    if (!host) throw new Error("not_inside_host");
    return host.callHandler(handler, payload);
  }
  var _a2;
  globalThis.__i99dashEvents = (_a2 = globalThis.__i99dashEvents) != null ? _a2 : {
    _handlers: /* @__PURE__ */ Object.create(null),
    on(channel, fn) {
      var _a3, _b;
      ((_b = (_a3 = this._handlers)[channel]) != null ? _b : _a3[channel] = /* @__PURE__ */ new Set()).add(fn);
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
    // Dynamics
    "speed_kmh",
    "accelerator_pct",
    "brake_pct",
    // Motors / engine
    "motor_f_rpm",
    "motor_r_rpm",
    "engine_rpm",
    // Battery + range
    "battery_pct",
    "range_ev_km",
    "range_fuel_km",
    // Climate
    "ac_cabin_temp",
    "ac_temp_out",
    "ac_fan",
    "ac_power",
    // Doors
    "door_lf",
    "door_rf",
    "door_lr",
    "door_rr",
    "trunk",
    // TPMS
    "tpms_pressure_lf",
    "tpms_pressure_rf",
    "tpms_pressure_lr",
    "tpms_pressure_rr"
  ];
  var TENTH = /* @__PURE__ */ new Set();
  var state = /* @__PURE__ */ Object.create(null);
  for (const name of SIGNALS) state[name] = null;
  var lastUpdateAt = 0;
  var currentSubscriptionId = null;
  async function main() {
    var _a3;
    if (!host) return;
    call("car.identity").then((id) => {
      var _a4, _b, _c;
      const text = `${((_a4 = id == null ? void 0 : id.brand) != null ? _a4 : "unknown").toString().toUpperCase()} \xB7 ${(_c = (_b = id == null ? void 0 : id.modelDisplay) != null ? _b : id == null ? void 0 : id.modelCode) != null ? _c : "\u2014"}`;
      document.getElementById("brand-badge").textContent = text;
    }).catch(() => {
      document.getElementById("brand-badge").textContent = "identity unavailable";
    });
    globalThis.__i99dashEvents.on("car.connection", (payload) => {
      var _a4;
      const s = (_a4 = payload == null ? void 0 : payload.state) != null ? _a4 : payload;
      const dot = document.getElementById("conn-dot");
      const text = document.getElementById("conn-text");
      dot.classList.remove("connected", "degraded", "disconnected");
      dot.classList.add(s);
      text.textContent = s;
    });
    call("car.connection.subscribe").catch(
      (err) => console.warn("car.connection.subscribe failed:", err)
    );
    globalThis.__i99dashEvents.on("car.signal", (payload) => {
      var _a4;
      const ev = (_a4 = payload == null ? void 0 : payload.data) != null ? _a4 : payload;
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
      currentSubscriptionId = (_a3 = result == null ? void 0 : result.subscriptionId) != null ? _a3 : null;
      if (Array.isArray(result == null ? void 0 : result.rejected) && result.rejected.length > 0) {
        console.warn("car.subscribe rejected:", result.rejected);
      }
    } catch (err) {
      console.warn("car.subscribe failed:", err);
    }
    requestAnimationFrame(paint);
  }
  var SMOOTHED = /* @__PURE__ */ Object.create(null);
  function smooth(key, target, alpha = 0.18) {
    var _a3, _b;
    if (target == null) return (_a3 = SMOOTHED[key]) != null ? _a3 : 0;
    const prev = (_b = SMOOTHED[key]) != null ? _b : target;
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
  function drawNeedle(ctx, cx, cy, length, angle, color = "#22d3ee", width = 6) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(length, 0);
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.restore();
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#0b0f17";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  function drawArc(ctx, cx, cy, r, startAngle, endAngle, color, width) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  function drawTicks(ctx, cx, cy, r, startAngle, endAngle, count, color = "#3b4d72") {
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
    if (t < 0.6) return "#22d3ee";
    if (t < 0.85) return "#f59e0b";
    return "#ef4444";
  }
  function paintSpeedometer() {
    var _a3, _b, _c;
    const canvas = document.getElementById("speed-gauge");
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2 + 20;
    const r = W * 0.42;
    ctx.clearRect(0, 0, W, H);
    const startAngle = Math.PI * 0.8;
    const endAngle = Math.PI * 2.2;
    const MAX = 180;
    drawArc(ctx, cx, cy, r, startAngle, endAngle, "#1f2a44", 16);
    const raw = (_a3 = state.speed_kmh) != null ? _a3 : 0;
    const val = smooth("speed", raw, 0.22);
    const t = Math.min(Math.max(val / MAX, 0), 1);
    const valEnd = startAngle + (endAngle - startAngle) * t;
    drawArc(ctx, cx, cy, r, startAngle, valEnd, gradient(t), 16);
    drawTicks(ctx, cx, cy, r - 22, startAngle, endAngle, 18);
    const angle = startAngle + (endAngle - startAngle) * t;
    drawNeedle(ctx, cx, cy, r - 30, angle, gradient(t), 6);
    document.getElementById("speed-text").textContent = Math.round(val);
    const accel = (_b = state.accelerator_pct) != null ? _b : 0;
    const brake = (_c = state.brake_pct) != null ? _c : 0;
    document.getElementById("accel-bar").style.width = Math.min(accel, 100) + "%";
    document.getElementById("brake-bar").style.width = Math.min(brake, 100) + "%";
  }
  function paintTachometer() {
    var _a3, _b, _c;
    const canvas = document.getElementById("rpm-gauge");
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2 + 18;
    const r = W * 0.42;
    ctx.clearRect(0, 0, W, H);
    const startAngle = Math.PI * 0.8;
    const endAngle = Math.PI * 2.2;
    const rawRpm = state.motor_f_rpm != null || state.motor_r_rpm != null ? Math.max((_a3 = state.motor_f_rpm) != null ? _a3 : 0, (_b = state.motor_r_rpm) != null ? _b : 0) : (_c = state.engine_rpm) != null ? _c : 0;
    const MAX = 8e3;
    const val = smooth("rpm", rawRpm, 0.18);
    const t = Math.min(Math.max(val / MAX, 0), 1);
    drawArc(ctx, cx, cy, r, startAngle, endAngle, "#1f2a44", 14);
    const valEnd = startAngle + (endAngle - startAngle) * t;
    drawArc(ctx, cx, cy, r, startAngle, valEnd, gradient(t), 14);
    drawTicks(ctx, cx, cy, r - 20, startAngle, endAngle, 16);
    const angle = startAngle + (endAngle - startAngle) * t;
    drawNeedle(ctx, cx, cy, r - 26, angle, gradient(t), 5);
    document.getElementById("rpm-text").textContent = Math.round(val).toLocaleString();
  }
  function paintBattery() {
    var _a3, _b, _c;
    const canvas = document.getElementById("battery-gauge");
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2 + 18;
    const r = W * 0.42;
    ctx.clearRect(0, 0, W, H);
    const startAngle = Math.PI * 0.8;
    const endAngle = Math.PI * 2.2;
    const val = smooth("battery", (_a3 = state.battery_pct) != null ? _a3 : 0, 0.12);
    const t = Math.min(Math.max(val / 100, 0), 1);
    drawArc(ctx, cx, cy, r, startAngle, endAngle, "#1f2a44", 14);
    const valEnd = startAngle + (endAngle - startAngle) * t;
    const color = val < 15 ? "#ef4444" : val < 30 ? "#f59e0b" : "#22c55e";
    drawArc(ctx, cx, cy, r, startAngle, valEnd, color, 14);
    drawTicks(ctx, cx, cy, r - 20, startAngle, endAngle, 10);
    const angle = startAngle + (endAngle - startAngle) * t;
    drawNeedle(ctx, cx, cy, r - 26, angle, color, 5);
    document.getElementById("battery-text").textContent = Math.round(val);
    const ev = (_b = state.range_ev_km) != null ? _b : "\u2014";
    const fuel = (_c = state.range_fuel_km) != null ? _c : "\u2014";
    document.getElementById("range-text").textContent = `${ev} km EV \xB7 ${fuel} km fuel`;
  }
  function paintFooter() {
    var _a3;
    for (const id of ["lf", "rf", "lr", "rr"]) {
      const el = document.getElementById(`d-${id}`);
      const v = state[`door_${id}`];
      el.classList.toggle("open", v === 1);
      el.querySelector(".state").textContent = v == null ? "\u2014" : v === 1 ? "OPEN" : "CLOSED";
    }
    const trunk = document.getElementById("d-trunk");
    const tv = state.trunk;
    trunk.classList.toggle("open", tv === 1);
    trunk.querySelector(".state").textContent = tv == null ? "\u2014" : tv === 1 ? "OPEN" : "CLOSED";
    for (const corner of ["lf", "rf", "lr", "rr"]) {
      const v = state[`tpms_pressure_${corner}`];
      document.getElementById(`t-${corner}-v`).textContent = v == null ? "\u2014" : v;
    }
    const cabin = state.ac_cabin_temp;
    const out = state.ac_temp_out;
    document.getElementById("c-cabin").textContent = cabin == null ? "\u2014" : displayTemp(cabin, "ac_cabin_temp");
    document.getElementById("c-out").textContent = out == null ? "\u2014" : displayTemp(out, "ac_temp_out");
    document.getElementById("c-fan").textContent = (_a3 = state.ac_fan) != null ? _a3 : "\u2014";
    document.getElementById("c-ac").textContent = state.ac_power == null ? "\u2014" : state.ac_power === 1 ? "ON" : "OFF";
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
  function displayTemp(raw, name) {
    return TENTH.has(name) ? (raw / 10).toFixed(1) : raw;
  }
  function cryptoUuid() {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === "x" ? r : r & 3 | 8).toString(16);
    });
  }
  main().catch((err) => {
    console.error("gauge-cluster fatal:", err);
  });
})();
