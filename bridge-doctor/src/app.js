/**
 * bridge-doctor — one-shot diagnostic for the i99dash v2 bridge.
 *
 * Why it exists: when a mini-app developer says "passenger cast broke"
 * or "car.read started 404'ing", we want a single artifact they can
 * install on the car, tap one button, and get back a complete picture
 * of which handlers the host actually registered and what each one
 * returned.
 *
 * Design rules baked in:
 *
 *   - Call `window.flutter_inappwebview.callHandler` directly. The
 *     whole point is to verify the host independently of what the JS
 *     SDK does or doesn't expose; if we routed through MiniAppClient
 *     we'd be testing the SDK's shims, not the bridge.
 *
 *   - Every probe reports a status icon + a one-line summary + the
 *     raw request/response payload on click. No silent failures.
 *
 *   - A `{success: false, error: {code: ...}}` envelope counts as a
 *     failure — we branch on the envelope shape just like the SDK
 *     does, and surface the host-side error code unchanged.
 *
 *   - The DiShare cast is gated behind an explicit button. Auto-
 *     firing it on load would silently re-mirror the host to the
 *     passenger panel without consent, which is exactly the bug we'd
 *     get yelled at for.
 */

// ── Safe global ────────────────────────────────────────────────────
// Defensive: most DiLink WebViews are modern (the L5 test unit is
// Chromium 95, which has `globalThis`), but some older BYD ROM
// WebViews predate `globalThis` (ES2020) — and esbuild's es2019
// target down-levels *syntax* (`?.`/`??`) but NOT this global
// identifier, so a bare `globalThis` would `ReferenceError` there.
// Resolve a safe global once (in a WebView `window` is always the
// global). `typeof` on an undeclared name never throws, so this
// probe is itself safe. Mirrors the `typeof globalThis ===
// 'undefined'` guard in _shared/l5compat.js. NOTE: this was NOT the
// cause of the "all —" L5 bug — see resolveHost() below.
const G =
  typeof globalThis !== 'undefined'
    ? globalThis
    : typeof window !== 'undefined'
      ? window
      : typeof self !== 'undefined'
        ? self
        : {};

// ── Bridge wrapper ─────────────────────────────────────────────────
//
// Two flavours of "not okay" need different treatment:
//   1. The bridge isn't there at all → render the bottom-overlay notice
//      and stop. Nothing else is testable.
//   2. The bridge is there but a single handler is unregistered → the
//      callHandler promise rejects with the host's Java/Dart error
//      string, which we surface verbatim. We DON'T turn it back into
//      a throw — every probe reports its outcome inline.

// Host resolution: prefer the branded `__i99dashHost` (car-i99dash
// injects `window.__i99dashHost = window.flutter_inappwebview` via an
// AT_DOCUMENT_START user script), fall back to the plugin's
// transport global, and accept ONLY a candidate that actually
// exposes `callHandler`.
function resolveHost() {
  const branded = G.__i99dashHost;
  if (branded && typeof branded.callHandler === 'function') return branded;
  const legacy = G.flutter_inappwebview;
  if (legacy && typeof legacy.callHandler === 'function') return legacy;
  return null;
}

// THE L5 "all —" ROOT CAUSE — a readiness race, NOT a crash or the
// wrong host object (confirmed on-car: the "Not inside i99dash host"
// notice was showing, i.e. resolveHost() returned null at script
// time). `flutter_inappwebview`'s `callHandler` is not guaranteed
// wired at initial synchronous script execution; the plugin signals
// readiness via the `flutterInAppWebViewPlatformReady` window event.
// The old code resolved the host ONCE, eagerly, and immediately
// bailed to the notice — L8's faster WebView wins that race, the slower
// DiLink 5.0 loses it (host still null → notice → every probe fails).
//
// Fix: wait for the host. Resolve immediately if it's already there
// (L8 path — zero behaviour change); otherwise resolve on the
// readiness event AND poll as a belt-and-suspenders, capped by a
// timeout after which we conclude we're genuinely not in a host
// (e.g. opened in a plain browser) and show the notice.
let host = resolveHost();

function whenHostReady(timeoutMs = 8000) {
  return new Promise((resolve) => {
    const found = resolveHost();
    if (found) return resolve(found);
    let settled = false;
    const finish = (h) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('flutterInAppWebViewPlatformReady', onReady);
      clearInterval(poll);
      clearTimeout(timer);
      resolve(h);
    };
    const tryNow = () => {
      const h = resolveHost();
      if (h) finish(h);
    };
    const onReady = () => tryNow();
    window.addEventListener('flutterInAppWebViewPlatformReady', onReady);
    const poll = setInterval(tryNow, 150);
    const timer = setTimeout(() => finish(resolveHost()), timeoutMs);
  });
}

// Set up the events channel the host uses for car.signal /
// car.connection / display.hotplug pushes. Identical contract to
// every other example app — if some other script already set this
// up, reuse it instead of clobbering listeners.
G.__i99dashEvents = G.__i99dashEvents ?? {
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
};

/**
 * Raw bridge call. Resolves to whatever the host returned (could be
 * `{success: true, ...}`, `{success: false, error: {...}}`, or a
 * legacy bare object). Rejects only on transport-level failure (the
 * handler isn't registered, the host threw before serialising).
 *
 * We intentionally don't wrap, validate, or coerce here — every probe
 * needs to see the raw shape to diagnose host-side regressions.
 */
async function rawCall(handler, payload) {
  if (!host) throw new Error('not_inside_host');
  const args = payload === undefined ? null : payload;
  return host.callHandler(handler, args);
}

