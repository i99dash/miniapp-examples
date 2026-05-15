/**
 * Widgets, styles, themes — the three customization axes 0.2.0 exposes.
 *
 *   - `WIDGETS`   → what data a slot shows (Speed, RPM, Battery, …).
 *                   Each widget is a pure data extractor: `read(signals)`
 *                   returns `{ value, label, unit, max, min }`. No
 *                   rendering inside the widget.
 *   - `STYLES`    → how a slot renders the data (Dial, Digital, Bar,
 *                   Ring). Each style is `paint(ctx, rect, data, opts)`
 *                   and is widget-agnostic — pass any widget's data to
 *                   any style.
 *   - `THEMES`    → background + panel + default accent + typography
 *                   tokens. Applied via `data-theme` on `<body>`.
 *   - `COLORS`    → 8 accent swatches users can pick per-slot.
 *
 * The slot layout entry is `{ widgetId, style, color }`. Defaults are
 * filled in by `normalizeSlot`. Layouts that lack the new fields
 * (anything published before 0.2.0) load cleanly with sensible
 * defaults.
 */

// ── Colors ───────────────────────────────────────────────────────

export const COLORS = [
  { id: 'cyan',    hex: '#22d3ee' },
  { id: 'green',   hex: '#22c55e' },
  { id: 'amber',   hex: '#f59e0b' },
  { id: 'red',     hex: '#ef4444' },
  { id: 'violet',  hex: '#a78bfa' },
  { id: 'pink',    hex: '#f472b6' },
  { id: 'lime',    hex: '#a3e635' },
  { id: 'white',   hex: '#f1f5f9' },
];
const COLOR_BY_ID = Object.fromEntries(COLORS.map((c) => [c.id, c.hex]));

export function colorHex(id) {
  return COLOR_BY_ID[id] ?? COLOR_BY_ID.cyan;
}

// ── Themes ───────────────────────────────────────────────────────

export const THEMES = [
  { id: 'stealth', label: 'Stealth',  emoji: '🌑', desc: 'Pure dark, ultra-clean',     defaultAccent: 'cyan'   },
  { id: 'neon',    label: 'Neon',     emoji: '🌈', desc: 'Saturated synthwave dream',  defaultAccent: 'pink'   },
  { id: 'race',    label: 'Race',     emoji: '🏁', desc: 'Track day, red and angry',   defaultAccent: 'red'    },
  { id: 'glass',   label: 'Glass',    emoji: '💎', desc: 'Frosted, translucent panes', defaultAccent: 'cyan'   },
  { id: 'classic', label: 'Classic',  emoji: '🛞', desc: 'BMW M orange-on-black',      defaultAccent: 'amber'  },
  { id: 'sunset',  label: 'Sunset',   emoji: '🌅', desc: 'Peach + coral gradient',     defaultAccent: 'amber'  },
  { id: 'y2k',     label: 'Y2K',      emoji: '💿', desc: 'Chrome holo, lavender mesh', defaultAccent: 'violet' },
];
export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t]));

// ── Widgets — pure data extractors ───────────────────────────────

export const WIDGETS = [
  {
    id: 'speed',
    label: 'Speed',
    emoji: '💨',
    signals: ['speed_kmh'],
    read(signals) {
      return { value: signals.speed_kmh ?? 0, label: 'Speed', unit: 'km/h', max: 180, min: 0 };
    },
  },
  {
    id: 'rpm',
    label: 'RPM',
    emoji: '⚡',
    signals: ['motor_f_rpm', 'motor_r_rpm', 'engine_rpm'],
    read(s) {
      const v = s.motor_f_rpm != null || s.motor_r_rpm != null
        ? Math.max(s.motor_f_rpm ?? 0, s.motor_r_rpm ?? 0)
        : (s.engine_rpm ?? 0);
      return { value: v, label: 'RPM', unit: 'rpm', max: 8000, min: 0 };
    },
  },
  {
    id: 'battery',
    label: 'Battery',
    emoji: '🔋',
    signals: ['battery_pct'],
    read(s) {
      return { value: s.battery_pct ?? 0, label: 'Battery', unit: '%', max: 100, min: 0 };
    },
  },
  {
    id: 'ev-range',
    label: 'EV range',
    emoji: '🌱',
    signals: ['range_ev_km'],
    read(s) {
      return { value: s.range_ev_km ?? 0, label: 'EV range', unit: 'km', max: 600, min: 0 };
    },
  },
  {
    id: 'fuel-range',
    label: 'Fuel range',
    emoji: '⛽',
    signals: ['range_fuel_km'],
    read(s) {
      return { value: s.range_fuel_km ?? 0, label: 'Fuel range', unit: 'km', max: 1000, min: 0 };
    },
  },
  {
    id: 'cabin-temp',
    label: 'Cabin temp',
    emoji: '🌡️',
    signals: ['ac_cabin_temp'],
    read(s) {
      return { value: s.ac_cabin_temp ?? 0, label: 'Cabin', unit: '°C', max: 40, min: -10 };
    },
  },
];

