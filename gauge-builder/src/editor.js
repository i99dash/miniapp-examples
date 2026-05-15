/**
 * IVI editor — gauge-builder 0.2.0
 *
 *   - Hero + overlay layout: slot 2 fills the stage; slots 1 and 3
 *     are compact overlays pinned to the bottom corners.
 *   - Per-slot customisation: tap-to-place a widget, **long-press**
 *     a filled slot to open a bottom sheet that picks the render
 *     **style** (Dial / Digital / Bar / Ring) and **accent color**.
 *   - Global **theme** picker (Stealth / Neon / Race / Glass /
 *     Classic) via the header pill.
 *   - **Surprise me** randomises everything for inspiration.
 *
 * Layout schema (v2):
 *
 *     {
 *       version: 2,
 *       theme:   'stealth',
 *       slots: [
 *         { widgetId: 'rpm',     style: 'ring',    color: 'cyan' },
 *         { widgetId: 'speed',   style: 'dial',    color: 'cyan' },
 *         { widgetId: 'battery', style: 'digital', color: 'green' },
 *       ],
 *     }
 *
 * v1 layouts (bare widget-id strings per slot) load cleanly via
 * `normalizeSlot()` — old persisted layouts upgrade in place.
 */

import { call, callNative, on, inHost, cryptoUuid } from './bridge.js';
import {
  BACKGROUNDS,
  BACKGROUND_BY_ID,
  COLORS,
  POSITIONS,
  SIZES,
  STYLES,
  STYLE_IDS,
  THEMES,
  THEME_BY_ID,
  WIDGETS,
  WIDGET_BY_ID,
  colorHex,
  defaultAccent,
  defaultPosition,
  normalizeSlot,
  paintStyled,
  resolveBackground,
  signalsForLayout,
} from './widgets.js';

/** Mode presets used by the Tools panel — one tap loads a full
 *  theme + slot layout. Picked to feel coherent (theme accents match
 *  the slot colors). */
const PRESETS = {
  race: {
    theme: 'race',
    slots: [
      { widgetId: 'rpm',         style: 'bar',     color: 'amber' },
      { widgetId: 'speed',       style: 'dial',    color: 'red',   background: 'cyber' },
      { widgetId: 'battery',     style: 'digital', color: 'red'    },
    ],
  },
  eco: {
    theme: 'glass',
    slots: [
      { widgetId: 'ev-range',    style: 'digital', color: 'green' },
      { widgetId: 'battery',     style: 'ring',    color: 'green', background: 'road' },
      { widgetId: 'cabin-temp',  style: 'digital', color: 'cyan'  },
    ],
  },
  night: {
    theme: 'neon',
    slots: [
      { widgetId: 'rpm',         style: 'bar',     color: 'pink' },
      { widgetId: 'speed',       style: 'ring',    color: 'violet', background: 'cyber' },
      { widgetId: 'battery',     style: 'digital', color: 'pink'  },
    ],
  },
  minimal: {
    theme: 'stealth',
    slots: [
      { widgetId: 'battery',     style: 'digital', color: 'white' },
      { widgetId: 'speed',       style: 'ring',    color: 'cyan'  },
      { widgetId: 'ev-range',    style: 'digital', color: 'white' },
    ],
  },
};

if (!inHost()) {
  document.getElementById('notice').classList.add('shown');
}

const SLOT_COUNT = 3;
const HERO_INDEX = 1;
const STORAGE_KEY = (deviceId) =>
  `gauge-builder:layout:${deviceId ?? 'unknown'}`;

/** The widget the user has tapped in the palette — placed on the next slot tap. */
let selectedWidgetId = null;

/** Slot index the bottom sheet is editing (null when sheet is closed). */
let editingSlot = null;

/** Editor state. The `layout` object is the only thing persisted. */
const state = {
  identity: null,
  deviceId: null,
  layout: {
    version: 2,
    theme: 'stealth',
    slots: new Array(SLOT_COUNT).fill(null),
  },
  signals: Object.create(null),
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
    error: null,
  },
};

// ── Theme application ────────────────────────────────────────────

function applyTheme(themeId) {
  const theme = THEME_BY_ID[themeId] ?? THEMES[0];
  document.body.dataset.theme = theme.id;
  document.getElementById('theme-name').textContent = theme.label;
  state.layout.theme = theme.id;
}