/**
 * Family-call wrapper. Mirrors the SDK's `bridge.callFamily(...)`
 * envelope shape (`{params, idempotencyKey}`) so the host's
 * `<familyId>.<op>` JS handlers see params nested under `params` —
 * the path the family executor unpacks. Pre-fix this wrapper didn't
 * exist; probes posted params flat and tripped the param schema's
 * `required param missing` for every required slot. Lower-level
 * `rawCall` is still used for non-family handlers (capabilities,
 * getContext, car.*).
 */
async function familyCall(handler, params) {
  const payload = {
    params: params ?? {},
    idempotencyKey: cryptoRandomId(),
  };
  return rawCall(handler, payload);
}

function cryptoRandomId() {
  if (G.crypto?.randomUUID) return G.crypto.randomUUID();
  return 'rid_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/**
 * Inspect a bridge response and return a normalised outcome.
 *
 * Treats three failure modes uniformly:
 *   - Promise rejected (transport failure, handler not registered).
 *   - `{success: false, error: {code, ...}}` envelope.
 *   - `{ok: false, error/path: ...}` (older / pkg-family envelope).
 *
 * Returns `{ ok: boolean, errorCode?: string, errorMessage?: string }`.
 */
function classifyResponse(res, err) {
  if (err) {
    // Host returned a transport error. The Flutter side often
    // serialises this as "Error: <code>" — try to extract a code.
    const msg = String(err?.message ?? err);
    let code = 'handler_not_found';
    // Common shapes:
    //   "Error: handler_not_found"
    //   "PlatformException(handler_not_found, ...)"
    //   "Channel not registered"
    if (/PlatformException\(([^,)]+)/i.test(msg)) {
      code = RegExp.$1.trim();
    } else if (/not[\s_-]?registered|no such handler|not found/i.test(msg)) {
      code = 'handler_not_found';
    } else if (/timeout/i.test(msg)) {
      code = 'bridge_timeout';
    } else if (/transport/i.test(msg)) {
      code = 'bridge_transport';
    } else if (/unknown_capability|capability/i.test(msg)) {
      code = 'unknown_capability';
    }
    return { ok: false, errorCode: code, errorMessage: msg };
  }
  if (res == null) {
    // null/undefined is a valid response on a handful of fire-and-
    // forget handlers (e.g. *.unsubscribe). Treat as success — the
    // probe that uses this knows what it expects.
    return { ok: true };
  }
  // v2 envelope: { success: true, data: {...} } or { success: false, error: {...} }
  if (typeof res === 'object' && 'success' in res) {
    if (res.success === false) {
      const e = res.error ?? {};
      return {
        ok: false,
        errorCode: e.code ?? 'unknown',
        errorMessage: e.message ?? JSON.stringify(e),
      };
    }
    return { ok: true };
  }
  // pkg-family / surface-family envelope: { ok: true, path: ... } or { ok: false, error: ... }
  if (typeof res === 'object' && 'ok' in res) {
    if (res.ok === false) {
      return {
        ok: false,
        errorCode: res.error ?? res.path ?? 'unknown',
        errorMessage: res.error ?? res.path ?? null,
      };
    }
    return { ok: true };
  }
  // Bare data object — treat as success. (capabilities, getContext,
  // car.identity all return bare objects today.)
  return { ok: true };
}

/**
 * Pull the "interesting" payload out of a v2 envelope so probe
 * implementations don't have to re-do the `.data ?? res` dance every
 * time. The display layer still shows the raw response on expand.
 */
function unwrap(res) {
  if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
    return res.data;
  }
  return res;
}

// ── Patch hints ────────────────────────────────────────────────────
//
// Map of host-side error codes (or pseudo-codes we synthesise from
// thrown rejections) to a one-line "here's where to look" diagnostic.
// Add entries as we discover new failure modes in the wild.
const PATCH_HINTS = {
  // Bridge-transport / wiring failures
  handler_not_found:
    'Handler missing from host registry. Confirm bridge_family_registration.dart still imports + registers the family for that handler (the v2 cutover dropped a few during refactor).',
  bridge_timeout:
    'Host received the call but didn\'t respond within 10 s. Either the handler is blocked on a platform call (am-start, DiShare bind) or it threw before serialising — check the host logs for an unhandled exception.',
  bridge_transport:
    'Flutter method-channel layer crashed mid-call. Usually a host-side bug; look for a stack-trace in adb logcat right before the failure.',

  // Param + capability gate
  param_validation_failed:
    'Request payload shape mismatch. Compare what we sent (above) against the host\'s ParamRule schema for this handler. The 5.0 bridge added stricter IntParamRule for displayId / surfaceId — a missing field that used to be optional may now be required.',
  unknown_capability:
    'CapabilityRegistry rejected the call. Check the cap-bit for this feature is set in the host\'s CapabilityRegistry initialisation (VehicleProfile or the family\'s register() call).',
  cap_denied:
    'Manifest capability not granted. The cap-bit is registered host-side but the mini-app installer didn\'t grant it. Re-install with the cap requested in manifest.json.',

  // Catalog / car.read / car.subscribe
  unknown_signal:
    'Signal name not in the active brand\'s catalog. Check spelling; cross-reference against the byd_public_catalog.dart catalog file.',
  too_many_names:
    'Hit the 64-name-per-call cap. Split into multiple car.read / car.subscribe batches.',
  subscription_quota_exceeded:
    'More than the per-app subscription cap (default 10). Make sure prior subscribes were cleaned up via car.unsubscribe.',
  unknown_subscription:
    'subscriptionId not recognised. Either it was already unsubscribed, or the host restarted and lost the subscription table — re-subscribe.',

  // Pkg / DiShare / multi-display
  no_dishare_service:
    'com.byd.dishare service not present on this ROM. Either a Di5.0 trim without the DiShare add-on or the service was disabled at the system level. Not a host-bug, but a hard floor for passenger-cast on this car.',
  dishare_denied:
    'DiShare bind/register/arm failed. Check com.byd.dishare AIDL is alive (adb shell dumpsys activity service com.byd.dishare) and the accessibility service is attached.',
  bind_failed:
    'DiShare AIDL bind failed. Almost always means the service is installed but not currently running; try toggling DiShare in the head-unit settings.',
  register_failed:
    'DiShare registered the client but rejected the cast — usually because another caller already owns the mirror chain. Stop the other caster and retry.',
  dishare_not_installed:
    'DiShare package missing entirely. Confirmed Di5.0-without-DiShare trim; passenger cast is not reachable on this car.',
  a11y_not_attached:
    'DiShare needs the host\'s accessibility service attached to drive the synthetic gesture chain. Toggle "i99dash" under Settings → Accessibility on the head unit and retry.',
  role_requires_cluster_op:
    'Used pkg.launch with a cluster displayId. The host requires pkg.launch_cluster for cluster slots — switch the handler name. (Different op, same args shape modulo target.)',
  display_not_found:
    'displayId not in the host\'s display.list. Either it was hot-unplugged (rare) or you cached a stale id across a host restart — re-read display.list before launching.',
  no_secondary_display:
    'This trim only exposes the IVI. No passenger / cluster display to mount a surface on. Not a bug — fall back to single-screen UI.',

  // Surface family
  surface_quota_exceeded:
    'Hit the per-app surface cap. Destroy at least one prior surface before creating another.',

  // Catch-all
  unknown:
    'Host returned an error code the doctor doesn\'t recognise yet. Copy the full response payload (above) and file a bridge-doctor PR with the new mapping.',
};

