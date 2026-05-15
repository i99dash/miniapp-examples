(() => {
  // src/bridge.js
  var _a, _b;
  var host = (_b = (_a = globalThis.flutter_inappwebview) != null ? _a : globalThis.__i99dashHost) != null ? _b : null;
  function inHost() {
    return host != null;
  }
  async function call(handler, payload = {}) {
    if (!host) throw new Error("not_inside_host");
    return host.callHandler(handler, payload);
  }
  var _a2;
  var events = (_a2 = globalThis.__i99dashEvents) != null ? _a2 : globalThis.__i99dashEvents = {
    _handlers: /* @__PURE__ */ Object.create(null),
    on(channel, fn) {
      var _a3, _b2;
      ((_b2 = (_a3 = this._handlers)[channel]) != null ? _b2 : _a3[channel] = /* @__PURE__ */ new Set()).add(fn);
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
  function on(channel, fn) {
    return events.on(channel, fn);
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

  // src/widgets.js
  var COLORS = [
    { id: "cyan", hex: "#22d3ee" },
    { id: "green", hex: "#22c55e" },
    { id: "amber", hex: "#f59e0b" },
    { id: "red", hex: "#ef4444" },
    { id: "violet", hex: "#a78bfa" },
    { id: "pink", hex: "#f472b6" },
    { id: "lime", hex: "#a3e635" },
    { id: "white", hex: "#f1f5f9" }
  ];
  var COLOR_BY_ID = Object.fromEntries(COLORS.map((c) => [c.id, c.hex]));
  function colorHex(id) {
    var _a3;
    return (_a3 = COLOR_BY_ID[id]) != null ? _a3 : COLOR_BY_ID.cyan;
  }
  var THEMES = [
    { id: "stealth", label: "Stealth", emoji: "\u{1F311}", desc: "Pure dark, ultra-clean", defaultAccent: "cyan" },
    { id: "neon", label: "Neon", emoji: "\u{1F308}", desc: "Saturated synthwave dream", defaultAccent: "pink" },
    { id: "race", label: "Race", emoji: "\u{1F3C1}", desc: "Track day, red and angry", defaultAccent: "red" },
    { id: "glass", label: "Glass", emoji: "\u{1F48E}", desc: "Frosted, translucent panes", defaultAccent: "cyan" },
    { id: "classic", label: "Classic", emoji: "\u{1F6DE}", desc: "BMW M orange-on-black", defaultAccent: "amber" },
    { id: "sunset", label: "Sunset", emoji: "\u{1F305}", desc: "Peach + coral gradient", defaultAccent: "amber" },
    { id: "y2k", label: "Y2K", emoji: "\u{1F4BF}", desc: "Chrome holo, lavender mesh", defaultAccent: "violet" }
  ];
  var THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t]));
  var WIDGETS = [
    {
      id: "speed",
      label: "Speed",
      emoji: "\u{1F4A8}",
      signals: ["speed_kmh"],
      read(signals) {
        var _a3;
        return { value: (_a3 = signals.speed_kmh) != null ? _a3 : 0, label: "Speed", unit: "km/h", max: 180, min: 0 };
      }
    },
    {
      id: "rpm",
      label: "RPM",
      emoji: "\u26A1",
      signals: ["motor_f_rpm", "motor_r_rpm", "engine_rpm"],
      read(s) {
        var _a3, _b2, _c;
        const v = s.motor_f_rpm != null || s.motor_r_rpm != null ? Math.max((_a3 = s.motor_f_rpm) != null ? _a3 : 0, (_b2 = s.motor_r_rpm) != null ? _b2 : 0) : (_c = s.engine_rpm) != null ? _c : 0;
        return { value: v, label: "RPM", unit: "rpm", max: 8e3, min: 0 };
      }
    },
    {
      id: "battery",
      label: "Battery",
      emoji: "\u{1F50B}",
      signals: ["battery_pct"],
      read(s) {
        var _a3;
        return { value: (_a3 = s.battery_pct) != null ? _a3 : 0, label: "Battery", unit: "%", max: 100, min: 0 };
      }
    },
    {
      id: "ev-range",
      label: "EV range",
      emoji: "\u{1F331}",
      signals: ["range_ev_km"],
      read(s) {
        var _a3;
        return { value: (_a3 = s.range_ev_km) != null ? _a3 : 0, label: "EV range", unit: "km", max: 600, min: 0 };
      }
    },
    {
      id: "fuel-range",
      label: "Fuel range",
      emoji: "\u26FD",
      signals: ["range_fuel_km"],
      read(s) {
        var _a3;
        return { value: (_a3 = s.range_fuel_km) != null ? _a3 : 0, label: "Fuel range", unit: "km", max: 1e3, min: 0 };
      }
    },
    {
      id: "cabin-temp",
      label: "Cabin temp",
      emoji: "\u{1F321}\uFE0F",
      signals: ["ac_cabin_temp"],
      read(s) {
        var _a3;
        return { value: (_a3 = s.ac_cabin_temp) != null ? _a3 : 0, label: "Cabin", unit: "\xB0C", max: 40, min: -10 };
      }
    }
  ];
  var WIDGET_BY_ID = Object.fromEntries(WIDGETS.map((w) => [w.id, w]));
  var STYLES = [
    { id: "dial", label: "Dial", emoji: "\u{1F3AF}" },
    { id: "digital", label: "Digital", emoji: "\u{1F522}" },
    { id: "bar", label: "Bar", emoji: "\u{1F4CA}" },
    { id: "ring", label: "Ring", emoji: "\u2B55" }
  ];
  var STYLE_IDS = new Set(STYLES.map((s) => s.id));
  var POSITIONS = [
    { id: "tl", label: "Top-left", emoji: "\u2196" },
    { id: "tr", label: "Top-right", emoji: "\u2197" },
    { id: "bl", label: "Bottom-left", emoji: "\u2199" },
    { id: "br", label: "Bottom-right", emoji: "\u2198" }
  ];
  var POSITION_IDS = new Set(POSITIONS.map((p) => p.id));
  var SIZES = [
    { id: "S", label: "Small" },
    { id: "M", label: "Medium" },
    { id: "L", label: "Large" }
  ];
  var SIZE_IDS = new Set(SIZES.map((s) => s.id));
  function defaultPosition(slotIndex) {
    return slotIndex === 2 ? "br" : "bl";
  }
  var BACKGROUNDS = [
    { id: "none", label: "None", emoji: "\u2B55", url: "", kind: "image" },
    { id: "road", label: "Road", emoji: "\u{1F6E3}\uFE0F", url: "./bg-road.svg", kind: "image" },
    { id: "cyber", label: "Cyber", emoji: "\u{1F303}", url: "./bg-cyber.svg", kind: "image" },
    { id: "garage", label: "Garage", emoji: "\u{1F3CE}\uFE0F", url: "./bg-garage.svg", kind: "image" }
  ];
  var BACKGROUND_BY_ID = Object.fromEntries(BACKGROUNDS.map((b) => [b.id, b]));
  var VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v)(\?|$)/i;
  function resolveBackground(bg) {
    var _a3;
    if (!bg) return { kind: "image", url: "" };
    if (typeof bg === "string") {
      const preset = BACKGROUND_BY_ID[bg];
      if (preset) return { kind: preset.kind, url: preset.url };
      return { kind: VIDEO_EXT_RE.test(bg) ? "video" : "image", url: bg };
    }
    if (typeof bg !== "object") return { kind: "image", url: "" };
    const url = (_a3 = bg.url) != null ? _a3 : "";
    const kind = bg.kind === "video" || VIDEO_EXT_RE.test(url) ? "video" : "image";
    return { kind, url };
  }
  function fraction(value, min, max) {
    if (max === min) return 0;
    return Math.min(Math.max((value - min) / (max - min), 0), 1);
  }
  function fmtValue(v, unit) {
    if (v == null || Number.isNaN(v)) return "\u2014";
    if (unit === "rpm") return Math.round(v).toLocaleString();
    if (Math.abs(v) >= 100) return Math.round(v).toString();
    if (Math.abs(v) >= 10) return v.toFixed(0);
    return v.toFixed(1);
  }
  function readTheme() {
    var _a3;
    const cs = (_a3 = globalThis.getComputedStyle) == null ? void 0 : _a3.call(globalThis, document.documentElement);
    return {
      panel: (cs == null ? void 0 : cs.getPropertyValue("--gauge-panel").trim()) || "#0f1421",
      track: (cs == null ? void 0 : cs.getPropertyValue("--gauge-track").trim()) || "#1f2a44",
      text: (cs == null ? void 0 : cs.getPropertyValue("--gauge-text").trim()) || "#e6e9ef",
      muted: (cs == null ? void 0 : cs.getPropertyValue("--gauge-muted").trim()) || "#6c7a93",
      font: (cs == null ? void 0 : cs.getPropertyValue("--gauge-font").trim()) || "ui-sans-serif, system-ui, sans-serif"
    };
  }
  function paintDial(ctx, rect, data, color, isHero) {
    const t = readTheme();
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2 - (isHero ? 16 : 8);
    const r = Math.min(rect.w, rect.h) * (isHero ? 0.36 : 0.32);
    const start = Math.PI * 0.8;
    const end = Math.PI * 2.2;
    const f = fraction(data.value, data.min, data.max);
    const arcWidth = isHero ? 18 : 10;
    ctx.fillStyle = t.muted;
    ctx.font = `600 ${isHero ? 13 : 10}px ${t.font}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(data.label.toUpperCase(), rect.x + 14, rect.y + 12);
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, end);
    ctx.lineWidth = arcWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = t.track;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r, start, start + (end - start) * f);
    ctx.lineWidth = arcWidth;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = isHero ? 14 : 6;
    ctx.stroke();
    ctx.shadowBlur = 0;
    const ticks = isHero ? 18 : 10;
    for (let i = 0; i <= ticks; i++) {
      const a = start + (end - start) * (i / ticks);
      const major = i % 2 === 0;
      const inner = r - (major ? 18 : 10);
      const outer = r - 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
      ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
      ctx.strokeStyle = "#3b4d72";
      ctx.lineWidth = major ? 2 : 1;
      ctx.stroke();
    }
    if (isHero) {
      const a = start + (end - start) * f;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(r - 28, 0);
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.strokeStyle = color;
      ctx.stroke();
      ctx.restore();
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = t.panel;
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.stroke();
    }
    ctx.fillStyle = t.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${isHero ? 56 : 30}px ${t.font}`;
    ctx.fillText(fmtValue(data.value, data.unit), cx, cy + (isHero ? 56 : 28));
    ctx.fillStyle = t.muted;
    ctx.font = `500 ${isHero ? 14 : 10}px ${t.font}`;
    ctx.fillText(data.unit, cx, cy + (isHero ? 90 : 46));
  }
  function paintDigital(ctx, rect, data, color, isHero) {
    const t = readTheme();
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    ctx.fillStyle = t.muted;
    ctx.font = `600 ${isHero ? 14 : 10}px ${t.font}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(data.label.toUpperCase(), rect.x + 14, rect.y + 12);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = isHero ? 18 : 0;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const sz = isHero ? Math.min(rect.w * 0.28, rect.h * 0.55) : Math.min(rect.w * 0.32, rect.h * 0.62);
    ctx.font = `800 ${sz}px ${t.font}`;
    ctx.fillText(fmtValue(data.value, data.unit), cx, cy - sz * 0.06);
    ctx.shadowBlur = 0;
    ctx.fillStyle = t.muted;
    ctx.font = `500 ${isHero ? 16 : 11}px ${t.font}`;
    ctx.fillText(data.unit, cx, cy + sz * 0.55);
  }
  function paintBar(ctx, rect, data, color, isHero) {
    const t = readTheme();
    const pad = isHero ? 28 : 14;
    const f = fraction(data.value, data.min, data.max);
    ctx.fillStyle = t.muted;
    ctx.font = `600 ${isHero ? 13 : 10}px ${t.font}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(data.label.toUpperCase(), rect.x + pad, rect.y + 12);
    ctx.fillStyle = t.text;
    ctx.textAlign = "right";
    ctx.font = `700 ${isHero ? 36 : 18}px ${t.font}`;
    ctx.fillText(fmtValue(data.value, data.unit), rect.x + rect.w - pad, rect.y + 8);
    ctx.fillStyle = t.muted;
    ctx.font = `500 ${isHero ? 12 : 9}px ${t.font}`;
    ctx.fillText(data.unit, rect.x + rect.w - pad, rect.y + (isHero ? 50 : 30));
    const barH = isHero ? 22 : 10;
    const barY = rect.y + rect.h - pad - barH;
    const barW = rect.w - pad * 2;
    ctx.fillStyle = t.track;
    roundRect(ctx, rect.x + pad, barY, barW, barH, barH / 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = isHero ? 10 : 4;
    const fillW = Math.max(barW * f, barH);
    roundRect(ctx, rect.x + pad, barY, fillW, barH, barH / 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  function paintRing(ctx, rect, data, color, isHero) {
    const t = readTheme();
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const r = Math.min(rect.w, rect.h) * (isHero ? 0.4 : 0.36);
    const ringW = isHero ? 14 : 8;
    const f = fraction(data.value, data.min, data.max);
    ctx.fillStyle = t.muted;
    ctx.font = `600 ${isHero ? 13 : 10}px ${t.font}`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(data.label.toUpperCase(), rect.x + 14, rect.y + 12);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.lineWidth = ringW;
    ctx.strokeStyle = t.track;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f);
    ctx.lineWidth = ringW;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = isHero ? 12 : 5;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = t.text;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${isHero ? 48 : 24}px ${t.font}`;
    ctx.fillText(fmtValue(data.value, data.unit), cx, cy - 4);
    ctx.fillStyle = t.muted;
    ctx.font = `500 ${isHero ? 13 : 9}px ${t.font}`;
    ctx.fillText(data.unit, cx, cy + (isHero ? 30 : 18));
  }
  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, Math.min(w, h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }
  var STYLE_FNS = {
    dial: paintDial,
    digital: paintDigital,
    bar: paintBar,
    ring: paintRing
  };
  function paintStyled(ctx, rect, slot, signals, isHero = false) {
    var _a3;
    const widget = WIDGET_BY_ID[slot == null ? void 0 : slot.widgetId];
    if (!widget) return;
    const data = widget.read(signals);
    const styleFn = (_a3 = STYLE_FNS[slot.style]) != null ? _a3 : paintDial;
    styleFn(ctx, rect, data, colorHex(slot.color), isHero);
  }
  function normalizeSlot(raw, themeId, slotIndex = 0) {
    if (!raw) return null;
    if (typeof raw === "string") {
      return WIDGET_BY_ID[raw] ? {
        widgetId: raw,
        style: "dial",
        color: defaultAccent(themeId),
        background: "none",
        position: defaultPosition(slotIndex),
        size: "M"
      } : null;
    }
    if (typeof raw !== "object") return null;
    if (!WIDGET_BY_ID[raw.widgetId]) return null;
    let bg = raw.background;
    if (typeof bg === "string") {
      const ok = bg === "none" || BACKGROUND_BY_ID[bg] || bg.startsWith("http") || bg.startsWith("data:image/") || bg.startsWith("data:video/");
      if (!ok) bg = "none";
    } else if (bg && typeof bg === "object") {
      if (!bg.url) bg = "none";
    } else {
      bg = "none";
    }
    return {
      widgetId: raw.widgetId,
      style: STYLE_IDS.has(raw.style) ? raw.style : "dial",
      color: COLOR_BY_ID[raw.color] ? raw.color : defaultAccent(themeId),
      background: bg,
      position: POSITION_IDS.has(raw.position) ? raw.position : defaultPosition(slotIndex),
      size: SIZE_IDS.has(raw.size) ? raw.size : "M"
    };
  }
  function defaultAccent(themeId) {
    var _a3, _b2;
    return (_b2 = (_a3 = THEME_BY_ID[themeId]) == null ? void 0 : _a3.defaultAccent) != null ? _b2 : "cyan";
  }
  function signalsForLayout(layout) {
    var _a3;
    const names = /* @__PURE__ */ new Set();
    for (const slot of (_a3 = layout == null ? void 0 : layout.slots) != null ? _a3 : []) {
      if (!(slot == null ? void 0 : slot.widgetId)) continue;
      const w = WIDGET_BY_ID[slot.widgetId];
      if (!w) continue;
      for (const n of w.signals) names.add(n);
    }
    return Array.from(names);
  }

  // src/cluster.js
  var HERO_INDEX = 1;
  var state = {
    layout: { version: 2, theme: "stealth", slots: [null, null, null] },
    signals: /* @__PURE__ */ Object.create(null),
    lastUpdateAt: 0,
    subscriptionId: null
  };
  function readLayoutFromUrl() {
    const search = location.search.startsWith("?") ? location.search.slice(1) : location.search;
    const hash = location.hash.startsWith("#") ? location.hash.slice(1) : location.hash;
    const params = new URLSearchParams(search || hash);
    const enc = params.get("layout");
    if (!enc) return null;
    try {
      const parsed = JSON.parse(atob(decodeURIComponent(enc)));
      return normalizeLayout(parsed);
    } catch (err) {
      console.warn("cluster: failed to parse layout", err);
      return null;
    }
  }
  function normalizeLayout(raw) {
    if (!raw || typeof raw !== "object") return null;
    const themeId = THEME_BY_ID[raw.theme] ? raw.theme : "stealth";
    const slotsIn = Array.isArray(raw.slots) ? raw.slots : [];
    const slots = new Array(3).fill(null).map((_, i) => normalizeSlot(slotsIn[i], themeId, i));
    return { version: 2, theme: themeId, slots };
  }
  function applyTheme(themeId) {
    document.body.dataset.theme = THEME_BY_ID[themeId] ? themeId : "stealth";
  }
  function slotEls() {
    return [...document.querySelectorAll(".slot")];
  }
  function paintAllSlots() {
    var _a3, _b2;
    for (const el of slotEls()) {
      const idx = parseInt(el.dataset.slot, 10);
      const slot = state.layout.slots[idx];
      const canvas = el.querySelector("canvas");
      const empty = el.querySelector(".empty");
      if (idx !== HERO_INDEX) {
        el.dataset.pos = (_a3 = slot == null ? void 0 : slot.position) != null ? _a3 : idx === 2 ? "br" : "bl";
        el.dataset.size = (_b2 = slot == null ? void 0 : slot.size) != null ? _b2 : "M";
      }
      if (!slot) {
        empty.style.display = "";
        clearCanvas(canvas);
        continue;
      }
      empty.style.display = "none";
      paintSlotCanvas(canvas, slot, idx === HERO_INDEX);
    }
    applyHeroBackground();
  }
  function applyHeroBackground() {
    var _a3, _b2;
    const host2 = document.getElementById("hero-bg");
    if (!host2) return;
    const slot = state.layout.slots[HERO_INDEX];
    const { kind, url } = resolveBackground(slot == null ? void 0 : slot.background);
    if (!url) {
      host2.innerHTML = "";
      return;
    }
    const existing = host2.firstElementChild;
    if (((_a3 = existing == null ? void 0 : existing.tagName) == null ? void 0 : _a3.toLowerCase()) === kind && ((_b2 = existing == null ? void 0 : existing.dataset) == null ? void 0 : _b2.url) === url) return;
    host2.innerHTML = "";
    if (kind === "video") {
      const v = document.createElement("video");
      v.src = url;
      v.autoplay = true;
      v.loop = true;
      v.muted = true;
      v.playsInline = true;
      v.dataset.url = url;
      host2.appendChild(v);
    } else {
      const img = document.createElement("img");
      img.src = url;
      img.alt = "";
      img.dataset.url = url;
      host2.appendChild(img);
    }
  }
  function clearCanvas(canvas) {
    if (!canvas.width) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  function paintSlotCanvas(canvas, slot, isHero) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, globalThis.devicePixelRatio || 1);
    const W = Math.floor(rect.width * dpr);
    const H = Math.floor(rect.height * dpr);
    if (W === 0 || H === 0) return;
    if (canvas.width !== W || canvas.height !== H) {
      canvas.width = W;
      canvas.height = H;
    }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.scale(dpr, dpr);
    paintStyled(ctx, { x: 0, y: 0, w: rect.width, h: rect.height }, slot, state.signals, isHero);
    ctx.restore();
  }
  async function subscribe() {
    var _a3;
    if (!inHost()) return;
    const names = signalsForLayout(state.layout);
    if (names.length === 0) return;
    try {
      const seed = await call("car.read", { names });
      if (seed == null ? void 0 : seed.values) {
        Object.assign(state.signals, seed.values);
        state.lastUpdateAt = Date.now();
      }
      const result = await call("car.subscribe", { names, idempotencyKey: cryptoUuid() });
      state.subscriptionId = (_a3 = result == null ? void 0 : result.subscriptionId) != null ? _a3 : null;
    } catch (err) {
      console.warn("cluster car.subscribe failed:", err);
    }
  }
  function bindLiveStreams() {
    on("car.signal", (payload) => {
      var _a3;
      const ev = (_a3 = payload == null ? void 0 : payload.data) != null ? _a3 : payload;
      if (!(ev == null ? void 0 : ev.name)) return;
      if (state.subscriptionId && (payload == null ? void 0 : payload.subscriptionId) && payload.subscriptionId !== state.subscriptionId) return;
      state.signals[ev.name] = ev.value;
      state.lastUpdateAt = Date.now();
    });
    on("car.connection", (payload) => {
      var _a3;
      const s = (_a3 = payload == null ? void 0 : payload.state) != null ? _a3 : payload;
      const dot = document.getElementById("conn-dot");
      const text = document.getElementById("conn-text");
      dot.classList.remove("connected", "degraded", "disconnected");
      if (typeof s === "string") {
        dot.classList.add(s);
        text.textContent = `cluster \xB7 ${s}`;
      } else {
        text.textContent = "cluster \xB7 unknown";
      }
    });
  }
  function tick() {
    paintAllSlots();
    requestAnimationFrame(tick);
  }
  async function main() {
    const layout = readLayoutFromUrl();
    if (layout) state.layout = layout;
    applyTheme(state.layout.theme);
    bindLiveStreams();
    if (inHost()) {
      call("car.connection.subscribe").catch(() => {
      });
      await subscribe();
    } else {
      document.getElementById("conn-text").textContent = "cluster \xB7 static frame";
    }
    requestAnimationFrame(tick);
    globalThis.addEventListener("hashchange", async () => {
      const next = readLayoutFromUrl();
      if (!next) return;
      state.layout = next;
      applyTheme(state.layout.theme);
      await subscribe();
    });
  }
  main().catch((err) => {
    console.error("cluster fatal:", err);
  });
})();
