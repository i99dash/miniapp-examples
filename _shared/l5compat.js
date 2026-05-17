/**
 * l5compat — one shared bridge + UX layer for every example mini-app.
 *
 * ─── Why this file exists ──────────────────────────────────────────
 * The same ~90 lines (host resolution, the `__i99dashEvents` push
 * fan-out, `call`/`callNative`, `cryptoUuid`) were copy-pasted
 * verbatim into battery-analyzer, gauge-cluster, gauge-builder,
 * cluster-hello-world, and others. This is the single source of
 * truth. It is dependency-free and is inlined into each app at
 * bundle time by esbuild — the published tarball stays a
 * self-contained static folder, with no runtime coupling between
 * apps.
 *
 * ─── What "works on L5" actually means ─────────────────────────────
 * car-i99dash + the SDK were updated so EVERY car — Leopard 5
 * included — now runs the **v2 `car.*` bridge** (protocol 2.0.0).
 * There is no legacy bridge left and, per the platform's design,
 * "no compat shim": a v4 call against a v2 bridge just 404s the
 * handler. So the only thing that kept these apps off L5 was the
 * `minHostVersion` gate in their manifests (now lowered to 0.0.2).
 * With that gate gone they speak plain v2 and run on L5.
 *
 * The one genuine, code-proof L5 limit is hardware: a DiLink-5.0
 * instrument **cluster MCU** is daemon-locked, so `surface.*` writes
 * to the *cluster role* can't paint pixels. That is detected here
 * (`isL5`) so cluster apps can show one consistent notice instead of
 * a blank screen — exactly the cases `mountNotice` / `requireFamily`
 * cover.
 *
 * Do NOT over-generalize this to "L5 can't paint." The daemon-lock
 * is specific to the cluster MCU (which is not even an Android
 * `Display` on Di5.0). L5's secondary BYD-container surfaces
 * (`(shared_)fission_bg_XDJAScreenProjection*`, displays 2/3/4) are
 * paintable `FLAG_PRESENTATION` projection virtuals — `surface.*`
 * onto them via the host `Presentation` path works (dash-wallpaper
 * runs there). The host classifies all three as the *passenger*
 * role, never *cluster*, so a passenger/own-content surface is fine
 * on L5; only the cluster *role* is gated.
 *
 * Target: ES2019 (esbuild down-levels `?.`/`??`; safe to use here).
 */

// ── Host handle ────────────────────────────────────────────────────
// Resolution order MUST match the SDK's resolveHostApi(): the branded
// `__i99dashHost` is preferred, `flutter_inappwebview` is the legacy
// fallback. On a bridge-v2 host the working v2 `car.*` handlers are
// on the branded global; binding to a stale legacy `flutter_inappwebview`
// makes calls resolve to nothing (dashboards show all "—").
function _resolveHost() {
  if (typeof globalThis === 'undefined') return null;
  const branded = globalThis.__i99dashHost;
  if (branded && typeof branded.callHandler === 'function') return branded;
  const legacy = globalThis.flutter_inappwebview;
  if (legacy && typeof legacy.callHandler === 'function') return legacy;
  return null;
}
// Eager best-effort snapshot — kept for back-compat with callers that
// read `host` directly. PREFER `whenHostReady()` / `inHost()` (live):
// `flutter_inappwebview`'s `callHandler` is NOT guaranteed wired at
// initial synchronous script execution — the plugin signals readiness
// via the `flutterInAppWebViewPlatformReady` window event. Resolving
// once eagerly loses that race on slower WebViews (DiLink 5.0) →
// "not inside host" / every value "—", while a faster WebView (L8)
// wins it. This is the confirmed L5 root cause.
export const host = _resolveHost();

/** Live presence check — re-resolves (host may arrive after load). */
export function inHost() {
  return _resolveHost() != null;
}

/**
 * Resolve the host bridge, waiting for it if it isn't ready yet.
 * Resolves immediately when already present (fast-WebView path, zero
 * change); otherwise resolves on the `flutterInAppWebViewPlatformReady`
 * event AND a 150 ms poll, capped by [timeoutMs] after which it
 * resolves `null` (genuinely not in a host — e.g. a plain browser).
 * Await this before first use instead of bailing on one eager check.
 */