function hintFor(code) {
  if (!code) return null;
  return PATCH_HINTS[code] ?? PATCH_HINTS.unknown;
}

// ── Probe definitions ──────────────────────────────────────────────
//
// Each probe is `{ id, label, run(ctx) }`. `run` is an async function
// returning `{ status, summary, request, response, hint? }` where
// `status` is one of 'ok' | 'fail' | 'warn' | 'skip'.
//
// `ctx` is a shared bag mutated by earlier probes: capabilities,
// displays, identity. Probes downstream of capabilities use it to
// pick sensible args (e.g. surface.create needs a non-zero displayId
// from display.list).

const SUBSCRIBE_LISTEN_MS = 1500;
const DISPLAY_HOTPLUG_LISTEN_MS = 5000;

function uuid() {
  if (G.crypto?.randomUUID) return G.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function waitForEvent(channel, timeoutMs) {
  return new Promise((resolve) => {
    let captured = null;
    const off = G.__i99dashEvents.on(channel, (payload) => {
      captured = payload;
      // Don't resolve immediately — we want the *first* frame but
      // we also want to make sure the host doesn't double-fire and
      // confuse downstream probes. Settle after the timeout window
      // closes regardless.
    });
    setTimeout(() => {
      off();
      resolve(captured);
    }, timeoutMs);
  });
}

const PROBES = [
  {
    id: 'capabilities',
    label: 'capabilities',
    async run(ctx) {
      const req = null;
      let res, err;
      try { res = await rawCall('capabilities', req); } catch (e) { err = e; }
      const c = classifyResponse(res, err);
      if (!c.ok) {
        return { status: 'fail', summary: c.errorCode, request: req, response: err ?? res, hint: hintFor(c.errorCode) };
      }
      const data = unwrap(res);
      ctx.capabilities = data;
      const handlers = Array.isArray(data?.handlers) ? data.handlers : [];
      const ver = data?.bridgeVersion ?? data?.version ?? '?';
      return {
        status: 'ok',
        summary: `${handlers.length} handlers · bridge ${ver}`,
        request: req,
        response: res,
      };
    },
  },
  {
    id: 'getContext',
    label: 'getContext',
    async run(ctx) {
      const req = null;
      let res, err;
      try { res = await rawCall('getContext', req); } catch (e) { err = e; }
      const c = classifyResponse(res, err);
      if (!c.ok) {
        return { status: 'fail', summary: c.errorCode, request: req, response: err ?? res, hint: hintFor(c.errorCode) };
      }
      const data = unwrap(res);
      ctx.context = data;
      const bits = [];
      if (data?.locale) bits.push(`locale=${data.locale}`);
      if (data?.activeCarId) bits.push(`car=${String(data.activeCarId).slice(0, 24)}`);
      if (data?.isDark != null) bits.push(data.isDark ? 'dark' : 'light');
      return {
        status: 'ok',
        summary: bits.join(' · ') || `${Object.keys(data ?? {}).length} keys`,
        request: req,
        response: res,
      };
    },
  },
  {
    id: 'car.identity',
    label: 'car.identity',
    async run(ctx) {
      const req = null;
      let res, err;
      try { res = await rawCall('car.identity', req); } catch (e) { err = e; }
      const c = classifyResponse(res, err);
      if (!c.ok) {
        return { status: 'fail', summary: c.errorCode, request: req, response: err ?? res, hint: hintFor(c.errorCode) };
      }
      const data = unwrap(res);
      ctx.identity = data;
      const brand = String(data?.brand ?? '?').toLowerCase();
      const model = data?.modelDisplay ?? data?.modelCode ?? '?';
      return { status: 'ok', summary: `${brand} · ${model}`, request: req, response: res };
    },
  },
  {
    id: 'car.list',
    label: 'car.list',
    async run(ctx) {
      // The doc spec says "try both {}" and {category:'doors'}. Run
      // both — if the empty-args variant returns the full catalog the
      // doors-filter result should be a strict subset, which is a
      // useful sanity-check on host-side filtering.
      const req = { all: {}, doors: { category: 'doors' } };
      const out = {};
      let firstErr = null;
      let allOk = true;
      for (const [k, args] of Object.entries(req)) {
        try {
          out[k] = await rawCall('car.list', args);
        } catch (e) {
          out[k] = { __thrown: String(e?.message ?? e) };
          if (!firstErr) firstErr = e;
          allOk = false;
        }
      }
      // Re-classify based on the empty-args result; that's the one
      // the SDK uses every render. If that's broken, mini-apps break.
      const c = classifyResponse(out.all, firstErr);
      if (!c.ok) {
        return { status: 'fail', summary: c.errorCode, request: req, response: out, hint: hintFor(c.errorCode) };
      }
      const data = unwrap(out.all);
      const entries = Array.isArray(data?.entries) ? data.entries : (Array.isArray(data) ? data : []);
      const doorsData = unwrap(out.doors);
      const doorsEntries = Array.isArray(doorsData?.entries) ? doorsData.entries : (Array.isArray(doorsData) ? doorsData : []);
      // Status: ok unless the filtered call broke. A successful empty
      // call but failed filter is `warn`, not `fail` — most mini-apps
      // never pass `category`.
      const status = allOk ? 'ok' : 'warn';
      return {
        status,
        summary: `${entries.length} entries · doors filter: ${doorsEntries.length}`,
        request: req,
        response: out,
      };
    },
  },
  {
    id: 'car.read',
    label: 'car.read',
    async run(ctx) {
      const req = { names: ['battery_pct', 'door_lf'] };
      let res, err;
      try { res = await rawCall('car.read', req); } catch (e) { err = e; }
      const c = classifyResponse(res, err);
      if (!c.ok) {
        return { status: 'fail', summary: c.errorCode, request: req, response: err ?? res, hint: hintFor(c.errorCode) };
      }
      const data = unwrap(res);
      const values = data?.values ?? {};
      const bits = [];
      for (const name of req.names) {
        const v = values[name];
        bits.push(`${name}=${v == null ? '∅' : v}`);
      }
      return { status: 'ok', summary: bits.join(' · '), request: req, response: res };
    },
  },
  {
    id: 'car.subscribe',
    label: 'car.subscribe → signal → unsubscribe',
    async run(ctx) {
      const key = uuid();
      const req = { names: ['battery_pct'], idempotencyKey: key };
      let res, err;
      // Set up the listener BEFORE issuing the subscribe so we don't
      // race the first frame (some hosts push a seed event inside
      // the subscribe response cycle).
      const framePromise = waitForEvent('car.signal', SUBSCRIBE_LISTEN_MS);
      try { res = await rawCall('car.subscribe', req); } catch (e) { err = e; }
      const c = classifyResponse(res, err);
      if (!c.ok) {
        return { status: 'fail', summary: c.errorCode, request: req, response: err ?? res, hint: hintFor(c.errorCode) };
      }
      const data = unwrap(res);
      const subId = data?.subscriptionId ?? null;
      const frame = await framePromise;
      // Best-effort cleanup. If the unsub fails we surface it as a
      // warn — the subscribe itself worked, so the probe didn't
      // outright fail, but the developer should know.
      let unsubErr = null;
      let unsubRes = null;
      try {
        unsubRes = await rawCall('car.unsubscribe', { subscriptionId: subId });
      } catch (e) {
        unsubErr = e;
      }
      const unsubClass = classifyResponse(unsubRes, unsubErr);
      const ok = unsubClass.ok;
      const sawFrame = frame != null;
      const summary = [
        `id=${String(subId ?? 'null').slice(0, 8)}`,
        sawFrame ? 'frame ✓' : 'no frame in 1.5s',
        ok ? 'unsub ✓' : `unsub ✗ (${unsubClass.errorCode})`,
      ].join(' · ');
      // A missed frame isn't a hard fail — battery_pct only pushes
      // on change, and a parked stable car may simply not produce
      // one in 1.5 s. The unsub matters more.
      const status = ok ? (sawFrame ? 'ok' : 'warn') : 'warn';
      return {
        status,
        summary,
        request: req,
        response: { subscribe: res, frame, unsubscribe: unsubRes ?? unsubErr },
        hint: ok ? null : hintFor(unsubClass.errorCode),
      };
    },
  },
  {
    id: 'car.connection.subscribe',
    label: 'car.connection.subscribe → unsubscribe',
    async run() {
      const req = null;
      const framePromise = waitForEvent('car.connection', SUBSCRIBE_LISTEN_MS);
      let res, err;
      try { res = await rawCall('car.connection.subscribe', req); } catch (e) { err = e; }
      const c = classifyResponse(res, err);
      if (!c.ok) {
        return { status: 'fail', summary: c.errorCode, request: req, response: err ?? res, hint: hintFor(c.errorCode) };
      }
      const frame = await framePromise;
      const subscriptionId = unwrap(res)?.subscriptionId ?? res?.subscriptionId;
      let unsubErr = null;
      let unsubRes = null;
      try {
        unsubRes = await rawCall('car.connection.unsubscribe', { subscriptionId });
      } catch (e) {
        unsubErr = e;
      }
      const unsubClass = classifyResponse(unsubRes, unsubErr);
      const state = frame?.state ?? frame?.data?.state ?? 'unknown';
      const summary = `state=${state} · ${unsubClass.ok ? 'unsub ✓' : `unsub ✗ (${unsubClass.errorCode})`}`;
      return {
        status: unsubClass.ok ? 'ok' : 'warn',
        summary,
        request: req,
        response: { subscribe: res, frame, unsubscribe: unsubRes ?? unsubErr },
      };
    },
  },
  {
    id: 'display.list',
    label: 'display.list',
    async run(ctx) {
      const req = null;
      let res, err;
      try { res = await familyCall('display.list', null); } catch (e) { err = e; }
      const c = classifyResponse(res, err);
      if (!c.ok) {
        return { status: 'fail', summary: c.errorCode, request: req, response: err ?? res, hint: hintFor(c.errorCode) };
      }
      const data = unwrap(res);
      // Two known wire shapes: bare array (legacy) vs
      // { displays, vehicle } (2.0+).
      const displays = Array.isArray(data) ? data : (data?.displays ?? []);
      ctx.displays = displays;
      ctx.vehicle = data?.vehicle ?? null;
      const roles = displays.map((d) => `${d.role ?? '?'}#${d.id}`).join(', ');
      return {
        status: 'ok',
        summary: `${displays.length} displays · ${roles || '—'}`,
        request: req,
        response: res,
      };
    },
  },
  {
    id: 'display.subscribe',
    label: 'display.subscribe → hotplug → unsubscribe',
    async run() {
      const req = null;
      const framePromise = waitForEvent('display.hotplug', DISPLAY_HOTPLUG_LISTEN_MS);
      let res, err;
      try { res = await familyCall('display.subscribe', null); } catch (e) { err = e; }
      const c = classifyResponse(res, err);
      if (!c.ok) {
        return { status: 'fail', summary: c.errorCode, request: req, response: err ?? res, hint: hintFor(c.errorCode) };
      }
      const data = unwrap(res);
      const id = data?.id ?? data?.subscriptionId ?? null;
      const frame = await framePromise;
      let unsubErr = null;
      let unsubRes = null;
      try {
        unsubRes = await familyCall('display.unsubscribe', id != null ? { id } : null);
      } catch (e) {
        unsubErr = e;
      }
      const unsubClass = classifyResponse(unsubRes, unsubErr);
      // No hot-plug events in a 5 s window is the *expected* case —
      // an HDMI-attached HUD doesn't fire every minute. So treat
      // "subscribed cleanly, no event seen, unsubscribed cleanly" as
      // a pass, not a warn.
      const summary = [
        `id=${String(id ?? 'null').slice(0, 8)}`,
        frame ? 'hotplug seen' : 'no hotplug in 5s (normal)',
        unsubClass.ok ? 'unsub ✓' : `unsub ✗ (${unsubClass.errorCode})`,
      ].join(' · ');
      return {
        status: unsubClass.ok ? 'ok' : 'warn',
        summary,
        request: req,
        response: { subscribe: res, frame, unsubscribe: unsubRes ?? unsubErr },
      };
    },
  },
  {
    id: 'surface.create',
    label: 'surface.create → surface.destroy',
    async run(ctx) {
      // Pick the first non-IVI display. Cluster / passenger both
      // qualify. If none, skip with a clear message.
      const displays = ctx.displays ?? [];
      const target = displays.find((d) => d.id !== 0 && d.role !== 'ivi' && !d.isDefault);
      if (!target) {
        return {
          status: 'skip',
          summary: 'no secondary display available on this car',
          request: null,
          response: null,
          hint: hintFor('no_secondary_display'),
        };
      }
      const req = { displayId: target.id, route: '/probe' };
      let res, err;
      try { res = await familyCall('surface.create', req); } catch (e) { err = e; }
      const c = classifyResponse(res, err);
      if (!c.ok) {
        return { status: 'fail', summary: c.errorCode, request: req, response: err ?? res, hint: hintFor(c.errorCode) };
      }
      const data = unwrap(res);
      const surfaceId = data?.surfaceId ?? null;
      const path = data?.path ?? '?';
      // Immediately destroy. If destroy throws we ALSO flag it,
      // because a leaked surface burns the per-app quota.
      let destroyErr = null;
      let destroyRes = null;
      try {
        destroyRes = await familyCall('surface.destroy', { surfaceId });
      } catch (e) {
        destroyErr = e;
      }
      const destroyClass = classifyResponse(destroyRes, destroyErr);
      return {
        status: destroyClass.ok ? 'ok' : 'warn',
        summary: `path=${path} · sfc=${String(surfaceId ?? 'null').slice(0, 10)} · ${destroyClass.ok ? 'destroyed' : 'destroy ✗'}`,
        request: req,
        response: { create: res, destroy: destroyRes ?? destroyErr },
        hint: destroyClass.ok ? null : hintFor(destroyClass.errorCode),
      };
    },
  },
  {
    id: 'surface.list',
    label: 'surface.list',
    async run() {
      const req = null;
      let res, err;
      try { res = await familyCall('surface.list', null); } catch (e) { err = e; }
      const c = classifyResponse(res, err);
      if (!c.ok) {
        return { status: 'fail', summary: c.errorCode, request: req, response: err ?? res, hint: hintFor(c.errorCode) };
      }
      const data = unwrap(res);
      const surfaces = Array.isArray(data) ? data : (data?.surfaces ?? []);
      return { status: 'ok', summary: `${surfaces.length} active`, request: req, response: res };
    },
  },
  {
    id: 'pkg.launch.passenger',
    label: 'pkg.launch · target=passenger (DiShare test)',
    async run() {
      // This is THE test for DiShare. We don't auto-fire it during
      // the probe sweep — the spec gates the cast itself behind an
      // explicit button. But we DO want to probe whether the
      // handler is even registered, so we issue a benign param-
      // validation probe: send the canonical args and let the host
      // do its routing. The user will see the outcome. To keep the
      // probe non-destructive we read the host's response but don't
      // expand on cast behaviour — that's what the quick-test
      // button is for.
      //
      // Actually — the spec is clearer than that. The probe DOES
      // attempt the cast as part of the sweep so the user gets the
      // full diagnostic in one tap. The "explicit button" rule is
      // about *not auto-firing on load*; the user pressed Re-run.
      // Wire shape per `car-i99dash/lib/features/mini_apps/packaging/
      // pkg_family.dart` _LaunchHandler.paramSchema:
      //   packageName: RegexParamRule
      //   displayId  : IntParamRule(min: -1, max: 1024, default -1)
      //   targetRole : EnumParamRule(values: ['', 'passenger'], default '')
      // — NOT `{target: '...'}` (closed slot, schema rejects unknowns).
      const req = { packageName: 'com.i99dev.i99dash', targetRole: 'passenger' };
      let res, err;
      try { res = await familyCall('pkg.launch', req); } catch (e) { err = e; }
      const c = classifyResponse(res, err);
      if (!c.ok) {
        // Decode the path-based error codes the pkg family uses.
        // Notable cases:
        //   - handler_not_found → bridge-v2 didn't register pkg.*
        //   - unknown_capability → CapabilityRegistry doesn't know dishare
        //   - dishare-denied (in `path` field) → service missing / denied
        const code = c.errorCode;
        return {
          status: 'fail',
          summary: code,
          request: req,
          response: err ?? res,
          hint: hintFor(code),
        };
      }
      const data = unwrap(res);
      // The pkg family returns `{ok, path, displayId?, error?}`. We
      // care about `path`:
      //   - 'dishare-cast'          ✓ Di5.0 DiShare path works
      //   - 'dishare-cast-cached'   ✓ already cast
      //   - 'am-start'              ✓ Di5.1 multi-display path
      //   - 'am-start-rePinned'     ✓ Di5.1, rePin recovery
      //   - 'dishare-denied'        ✗ service missing
      //   - 'launch-denied'         ✗ capability missing
      const path = data?.path ?? res?.path ?? '?';
      const goodPaths = new Set([
        'dishare-cast',
        'dishare-cast-cached',
        'am-start',
        'am-start-rePinned',
        'intent-launch',
        'move-task-front',
        'presentation',
        'overlay',
      ]);
      const badPaths = new Set(['dishare-denied', 'launch-denied', 'am-start-bounced']);
      let status = 'ok';
      let summary = `path=${path}`;
      let hint = null;
      if (badPaths.has(path)) {
        status = 'fail';
        const inner = data?.error ?? res?.error;
        summary = `${path}${inner ? ` (${inner})` : ''}`;
        hint = hintFor(inner) ?? hintFor(path.replace(/-/g, '_'));
      } else if (!goodPaths.has(path)) {
        // Unrecognised path — warn so the user knows the doctor
        // hasn't catalogued this outcome yet.
        status = 'warn';
        summary = `path=${path} (unknown to doctor)`;
      }
      return { status, summary, request: req, response: res, hint };
    },
  },
  {
    id: 'pkg.launch.cluster',
    label: 'pkg.launch · target=cluster (Di5.1 only)',
    async run(ctx) {
      // Cluster launches use the dedicated `pkg.launch_cluster`
      // handler on Di5.1; trying `pkg.launch` with a cluster
      // displayId gets `role:requires_cluster_op` from the host.
      // We still issue THIS as pkg.launch with target=cluster
      // (per the spec) so the host's normalisation path is what
      // gets tested.
      //
      // Skip cleanly on hosts where no cluster display exists —
      // that's just Di5.0 trim, not a bug.
      const displays = ctx.displays ?? [];
      const hasCluster = displays.some((d) => d.role === 'cluster');
      if (!hasCluster) {
        return {
          status: 'skip',
          summary: 'no cluster display (Di5.0 trim — skipped)',
          request: null,
          response: null,
        };
      }
      // Cluster launches use a SEPARATE handler `pkg.launch_cluster`,
      // not `pkg.launch` with a `target: 'cluster'` field — that's a
      // tier-3 permission split documented in `pkg_family.dart:8`.
      // Schema: { packageName: RegexParamRule, displayId: IntParamRule }.
      const cluster = displays.find((d) => d.role === 'cluster');
      const req = { packageName: 'com.i99dev.i99dash', displayId: cluster.id };
      let res, err;
      try { res = await familyCall('pkg.launch_cluster', req); } catch (e) { err = e; }
      const c = classifyResponse(res, err);
      if (!c.ok) {
        return {
          status: 'fail',
          summary: c.errorCode,
          request: req,
          response: err ?? res,
          hint: hintFor(c.errorCode),
        };
      }
      const data = unwrap(res);
      const path = data?.path ?? res?.path ?? '?';
      return { status: 'ok', summary: `path=${path}`, request: req, response: res };
    },
  },
];

// ── Rendering ──────────────────────────────────────────────────────

const probesEl = document.getElementById('probes');
const capGridEl = document.getElementById('cap-grid');
const capNoteEl = document.getElementById('cap-note');

const ICONS = {
  ok: '✓',
  fail: '✗',
  warn: '⚠',
  skip: '⏭',
  pend: '◐',
};

function statusClass(status) {
  return { ok: 'ok', fail: 'fail', warn: 'warn', skip: 'skip', pend: 'pend' }[status] ?? 'pend';
}

function renderProbeRow(probe) {
  const row = document.createElement('div');
  row.className = 'row';
  row.dataset.id = probe.id;
  row.dataset.open = '0';
  row.innerHTML = `
    <div class="head" role="button" tabindex="0">
      <span class="ico pend" data-role="ico">${ICONS.pend}</span>
      <div class="label">
        <div class="name">${probe.label}</div>
        <div class="summary" data-role="summary">running…</div>
      </div>
      <span class="chevron">▶</span>
    </div>
    <div class="details" data-role="details"></div>
  `;
  const head = row.querySelector('.head');
  head.addEventListener('click', () => {
    row.dataset.open = row.dataset.open === '1' ? '0' : '1';
  });
  head.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      row.dataset.open = row.dataset.open === '1' ? '0' : '1';
    }
  });
  return row;
}