// ── Widget palette (now inside the Widgets sheet) ───────────────

function renderPalette() {
  const host = document.getElementById('widget-grid');
  if (!host) return;
  host.innerHTML = '';
  for (const w of WIDGETS) {
    const tile = document.createElement('div');
    tile.className = 'widget-tile';
    tile.dataset.widgetId = w.id;
    tile.innerHTML = `<span class="glyph">${w.emoji ?? w.label[0]}</span><span class="name">${w.label}</span>`;
    tile.addEventListener('click', () => {
      if (selectedWidgetId === w.id) {
        clearSelection();
      } else {
        selectWidget(w.id);
        // Auto-close the sheet so the user lands on the stage with the
        // widget hot in their hand — saves a second tap.
        hideSheets();
      }
    });
    host.appendChild(tile);
  }
}

function selectWidget(id) {
  selectedWidgetId = id;
  document.body.classList.add('placing');
  for (const tile of document.querySelectorAll('.widget-tile')) {
    tile.classList.toggle('selected', tile.dataset.widgetId === id);
  }
}

function clearSelection() {
  selectedWidgetId = null;
  document.body.classList.remove('placing');
  for (const tile of document.querySelectorAll('.widget-tile')) {
    tile.classList.remove('selected');
  }
}

// ── Slot interaction ────────────────────────────────────────────

function slotEls() {
  return [...document.querySelectorAll('.slot')];
}

const LONG_PRESS_MS = 480;

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
      if (timer) { clearTimeout(timer); timer = null; }
    };
    el.addEventListener('pointerdown', start);
    el.addEventListener('pointerup', cancel);
    el.addEventListener('pointercancel', cancel);
    el.addEventListener('pointerleave', cancel);

    el.addEventListener('click', (e) => {
      if (longPressed) {
        // Long-press already opened the sheet; don't also place.
        longPressed = false;
        return;
      }
      if (e.target.closest('[data-clear]')) return;
      if (selectedWidgetId) {
        placeWidget(idx, selectedWidgetId);
        clearSelection();
      }
    });
  }

  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-clear]');
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
  // First placement in this slot — pick a sensible default style and
  // the theme's default accent. Subsequent edits go through the sheet.
  const def = {
    widgetId,
    style: idx === HERO_INDEX ? 'dial' : 'digital',
    color: defaultAccent(state.layout.theme),
    background: 'none',
    position: defaultPosition(idx),
    size: 'M',
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
  for (const el of slotEls()) {
    const idx = parseInt(el.dataset.slot, 10);
    const slot = state.layout.slots[idx];
    const empty = el.querySelector('.empty');
    const canvas = el.querySelector('canvas');
    el.classList.toggle('filled', !!slot);
    empty.style.display = slot ? 'none' : '';
    // Apply position + size to overlay slots from the layout entry.
    // Hero (slot 1) is full-bleed and ignores data-pos/data-size.
    if (idx !== HERO_INDEX) {
      el.dataset.pos = slot?.position ?? defaultPosition(idx);
      el.dataset.size = slot?.size ?? 'M';
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
  const host = document.getElementById('slot-indicators');
  if (!host) return;
  const dots = host.querySelectorAll('.si');
  for (let i = 0; i < dots.length; i++) {
    dots[i].classList.toggle('filled', !!state.layout.slots[i]);
  }
}

/** Mount or unmount the feathered circular media well behind the
 *  hero canvas. Re-uses any existing element if the URL is unchanged
 *  so we don't tear down + restart a video on every paintAllSlots. */
function applyHeroBackground() {
  const host = document.getElementById('hero-bg');
  if (!host) return;
  const slot = state.layout.slots[HERO_INDEX];
  const { kind, url } = resolveBackground(slot?.background);
  if (!url) {
    host.innerHTML = '';
    return;
  }
  const existing = host.firstElementChild;
  const sameKind = existing?.tagName?.toLowerCase() === kind;
  const sameUrl = existing?.dataset?.url === url;
  if (sameKind && sameUrl) return;
  host.innerHTML = '';
  if (kind === 'video') {
    const v = document.createElement('video');
    v.src = url;
    v.autoplay = true;
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    v.dataset.url = url;
    host.appendChild(v);
  } else {
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    img.dataset.url = url;
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
  paintStyled(
    ctx,
    { x: 0, y: 0, w: rect.width, h: rect.height },
    slot,
    state.signals,
    isHero,
  );
  ctx.restore();
}

// ── Tools panel ─────────────────────────────────────────────────

function renderSlotChips() {
  const host = document.getElementById('slot-chips');
  if (!host) return;
  host.innerHTML = '';
  for (let i = 0; i < SLOT_COUNT; i++) {
    const slot = state.layout.slots[i];
    const chip = document.createElement('div');
    chip.className = 'slot-chip' + (slot ? '' : ' empty');
    const label = `SLOT ${i + 1}${i === HERO_INDEX ? ' · HERO' : ''}`;
    if (slot) {
      const w = WIDGET_BY_ID[slot.widgetId];
      const s = STYLES.find((x) => x.id === slot.style);
      chip.innerHTML = `
        <span class="label">${label}</span>
        <span class="em">${w?.emoji ?? '•'}</span>
        <span class="desc">${w?.label ?? slot.widgetId} · ${s?.emoji ?? ''} ${s?.label ?? slot.style}</span>
        <span class="swatch-mini" style="background:${colorHex(slot.color)}"></span>
        <button class="x" data-clear-tool="${i}" title="Clear slot">×</button>
      `;
      chip.addEventListener('click', (e) => {
        if (e.target.closest('[data-clear-tool]')) return;
        openSlotSheet(i);
      });
    } else {
      chip.innerHTML = `
        <span class="label">${label}</span>
        <span class="em">·</span>
        <span class="desc">empty — tap a widget then a slot</span>
        <span class="swatch-mini"></span>
        <button class="x">×</button>
      `;
    }
    host.appendChild(chip);
  }
}

function bindToolsEvents() {
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-clear-tool]');
    if (t) {
      e.stopPropagation();
      setSlot(parseInt(t.dataset.clearTool, 10), null);
    }
  });
  document.getElementById('quick-actions')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    runQuickAction(btn.dataset.action);
  });
  document.getElementById('presets')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-preset]');
    if (!btn) return;
    loadPreset(btn.dataset.preset);
  });
}

