(() => {
  // src/app.js
  (async function() {
    var versionPill = document.getElementById("appVersionPill");
    if (versionPill) versionPill.textContent = "v" + window.PKG_LAUNCHER_VERSION;
    var ATTEMPTS = 0;
    function waitForBridge() {
      return new Promise(function(resolve, reject) {
        (function check() {
          if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
            return resolve(window.flutter_inappwebview);
          }
          if (++ATTEMPTS > 200) return reject(new Error("bridge missing"));
          setTimeout(check, 25);
        })();
      });
    }
    var bridge = await waitForBridge();
    async function call(name, args) {
      var raw = await bridge.callHandler(name, {
        params: args || {},
        idempotencyKey: "k" + Math.random().toString(16).slice(2)
      });
      if (raw && raw.success === false) {
        throw new Error(raw.error.code + ": " + raw.error.message);
      }
      return raw && raw.data || raw;
    }
    var state = {
      packages: [],
      // PackageInfo[]
      displays: [],
      // DisplaySnapshot[] — used to resolve role→id.
      // Holds the FULL list including hidden duplicates; consumers
      // that should ignore shadow displays (the picker, role
      // resolver) call visibleDisplays() instead.
      vehicle: null,
      // {variantId, friendlyName, dilinkFamily} — host 1.6+
      filter: "",
      pendingLaunch: null,
      // PackageInfo we're about to launch (modal selection)
      // packageName → displayId for every cluster launch this
      // session, in insertion order. Two consumers depend on
      // this map being accurate:
      //   * Clear iterates the keys and pkg.stop each.
      //   * Touchpad targets the LAST inserted displayId so the
      //     pad's gestures land on the slot where the user just
      //     put an app — not just whichever slot pickByRole's
      //     priority list happens to return first. The two can
      //     differ on Leopard 8 (overlay vs primary), and the
      //     user noticed: "touch pad uses wrong id for screen".
      clusterLaunches: /* @__PURE__ */ new Map(),
      padAttached: false,
      // cursor.attach state for the touchpad
      // 0.9.0 UX: MRU list of packages the user has launched
      // (most recent first, capped at RECENTS_MAX). Persisted so
      // the strip survives WebView reloads — older trims tear the
      // page down on backgrounding and we don't want recents to
      // evaporate every time the user switches apps.
      recents: [],
      // 0.9.0 UX: packageName → {role, displayId} of the LAST
      // target the user picked for this package. A subsequent
      // tap on the card relaunches on the same target without
      // reopening the picker. Long-press (550 ms) always opens
      // the picker so the user can override.
      lastTargets: {}
    };
    var RECENTS_KEY = "pkg-launcher.recents.v1";
    var TARGETS_KEY = "pkg-launcher.lastTargets.v1";
    var TIP_KEY = "pkg-launcher.tipShown.v1";
    var RECENTS_MAX = 8;
    function loadPersistence() {
      try {
        var r = localStorage.getItem(RECENTS_KEY);
        if (r) {
          var arr = JSON.parse(r);
          if (Array.isArray(arr)) state.recents = arr.slice(0, RECENTS_MAX);
        }
      } catch (_) {
      }
      try {
        var t = localStorage.getItem(TARGETS_KEY);
        if (t) {
          var obj = JSON.parse(t);
          if (obj && typeof obj === "object") state.lastTargets = obj;
        }
      } catch (_) {
      }
    }
    function saveRecents() {
      try {
        localStorage.setItem(RECENTS_KEY, JSON.stringify(state.recents));
      } catch (_) {
      }
    }
    function saveTargets() {
      try {
        localStorage.setItem(TARGETS_KEY, JSON.stringify(state.lastTargets));
      } catch (_) {
      }
    }
    function rememberLaunch(pkgName, role, displayId) {
      state.recents = [pkgName].concat(
        state.recents.filter(function(n) {
          return n !== pkgName;
        })
      ).slice(0, RECENTS_MAX);
      state.lastTargets[pkgName] = {
        role,
        displayId: displayId == null ? null : displayId
      };
      saveRecents();
      saveTargets();
      renderRecents();
      updateTargetBadgeFor(pkgName);
    }
    function targetStillReachable(t) {
      if (!t) return false;
      if (t.role === "ivi") return true;
      if (t.role === "cluster") {
        if (t.displayId != null) return true;
        return clusterPixelAvailable();
      }
      if (t.role === "passenger") return passengerLaunchAvailable();
      return false;
    }
    function $(s) {
      return document.querySelector(s);
    }
    function toast(msg, kind) {
      var el = $("#toast");
      el.textContent = msg;
      el.classList.toggle("err", kind === "err");
      el.classList.add("show");
      clearTimeout(el._t);
      el._t = setTimeout(function() {
        el.classList.remove("show");
      }, 2200);
    }
    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, function(c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
      });
    }
    function pickByRole(role) {
      if (role === "ivi") return null;
      var pool = visibleDisplays();
      if (role === "cluster") {
        var d = pool.find(function(x) {
          return roleOf(x) === "cluster" && /_1$/.test(x.name || "");
        });
        return d ? d.id : null;
      }
      var match = pool.find(function(x) {
        return roleOf(x) === role;
      });
      return match ? match.id : null;
    }
    function visibleDisplays() {
      return state.displays.filter(function(d) {
        return !d.hidden;
      });
    }
    function resolveDriverTarget() {
      var pool = visibleDisplays();
      var cluster = pool.find(function(d) {
        return roleOf(d) === "cluster" && /_1$/.test(d.name || "");
      });
      if (cluster) {
        return {
          kind: "cluster",
          op: "pkg.launch_cluster",
          displayId: cluster.id,
          isFallback: false
        };
      }
      var driverPanel = pool.find(function(d) {
        return roleOf(d) === "passenger" && d.overrideLabel === "Driver";
      });
      if (driverPanel) {
        return {
          kind: "panel",
          op: "pkg.launch",
          displayId: driverPanel.id,
          isFallback: true
        };
      }
      return {
        kind: "none",
        reason: "No driver-eyeline display on " + trimLabel()
      };
    }
    function hasVehicleCap(name) {
      return state.vehicle && Array.isArray(state.vehicle.capabilities) && state.vehicle.capabilities.includes(name);
    }
    function vehicleCapsKnown() {
      return !!(state.vehicle && Array.isArray(state.vehicle.capabilities));
    }
    function clusterPixelAvailable() {
      if (vehicleCapsKnown()) {
        return hasVehicleCap("pkg.launch.cluster.pixel") && pickByRole("cluster") != null;
      }
      if (state.displays.length === 0) return true;
      return state.displays.some(function(d) {
        return roleOf(d) === "cluster" && d.clusterAvailable !== false;
      });
    }
    function passengerLaunchAvailable() {
      if (vehicleCapsKnown()) {
        return hasVehicleCap("pkg.launch.passenger") || hasVehicleCap("pkg.launch.dishare");
      }
      return pickByRole("passenger") != null;
    }
    function trimLabel() {
      var v = state.vehicle;
      return v && (v.friendlyName || v.variantId) || "this car";
    }
    function clusterMissingReason() {
      if (!vehicleCapsKnown()) return "Cluster not detected on this host";
      return "Cluster pixel rendering not supported on " + trimLabel() + " (need pkg.launch.cluster.pixel)";
    }
    function passengerMissingReason() {
      if (!vehicleCapsKnown()) return "Passenger panel not detected on this host";
      return "Passenger launch not available on " + trimLabel() + " (need pkg.launch.passenger or pkg.launch.dishare)";
    }
    function roleOf(d) {
      if (d && d.role) return d.role;
      if (d && d.isDefault) return "ivi";
      if (d && d.isCluster) return "cluster";
      return "passenger";
    }
    async function loadDisplays() {
      var r = await call("display.list");
      state.displays = r && r.displays || [];
      state.vehicle = r && r.vehicle || null;
      if (typeof Sentry !== "undefined" && state.vehicle) {
        var v = state.vehicle;
        Sentry.getCurrentScope().setTags({
          "car.variant": v.variantId || "unknown",
          "car.subTrim": v.subTrim || "",
          "car.dilinkFamily": v.dilinkFamily || "unknown",
          "car.friendlyName": v.friendlyName || "",
          "car.isFallback": String(v.isFallback === true)
        });
      }
      renderTrimPill();
    }
    function renderTrimPill() {
      var pill = $("#trimPill");
      if (!pill) return;
      var v = state.vehicle;
      var label = v && (v.friendlyName || v.variantId || v.dilinkFamily);
      if (!label) {
        pill.hidden = true;
        return;
      }
      var detail = v.variantId && v.friendlyName !== v.variantId ? " (" + v.variantId + ")" : "";
      if (v.isFallback) {
        pill.textContent = label + detail + " \xB7 best-effort";
        pill.classList.add("fallback");
      } else {
        pill.textContent = label + detail;
        pill.classList.remove("fallback");
      }
      pill.hidden = false;
    }
    async function loadPackages() {
      try {
        var r = await call("pkg.list", { includeSystem: false });
        state.packages = r && r.packages || [];
        renderPackages();
      } catch (e) {
        $("#list").innerHTML = '<div class="empty">pkg.list failed: ' + escapeHtml(e && e.message) + "</div>";
      }
    }
    function filteredPackages() {
      var q = state.filter.trim().toLowerCase();
      if (!q) return state.packages;
      return state.packages.filter(function(p) {
        return (p.label || "").toLowerCase().includes(q) || (p.packageName || "").toLowerCase().includes(q);
      });
    }
    var iconCache = /* @__PURE__ */ new Map();
    var iconInflight = /* @__PURE__ */ new Map();
    async function fetchIconDataUrl(packageName, iconHash) {
      if (!iconHash) return null;
      if (iconCache.has(iconHash)) return iconCache.get(iconHash);
      if (iconInflight.has(iconHash)) return iconInflight.get(iconHash);
      var p = (async function() {
        try {
          var r = await call("pkg.icon", { packageName });
          if (r && r.ok && r.pngBase64) {
            var dataUrl = "data:image/png;base64," + r.pngBase64;
            iconCache.set(iconHash, dataUrl);
            return dataUrl;
          }
        } catch (_) {
        }
        iconCache.set(iconHash, null);
        return null;
      })();
      iconInflight.set(iconHash, p);
      p.finally(function() {
        iconInflight.delete(iconHash);
      });
      return p;
    }
    var iconObserver = null;
    function getIconObserver() {
      if (iconObserver) return iconObserver;
      if (typeof IntersectionObserver === "undefined") return null;
      iconObserver = new IntersectionObserver(
        function(entries) {
          entries.forEach(function(entry) {
            if (!entry.isIntersecting) return;
            var img = entry.target;
            iconObserver.unobserve(img);
            var pkg = img.dataset.pkg;
            var hash = img.dataset.iconHash;
            fetchIconDataUrl(pkg, hash).then(function(dataUrl) {
              if (dataUrl) {
                img.src = dataUrl;
                img.classList.add("loaded");
              }
            });
          });
        },
        { rootMargin: "200px 0px" }
        // pre-warm cards within 200px of viewport
      );
      return iconObserver;
    }
    function buildIconCell(p, opts) {
      opts = opts || {};
      var initial = (p.label || p.packageName || "?").replace(/[^a-zA-Z0-9]/g, "").slice(0, 1).toUpperCase() || "?";
      var cachedSrc = p.iconHash ? iconCache.get(p.iconHash) : null;
      var inner;
      if (cachedSrc) {
        inner = '<span class="icon-fallback" aria-hidden="true">' + escapeHtml(initial) + '</span><img class="icon-img loaded" alt="" src="' + cachedSrc + '">';
      } else if (p.iconHash) {
        inner = '<span class="icon-fallback" aria-hidden="true">' + escapeHtml(initial) + '</span><img class="icon-img" alt="" data-pkg="' + escapeHtml(p.packageName) + '" data-icon-hash="' + escapeHtml(p.iconHash) + '">';
      } else {
        inner = escapeHtml(initial);
      }
      var running = opts.showRunning && state.clusterLaunches.has(p.packageName) ? '<span class="running-dot" aria-hidden="true"></span>' : "";
      var badge = "";
      if (opts.showTargetBadge) {
        var t = state.lastTargets[p.packageName];
        if (t) {
          badge = '<span class="target-badge ' + t.role + '" aria-hidden="true" title="Tap launches on ' + targetLabel(t.role) + '">' + targetLetter(t.role) + "</span>";
        }
      }
      return '<div class="icon">' + running + inner + badge + "</div>";
    }
    function targetLetter(role) {
      return role === "cluster" ? "D" : role === "passenger" ? "P" : "H";
    }
    function targetLabel(role) {
      return role === "cluster" ? "Driver" : role === "passenger" ? "Passenger" : "Head Unit";
    }
    function attachLaunchHandlers(el, p) {
      var pressTimer = null;
      var pressFired = false;
      var startX = 0;
      var startY = 0;
      var maxDelta = 0;
      el.addEventListener("pointerdown", function(e) {
        pressFired = false;
        maxDelta = 0;
        startX = e.clientX;
        startY = e.clientY;
        if (pressTimer != null) clearTimeout(pressTimer);
        pressTimer = setTimeout(function() {
          pressFired = true;
          pressTimer = null;
          openTargetPicker(p);
        }, 550);
      });
      el.addEventListener("pointermove", function(e) {
        var d = Math.hypot(e.clientX - startX, e.clientY - startY);
        if (d > maxDelta) maxDelta = d;
        if (pressTimer != null && d > 12) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      });
      function cancelPress() {
        if (pressTimer != null) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      }
      el.addEventListener("pointerup", cancelPress);
      el.addEventListener("pointercancel", cancelPress);
      el.addEventListener("pointerleave", cancelPress);
      function smartTap() {
        if (pressFired) {
          pressFired = false;
          return;
        }
        if (maxDelta > 12) return;
        var t = state.lastTargets[p.packageName];
        if (t && targetStillReachable(t)) {
          launchOnRole(p, t.role, t.displayId);
          try {
            if (!localStorage.getItem(TIP_KEY)) {
              toast("Long-press a card to send to a different screen");
              localStorage.setItem(TIP_KEY, "1");
            }
          } catch (_) {
          }
        } else {
          openTargetPicker(p);
        }
      }
      el.addEventListener("click", smartTap);
      el.addEventListener("keydown", function(e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          smartTap();
        }
      });
    }
    function updateRunningStates() {
      document.querySelectorAll("[data-package]").forEach(function(el) {
        var name = el.getAttribute("data-package");
        var iconBox = el.querySelector(".icon");
        if (!iconBox) return;
        var hasDot = !!iconBox.querySelector(".running-dot");
        var shouldHave = state.clusterLaunches.has(name);
        if (shouldHave && !hasDot) {
          var dot = document.createElement("span");
          dot.className = "running-dot";
          dot.setAttribute("aria-hidden", "true");
          iconBox.insertBefore(dot, iconBox.firstChild);
        } else if (!shouldHave && hasDot) {
          iconBox.querySelector(".running-dot").remove();
        }
      });
    }
    function updateTargetBadgeFor(pkgName) {
      var t = state.lastTargets[pkgName];
      document.querySelectorAll("[data-package]").forEach(function(el) {
        if (el.getAttribute("data-package") !== pkgName) return;
        var iconBox = el.querySelector(".icon");
        if (!iconBox) return;
        var existing = iconBox.querySelector(".target-badge");
        if (existing) existing.remove();
        if (!t) return;
        if (el.classList.contains("recent-card")) return;
        var badge = document.createElement("span");
        badge.className = "target-badge " + t.role;
        badge.setAttribute("aria-hidden", "true");
        badge.title = "Tap launches on " + targetLabel(t.role);
        badge.textContent = targetLetter(t.role);
        iconBox.appendChild(badge);
      });
    }
    function renderRecents() {
      var section = $("#recentsSection");
      var row = $("#recentsRow");
      if (!section || !row) return;
      var pkgIndex = {};
      state.packages.forEach(function(p) {
        pkgIndex[p.packageName] = p;
      });
      var visible = state.recents.filter(function(name) {
        return pkgIndex[name];
      });
      if (visible.length === 0) {
        section.hidden = true;
        row.innerHTML = "";
        return;
      }
      section.hidden = false;
      row.innerHTML = "";
      var observer = getIconObserver();
      visible.forEach(function(name) {
        var p = pkgIndex[name];
        var card = document.createElement("div");
        card.className = "recent-card";
        card.setAttribute("role", "button");
        card.setAttribute("data-package", p.packageName);
        card.setAttribute("aria-label", "Relaunch " + (p.label || p.packageName));
        card.tabIndex = 0;
        card.innerHTML = buildIconCell(p, { showRunning: true, showTargetBadge: false }) + '<div class="name">' + escapeHtml(p.label || p.packageName) + "</div>";
        attachLaunchHandlers(card, p);
        row.appendChild(card);
        var cachedSrc = p.iconHash ? iconCache.get(p.iconHash) : null;
        if (observer && p.iconHash && !cachedSrc) {
          var img = card.querySelector(".icon-img:not(.loaded)");
          if (img) observer.observe(img);
        }
      });
    }
    function updateClearButton() {
      var btn = $("#clearBtn");
      var badge = $("#clearBadge");
      if (!btn) return;
      var n = state.clusterLaunches.size;
      if (n === 0) {
        btn.setAttribute("disabled", "");
        btn.title = "Nothing on the driver screen yet";
      } else {
        btn.removeAttribute("disabled");
        btn.title = "Stop " + n + " app" + (n === 1 ? "" : "s") + " on the driver screen";
      }
      if (badge) {
        badge.textContent = String(n);
        badge.hidden = n === 0;
      }
    }
    function renderPackages() {
      var host = $("#list");
      var header = $("#gridHeader");
      var matches = filteredPackages();
      $("#count").textContent = matches.length;
      if (matches.length === 0) {
        if (header) header.hidden = true;
        host.innerHTML = '<div class="empty">No apps match.</div>';
        return;
      }
      if (header) header.hidden = state.recents.length === 0;
      host.innerHTML = "";
      var observer = getIconObserver();
      matches.forEach(function(p) {
        var card = document.createElement("div");
        card.className = "card";
        card.setAttribute("role", "button");
        card.setAttribute("data-package", p.packageName);
        card.setAttribute("aria-label", "Launch " + (p.label || p.packageName));
        card.tabIndex = 0;
        card.innerHTML = buildIconCell(p, { showRunning: true, showTargetBadge: true }) + '<div class="name" title="' + escapeHtml(p.packageName) + '">' + escapeHtml(p.label || p.packageName) + "</div>";
        attachLaunchHandlers(card, p);
        host.appendChild(card);
        var cachedSrc = p.iconHash ? iconCache.get(p.iconHash) : null;
        if (observer && p.iconHash && !cachedSrc) {
          var img = card.querySelector(".icon-img:not(.loaded)");
          if (img) observer.observe(img);
        }
      });
    }
    var ADV_KEY = "pkg-launcher.advanced-targets.v1";
    var advancedSlots = true;
    try {
      var stored = localStorage.getItem(ADV_KEY);
      if (stored != null) advancedSlots = stored === "1";
    } catch (_) {
    }
    function applyAdvanced() {
      var grid = $("#targetGrid");
      var btn = $("#advToggle");
      if (advancedSlots) {
        grid.classList.add("show-advanced");
        btn.classList.add("on");
      } else {
        grid.classList.remove("show-advanced");
        btn.classList.remove("on");
      }
    }
    $("#advToggle").addEventListener("click", function() {
      advancedSlots = !advancedSlots;
      try {
        localStorage.setItem(ADV_KEY, advancedSlots ? "1" : "0");
      } catch (_) {
      }
      applyAdvanced();
    });
    function openTargetPicker(pkg) {
      state.pendingLaunch = pkg;
      $("#targetTitle").textContent = pkg.label || pkg.packageName;
      $("#targetSub").textContent = pkg.packageName;
      var fallback = $("#targetIconFallback");
      var img = $("#targetIconImg");
      if (fallback) {
        var initial = (pkg.label || pkg.packageName || "?").replace(/[^a-zA-Z0-9]/g, "").slice(0, 1).toUpperCase() || "?";
        fallback.textContent = initial;
      }
      if (img) {
        img.classList.remove("loaded");
        img.removeAttribute("src");
        var cachedSrc = pkg.iconHash ? iconCache.get(pkg.iconHash) : null;
        if (cachedSrc) {
          img.src = cachedSrc;
          img.classList.add("loaded");
        } else if (pkg.iconHash) {
          var pendingHash = pkg.iconHash;
          fetchIconDataUrl(pkg.packageName, pkg.iconHash).then(function(dataUrl) {
            if (!dataUrl) return;
            if (!state.pendingLaunch || state.pendingLaunch.iconHash !== pendingHash) return;
            img.src = dataUrl;
            img.classList.add("loaded");
          });
        }
      }
      applyAdvanced();
      var grid = $("#targetGrid");
      var clusterOk = clusterPixelAvailable();
      var passengerOk = passengerLaunchAvailable();
      var fb = !!(state.vehicle && state.vehicle.isFallback);
      grid.querySelectorAll(".target-card").forEach(function(card) {
        var role = card.dataset.role;
        var explicitId = card.dataset.displayId ? parseInt(card.dataset.displayId, 10) : null;
        var available;
        var unavailableReason = null;
        if (role === "ivi") {
          available = true;
        } else if (role === "cluster") {
          if (explicitId != null) {
            available = true;
          } else {
            var t = resolveDriverTarget();
            available = t.kind !== "none";
            if (!available) unavailableReason = t.reason;
          }
        } else if (role === "passenger") {
          if (!passengerOk) {
            available = false;
            unavailableReason = passengerMissingReason();
          } else {
            available = pickByRole("passenger") != null || hasVehicleCap("pkg.launch.dishare");
            if (!available) unavailableReason = "No passenger display present";
          }
        } else {
          available = pickByRole(role) != null;
        }
        card.classList.toggle("disabled", !available);
        if (!available) {
          card.title = unavailableReason || "";
        } else if (fb && role !== "ivi") {
          card.title = "Best-effort on " + trimLabel() + " \u2014 capability list is an aggregate";
        } else {
          card.removeAttribute("title");
        }
      });
      $("#targetModal").classList.add("show");
    }
    function closeTargetPicker() {
      state.pendingLaunch = null;
      $("#targetModal").classList.remove("show");
    }
    document.addEventListener("click", function(e) {
      var closeBtn = e.target.closest('[data-close="target"]');
      if (closeBtn) return closeTargetPicker();
      var card = e.target.closest(".target-card");
      if (card && !card.classList.contains("disabled") && state.pendingLaunch) {
        var explicitId = card.dataset.displayId ? parseInt(card.dataset.displayId, 10) : null;
        launchOnRole(state.pendingLaunch, card.dataset.role, explicitId);
        closeTargetPicker();
      }
    });
    async function launchOnRole(pkg, role, explicitDisplayId) {
      var args = { packageName: pkg.packageName };
      var op = "pkg.launch";
      if (role === "cluster") {
        if (explicitDisplayId != null) {
          op = "pkg.launch_cluster";
          args.displayId = explicitDisplayId;
        } else {
          var t = resolveDriverTarget();
          if (t.kind === "none") {
            toast(t.reason, "err");
            return;
          }
          op = t.op;
          args.displayId = t.displayId;
          if (t.isFallback) {
            toast(pkg.label + " \u2192 driver panel (no cluster on " + trimLabel() + ")");
          }
        }
      } else if (role === "passenger") {
        var passengerId = pickByRole("passenger");
        if (passengerId != null) {
          args.displayId = passengerId;
        } else if (hasVehicleCap("pkg.launch.dishare")) {
          args.targetRole = "passenger";
        } else {
          toast("No passenger display detected", "err");
          return;
        }
      }
      var idLabel = args.displayId != null ? " [d=" + args.displayId + "]" : "";
      try {
        var r = await call(op, args);
        if (!r.ok) {
          if (r.path === "am-start-bounced") {
            toast(pkg.label + idLabel + ": fell back to IVI \u2014 try again or open here", "err");
            return;
          }
          toast(pkg.label + idLabel + ": " + (r.error || r.path || "denied"), "err");
          return;
        }
        var pathLabel = r.path === "am-start-rePinned" ? "launched (recovered)" : r.path || "launched";
        toast(pkg.label + idLabel + " \u2192 " + pathLabel);
        if (role === "cluster") {
          state.clusterLaunches.set(pkg.packageName, args.displayId);
          updateRunningStates();
          updateClearButton();
        }
        rememberLaunch(pkg.packageName, role, args.displayId == null ? null : args.displayId);
      } catch (e) {
        toast("launch failed: " + (e && e.message), "err");
      }
    }
    $("#clearBtn").addEventListener("click", async function() {
      if (state.clusterLaunches.size === 0) {
        toast("No app to clear \u2014 driver screen unchanged");
        return;
      }
      var pkgs = Array.from(state.clusterLaunches.keys());
      var stopped = [];
      var failed = [];
      for (var i = 0; i < pkgs.length; i++) {
        var pkg = pkgs[i];
        try {
          var r = await call("pkg.stop", { packageName: pkg });
          if (r && r.ok) {
            stopped.push(pkg);
            state.clusterLaunches.delete(pkg);
          } else {
            failed.push(pkg + " (" + (r && (r.error || r.path) || "no response") + ")");
          }
        } catch (e) {
          failed.push(pkg + " (" + (e && e.message) + ")");
        }
      }
      if (failed.length === 0) {
        toast("Driver screen cleared (" + stopped.length + ")");
      } else {
        toast(
          "cleared " + stopped.length + ", failed " + failed.length + ": " + failed.join("; "),
          "err"
        );
      }
      updateRunningStates();
      updateClearButton();
    });
    var pad = $("#pad");
    var padStatus = $("#padStatus");
    var padSub = $("#padSub");
    var dragging = false;
    state.padDisplayId = null;
    function defaultPadId() {
      return pickByRole("cluster");
    }
    function refreshPadSub() {
      if (state.padDisplayId == null) {
        padSub.textContent = "no cluster";
        return;
      }
      var d = state.displays.find(function(x) {
        return x.id === state.padDisplayId;
      });
      var override = d && d.overrideLabel;
      var name = d ? d.name || "" : "";
      var slot = override || (/_1$/.test(name) ? "overlay" : /_0$/.test(name) ? "primary" : /^fission_bg_/i.test(name) ? "base" : "");
      padSub.textContent = "displayId=" + state.padDisplayId + (slot ? " \xB7 " + slot : "");
    }
    $("#touchpadBtn").addEventListener("click", async function() {
      var resolved = pickByRole("cluster");
      if (resolved == null) {
        var nonDefault = state.displays.find(function(d) {
          return !d.isDefault;
        });
        resolved = nonDefault ? nonDefault.id : 0;
        toast("Touchpad on display " + resolved + " (no cluster resolved)", "info");
      }
      state.padDisplayId = resolved;
      state.padAttached = false;
      refreshPadSub();
      renderPadTargetRow();
      padStatus.textContent = "Idle";
      $("#touchpadModal").classList.add("show");
    });
    function renderPadTargetRow() {
      var row = $("#padTargetRow");
      if (!row) return;
      row.innerHTML = "";
      var displays = state.displays || [];
      if (displays.length === 0) {
        row.innerHTML = '<span class="pad-info" style="padding:8px 12px">No displays reported</span>';
        return;
      }
      displays.forEach(function(d) {
        var chip = document.createElement("div");
        chip.className = "pad-target-chip" + (d.id === state.padDisplayId ? " on" : "");
        var lbl = d.overrideLabel || (d.isDefault ? "Head Unit" : null) || (d.name && d.name.toLowerCase() === "fse" ? "FSE" : null) || (d.isCluster ? "Cluster" : null) || d.name || "Display";
        chip.textContent = "[" + d.id + "] " + lbl;
        var hints = [];
        if (d.hidden) hints.push("flagged hidden by profile");
        if (d.isDefault) hints.push("default IVI");
        if (hints.length) chip.title = hints.join(" \xB7 ");
        chip.addEventListener("click", async function() {
          if (d.id === state.padDisplayId) return;
          var prev = state.padDisplayId;
          state.padDisplayId = d.id;
          if (state.padAttached && prev != null) {
            try {
              await call("cursor.detach", { targetDisplayId: prev });
            } catch (_) {
            }
          }
          state.padAttached = false;
          refreshPadSub();
          renderPadTargetRow();
          padStatus.textContent = "Retargeted to displayId=" + d.id;
        });
        row.appendChild(chip);
      });
    }
    document.addEventListener("click", function(e) {
      if (e.target.closest('[data-close="touchpad"]')) {
        $("#touchpadModal").classList.remove("show");
      }
    });
    var modalDownTarget = null;
    document.addEventListener("pointerdown", function(e) {
      var modal = e.target.closest(".modal.show");
      modalDownTarget = modal && e.target === modal ? modal : null;
    });
    document.addEventListener("click", function(e) {
      if (modalDownTarget && e.target === modalDownTarget && e.target.classList.contains("modal") && e.target.classList.contains("show")) {
        e.target.classList.remove("show");
        if (e.target.id === "targetModal") state.pendingLaunch = null;
      }
      modalDownTarget = null;
    });
    function padToCluster(e) {
      var rect = pad.getBoundingClientRect();
      var fx = (e.clientX - rect.left) / Math.max(1, rect.width);
      var fy = (e.clientY - rect.top) / Math.max(1, rect.height);
      fx = Math.min(Math.max(fx, 0), 1);
      fy = Math.min(Math.max(fy, 0), 1);
      return {
        x: Math.round(fx * 1920),
        y: Math.round(fy * 720)
      };
    }
    function padDotPosition(e) {
      var rect = pad.getBoundingClientRect();
      return {
        left: e.clientX - rect.left,
        top: e.clientY - rect.top
      };
    }
    async function ensurePadAttached() {
      if (state.padAttached) return;
      var clusterId = state.padDisplayId;
      if (clusterId == null) return;
      try {
        var r = await call("cursor.attach", {
          targetDisplayId: clusterId,
          style: "dot"
        });
        state.padAttached = !!(r && r.ok);
      } catch (e) {
      }
    }
    var padDot = $("#padDot");
    function moveDot(e) {
      var p = padDotPosition(e);
      padDot.style.left = p.left + "px";
      padDot.style.top = p.top + "px";
    }
    var LONG_PRESS_MS = 500;
    var LONG_PRESS_TOL_PX = 10;
    var SWIPE_THRESH_PX = 30;
    var TAP_MAX_MS = 350;
    var activePointers = /* @__PURE__ */ new Map();
    var sessionMultiTouch = false;
    var longPressTimer = null;
    var longPressFired = false;
    var cursorClusterPos = { x: 960, y: 360 };
    function padPxToCluster(clientX, clientY) {
      var rect = pad.getBoundingClientRect();
      var fx = (clientX - rect.left) / Math.max(1, rect.width);
      var fy = (clientY - rect.top) / Math.max(1, rect.height);
      fx = Math.min(Math.max(fx, 0), 1);
      fy = Math.min(Math.max(fy, 0), 1);
      return { x: Math.round(fx * 1920), y: Math.round(fy * 720) };
    }
    function clearLongPress() {
      if (longPressTimer != null) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }
    async function fireLongPressFor(p) {
      longPressFired = true;
      var c = padPxToCluster(p.startX, p.startY);
      var clusterId = state.padDisplayId;
      padStatus.textContent = "Long-press (" + c.x + ", " + c.y + ")";
      try {
        var r = await call("gesture.longPress", {
          displayId: clusterId,
          x: c.x,
          y: c.y,
          durationMs: LONG_PRESS_MS
        });
        if (!r || r.ok === false) {
          padStatus.textContent = "Long-press failed: " + (r && r.error ? r.error : "denied");
        }
      } catch (err) {
        padStatus.textContent = "Long-press failed: " + (err && err.message);
      }
    }
    function resetSession() {
      clearLongPress();
      longPressFired = false;
      sessionMultiTouch = false;
    }
    pad.addEventListener("pointerdown", async function(e) {
      pad.setPointerCapture(e.pointerId);
      activePointers.set(e.pointerId, {
        startX: e.clientX,
        startY: e.clientY,
        currentX: e.clientX,
        currentY: e.clientY,
        startAt: Date.now(),
        maxDeltaPx: 0
      });
      if (activePointers.size === 1) {
        pad.classList.add("touched");
        moveDot(e);
        padDot.classList.add("show");
        longPressFired = false;
        clearLongPress();
        longPressTimer = setTimeout(function() {
          var p = activePointers.get(e.pointerId);
          if (activePointers.size === 1 && p && p.maxDeltaPx <= LONG_PRESS_TOL_PX) {
            fireLongPressFor(p);
          }
        }, LONG_PRESS_MS);
        await ensurePadAttached();
        if (state.padAttached) {
          cursorClusterPos = padToCluster(e);
          call("cursor.move", cursorClusterPos).catch(function() {
          });
        }
        padStatus.textContent = "Dragging\u2026";
      } else if (activePointers.size === 2) {
        sessionMultiTouch = true;
        pad.classList.add("two-finger");
        padDot.classList.remove("show");
        clearLongPress();
        padStatus.textContent = "2-finger gesture\u2026";
      }
    });
    pad.addEventListener("pointermove", function(e) {
      var p = activePointers.get(e.pointerId);
      if (!p) return;
      p.currentX = e.clientX;
      p.currentY = e.clientY;
      var d = Math.hypot(e.clientX - p.startX, e.clientY - p.startY);
      if (d > p.maxDeltaPx) p.maxDeltaPx = d;
      if (longPressTimer != null && d > LONG_PRESS_TOL_PX) {
        clearLongPress();
      }
      if (!sessionMultiTouch && activePointers.size === 1) {
        moveDot(e);
        if (state.padAttached) {
          cursorClusterPos = padToCluster(e);
          call("cursor.move", cursorClusterPos).catch(function() {
          });
        }
      }
    });
    pad.addEventListener("pointerup", async function(e) {
      var p = activePointers.get(e.pointerId);
      activePointers.delete(e.pointerId);
      try {
        pad.releasePointerCapture(e.pointerId);
      } catch (_) {
      }
      if (sessionMultiTouch) {
        if (activePointers.size > 0) {
          return;
        }
        pad.classList.remove("two-finger");
        var clusterId = state.padDisplayId;
        var fromC = padPxToCluster(p.startX, p.startY);
        var toC = padPxToCluster(p.currentX, p.currentY);
        var dx = p.currentX - p.startX;
        var dy = p.currentY - p.startY;
        var moved = Math.hypot(dx, dy);
        var dur = Date.now() - p.startAt;
        if (moved < SWIPE_THRESH_PX && dur < TAP_MAX_MS) {
          padStatus.textContent = "2-finger tap \u2192 long-press (" + fromC.x + ", " + fromC.y + ")";
          try {
            var r = await call("gesture.longPress", {
              displayId: clusterId,
              x: fromC.x,
              y: fromC.y,
              durationMs: LONG_PRESS_MS
            });
            if (!r || r.ok === false) {
              padStatus.textContent = "2-finger long-press failed: " + (r && r.error ? r.error : "denied");
            }
          } catch (err) {
            padStatus.textContent = "2-finger long-press failed: " + (err && err.message);
          }
          resetSession();
          return;
        }
        var scrollDur = Math.max(120, dur);
        padStatus.textContent = "2-finger scroll (" + fromC.x + "," + fromC.y + " \u2192 " + toC.x + "," + toC.y + ")";
        try {
          var sr = await call("gesture.swipe", {
            displayId: clusterId,
            fromX: fromC.x,
            fromY: fromC.y,
            toX: toC.x,
            toY: toC.y,
            durationMs: scrollDur
          });
          if (!sr || sr.ok === false) {
            padStatus.textContent = "2-finger scroll failed: " + (sr && sr.error ? sr.error : "denied");
          }
        } catch (err) {
          padStatus.textContent = "2-finger scroll failed: " + (err && err.message);
        }
        resetSession();
        return;
      }
      padDot.classList.remove("show");
      if (longPressFired) {
        resetSession();
        return;
      }
      clearLongPress();
      if (!p) return;
      var clusterId2 = state.padDisplayId;
      var from = padPxToCluster(p.startX, p.startY);
      var to = padPxToCluster(p.currentX, p.currentY);
      if (p.maxDeltaPx >= SWIPE_THRESH_PX) {
        var durationMs = Math.max(50, Date.now() - p.startAt);
        padStatus.textContent = "Swipe (" + from.x + "," + from.y + " \u2192 " + to.x + "," + to.y + ")";
        try {
          var r2 = await call("gesture.swipe", {
            displayId: clusterId2,
            fromX: from.x,
            fromY: from.y,
            toX: to.x,
            toY: to.y,
            durationMs
          });
          if (!r2 || r2.ok === false) {
            padStatus.textContent = "Swipe failed: " + (r2 && r2.error ? r2.error : "denied");
          }
        } catch (err) {
          padStatus.textContent = "Swipe failed: " + (err && err.message);
        }
        resetSession();
        return;
      }
      padStatus.textContent = "Tap (" + to.x + ", " + to.y + ")";
      try {
        var rt = await call("gesture.tap", {
          displayId: clusterId2,
          x: to.x,
          y: to.y
        });
        if (!rt || rt.ok === false) {
          padStatus.textContent = "Tap failed: " + (rt && rt.error ? rt.error : "denied");
        }
      } catch (err) {
        padStatus.textContent = "Tap failed: " + (err && err.message);
      }
      resetSession();
    });
    pad.addEventListener("pointercancel", function(e) {
      activePointers.delete(e.pointerId);
      if (activePointers.size === 0) {
        padDot.classList.remove("show");
        pad.classList.remove("two-finger");
        resetSession();
      }
    });
    var searchInput = $("#search");
    var searchClear = $("#searchClear");
    var kbdHint = $("#kbdHint");
    function reflectSearchAffordances() {
      var has = state.filter.length > 0;
      if (searchClear) searchClear.classList.toggle("show", has);
      if (kbdHint) kbdHint.classList.toggle("hide", has);
    }
    searchInput.addEventListener("input", function(e) {
      state.filter = e.target.value;
      reflectSearchAffordances();
      renderPackages();
    });
    if (searchClear) {
      searchClear.addEventListener("click", function() {
        searchInput.value = "";
        state.filter = "";
        reflectSearchAffordances();
        renderPackages();
        searchInput.focus();
      });
    }
    document.addEventListener("keydown", function(e) {
      var openModal = document.querySelector(".modal.show");
      if (openModal && e.key === "Escape") {
        openModal.classList.remove("show");
        if (openModal.id === "targetModal") state.pendingLaunch = null;
        e.preventDefault();
        return;
      }
      var inField = e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");
      if (e.key === "/" && !inField && !openModal) {
        e.preventDefault();
        searchInput.focus();
        try {
          searchInput.select();
        } catch (_) {
        }
        return;
      }
      if (e.key === "Escape" && e.target === searchInput) {
        if (state.filter) {
          searchInput.value = "";
          state.filter = "";
          reflectSearchAffordances();
          renderPackages();
        } else {
          searchInput.blur();
        }
      }
    });
    loadPersistence();
    updateClearButton();
    await loadDisplays();
    await loadPackages();
    renderRecents();
  })().catch(function(e) {
    document.getElementById("list").innerHTML = '<div class="empty">init failed: ' + (e && e.message) + "</div>";
  });
})();
