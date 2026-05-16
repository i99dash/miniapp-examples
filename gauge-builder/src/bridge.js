/**
 * Tiny `flutter_inappwebview` wrapper shared by the IVI editor and
 * the cluster page. Keeps the gauge-cluster envelope (`callHandler`
 * returns the payload directly; `__i99dashEvents` is the push channel).
 *
 * Production miniapps SHOULD use the `i99dash` SDK package — this
 * reaches for the raw bridge to keep the bundle a single static
 * folder with no build step.
 */

// Safe global (some BYD ROM WebViews predate ES2020 `globalThis`;
// esbuild es2019 down-levels syntax but not this identifier).
const G =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
      ? window
      : typeof self !== 'undefined'
        ? self
        : {};

// Prefer the branded `__i99dashHost`, fall back to the plugin's
// transport global, accept only a candidate that exposes
// `callHandler`.
function resolveHost() {
  const branded = G.__i99dashHost;
  if (branded && typeof branded.callHandler === 'function') return branded;
  const legacy = G.flutter_inappwebview;
  if (legacy && typeof legacy.callHandler === 'function') return legacy;
  return null;
}

// Eager best-effort snapshot — kept for back-compat. PREFER
// `whenHostReady()` / live `inHost()`: `flutter_inappwebview`'s
// `callHandler` is NOT guaranteed wired at initial sync script
// execution (the plugin signals readiness via the
// `flutterInAppWebViewPlatformReady` window event). Resolving once
// eagerly loses that race on slower WebViews (DiLink 5.0) → every
// value "—"; a faster WebView (L8) wins it. `call`/`callNative`
// below await readiness so all callers are race-safe with no
// entrypoint changes.
export const host = resolveHost();

/** Live presence check — re-resolves (host may arrive after load). */
export function inHost() {
  return resolveHost() != null;
}

/**
 * Resolve the host bridge, waiting if it isn't ready yet. Resolves
 * immediately when already present (fast path, no overhead);
 * otherwise on the `flutterInAppWebViewPlatformReady` event AND a
 * 150 ms poll, capped by [timeoutMs] (then `null` = genuinely not
 * in a host).
 */
export function whenHostReady(timeoutMs = 8000) {
  return new Promise((resolve) => {
    const now = resolveHost();
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
      const h = resolveHost();
      if (h) finish(h);
    };
    const onReady = () => tryNow();
    if (w) w.addEventListener('flutterInAppWebViewPlatformReady', onReady);
    const poll = setInterval(tryNow, 150);
    const timer = setTimeout(() => finish(resolveHost()), timeoutMs);
  });
}

/**
 * Call a host handler with a single payload argument.
 *
 * Used for the `car.*` family (the v2 car bridge), which accepts a
 * flat payload and returns the result directly — matching how
 * `gauge-cluster` consumes the same handlers.
 */
export async function call(handler, payload = {}) {
  const h = await whenHostReady(); // race-safe; instant if already ready
  if (!h) throw new Error('not_inside_host');
  return h.callHandler(handler, payload);
}

/**
 * Call a native-capability handler — `display.*`, `surface.*`,
 * `cursor.*`, `gesture.*`, `pkg.*`. Those families expect the request
 * wrapped in `{ params, idempotencyKey }` and return the response
 * wrapped in `{ success, data?, error? }` — verified against the
 * cluster-hello-world / cluster-remote / pkg-launcher reference apps.
 *
 * The host runs every native-capability call through `BridgeRouter`,
 * which is what attaches the envelope. Skipping it makes the handler
 * silently return an unstructured result (or no result at all) — which
 * is why the first cut of gauge-builder showed `trim: unknown` and an
 * empty cluster preview even on a Leopard 8 with all displays present.
 */
export async function callNative(handler, params = {}) {
  const h = await whenHostReady(); // race-safe; instant if already ready
  if (!h) throw new Error('not_inside_host');
  const raw = await h.callHandler(handler, {
    params,
    idempotencyKey: cryptoUuid(),
  });
  if (raw && raw.success === false) {
    const err = raw.error ?? {};
    throw new Error(`${err.code ?? 'host_error'}: ${err.message ?? 'unknown'}`);
  }
  return (raw && raw.data) ?? raw;
}

// Host events fan-out. Created once and reused — the host dispatches
// pushes via `globalThis.__i99dashEvents.dispatch(channel, payload)`.
const events =
  G.__i99dashEvents ??
  (G.__i99dashEvents = {
    _handlers: Object.create(null),
    on(channel, fn) {
      (this._handlers[channel] ??= new Set()).add(fn);
      return () => this._handlers[channel].delete(fn);
    },
    dispatch(channel, payload) {
      const set = this._handlers[channel];
      if (!set) return;
      let parsed = payload;
      if (typeof payload === 'string') {
        try {
          parsed = JSON.parse(payload);
        } catch {
          /* leave as string */
        }
      }
      for (const fn of set) {
        try {
          fn(parsed);
        } catch (err) {
          console.error('__i99dashEvents listener error:', err);
        }
      }
    },
  });

export function on(channel, fn) {
  return events.on(channel, fn);
}

export function cryptoUuid() {
  if (G.crypto && typeof G.crypto.randomUUID === 'function') {
    return G.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
