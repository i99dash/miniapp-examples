/**
 * IVI editor — drag widgets into 3 slots, push the layout onto the
 * cluster surface. Persists per-device in localStorage so the next
 * open replays the user's chosen layout.
 *
 * Capability gating: reads `display.list().vehicle.capabilities` and
 * `vehicle.dilinkFamily`. Pushing is enabled only when the host
 * reports `surface.write.cluster` (or the legacy `pkg.launch.cluster.pixel`
 * bit) AND a `role: 'cluster'` display with the friendly XDJA `_1`
 * slot exists. Otherwise the editor is preview-only.
 */

import { call, callNative, on, inHost, cryptoUuid } from './bridge.js';
import { WIDGETS, WIDGET_BY_ID, signalsForLayout } from './widgets.js';

if (!inHost()) {
  document.getElementById('notice').classList.add('shown');
}

const SLOT_COUNT = 3;
const STORAGE_KEY = (deviceId) =>
  `gauge-builder:layout:${deviceId ?? 'unknown'}`;

/** The widget the user has tapped in the palette — placed on the
 *  next slot tap. null = no selection.
 */
let selectedWidgetId = null;

/** Editor state. Layout is the only thing persisted. */
const state = {
  /** Active car identity from `car.identity()`. */
  identity: null,
  /** Resolved deviceId — falls back to the host context's activeCarId. */
  deviceId: null,
  /** Layout: array of widget ids or null per slot. */
  layout: { slots: new Array(SLOT_COUNT).fill(null), version: 1 },
  /** Live signal snapshot for the preview. */
  signals: Object.create(null),
  /** Last signal-update timestamp (epoch ms). */
  lastUpdateAt: 0,
  /** Active subscription id from `car.subscribe`. */
  subscriptionId: null,
  /** Cluster surface id when one is active. */
  surfaceId: null,
  /** Resolved driver-display id (real cluster or passenger panel labelled "Driver"). */
  driverTargetId: null,
  /** Which kind of driver target we resolved: 'cluster' | 'driver-panel' | null. */
  driverTargetKind: null,
  /** True when host capabilities permit pushing to the driver display. */
  canPushToCluster: false,
  /** Reason rendered on the capability banner when push is disabled. */
  blockedReason: null,
  /** Diagnostic info shown in the bottom-left debug pane. */
  debug: {
    bridgeAvailable: false,
    identity: null,
    displayListAttempts: [],
    snapshot: null,
    error: null,
  },
};

// ── Palette rendering ────────────────────────────────────────────

function renderPalette() {
  const host = document.getElementById('palette-list');
  host.innerHTML = '';
  for (const w of WIDGETS) {
    const card = document.createElement('div');
    card.className = 'widget-card';
    card.dataset.widgetId = w.id;
    card.innerHTML = `<span class="glyph">${w.label[0]}</span><span>${w.label}</span>`;
    // Touch-friendly tap-to-place: HTML5 drag events don't fire on
    // Android WebView touch. The user taps a widget here, then taps a
    // slot — the slot's pointer handler reads selectedWidgetId.
    card.addEventListener('click', () => {
      if (selectedWidgetId === w.id) {
        clearSelection();
      } else {
        selectWidget(w.id);
      }
    });
    host.appendChild(card);
  }
}

function selectWidget(id) {
  selectedWidgetId = id;
  document.body.classList.add('placing');
  for (const card of document.querySelectorAll('.widget-card')) {
    card.classList.toggle('selected', card.dataset.widgetId === id);
  }
}

function clearSelection() {
  selectedWidgetId = null;
  document.body.classList.remove('placing');
  for (const card of document.querySelectorAll('.widget-card')) {
    card.classList.remove('selected');
  }
}

// ── Slot rendering ───────────────────────────────────────────────

function slotEls() {
  return [...document.querySelectorAll('.slot')];
}

