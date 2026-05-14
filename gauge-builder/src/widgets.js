/**
 * Widget registry — one entry per draggable card. Each widget owns:
 *
 *   id        — stable key persisted in the layout JSON
 *   label     — palette / slot label
 *   signals   — names the cluster page must subscribe to
 *   paint(ctx, slot, state) — canvas paint for the cluster slot
 *
 * Paint functions are intentionally pure: they read `state` (the live
 * signal map kept by the cluster page) and the slot rect, and write
 * pixels. They never poke globals or DOM outside the canvas — so the
 * cluster page can repaint every frame without leaking state.
 *
 * Order matters: this array is what the palette renders top-to-bottom.
 */

const ACCENT = '#22d3ee';
const TRACK = '#1f2a44';
const TEXT = '#e6e9ef';
const MUTED = '#6c7a93';

function gradient(t) {
  if (t < 0.6) return '#22d3ee';
  if (t < 0.85) return '#f59e0b';
  return '#ef4444';
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

function drawNeedle(ctx, cx, cy, length, angle, color, width = 6) {
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

function drawLabel(ctx, slot, text) {
  ctx.fillStyle = MUTED;
  ctx.font = '600 11px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(text.toUpperCase(), slot.x + 16, slot.y + 14);
}

function drawDigital(ctx, slot, value, unit, big = true) {
  ctx.fillStyle = TEXT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${big ? 64 : 36}px ui-sans-serif, system-ui, sans-serif`;
  const cx = slot.x + slot.w / 2;
  const cy = slot.y + slot.h - (big ? 80 : 56);
  ctx.fillText(String(value), cx, cy);
  if (unit) {
    ctx.fillStyle = MUTED;
    ctx.font = '500 13px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(unit, cx, cy + (big ? 36 : 24));
  }
}

function dial(ctx, slot, fraction, color) {
  const cx = slot.x + slot.w / 2;
  const cy = slot.y + slot.h / 2 - 10;
  const r = Math.min(slot.w, slot.h) * 0.36;
  const startAngle = Math.PI * 0.8;
  const endAngle = Math.PI * 2.2;
  drawArc(ctx, cx, cy, r, startAngle, endAngle, TRACK, 16);
  const t = Math.min(Math.max(fraction, 0), 1);
  const valEnd = startAngle + (endAngle - startAngle) * t;
  const c = color ?? gradient(t);
  drawArc(ctx, cx, cy, r, startAngle, valEnd, c, 16);
  drawTicks(ctx, cx, cy, r - 22, startAngle, endAngle, 18);
  const angle = startAngle + (endAngle - startAngle) * t;
  drawNeedle(ctx, cx, cy, r - 30, angle, c, 6);
}

// ── Widget definitions ───────────────────────────────────────────

export const WIDGETS = [
  {
    id: 'speed',
    label: 'Speed',
    signals: ['speed_kmh', 'accelerator_pct', 'brake_pct'],
    paint(ctx, slot, state) {
      const raw = state.speed_kmh ?? 0;
      const MAX = 180;
      dial(ctx, slot, raw / MAX, null);
      drawLabel(ctx, slot, 'Speed');
      drawDigital(ctx, slot, Math.round(raw), 'km/h', true);
    },
  },
  {
    id: 'rpm',
    label: 'RPM',
    signals: ['motor_f_rpm', 'motor_r_rpm', 'engine_rpm'],
    paint(ctx, slot, state) {
      const raw =
        state.motor_f_rpm != null || state.motor_r_rpm != null
          ? Math.max(state.motor_f_rpm ?? 0, state.motor_r_rpm ?? 0)
          : (state.engine_rpm ?? 0);
      const MAX = 8000;
      dial(ctx, slot, raw / MAX, null);
      drawLabel(ctx, slot, 'RPM');
      drawDigital(ctx, slot, Math.round(raw).toLocaleString(), 'rpm', false);
    },
  },
  {
    id: 'battery',
    label: 'Battery',
    signals: ['battery_pct'],
    paint(ctx, slot, state) {
      const v = state.battery_pct ?? 0;
      const color = v < 15 ? '#ef4444' : v < 30 ? '#f59e0b' : '#22c55e';
      dial(ctx, slot, v / 100, color);
      drawLabel(ctx, slot, 'Battery');
      drawDigital(ctx, slot, Math.round(v), '%', false);
    },
  },
  {
    id: 'ev-range',
    label: 'EV range',
    signals: ['range_ev_km'],
    paint(ctx, slot, state) {
      const v = state.range_ev_km;
      drawLabel(ctx, slot, 'EV range');
      drawDigital(ctx, slot, v == null ? '—' : v, 'km', true);
    },
  },
  {
    id: 'fuel-range',
    label: 'Fuel range',
    signals: ['range_fuel_km'],
    paint(ctx, slot, state) {
      const v = state.range_fuel_km;
      drawLabel(ctx, slot, 'Fuel range');
      drawDigital(ctx, slot, v == null ? '—' : v, 'km', true);
    },
  },
  {
    id: 'climate',
    label: 'Climate',
    signals: ['ac_cabin_temp', 'ac_temp_out', 'ac_fan', 'ac_power'],
    paint(ctx, slot, state) {
      drawLabel(ctx, slot, 'Climate');
      const cx = slot.x + slot.w / 2;
      const startY = slot.y + 48;
      ctx.textAlign = 'center';

      const rows = [
        { sub: 'CABIN', value: state.ac_cabin_temp, unit: '°C' },
        { sub: 'OUTSIDE', value: state.ac_temp_out, unit: '°C' },
        { sub: 'FAN', value: state.ac_fan, unit: '/7' },
        {
          sub: 'AC',
          value: state.ac_power == null ? '—' : state.ac_power === 1 ? 'ON' : 'OFF',
          unit: '',
        },
      ];
      const rowH = (slot.h - 72) / rows.length;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const y = startY + rowH * i + rowH / 2;
        ctx.fillStyle = MUTED;
        ctx.font = '500 11px ui-sans-serif, system-ui, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillText(r.sub, slot.x + 18, y);
        ctx.fillStyle = TEXT;
        ctx.font = '700 24px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(
          r.value == null ? '—' : `${r.value}${r.unit ? ' ' + r.unit : ''}`,
          slot.x + slot.w - 18,
          y,
        );
      }
    },
  },
];

export const WIDGET_BY_ID = Object.fromEntries(WIDGETS.map((w) => [w.id, w]));

/** Combined signal-name set for a layout (deduped). */
export function signalsForLayout(layout) {
  const names = new Set();
  for (const id of layout.slots ?? []) {
    if (!id) continue;
    const w = WIDGET_BY_ID[id];
    if (!w) continue;
    for (const n of w.signals) names.add(n);
  }
  return Array.from(names);
}