function runQuickAction(action) {
  const s = state.layout.slots;
  switch (action) {
    case 'mirror': // Copy slot 1 → slot 3 (keep type, just clone settings).
      if (!s[0]) return;
      s[2] = { ...s[0] };
      break;
    case 'swap':
      [s[0], s[2]] = [s[2], s[0]];
      break;
    case 'match': // All slots adopt slot 2's color.
      if (!s[HERO_INDEX]) return;
      for (let i = 0; i < SLOT_COUNT; i++) {
        if (s[i]) s[i].color = s[HERO_INDEX].color;
      }
      break;
    case 'hero': // Promote slot 1 into the hero (with hero defaults).
      if (!s[0]) return;
      s[HERO_INDEX] = { ...s[0], style: 'dial' };
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

// ── Bottom sheets ───────────────────────────────────────────────

function openSlotSheet(idx) {
  const slot = state.layout.slots[idx];
  if (!slot) return;
  // Note: we set `editingSlot` AFTER `showSheet()` at the bottom of
  // this function — `showSheet` internally calls `hideSheets()` which
  // would otherwise null `editingSlot` between this assignment and
  // the first chip-tap, leaving every Looks/Color/Layout/Backdrop
  // handler dead-locked behind its `if (editingSlot == null) return`
  // guard. The bug ate gauge-builder 0.5.0 / 0.5.1 alive.
  const w = WIDGET_BY_ID[slot.widgetId];
  document.getElementById('slot-sheet-title').textContent =
    `Customize · ${w?.label ?? 'slot'}`;
  document.getElementById('slot-sheet-sub').textContent =
    idx === HERO_INDEX ? 'Hero slot — fills the cluster face.' : 'Overlay slot.';
  renderStyleChips(slot.style);
  renderColorSwatches(slot.color);
  // Layout row — overlays only (hero always full-bleed).
  const layoutRow = document.getElementById('layout-row');
  if (idx === HERO_INDEX) {
    layoutRow.hidden = true;
  } else {
    layoutRow.hidden = false;
    renderPositionChips(slot.position);
    renderSizeChips(slot.size);
  }
  // Background row — hero only.
  const bgRow = document.getElementById('bg-row');
  if (idx === HERO_INDEX) {
    bgRow.hidden = false;
    renderBackgroundChips(slot.background);
  } else {
    bgRow.hidden = true;
  }
  showSheet('slot-sheet');
  // `showSheet` → `hideSheets` → clears editingSlot; re-set it now so
  // the chip click handlers can find the slot we're actually editing.
  editingSlot = idx;
}

function renderPositionChips(activeId) {
  const host = document.getElementById('position-chips');
  host.innerHTML = '';
  for (const p of POSITIONS) {
    const chip = document.createElement('div');
    chip.className = 'chip' + (p.id === activeId ? ' active' : '');
    chip.textContent = `${p.emoji} ${p.label}`;
    chip.addEventListener('click', () => {
      if (editingSlot == null) return;
      const slot = state.layout.slots[editingSlot];
      if (!slot) return;
      slot.position = p.id;
      persist();
      paintAllSlots();
      renderPositionChips(p.id);
    });
    host.appendChild(chip);
  }
}

function renderSizeChips(activeId) {
  const host = document.getElementById('size-chips');
  host.innerHTML = '';
  for (const s of SIZES) {
    const chip = document.createElement('div');
    chip.className = 'chip' + (s.id === activeId ? ' active' : '');
    chip.textContent = `${s.id} · ${s.label}`;
    chip.addEventListener('click', () => {
      if (editingSlot == null) return;
      const slot = state.layout.slots[editingSlot];
      if (!slot) return;
      slot.size = s.id;
      persist();
      paintAllSlots();
      renderSizeChips(s.id);
    });
    host.appendChild(chip);
  }
}

function renderBackgroundChips(active) {
  const host = document.getElementById('bg-chips');
  host.innerHTML = '';
  const activeId = typeof active === 'string' && BACKGROUND_BY_ID[active] ? active : null;
  const isCustomUpload = typeof active === 'string' && active.startsWith('data:');
  const isCustomUrl = typeof active === 'string' && active.startsWith('http');

  for (const b of BACKGROUNDS) {
    const chip = document.createElement('div');
    chip.className = 'chip' + (b.id === activeId ? ' active' : '');
    chip.textContent = `${b.emoji ?? ''} ${b.label}`.trim();
    chip.addEventListener('click', () => {
      if (editingSlot == null) return;
      const slot = state.layout.slots[editingSlot];
      if (!slot) return;
      slot.background = b.id;
      persist();
      paintAllSlots();
      renderBackgroundChips(b.id);
      const input = document.getElementById('bg-url');
      if (input) input.value = '';
      setBgStatus('');
    });
    host.appendChild(chip);
  }

  // Custom upload chip — opens the system file picker, resizes, and
  // embeds the result as a data: URL into the slot's background.
  const upload = document.createElement('div');
  upload.className = 'chip' + (isCustomUpload ? ' active' : '');
  upload.textContent = isCustomUpload ? '📁 Upload ✓' : '📁 Upload…';
  upload.addEventListener('click', () => {
    document.getElementById('bg-file')?.click();
  });
  host.appendChild(upload);

  // Custom URL input — Enter (or blur) commits the URL.
  const input = document.getElementById('bg-url');
  if (input) {
    input.value = isCustomUrl ? active : '';
    input.onchange = () => commitBackgroundUrl(input.value.trim());
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitBackgroundUrl(input.value.trim());
        input.blur();
      }
    };
  }

  // If we're showing an uploaded image, surface its rough size so the
  // user knows the layout payload is heavier than a preset.
  if (isCustomUpload) {
    const kb = Math.round((active.length * 3) / 4 / 1024);
    setBgStatus(`Custom image embedded · ≈${kb} KB`);
  } else if (isCustomUrl) {
    setBgStatus(`Remote URL · ${shortenUrl(active)}`);
  } else {
    setBgStatus('');
  }
}

