# WebView Doctor

The **fallback diagnostic** mini-app. When another mini-app doesn't
work for a user, support says: *"open WebView Doctor, tap Export
.txt, and send the file to us on Telegram."*

## What it captures (privacy-clean by design)

No VIN, no location, no account/user-id values, no signal values —
only technical facts that explain failures:

- **WebView**: userAgent, parsed Chromium major, Android version,
  screen/density — the Gate-B axis.
- **Host-readiness timing** (the #1 real cause of the L5 "all —"
  symptom): was the host present at synchronous script time? if not,
  how many ms until `flutterInAppWebViewPlatformReady` / poll, and
  via which path. Which global it arrived on (`__i99dashHost` vs
  legacy `flutter_inappwebview`).
- **Feature probes**: `globalThis`, `structuredClone`,
  `Promise.allSettled/any`, `Array.at`, `String.replaceAll`,
  `crypto.randomUUID`, Blob/createObjectURL, clipboard, download —
  all via `typeof` (never invoked, never throws on old WebViews).
- **Bridge**: `getContext` (non-PII fields + *presence* booleans for
  the id fields — values never recorded), a benign `car.read`
  (count + ok only), and a deliberately-unknown handler to
  characterise the host. Latency per call. The `__i99dashEvents`
  hub presence.
- **Errors**: a global `error`/`unhandledrejection` capture — any JS
  error that would blank a normal mini-app is written *into* the
  report instead.
- A computed one-line **verdict** (good/warn/bad).

## Why it's built differently from every other mini-app

Every other app does "host not ready → show a notice and bail."
That bail **is** the failure this tool diagnoses. So here the
*wrongness is the report*: it MUST render a usable report under
**no host, the oldest WebView, a thrown JS error, or a dead
bridge**. Consequently it is hand-written to an ES5-safe runtime
floor — no bare `globalThis` identifier (esbuild es2019 down-levels
syntax but not that ES2020 global), no ES2020+ builtins in its own
code path (it only *probes* their existence), every step in
try/catch, and it always ends with a rendered report.

`manifest.requires` is intentionally `{ schema: 1 }` with **no
`minBridge`**: a diagnostic must not be filtered off a device by
the very bridge it exists to diagnose.

## Sharing

Primary: **Export .txt** → a real downloadable file the user
attaches in Telegram. Fallbacks (in order): `data:` URI download →
select-all the on-screen report box and paste. Zero network from the
app.

## Verification matrix (definition of done)

A usable report must render in **all** of: L8 (Di5.1), L5/Di5.0
**cold boot**, plain browser (no host), host-never-ready (timeout),
and JS-error-injected. "Works on L8" is necessary, not sufficient.

## Build / publish

```
pnpm bundle      # esbuild → src/app.bundle.js (iife, es2019)
pnpm validate    # i99dash validate
pnpm publish      # bump manifest.version first or the CDN keeps old bytes
```