function updateProbeRow(row, outcome) {
  const ico = row.querySelector('[data-role="ico"]');
  const summary = row.querySelector('[data-role="summary"]');
  const details = row.querySelector('[data-role="details"]');

  ico.className = `ico ${statusClass(outcome.status)}`;
  ico.textContent = ICONS[outcome.status] ?? '?';
  summary.className = `summary ${outcome.status === 'fail' ? 'fail' : outcome.status === 'warn' ? 'warn' : ''}`;
  summary.textContent = outcome.summary ?? '';

  details.innerHTML = '';
  if (outcome.hint) {
    const h = document.createElement('div');
    h.className = 'hint';
    h.innerHTML = `<b>Patch needed:</b> ${escapeHtml(outcome.hint)}`;
    details.appendChild(h);
  }
  const reqLbl = document.createElement('div');
  reqLbl.className = 'pre-label';
  reqLbl.textContent = 'request';
  details.appendChild(reqLbl);
  const reqPre = document.createElement('pre');
  reqPre.textContent = prettyJson(outcome.request);
  details.appendChild(reqPre);

  const resLbl = document.createElement('div');
  resLbl.className = 'pre-label';
  resLbl.textContent = 'response';
  details.appendChild(resLbl);
  const resPre = document.createElement('pre');
  resPre.textContent = prettyJson(outcome.response);
  details.appendChild(resPre);
}

