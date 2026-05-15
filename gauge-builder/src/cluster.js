/**
 * Cluster surface — gauge-builder 0.2.0
 *
 * Reads the v2 layout from the URL query string and renders the hero
 * (slot 2) + overlay (slots 1 and 3) layout on the cluster face. Same
 * widget + style + theme primitives as the IVI editor, so the cluster
 * is a pixel-faithful copy of what the user composed.
 */

import { call, on, inHost, cryptoUuid } from './bridge.js';
import {
  THEME_BY_ID,
  WIDGET_BY_ID,
  normalizeSlot,
  paintStyled,
  resolveBackground,
  signalsForLayout,
} from './widgets.js';

const HERO_INDEX = 1;

const state = {
  layout: { version: 2, theme: 'stealth', slots: [null, null, null] },
  signals: Object.create(null),
  lastUpdateAt: 0,
  subscriptionId: null,
};

function readLayoutFromUrl() {
  // The host's surface.create regex accepts the query string but
  // rejects bare `#fragment` URLs — that's why 0.1.7 moved the
  // payload onto `?layout=...`. We still read `#` as a fallback so
  // an older push doesn't break a newer cluster bundle.
  const search = location.search.startsWith('?') ? location.search.slice(1) : location.search;
  const hash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
  const params = new URLSearchParams(search || hash);
  const enc = params.get('layout');
  if (!enc) return null;
  try {
    const parsed = JSON.parse(atob(decodeURIComponent(enc)));
    return normalizeLayout(parsed);
  } catch (err) {
    console.warn('cluster: failed to parse layout', err);
    return null;
  }
}

function normalizeLayout(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const themeId = THEME_BY_ID[raw.theme] ? raw.theme : 'stealth';
  const slotsIn = Array.isArray(raw.slots) ? raw.slots : [];
  const slots = new Array(3).fill(null).map((_, i) => normalizeSlot(slotsIn[i], themeId, i));
  return { version: 2, theme: themeId, slots };
}

function applyTheme(themeId) {
  document.body.dataset.theme = THEME_BY_ID[themeId] ? themeId : 'stealth';
}

function slotEls() {
  return [...document.querySelectorAll('.slot')];
}

function paintAllSlots() {
  for (const el of slotEls()) {
    const idx = parseInt(el.dataset.slot, 10);
    const slot = state.layout.slots[idx];
    const canvas = el.querySelector('canvas');
    const empty = el.querySelector('.empty');
    // Apply layout (position + size) to overlay slots on the cluster.
    if (idx !== HERO_INDEX) {
      el.dataset.pos = slot?.position ?? (idx === 2 ? 'br' : 'bl');
      el.dataset.size = slot?.size ?? 'M';
    }
    if (!slot) {
      empty.style.display = '';
      clearCanvas(canvas);
      continue;
    }
    empty.style.display = 'none';
    paintSlotCanvas(canvas, slot, idx === HERO_INDEX);
  }
  applyHeroBackground();
}

function applyHeroBackground() {
  const host = document.getElementById('hero-bg');
  if (!host) return;
  const slot = state.layout.slots[HERO_INDEX];
  const { kind, url } = resolveBackground(slot?.background);
  if (!url) { host.innerHTML = ''; return; }
  const existing = host.firstElementChild;
  if (existing?.tagName?.toLowerCase() === kind && existing?.dataset?.url === url) return;
  host.innerHTML = '';
  if (kind === 'video') {
    const v = document.createElement('video');
    v.src = url; v.autoplay = true; v.loop = true; v.muted = true; v.playsInline = true;
    v.dataset.url = url;
    host.appendChild(v);
  } else {
    const img = document.createElement('img');
    img.src = url; img.alt = ''; img.dataset.url = url;
    host.appendChild(img);
  }
}

function clearCanvas(canvas) {
  if (!canvas.width) return;
  const ctx = canvas.getContext('2d');
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
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.scale(dpr, dpr);
  paintStyled(ctx, { x: 0, y: 0, w: rect.width, h: rect.height }, slot, state.signals, isHero);
  ctx.restore();
}

async function subscribe() {
  if (!inHost()) return;
  const names = signalsForLayout(state.layout);
  if (names.length === 0) return;
  try {
    const seed = await call('car.read', { names });
    if (seed?.values) {
      Object.assign(state.signals, seed.values);
      state.lastUpdateAt = Date.now();
    }
    const result = await call('car.subscribe', { names, idempotencyKey: cryptoUuid() });
    state.subscriptionId = result?.subscriptionId ?? null;
  } catch (err) {
    console.warn('cluster car.subscribe failed:', err);
  }
}

function bindLiveStreams() {
  on('car.signal', (payload) => {
    const ev = payload?.data ?? payload;
    if (!ev?.name) return;
    if (state.subscriptionId && payload?.subscriptionId && payload.subscriptionId !== state.subscriptionId) return;
    state.signals[ev.name] = ev.value;
    state.lastUpdateAt = Date.now();
  });
  on('car.connection', (payload) => {
    const s = payload?.state ?? payload;
    const dot = document.getElementById('conn-dot');
    const text = document.getElementById('conn-text');
    dot.classList.remove('connected', 'degraded', 'disconnected');
    if (typeof s === 'string') {
      dot.classList.add(s);
      text.textContent = `cluster · ${s}`;
    } else {
      text.textContent = 'cluster · unknown';
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
    call('car.connection.subscribe').catch(() => {});
    await subscribe();
  } else {
    document.getElementById('conn-text').textContent = 'cluster · static frame';
  }
  requestAnimationFrame(tick);

  globalThis.addEventListener('hashchange', async () => {
    const next = readLayoutFromUrl();
    if (!next) return;
    state.layout = next;
    applyTheme(state.layout.theme);
    await subscribe();
  });
}

main().catch((err) => {
  console.error('cluster fatal:', err);
});