export const WIDGET_BY_ID = Object.fromEntries(WIDGETS.map((w) => [w.id, w]));

// ── Styles — widget-agnostic render functions ───────────────────

export const STYLES = [
  { id: 'dial',    label: 'Dial',    emoji: '🎯' },
  { id: 'digital', label: 'Digital', emoji: '🔢' },
  { id: 'bar',     label: 'Bar',     emoji: '📊' },
  { id: 'ring',    label: 'Ring',    emoji: '⭕' },
];
export const STYLE_IDS = new Set(STYLES.map((s) => s.id));

// ── Overlay positions + sizes ────────────────────────────────────
//
// Hero is always full-bleed; overlays (slots 1 and 3) can anchor to
// any corner and scale S/M/L. The defaults preserve the legacy layout
// — slot 1 bottom-left, slot 3 bottom-right, both medium.

export const POSITIONS = [
  { id: 'tl', label: 'Top-left',     emoji: '↖' },
  { id: 'tr', label: 'Top-right',    emoji: '↗' },
  { id: 'bl', label: 'Bottom-left',  emoji: '↙' },
  { id: 'br', label: 'Bottom-right', emoji: '↘' },
];
export const POSITION_IDS = new Set(POSITIONS.map((p) => p.id));

export const SIZES = [
  { id: 'S', label: 'Small'  },
  { id: 'M', label: 'Medium' },
  { id: 'L', label: 'Large'  },
];
export const SIZE_IDS = new Set(SIZES.map((s) => s.id));

export function defaultPosition(slotIndex) {
  // Slot 1 → bottom-left; slot 3 → bottom-right. Hero ignores this.
  return slotIndex === 2 ? 'br' : 'bl';
}

// ── Backgrounds (hero slot only) ─────────────────────────────────
//
// The hero slot can render an optional image or video circle behind
// the gauge — feathered via radial-gradient mask so the edges fade
// into the panel. Three built-in SVG presets; users can also paste
// an arbitrary URL (auto-detected as video when the extension
// matches /\.(mp4|webm|mov)$/).

export const BACKGROUNDS = [
  { id: 'none',   label: 'None',   emoji: '⭕', url: '',                kind: 'image' },
  { id: 'road',   label: 'Road',   emoji: '🛣️', url: './bg-road.svg',   kind: 'image' },
  { id: 'cyber',  label: 'Cyber',  emoji: '🌃', url: './bg-cyber.svg',  kind: 'image' },
  { id: 'garage', label: 'Garage', emoji: '🏎️', url: './bg-garage.svg', kind: 'image' },
];
export const BACKGROUND_BY_ID = Object.fromEntries(BACKGROUNDS.map((b) => [b.id, b]));

const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v)(\?|$)/i;

/** Resolve a background descriptor → `{ kind, url }` for DOM rendering.
 *  Accepts a preset id (`'road'`) or a custom shape `{ kind, url }`. */
export function resolveBackground(bg) {
  if (!bg) return { kind: 'image', url: '' };
  if (typeof bg === 'string') {
    const preset = BACKGROUND_BY_ID[bg];
    if (preset) return { kind: preset.kind, url: preset.url };
    // Treat any other string as a raw URL.
    return { kind: VIDEO_EXT_RE.test(bg) ? 'video' : 'image', url: bg };
  }
  if (typeof bg !== 'object') return { kind: 'image', url: '' };
  const url = bg.url ?? '';
  const kind = bg.kind === 'video' || VIDEO_EXT_RE.test(url) ? 'video' : 'image';
  return { kind, url };
}

// ── Helpers ──────────────────────────────────────────────────────

function fraction(value, min, max) {
  if (max === min) return 0;
  return Math.min(Math.max((value - min) / (max - min), 0), 1);
}