function bindSlotEvents() {
  for (const el of slotEls()) {
    el.addEventListener('click', (e) => {
      // Clear-button taps are handled below — don't let a clear tap
      // also try to place a widget into the slot.
      if (e.target.closest('[data-clear]')) return;
      const idx = parseInt(el.dataset.slot, 10);
      if (selectedWidgetId) {
        setSlot(idx, selectedWidgetId);
        clearSelection();
      }
    });
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-clear]');
    if (!t) return;
    setSlot(parseInt(t.dataset.clear, 10), null);
  });
  document.getElementById('reset').addEventListener('click', () => {
    state.layout = { slots: new Array(SLOT_COUNT).fill(null), version: 1 };
    clearSelection();
    persist();
    paintAllSlots();
    updateLayoutBadge();
  });
}

function setSlot(idx, widgetId) {
  state.layout.slots[idx] = widgetId;
  persist();
  paintAllSlots();
  updateLayoutBadge();
  reconcileSubscription();
}

function paintAllSlots() {
  for (const el of slotEls()) {
    const idx = parseInt(el.dataset.slot, 10);
    const id = state.layout.slots[idx];
    const empty = el.querySelector('.empty');
    const canvas = el.querySelector('canvas');
    el.classList.toggle('filled', !!id);
    empty.style.display = id ? 'none' : '';
    if (!id) {
      clearCanvas(canvas);
      continue;
    }
    paintSlot(canvas, WIDGET_BY_ID[id], state.signals);
  }
  paintClusterPreview();
  paintFreshness();
}

/**
 * Paint the dedicated cluster-aspect preview strip — same widgets,
 * same paint code, but laid out in cluster proportions (1fr/1.3fr/1fr
 * across an 8:3 canvas) so the user sees exactly what `cluster.html`
 * will render after `Push to cluster`.
 */
function paintClusterPreview() {
  const canvas = document.getElementById('preview-canvas');
  if (!canvas) return;
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

  // Match cluster.html's grid: 1fr / 1.3fr / 1fr with 18px gap +
  // 24px outer padding, so the preview is pixel-faithful to the
  // cluster rendering.
  const PAD = 24;
  const GAP = 18;
  const inner = rect.width - PAD * 2;
  const innerH = rect.height - PAD * 2;
  const totalFr = 1 + 1.3 + 1;
  const fr = (inner - GAP * 2) / totalFr;
  const widths = [fr, fr * 1.3, fr];
  let x = PAD;
  for (let i = 0; i < 3; i++) {
    const id = state.layout.slots[i];
    const slot = { x, y: PAD, w: widths[i], h: innerH };
    if (id && WIDGET_BY_ID[id]) {
      WIDGET_BY_ID[id].paint(ctx, slot, state.signals);
    } else {
      // Empty-slot hint inside the strip so the user can see the
      // composition even before all three are filled.
      ctx.fillStyle = '#0f1421';
      ctx.fillRect(slot.x, slot.y, slot.w, slot.h);
      ctx.strokeStyle = '#1f2a44';
      ctx.setLineDash([6, 4]);
      ctx.lineWidth = 1;
      ctx.strokeRect(slot.x + 1, slot.y + 1, slot.w - 2, slot.h - 2);
      ctx.setLineDash([]);
      ctx.fillStyle = '#6c7a93';
      ctx.font = '500 11px ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`slot ${i + 1}`, slot.x + slot.w / 2, slot.y + slot.h / 2);
    }
    x += widths[i] + GAP;
  }
  ctx.restore();
}

function paintFreshness() {
  const el = document.getElementById('freshness');
  if (!el) return;
  if (!inHost()) {
    el.textContent = 'offline preview';
    return;
  }
  if (!state.lastUpdateAt) {
    el.textContent = 'waiting for first signal…';
    return;
  }
  const age = Math.round((Date.now() - state.lastUpdateAt) / 1000);
  el.textContent = age === 0 ? 'live · just now' : `live · ${age}s ago`;
}

