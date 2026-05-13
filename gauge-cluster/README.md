# Gauge Cluster

Full instrument-cluster mini-app — analog speedometer, tachometer, and battery dials, plus digital readouts for range, climate, doors, and TPMS. Drinks live BYD signals via the v2 host bridge (`car.list` / `car.read` / `car.subscribe` / `car.identity` / `car.connection.subscribe`).

```
┌─ Speed (centre, 0–180 km/h)
├─ RPM (left, 0–8000)        — motor_f_rpm / motor_r_rpm / engine_rpm
├─ Battery + range (right)   — battery_pct + range_ev_km + range_fuel_km
├─ Closures (5)              — door_lf / rf / lr / rr + trunk
├─ TPMS (quad)               — tpms_pressure_{lf,rf,lr,rr}
└─ Climate (4)               — ac_cabin_temp / ac_temp_out / ac_fan / ac_power
```

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5181/` — the dev server's bridge shim replays canned signals.

## Build

```bash
pnpm build
```

`dist/` contains the static bundle (HTML + JS + icon + stamped manifest) the i99dash CLI ships to `miniapps.i99dash.app/gauge-cluster/`.

## Wire shape

The mini-app calls **only** these host handlers — every one is on bridge version `2.0.0`:

| Handler | Why |
|---|---|
| `car.identity` | brand + model badge in the header |
| `car.read({names})` | one-shot snapshot to seed the gauges before the first push frame |
| `car.subscribe({names, idempotencyKey})` | live delta stream over `car.signal` events |
| `car.connection.subscribe` | online / degraded / disconnected indicator |

No imports, no bundler, no SDK dependency at runtime — just `window.flutter_inappwebview.callHandler` and `window.__i99dashEvents.dispatch`.

## Catalog names used

All 22 signal names are from the brand-neutral BYD public catalog. See [`/docs/byd-api/catalog`](https://docs-i99dash-prod-d3c9v.ondigitalocean.app/docs/byd-api/catalog) for the live registry. New names land in the next docs deploy; existing names never drop.

`ac_cabin_temp` and `ac_temp_out` ship as integer × 10 (`celsius_x10`) — divided client-side. Everything else is the raw integer value.

## Adding more signals

1. Append the brand-neutral name to the `SIGNALS` array in `src/app.js`.
2. Add a DOM element to read it in `paintFooter` (or wherever).
3. If the value is scaled (× 10 etc.) add it to the `TENTH` set.

Cap is 64 names per subscription — well above what a cluster needs.