function fmtValue(v, unit) {
  if (v == null || Number.isNaN(v)) return '—';
  if (unit === 'rpm') return Math.round(v).toLocaleString();
  if (Math.abs(v) >= 100) return Math.round(v).toString();
  if (Math.abs(v) >= 10) return v.toFixed(0);
  return v.toFixed(1);
}

function readTheme() {
  // Read CSS variables from the document so the styles pick up the
  // active theme's panel + muted colors without each render call
  // needing to know which theme is active.
  const cs = globalThis.getComputedStyle?.(document.documentElement);
  return {
    panel: cs?.getPropertyValue('--gauge-panel').trim() || '#0f1421',
    track: cs?.getPropertyValue('--gauge-track').trim() || '#1f2a44',
    text:  cs?.getPropertyValue('--gauge-text').trim() || '#e6e9ef',
    muted: cs?.getPropertyValue('--gauge-muted').trim() || '#6c7a93',
    font:  cs?.getPropertyValue('--gauge-font').trim() || 'ui-sans-serif, system-ui, sans-serif',
  };
}

// ── Style: Dial ──────────────────────────────────────────────────

function paintDial(ctx, rect, data, color, isHero) {
  const t = readTheme();
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2 - (isHero ? 16 : 8);
  const r = Math.min(rect.w, rect.h) * (isHero ? 0.36 : 0.32);
  const start = Math.PI * 0.8;
  const end = Math.PI * 2.2;
  const f = fraction(data.value, data.min, data.max);
  const arcWidth = isHero ? 18 : 10;

  // Label
  ctx.fillStyle = t.muted;
  ctx.font = `600 ${isHero ? 13 : 10}px ${t.font}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(data.label.toUpperCase(), rect.x + 14, rect.y + 12);

  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, end);
  ctx.lineWidth = arcWidth;
  ctx.lineCap = 'round';
  ctx.strokeStyle = t.track;
  ctx.stroke();

  // Fill
  ctx.beginPath();
  ctx.arc(cx, cy, r, start, start + (end - start) * f);
  ctx.lineWidth = arcWidth;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = isHero ? 14 : 6;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Ticks
  const ticks = isHero ? 18 : 10;
  for (let i = 0; i <= ticks; i++) {
    const a = start + (end - start) * (i / ticks);
    const major = i % 2 === 0;
    const inner = r - (major ? 18 : 10);
    const outer = r - 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * outer, cy + Math.sin(a) * outer);
    ctx.strokeStyle = '#3b4d72';
    ctx.lineWidth = major ? 2 : 1;
    ctx.stroke();
  }

  // Needle (hero only — overlays stay calm)
  if (isHero) {
    const a = start + (end - start) * f;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(r - 28, 0);
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
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

  // Centre value + unit
  ctx.fillStyle = t.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${isHero ? 56 : 30}px ${t.font}`;
  ctx.fillText(fmtValue(data.value, data.unit), cx, cy + (isHero ? 56 : 28));
  ctx.fillStyle = t.muted;
  ctx.font = `500 ${isHero ? 14 : 10}px ${t.font}`;
  ctx.fillText(data.unit, cx, cy + (isHero ? 90 : 46));
}

// ── Style: Digital ───────────────────────────────────────────────