function clearCanvas(canvas) {
  if (!canvas.width) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function paintSlot(canvas, widget, signals) {
  // Resize to physical pixel resolution for crisp rendering.
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

// ── Persistence ──────────────────────────────────────────────────

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(state.deviceId));
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.slots)) return;
    // Drop unknown widget ids — keeps the layout valid when the
    // palette changes between versions.
    state.layout.slots = parsed.slots
      .slice(0, SLOT_COUNT)
      .map((id) => (WIDGET_BY_ID[id] ? id : null));
    while (state.layout.slots.length < SLOT_COUNT) state.layout.slots.push(null);
  } catch {
    /* ignore */
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY(state.deviceId), JSON.stringify(state.layout));
    document.getElementById('layout-saved').textContent = 'layout: saved';
  } catch {
    document.getElementById('layout-saved').textContent = 'layout: save failed';
  }
}

function updateLayoutBadge() {
  const filled = state.layout.slots.filter(Boolean).length;
  document.getElementById('layout-saved').textContent =
    filled === 0 ? 'layout: empty' : `layout: ${filled}/${SLOT_COUNT} filled · saved`;
}

// ── Capability detection ─────────────────────────────────────────

const FRIENDLY_CLUSTER_RE = /XDJAScreenProjection_1$/i;
const CLUSTER_PIXEL_CAPS = ['surface.write.cluster', 'pkg.launch.cluster.pixel'];
const DRIVER_LABEL = 'Driver';

