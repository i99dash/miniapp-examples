(() => {
  // ../_shared/l5compat.js
  function _resolveHost() {
    if (typeof globalThis === "undefined") return null;
    const branded = globalThis.__i99dashHost;
    if (branded && typeof branded.callHandler === "function") return branded;
    const legacy = globalThis.flutter_inappwebview;
    if (legacy && typeof legacy.callHandler === "function") return legacy;
    return null;
  }
  var host = _resolveHost();
  function inHost() {
    return host != null;
  }
  var events = typeof globalThis !== "undefined" && globalThis.__i99dashEvents || (globalThis.__i99dashEvents = {
    _handlers: /* @__PURE__ */ Object.create(null),
    on(channel, fn) {
      (this._handlers[channel] = this._handlers[channel] || /* @__PURE__ */ new Set()).add(fn);
      return () => {
        const s = this._handlers[channel];
        if (s) s.delete(fn);
      };
    },
    dispatch(channel, payload) {
      const set = this._handlers[channel];
      if (!set) return;
      let parsed = payload;
      if (typeof payload === "string") {
        try {
          parsed = JSON.parse(payload);
        } catch (_) {
        }
      }
      for (const fn of set) {
        try {
          fn(parsed);
        } catch (err) {
          console.error("[l5compat] event listener error:", err);
        }
      }
    }
  });
  async function call(handler, payload = {}) {
    if (!host) throw new Error("not_inside_host");
    return host.callHandler(handler, payload);
  }
  async function getContext() {
    return call("getContext");
  }
  async function callApi(req) {
    return call("callApi", req);
  }

  // src/main.js
  var $ = (id) => document.getElementById(id);
  async function renderContext() {
    const el = $("context");
    if (!inHost()) {
      el.textContent = "No host bridge on this window. Run `i99dash dev` to attach one.";
      return;
    }
    try {
      const ctx = await getContext();
      document.documentElement.lang = ctx.locale || "en";
      document.documentElement.dir = ctx.locale === "ar" ? "rtl" : "ltr";
      el.textContent = JSON.stringify(
        {
          // Mask the two fields that identify a physical car/user
          // across sessions — same masking the old ContextCard did.
          userId: ctx.userId ? "\u2022\u2022\u2022\u2022" + String(ctx.userId).slice(-4) : "",
          activeCarId: ctx.activeCarId ? "\u2022\u2022\u2022\u2022" + String(ctx.activeCarId).slice(-4) : "",
          locale: ctx.locale,
          isDark: ctx.isDark,
          appId: ctx.appId,
          appVersion: ctx.appVersion
        },
        null,
        2
      );
    } catch (e) {
      el.textContent = String(e && e.message || e);
    }
  }
  async function renderStations() {
    const box = $("stations");
    if (!inHost()) {
      box.textContent = "No host bridge.";
      return;
    }
    try {
      const res = await callApi({
        path: "/api/v1/fuel-stations",
        method: "GET",
        query: { radius_m: 5e3 }
      });
      if (!res || res.success === false) {
        const err = res && res.error || {};
        box.textContent = `${err.code ? `[${err.code}] ` : ""}${err.message || "request failed"}`;
        return;
      }
      const stations = res.data && res.data.stations || [];
      if (stations.length === 0) {
        box.textContent = "No stations within 5 km.";
        return;
      }
      box.textContent = "";
      for (const s of stations) {
        const row = document.createElement("div");
        row.className = "station";
        const name = document.createElement("span");
        name.className = "station-name";
        name.textContent = s.name;
        const price = document.createElement("span");
        price.className = "station-price";
        price.textContent = `${Number(s.price_sar).toFixed(2)} SAR/L \xB7 ${Number(
          s.distance_km
        ).toFixed(1)} km`;
        row.appendChild(name);
        row.appendChild(price);
        box.appendChild(row);
      }
    } catch (e) {
      box.textContent = String(e && e.message || e);
    }
  }
  function startDrivingBanner() {
    const el = $("banner");
    const tick = async () => {
      try {
        const res = await fetch("/_sdk/state");
        if (!res.ok) return;
        const body = await res.json();
        if (typeof body.speedKmh !== "number") return;
        const v = body.speedKmh;
        el.classList.remove("hidden");
        if (v <= 5) {
          el.className = "banner success";
          el.textContent = `Parked (${v.toFixed(0)} km/h) \u2014 safe to interact.`;
        } else {
          el.className = "banner warn";
          el.textContent = `Car is moving (${v.toFixed(0)} km/h). Complex interactions are blocked by the host while driving.`;
        }
      } catch (_) {
      }
    };
    tick();
    setInterval(tick, 1e3);
  }
  renderContext();
  renderStations();
  startDrivingBanner();
})();
