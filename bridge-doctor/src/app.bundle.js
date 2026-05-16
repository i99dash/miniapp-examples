(() => {
  // src/app.js
  var G = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {};
  function resolveHost() {
    const branded = G.__i99dashHost;
    if (branded && typeof branded.callHandler === "function") return branded;
    const legacy = G.flutter_inappwebview;
    if (legacy && typeof legacy.callHandler === "function") return legacy;
    return null;
  }
  var host = resolveHost();
  function whenHostReady(timeoutMs = 8e3) {
    return new Promise((resolve) => {
      const found = resolveHost();
      if (found) return resolve(found);
      let settled = false;
      const finish = (h) => {
        if (settled) return;
        settled = true;
        window.removeEventListener("flutterInAppWebViewPlatformReady", onReady);
        clearInterval(poll);
        clearTimeout(timer);
        resolve(h);
      };
      const tryNow = () => {
        const h = resolveHost();
        if (h) finish(h);
      };
      const onReady = () => tryNow();
      window.addEventListener("flutterInAppWebViewPlatformReady", onReady);
      const poll = setInterval(tryNow, 150);
      const timer = setTimeout(() => finish(resolveHost()), timeoutMs);
    });
  }
  var _a;
  G.__i99dashEvents = (_a = G.__i99dashEvents) != null ? _a : {
    _handlers: /* @__PURE__ */ Object.create(null),
    on(channel, fn) {
      var _a2, _b;
      ((_b = (_a2 = this._handlers)[channel]) != null ? _b : _a2[channel] = /* @__PURE__ */ new Set()).add(fn);
      return () => this._handlers[channel].delete(fn);
    },
    dispatch(channel, payload) {
      const set = this._handlers[channel];
      if (!set) return;
      let parsed = payload;
      if (typeof payload === "string") {
        try {
          parsed = JSON.parse(payload);
        } catch {
        }
      }
      for (const fn of set) {
        try {
          fn(parsed);
        } catch (err) {
          console.error("__i99dashEvents listener error:", err);
        }
      }
    }
  };
  async function rawCall(handler, payload) {
    if (!host) throw new Error("not_inside_host");
    const args = payload === void 0 ? null : payload;
    return host.callHandler(handler, args);
  }
  async function familyCall(handler, params) {
    const payload = {
      params: params != null ? params : {},
      idempotencyKey: cryptoRandomId()
    };
    return rawCall(handler, payload);
  }
  function cryptoRandomId() {
    var _a2;
    if ((_a2 = G.crypto) == null ? void 0 : _a2.randomUUID) return G.crypto.randomUUID();
    return "rid_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  function classifyResponse(res, err) {
    var _a2, _b, _c, _d, _e, _f, _g, _h;
    if (err) {
      const msg = String((_a2 = err == null ? void 0 : err.message) != null ? _a2 : err);
      let code = "handler_not_found";
      if (/PlatformException\(([^,)]+)/i.test(msg)) {
        code = RegExp.$1.trim();
      } else if (/not[\s_-]?registered|no such handler|not found/i.test(msg)) {
        code = "handler_not_found";
      } else if (/timeout/i.test(msg)) {
        code = "bridge_timeout";
      } else if (/transport/i.test(msg)) {
        code = "bridge_transport";
      } else if (/unknown_capability|capability/i.test(msg)) {
        code = "unknown_capability";
      }
      return { ok: false, errorCode: code, errorMessage: msg };
    }
    if (res == null) {
      return { ok: true };
    }
    if (typeof res === "object" && "success" in res) {
      if (res.success === false) {
        const e = (_b = res.error) != null ? _b : {};
        return {
          ok: false,
          errorCode: (_c = e.code) != null ? _c : "unknown",
          errorMessage: (_d = e.message) != null ? _d : JSON.stringify(e)
        };
      }
      return { ok: true };
    }
    if (typeof res === "object" && "ok" in res) {
      if (res.ok === false) {
        return {
          ok: false,
          errorCode: (_f = (_e = res.error) != null ? _e : res.path) != null ? _f : "unknown",
          errorMessage: (_h = (_g = res.error) != null ? _g : res.path) != null ? _h : null
        };
      }
      return { ok: true };
    }
    return { ok: true };
  }
  function unwrap(res) {
    if (res && typeof res === "object" && "success" in res && "data" in res) {
      return res.data;
    }
    return res;
  }
  var PATCH_HINTS = {
    // Bridge-transport / wiring failures
    handler_not_found: "Handler missing from host registry. Confirm bridge_family_registration.dart still imports + registers the family for that handler (the v2 cutover dropped a few during refactor).",
    bridge_timeout: "Host received the call but didn't respond within 10 s. Either the handler is blocked on a platform call (am-start, DiShare bind) or it threw before serialising \u2014 check the host logs for an unhandled exception.",
    bridge_transport: "Flutter method-channel layer crashed mid-call. Usually a host-side bug; look for a stack-trace in adb logcat right before the failure.",
    // Param + capability gate
    param_validation_failed: "Request payload shape mismatch. Compare what we sent (above) against the host's ParamRule schema for this handler. The 5.0 bridge added stricter IntParamRule for displayId / surfaceId \u2014 a missing field that used to be optional may now be required.",
    unknown_capability: "CapabilityRegistry rejected the call. Check the cap-bit for this feature is set in the host's CapabilityRegistry initialisation (VehicleProfile or the family's register() call).",
    cap_denied: "Manifest capability not granted. The cap-bit is registered host-side but the mini-app installer didn't grant it. Re-install with the cap requested in manifest.json.",
    // Catalog / car.read / car.subscribe
    unknown_signal: "Signal name not in the active brand's catalog. Check spelling; cross-reference against the byd_public_catalog.dart catalog file.",
    too_many_names: "Hit the 64-name-per-call cap. Split into multiple car.read / car.subscribe batches.",
    subscription_quota_exceeded: "More than the per-app subscription cap (default 10). Make sure prior subscribes were cleaned up via car.unsubscribe.",
    unknown_subscription: "subscriptionId not recognised. Either it was already unsubscribed, or the host restarted and lost the subscription table \u2014 re-subscribe.",
    // Pkg / DiShare / multi-display
    no_dishare_service: "com.byd.dishare service not present on this ROM. Either a Di5.0 trim without the DiShare add-on or the service was disabled at the system level. Not a host-bug, but a hard floor for passenger-cast on this car.",
    dishare_denied: "DiShare bind/register/arm failed. Check com.byd.dishare AIDL is alive (adb shell dumpsys activity service com.byd.dishare) and the accessibility service is attached.",
    bind_failed: "DiShare AIDL bind failed. Almost always means the service is installed but not currently running; try toggling DiShare in the head-unit settings.",
    register_failed: "DiShare registered the client but rejected the cast \u2014 usually because another caller already owns the mirror chain. Stop the other caster and retry.",
    dishare_not_installed: "DiShare package missing entirely. Confirmed Di5.0-without-DiShare trim; passenger cast is not reachable on this car.",
    a11y_not_attached: `DiShare needs the host's accessibility service attached to drive the synthetic gesture chain. Toggle "i99dash" under Settings \u2192 Accessibility on the head unit and retry.`,
    role_requires_cluster_op: "Used pkg.launch with a cluster displayId. The host requires pkg.launch_cluster for cluster slots \u2014 switch the handler name. (Different op, same args shape modulo target.)",
    display_not_found: "displayId not in the host's display.list. Either it was hot-unplugged (rare) or you cached a stale id across a host restart \u2014 re-read display.list before launching.",
    no_secondary_display: "This trim only exposes the IVI. No passenger / cluster display to mount a surface on. Not a bug \u2014 fall back to single-screen UI.",
    // Surface family
    surface_quota_exceeded: "Hit the per-app surface cap. Destroy at least one prior surface before creating another.",
    // Catch-all
    unknown: "Host returned an error code the doctor doesn't recognise yet. Copy the full response payload (above) and file a bridge-doctor PR with the new mapping."
  };
  function hintFor(code) {
    var _a2;
    if (!code) return null;
    return (_a2 = PATCH_HINTS[code]) != null ? _a2 : PATCH_HINTS.unknown;
  }
  var SUBSCRIBE_LISTEN_MS = 1500;
  var DISPLAY_HOTPLUG_LISTEN_MS = 5e3;
  function uuid() {
    var _a2;
    if ((_a2 = G.crypto) == null ? void 0 : _a2.randomUUID) return G.crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      return (c === "x" ? r : r & 3 | 8).toString(16);
    });
  }
  function waitForEvent(channel, timeoutMs) {
    return new Promise((resolve) => {
      let captured = null;
      const off = G.__i99dashEvents.on(channel, (payload) => {
        captured = payload;
      });
      setTimeout(() => {
        off();
        resolve(captured);
      }, timeoutMs);
    });
  }
  var PROBES = [
    {
      id: "capabilities",
      label: "capabilities",
      async run(ctx) {
        var _a2, _b;
        const req = null;
        let res, err;
        try {
          res = await rawCall("capabilities", req);
        } catch (e) {
          err = e;
        }
        const c = classifyResponse(res, err);
        if (!c.ok) {
          return { status: "fail", summary: c.errorCode, request: req, response: err != null ? err : res, hint: hintFor(c.errorCode) };
        }
        const data = unwrap(res);
        ctx.capabilities = data;
        const handlers = Array.isArray(data == null ? void 0 : data.handlers) ? data.handlers : [];
        const ver = (_b = (_a2 = data == null ? void 0 : data.bridgeVersion) != null ? _a2 : data == null ? void 0 : data.version) != null ? _b : "?";
        return {
          status: "ok",
          summary: `${handlers.length} handlers \xB7 bridge ${ver}`,
          request: req,
          response: res
        };
      }
    },
    {
      id: "getContext",
      label: "getContext",
      async run(ctx) {
        const req = null;
        let res, err;
        try {
          res = await rawCall("getContext", req);
        } catch (e) {
          err = e;
        }
        const c = classifyResponse(res, err);
        if (!c.ok) {
          return { status: "fail", summary: c.errorCode, request: req, response: err != null ? err : res, hint: hintFor(c.errorCode) };
        }
        const data = unwrap(res);
        ctx.context = data;
        const bits = [];
        if (data == null ? void 0 : data.locale) bits.push(`locale=${data.locale}`);
        if (data == null ? void 0 : data.activeCarId) bits.push(`car=${String(data.activeCarId).slice(0, 24)}`);
        if ((data == null ? void 0 : data.isDark) != null) bits.push(data.isDark ? "dark" : "light");
        return {
          status: "ok",
          summary: bits.join(" \xB7 ") || `${Object.keys(data != null ? data : {}).length} keys`,
          request: req,
          response: res
        };
      }
    },
    {
      id: "car.identity",
      label: "car.identity",
      async run(ctx) {
        var _a2, _b, _c;
        const req = null;
        let res, err;
        try {
          res = await rawCall("car.identity", req);
        } catch (e) {
          err = e;
        }
        const c = classifyResponse(res, err);
        if (!c.ok) {
          return { status: "fail", summary: c.errorCode, request: req, response: err != null ? err : res, hint: hintFor(c.errorCode) };
        }
        const data = unwrap(res);
        ctx.identity = data;
        const brand = String((_a2 = data == null ? void 0 : data.brand) != null ? _a2 : "?").toLowerCase();
        const model = (_c = (_b = data == null ? void 0 : data.modelDisplay) != null ? _b : data == null ? void 0 : data.modelCode) != null ? _c : "?";
        return { status: "ok", summary: `${brand} \xB7 ${model}`, request: req, response: res };
      }
    },
    {
      id: "car.list",
      label: "car.list",
      async run(ctx) {
        var _a2;
        const req = { all: {}, doors: { category: "doors" } };
        const out = {};
        let firstErr = null;
        let allOk = true;
        for (const [k, args] of Object.entries(req)) {
          try {
            out[k] = await rawCall("car.list", args);
          } catch (e) {
            out[k] = { __thrown: String((_a2 = e == null ? void 0 : e.message) != null ? _a2 : e) };
            if (!firstErr) firstErr = e;
            allOk = false;
          }
        }
        const c = classifyResponse(out.all, firstErr);
        if (!c.ok) {
          return { status: "fail", summary: c.errorCode, request: req, response: out, hint: hintFor(c.errorCode) };
        }
        const data = unwrap(out.all);
        const entries = Array.isArray(data == null ? void 0 : data.entries) ? data.entries : Array.isArray(data) ? data : [];
        const doorsData = unwrap(out.doors);
        const doorsEntries = Array.isArray(doorsData == null ? void 0 : doorsData.entries) ? doorsData.entries : Array.isArray(doorsData) ? doorsData : [];
        const status = allOk ? "ok" : "warn";
        return {
          status,
          summary: `${entries.length} entries \xB7 doors filter: ${doorsEntries.length}`,
          request: req,
          response: out
        };
      }
    },
    {
      id: "car.read",
      label: "car.read",
      async run(ctx) {
        var _a2;
        const req = { names: ["battery_pct", "door_lf"] };
        let res, err;
        try {
          res = await rawCall("car.read", req);
        } catch (e) {
          err = e;
        }
        const c = classifyResponse(res, err);
        if (!c.ok) {
          return { status: "fail", summary: c.errorCode, request: req, response: err != null ? err : res, hint: hintFor(c.errorCode) };
        }
        const data = unwrap(res);
        const values = (_a2 = data == null ? void 0 : data.values) != null ? _a2 : {};
        const bits = [];
        for (const name of req.names) {
          const v = values[name];
          bits.push(`${name}=${v == null ? "\u2205" : v}`);
        }
        return { status: "ok", summary: bits.join(" \xB7 "), request: req, response: res };
      }
    },
    {
      id: "car.subscribe",
      label: "car.subscribe \u2192 signal \u2192 unsubscribe",
      async run(ctx) {
        var _a2;
        const key = uuid();
        const req = { names: ["battery_pct"], idempotencyKey: key };
        let res, err;
        const framePromise = waitForEvent("car.signal", SUBSCRIBE_LISTEN_MS);
        try {
          res = await rawCall("car.subscribe", req);
        } catch (e) {
          err = e;
        }
        const c = classifyResponse(res, err);
        if (!c.ok) {
          return { status: "fail", summary: c.errorCode, request: req, response: err != null ? err : res, hint: hintFor(c.errorCode) };
        }
        const data = unwrap(res);
        const subId = (_a2 = data == null ? void 0 : data.subscriptionId) != null ? _a2 : null;
        const frame = await framePromise;
        let unsubErr = null;
        let unsubRes = null;
        try {
          unsubRes = await rawCall("car.unsubscribe", { subscriptionId: subId });
        } catch (e) {
          unsubErr = e;
        }
        const unsubClass = classifyResponse(unsubRes, unsubErr);
        const ok = unsubClass.ok;
        const sawFrame = frame != null;
        const summary = [
          `id=${String(subId != null ? subId : "null").slice(0, 8)}`,
          sawFrame ? "frame \u2713" : "no frame in 1.5s",
          ok ? "unsub \u2713" : `unsub \u2717 (${unsubClass.errorCode})`
        ].join(" \xB7 ");
        const status = ok ? sawFrame ? "ok" : "warn" : "warn";
        return {
          status,
          summary,
          request: req,
          response: { subscribe: res, frame, unsubscribe: unsubRes != null ? unsubRes : unsubErr },
          hint: ok ? null : hintFor(unsubClass.errorCode)
        };
      }
    },
    {
      id: "car.connection.subscribe",
      label: "car.connection.subscribe \u2192 unsubscribe",
      async run() {
        var _a2, _b, _c, _d, _e;
        const req = null;
        const framePromise = waitForEvent("car.connection", SUBSCRIBE_LISTEN_MS);
        let res, err;
        try {
          res = await rawCall("car.connection.subscribe", req);
        } catch (e) {
          err = e;
        }
        const c = classifyResponse(res, err);
        if (!c.ok) {
          return { status: "fail", summary: c.errorCode, request: req, response: err != null ? err : res, hint: hintFor(c.errorCode) };
        }
        const frame = await framePromise;
        const subscriptionId = (_b = (_a2 = unwrap(res)) == null ? void 0 : _a2.subscriptionId) != null ? _b : res == null ? void 0 : res.subscriptionId;
        let unsubErr = null;
        let unsubRes = null;
        try {
          unsubRes = await rawCall("car.connection.unsubscribe", { subscriptionId });
        } catch (e) {
          unsubErr = e;
        }
        const unsubClass = classifyResponse(unsubRes, unsubErr);
        const state = (_e = (_d = frame == null ? void 0 : frame.state) != null ? _d : (_c = frame == null ? void 0 : frame.data) == null ? void 0 : _c.state) != null ? _e : "unknown";
        const summary = `state=${state} \xB7 ${unsubClass.ok ? "unsub \u2713" : `unsub \u2717 (${unsubClass.errorCode})`}`;
        return {
          status: unsubClass.ok ? "ok" : "warn",
          summary,
          request: req,
          response: { subscribe: res, frame, unsubscribe: unsubRes != null ? unsubRes : unsubErr }
        };
      }
    },
    {
      id: "display.list",
      label: "display.list",
      async run(ctx) {
        var _a2, _b;
        const req = null;
        let res, err;
        try {
          res = await familyCall("display.list", null);
        } catch (e) {
          err = e;
        }
        const c = classifyResponse(res, err);
        if (!c.ok) {
          return { status: "fail", summary: c.errorCode, request: req, response: err != null ? err : res, hint: hintFor(c.errorCode) };
        }
        const data = unwrap(res);
        const displays = Array.isArray(data) ? data : (_a2 = data == null ? void 0 : data.displays) != null ? _a2 : [];
        ctx.displays = displays;
        ctx.vehicle = (_b = data == null ? void 0 : data.vehicle) != null ? _b : null;
        const roles = displays.map((d) => {
          var _a3;
          return `${(_a3 = d.role) != null ? _a3 : "?"}#${d.id}`;
        }).join(", ");
        return {
          status: "ok",
          summary: `${displays.length} displays \xB7 ${roles || "\u2014"}`,
          request: req,
          response: res
        };
      }
    },
    {
      id: "display.subscribe",
      label: "display.subscribe \u2192 hotplug \u2192 unsubscribe",
      async run() {
        var _a2, _b;
        const req = null;
        const framePromise = waitForEvent("display.hotplug", DISPLAY_HOTPLUG_LISTEN_MS);
        let res, err;
        try {
          res = await familyCall("display.subscribe", null);
        } catch (e) {
          err = e;
        }
        const c = classifyResponse(res, err);
        if (!c.ok) {
          return { status: "fail", summary: c.errorCode, request: req, response: err != null ? err : res, hint: hintFor(c.errorCode) };
        }
        const data = unwrap(res);
        const id = (_b = (_a2 = data == null ? void 0 : data.id) != null ? _a2 : data == null ? void 0 : data.subscriptionId) != null ? _b : null;
        const frame = await framePromise;
        let unsubErr = null;
        let unsubRes = null;
        try {
          unsubRes = await familyCall("display.unsubscribe", id != null ? { id } : null);
        } catch (e) {
          unsubErr = e;
        }
        const unsubClass = classifyResponse(unsubRes, unsubErr);
        const summary = [
          `id=${String(id != null ? id : "null").slice(0, 8)}`,
          frame ? "hotplug seen" : "no hotplug in 5s (normal)",
          unsubClass.ok ? "unsub \u2713" : `unsub \u2717 (${unsubClass.errorCode})`
        ].join(" \xB7 ");
        return {
          status: unsubClass.ok ? "ok" : "warn",
          summary,
          request: req,
          response: { subscribe: res, frame, unsubscribe: unsubRes != null ? unsubRes : unsubErr }
        };
      }
    },
    {
      id: "surface.create",
      label: "surface.create \u2192 surface.destroy",
      async run(ctx) {
        var _a2, _b, _c;
        const displays = (_a2 = ctx.displays) != null ? _a2 : [];
        const target = displays.find((d) => d.id !== 0 && d.role !== "ivi" && !d.isDefault);
        if (!target) {
          return {
            status: "skip",
            summary: "no secondary display available on this car",
            request: null,
            response: null,
            hint: hintFor("no_secondary_display")
          };
        }
        const req = { displayId: target.id, route: "/probe" };
        let res, err;
        try {
          res = await familyCall("surface.create", req);
        } catch (e) {
          err = e;
        }
        const c = classifyResponse(res, err);
        if (!c.ok) {
          return { status: "fail", summary: c.errorCode, request: req, response: err != null ? err : res, hint: hintFor(c.errorCode) };
        }
        const data = unwrap(res);
        const surfaceId = (_b = data == null ? void 0 : data.surfaceId) != null ? _b : null;
        const path = (_c = data == null ? void 0 : data.path) != null ? _c : "?";
        let destroyErr = null;
        let destroyRes = null;
        try {
          destroyRes = await familyCall("surface.destroy", { surfaceId });
        } catch (e) {
          destroyErr = e;
        }
        const destroyClass = classifyResponse(destroyRes, destroyErr);
        return {
          status: destroyClass.ok ? "ok" : "warn",
          summary: `path=${path} \xB7 sfc=${String(surfaceId != null ? surfaceId : "null").slice(0, 10)} \xB7 ${destroyClass.ok ? "destroyed" : "destroy \u2717"}`,
          request: req,
          response: { create: res, destroy: destroyRes != null ? destroyRes : destroyErr },
          hint: destroyClass.ok ? null : hintFor(destroyClass.errorCode)
        };
      }
    },
    {
      id: "surface.list",
      label: "surface.list",
      async run() {
        var _a2;
        const req = null;
        let res, err;
        try {
          res = await familyCall("surface.list", null);
        } catch (e) {
          err = e;
        }
        const c = classifyResponse(res, err);
        if (!c.ok) {
          return { status: "fail", summary: c.errorCode, request: req, response: err != null ? err : res, hint: hintFor(c.errorCode) };
        }
        const data = unwrap(res);
        const surfaces = Array.isArray(data) ? data : (_a2 = data == null ? void 0 : data.surfaces) != null ? _a2 : [];
        return { status: "ok", summary: `${surfaces.length} active`, request: req, response: res };
      }
    },
    {
      id: "pkg.launch.passenger",
      label: "pkg.launch \xB7 target=passenger (DiShare test)",
      async run() {
        var _a2, _b, _c, _d;
        const req = { packageName: "com.i99dev.i99dash", targetRole: "passenger" };
        let res, err;
        try {
          res = await familyCall("pkg.launch", req);
        } catch (e) {
          err = e;
        }
        const c = classifyResponse(res, err);
        if (!c.ok) {
          const code = c.errorCode;
          return {
            status: "fail",
            summary: code,
            request: req,
            response: err != null ? err : res,
            hint: hintFor(code)
          };
        }
        const data = unwrap(res);
        const path = (_b = (_a2 = data == null ? void 0 : data.path) != null ? _a2 : res == null ? void 0 : res.path) != null ? _b : "?";
        const goodPaths = /* @__PURE__ */ new Set([
          "dishare-cast",
          "dishare-cast-cached",
          "am-start",
          "am-start-rePinned",
          "intent-launch",
          "move-task-front",
          "presentation",
          "overlay"
        ]);
        const badPaths = /* @__PURE__ */ new Set(["dishare-denied", "launch-denied", "am-start-bounced"]);
        let status = "ok";
        let summary = `path=${path}`;
        let hint = null;
        if (badPaths.has(path)) {
          status = "fail";
          const inner = (_c = data == null ? void 0 : data.error) != null ? _c : res == null ? void 0 : res.error;
          summary = `${path}${inner ? ` (${inner})` : ""}`;
          hint = (_d = hintFor(inner)) != null ? _d : hintFor(path.replace(/-/g, "_"));
        } else if (!goodPaths.has(path)) {
          status = "warn";
          summary = `path=${path} (unknown to doctor)`;
        }
        return { status, summary, request: req, response: res, hint };
      }
    },
    {
      id: "pkg.launch.cluster",
      label: "pkg.launch \xB7 target=cluster (Di5.1 only)",
      async run(ctx) {
        var _a2, _b, _c;
        const displays = (_a2 = ctx.displays) != null ? _a2 : [];
        const hasCluster = displays.some((d) => d.role === "cluster");
        if (!hasCluster) {
          return {
            status: "skip",
            summary: "no cluster display (Di5.0 trim \u2014 skipped)",
            request: null,
            response: null
          };
        }
        const cluster = displays.find((d) => d.role === "cluster");
        const req = { packageName: "com.i99dev.i99dash", displayId: cluster.id };
        let res, err;
        try {
          res = await familyCall("pkg.launch_cluster", req);
        } catch (e) {
          err = e;
        }
        const c = classifyResponse(res, err);
        if (!c.ok) {
          return {
            status: "fail",
            summary: c.errorCode,
            request: req,
            response: err != null ? err : res,
            hint: hintFor(c.errorCode)
          };
        }
        const data = unwrap(res);
        const path = (_c = (_b = data == null ? void 0 : data.path) != null ? _b : res == null ? void 0 : res.path) != null ? _c : "?";
        return { status: "ok", summary: `path=${path}`, request: req, response: res };
      }
    }
  ];
  var probesEl = document.getElementById("probes");
  var capGridEl = document.getElementById("cap-grid");
  var capNoteEl = document.getElementById("cap-note");
  var ICONS = {
    ok: "\u2713",
    fail: "\u2717",
    warn: "\u26A0",
    skip: "\u23ED",
    pend: "\u25D0"
  };
  function statusClass(status) {
    var _a2;
    return (_a2 = { ok: "ok", fail: "fail", warn: "warn", skip: "skip", pend: "pend" }[status]) != null ? _a2 : "pend";
  }
  function renderProbeRow(probe) {
    const row = document.createElement("div");
    row.className = "row";
    row.dataset.id = probe.id;
    row.dataset.open = "0";
    row.innerHTML = `
    <div class="head" role="button" tabindex="0">
      <span class="ico pend" data-role="ico">${ICONS.pend}</span>
      <div class="label">
        <div class="name">${probe.label}</div>
        <div class="summary" data-role="summary">running\u2026</div>
      </div>
      <span class="chevron">\u25B6</span>
    </div>
    <div class="details" data-role="details"></div>
  `;
    const head = row.querySelector(".head");
    head.addEventListener("click", () => {
      row.dataset.open = row.dataset.open === "1" ? "0" : "1";
    });
    head.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        row.dataset.open = row.dataset.open === "1" ? "0" : "1";
      }
    });
    return row;
  }
  function updateProbeRow(row, outcome) {
    var _a2, _b;
    const ico = row.querySelector('[data-role="ico"]');
    const summary = row.querySelector('[data-role="summary"]');
    const details = row.querySelector('[data-role="details"]');
    ico.className = `ico ${statusClass(outcome.status)}`;
    ico.textContent = (_a2 = ICONS[outcome.status]) != null ? _a2 : "?";
    summary.className = `summary ${outcome.status === "fail" ? "fail" : outcome.status === "warn" ? "warn" : ""}`;
    summary.textContent = (_b = outcome.summary) != null ? _b : "";
    details.innerHTML = "";
    if (outcome.hint) {
      const h = document.createElement("div");
      h.className = "hint";
      h.innerHTML = `<b>Patch needed:</b> ${escapeHtml(outcome.hint)}`;
      details.appendChild(h);
    }
    const reqLbl = document.createElement("div");
    reqLbl.className = "pre-label";
    reqLbl.textContent = "request";
    details.appendChild(reqLbl);
    const reqPre = document.createElement("pre");
    reqPre.textContent = prettyJson(outcome.request);
    details.appendChild(reqPre);
    const resLbl = document.createElement("div");
    resLbl.className = "pre-label";
    resLbl.textContent = "response";
    details.appendChild(resLbl);
    const resPre = document.createElement("pre");
    resPre.textContent = prettyJson(outcome.response);
    details.appendChild(resPre);
  }
  function prettyJson(v) {
    if (v == null) return String(v);
    if (v instanceof Error) {
      return `${v.name}: ${v.message}${v.stack ? "\n" + v.stack : ""}`;
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
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  var EXPECTED_HANDLERS = [
    // Core
    "capabilities",
    "getContext",
    "callApi",
    "_admin.exec",
    // Car v2
    "car.list",
    "car.read",
    "car.subscribe",
    "car.unsubscribe",
    "car.identity",
    "car.asset",
    "car.command",
    "car.connection.subscribe",
    "car.connection.unsubscribe",
    // Display + surface
    "display.list",
    "display.subscribe",
    "display.unsubscribe",
    "surface.create",
    "surface.destroy",
    "surface.navigate",
    "surface.list",
    // Pkg
    "pkg.list",
    "pkg.launch",
    "pkg.launch_cluster",
    "pkg.stop",
    "pkg.move",
    // Cursor + gesture
    "cursor.attach",
    "cursor.move",
    "cursor.detach",
    "gesture.tap",
    "gesture.swipe",
    "gesture.longPress"
  ];
  function renderCapabilities(data) {
    capGridEl.innerHTML = "";
    capNoteEl.innerHTML = "";
    if (!data) {
      capGridEl.innerHTML = '<span class="cap-note">capabilities handler failed \u2014 see probe row below.</span>';
      return;
    }
    const handlers = new Set(Array.isArray(data.handlers) ? data.handlers : []);
    for (const h of EXPECTED_HANDLERS) {
      const present = handlers.has(h);
      const el = document.createElement("div");
      el.className = `cap ${present ? "present" : "missing"}`;
      el.innerHTML = `<span class="dot"></span><span>${present ? "" : "\u2717 "}${escapeHtml(h)}</span>`;
      capGridEl.appendChild(el);
    }
    const extras = [...handlers].filter((h) => !EXPECTED_HANDLERS.includes(h));
    if (extras.length > 0) {
      const note = document.createElement("div");
      note.style.marginTop = "8px";
      note.style.color = "var(--muted)";
      note.style.fontSize = "12px";
      note.style.fontFamily = "ui-monospace, monospace";
      note.innerHTML = `<b style="color:var(--accent)">+${extras.length} unexpected</b>: ${extras.map(escapeHtml).join(", ")}`;
      capGridEl.appendChild(note);
    }
    const missingCount = EXPECTED_HANDLERS.filter((h) => !handlers.has(h)).length;
    if (missingCount > 0) {
      capNoteEl.innerHTML = `<b style="color:var(--bad)">${missingCount}</b> expected handler(s) missing from the host's capabilities response. Check bridge_family_registration.dart imports.`;
    }
  }
  function updateHeader(ctx) {
    var _a2, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
    const ver = (_d = (_c = (_a2 = ctx.capabilities) == null ? void 0 : _a2.bridgeVersion) != null ? _c : (_b = ctx.capabilities) == null ? void 0 : _b.version) != null ? _d : "?";
    document.getElementById("bridge-ver").textContent = ver;
    const brand = String((_f = (_e = ctx.identity) == null ? void 0 : _e.brand) != null ? _f : "?").toLowerCase();
    const model = (_j = (_i = (_g = ctx.identity) == null ? void 0 : _g.modelDisplay) != null ? _i : (_h = ctx.identity) == null ? void 0 : _h.modelCode) != null ? _j : "?";
    document.getElementById("host-id").textContent = `${brand} ${model}`;
    document.getElementById("locale-id").textContent = (_l = (_k = ctx.context) == null ? void 0 : _k.locale) != null ? _l : "?";
  }
  async function runAllProbes() {
    probesEl.innerHTML = "";
    const rows = /* @__PURE__ */ new Map();
    for (const probe of PROBES) {
      const row = renderProbeRow(probe);
      probesEl.appendChild(row);
      rows.set(probe.id, row);
    }
    capGridEl.innerHTML = '<span class="cap-note">Probing host\u2026</span>';
    const ctx = {};
    const serialIds = ["capabilities", "getContext", "car.identity", "display.list"];
    for (const id of serialIds) {
      const probe = PROBES.find((p) => p.id === id);
      if (!probe) continue;
      const outcome = await runOneProbe(probe, ctx);
      updateProbeRow(rows.get(probe.id), outcome);
    }
    renderCapabilities(ctx.capabilities);
    updateHeader(ctx);
    await Promise.all(
      PROBES.filter((p) => !serialIds.includes(p.id)).map(async (probe) => {
        const outcome = await runOneProbe(probe, ctx);
        updateProbeRow(rows.get(probe.id), outcome);
      })
    );
  }
  async function runOneProbe(probe, ctx) {
    var _a2;
    try {
      return await probe.run(ctx);
    } catch (e) {
      return {
        status: "fail",
        summary: `probe crashed: ${String((_a2 = e == null ? void 0 : e.message) != null ? _a2 : e)}`,
        request: null,
        response: e,
        hint: "Bridge Doctor itself threw while running this probe. Check the browser console for the stack trace and file a bug."
      };
    }
  }
  var dishareLast = document.getElementById("dishare-last");
  async function fireDiShare(target) {
    var _a2, _b, _c, _d, _e;
    dishareLast.className = "last";
    dishareLast.textContent = `casting to ${target}\u2026`;
    let handler, req;
    if (target === "cluster") {
      let displays = [];
      try {
        const r = await familyCall("display.list", null);
        const data2 = unwrap(r);
        displays = Array.isArray(data2) ? data2 : (_a2 = data2 == null ? void 0 : data2.displays) != null ? _a2 : [];
      } catch (_) {
      }
      const cluster = displays.find((d) => d.role === "cluster");
      if (!cluster) {
        dishareLast.className = "last bad";
        dishareLast.textContent = "no cluster display present";
        return;
      }
      handler = "pkg.launch_cluster";
      req = { packageName: "com.i99dev.i99dash", displayId: cluster.id };
    } else {
      handler = "pkg.launch";
      req = { packageName: "com.i99dev.i99dash", targetRole: "passenger" };
    }
    let res, err;
    try {
      res = await familyCall(handler, req);
    } catch (e) {
      err = e;
    }
    const c = classifyResponse(res, err);
    const now = (/* @__PURE__ */ new Date()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    if (!c.ok) {
      dishareLast.className = "last bad";
      dishareLast.textContent = `${now}  \u2717  ${c.errorCode} \u2014 ${((_b = c.errorMessage) != null ? _b : "").slice(0, 120)}`;
      return;
    }
    const data = unwrap(res);
    const path = (_d = (_c = data == null ? void 0 : data.path) != null ? _c : res == null ? void 0 : res.path) != null ? _d : "?";
    const inner = (_e = data == null ? void 0 : data.error) != null ? _e : res == null ? void 0 : res.error;
    const cls = path === "dishare-denied" || path === "launch-denied" || path === "am-start-bounced" ? "bad" : "ok";
    dishareLast.className = `last ${cls}`;
    dishareLast.textContent = `${now}  ${cls === "ok" ? "\u2713" : "\u2717"}  path=${path}${inner ? ` \xB7 ${inner}` : ""}`;
  }
  document.getElementById("dishare-btn").addEventListener("click", () => fireDiShare("passenger"));
  document.getElementById("dishare-cluster-btn").addEventListener("click", () => fireDiShare("cluster"));
  document.getElementById("rerun-btn").addEventListener("click", () => {
    runAllProbes().catch((e) => console.error("sweep failed:", e));
  });
  (async () => {
    host = await whenHostReady();
    if (!host) {
      document.getElementById("notice").classList.add("shown");
      return;
    }
    runAllProbes().catch((e) => console.error("sweep failed:", e));
  })();
})();