export function whenHostReady(timeoutMs = 8000) {
  return new Promise((resolve) => {
    const now = _resolveHost();
    if (now) return resolve(now);
    const w = typeof window !== 'undefined' ? window : null;
    let settled = false;
    const finish = (h) => {
      if (settled) return;
      settled = true;
      if (w) w.removeEventListener('flutterInAppWebViewPlatformReady', onReady);
      clearInterval(poll);
      clearTimeout(timer);
      resolve(h);
    };
    const tryNow = () => {
      const h = _resolveHost();
      if (h) finish(h);
    };
    const onReady = () => tryNow();
    if (w) w.addEventListener('flutterInAppWebViewPlatformReady', onReady);
    const poll = setInterval(tryNow, 150);
    const timer = setTimeout(() => finish(_resolveHost()), timeoutMs);
  });
}

export function cryptoUuid() {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ── Push events ────────────────────────────────────────────────────
// The host fans pushes in via globalThis.__i99dashEvents.dispatch(
// channel, payload). One shared registry so every app (and this
// module's car-subscribe helper) listens through the same hub.
const events =
  (typeof globalThis !== 'undefined' && globalThis.__i99dashEvents) ||
  (globalThis.__i99dashEvents = {
    _handlers: Object.create(null),
    on(channel, fn) {
      (this._handlers[channel] = this._handlers[channel] || new Set()).add(fn);
      return () => {
        const s = this._handlers[channel];
        if (s) s.delete(fn);
      };
    },
    dispatch(channel, payload) {
      const set = this._handlers[channel];
      if (!set) return;
      let parsed = payload;
      if (typeof payload === 'string') {
        try {
          parsed = JSON.parse(payload);
        } catch (_) {
          /* leave as string */
        }
      }
      for (const fn of set) {
        try {
          fn(parsed);
        } catch (err) {
          console.error('[l5compat] event listener error:', err);
        }
      }
    },
  });

/** Subscribe to a host push channel. Returns an unsubscribe fn. */
export function on(channel, fn) {
  return events.on(channel, fn);
}

// ── Raw calls ──────────────────────────────────────────────────────

/**
 * Flat-payload convention — the v2 `car.*` family. `callHandler`
 * returns the payload directly.
 */
export async function call(handler, payload = {}) {
  // Resolve LAZILY (not the eager `host` snapshot) so a host that
  // arrived after module load still works without the caller having
  // to await whenHostReady() first.
  const h = _resolveHost();
  if (!h) throw new Error('not_inside_host');
  return h.callHandler(handler, payload);
}

/**
 * Enveloped convention — native-capability families (`display.*`,
 * `surface.*`, `cursor.*`, `gesture.*`, `pkg.*`). Request is wrapped
 * in `{ params, idempotencyKey }`; response is `{ success, data?,
 * error? }`. Throws `code: message` on `success === false`.
 */
export async function callNative(handler, params = {}) {
  const h = _resolveHost(); // lazy — see call()
  if (!h) throw new Error('not_inside_host');
  const raw = await h.callHandler(handler, {
    params,
    idempotencyKey: cryptoUuid(),
  });
  if (raw && raw.success === false) {
    const err = raw.error || {};
    throw new Error(`${err.code || 'host_error'}: ${err.message || 'unknown'}`);
  }
  return (raw && raw.data) || raw;
}

// ── Context + backend proxy ────────────────────────────────────────
// `getContext`/`callApi` are flat-payload host handlers — the same
// ones the `i99dash` SDK's MiniAppClient wraps. Kept here so an app
// can stay a single dependency-free IIFE bundle (L5-safe) and still
// use the standard surface.

/** Host context: { userId, activeCarId, locale, isDark, appId, appVersion }. */
export async function getContext() {
  return call('getContext');
}

/**
 * Backend proxy through the host allow-list. Returns the host
 * envelope verbatim: `{ success, data }` | `{ success:false, error }`.
 * Never call `fetch()` for backend data — this routes through the
 * host the same way `client.callApi()` does.
 */
export async function callApi(req) {
  return call('callApi', req);
}

// ── v2 car bridge ──────────────────────────────────────────────────
//
// Thin, correct wrappers over the v2 `car.*` handlers (protocol
// 2.0.0). Read by name, get back `{ values }`; subscribe by name,
// receive `car.signal` pushes. Identical wire shape to the `i99dash`
// SDK's `client.car.read` / `client.car.subscribe`.

/**
 * Read a snapshot of the named signals (≤ 64). Resolves to an object
 * keyed by signal name; missing names are simply absent (callers
 * treat absent as "—"). Never throws on an unknown name.
 */
// Mirror the SDK: any object with an `error` key is an error
// envelope. Surfacing it (vs silently returning {}) is why a
// broken car.read shows a real message instead of all "—".
function _throwIfError(tag, raw) {
  if (raw !== null && typeof raw === 'object' && 'error' in raw) {
    throw new Error(`${tag} error: ${JSON.stringify(raw.error)}`);
  }
  return raw;
}

export async function carRead(names) {
  const list = Array.isArray(names) ? names : [names];
  const r = _throwIfError('car.read', await call('car.read', { names: list }));
  return (r && r.values) || {};
}

/**
 * Subscribe to the named signals. `cb` receives a partial
 * `{ name: value }` patch per push. Returns an unsubscribe fn that
 * also tears down the host subscription.
 */
export async function carSubscribe(names, cb) {
  const list = Array.isArray(names) ? names : [names];
  let subId = null;
  const off = on('car.signal', (payload) => {
    const ev = (payload && payload.data) || payload;
    if (!ev || !ev.name) return;
    if (
      subId &&
      payload &&
      payload.subscriptionId &&
      payload.subscriptionId !== subId
    ) {
      return;
    }
    if (list.includes(ev.name)) cb({ [ev.name]: ev.value });
  });
  try {
    const res = _throwIfError(
      'car.subscribe',
      await call('car.subscribe', { names: list, idempotencyKey: cryptoUuid() }),
    );
    subId = (res && res.subscriptionId) || null;
    if (res && Array.isArray(res.rejected) && res.rejected.length) {
      console.warn('[l5compat] car.subscribe rejected:', res.rejected);
    }
  } catch (err) {
    off();
    throw err;
  }
  return off;
}

// Location via the v2/v5.1 host catalog. The bespoke `location.read`
// bridge handler is gone under bridge-v2; `navigator.geolocation`
// times out silently on the DiLink (L8) WebView (i99dash-docs →
// Guides → Location). The supported path is the catalog: discover
// `category:'location'` signals, then read them. Returns a
// {lat,lng,…} snapshot, or null when the host catalog ships no
// location signals yet (older v2 host) — caller falls back. Keeping
// this call in place means v5.1 hosts light it up with no redeploy.
const _LAT = ['lat', 'latitude', 'location_lat', 'gps_lat', 'pos_lat'];
const _LNG = ['lng', 'lon', 'long', 'longitude', 'location_lng', 'gps_lng', 'pos_lon'];
function _pick(values, keys) {
  for (const k of Object.keys(values || {})) {
    if (keys.includes(k.toLowerCase()) && values[k] != null) return Number(values[k]);
  }
  return null;
}

export async function carLocation() {
  let entries = [];
  try {
    const cat = await call('car.list', { category: 'location' });
    entries = (cat && (cat.entries || cat.signals)) || [];
  } catch (_) {
    return null; // no catalog handler → caller falls back
  }
  if (!entries.length) return null; // location category not shipped yet
  const names = entries.map((e) => (typeof e === 'string' ? e : e.name)).filter(Boolean);
  let values = {};
  try {
    const r = await call('car.read', { names });
    values = (r && r.values) || {};
  } catch (_) {
    return null;
  }
  const lat = _pick(values, _LAT);
  const lng = _pick(values, _LNG);
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return {
    lat,
    lng,
    heading: _pick(values, ['heading', 'course', 'bearing']),
    speedMps: _pick(values, ['speed', 'speed_mps', 'gps_speed']),
    accuracyM: _pick(values, ['accuracy', 'accuracy_m', 'hacc']),
    at: new Date().toISOString(),
  };
}

/** Connection FSM: connected | degraded | disconnected | unknown. */
export async function carConnectionSubscribe(cb) {
  const off = on('car.connection', (p) => cb((p && p.state) || p));
  try {
    await call('car.connection.subscribe');
  } catch (err) {
    console.warn('[l5compat] car.connection.subscribe failed:', err);
  }
  return off;
}

// ── Host / vehicle detection ───────────────────────────────────────
//
// Memoised once per page. Everything is best-effort and wrapped:
// absence is reported, never thrown. The decisive field for L5 is
// `isL5` — used to gate cluster-pixel features that the DiLink-5.0
// daemon physically can't paint.

let _detect = null;

export function detectHost() {
  if (_detect) return _detect;
  _detect = (async () => {
    const out = {
      inHost: inHost(),
      bridgeVersion: null,
      vehicle: null,
      variantId: null,
      dilinkFamily: null,
      isL5: false,
    };
    if (!host) return out;

    // car.list echoes the bridge protocol version on every response.
    try {
      const r = await call('car.list', {});
      out.bridgeVersion =
        (r && (r.bridgeVersion || r.protocolVersion)) || out.bridgeVersion;
    } catch (_) {
      /* non-fatal */
    }

    // display.list carries the active vehicle block (host 1.6+).
    try {
      const r = await callNative('display.list');
      const v = (r && r.vehicle) || null;
      if (v) {
        out.vehicle = v;
        out.variantId = v.variantId || null;
        out.dilinkFamily = v.dilinkFamily || null;
      }
    } catch (_) {
      /* no vehicle block on this host */
    }

    out.isL5 =
      out.variantId === 'l5' || /di\s*5\.0/i.test(out.dilinkFamily || '');
    return out;
  })();
  return _detect;
}

// ── Centralised graceful-degradation notice ────────────────────────
//
// Self-injecting overlay (own DOM + styles, no per-app markup). One
// look and one set of strings for every "can't do that here" case:
// not inside a host, or the car's hardware (e.g. an L5 daemon-locked
// cluster) physically can't do it.

let _noticeEl = null;

export function mountNotice({ title, body, kind = 'info', dismissible = false }) {
  dismissNotice();
  const wrap = document.createElement('div');
  wrap.setAttribute('data-l5compat-notice', '');
  const accent =
    kind === 'error' ? '#f0b9b9' : kind === 'warn' ? '#f4d58d' : '#b9d8f0';
  wrap.style.cssText = [
    'position:fixed',
    'inset:0',
    'z-index:2147483646',
    'display:flex',
    'flex-direction:column',
    'align-items:center',
    'justify-content:center',
    'gap:14px',
    'padding:32px',
    'text-align:center',
    'background:rgba(6,8,13,0.94)',
    "font-family:system-ui,-apple-system,'Segoe UI',sans-serif",
    'color:#cfd6e4',
  ].join(';');
  const h = document.createElement('div');
  h.textContent = title;
  h.style.cssText = `font-size:20px;font-weight:600;color:${accent}`;
  const p = document.createElement('div');
  p.textContent = body;
  p.style.cssText = 'font-size:14px;line-height:1.6;max-width:560px;color:#95a3b9';
  wrap.appendChild(h);
  wrap.appendChild(p);
  if (dismissible) {
    const b = document.createElement('button');
    b.textContent = 'Continue anyway';
    b.style.cssText =
      'margin-top:6px;background:#1d2438;color:#e6e9ef;border:1px solid #2c3a5c;' +
      'border-radius:8px;padding:9px 18px;font:inherit;font-size:13px;cursor:pointer';
    b.addEventListener('click', dismissNotice);
    wrap.appendChild(b);
  }
  (document.body || document.documentElement).appendChild(wrap);
  _noticeEl = wrap;
  return dismissNotice;
}

export function dismissNotice() {
  if (_noticeEl && _noticeEl.parentNode) _noticeEl.parentNode.removeChild(_noticeEl);
  _noticeEl = null;
}

/**
 * Guard the not-inside-host case once, consistently. Returns true if
 * a host is present (caller proceeds); false after showing the
 * standard notice (caller should bail).
 */
export function requireHost(opts = {}) {
  if (inHost()) return true;
  mountNotice({
    title: opts.title || 'Not inside the i99dash host',
    body:
      opts.body ||
      'This mini-app talks to the car through the i99dash host bridge. ' +
        'Open it from the car or via `i99dash dev`.',
    kind: 'warn',
  });
  return false;
}

/**
 * Gate a cluster-pixel feature. On a DiLink-5.0 / Leopard 5 the
 * instrument cluster is daemon-locked — `surface.*` writes there
 * can't paint — so show one consistent notice instead of a silent
 * blank cluster. Returns true when cluster rendering is viable.
 */
export async function requireClusterPixels(feature = 'This view') {
  const d = await detectHost();
  if (!d.isL5) return true;
  mountNotice({
    title: `${feature} can't render on this car's cluster`,
    body:
      `Detected ${d.variantId || 'DiLink 5.0'} — its instrument cluster is ` +
      'daemon-locked, so a mini-app cannot paint pixels there. This is a ' +
      'hardware limit of the trim, not a fault in the app. The head-unit ' +
      'parts of this app still work normally.',
    kind: 'warn',
    dismissible: true,
  });
  return false;
}