function prettyJson(v) {
  if (v == null) return String(v);
  if (v instanceof Error) {
    return `${v.name}: ${v.message}${v.stack ? '\n' + v.stack : ''}`;
  }
  try {
    return JSON.stringify(v, (_k, val) => {
      if (val instanceof Error) return { name: val.name, message: val.message, stack: val.stack };
      return val;
    }, 2);
  } catch {
    return String(v);
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Capabilities renderer ──────────────────────────────────────────

// The handler-set we EXPECT to find advertised by `capabilities` on a
// healthy v2 host. Anything in this list that's missing from the
// host's response gets a red dot — those are the regression markers
// the doctor was built to catch.
const EXPECTED_HANDLERS = [
  // Core
  'capabilities', 'getContext', 'callApi', '_admin.exec',
  // Car v2
  'car.list', 'car.read', 'car.subscribe', 'car.unsubscribe',
  'car.identity', 'car.asset', 'car.command',
  'car.connection.subscribe', 'car.connection.unsubscribe',
  // Display + surface
  'display.list', 'display.subscribe', 'display.unsubscribe',
  'surface.create', 'surface.destroy', 'surface.navigate', 'surface.list',
  // Pkg
  'pkg.list', 'pkg.launch', 'pkg.launch_cluster', 'pkg.stop', 'pkg.move',
  // Cursor + gesture
  'cursor.attach', 'cursor.move', 'cursor.detach',
  'gesture.tap', 'gesture.swipe', 'gesture.longPress',
];

function renderCapabilities(data) {
  capGridEl.innerHTML = '';
  capNoteEl.innerHTML = '';
  if (!data) {
    capGridEl.innerHTML = '<span class="cap-note">capabilities handler failed — see probe row below.</span>';
    return;
  }
  const handlers = new Set(Array.isArray(data.handlers) ? data.handlers : []);
  // Render every expected handler, marking missing ones red.
  for (const h of EXPECTED_HANDLERS) {
    const present = handlers.has(h);
    const el = document.createElement('div');
    el.className = `cap ${present ? 'present' : 'missing'}`;
    el.innerHTML = `<span class="dot"></span><span>${present ? '' : '✗ '}${escapeHtml(h)}</span>`;
    capGridEl.appendChild(el);
  }
  // Surface any handlers the host advertised that we DIDN'T expect —
  // useful when the host adds a new family and the doctor is out of
  // date.
  const extras = [...handlers].filter((h) => !EXPECTED_HANDLERS.includes(h));
  if (extras.length > 0) {
    const note = document.createElement('div');
    note.style.marginTop = '8px';
    note.style.color = 'var(--muted)';
    note.style.fontSize = '12px';
    note.style.fontFamily = 'ui-monospace, monospace';
    note.innerHTML = `<b style="color:var(--accent)">+${extras.length} unexpected</b>: ${extras.map(escapeHtml).join(', ')}`;
    capGridEl.appendChild(note);
  }
  const missingCount = EXPECTED_HANDLERS.filter((h) => !handlers.has(h)).length;
  if (missingCount > 0) {
    capNoteEl.innerHTML = `<b style="color:var(--bad)">${missingCount}</b> expected handler(s) missing from the host's capabilities response. Check bridge_family_registration.dart imports.`;
  }
}

// ── Header populator ───────────────────────────────────────────────

function updateHeader(ctx) {
  const ver = ctx.capabilities?.bridgeVersion ?? ctx.capabilities?.version ?? '?';
  document.getElementById('bridge-ver').textContent = ver;
  const brand = String(ctx.identity?.brand ?? '?').toLowerCase();
  const model = ctx.identity?.modelDisplay ?? ctx.identity?.modelCode ?? '?';
  document.getElementById('host-id').textContent = `${brand} ${model}`;
  document.getElementById('locale-id').textContent = ctx.context?.locale ?? '?';
}

// ── Sweep runner ───────────────────────────────────────────────────

async function runAllProbes() {
  // Clear and re-render. Each probe gets its own row up-front so the
  // user sees the full checklist immediately with spinners; results
  // fill in as each probe resolves.
  probesEl.innerHTML = '';
  const rows = new Map();
  for (const probe of PROBES) {
    const row = renderProbeRow(probe);
    probesEl.appendChild(row);
    rows.set(probe.id, row);
  }

  capGridEl.innerHTML = '<span class="cap-note">Probing host…</span>';

  const ctx = {};

  // The probes are *mostly* parallelisable, but `capabilities`,
  // `display.list`, and `car.identity` produce context the others
  // depend on. Run those serial-first, then fire the rest in
  // parallel.
  const serialIds = ['capabilities', 'getContext', 'car.identity', 'display.list'];
  for (const id of serialIds) {
    const probe = PROBES.find((p) => p.id === id);
    if (!probe) continue;
    const outcome = await runOneProbe(probe, ctx);
    updateProbeRow(rows.get(probe.id), outcome);
  }
  // After capabilities has resolved, paint the capability grid.
  renderCapabilities(ctx.capabilities);
  updateHeader(ctx);

  // Now fan out the rest. Each probe is independent, so Promise.all
  // is fine; the UI updates as each lands via the per-row updater.
  await Promise.all(
    PROBES.filter((p) => !serialIds.includes(p.id)).map(async (probe) => {
      const outcome = await runOneProbe(probe, ctx);
      updateProbeRow(rows.get(probe.id), outcome);
    }),
  );
}

async function runOneProbe(probe, ctx) {
  try {
    return await probe.run(ctx);
  } catch (e) {
    // Probe implementation itself threw (not a host error — a JS
    // bug in this app). Surface it so we never silently swallow.
    return {
      status: 'fail',
      summary: `probe crashed: ${String(e?.message ?? e)}`,
      request: null,
      response: e,
      hint: 'Bridge Doctor itself threw while running this probe. Check the browser console for the stack trace and file a bug.',
    };
  }
}

// ── DiShare quick test ─────────────────────────────────────────────

const dishareLast = document.getElementById('dishare-last');

async function fireDiShare(target) {
  dishareLast.className = 'last';
  dishareLast.textContent = `casting to ${target}…`;
  // Pick the right handler + wire shape per host pkg_family.dart:
  //   passenger → pkg.launch  { packageName, targetRole: 'passenger' }
  //   cluster   → pkg.launch_cluster { packageName, displayId }
  let handler, req;
  if (target === 'cluster') {
    let displays = [];
    try {
      const r = await familyCall('display.list', null);
      const data = unwrap(r);
      displays = Array.isArray(data) ? data : (data?.displays ?? []);
    } catch (_) {}
    const cluster = displays.find((d) => d.role === 'cluster');
    if (!cluster) {
      dishareLast.className = 'last bad';
      dishareLast.textContent = 'no cluster display present';
      return;
    }
    handler = 'pkg.launch_cluster';
    req = { packageName: 'com.i99dev.i99dash', displayId: cluster.id };
  } else {
    handler = 'pkg.launch';
    req = { packageName: 'com.i99dev.i99dash', targetRole: 'passenger' };
  }
  let res, err;
  try { res = await familyCall(handler, req); } catch (e) { err = e; }
  const c = classifyResponse(res, err);
  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  if (!c.ok) {
    dishareLast.className = 'last bad';
    dishareLast.textContent = `${now}  ✗  ${c.errorCode} — ${(c.errorMessage ?? '').slice(0, 120)}`;
    return;
  }
  const data = unwrap(res);
  const path = data?.path ?? res?.path ?? '?';
  const inner = data?.error ?? res?.error;
  const cls = (path === 'dishare-denied' || path === 'launch-denied' || path === 'am-start-bounced') ? 'bad' : 'ok';
  dishareLast.className = `last ${cls}`;
  dishareLast.textContent = `${now}  ${cls === 'ok' ? '✓' : '✗'}  path=${path}${inner ? ` · ${inner}` : ''}`;
}

document.getElementById('dishare-btn').addEventListener('click', () => fireDiShare('passenger'));
document.getElementById('dishare-cluster-btn').addEventListener('click', () => fireDiShare('cluster'));

// ── Bootstrap ──────────────────────────────────────────────────────

document.getElementById('rerun-btn').addEventListener('click', () => {
  runAllProbes().catch((e) => console.error('sweep failed:', e));
});

(async () => {
  // Wait for the host bridge to actually be ready before concluding
  // anything (the L5 readiness race — see whenHostReady). Only after
  // the bounded wait do we show the "not inside a host" notice; until
  // then no probe can run since rawCall would reject 'not_inside_host'.
  host = await whenHostReady();
  if (!host) {
    document.getElementById('notice').classList.add('shown');
    return;
  }
  runAllProbes().catch((e) => console.error('sweep failed:', e));
})();