async function detectCapabilities() {
  // The host wires `display.list` through FamilyExecutor and returns
  // the standard `{success, data: {displays, vehicle?}}` envelope —
  // `callNative` unwraps `data` for us. Older host builds didn't
  // register the family bridge at all and returned `null`; we keep
  // the debug pane and the helpful message for that case so any
  // regression is immediately visible without redeploying gauge-builder.
  const attempts = [];
  let snapshot = null;
  try {
    const raw = await callNative('display.list');
    attempts.push({ shape: 'envelope {params,idempotencyKey}', response: summarize(raw) });
    if (Array.isArray(raw?.displays)) snapshot = raw;
  } catch (err) {
    attempts.push({ shape: 'envelope {params,idempotencyKey}', error: String(err?.message ?? err) });
  }

  state.debug.displayListAttempts = attempts;
  state.debug.snapshot = snapshot;
  renderDebugPane();

  if (!snapshot) {
    document.getElementById('debug-pane').classList.add('shown');
    setCapBlocked(
      'display.list unavailable on this host — needs the family-bridge wiring fix. See debug pane.',
    );
    return;
  }

  const displays = snapshot?.displays ?? [];
  const vehicle = snapshot?.vehicle ?? null;

  // Trim badge — prefer the vehicle.friendlyName, else dilinkFamily.
  const trim = document.getElementById('trim-badge');
  if (vehicle?.friendlyName) {
    trim.textContent = `trim: ${vehicle.friendlyName}${
      vehicle.isFallback ? ' · best-effort' : ''
    }`;
  } else if (vehicle?.dilinkFamily) {
    trim.textContent = `trim: ${vehicle.dilinkFamily}`;
  } else {
    trim.textContent = 'trim: unknown';
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
  const banner = document.getElementById('cap-banner');
  if (target.kind === 'driver-panel') {
    // Soft notice: we're using a passenger panel labelled "Driver"
    // rather than a real instrument cluster. Still pushes — user
    // should know it's not the literal cluster.
    banner.classList.add('shown', 'info');
    banner.textContent =
      'No cluster on this trim — pushing to the passenger panel labelled "Driver".';
  } else {
    banner.classList.remove('shown', 'info');
    banner.textContent = '';
  }
  refreshPushButton();
}

/**
 * Resolve the best "render-for-the-driver" target on the current car.
 *
 * Priority — matches pkg-launcher's resolveDriverTarget:
 *   1. Real cluster overlay (L8 / L5 Lidar — XDJA `_1` slot, gated by
 *      `surface.write.cluster` / `pkg.launch.cluster.pixel`).
 *   2. Passenger panel reserved with `overrideLabel === 'Driver'`
 *      (Song Plus / L7 / HAN L — visually a driver display even though
 *      Android sees it as `role: 'passenger'`).
 *   3. Nothing — preview-only mode.
 *
 * Cluster wins when both exist. The fallback to the driver-labelled
 * panel only fires when the cluster path is unavailable on this trim
 * (cluster missing OR the host advertised no pixel cap).
 */
function resolveDriverTarget(displays, vehicle) {
  const caps = vehicle?.capabilities ?? [];
  const legacyMode = caps.length === 0;

  // 1. Real cluster overlay — prefer the friendly XDJA `_1` slot.
  const cluster =
    displays.find(
      (d) =>
        (d.role === 'cluster' || d.isCluster) &&
        FRIENDLY_CLUSTER_RE.test(d.name ?? ''),
    ) ?? displays.find((d) => d.role === 'cluster' || d.isCluster);
  if (cluster) {
    const hasPixelCap = CLUSTER_PIXEL_CAPS.some((c) => caps.includes(c));
    if (legacyMode || hasPixelCap) {
      return { kind: 'cluster', displayId: cluster.id, reason: null };
    }
    // Cluster found but pixel cap missing — fall through to the panel
    // resolver. Some trims ship a passenger-as-driver alongside a
    // non-pixel cluster, and we'd rather render somewhere than nowhere.
  }

  // 2. Passenger panel reserved as the driver's eyeline display.
  const driverPanel = displays.find(
    (d) => d.role === 'passenger' && d.overrideLabel === DRIVER_LABEL,
  );
  if (driverPanel) {
    return { kind: 'driver-panel', displayId: driverPanel.id, reason: null };
  }

  // 3. Preview-only.
  if (cluster) {
    const family = vehicle?.dilinkFamily ?? 'this trim';
    return {
      kind: null,
      displayId: null,
      reason: `Cluster pixel rendering not supported on ${family} — preview only.`,
    };
  }
  return {
    kind: null,
    displayId: null,
    reason: 'No driver display on this car — preview only.',
  };
}

function setCapBlocked(reason) {
  state.canPushToCluster = false;
  state.blockedReason = reason;
  const banner = document.getElementById('cap-banner');
  banner.textContent = reason;
  banner.classList.add('shown');
  refreshPushButton();
}

/** Summarize a raw bridge response for display in the debug pane. */
function summarize(raw) {
  if (raw == null) return raw;
  if (typeof raw !== 'object') return raw;
  // Don't try to recurse into deep arrays; show a head sample instead.
  const out = {};
  for (const k of Object.keys(raw)) {
    const v = raw[k];
    if (Array.isArray(v)) {
      out[k] = {
        __array: true,
        length: v.length,
        sample: v.slice(0, 3),
      };
    } else if (v && typeof v === 'object') {
      out[k] = v;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function renderDebugPane() {
  const out = document.getElementById('debug-output');
  if (!out) return;
  const lines = [];
  lines.push(`bridge present: ${state.debug.bridgeAvailable}`);
  if (state.debug.identity) {
    lines.push(`car.identity: ${JSON.stringify(state.debug.identity)}`);
  }
  for (const a of state.debug.displayListAttempts) {
    if (a.error) {
      lines.push(`display.list[${a.shape}] → ERROR ${a.error}`);
    } else {
      lines.push(`display.list[${a.shape}] →`);
      lines.push(JSON.stringify(a.response, null, 2));
    }
  }
  if (state.debug.error) {
    lines.push(`error: ${state.debug.error}`);
  }
  out.textContent = lines.length === 0 ? '(no responses yet)' : lines.join('\n');
}

function refreshPushButton() {
  const btn = document.getElementById('push');
  const filled = state.layout.slots.filter(Boolean).length;
  btn.disabled = !state.canPushToCluster || filled === 0;
  btn.textContent =
    state.driverTargetKind === 'driver-panel'
      ? 'Push to driver panel'
      : 'Push to cluster';
  btn.title = !state.canPushToCluster
    ? (state.blockedReason ?? 'Push unavailable on this trim')
    : filled === 0
      ? 'Drop at least one widget into a slot first'
      : state.driverTargetKind === 'driver-panel'
        ? 'Push current layout to the driver-labelled passenger panel'
        : 'Push current layout to the cluster';
}

// ── Push to cluster ──────────────────────────────────────────────

async function push() {
  if (!state.canPushToCluster || state.driverTargetId == null) return;
  const btn = document.getElementById('push');
  btn.disabled = true;
  const savedLabel = btn.textContent;
  btn.textContent = 'Pushing…';
  try {
    // Tear down the previous surface so we don't accumulate WebViews
    // on the driver display.
    if (state.surfaceId) {
      try {
        await callNative('surface.destroy', { surfaceId: state.surfaceId });
      } catch {
        /* ignore — host auto-GCs on miniapp teardown */
      }
      state.surfaceId = null;
    }

    const payload = encodeURIComponent(
      btoa(JSON.stringify({ slots: state.layout.slots, version: 1 })),
    );
    const r = await callNative('surface.create', {
      displayId: state.driverTargetId,
      route: `/cluster.html?layout=${payload}`,
    });
    state.surfaceId = r?.surfaceId ?? null;
    const targetLabel =
      state.driverTargetKind === 'driver-panel' ? 'driver panel' : 'cluster';
    document.getElementById('layout-saved').textContent =
      `pushed · ${state.layout.slots.filter(Boolean).length}/${SLOT_COUNT} on ${targetLabel}`;
  } catch (err) {
    setCapBlocked(`Push failed: ${err?.message ?? err}`);
    console.error('push failed', err);
  } finally {
    btn.textContent = savedLabel;
    refreshPushButton();
  }
}

// ── Live signal preview ──────────────────────────────────────────

async function reconcileSubscription() {
  if (!inHost()) return;
  const names = signalsForLayout(state.layout);
  if (names.length === 0) {
    // No widgets — nothing to subscribe to. The host caps subscriptions
    // at 64 names so it's not worth chasing a no-op resubscribe.
    return;
  }
  try {
    // Seed.
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
    console.warn('car.subscribe failed:', err);
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
    if (typeof s === 'string') dot.classList.add(s);
    text.textContent = typeof s === 'string' ? s : 'unknown';
  });
}

// ── Bootstrap ────────────────────────────────────────────────────

async function main() {
  renderPalette();
  bindSlotEvents();
  document.getElementById('push').addEventListener('click', push);

  // Toggle the debug pane by tapping the trim badge; close button x.
  document.getElementById('trim-badge').addEventListener('click', () => {
    const pane = document.getElementById('debug-pane');
    pane.classList.toggle('shown');
    renderDebugPane();
  });
  document.getElementById('debug-close').addEventListener('click', () => {
    document.getElementById('debug-pane').classList.remove('shown');
  });

  state.debug.bridgeAvailable = inHost();
  if (!inHost()) {
    // Offline preview — still let the user explore the editor.
    load();
    paintAllSlots();
    updateLayoutBadge();
    renderDebugPane();
    return;
  }

  // Identity → deviceId + brand pill.
  try {
    const id = await call('car.identity');
    state.identity = id ?? null;
    state.debug.identity = summarize(id);
    state.deviceId = id?.deviceId ?? id?.modelCode ?? null;
    const text = `${(id?.brand ?? 'unknown').toString().toUpperCase()} · ${
      id?.modelDisplay ?? id?.modelCode ?? '—'
    }`;
    document.getElementById('brand-badge').textContent = text;
  } catch (err) {
    state.debug.error = `car.identity failed: ${err?.message ?? err}`;
    document.getElementById('brand-badge').textContent = 'identity unavailable';
  }

  // Subscribe to connection state.
  call('car.connection.subscribe').catch(() => {
    /* non-fatal — banner just stays at 'connecting…' */
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
  console.error('gauge-builder fatal:', err);
});
