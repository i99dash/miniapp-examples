# Gauge Builder

Drag-and-drop instrument-cluster customizer. The IVI page shows three
gauge slots and a palette of widgets (speed / rpm / battery / range /
climate). Drop a widget into a slot, tap **Push to cluster**, and the
miniapp opens a cluster surface that renders the chosen layout against
live BYD signals.

```
┌──────────────────────────── IVI editor ─────────────────────────────┐
│  [ palette ]    [ slot 1 ]    [ slot 2 ]    [ slot 3 ]   [ Push ]   │
│  ░ speed        ┌───────┐    ┌───────┐    ┌───────┐                 │
│  ░ rpm          │  rpm  │    │ speed │    │batt.. │                 │
│  ░ battery      └───────┘    └───────┘    └───────┘                 │
│  ░ ev-range                                                         │
│  ░ fuel-range                                                       │
│  ░ climate                                                          │
└─────────────────────────────────────────────────────────────────────┘
                                ↓ Push
┌──────────────────── cluster (XDJA `_1` slot) ───────────────────────┐
│        ┌───────┐         ┌───────┐         ┌───────┐                │
│        │  rpm  │         │ speed │         │batt.. │                │
│        └───────┘         └───────┘         └───────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

## Trim support

The push target is picked by a small `resolveDriverTarget()` helper
that mirrors `pkg-launcher`'s pattern — real cluster overlay first,
then a passenger panel reserved with `overrideLabel === 'Driver'`,
then preview-only. `display.list().vehicle.capabilities` is the gate
on the cluster path; the panel path needs no special cap because the
panel is an ordinary addressable display on those trims.

| Trim                  | DiLink   | Push target                        | How                                          |
|-----------------------|----------|------------------------------------|----------------------------------------------|
| L8 / L5 Lidar         | 5.1      | ✓ cluster (XDJA `_1`)              | `surface.write.cluster` cap                  |
| Song Plus / L7 / HAN L| 5.0/5.1  | ✓ passenger panel labelled "Driver"| `overrideLabel === 'Driver'` resolver path   |
| L5 / L5U              | 5.0      | dimmed                             | No cluster pixel cap, no addressable panel   |
| Unknown trim          | —        | dimmed                             | No vehicle block; fail safe                  |

When falling back to the driver-labelled passenger panel a soft cyan
notice is shown so the user knows the layout isn't on the literal
instrument cluster.

When dimmed, the editor remains fully usable as a layout preview and
the chosen layout persists locally — the moment the car upgrades to
a trim that exposes cluster pixels, **Push** lights up automatically.

## Persistence

The chosen layout is stored in `localStorage` keyed by
`gauge-builder:layout:<deviceId>`. So every car keeps its own layout,
even on a shared IVI. No backend round-trip — and no PII.

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://127.0.0.1:5182/` — the dev server's bridge shim replays
canned signals and exposes a fake cluster display.

## Wire shape

| Handler                       | Used for                                                           |
|-------------------------------|--------------------------------------------------------------------|
| `car.identity`                | brand pill in the header                                           |
| `car.read({names})`           | seed the preview before the first push frame                       |
| `car.subscribe({names})`      | live delta stream over `car.signal` events                         |
| `car.connection.subscribe`    | online / degraded / disconnected indicator                         |
| `display.list`                | enumerate displays + read `vehicle.capabilities` / `dilinkFamily`  |
| `surface.create({displayId})` | mount `cluster.html` on the friendly cluster slot                  |
| `surface.destroy({sfcId})`    | take down the cluster surface when the user re-pushes              |

## Files

| Path           | Role                                                            |
|----------------|-----------------------------------------------------------------|
| `manifest.json`| Catalog row. `minHostVersion` = `2.0.0`                         |
| `src/index.html` | IVI editor                                                    |
| `src/editor.js`  | drag-drop, capability gating, push                            |
| `src/cluster.html` | Cluster page                                                |
| `src/cluster.js`   | Layout-driven gauge rendering                               |
| `src/widgets.js`   | Shared widget registry (paint + signals)                    |
| `src/bridge.js`    | Tiny `flutter_inappwebview.callHandler` wrapper             |