function setBgStatus(msg) {
  const el = document.getElementById('bg-status');
  if (el) el.textContent = msg;
}

function shortenUrl(u) {
  if (u.length < 60) return u;
  return `${u.slice(0, 40)}…${u.slice(-12)}`;
}

/** Compress a user-picked image to a JPEG data URL that fits the
 *  layout payload. Max 600×600, quality 0.78 — typically lands
 *  under 100 KB for a phone-camera photo. */
async function uploadBgFromFile(file) {
  if (!file || !file.type?.startsWith('image/')) {
    setBgStatus('Only image files are supported via upload.');
    return;
  }
  setBgStatus('Reading image…');
  try {
    const original = await readFileAsDataURL(file);
    const img = await loadImage(original);
    const MAX = 600;
    const ratio = Math.min(MAX / img.naturalWidth, MAX / img.naturalHeight, 1);
    const w = Math.max(1, Math.round(img.naturalWidth * ratio));
    const h = Math.max(1, Math.round(img.naturalHeight * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    // Centre-crop to a square before resizing so the circular mask
    // shows a meaningful framing of the user's image (a portrait
    // doesn't lose its subject).
    const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
    drawCenterCropped(ctx, img, w, h);
    const finalUrl = canvas.toDataURL('image/jpeg', 0.78);
    void dataUrl; // first draw was a warm-up; finalUrl is what we keep.
    if (editingSlot == null) return;
    const slot = state.layout.slots[editingSlot];
    if (!slot) return;
    slot.background = finalUrl;
    persist();
    paintAllSlots();
    renderBackgroundChips(slot.background);
  } catch (err) {
    console.error('uploadBgFromFile failed', err);
    setBgStatus(`Upload failed: ${err?.message ?? err}`);
  }
}

function drawCenterCropped(ctx, img, w, h) {
  // Fit-cover crop: scale so the image fully covers the target, then
  // centre-align the overflow.
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
    r.onerror = () => reject(r.error ?? new Error('read_failed'));
    r.readAsDataURL(file);
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image_decode_failed'));
    img.src = src;
  });
}

