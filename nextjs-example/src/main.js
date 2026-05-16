// Next.js Example — vanilla rebuild.
//
// Was Next 15 (App Router): server shell + three 'use client'
// components (ContextCard, StationList, DrivingBanner). Next emits
// modern chunked `/_next/static/chunks/*.js`, which the frozen
// ~2022 Chromium WebView on Di5.0 trims (L5 / L5 Ultra / Song Plus)
// silently refuses to run — blank screen, no error. Rebuilt as a
// single classic-IIFE esbuild bundle (es2019) so the SAME bundle
// runs on L5 and L8. Behaviour is 1:1 with the old components.
//
// Uses the shared bridge layer (_shared/l5compat.js) so host access
// is centralised and dependency-free.

import { inHost, getContext, callApi } from '../../_shared/l5compat.js';

const $ = (id) => document.getElementById(id);

// ── context card ─────────────────────────────────────────────────
// getContext() once, render a masked view, and flip <html> lang/dir
// so RTL kicks in for Arabic. The host stays authoritative — the
// locale swap is purely visual.
async function renderContext() {
  const el = $('context');
  if (!inHost()) {
    el.textContent =
      'No host bridge on this window. Run `i99dash dev` to attach one.';
    return;
  }
  try {
    const ctx = await getContext();
    document.documentElement.lang = ctx.locale || 'en';
    document.documentElement.dir = ctx.locale === 'ar' ? 'rtl' : 'ltr';
    el.textContent = JSON.stringify(
      {
        // Mask the two fields that identify a physical car/user
        // across sessions — same masking the old ContextCard did.
        userId: ctx.userId ? '••••' + String(ctx.userId).slice(-4) : '',
        activeCarId: ctx.activeCarId
          ? '••••' + String(ctx.activeCarId).slice(-4)
          : '',
        locale: ctx.locale,
        isDark: ctx.isDark,
        appId: ctx.appId,
        appVersion: ctx.appVersion,
      },
      null,
      2,
    );
  } catch (e) {
    el.textContent = String((e && e.message) || e);
  }
}

// ── fuel stations ────────────────────────────────────────────────
// callApi() through the host allow-list — never a raw fetch().
async function renderStations() {
  const box = $('stations');
  if (!inHost()) {
    box.textContent = 'No host bridge.';
    return;
  }
  try {
    const res = await callApi({
      path: '/api/v1/fuel-stations',
      method: 'GET',
      query: { radius_m: 5000 },
    });
    if (!res || res.success === false) {
      const err = (res && res.error) || {};
      box.textContent = `${err.code ? `[${err.code}] ` : ''}${
        err.message || 'request failed'
      }`;
      return;
    }
    const stations = (res.data && res.data.stations) || [];
    if (stations.length === 0) {
      box.textContent = 'No stations within 5 km.';
      return;
    }
    box.textContent = '';
    for (const s of stations) {
      const row = document.createElement('div');
      row.className = 'station';
      const name = document.createElement('span');
      name.className = 'station-name';
      name.textContent = s.name;
      const price = document.createElement('span');
      price.className = 'station-price';
      price.textContent = `${Number(s.price_sar).toFixed(2)} SAR/L · ${Number(
        s.distance_km,
      ).toFixed(1)} km`;
      row.appendChild(name);
      row.appendChild(price);
      box.appendChild(row);
    }
  } catch (e) {
    box.textContent = String((e && e.message) || e);
  }
}

// ── driving banner ───────────────────────────────────────────────
// Polls the dev-server's /_sdk/state for the driving toggle. In
// production that endpoint 404s, the fetch throws, and the banner
// stays hidden — the host's own safety gate takes over there.
function startDrivingBanner() {
  const el = $('banner');
  const tick = async () => {
    try {
      const res = await fetch('/_sdk/state');
      if (!res.ok) return;
      const body = await res.json();
      if (typeof body.speedKmh !== 'number') return;
      const v = body.speedKmh;
      el.classList.remove('hidden');
      if (v <= 5) {
        el.className = 'banner success';
        el.textContent = `Parked (${v.toFixed(0)} km/h) — safe to interact.`;
      } else {
        el.className = 'banner warn';
        el.textContent =
          `Car is moving (${v.toFixed(0)} km/h). Complex interactions ` +
          'are blocked by the host while driving.';
      }
    } catch (_) {
      /* production: /_sdk/state absent — banner stays hidden */
    }
  };
  tick();
  setInterval(tick, 1000);
}

renderContext();
renderStations();
startDrivingBanner();
