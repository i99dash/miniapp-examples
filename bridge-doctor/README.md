# Bridge Doctor

One-shot diagnostic mini-app for the i99dash v2 bridge. Install it on a car, open it, and within ~5 seconds you see exactly which handlers the host registered, which returned errors, and a one-line "patch needed" hint for every failure.

```
┌─ Capabilities             handler-list checklist with red dots on the missing ones
├─ Handler probes           capabilities · getContext · car.* · display.* · surface.* · pkg.*
└─ DiShare quick test       one-tap pkg.launch · target=passenger reproducer
```

## Why it exists

When a mini-app developer says "passenger cast broke" or "car.read started 404'ing", the host-vs-mini-app vs SDK triangle is hard to triage from a single bug report. Bridge Doctor cuts through it:

- It calls `window.flutter_inappwebview.callHandler` **directly** — bypasses `MiniAppClient` entirely. The whole point is to verify the host independently of what the SDK does or doesn't expose.
- Every probe reports the request payload, the raw response, and (on failure) a one-line "here's where to look" diagnostic mapped from the host's error code.
- The DiShare passenger cast — the operation most likely to break across Di5.0/Di5.1 splits — is also surfaced as a single dedicated button, so you can reproduce it with consent rather than auto-firing on load.

## What it probes

| # | Handler | What we check |
| --- | --- | --- |
| 1 | `capabilities` | Bridge version + the full handler list (checklist with red dots for missing). |
| 2 | `getContext` | locale / activeCarId / userId / appId / isDark presence. |
| 3 | `car.identity` | brand + modelDisplay. |
| 4 | `car.list` | Empty-args full catalog + `{category:'doors'}` filtered call. |
| 5 | `car.read` | `{names:['battery_pct','door_lf']}` round-trip. |
| 6 | `car.subscribe` | Full lifecycle — subscribe, listen for one `car.signal` frame on `__i99dashEvents`, then `car.unsubscribe`. |
| 7 | `car.connection.subscribe` | Same lifecycle, on the connection channel. |
| 8 | `display.list` | Display count + roles. |
| 9 | `display.subscribe` | 5-second hot-plug listen window (no event = normal, not a fail). |
| 10 | `surface.create` | Mounts on the first non-IVI display, then `surface.destroy`. Skipped on single-screen trims. |
| 11 | `surface.list` | Just the count of active surfaces. |
| 12 | `pkg.launch · target=passenger` | **The DiShare test.** Reports the `path` field verbatim — `dishare-cast`, `am-start`, `dishare-denied`, `launch-denied`, etc. |
| 13 | `pkg.launch · target=cluster` | Di5.1-only; skipped cleanly when no cluster display exists. |

## DiShare quick test

The bottom card has two buttons:

- **Cast i99dash to passenger panel** — fires `pkg.launch({target:'passenger', packageName:'com.i99dev.i99dash'})`.
- **Try cluster (Di5.1)** — same but `target:'cluster'`.

The result line shows the `path` the host took:

| `path` | Meaning |
| --- | --- |
| `dishare-cast` | ✓ Di5.0 DiShare bind + register + arm succeeded. |
| `dishare-cast-cached` | ✓ Already cast — no-op. |
| `am-start` | ✓ Di5.1 multi-display path (real passenger Display). |
| `am-start-rePinned` | ✓ Di5.1 with the host's bounce-recovery. |
| `dishare-denied` | ✗ DiShare service not present / refused — check inner `error` field. |
| `launch-denied` | ✗ CapabilityRegistry rejected the call — host needs a cap-bit patch. |

## Run

```bash
pnpm install
pnpm dev          # http://127.0.0.1:5183/
pnpm validate     # manifest schema check
pnpm build        # → dist/
```

`pnpm publish` is intentionally not run here — review the bundle first.

## Don't

- Don't expect every row to be green. A `surface.create` skip on a single-screen Yuan Plus is correct behaviour, not a failure.
- Don't rely on the DiShare cast for production code — use `MiniAppClient.surface.create` instead. This mini-app exists to *test* the bridge, not to be a template for using it.