function commitBackgroundUrl(url) {
  if (editingSlot == null) return;
  const slot = state.layout.slots[editingSlot];
  if (!slot) return;
  if (!url) {
    slot.background = 'none';
  } else {
    slot.background = url;
  }
  persist();
  paintAllSlots();
  renderBackgroundChips(slot.background);
}

function renderStyleChips(activeId) {
  const host = document.getElementById('style-chips');
  host.innerHTML = '';
  for (const s of STYLES) {
    const chip = document.createElement('div');
    chip.className = 'chip' + (s.id === activeId ? ' active' : '');
    chip.textContent = `${s.emoji ?? ''} ${s.label}`.trim();
    chip.addEventListener('click', () => {
      if (editingSlot == null) return;
      const slot = state.layout.slots[editingSlot];
      if (!slot) return;
      slot.style = s.id;
      persist();
      paintAllSlots();
      renderStyleChips(s.id);
    });
    host.appendChild(chip);
  }
}

function renderColorSwatches(activeId) {
  const host = document.getElementById('color-chips');
  host.innerHTML = '';
  for (const c of COLORS) {
    const sw = document.createElement('div');
    sw.className = 'swatch' + (c.id === activeId ? ' active' : '');
    sw.style.background = c.hex;
    sw.title = c.id;
    sw.addEventListener('click', () => {
      if (editingSlot == null) return;
      const slot = state.layout.slots[editingSlot];
      if (!slot) return;
      slot.color = c.id;
      persist();
      paintAllSlots();
      renderColorSwatches(c.id);
    });
    host.appendChild(sw);
  }
}

function openThemeSheet() {
  const host = document.getElementById('theme-tiles');
  host.innerHTML = '';
  for (const t of THEMES) {
    const tile = document.createElement('div');
    tile.className = 'theme-tile' + (t.id === state.layout.theme ? ' active' : '');
    tile.innerHTML = `
      <div class="name"><span class="em">${t.emoji ?? '✨'}</span> ${t.label}</div>
      <div class="desc">${t.desc}</div>
      <div class="preview" data-theme-preview="${t.id}"></div>
    `;
    tile.addEventListener('click', () => {
      applyTheme(t.id);
      persist();
      paintAllSlots();
      openThemeSheet(); // refresh active highlight
    });
    host.appendChild(tile);
  }
  for (const node of host.querySelectorAll('[data-theme-preview]')) {
    const id = node.getAttribute('data-theme-preview');
    paintThemePreview(node, id);
  }
  showSheet('theme-sheet');
}

