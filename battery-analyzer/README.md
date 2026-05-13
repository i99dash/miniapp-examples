# Battery Analyzer

Live battery health + charging diagnostics mini-app. Subscribes to ~30 BMS / charging / cell-balance signals from the v2 bridge and renders them with plain-English explanations + colour-coded warnings.

```
┌─ SoC strip               battery_pct  range_ev_km  range_fuel_km  battery_wh
├─ Health verdict          stat_battery_health + cell-V spread + thermal spread
├─ Capacity / coolant      battery_capacity  battery_voltage_level  battery_blade_coolant_life
├─ Cell-voltage balance    stat_battery_max_v / min_v  (Δ warning > 30 mV)
├─ Cell-temp balance       stat_battery_max_temp / min_temp / avg_temp  (Δ warning > 5°C)
├─ Power flow              regen_power vs battery_max_chg_kw / max_dis_kw
├─ Charging                chg_work_state  chg_power  chg_target_soc  chg_eta  chg_battery_volt  chg_current
└─ Lifetime                stat_total_elec_kwh  stat_total_fuel_l  stat_instant_elec
```

## Why it's helpful

- **One-glance verdict.** Pulls 3 indicators (BMS health %, cell-voltage spread, thermal spread) into a single ✓ / warn / bad icon + plain-English explanation.
- **Cell drift early-warning.** A pack with 50 mV+ spread between best and worst cell is heading for problems. The chart shows where min / avg / max sit.
- **Thermal imbalance.** > 5°C between coolest and hottest cell means one corner of the pack isn't being cooled equally.
- **Charging diagnostics.** State / power / ETA / voltage / current — same data the dealer's diagnostic computer would show.
- **Lifetime context.** Total electric energy passed through the pack, total fuel burned, current consumption rate.

## Run

```bash
pnpm install
pnpm dev    # http://127.0.0.1:5182/
pnpm build  # → dist/
pnpm exec i99dash publish
```

## Wire shape

Calls 4 host handlers on bridge v2.0.0:

| Handler | Purpose |
|---|---|
| `car.identity` | brand pill |
| `car.read({names})` | seed values before first push |
| `car.subscribe({names, idempotencyKey})` | live deltas on `car.signal` channel |
| `car.connection.subscribe` | connection indicator |

No imports, no bundler, no SDK runtime dependency.

## Resilience

Any signal the host doesn't expose stays as `—`. The verdict logic only fires on signals that are actually populated, so an older car APK that doesn't yet have `battery_max_chg_kw` won't break the page — that one stat just shows `—` and the rest of the dashboard keeps working.

## Catalog dependency

Some signals were added to the BYD public catalog as part of this mini-app's design:

- `chg_connect_state`, `chg_fault_state`, `chg_battery_volt`, `chg_current`, `chg_ac_current`
- `battery_capacity`, `battery_voltage_level`, `battery_max_chg_kw`, `battery_max_dis_kw`, `battery_available_power`, `battery_blade_coolant_life`

These land in `car-i99dash` master via the same commit that introduces this mini-app and will surface in the next APK build. Until that APK rolls to fielded cars, those specific cells render `—`.

## Health thresholds (the warning math)

| Indicator | Healthy | Warn | Source |
|---|---|---|---|
| BMS health (%) | ≥ 80 | < 80 | `stat_battery_health` |
| Cell-V spread (mV) | < 30 | > 50 | `max_v − min_v` |
| Cell-temp spread (°C) | < 5 | > 8 | `max_temp − min_temp` |

Two or more "warn"-tier readings flips the verdict to **bad** with a service recommendation.
