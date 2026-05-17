(() => {
  // webview-doctor/src/app.js
  (function() {
    "use strict";
    var ERRORS = [];
    function recordError(where, e) {
      var msg;
      try {
        msg = e && e.message ? e.message : String(e);
      } catch (_) {
        msg = "[unstringifiable error]";
      }
      var stack = "";
      try {
        stack = e && e.stack ? String(e.stack).split("\n").slice(0, 3).join(" | ") : "";
      } catch (_) {
      }
      ERRORS.push(where + ": " + msg + (stack ? "  {" + stack + "}" : ""));
    }
    try {
      if (typeof window !== "undefined" && window.addEventListener) {
        window.addEventListener("error", function(ev) {
          recordError("window.onerror", ev && ev.error || ev && ev.message || ev);
        });
        window.addEventListener("unhandledrejection", function(ev) {
          recordError("unhandledrejection", ev && ev.reason);
        });
      }
    } catch (_) {
    }
    var G = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {};
    function now() {
      try {
        if (G.performance && typeof G.performance.now === "function") {
          return G.performance.now();
        }
      } catch (_) {
      }
      return Date.now();
    }
    var T0 = now();
    function resolveHost() {
      try {
        var branded = G.__i99dashHost;
        if (branded && typeof branded.callHandler === "function") return branded;
        var legacy = G.flutter_inappwebview;
        if (legacy && typeof legacy.callHandler === "function") return legacy;
      } catch (_) {
      }
      return null;
    }
    var DIAG = {
      app: "webview-doctor",
      appVersion: "0.1.0",
      at: (/* @__PURE__ */ new Date()).toISOString(),
      host: {
        readyAtSync: false,
        readyVia: null,
        // 'sync' | 'event' | 'poll' | 'timeout(null)' | 'timeout(late)'
        readyMs: null,
        which: null,
        // '__i99dashHost' | 'flutter_inappwebview' | null
        eventHub: null
      },
      webview: {},
      features: {},
      bridge: {},
      errors: ERRORS
    };
    function hostWhich() {
      try {
        if (G.__i99dashHost && typeof G.__i99dashHost.callHandler === "function")
          return "__i99dashHost";
        if (G.flutter_inappwebview && typeof G.flutter_inappwebview.callHandler === "function")
          return "flutter_inappwebview";
      } catch (_) {
      }
      return null;
    }
    function whenHostReady(timeoutMs) {
      timeoutMs = timeoutMs || 8e3;
      return new Promise(function(resolve) {
        var immediate = resolveHost();
        if (immediate) {
          DIAG.host.readyAtSync = true;
          DIAG.host.readyVia = "sync";
          DIAG.host.readyMs = Math.round(now() - T0);
          DIAG.host.which = hostWhich();
          return resolve(immediate);
        }
        var w = typeof window !== "undefined" ? window : null;
        var settled = false;
        var poll, timer;
        function finish(h, via) {
          if (settled) return;
          settled = true;
          try {
            if (w && w.removeEventListener)
              w.removeEventListener("flutterInAppWebViewPlatformReady", onReady);
          } catch (_) {
          }
          try {
            clearInterval(poll);
          } catch (_) {
          }
          try {
            clearTimeout(timer);
          } catch (_) {
          }
          DIAG.host.readyMs = Math.round(now() - T0);
          DIAG.host.readyVia = via;
          DIAG.host.which = hostWhich();
          resolve(h);
        }
        function tryNow(via) {
          var h = resolveHost();
          if (h) finish(h, via);
        }
        var onReady = function() {
          tryNow("event");
        };
        try {
          if (w && w.addEventListener)
            w.addEventListener("flutterInAppWebViewPlatformReady", onReady);
        } catch (_) {
        }
        poll = setInterval(function() {
          tryNow("poll");
        }, 150);
        timer = setTimeout(function() {
          var late = resolveHost();
          finish(late, late ? "timeout(late)" : "timeout(null)");
        }, timeoutMs);
      });
    }
    function probeWebView() {
      var wv = {};
      try {
        wv.userAgent = String(navigator.userAgent || "");
      } catch (_) {
        wv.userAgent = "?";
      }
      var m;
      try {
        m = /Chrom(?:e|ium)\/(\d+)/.exec(wv.userAgent);
      } catch (_) {
      }
      wv.chromiumMajor = m ? parseInt(m[1], 10) : null;
      try {
        var am = /Android\s+([0-9.]+)/.exec(wv.userAgent);
        wv.android = am ? am[1] : null;
      } catch (_) {
      }
      try {
        wv.dpr = G.devicePixelRatio || null;
      } catch (_) {
      }
      try {
        wv.screen = (screen.width || "?") + "x" + (screen.height || "?");
      } catch (_) {
      }
      try {
        wv.inner = (window.innerWidth || "?") + "x" + (window.innerHeight || "?");
      } catch (_) {
      }
      try {
        wv.lang = navigator.language || "";
      } catch (_) {
      }
      DIAG.webview = wv;
    }
    function has(fn) {
      try {
        return !!fn();
      } catch (_) {
        return false;
      }
    }
    function probeFeatures() {
      var f = {};
      f.globalThis = typeof globalThis !== "undefined";
      f.optionalChaining_es2020 = null;
      f.structuredClone = has(function() {
        return typeof G.structuredClone === "function";
      });
      f.Promise_allSettled = has(function() {
        return typeof Promise !== "undefined" && typeof Promise.allSettled === "function";
      });
      f.Promise_any = has(function() {
        return typeof Promise.any === "function";
      });
      f.Array_at = has(function() {
        return typeof [].at === "function";
      });
      f.String_replaceAll = has(function() {
        return typeof "".replaceAll === "function";
      });
      f.Object_fromEntries = has(function() {
        return typeof Object.fromEntries === "function";
      });
      f.BigInt = has(function() {
        return typeof G.BigInt === "function";
      });
      f.crypto_randomUUID = has(function() {
        return G.crypto && typeof G.crypto.randomUUID === "function";
      });
      f.Blob = has(function() {
        return typeof G.Blob === "function";
      });
      f.URL_createObjectURL = has(function() {
        return G.URL && typeof G.URL.createObjectURL === "function";
      });
      f.navigator_clipboard = has(function() {
        return navigator.clipboard && typeof navigator.clipboard.writeText === "function";
      });
      f.execCommand = has(function() {
        return typeof document.execCommand === "function";
      });
      f.download_attr = has(function() {
        return "download" in document.createElement("a");
      });
      f.localStorage = has(function() {
        var k = "__wd";
        localStorage.setItem(k, "1");
        localStorage.removeItem(k);
        return true;
      });
      f.fetch = has(function() {
        return typeof G.fetch === "function";
      });
      f.addEventListener = has(function() {
        return typeof window.addEventListener === "function";
      });
      DIAG.features = f;
    }
    function callHost(host, handler, payload) {
      return Promise.resolve().then(function() {
        return host.callHandler(handler, payload || {});
      });
    }
    function timed(label, p) {
      var s = now();
      return p.then(
        function(r) {
          return { label, ok: true, ms: Math.round(now() - s), r };
        },
        function(e) {
          return { label, ok: false, ms: Math.round(now() - s), err: e && e.message || String(e) };
        }
      );
    }
    function probeBridge(host) {
      DIAG.host.eventHub = G.__i99dashEvents && typeof G.__i99dashEvents.on === "function" ? "present" : "absent";
      if (!host) {
        DIAG.bridge.status = "no-host";
        return Promise.resolve();
      }
      var jobs = [
        // getContext: host context. We record ONLY non-PII fields +
        // presence booleans for the id fields (never their values).
        timed("getContext", callHost(host, "getContext")),
        // car.read of benign status names: prove the v2 car.* family
        // answers. We record count + ok ONLY — never the values.
        timed("car.read", callHost(host, "car.read", { names: ["battery_soc", "car_speed"] })),
        // Deliberately-unknown handler — characterises how the host
        // reacts to a missing handler (throw vs envelope vs 404).
        timed("unknown-handler", callHost(host, "__webview_doctor_nonexistent__"))
      ];
      return Promise.all(
        jobs.map(function(j) {
          return j.then(function(x) {
            return x;
          });
        })
      ).then(function(res) {
        var b = { status: "host-present", calls: {} };
        for (var i = 0; i < res.length; i++) {
          var x = res[i];
          var entry = { ok: x.ok, ms: x.ms };
          if (!x.ok) entry.err = String(x.err).slice(0, 160);
          if (x.label === "getContext" && x.ok && x.r && typeof x.r === "object") {
            entry.appId = x.r.appId || null;
            entry.appVersion = x.r.appVersion || null;
            entry.locale = x.r.locale || null;
            entry.isDark = !!x.r.isDark;
            entry.hasUserId = !!x.r.userId;
            entry.hasActiveCarId = !!x.r.activeCarId;
          }
          if (x.label === "car.read" && x.ok) {
            var vals = x.r && x.r.values;
            entry.isErrorEnvelope = !!(x.r && x.r.error);
            entry.valueCount = vals && typeof vals === "object" ? Object.keys(vals).length : 0;
          }
          b.calls[x.label] = entry;
        }
        DIAG.bridge = b;
      });
    }
    function computeVerdict() {
      var h = DIAG.host, wv = DIAG.webview, b = DIAG.bridge;
      if (ERRORS.length) {
        return { cls: "bad", text: "A JavaScript error was captured \u2014 this would blank a normal mini-app. First: " + ERRORS[0] };
      }
      if (!h.which && h.readyVia && h.readyVia.indexOf("timeout") === 0) {
        return { cls: "bad", text: "No i99dash host detected after " + h.readyMs + " ms. Either opened outside the car, or the host bridge is not being injected into this WebView." };
      }
      if (h.which && !h.readyAtSync && h.readyMs != null && h.readyMs >= 1200) {
        return { cls: "warn", text: "Host-readiness race: the host became ready only after " + h.readyMs + " ms (via " + h.readyVia + '). Mini-apps that resolve the host once eagerly and bail will fail here \u2014 the classic L5 "all \u2014" symptom. WebView Doctor waited and recovered.' };
      }
      if (wv.chromiumMajor != null && wv.chromiumMajor < 85) {
        return { cls: "warn", text: "Old WebView (Chromium " + wv.chromiumMajor + "). Modern-JS / ES-module bundles can blank-screen here (Gate B); classic-IIFE / es2019 apps still work." };
      }
      if (b && b.calls) {
        if (b.calls["getContext"] && !b.calls["getContext"].ok) {
          return { cls: "warn", text: "Host present but getContext failed: " + b.calls["getContext"].err };
        }
        if (b.calls["car.read"] && (!b.calls["car.read"].ok || b.calls["car.read"].isErrorEnvelope)) {
          return { cls: "warn", text: "Host present but car.read errored \u2014 the v2 car.* bridge is not answering correctly." };
        }
      }
      if (h.which) {
        return { cls: "good", text: "Healthy: host ready in " + h.readyMs + " ms (" + h.readyVia + "), Chromium " + (wv.chromiumMajor || "?") + ", bridge responding. If a mini-app still failed for you, capture this while reproducing it." };
      }
      return { cls: "warn", text: "Inconclusive \u2014 see the report below and send it to support." };
    }
    function line(k, v) {
      return k + ": " + v;
    }
    function buildReport(verdict) {
      var L = [];
      L.push("===== i99dash WebView Doctor \u2014 diagnostic report =====");
      L.push("Send this whole file to i99dash support on Telegram.");
      L.push("Privacy: no VIN, no location, no account, no signal values.");
      L.push("");
      L.push("VERDICT [" + verdict.cls.toUpperCase() + "]: " + verdict.text);
      L.push("");
      L.push("-- summary --");
      L.push(line("app", DIAG.app + " v" + DIAG.appVersion));
      L.push(line("at", DIAG.at));
      L.push(line("host.which", DIAG.host.which || "(none)"));
      L.push(line("host.readyAtSync", DIAG.host.readyAtSync));
      L.push(line("host.readyVia", DIAG.host.readyVia));
      L.push(line("host.readyMs", DIAG.host.readyMs));
      L.push(line("host.eventHub", DIAG.host.eventHub));
      L.push(line("webview.chromiumMajor", DIAG.webview.chromiumMajor));
      L.push(line("webview.android", DIAG.webview.android));
      L.push(line("webview.screen", DIAG.webview.screen));
      L.push(line("errors", ERRORS.length));
      L.push("");
      L.push("-- features --");
      for (var k in DIAG.features) {
        if (Object.prototype.hasOwnProperty.call(DIAG.features, k))
          L.push("  " + k + " = " + DIAG.features[k]);
      }
      L.push("");
      L.push("-- bridge --");
      L.push("  status = " + (DIAG.bridge.status || "?"));
      if (DIAG.bridge.calls) {
        for (var c in DIAG.bridge.calls) {
          if (Object.prototype.hasOwnProperty.call(DIAG.bridge.calls, c))
            L.push("  " + c + " = " + JSON.stringify(DIAG.bridge.calls[c]));
        }
      }
      L.push("");
      if (ERRORS.length) {
        L.push("-- errors --");
        for (var i = 0; i < ERRORS.length; i++) L.push("  " + ERRORS[i]);
        L.push("");
      }
      L.push("-- userAgent --");
      L.push("  " + (DIAG.webview.userAgent || "?"));
      L.push("");
      L.push("-- raw json (for support tooling) --");
      var json;
      try {
        json = JSON.stringify(DIAG);
      } catch (e) {
        json = '{"jsonError":"' + (e && e.message || e) + '"}';
      }
      L.push(json);
      L.push("===== end =====");
      return L.join("\n");
    }
    function $(id) {
      return document.getElementById(id);
    }
    function setStatus(s) {
      try {
        $("status").textContent = s;
      } catch (_) {
      }
    }
    function render() {
      var verdict;
      try {
        verdict = computeVerdict();
      } catch (e) {
        recordError("verdict", e);
        verdict = { cls: "bad", text: "verdict failed: " + (e && e.message || e) };
      }
      var text;
      try {
        text = buildReport(verdict);
      } catch (e) {
        recordError("report", e);
        text = "Report build failed: " + (e && e.message || e) + "\nerrors=" + ERRORS.join(" || ");
      }
      try {
        var v = $("verdict");
        v.className = "verdict " + verdict.cls;
        v.innerHTML = "<b>" + verdict.cls.toUpperCase() + "</b> \u2014 " + escapeHtml(verdict.text);
      } catch (_) {
      }
      try {
        $("report").value = text;
      } catch (_) {
      }
      var fname = "webview-doctor-" + (DIAG.webview.chromiumMajor != null ? "cr" + DIAG.webview.chromiumMajor + "-" : "") + (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, 19) + ".txt";
      try {
        $("dl").onclick = function() {
          exportTxt(text, fname);
        };
        $("cp").onclick = function() {
          copyText(text);
        };
      } catch (_) {
      }
    }
    function escapeHtml(s) {
      return String(s).replace(/[&<>]/g, function(ch) {
        return ch === "&" ? "&amp;" : ch === "<" ? "&lt;" : "&gt;";
      });
    }
    function exportTxt(text, fname) {
      try {
        if (typeof G.Blob === "function" && G.URL && typeof G.URL.createObjectURL === "function") {
          var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
          var url = G.URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = fname;
          document.body.appendChild(a);
          a.click();
          setTimeout(function() {
            try {
              document.body.removeChild(a);
            } catch (_) {
            }
            try {
              G.URL.revokeObjectURL(url);
            } catch (_) {
            }
          }, 1500);
          setStatus("exported " + fname + " \u2014 attach it in Telegram");
          return;
        }
      } catch (e) {
        recordError("export.blob", e);
      }
      try {
        var b64 = G.btoa(unescape(encodeURIComponent(text)));
        var a2 = document.createElement("a");
        a2.href = "data:text/plain;charset=utf-8;base64," + b64;
        a2.download = fname;
        document.body.appendChild(a2);
        a2.click();
        setTimeout(function() {
          try {
            document.body.removeChild(a2);
          } catch (_) {
          }
        }, 1500);
        setStatus("exported " + fname + " (data-uri) \u2014 attach it in Telegram");
        return;
      } catch (e2) {
        recordError("export.datauri", e2);
      }
      try {
        $("report").focus();
        $("report").select();
      } catch (_) {
      }
      setStatus("This WebView blocks file downloads \u2014 select all in the box above and paste into Telegram.");
    }
    function copyText(text) {
      try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
          navigator.clipboard.writeText(text).then(
            function() {
              setStatus("copied \u2014 paste into Telegram");
            },
            function() {
              selectFallback();
            }
          );
          return;
        }
      } catch (_) {
      }
      selectFallback();
    }
    function selectFallback() {
      try {
        var r = $("report");
        r.focus();
        r.select();
        var ok = false;
        try {
          ok = document.execCommand && document.execCommand("copy");
        } catch (_) {
        }
        setStatus(ok ? "copied \u2014 paste into Telegram" : "select-all the box above and copy manually, then paste into Telegram");
      } catch (_) {
        setStatus("select-all the box above and copy manually");
      }
    }
    function run() {
      try {
        probeWebView();
      } catch (e) {
        recordError("probeWebView", e);
      }
      try {
        probeFeatures();
      } catch (e) {
        recordError("probeFeatures", e);
      }
      render();
      setStatus("waiting for host\u2026");
      whenHostReady(8e3).then(
        function(host) {
          return probeBridge(host).then(
            function() {
              render();
              setStatus(host ? "done \u2014 export the .txt and send it on Telegram" : "no host \u2014 export the .txt and send it on Telegram");
            },
            function(e) {
              recordError("probeBridge", e);
              render();
              setStatus("done (bridge probe error captured)");
            }
          );
        },
        function(e) {
          recordError("whenHostReady", e);
          render();
          setStatus("done (readiness error captured)");
        }
      );
    }
    try {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", run);
      } else {
        run();
      }
    } catch (e) {
      recordError("bootstrap", e);
      try {
        render();
      } catch (_) {
      }
    }
  })();
})();