function paintThemePreview(node, themeId) {
  // Probe the theme's CSS variables by spawning an off-DOM element
  // styled to that theme and reading its computed values. Cheap,
  // avoids hardcoding theme tokens in JS.
  const probe = document.createElement('div');
  probe.setAttribute('data-theme', themeId);
  probe.style.cssText = 'position:absolute; visibility:hidden; pointer-events:none;';
  // The theme tokens are scoped to `body[data-theme=...]`, not just any
  // element — to read them we temporarily flip the body so the
  // off-DOM probe inherits. Cheaper alternative: hardcode preview
  // gradients. Use the second.
  const previews = {
    stealth: 'radial-gradient(circle at 20% 30%, #1e3a8a 0%, transparent 50%), radial-gradient(circle at 80% 70%, #6d28d9 0%, transparent 50%), #06080d',
    neon:    'radial-gradient(circle at 20% 30%, #ec4899 0%, transparent 50%), radial-gradient(circle at 80% 70%, #06b6d4 0%, transparent 50%), #0a0518',
    race:    'radial-gradient(circle at 50% 30%, #dc2626 0%, transparent 55%), radial-gradient(circle at 80% 80%, #f59e0b 0%, transparent 50%), #0a0606',
    glass:   'radial-gradient(circle at 25% 25%, #475569 0%, transparent 50%), radial-gradient(circle at 75% 75%, #38bdf8 0%, transparent 50%), linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    classic: 'radial-gradient(circle at 30% 30%, #fbbf24 0%, transparent 35%), linear-gradient(180deg, #0a0805 0%, #050302 100%)',
    sunset:  'radial-gradient(circle at 20% 30%, #f97316 0%, transparent 55%), radial-gradient(circle at 80% 60%, #ec4899 0%, transparent 55%), #2d0e1a',
    y2k:     'radial-gradient(circle at 25% 30%, #c084fc 0%, transparent 55%), radial-gradient(circle at 75% 70%, #67e8f9 0%, transparent 55%), #1a0f2e',
  };
  node.style.background = previews[themeId] ?? previews.stealth;
}

function showSheet(id) {
  // Mutual-exclusion across sheets — opening one closes the others.
  hideSheets();
  document.getElementById('sheet-scrim').classList.add('shown');
  document.getElementById(id).classList.add('shown');
}
function hideSheets() {
  document.getElementById('sheet-scrim').classList.remove('shown');
  for (const id of ['widgets-sheet', 'tools-sheet', 'more-sheet', 'slot-sheet', 'theme-sheet']) {
    document.getElementById(id)?.classList.remove('shown');
  }
  editingSlot = null;
}

// ── Surprise me ─────────────────────────────────────────────────

function surpriseMe() {
  // Pick a theme; pick widget + style + color for each slot biased
  // toward the slot's "personality" (hero gets dial/ring; overlays
  // get digital/bar more often). Avoid putting the same widget in
  // two slots.
  const theme = pickRandom(THEMES).id;
  applyTheme(theme);
  const used = new Set();
  const slots = new Array(SLOT_COUNT).fill(null);
  for (let i = 0; i < SLOT_COUNT; i++) {
    const candidates = WIDGETS.filter((w) => !used.has(w.id));
    const w = pickRandom(candidates);
    used.add(w.id);
    const styleBias = i === HERO_INDEX ? ['dial', 'ring', 'dial', 'bar'] : ['digital', 'bar', 'digital', 'ring'];
    const style = pickRandom(styleBias);
    const color = pickRandom(COLORS).id;
    // Hero gets a random preset background ~70% of the time; overlays
    // never get a background (they're already on their own card).
    const background =
      i === HERO_INDEX && Math.random() < 0.7
        ? pickRandom(BACKGROUNDS.filter((b) => b.id !== 'none')).id
        : 'none';
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

// ── Persistence ─────────────────────────────────────────────────

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(state.deviceId));
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const themeId = parsed.theme ?? state.layout.theme;
    applyTheme(themeId);
    const slotsIn = Array.isArray(parsed.slots) ? parsed.slots : [];
    state.layout.slots = new Array(SLOT_COUNT).fill(null).map((_, i) =>
      normalizeSlot(slotsIn[i], themeId, i),
    );
  } catch {
    /* ignore — bad JSON, fall back to defaults */
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY(state.deviceId), JSON.stringify(state.layout));
  } catch {
    /* ignore */
  }
  updateLayoutBadge();
}

