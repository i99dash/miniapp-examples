/**
 * Cluster surface — receives a layout in the URL hash, subscribes
 * to the union of the widgets' signal sets, repaints every frame.
 *
 * The host may or may not inject `flutter_inappwebview` on the
 * cluster WebView (depends on whether the surface was created with
 * `bridge: 'inherit'`). Both paths are handled: live signals when
 * the bridge is present, static frame from the URL hash when not.
 */

import { call, on, inHost, cryptoUuid } from './bridge.js';
import { WIDGETS, WIDGET_BY_ID, signalsForLayout } from './widgets.js';

const state = {
  layout: { slots: [null, null, null], version: 1 },
  signals: Object.create(null),
  lastUpdateAt: 0,
  subscriptionId: null,
};

function readLayoutFromHash() {
  // Prefer the query string (host's surface.create regex rejects bare
  // `#fragment` URLs — they only pass when nested inside a query). Fall
  // back to the legacy hash so an older bundle launched before the
  // editor restart still renders.
  const search = location.search.startsWith('?')
    ? location.search.slice(1)
    : location.search;
  const hash = location.hash.startsWith('#') ? location.hash.slice(1) : location.hash;
  const params = new URLSearchParams(search || hash);
  const enc = params.get('layout');
  if (!enc) return null;
  try {
    const parsed = JSON.parse(atob(decodeURIComponent(enc)));
    if (!Array.isArray(parsed.slots)) return null;
    return {
      slots: parsed.slots.slice(0, 3).map((id) => (WIDGET_BY_ID[id] ? id : null)),
      version: parsed.version ?? 1,
    };
  } catch (err) {
    console.warn('cluster: failed to parse layout hash', err);
    return null;
  }
}

function slotEls() {
  return [...document.querySelectorAll('.slot')];
}

function paintAllSlots() {
  for (const el of slotEls()) {
    const idx = parseInt(el.dataset.slot, 10);
    const id = state.layout.slots[idx];
    const canvas = el.querySelector('canvas');
    const empty = el.querySelector('.empty');
    if (!id) {
      empty.style.display = '';
      clearCanvas(canvas);
      continue;
    }
    empty.style.display = 'none';
    paintSlot(canvas, WIDGET_BY_ID[id], state.signals);
  }
}

function clearCanvas(canvas) {
  if (!canvas.width) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function paintSlot(canvas, widget, signals) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, globalThis.devicePixelRatio || 1);
  const W = Math.floor(rect.width * dpr);
  const H = Math.floor(rect.height * dpr);
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.scale(dpr, dpr);
  widget.paint(ctx, { x: 0, y: 0, w: rect.width, h: rect.height }, signals);
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
    const result = await call('car.subscribe', {
      names,
      idempotencyKey: cryptoUuid(),
    });
    state.subscriptionId = result?.subscriptionId ?? null;
  } catch (err) {
    console.warn('cluster car.subscribe failed:', err);
  }
}

function bindLiveStreams() {
  on('car.signal', (payload) => {
    const ev = payload?.data ?? payload;
    if (!ev?.name) return;
    if (
      state.subscriptionId &&
      payload?.subscriptionId &&
      payload.subscriptionId !== state.subscriptionId
    ) {
      return;
    }
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
  const layout = readLayoutFromHash();
  if (layout) state.layout = layout;

  bindLiveStreams();
  if (inHost()) {
    call('car.connection.subscribe').catch(() => {
      /* non-fatal */
    });
    await subscribe();
  } else {
    // No host bridge on this surface; render once with empty state.
    document.getElementById('conn-text').textContent = 'cluster · static frame';
  }
  requestAnimationFrame(tick);

  // Live re-read on hash change so the IVI editor's next push picks
  // up without tearing down the surface.
  globalThis.addEventListener('hashchange', async () => {
    const next = readLayoutFromHash();
    if (!next) return;
    state.layout = next;
    await subscribe();
  });
}

main().catch((err) => {
  console.error('cluster fatal:', err);
});
