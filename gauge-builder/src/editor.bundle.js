(() => {
  // src/bridge.js
  var G = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {};
  function resolveHost() {
    const branded = G.__i99dashHost;
    if (branded && typeof branded.callHandler === "function") return branded;
    const legacy = G.flutter_inappwebview;
    if (legacy && typeof legacy.callHandler === "function") return legacy;
    return null;
  }
  var host = resolveHost();
  function inHost() {
    return resolveHost() != null;
  }
  function whenHostReady(timeoutMs = 8e3) {
    return new Promise((resolve) => {
      const now = resolveHost();
      if (now) return resolve(now);
      const w = typeof window !== "undefined" ? window : null;
      let settled = false;
      const finish = (h) => {
        if (settled) return;
        settled = true;
        if (w) w.removeEventListener("flutterInAppWebViewPlatformReady", onReady);
        clearInterval(poll);
        clearTimeout(timer);
        resolve(h);
      };
      const tryNow = () => {
        const h = resolveHost();
        if (h) finish(h);
      };
      const onReady = () => tryNow();
      if (w) w.addEventListener("flutterInAppWebViewPlatformReady", onReady);
      const poll = setInterval(tryNow, 150);
      const timer = setTimeout(() => finish(resolveHost()), timeoutMs);
    });
  }
  async function call(handler, payload = {}) {
    const h = await whenHostReady();
    if (!h) throw new Error("not_inside_host");
    return h.callHandler(handler, payload);
  }
  async function callNative(handler, params = {}) {
    var _a2, _b, _c, _d;
    const h = await whenHostReady();
    if (!h) throw new Error("not_inside_host");
    const raw = await h.callHandler(handler, {
      params,
      idempotencyKey: cryptoUuid()
    });
    if (raw && raw.success === false) {
      const err = (_a2 = raw.error) != null ? _a2 : {};
      throw new Error(`${(_b = err.code) != null ? _b : "host_error"}: ${(_c = err.message) != null ? _c : "unknown"}`);
    }
    return (_d = raw && raw.data) != null ? _d : raw;
  }
  var _a;
  var events = (_a = G.__i99dashEvents) != null ? _a : G.__i99dashEvents = {
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
  function on(channel, fn) {
    return events.on(channel, fn);
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
    var _a2;
    return (_a2 = COLOR_BY_ID[id]) != null ? _a2 : COLOR_BY_ID.cyan;
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
        var _a2;
        return { value: (_a2 = signals.speed_kmh) != null ? _a2 : 0, label: "Speed", unit: "km/h", max: 180, min: 0 };
      }
    },
    {
      id: "rpm",
      label: "RPM",
      emoji: "\u26A1",
      signals: ["motor_f_rpm", "motor_r_rpm", "engine_rpm"],
      read(s) {
        var _a2, _b, _c;
        const v = s.motor_f_rpm != null || s.motor_r_rpm != null ? Math.max((_a2 = s.motor_f_rpm) != null ? _a2 : 0, (_b = s.motor_r_rpm) != null ? _b : 0) : (_c = s.engine_rpm) != null ? _c : 0;
        return { value: v, label: "RPM", unit: "rpm", max: 8e3, min: 0 };
      }
    },
    {
      id: "battery",
      label: "Battery",
      emoji: "\u{1F50B}",
      signals: ["battery_pct"],
      read(s) {
        var _a2;
        return { value: (_a2 = s.battery_pct) != null ? _a2 : 0, label: "Battery", unit: "%", max: 100, min: 0 };
      }
    },
    {
      id: "ev-range",
      label: "EV range",
      emoji: "\u{1F331}",
      signals: ["range_ev_km"],
      read(s) {
        var _a2;
        return { value: (_a2 = s.range_ev_km) != null ? _a2 : 0, label: "EV range", unit: "km", max: 600, min: 0 };
      }
    },
    {
      id: "fuel-range",
      label: "Fuel range",
      emoji: "\u26FD",
      signals: ["range_fuel_km"],
      read(s) {
        var _a2;
        return { value: (_a2 = s.range_fuel_km) != null ? _a2 : 0, label: "Fuel range", unit: "km", max: 1e3, min: 0 };
      }
    },
    {
      id: "cabin-temp",
      label: "Cabin temp",
      emoji: "\u{1F321}\uFE0F",
      signals: ["ac_cabin_temp"],
      read(s) {
        var _a2;
        return { value: (_a2 = s.ac_cabin_temp) != null ? _a2 : 0, label: "Cabin", unit: "\xB0C", max: 40, min: -10 };
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
    var _a2;
    if (!bg) return { kind: "image", url: "" };
    if (typeof bg === "string") {
      const preset = BACKGROUND_BY_ID[bg];
      if (preset) return { kind: preset.kind, url: preset.url };
      return { kind: VIDEO_EXT_RE.test(bg) ? "video" : "image", url: bg };
    }
    if (typeof bg !== "object") return { kind: "image", url: "" };
    const url = (_a2 = bg.url) != null ? _a2 : "";
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
    var _a2;
    const cs = (_a2 = globalThis.getComputedStyle) == null ? void 0 : _a2.call(globalThis, document.documentElement);
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
    var _a2;
    const widget = WIDGET_BY_ID[slot == null ? void 0 : slot.widgetId];
    if (!widget) return;
    const data = widget.read(signals);
    const styleFn = (_a2 = STYLE_FNS[slot.style]) != null ? _a2 : paintDial;
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
    var _a2, _b;
    return (_b = (_a2 = THEME_BY_ID[themeId]) == null ? void 0 : _a2.defaultAccent) != null ? _b : "cyan";
  }
  function signalsForLayout(layout) {
    var _a2;
    const names = /* @__PURE__ */ new Set();
    for (const slot of (_a2 = layout == null ? void 0 : layout.slots) != null ? _a2 : []) {
      if (!(slot == null ? void 0 : slot.widgetId)) continue;
      const w = WIDGET_BY_ID[slot.widgetId];
      if (!w) continue;
      for (const n of w.signals) names.add(n);
    }
    return Array.from(names);
  }

  // src/editor.js
  var PRESETS = {
    race: {
      theme: "race",
      slots: [
        { widgetId: "rpm", style: "bar", color: "amber" },
        { widgetId: "speed", style: "dial", color: "red", background: "cyber" },
        { widgetId: "battery", style: "digital", color: "red" }
      ]
    },
    eco: {
      theme: "glass",
      slots: [
        { widgetId: "ev-range", style: "digital", color: "green" },
        { widgetId: "battery", style: "ring", color: "green", background: "road" },
        { widgetId: "cabin-temp", style: "digital", color: "cyan" }
      ]
    },
    night: {
      theme: "neon",
      slots: [
        { widgetId: "rpm", style: "bar", color: "pink" },
        { widgetId: "speed", style: "ring", color: "violet", background: "cyber" },
        { widgetId: "battery", style: "digital", color: "pink" }
      ]
    },
    minimal: {
      theme: "stealth",
      slots: [
        { widgetId: "battery", style: "digital", color: "white" },
        { widgetId: "speed", style: "ring", color: "cyan" },
        { widgetId: "ev-range", style: "digital", color: "white" }
      ]
    }
  };
  if (!inHost()) {
    document.getElementById("notice").classList.add("shown");
  }
  var SLOT_COUNT = 3;
  var HERO_INDEX = 1;
  var STORAGE_KEY = (deviceId) => `gauge-builder:layout:${deviceId != null ? deviceId : "unknown"}`;
  var selectedWidgetId = null;
  var editingSlot = null;
  var state = {
    identity: null,
    deviceId: null,
    layout: {
      version: 2,
      theme: "stealth",
      slots: new Array(SLOT_COUNT).fill(null)
    },
    signals: /* @__PURE__ */ Object.create(null),
    lastUpdateAt: 0,
    subscriptionId: null,
    surfaceId: null,
    driverTargetId: null,
    driverTargetKind: null,
    canPushToCluster: false,
    blockedReason: null,
    debug: {
      bridgeAvailable: false,
      identity: null,
      displayListAttempts: [],
      snapshot: null,
      error: null
    }
  };
  function applyTheme(themeId) {
    var _a2;
    const theme = (_a2 = THEME_BY_ID[themeId]) != null ? _a2 : THEMES[0];
    document.body.dataset.theme = theme.id;
    document.getElementById("theme-name").textContent = theme.label;
    state.layout.theme = theme.id;
  }
  function renderPalette() {
    var _a2;
    const host2 = document.getElementById("widget-grid");
    if (!host2) return;
    host2.innerHTML = "";
    for (const w of WIDGETS) {
      const tile = document.createElement("div");
      tile.className = "widget-tile";
      tile.dataset.widgetId = w.id;
      tile.innerHTML = `<span class="glyph">${(_a2 = w.emoji) != null ? _a2 : w.label[0]}</span><span class="name">${w.label}</span>`;
      tile.addEventListener("click", () => {
        if (selectedWidgetId === w.id) {
          clearSelection();
        } else {
          selectWidget(w.id);
          hideSheets();
        }
      });
      host2.appendChild(tile);
    }
  }
  function selectWidget(id) {
    selectedWidgetId = id;
    document.body.classList.add("placing");
    for (const tile of document.querySelectorAll(".widget-tile")) {
      tile.classList.toggle("selected", tile.dataset.widgetId === id);
    }
  }
  function clearSelection() {
    selectedWidgetId = null;
    document.body.classList.remove("placing");
    for (const tile of document.querySelectorAll(".widget-tile")) {
      tile.classList.remove("selected");
    }
  }
  function slotEls() {
    return [...document.querySelectorAll(".slot")];
  }
  var LONG_PRESS_MS = 480;
  function bindSlotEvents() {
    for (const el of slotEls()) {
      const idx = parseInt(el.dataset.slot, 10);
      let timer = null;
      let longPressed = false;
      const start = (e) => {
        longPressed = false;
        timer = setTimeout(() => {
          if (state.layout.slots[idx]) {
            longPressed = true;
            openSlotSheet(idx);
          }
        }, LONG_PRESS_MS);
      };
      const cancel = () => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      };
      el.addEventListener("pointerdown", start);
      el.addEventListener("pointerup", cancel);
      el.addEventListener("pointercancel", cancel);
      el.addEventListener("pointerleave", cancel);
      el.addEventListener("click", (e) => {
        if (longPressed) {
          longPressed = false;
          return;
        }
        if (e.target.closest("[data-clear]")) return;
        if (selectedWidgetId) {
          placeWidget(idx, selectedWidgetId);
          clearSelection();
        }
      });
    }
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-clear]");
      if (!t) return;
      setSlot(parseInt(t.dataset.clear, 10), null);
    });
  }
  function resetLayout() {
    state.layout.slots = new Array(SLOT_COUNT).fill(null);
    clearSelection();
    persist();
    paintAllSlots();
    updateLayoutBadge();
    reconcileSubscription();
  }
  function placeWidget(idx, widgetId) {
    const def = {
      widgetId,
      style: idx === HERO_INDEX ? "dial" : "digital",
      color: defaultAccent(state.layout.theme),
      background: "none",
      position: defaultPosition(idx),
      size: "M"
    };
    setSlot(idx, def);
  }
  function setSlot(idx, slotOrNull) {
    state.layout.slots[idx] = slotOrNull;
    persist();
    paintAllSlots();
    updateLayoutBadge();
    reconcileSubscription();
  }
  function paintAllSlots() {
    var _a2, _b;
    for (const el of slotEls()) {
      const idx = parseInt(el.dataset.slot, 10);
      const slot = state.layout.slots[idx];
      const empty = el.querySelector(".empty");
      const canvas = el.querySelector("canvas");
      el.classList.toggle("filled", !!slot);
      empty.style.display = slot ? "none" : "";
      if (idx !== HERO_INDEX) {
        el.dataset.pos = (_a2 = slot == null ? void 0 : slot.position) != null ? _a2 : defaultPosition(idx);
        el.dataset.size = (_b = slot == null ? void 0 : slot.size) != null ? _b : "M";
      }
      if (!slot) {
        clearCanvas(canvas);
        continue;
      }
      paintSlotCanvas(canvas, slot, idx === HERO_INDEX);
    }
    applyHeroBackground();
    renderSlotChips();
    renderSlotIndicators();
  }
  function renderSlotIndicators() {
    const host2 = document.getElementById("slot-indicators");
    if (!host2) return;
    const dots = host2.querySelectorAll(".si");
    for (let i = 0; i < dots.length; i++) {
      dots[i].classList.toggle("filled", !!state.layout.slots[i]);
    }
  }
  function applyHeroBackground() {
    var _a2, _b;
    const host2 = document.getElementById("hero-bg");
    if (!host2) return;
    const slot = state.layout.slots[HERO_INDEX];
    const { kind, url } = resolveBackground(slot == null ? void 0 : slot.background);
    if (!url) {
      host2.innerHTML = "";
      return;
    }
    const existing = host2.firstElementChild;
    const sameKind = ((_a2 = existing == null ? void 0 : existing.tagName) == null ? void 0 : _a2.toLowerCase()) === kind;
    const sameUrl = ((_b = existing == null ? void 0 : existing.dataset) == null ? void 0 : _b.url) === url;
    if (sameKind && sameUrl) return;
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
    paintStyled(
      ctx,
      { x: 0, y: 0, w: rect.width, h: rect.height },
      slot,
      state.signals,
      isHero
    );
    ctx.restore();
  }
  function renderSlotChips() {
    var _a2, _b, _c, _d;
    const host2 = document.getElementById("slot-chips");
    if (!host2) return;
    host2.innerHTML = "";
    for (let i = 0; i < SLOT_COUNT; i++) {
      const slot = state.layout.slots[i];
      const chip = document.createElement("div");
      chip.className = "slot-chip" + (slot ? "" : " empty");
      const label = `SLOT ${i + 1}${i === HERO_INDEX ? " \xB7 HERO" : ""}`;
      if (slot) {
        const w = WIDGET_BY_ID[slot.widgetId];
        const s = STYLES.find((x) => x.id === slot.style);
        chip.innerHTML = `
        <span class="label">${label}</span>
        <span class="em">${(_a2 = w == null ? void 0 : w.emoji) != null ? _a2 : "\u2022"}</span>
        <span class="desc">${(_b = w == null ? void 0 : w.label) != null ? _b : slot.widgetId} \xB7 ${(_c = s == null ? void 0 : s.emoji) != null ? _c : ""} ${(_d = s == null ? void 0 : s.label) != null ? _d : slot.style}</span>
        <span class="swatch-mini" style="background:${colorHex(slot.color)}"></span>
        <button class="x" data-clear-tool="${i}" title="Clear slot">\xD7</button>
      `;
        chip.addEventListener("click", (e) => {
          if (e.target.closest("[data-clear-tool]")) return;
          openSlotSheet(i);
        });
      } else {
        chip.innerHTML = `
        <span class="label">${label}</span>
        <span class="em">\xB7</span>
        <span class="desc">empty \u2014 tap a widget then a slot</span>
        <span class="swatch-mini"></span>
        <button class="x">\xD7</button>
      `;
      }
      host2.appendChild(chip);
    }
  }
  function bindToolsEvents() {
    var _a2, _b;
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-clear-tool]");
      if (t) {
        e.stopPropagation();
        setSlot(parseInt(t.dataset.clearTool, 10), null);
      }
    });
    (_a2 = document.getElementById("quick-actions")) == null ? void 0 : _a2.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      runQuickAction(btn.dataset.action);
    });
    (_b = document.getElementById("presets")) == null ? void 0 : _b.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-preset]");
      if (!btn) return;
      loadPreset(btn.dataset.preset);
    });
  }
  function runQuickAction(action) {
    const s = state.layout.slots;
    switch (action) {
      case "mirror":
        if (!s[0]) return;
        s[2] = { ...s[0] };
        break;
      case "swap":
        [s[0], s[2]] = [s[2], s[0]];
        break;
      case "match":
        if (!s[HERO_INDEX]) return;
        for (let i = 0; i < SLOT_COUNT; i++) {
          if (s[i]) s[i].color = s[HERO_INDEX].color;
        }
        break;
      case "hero":
        if (!s[0]) return;
        s[HERO_INDEX] = { ...s[0], style: "dial" };
        s[0] = null;
        break;
    }
    persist();
    paintAllSlots();
    updateLayoutBadge();
    reconcileSubscription();
  }
  function loadPreset(id) {
    const p = PRESETS[id];
    if (!p) return;
    applyTheme(p.theme);
    state.layout.slots = p.slots.map((raw, i) => normalizeSlot(raw, p.theme, i));
    persist();
    paintAllSlots();
    updateLayoutBadge();
    reconcileSubscription();
  }
  function openSlotSheet(idx) {
    var _a2;
    const slot = state.layout.slots[idx];
    if (!slot) return;
    const w = WIDGET_BY_ID[slot.widgetId];
    document.getElementById("slot-sheet-title").textContent = `Customize \xB7 ${(_a2 = w == null ? void 0 : w.label) != null ? _a2 : "slot"}`;
    document.getElementById("slot-sheet-sub").textContent = idx === HERO_INDEX ? "Hero slot \u2014 fills the cluster face." : "Overlay slot.";
    renderStyleChips(slot.style);
    renderColorSwatches(slot.color);
    const layoutRow = document.getElementById("layout-row");
    if (idx === HERO_INDEX) {
      layoutRow.hidden = true;
    } else {
      layoutRow.hidden = false;
      renderPositionChips(slot.position);
      renderSizeChips(slot.size);
    }
    const bgRow = document.getElementById("bg-row");
    if (idx === HERO_INDEX) {
      bgRow.hidden = false;
      renderBackgroundChips(slot.background);
    } else {
      bgRow.hidden = true;
    }
    showSheet("slot-sheet");
    editingSlot = idx;
  }
  function renderPositionChips(activeId) {
    const host2 = document.getElementById("position-chips");
    host2.innerHTML = "";
    for (const p of POSITIONS) {
      const chip = document.createElement("div");
      chip.className = "chip" + (p.id === activeId ? " active" : "");
      chip.textContent = `${p.emoji} ${p.label}`;
      chip.addEventListener("click", () => {
        if (editingSlot == null) return;
        const slot = state.layout.slots[editingSlot];
        if (!slot) return;
        slot.position = p.id;
        persist();
        paintAllSlots();
        renderPositionChips(p.id);
      });
      host2.appendChild(chip);
    }
  }
  function renderSizeChips(activeId) {
    const host2 = document.getElementById("size-chips");
    host2.innerHTML = "";
    for (const s of SIZES) {
      const chip = document.createElement("div");
      chip.className = "chip" + (s.id === activeId ? " active" : "");
      chip.textContent = `${s.id} \xB7 ${s.label}`;
      chip.addEventListener("click", () => {
        if (editingSlot == null) return;
        const slot = state.layout.slots[editingSlot];
        if (!slot) return;
        slot.size = s.id;
        persist();
        paintAllSlots();
        renderSizeChips(s.id);
      });
      host2.appendChild(chip);
    }
  }
  function renderBackgroundChips(active) {
    var _a2;
    const host2 = document.getElementById("bg-chips");
    host2.innerHTML = "";
    const activeId = typeof active === "string" && BACKGROUND_BY_ID[active] ? active : null;
    const isCustomUpload = typeof active === "string" && active.startsWith("data:");
    const isCustomUrl = typeof active === "string" && active.startsWith("http");
    for (const b of BACKGROUNDS) {
      const chip = document.createElement("div");
      chip.className = "chip" + (b.id === activeId ? " active" : "");
      chip.textContent = `${(_a2 = b.emoji) != null ? _a2 : ""} ${b.label}`.trim();
      chip.addEventListener("click", () => {
        if (editingSlot == null) return;
        const slot = state.layout.slots[editingSlot];
        if (!slot) return;
        slot.background = b.id;
        persist();
        paintAllSlots();
        renderBackgroundChips(b.id);
        const input2 = document.getElementById("bg-url");
        if (input2) input2.value = "";
        setBgStatus("");
      });
      host2.appendChild(chip);
    }
    const upload = document.createElement("div");
    upload.className = "chip" + (isCustomUpload ? " active" : "");
    upload.textContent = isCustomUpload ? "\u{1F4C1} Upload \u2713" : "\u{1F4C1} Upload\u2026";
    upload.addEventListener("click", () => {
      var _a3;
      (_a3 = document.getElementById("bg-file")) == null ? void 0 : _a3.click();
    });
    host2.appendChild(upload);
    const input = document.getElementById("bg-url");
    if (input) {
      input.value = isCustomUrl ? active : "";
      input.onchange = () => commitBackgroundUrl(input.value.trim());
      input.onkeydown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commitBackgroundUrl(input.value.trim());
          input.blur();
        }
      };
    }
    if (isCustomUpload) {
      const kb = Math.round(active.length * 3 / 4 / 1024);
      setBgStatus(`Custom image embedded \xB7 \u2248${kb} KB`);
    } else if (isCustomUrl) {
      setBgStatus(`Remote URL \xB7 ${shortenUrl(active)}`);
    } else {
      setBgStatus("");
    }
  }
  function setBgStatus(msg) {
    const el = document.getElementById("bg-status");
    if (el) el.textContent = msg;
  }
  function shortenUrl(u) {
    if (u.length < 60) return u;
    return `${u.slice(0, 40)}\u2026${u.slice(-12)}`;
  }
  async function uploadBgFromFile(file) {
    var _a2, _b;
    if (!file || !((_a2 = file.type) == null ? void 0 : _a2.startsWith("image/"))) {
      setBgStatus("Only image files are supported via upload.");
      return;
    }
    setBgStatus("Reading image\u2026");
    try {
      const original = await readFileAsDataURL(file);
      const img = await loadImage(original);
      const MAX = 600;
      const ratio = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1);
      const w = Math.max(1, Math.round(img.naturalWidth * ratio));
      const h = Math.max(1, Math.round(img.naturalHeight * ratio));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
      drawCenterCropped(ctx, img, w, h);
      const finalUrl = canvas.toDataURL("image/jpeg", 0.78);
      void dataUrl;
      if (editingSlot == null) return;
      const slot = state.layout.slots[editingSlot];
      if (!slot) return;
      slot.background = finalUrl;
      persist();
      paintAllSlots();
      renderBackgroundChips(slot.background);
    } catch (err) {
      console.error("uploadBgFromFile failed", err);
      setBgStatus(`Upload failed: ${(_b = err == null ? void 0 : err.message) != null ? _b : err}`);
    }
  }
  function drawCenterCropped(ctx, img, w, h) {
    const srcRatio = img.naturalWidth / img.naturalHeight;
    const dstRatio = w / h;
    let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
    if (srcRatio > dstRatio) {
      sw = img.naturalHeight * dstRatio;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / dstRatio;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  }
  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => {
        var _a2;
        return reject((_a2 = r.error) != null ? _a2 : new Error("read_failed"));
      };
      r.readAsDataURL(file);
    });
  }
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image_decode_failed"));
      img.src = src;
    });
  }
  function commitBackgroundUrl(url) {
    if (editingSlot == null) return;
    const slot = state.layout.slots[editingSlot];
    if (!slot) return;
    if (!url) {
      slot.background = "none";
    } else {
      slot.background = url;
    }
    persist();
    paintAllSlots();
    renderBackgroundChips(slot.background);
  }
  function renderStyleChips(activeId) {
    var _a2;
    const host2 = document.getElementById("style-chips");
    host2.innerHTML = "";
    for (const s of STYLES) {
      const chip = document.createElement("div");
      chip.className = "chip" + (s.id === activeId ? " active" : "");
      chip.textContent = `${(_a2 = s.emoji) != null ? _a2 : ""} ${s.label}`.trim();
      chip.addEventListener("click", () => {
        if (editingSlot == null) return;
        const slot = state.layout.slots[editingSlot];
        if (!slot) return;
        slot.style = s.id;
        persist();
        paintAllSlots();
        renderStyleChips(s.id);
      });
      host2.appendChild(chip);
    }
  }
  function renderColorSwatches(activeId) {
    const host2 = document.getElementById("color-chips");
    host2.innerHTML = "";
    for (const c of COLORS) {
      const sw = document.createElement("div");
      sw.className = "swatch" + (c.id === activeId ? " active" : "");
      sw.style.background = c.hex;
      sw.title = c.id;
      sw.addEventListener("click", () => {
        if (editingSlot == null) return;
        const slot = state.layout.slots[editingSlot];
        if (!slot) return;
        slot.color = c.id;
        persist();
        paintAllSlots();
        renderColorSwatches(c.id);
      });
      host2.appendChild(sw);
    }
  }
  function openThemeSheet() {
    var _a2;
    const host2 = document.getElementById("theme-tiles");
    host2.innerHTML = "";
    for (const t of THEMES) {
      const tile = document.createElement("div");
      tile.className = "theme-tile" + (t.id === state.layout.theme ? " active" : "");
      tile.innerHTML = `
      <div class="name"><span class="em">${(_a2 = t.emoji) != null ? _a2 : "\u2728"}</span> ${t.label}</div>
      <div class="desc">${t.desc}</div>
      <div class="preview" data-theme-preview="${t.id}"></div>
    `;
      tile.addEventListener("click", () => {
        applyTheme(t.id);
        persist();
        paintAllSlots();
        openThemeSheet();
      });
      host2.appendChild(tile);
    }
    for (const node of host2.querySelectorAll("[data-theme-preview]")) {
      const id = node.getAttribute("data-theme-preview");
      paintThemePreview(node, id);
    }
    showSheet("theme-sheet");
  }
  function paintThemePreview(node, themeId) {
    var _a2;
    const probe = document.createElement("div");
    probe.setAttribute("data-theme", themeId);
    probe.style.cssText = "position:absolute; visibility:hidden; pointer-events:none;";
    const previews = {
      stealth: "radial-gradient(circle at 20% 30%, #1e3a8a 0%, transparent 50%), radial-gradient(circle at 80% 70%, #6d28d9 0%, transparent 50%), #06080d",
      neon: "radial-gradient(circle at 20% 30%, #ec4899 0%, transparent 50%), radial-gradient(circle at 80% 70%, #06b6d4 0%, transparent 50%), #0a0518",
      race: "radial-gradient(circle at 50% 30%, #dc2626 0%, transparent 55%), radial-gradient(circle at 80% 80%, #f59e0b 0%, transparent 50%), #0a0606",
      glass: "radial-gradient(circle at 25% 25%, #475569 0%, transparent 50%), radial-gradient(circle at 75% 75%, #38bdf8 0%, transparent 50%), linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      classic: "radial-gradient(circle at 30% 30%, #fbbf24 0%, transparent 35%), linear-gradient(180deg, #0a0805 0%, #050302 100%)",
      sunset: "radial-gradient(circle at 20% 30%, #f97316 0%, transparent 55%), radial-gradient(circle at 80% 60%, #ec4899 0%, transparent 55%), #2d0e1a",
      y2k: "radial-gradient(circle at 25% 30%, #c084fc 0%, transparent 55%), radial-gradient(circle at 75% 70%, #67e8f9 0%, transparent 55%), #1a0f2e"
    };
    node.style.background = (_a2 = previews[themeId]) != null ? _a2 : previews.stealth;
  }
  function showSheet(id) {
    hideSheets();
    document.getElementById("sheet-scrim").classList.add("shown");
    document.getElementById(id).classList.add("shown");
  }
  function hideSheets() {
    var _a2;
    document.getElementById("sheet-scrim").classList.remove("shown");
    for (const id of ["widgets-sheet", "tools-sheet", "more-sheet", "slot-sheet", "theme-sheet"]) {
      (_a2 = document.getElementById(id)) == null ? void 0 : _a2.classList.remove("shown");
    }
    editingSlot = null;
  }
  function surpriseMe() {
    const theme = pickRandom(THEMES).id;
    applyTheme(theme);
    const used = /* @__PURE__ */ new Set();
    const slots = new Array(SLOT_COUNT).fill(null);
    for (let i = 0; i < SLOT_COUNT; i++) {
      const candidates = WIDGETS.filter((w2) => !used.has(w2.id));
      const w = pickRandom(candidates);
      used.add(w.id);
      const styleBias = i === HERO_INDEX ? ["dial", "ring", "dial", "bar"] : ["digital", "bar", "digital", "ring"];
      const style = pickRandom(styleBias);
      const color = pickRandom(COLORS).id;
      const background = i === HERO_INDEX && Math.random() < 0.7 ? pickRandom(BACKGROUNDS.filter((b) => b.id !== "none")).id : "none";
      slots[i] = { widgetId: w.id, style, color, background };
    }
    state.layout.slots = slots;
    persist();
    paintAllSlots();
    updateLayoutBadge();
    reconcileSubscription();
  }
  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }
  function load() {
    var _a2;
    try {
      const raw = localStorage.getItem(STORAGE_KEY(state.deviceId));
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const themeId = (_a2 = parsed.theme) != null ? _a2 : state.layout.theme;
      applyTheme(themeId);
      const slotsIn = Array.isArray(parsed.slots) ? parsed.slots : [];
      state.layout.slots = new Array(SLOT_COUNT).fill(null).map(
        (_, i) => normalizeSlot(slotsIn[i], themeId, i)
      );
    } catch {
    }
  }
  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY(state.deviceId), JSON.stringify(state.layout));
    } catch {
    }
    updateLayoutBadge();
  }
  function updateLayoutBadge() {
    const filled = state.layout.slots.filter(Boolean).length;
    document.getElementById("layout-saved").textContent = filled === 0 ? "layout: empty" : `layout: ${filled}/${SLOT_COUNT} \xB7 ${state.layout.theme}`;
  }
  var FRIENDLY_CLUSTER_RE = /XDJAScreenProjection_1$/i;
  var CLUSTER_PIXEL_CAPS = ["surface.write.cluster", "pkg.launch.cluster.pixel"];
  var DRIVER_LABEL = "Driver";
  async function detectCapabilities() {
    var _a2, _b, _c;
    const attempts = [];
    let snapshot = null;
    try {
      const raw = await callNative("display.list");
      attempts.push({ shape: "envelope {params,idempotencyKey}", response: summarize(raw) });
      if (Array.isArray(raw == null ? void 0 : raw.displays)) snapshot = raw;
    } catch (err) {
      attempts.push({ shape: "envelope {params,idempotencyKey}", error: String((_a2 = err == null ? void 0 : err.message) != null ? _a2 : err) });
    }
    state.debug.displayListAttempts = attempts;
    state.debug.snapshot = snapshot;
    renderDebugPane();
    if (!snapshot) {
      document.getElementById("debug-pane").classList.add("shown");
      setCapBlocked("display.list unavailable on this host \u2014 see debug pane.");
      return;
    }
    const displays = (_b = snapshot.displays) != null ? _b : [];
    const vehicle = (_c = snapshot.vehicle) != null ? _c : null;
    const trim = document.getElementById("trim-badge");
    if (vehicle == null ? void 0 : vehicle.friendlyName) {
      trim.textContent = `trim: ${vehicle.friendlyName}${vehicle.isFallback ? " \xB7 best-effort" : ""}`;
    } else if (vehicle == null ? void 0 : vehicle.dilinkFamily) {
      trim.textContent = `trim: ${vehicle.dilinkFamily}`;
    } else {
      trim.textContent = "trim: unknown";
    }
    const target = resolveDriverTarget(displays, vehicle);
    state.driverTargetKind = target.kind;
    state.driverTargetId = target.displayId;
    if (target.kind === null) {
      setCapBlocked(target.reason);
      return;
    }
    state.canPushToCluster = true;
    state.blockedReason = null;
    const banner = document.getElementById("cap-banner");
    if (target.kind === "driver-panel") {
      banner.classList.add("shown", "info");
      banner.textContent = 'No cluster on this trim \u2014 pushing to the passenger panel labelled "Driver".';
    } else {
      banner.classList.remove("shown", "info");
      banner.textContent = "";
    }
    refreshPushButton();
  }
  function resolveDriverTarget(displays, vehicle) {
    var _a2, _b, _c;
    const caps = (_a2 = vehicle == null ? void 0 : vehicle.capabilities) != null ? _a2 : [];
    const legacyMode = caps.length === 0;
    const cluster = (_b = displays.find(
      (d) => {
        var _a3;
        return (d.role === "cluster" || d.isCluster) && FRIENDLY_CLUSTER_RE.test((_a3 = d.name) != null ? _a3 : "");
      }
    )) != null ? _b : displays.find((d) => d.role === "cluster" || d.isCluster);
    if (cluster) {
      const hasPixelCap = CLUSTER_PIXEL_CAPS.some((c) => caps.includes(c));
      if (legacyMode || hasPixelCap) {
        return { kind: "cluster", displayId: cluster.id, reason: null };
      }
    }
    const driverPanel = displays.find(
      (d) => d.role === "passenger" && d.overrideLabel === DRIVER_LABEL
    );
    if (driverPanel) return { kind: "driver-panel", displayId: driverPanel.id, reason: null };
    if (cluster) {
      const family = (_c = vehicle == null ? void 0 : vehicle.dilinkFamily) != null ? _c : "this trim";
      return { kind: null, displayId: null, reason: `Cluster pixel rendering not supported on ${family} \u2014 preview only.` };
    }
    return { kind: null, displayId: null, reason: "No driver display on this car \u2014 preview only." };
  }
  function setCapBlocked(reason) {
    state.canPushToCluster = false;
    state.blockedReason = reason;
    const banner = document.getElementById("cap-banner");
    banner.textContent = reason;
    banner.classList.add("shown");
    refreshPushButton();
  }
  function summarize(raw) {
    if (raw == null || typeof raw !== "object") return raw;
    const out = {};
    for (const k of Object.keys(raw)) {
      const v = raw[k];
      if (Array.isArray(v)) out[k] = { __array: true, length: v.length, sample: v.slice(0, 3) };
      else out[k] = v;
    }
    return out;
  }
  function renderDebugPane() {
    const out = document.getElementById("debug-output");
    if (!out) return;
    const lines = [`bridge present: ${state.debug.bridgeAvailable}`];
    if (state.debug.identity) lines.push(`car.identity: ${JSON.stringify(state.debug.identity)}`);
    for (const a of state.debug.displayListAttempts) {
      if (a.error) lines.push(`display.list[${a.shape}] \u2192 ERROR ${a.error}`);
      else {
        lines.push(`display.list[${a.shape}] \u2192`);
        lines.push(JSON.stringify(a.response, null, 2));
      }
    }
    if (state.debug.error) lines.push(`error: ${state.debug.error}`);
    out.textContent = lines.join("\n");
  }
  function refreshPushButton() {
    var _a2;
    const btn = document.getElementById("push");
    const filled = state.layout.slots.filter(Boolean).length;
    btn.disabled = !state.canPushToCluster || filled === 0;
    btn.textContent = state.driverTargetKind === "driver-panel" ? "Push to driver panel" : "Push to cluster";
    btn.title = !state.canPushToCluster ? (_a2 = state.blockedReason) != null ? _a2 : "Push unavailable on this trim" : filled === 0 ? "Place at least one widget first" : "Send current layout to the driver display";
  }
  async function push() {
    var _a2, _b;
    if (!state.canPushToCluster || state.driverTargetId == null) return;
    const btn = document.getElementById("push");
    btn.disabled = true;
    const savedLabel = btn.textContent;
    btn.textContent = "Pushing\u2026";
    try {
      if (state.surfaceId) {
        try {
          await callNative("surface.destroy", { surfaceId: state.surfaceId });
        } catch {
        }
        state.surfaceId = null;
      }
      const payload = encodeURIComponent(btoa(JSON.stringify(state.layout)));
      const r = await callNative("surface.create", {
        displayId: state.driverTargetId,
        route: `/cluster.html?layout=${payload}`
      });
      state.surfaceId = (_a2 = r == null ? void 0 : r.surfaceId) != null ? _a2 : null;
      const targetLabel = state.driverTargetKind === "driver-panel" ? "driver panel" : "cluster";
      document.getElementById("layout-saved").textContent = `pushed \xB7 ${state.layout.slots.filter(Boolean).length}/${SLOT_COUNT} on ${targetLabel}`;
    } catch (err) {
      setCapBlocked(`Push failed: ${(_b = err == null ? void 0 : err.message) != null ? _b : err}`);
      console.error("push failed", err);
    } finally {
      btn.textContent = savedLabel;
      refreshPushButton();
    }
  }
  async function reconcileSubscription() {
    var _a2;
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
      state.subscriptionId = (_a2 = result == null ? void 0 : result.subscriptionId) != null ? _a2 : null;
    } catch (err) {
      console.warn("car.subscribe failed:", err);
    }
  }
  function bindLiveStreams() {
    on("car.signal", (payload) => {
      var _a2;
      const ev = (_a2 = payload == null ? void 0 : payload.data) != null ? _a2 : payload;
      if (!(ev == null ? void 0 : ev.name)) return;
      if (state.subscriptionId && (payload == null ? void 0 : payload.subscriptionId) && payload.subscriptionId !== state.subscriptionId) return;
      state.signals[ev.name] = ev.value;
      state.lastUpdateAt = Date.now();
    });
    on("car.connection", (payload) => {
      var _a2;
      const s = (_a2 = payload == null ? void 0 : payload.state) != null ? _a2 : payload;
      const dot = document.getElementById("conn-dot");
      const text = document.getElementById("conn-text");
      dot.classList.remove("connected", "degraded", "disconnected");
      if (typeof s === "string") dot.classList.add(s);
      text.textContent = typeof s === "string" ? s : "unknown";
    });
  }
  async function main() {
    var _a2, _b, _c, _d, _e, _f, _g, _h, _i;
    applyTheme(state.layout.theme);
    renderPalette();
    bindSlotEvents();
    document.getElementById("push").addEventListener("click", push);
    document.getElementById("theme-pill").addEventListener("click", openThemeSheet);
    document.getElementById("open-widgets").addEventListener("click", () => showSheet("widgets-sheet"));
    document.getElementById("open-tools").addEventListener("click", () => showSheet("tools-sheet"));
    document.getElementById("open-more").addEventListener("click", () => showSheet("more-sheet"));
    document.querySelectorAll("[data-close-sheet]").forEach(
      (b) => b.addEventListener("click", hideSheets)
    );
    (_a2 = document.getElementById("more-glowup")) == null ? void 0 : _a2.addEventListener("click", () => {
      hideSheets();
      surpriseMe();
    });
    (_b = document.getElementById("more-reset")) == null ? void 0 : _b.addEventListener("click", () => {
      hideSheets();
      resetLayout();
    });
    (_c = document.getElementById("more-debug")) == null ? void 0 : _c.addEventListener("click", () => {
      hideSheets();
      document.getElementById("debug-pane").classList.toggle("shown");
      renderDebugPane();
    });
    bindToolsEvents();
    const fileInput = document.getElementById("bg-file");
    if (fileInput) {
      fileInput.addEventListener("change", () => {
        var _a3;
        const f = (_a3 = fileInput.files) == null ? void 0 : _a3[0];
        fileInput.value = "";
        if (f) uploadBgFromFile(f);
      });
    }
    document.getElementById("sheet-scrim").addEventListener("click", hideSheets);
    document.getElementById("trim-badge").addEventListener("click", () => {
      const pane = document.getElementById("debug-pane");
      pane.classList.toggle("shown");
      renderDebugPane();
    });
    document.getElementById("debug-close").addEventListener("click", () => {
      document.getElementById("debug-pane").classList.remove("shown");
    });
    state.debug.bridgeAvailable = inHost();
    if (!inHost()) {
      load();
      paintAllSlots();
      updateLayoutBadge();
      renderDebugPane();
      requestAnimationFrame(tick);
      return;
    }
    try {
      const id = await call("car.identity");
      state.identity = id != null ? id : null;
      state.debug.identity = summarize(id);
      state.deviceId = (_e = (_d = id == null ? void 0 : id.deviceId) != null ? _d : id == null ? void 0 : id.modelCode) != null ? _e : null;
      const text = `${((_f = id == null ? void 0 : id.brand) != null ? _f : "unknown").toString().toUpperCase()} \xB7 ${(_h = (_g = id == null ? void 0 : id.modelDisplay) != null ? _g : id == null ? void 0 : id.modelCode) != null ? _h : "\u2014"}`;
      document.getElementById("brand-badge").textContent = text;
    } catch (err) {
      state.debug.error = `car.identity failed: ${(_i = err == null ? void 0 : err.message) != null ? _i : err}`;
      document.getElementById("brand-badge").textContent = "identity unavailable";
    }
    call("car.connection.subscribe").catch(() => {
    });
    bindLiveStreams();
    load();
    paintAllSlots();
    updateLayoutBadge();
    await detectCapabilities();
    await reconcileSubscription();
    requestAnimationFrame(tick);
  }
  function tick() {
    paintAllSlots();
    requestAnimationFrame(tick);
  }
  main().catch((err) => {
    console.error("gauge-builder fatal:", err);
  });
})();