function updateLayoutBadge() {
  const filled = state.layout.slots.filter(Boolean).length;
  document.getElementById('layout-saved').textContent =
    filled === 0 ? 'layout: empty' : `layout: ${filled}/${SLOT_COUNT} · ${state.layout.theme}`;
}

// ── Capability detection ────────────────────────────────────────

const FRIENDLY_CLUSTER_RE = /XDJAScreenProjection_1$/i;
const CLUSTER_PIXEL_CAPS = ['surface.write.cluster', 'pkg.launch.cluster.pixel'];
const DRIVER_LABEL = 'Driver';

async function detectCapabilities() {
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
    setCapBlocked('display.list unavailable on this host — see debug pane.');
    return;
  }

  const displays = snapshot.displays ?? [];
  const vehicle = snapshot.vehicle ?? null;

  const trim = document.getElementById('trim-badge');
  if (vehicle?.friendlyName) {
    trim.textContent = `trim: ${vehicle.friendlyName}${vehicle.isFallback ? ' · best-effort' : ''}`;
  } else if (vehicle?.dilinkFamily) {
    trim.textContent = `trim: ${vehicle.dilinkFamily}`;
  } else {
    trim.textContent = 'trim: unknown';
  }

  const target = resolveDriverTarget(displays, vehicle);
  state.driverTargetKind = target.kind;
  state.driverTargetId = target.displayId;

  if (target.kind === null) { setCapBlocked(target.reason); return; }

  state.canPushToCluster = true;
  state.blockedReason = null;
  const banner = document.getElementById('cap-banner');
  if (target.kind === 'driver-panel') {
    banner.classList.add('shown', 'info');
    banner.textContent = 'No cluster on this trim — pushing to the passenger panel labelled "Driver".';
  } else {
    banner.classList.remove('shown', 'info');
    banner.textContent = '';
  }
  refreshPushButton();
}

function resolveDriverTarget(displays, vehicle) {
  const caps = vehicle?.capabilities ?? [];
  const legacyMode = caps.length === 0;
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
  }
  const driverPanel = displays.find(
    (d) => d.role === 'passenger' && d.overrideLabel === DRIVER_LABEL,
  );
  if (driverPanel) return { kind: 'driver-panel', displayId: driverPanel.id, reason: null };
  if (cluster) {
    const family = vehicle?.dilinkFamily ?? 'this trim';
    return { kind: null, displayId: null, reason: `Cluster pixel rendering not supported on ${family} — preview only.` };
  }
  return { kind: null, displayId: null, reason: 'No driver display on this car — preview only.' };
}

function setCapBlocked(reason) {
  state.canPushToCluster = false;
  state.blockedReason = reason;
  const banner = document.getElementById('cap-banner');
  banner.textContent = reason;
  banner.classList.add('shown');
  refreshPushButton();
}

function summarize(raw) {
  if (raw == null || typeof raw !== 'object') return raw;
  const out = {};
  for (const k of Object.keys(raw)) {
    const v = raw[k];
    if (Array.isArray(v)) out[k] = { __array: true, length: v.length, sample: v.slice(0, 3) };
    else out[k] = v;
  }
  return out;
}

function renderDebugPane() {
  const out = document.getElementById('debug-output');
  if (!out) return;
  const lines = [`bridge present: ${state.debug.bridgeAvailable}`];
  if (state.debug.identity) lines.push(`car.identity: ${JSON.stringify(state.debug.identity)}`);
  for (const a of state.debug.displayListAttempts) {
    if (a.error) lines.push(`display.list[${a.shape}] → ERROR ${a.error}`);
    else { lines.push(`display.list[${a.shape}] →`); lines.push(JSON.stringify(a.response, null, 2)); }
  }
  if (state.debug.error) lines.push(`error: ${state.debug.error}`);
  out.textContent = lines.join('\n');
}

