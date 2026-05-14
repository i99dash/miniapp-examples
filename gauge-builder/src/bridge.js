/**
 * Tiny `flutter_inappwebview` wrapper shared by the IVI editor and
 * the cluster page. Keeps the gauge-cluster envelope (`callHandler`
 * returns the payload directly; `__i99dashEvents` is the push channel).
 *
 * Production miniapps SHOULD use the `i99dash` SDK package — this
 * reaches for the raw bridge to keep the bundle a single static
 * folder with no build step.
 */

export const host =
  globalThis.flutter_inappwebview ?? globalThis.__i99dashHost ?? null;

export function inHost() {
  return host != null;
}

/**
 * Call a host handler with a single payload argument.
 *
 * Used for the `car.*` family (the v2 car bridge), which accepts a
 * flat payload and returns the result directly — matching how
 * `gauge-cluster` consumes the same handlers.
 */
export async function call(handler, payload = {}) {
  if (!host) throw new Error('not_inside_host');
  return host.callHandler(handler, payload);
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
  if (!host) throw new Error('not_inside_host');
  const raw = await host.callHandler(handler, {
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
  globalThis.__i99dashEvents ??
  (globalThis.__i99dashEvents = {
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
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