function paintDigital(ctx, rect, data, color, isHero) {
  const t = readTheme();
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;

  // Label
  ctx.fillStyle = t.muted;
  ctx.font = `600 ${isHero ? 14 : 10}px ${t.font}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(data.label.toUpperCase(), rect.x + 14, rect.y + 12);

  // Big numeric value
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = isHero ? 18 : 0;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const sz = isHero
    ? Math.min(rect.w * 0.28, rect.h * 0.55)
    : Math.min(rect.w * 0.32, rect.h * 0.62);
  ctx.font = `800 ${sz}px ${t.font}`;
  ctx.fillText(fmtValue(data.value, data.unit), cx, cy - sz * 0.06);
  ctx.shadowBlur = 0;

  // Unit underneath
  ctx.fillStyle = t.muted;
  ctx.font = `500 ${isHero ? 16 : 11}px ${t.font}`;
  ctx.fillText(data.unit, cx, cy + sz * 0.55);
}

// ── Style: Bar ───────────────────────────────────────────────────

function paintBar(ctx, rect, data, color, isHero) {
  const t = readTheme();
  const pad = isHero ? 28 : 14;
  const f = fraction(data.value, data.min, data.max);

  // Label
  ctx.fillStyle = t.muted;
  ctx.font = `600 ${isHero ? 13 : 10}px ${t.font}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(data.label.toUpperCase(), rect.x + pad, rect.y + 12);

  // Numeric readout (top-right)
  ctx.fillStyle = t.text;
  ctx.textAlign = 'right';
  ctx.font = `700 ${isHero ? 36 : 18}px ${t.font}`;
  ctx.fillText(fmtValue(data.value, data.unit), rect.x + rect.w - pad, rect.y + 8);
  ctx.fillStyle = t.muted;
  ctx.font = `500 ${isHero ? 12 : 9}px ${t.font}`;
  ctx.fillText(data.unit, rect.x + rect.w - pad, rect.y + (isHero ? 50 : 30));

  // Bar (bottom area)
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

// ── Style: Ring ──────────────────────────────────────────────────

function paintRing(ctx, rect, data, color, isHero) {
  const t = readTheme();
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + rect.h / 2;
  const r = Math.min(rect.w, rect.h) * (isHero ? 0.4 : 0.36);
  const ringW = isHero ? 14 : 8;
  const f = fraction(data.value, data.min, data.max);

  // Label
  ctx.fillStyle = t.muted;
  ctx.font = `600 ${isHero ? 13 : 10}px ${t.font}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(data.label.toUpperCase(), rect.x + 14, rect.y + 12);

  // Track
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = ringW;
  ctx.strokeStyle = t.track;
  ctx.stroke();

  // Filled arc — starts at top (−PI/2), sweeps clockwise.
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f);
  ctx.lineWidth = ringW;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = isHero ? 12 : 5;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Centre value + unit
  ctx.fillStyle = t.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
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

// ── Public render entry-point ────────────────────────────────────

const STYLE_FNS = {
  dial:    paintDial,
  digital: paintDigital,
  bar:     paintBar,
  ring:    paintRing,
};

/**
 * Render a styled slot. `rect` is the canvas-space bounding box.
 * `slot` is the layout entry { widgetId, style, color }. `isHero`
 * controls the heavy vs compact variant.
 */
export function paintStyled(ctx, rect, slot, signals, isHero = false) {
  const widget = WIDGET_BY_ID[slot?.widgetId];
  if (!widget) return;
  const data = widget.read(signals);
  const styleFn = STYLE_FNS[slot.style] ?? paintDial;
  styleFn(ctx, rect, data, colorHex(slot.color), isHero);
}

// ── Schema helpers ───────────────────────────────────────────────

export function normalizeSlot(raw, themeId, slotIndex = 0) {
  if (!raw) return null;
  // v1 layouts stored bare widgetId strings; v2+ stores objects.
  if (typeof raw === 'string') {
    return WIDGET_BY_ID[raw]
      ? {
          widgetId: raw,
          style: 'dial',
          color: defaultAccent(themeId),
          background: 'none',
          position: defaultPosition(slotIndex),
          size: 'M',
        }
      : null;
  }
  if (typeof raw !== 'object') return null;
  if (!WIDGET_BY_ID[raw.widgetId]) return null;
  let bg = raw.background;
  if (typeof bg === 'string') {
    const ok =
      bg === 'none' ||
      BACKGROUND_BY_ID[bg] ||
      bg.startsWith('http') ||
      bg.startsWith('data:image/') ||
      bg.startsWith('data:video/');
    if (!ok) bg = 'none';
  } else if (bg && typeof bg === 'object') {
    if (!bg.url) bg = 'none';
  } else {
    bg = 'none';
  }
  return {
    widgetId: raw.widgetId,
    style: STYLE_IDS.has(raw.style) ? raw.style : 'dial',
    color: COLOR_BY_ID[raw.color] ? raw.color : defaultAccent(themeId),
    background: bg,
    position: POSITION_IDS.has(raw.position) ? raw.position : defaultPosition(slotIndex),
    size: SIZE_IDS.has(raw.size) ? raw.size : 'M',
  };
}

export function defaultAccent(themeId) {
  return THEME_BY_ID[themeId]?.defaultAccent ?? 'cyan';
}

/** Combined signal-name set for a layout (deduped). */
export function signalsForLayout(layout) {
  const names = new Set();
  for (const slot of layout?.slots ?? []) {
    if (!slot?.widgetId) continue;
    const w = WIDGET_BY_ID[slot.widgetId];
    if (!w) continue;
    for (const n of w.signals) names.add(n);
  }
  return Array.from(names);
}