function refreshPushButton() {
  const btn = document.getElementById('push');
  const filled = state.layout.slots.filter(Boolean).length;
  btn.disabled = !state.canPushToCluster || filled === 0;
  btn.textContent = state.driverTargetKind === 'driver-panel' ? 'Push to driver panel' : 'Push to cluster';
  btn.title = !state.canPushToCluster
    ? (state.blockedReason ?? 'Push unavailable on this trim')
    : filled === 0
      ? 'Place at least one widget first'
      : 'Send current layout to the driver display';
}

// ── Push to cluster ─────────────────────────────────────────────

async function push() {
  if (!state.canPushToCluster || state.driverTargetId == null) return;
  const btn = document.getElementById('push');
  btn.disabled = true;
  const savedLabel = btn.textContent;
  btn.textContent = 'Pushing…';
  try {
    if (state.surfaceId) {
      try { await callNative('surface.destroy', { surfaceId: state.surfaceId }); }
      catch { /* host auto-GCs */ }
      state.surfaceId = null;
    }
    const payload = encodeURIComponent(btoa(JSON.stringify(state.layout)));
    const r = await callNative('surface.create', {
      displayId: state.driverTargetId,
      route: `/cluster.html?layout=${payload}`,
    });
    state.surfaceId = r?.surfaceId ?? null;
    const targetLabel = state.driverTargetKind === 'driver-panel' ? 'driver panel' : 'cluster';
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

// ── Live signal preview ─────────────────────────────────────────

async function reconcileSubscription() {
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
    console.warn('car.subscribe failed:', err);
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
    if (typeof s === 'string') dot.classList.add(s);
    text.textContent = typeof s === 'string' ? s : 'unknown';
  });
}

// ── Bootstrap ───────────────────────────────────────────────────

async function main() {
  applyTheme(state.layout.theme);
  renderPalette();
  bindSlotEvents();
  document.getElementById('push').addEventListener('click', push);
  document.getElementById('theme-pill').addEventListener('click', openThemeSheet);

  // Dock buttons → open the corresponding sheet.
  document.getElementById('open-widgets').addEventListener('click', () => showSheet('widgets-sheet'));
  document.getElementById('open-tools').addEventListener('click', () => showSheet('tools-sheet'));
  document.getElementById('open-more').addEventListener('click', () => showSheet('more-sheet'));

  // Sheet-close × buttons + scrim tap.
  document.querySelectorAll('[data-close-sheet]').forEach((b) =>
    b.addEventListener('click', hideSheets),
  );

  // More-sheet actions.
  document.getElementById('more-glowup')?.addEventListener('click', () => { hideSheets(); surpriseMe(); });
  document.getElementById('more-reset')?.addEventListener('click', () => { hideSheets(); resetLayout(); });
  document.getElementById('more-debug')?.addEventListener('click', () => {
    hideSheets();
    document.getElementById('debug-pane').classList.toggle('shown');
    renderDebugPane();
  });

  bindToolsEvents();
  // File input for custom-image upload — wired once at boot.
  const fileInput = document.getElementById('bg-file');
  if (fileInput) {
    fileInput.addEventListener('change', () => {
      const f = fileInput.files?.[0];
      // Reset the input so the same file can be picked again.
      fileInput.value = '';
      if (f) uploadBgFromFile(f);
    });
  }
  document.getElementById('sheet-scrim').addEventListener('click', hideSheets);
  // (slot-sheet-close / theme-sheet-close IDs were removed in 0.4.0 —
  // the [data-close-sheet] selector above already wires every × button.)
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
    load(); paintAllSlots(); updateLayoutBadge(); renderDebugPane();
    requestAnimationFrame(tick);
    return;
  }

  try {
    const id = await call('car.identity');
    state.identity = id ?? null;
    state.debug.identity = summarize(id);
    state.deviceId = id?.deviceId ?? id?.modelCode ?? null;
    const text = `${(id?.brand ?? 'unknown').toString().toUpperCase()} · ${id?.modelDisplay ?? id?.modelCode ?? '—'}`;
    document.getElementById('brand-badge').textContent = text;
  } catch (err) {
    state.debug.error = `car.identity failed: ${err?.message ?? err}`;
    document.getElementById('brand-badge').textContent = 'identity unavailable';
  }

  call('car.connection.subscribe').catch(() => {});
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
