      (async function () {
        // Stamp the version pill from the single source of truth so
        // there's never a hardcoded version drift between manifest
        // and the rendered header. (Pre-0.8.1 had three hardcoded
        // "0.7.0" strings that drifted across 6+ version bumps.)
        var versionPill = document.getElementById('appVersionPill');
        if (versionPill) versionPill.textContent = 'v' + window.PKG_LAUNCHER_VERSION;

        var ATTEMPTS = 0;
        // Wait for the host bridge to inject `window.flutter_inappwebview`.
        // The host typically races the page load by 10–80ms; bound the
        // wait so a misconfigured embed surfaces a clear error.
        function waitForBridge() {
          return new Promise(function (resolve, reject) {
            (function check() {
              if (window.flutter_inappwebview && window.flutter_inappwebview.callHandler) {
                return resolve(window.flutter_inappwebview);
              }
              if (++ATTEMPTS > 200) return reject(new Error('bridge missing'));
              setTimeout(check, 25);
            })();
          });
        }
        var bridge = await waitForBridge();

        async function call(name, args) {
          var raw = await bridge.callHandler(name, {
            params: args || {},
            idempotencyKey: 'k' + Math.random().toString(16).slice(2),
          });
          if (raw && raw.success === false) {
            throw new Error(raw.error.code + ': ' + raw.error.message);
          }
          return (raw && raw.data) || raw;
        }

        // ── State ────────────────────────────────────────────
        var state = {
          packages: [], // PackageInfo[]
          displays: [], // DisplaySnapshot[] — used to resolve role→id.
          // Holds the FULL list including hidden duplicates; consumers
          // that should ignore shadow displays (the picker, role
          // resolver) call visibleDisplays() instead.
          vehicle: null, // {variantId, friendlyName, dilinkFamily} — host 1.6+
          filter: '',
          pendingLaunch: null, // PackageInfo we're about to launch (modal selection)
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
          clusterLaunches: new Map(),
          padAttached: false, // cursor.attach state for the touchpad
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
          lastTargets: {},
        };

        // ── Persistence (0.9.0) ──────────────────────────────
        // Two small bits of state live in localStorage so the
        // launcher feels stateful across reloads. Both are advisory
        // only — losing them just regresses to "first-time UX",
        // never breaks a launch. Wrapped in try/catch because some
        // host embeddings disable storage in incognito-style modes.
        var RECENTS_KEY = 'pkg-launcher.recents.v1';
        var TARGETS_KEY = 'pkg-launcher.lastTargets.v1';
        var TIP_KEY = 'pkg-launcher.tipShown.v1';
        var RECENTS_MAX = 8;
        function loadPersistence() {
          try {
            var r = localStorage.getItem(RECENTS_KEY);
            if (r) {
              var arr = JSON.parse(r);
              if (Array.isArray(arr)) state.recents = arr.slice(0, RECENTS_MAX);
            }
          } catch (_) {}
          try {
            var t = localStorage.getItem(TARGETS_KEY);
            if (t) {
              var obj = JSON.parse(t);
              if (obj && typeof obj === 'object') state.lastTargets = obj;
            }
          } catch (_) {}
        }
        function saveRecents() {
          try {
            localStorage.setItem(RECENTS_KEY, JSON.stringify(state.recents));
          } catch (_) {}
        }
        function saveTargets() {
          try {
            localStorage.setItem(TARGETS_KEY, JSON.stringify(state.lastTargets));
          } catch (_) {}
        }
        function rememberLaunch(pkgName, role, displayId) {
          state.recents = [pkgName]
            .concat(
              state.recents.filter(function (n) {
                return n !== pkgName;
              }),
            )
            .slice(0, RECENTS_MAX);
          state.lastTargets[pkgName] = {
            role: role,
            displayId: displayId == null ? null : displayId,
          };
          saveRecents();
          saveTargets();
          renderRecents();
          updateTargetBadgeFor(pkgName);
        }
        // True when a saved last-target is still launchable on the
        // current car. A tap-to-direct-launch path consults this so
        // we fall back to the picker (instead of toasting an error)
        // when the user moves between trims with the same install.
        function targetStillReachable(t) {
          if (!t) return false;
          if (t.role === 'ivi') return true;
          if (t.role === 'cluster') {
            if (t.displayId != null) return true;
            return clusterPixelAvailable();
          }
          if (t.role === 'passenger') return passengerLaunchAvailable();
          return false;
        }

        // ── DOM helpers ──────────────────────────────────────
        function $(s) {
          return document.querySelector(s);
        }
        function toast(msg, kind) {
          var el = $('#toast');
          el.textContent = msg;
          el.classList.toggle('err', kind === 'err');
          el.classList.add('show');
          clearTimeout(el._t);
          el._t = setTimeout(function () {
            el.classList.remove('show');
          }, 2200);
        }
        function escapeHtml(s) {
          return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
          });
        }

        // ── Display discovery ────────────────────────────────
        // We don't render display chips anymore (the target picker
        // does the selection). But we still need to resolve role
        // → displayId to know which id to pass to the host on
        // launch / cursor.attach / gesture.tap.
        function pickByRole(role) {
          // Default display is always role=ivi; pkg.launch with no
          // displayId implicitly hits it. Returning null tells the
          // launcher "use the default" so the host takes the cheap
          // startActivity path.
          if (role === 'ivi') return null;

          // Skip displays the active VehicleProfile flags as
          // duplicate / shadow surfaces (host 1.6+: `d.hidden`).
          // On L8 / L5L the cluster pair (3, 5) collapses to just
          // the addressable id this way — older heuristics had to
          // hand-roll a regex for the same effect.
          var pool = visibleDisplays();

          // Cluster: lock to the OVERLAY XDJA slot
          // (``shared_fission_bg_XDJAScreenProjection_1``) — verified
          // on the test car as the one physically projected to the
          // screen behind the wheel. We've now tested all three:
          //   * 0.5.5 / 0.5.7 → base (no suffix) — invisible.
          //   * 0.5.6        → ``_0`` primary — amap-contested,
          //                    invisible.
          //   * 0.5.8 (this) → ``_1`` overlay — VISIBLE.
          // The XDJA-name regex stays in place as a fallback for
          // hosts that don't ship `hidden` yet; once `hidden` is
          // populated the regex narrows the pool to one entry on
          // its own and the .find returns it directly.
          if (role === 'cluster') {
            var d = pool.find(function (x) {
              return roleOf(x) === 'cluster' && /_1$/.test(x.name || '');
            });
            return d ? d.id : null;
          }

          var match = pool.find(function (x) {
            return roleOf(x) === role;
          });
          return match ? match.id : null;
        }
        // Filter out shadow / duplicate displays the active
        // VehicleProfile says shouldn't appear in pickers. Older
        // hosts (no `hidden` field) get an unfiltered list — every
        // display falls through, no behaviour change.
        function visibleDisplays() {
          return state.displays.filter(function (d) {
            return !d.hidden;
          });
        }
        // Driver intent → concrete launch op + displayId. ONE
        // decision point so per-trim variation lives entirely in
        // display.list output (overrideLabel + role) instead of
        // launcher logic. Adding a new trim that puts the
        // driver-eyeline display somewhere new requires zero changes
        // here — only the host's VehicleProfile gets touched.
        //
        // Resolution priority (cluster wins over panel because
        // cluster IS the literal display the user means; the panel
        // case is only viable when no real cluster exists):
        //   1. Real cluster overlay (L8 / L5L XDJA `_1` slot).
        //      → pkg.launch_cluster, isFallback=false.
        //   2. Passenger display labeled "Driver" by the active
        //      VehicleProfile (Song Plus, L7, HAN L). Reserved
        //      label per /docs/api/i99dash/runtime/display-snapshot.
        //      → pkg.launch (passenger scope), isFallback=true (hint
        //         to surface a soft notice that we're not on a real
        //         cluster).
        //   3. Nothing reachable — return a typed reason the caller
        //      can show to the user without inventing wording.
        function resolveDriverTarget() {
          var pool = visibleDisplays();
          var cluster = pool.find(function (d) {
            return roleOf(d) === 'cluster' && /_1$/.test(d.name || '');
          });
          if (cluster) {
            return {
              kind: 'cluster',
              op: 'pkg.launch_cluster',
              displayId: cluster.id,
              isFallback: false,
            };
          }
          var driverPanel = pool.find(function (d) {
            return roleOf(d) === 'passenger' && d.overrideLabel === 'Driver';
          });
          if (driverPanel) {
            return {
              kind: 'panel',
              op: 'pkg.launch',
              displayId: driverPanel.id,
              isFallback: true,
            };
          }
          return {
            kind: 'none',
            reason: 'No driver-eyeline display on ' + trimLabel(),
          };
        }
        // ── Per-trim capability gating ───────────────────────
        // Host 1.7+ ships `vehicle.capabilities` (string list) and
        // `vehicle.capabilityBits` (packed) from `display.list`. Use
        // them as the authoritative gate per the recipe in
        // /docs/recipes/vehicle-capabilities — cluster + passenger
        // surfaces are optional and gated client-side from the bit list.
        //
        // Bits we care about for pkg-launcher:
        //   * pkg.launch.cluster.pixel — driver cluster (L8, L5L)
        //   * pkg.launch.passenger     — passenger panel (Di5.1)
        //   * pkg.launch.dishare       — passenger panel via DiShare
        //                                (Di5.0: L5, L5U)
        //
        // Pre-1.7 hosts don't ship `vehicle.capabilities`. Fall back
        // to the legacy heuristics: per-display `clusterAvailable`
        // flag for the cluster, presence of a passenger Display for
        // the passenger panel. This keeps the launcher functional on
        // older builds while the device updates.
        function hasVehicleCap(name) {
          return (
            state.vehicle &&
            Array.isArray(state.vehicle.capabilities) &&
            state.vehicle.capabilities.includes(name)
          );
        }
        function vehicleCapsKnown() {
          return !!(state.vehicle && Array.isArray(state.vehicle.capabilities));
        }
        function clusterPixelAvailable() {
          // Cap bit alone is necessary but not sufficient — Generic
          // VehicleProfile lights pkg.launch.cluster.pixel on every
          // car (it's the conservative default for unprofiled
          // trims). Only when the picker can also resolve a cluster
          // displayId is the launch actually executable. Mirrors
          // the AND in passengerLaunchAvailable's pre-1.7 fallback.
          if (vehicleCapsKnown()) {
            return hasVehicleCap('pkg.launch.cluster.pixel') && pickByRole('cluster') != null;
          }
          if (state.displays.length === 0) return true;
          return state.displays.some(function (d) {
            return roleOf(d) === 'cluster' && d.clusterAvailable !== false;
          });
        }
        function passengerLaunchAvailable() {
          if (vehicleCapsKnown()) {
            return hasVehicleCap('pkg.launch.passenger') || hasVehicleCap('pkg.launch.dishare');
          }
          return pickByRole('passenger') != null;
        }
        function trimLabel() {
          var v = state.vehicle;
          return (v && (v.friendlyName || v.variantId)) || 'this car';
        }
        function clusterMissingReason() {
          if (!vehicleCapsKnown()) return 'Cluster not detected on this host';
          return (
            'Cluster pixel rendering not supported on ' +
            trimLabel() +
            ' (need pkg.launch.cluster.pixel)'
          );
        }
        function passengerMissingReason() {
          if (!vehicleCapsKnown()) return 'Passenger panel not detected on this host';
          return (
            'Passenger launch not available on ' +
            trimLabel() +
            ' (need pkg.launch.passenger or pkg.launch.dishare)'
          );
        }
        function roleOf(d) {
          if (d && d.role) return d.role;
          // Pre-1.4 host fallback: derive from legacy flags so the
          // mini-app still works while the device updates.
          if (d && d.isDefault) return 'ivi';
          if (d && d.isCluster) return 'cluster';
          return 'passenger';
        }

        async function loadDisplays() {
          var r = await call('display.list');
          state.displays = (r && r.displays) || [];
          // host 1.6+ ships {variantId, friendlyName, dilinkFamily}
          // alongside the displays. Older hosts return undefined —
          // we hide the trim pill in that case.
          state.vehicle = (r && r.vehicle) || null;
          // Tag every captured Sentry event from this point on with
          // the active trim's identity. Lets us slice errors by
          // car.variant in Sentry — exactly the visibility we needed
          // to diagnose the L5 vs L8 split. Cheap (one-shot setTags
          // on the global scope), no PII (variantId is a model code,
          // not a user identifier).
          if (typeof Sentry !== 'undefined' && state.vehicle) {
            var v = state.vehicle;
            Sentry.getCurrentScope().setTags({
              'car.variant': v.variantId || 'unknown',
              'car.subTrim': v.subTrim || '',
              'car.dilinkFamily': v.dilinkFamily || 'unknown',
              'car.friendlyName': v.friendlyName || '',
              'car.isFallback': String(v.isFallback === true),
            });
          }
          renderTrimPill();
        }
        function renderTrimPill() {
          var pill = $('#trimPill');
          if (!pill) return;
          var v = state.vehicle;
          var label = v && (v.friendlyName || v.variantId || v.dilinkFamily);
          if (!label) {
            pill.hidden = true;
            return;
          }
          // Append the variantId in parens when we have it AND it
          // differs from the friendlyName (so `Leopard 8 (l8)` shows
          // both, but `Generic BYD DiLink` doesn't repeat itself).
          var detail =
            v.variantId && v.friendlyName !== v.variantId ? ' (' + v.variantId + ')' : '';
          // Soft "best-effort" tag when the host fell back through
          // the resolver (sub-trim / variant / DiLink default). Keep
          // the launcher fully functional — just hint that the cap
          // bits we're gating on are an aggregate, not a verified
          // probe row. fallbackReason is telemetry-only per docs;
          // never render it raw to the user.
          if (v.isFallback) {
            pill.textContent = label + detail + ' · best-effort';
            pill.classList.add('fallback');
          } else {
            pill.textContent = label + detail;
            pill.classList.remove('fallback');
          }
          pill.hidden = false;
        }

        // ── Apps ─────────────────────────────────────────────
        async function loadPackages() {
          try {
            var r = await call('pkg.list', { includeSystem: false });
            state.packages = (r && r.packages) || [];
            renderPackages();
          } catch (e) {
            $('#list').innerHTML =
              '<div class="empty">pkg.list failed: ' + escapeHtml(e && e.message) + '</div>';
          }
        }

        function filteredPackages() {
          var q = state.filter.trim().toLowerCase();
          if (!q) return state.packages;
          return state.packages.filter(function (p) {
            return (
              (p.label || '').toLowerCase().includes(q) ||
              (p.packageName || '').toLowerCase().includes(q)
            );
          });
        }

        // ── Icon cache (content-addressed) ───────────────────────
        // Keyed on the same `iconHash` shipped in `pkg.list`, so the
        // host's session cache and the mini-app's session cache both
        // resolve the same key. Cache hit → bridge skipped entirely.
        // Cache miss → one `pkg.icon` call → entry persists for the
        // page's lifetime. `versionCode` bump on the host changes the
        // hash, naturally invalidating the entry.
        var iconCache = new Map(); // iconHash → 'data:image/png;base64,...'
        var iconInflight = new Map(); // iconHash → Promise<dataUrl>

        async function fetchIconDataUrl(packageName, iconHash) {
          if (!iconHash) return null;
          if (iconCache.has(iconHash)) return iconCache.get(iconHash);
          if (iconInflight.has(iconHash)) return iconInflight.get(iconHash);
          var p = (async function () {
            try {
              var r = await call('pkg.icon', { packageName: packageName });
              if (r && r.ok && r.pngBase64) {
                var dataUrl = 'data:image/png;base64,' + r.pngBase64;
                iconCache.set(iconHash, dataUrl);
                return dataUrl;
              }
            } catch (_) {
              // Pre-1.7 hosts (no `pkg.icon` method) reject the call;
              // graceful degradation falls back to the first-letter
              // circle. No retry — we'd just fail the same way.
            }
            // Negative cache: store a sentinel so we don't keep
            // hammering the bridge for an icon that won't come.
            iconCache.set(iconHash, null);
            return null;
          })();
          iconInflight.set(iconHash, p);
          p.finally(function () {
            iconInflight.delete(iconHash);
          });
          return p;
        }

        // Lazy icon loading. IntersectionObserver fires only for cards
        // entering the viewport, so a 100-app launcher doesn't spam
        // the bridge with 100 calls on render. Once an entry is
        // observed we kick off the fetch and unobserve — a card that
        // scrolls back into view hits the iconCache directly.
        var iconObserver = null;
        function getIconObserver() {
          if (iconObserver) return iconObserver;
          if (typeof IntersectionObserver === 'undefined') return null;
          iconObserver = new IntersectionObserver(
            function (entries) {
              entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                var img = entry.target;
                iconObserver.unobserve(img);
                var pkg = img.dataset.pkg;
                var hash = img.dataset.iconHash;
                fetchIconDataUrl(pkg, hash).then(function (dataUrl) {
                  if (dataUrl) {
                    img.src = dataUrl;
                    img.classList.add('loaded');
                  }
                  // No-result: keep the first-letter fallback the
                  // surrounding `<span>` already renders.
                });
              });
            },
            { rootMargin: '200px 0px' }, // pre-warm cards within 200px of viewport
          );
          return iconObserver;
        }

        // Build the icon-cell innards (fallback letter + lazy <img>
        //  + optional running-dot + optional last-target badge). Pulled
        //  out so the full grid and the recents strip render the same
        //  decorations without duplicating the cache-hit branching.
        function buildIconCell(p, opts) {
          opts = opts || {};
          var initial =
            (p.label || p.packageName || '?')
              .replace(/[^a-zA-Z0-9]/g, '')
              .slice(0, 1)
              .toUpperCase() || '?';
          var cachedSrc = p.iconHash ? iconCache.get(p.iconHash) : null;
          var inner;
          if (cachedSrc) {
            inner =
              '<span class="icon-fallback" aria-hidden="true">' +
              escapeHtml(initial) +
              '</span>' +
              '<img class="icon-img loaded" alt="" src="' +
              cachedSrc +
              '">';
          } else if (p.iconHash) {
            inner =
              '<span class="icon-fallback" aria-hidden="true">' +
              escapeHtml(initial) +
              '</span>' +
              '<img class="icon-img" alt="" data-pkg="' +
              escapeHtml(p.packageName) +
              '" data-icon-hash="' +
              escapeHtml(p.iconHash) +
              '">';
          } else {
            inner = escapeHtml(initial);
          }
          var running =
            opts.showRunning && state.clusterLaunches.has(p.packageName)
              ? '<span class="running-dot" aria-hidden="true"></span>'
              : '';
          var badge = '';
          if (opts.showTargetBadge) {
            var t = state.lastTargets[p.packageName];
            if (t) {
              badge =
                '<span class="target-badge ' +
                t.role +
                '" aria-hidden="true" title="Tap launches on ' +
                targetLabel(t.role) +
                '">' +
                targetLetter(t.role) +
                '</span>';
            }
          }
          return '<div class="icon">' + running + inner + badge + '</div>';
        }
        function targetLetter(role) {
          return role === 'cluster' ? 'D' : role === 'passenger' ? 'P' : 'H';
        }
        function targetLabel(role) {
          return role === 'cluster' ? 'Driver' : role === 'passenger' ? 'Passenger' : 'Head Unit';
        }

        // Smart-tap: tap → direct-launch on the saved target if we
        // have one and it's still reachable; otherwise fall back to
        // the picker. Long-press (550 ms, ≤ 12 px wobble) ALWAYS
        // opens the picker so the user can change target. Mirrors the
        // mobile pattern users already know from launchers, calendar
        // events, and chat reactions.
        function attachLaunchHandlers(el, p) {
          var pressTimer = null;
          var pressFired = false;
          var startX = 0;
          var startY = 0;
          var maxDelta = 0;
          el.addEventListener('pointerdown', function (e) {
            pressFired = false;
            maxDelta = 0;
            startX = e.clientX;
            startY = e.clientY;
            if (pressTimer != null) clearTimeout(pressTimer);
            pressTimer = setTimeout(function () {
              pressFired = true;
              pressTimer = null;
              openTargetPicker(p);
            }, 550);
          });
          el.addEventListener('pointermove', function (e) {
            var d = Math.hypot(e.clientX - startX, e.clientY - startY);
            if (d > maxDelta) maxDelta = d;
            // Cancel the long-press timer once motion crosses the
            // bubble; tap-vs-scroll is decided in smartTap below by
            // looking at the cumulative maxDelta, not just at this
            // tick — so a brief overshoot doesn't sneak past the
            // timer and still fire as a tap on release.
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
          el.addEventListener('pointerup', cancelPress);
          el.addEventListener('pointercancel', cancelPress);
          el.addEventListener('pointerleave', cancelPress);

          function smartTap() {
            if (pressFired) {
              pressFired = false;
              return;
            }
            // Cards in the recents strip live inside a horizontally
            // scrollable row; a drag-to-scroll lifts inside the
            // origin card and would synthesize a click. Treat any
            // gesture that travelled > 12 px as scroll, not tap.
            if (maxDelta > 12) return;
            var t = state.lastTargets[p.packageName];
            if (t && targetStillReachable(t)) {
              launchOnRole(p, t.role, t.displayId);
              // Educate first-time-after-update users that the tap
              // bypassed the picker. One-shot, so it doesn't nag.
              try {
                if (!localStorage.getItem(TIP_KEY)) {
                  toast('Long-press a card to send to a different screen');
                  localStorage.setItem(TIP_KEY, '1');
                }
              } catch (_) {}
            } else {
              openTargetPicker(p);
            }
          }
          el.addEventListener('click', smartTap);
          el.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              smartTap();
            }
          });
        }

        // Update the running-dot on already-rendered cards without
        // re-drawing the whole grid. Cheap (one querySelectorAll) and
        // doesn't reset the IntersectionObserver state for icons that
        // were mid-load.
        function updateRunningStates() {
          document.querySelectorAll('[data-package]').forEach(function (el) {
            var name = el.getAttribute('data-package');
            var iconBox = el.querySelector('.icon');
            if (!iconBox) return;
            var hasDot = !!iconBox.querySelector('.running-dot');
            var shouldHave = state.clusterLaunches.has(name);
            if (shouldHave && !hasDot) {
              var dot = document.createElement('span');
              dot.className = 'running-dot';
              dot.setAttribute('aria-hidden', 'true');
              iconBox.insertBefore(dot, iconBox.firstChild);
            } else if (!shouldHave && hasDot) {
              iconBox.querySelector('.running-dot').remove();
            }
          });
        }
        // Replace the bottom-right target badge for a single package
        // after a launch. Touches every rendered occurrence (full
        // grid + recents strip) so both stay in sync.
        function updateTargetBadgeFor(pkgName) {
          var t = state.lastTargets[pkgName];
          document.querySelectorAll('[data-package]').forEach(function (el) {
            if (el.getAttribute('data-package') !== pkgName) return;
            var iconBox = el.querySelector('.icon');
            if (!iconBox) return;
            var existing = iconBox.querySelector('.target-badge');
            if (existing) existing.remove();
            if (!t) return;
            // Recents-strip cards opt out of the badge (the strip is
            // already an MRU signal; doubling the chrome makes the
            // 96-px chip look noisy).
            if (el.classList.contains('recent-card')) return;
            var badge = document.createElement('span');
            badge.className = 'target-badge ' + t.role;
            badge.setAttribute('aria-hidden', 'true');
            badge.title = 'Tap launches on ' + targetLabel(t.role);
            badge.textContent = targetLetter(t.role);
            iconBox.appendChild(badge);
          });
        }

        // Recents strip — re-render from state.recents. Filtered by
        // the current package list so an uninstalled-since-last-launch
        // chip doesn't ghost. Hidden when empty (incl. fresh install).
        function renderRecents() {
          var section = $('#recentsSection');
          var row = $('#recentsRow');
          if (!section || !row) return;
          var pkgIndex = {};
          state.packages.forEach(function (p) {
            pkgIndex[p.packageName] = p;
          });
          var visible = state.recents.filter(function (name) {
            return pkgIndex[name];
          });
          if (visible.length === 0) {
            section.hidden = true;
            row.innerHTML = '';
            return;
          }
          section.hidden = false;
          row.innerHTML = '';
          var observer = getIconObserver();
          visible.forEach(function (name) {
            var p = pkgIndex[name];
            var card = document.createElement('div');
            card.className = 'recent-card';
            card.setAttribute('role', 'button');
            card.setAttribute('data-package', p.packageName);
            card.setAttribute('aria-label', 'Relaunch ' + (p.label || p.packageName));
            card.tabIndex = 0;
            card.innerHTML =
              buildIconCell(p, { showRunning: true, showTargetBadge: false }) +
              '<div class="name">' +
              escapeHtml(p.label || p.packageName) +
              '</div>';
            attachLaunchHandlers(card, p);
            row.appendChild(card);
            var cachedSrc = p.iconHash ? iconCache.get(p.iconHash) : null;
            if (observer && p.iconHash && !cachedSrc) {
              var img = card.querySelector('.icon-img:not(.loaded)');
              if (img) observer.observe(img);
            }
          });
        }

        // Reflect cluster-launch count on the Clear button. Disabled
        // + tooltip when zero so the user doesn't tap a no-op; badge
        // shows the count so they know what Clear will tear down.
        function updateClearButton() {
          var btn = $('#clearBtn');
          var badge = $('#clearBadge');
          if (!btn) return;
          var n = state.clusterLaunches.size;
          if (n === 0) {
            btn.setAttribute('disabled', '');
            btn.title = 'Nothing on the driver screen yet';
          } else {
            btn.removeAttribute('disabled');
            btn.title = 'Stop ' + n + ' app' + (n === 1 ? '' : 's') + ' on the driver screen';
          }
          if (badge) {
            badge.textContent = String(n);
            badge.hidden = n === 0;
          }
        }

        function renderPackages() {
          var host = $('#list');
          var header = $('#gridHeader');
          var matches = filteredPackages();
          $('#count').textContent = matches.length;
          if (matches.length === 0) {
            if (header) header.hidden = true;
            host.innerHTML = '<div class="empty">No apps match.</div>';
            return;
          }
          if (header) header.hidden = state.recents.length === 0;
          host.innerHTML = '';
          var observer = getIconObserver();
          matches.forEach(function (p) {
            var card = document.createElement('div');
            card.className = 'card';
            card.setAttribute('role', 'button');
            card.setAttribute('data-package', p.packageName);
            card.setAttribute('aria-label', 'Launch ' + (p.label || p.packageName));
            card.tabIndex = 0;
            // 0.10.0 redesign: phone-home-screen tile — icon + label.
            // The reverse-domain `packageName` line was developer
            // noise and now lives only in the picker modal subtitle
            // for callers that still want to verify which package
            // they're launching.
            card.innerHTML =
              buildIconCell(p, { showRunning: true, showTargetBadge: true }) +
              '<div class="name" title="' +
              escapeHtml(p.packageName) +
              '">' +
              escapeHtml(p.label || p.packageName) +
              '</div>';
            attachLaunchHandlers(card, p);
            host.appendChild(card);
            var cachedSrc = p.iconHash ? iconCache.get(p.iconHash) : null;
            if (observer && p.iconHash && !cachedSrc) {
              var img = card.querySelector('.icon-img:not(.loaded)');
              if (img) observer.observe(img);
            }
          });
        }

        // ── Target-picker modal ──────────────────────────────
        // Advanced-mode toggle persisted across modal opens. When ON,
        // the .targets grid gets `.show-advanced` which un-hides the
        // Driver 3 / Driver 4 cards alongside the default Driver
        // (display 5) — useful when a specific app lands better on
        // a different XDJA slot than the verified default.
        var ADV_KEY = 'pkg-launcher.advanced-targets.v1';
        // 0.7.4: default advanced=ON for empirical-display testing.
        // The explicit-id cards (Display 0/2/3/4/5) let on-car testers
        // verify which numeric displays actually deliver pixels per
        // trim. Users who don't want them can still toggle off.
        var advancedSlots = true;
        try {
          var stored = localStorage.getItem(ADV_KEY);
          if (stored != null) advancedSlots = stored === '1';
        } catch (_) {
          // localStorage may be unavailable in some embeddings; fall
          // through with the default-on.
        }
        function applyAdvanced() {
          var grid = $('#targetGrid');
          var btn = $('#advToggle');
          if (advancedSlots) {
            grid.classList.add('show-advanced');
            btn.classList.add('on');
          } else {
            grid.classList.remove('show-advanced');
            btn.classList.remove('on');
          }
        }
        $('#advToggle').addEventListener('click', function () {
          advancedSlots = !advancedSlots;
          try {
            localStorage.setItem(ADV_KEY, advancedSlots ? '1' : '0');
          } catch (_) {}
          applyAdvanced();
        });

        function openTargetPicker(pkg) {
          state.pendingLaunch = pkg;
          $('#targetTitle').textContent = pkg.label || pkg.packageName;
          $('#targetSub').textContent = pkg.packageName;
          // 0.9.1: paint the pinned icon. Reuse the grid's iconCache —
          // a cache hit lights it up instantly; a miss schedules the
          // same `pkg.icon` fetch the grid uses, then back-fills here
          // when the dataUrl resolves. The fallback letter shows in the
          // meantime so the header never looks empty.
          var fallback = $('#targetIconFallback');
          var img = $('#targetIconImg');
          if (fallback) {
            var initial =
              (pkg.label || pkg.packageName || '?')
                .replace(/[^a-zA-Z0-9]/g, '')
                .slice(0, 1)
                .toUpperCase() || '?';
            fallback.textContent = initial;
          }
          if (img) {
            img.classList.remove('loaded');
            img.removeAttribute('src');
            var cachedSrc = pkg.iconHash ? iconCache.get(pkg.iconHash) : null;
            if (cachedSrc) {
              img.src = cachedSrc;
              img.classList.add('loaded');
            } else if (pkg.iconHash) {
              var pendingHash = pkg.iconHash;
              fetchIconDataUrl(pkg.packageName, pkg.iconHash).then(function (dataUrl) {
                // Guard against the user closing the picker (or opening
                // it on a different app) before the fetch resolves —
                // don't paint someone else's icon over the new header.
                if (!dataUrl) return;
                if (!state.pendingLaunch || state.pendingLaunch.iconHash !== pendingHash) return;
                img.src = dataUrl;
                img.classList.add('loaded');
              });
            }
          }
          applyAdvanced();
          // Disable cards whose role isn't reachable on this car. IVI
          // is always on. Driver / Passenger gate on the active
          // vehicle's capability bits (host 1.7+: vehicle.capabilities
          // from display.list), with the legacy per-display heuristic
          // as a pre-1.7 fallback. The tooltip names the missing cap
          // so triage doesn't have to guess "is the launcher broken?".
          //
          // When the trim is in best-effort mode (isFallback), an
          // available card still launches but gets a soft tooltip so
          // the user knows the cap list is an aggregate.
          var grid = $('#targetGrid');
          var clusterOk = clusterPixelAvailable();
          var passengerOk = passengerLaunchAvailable();
          var fb = !!(state.vehicle && state.vehicle.isFallback);
          grid.querySelectorAll('.target-card').forEach(function (card) {
            var role = card.dataset.role;
            var explicitId = card.dataset.displayId ? parseInt(card.dataset.displayId, 10) : null;
            var available;
            var unavailableReason = null;
            if (role === 'ivi') {
              available = true;
            } else if (role === 'cluster') {
              // Explicit-id cards (Display 0 / 2 / 3 / 4 / 5) target a
              // specific displayId. 0.7.4: always-enabled so on-car
              // testers can empirically verify which numeric displays
              // actually deliver pixels per trim — even if the active
              // profile says the cap isn't granted. This is a testing
              // surface; the host's own checks still gate at launch
              // time, so a cap-less attempt fails cleanly.
              if (explicitId != null) {
                available = true;
              } else {
                var t = resolveDriverTarget();
                available = t.kind !== 'none';
                if (!available) unavailableReason = t.reason;
              }
            } else if (role === 'passenger') {
              if (!passengerOk) {
                available = false;
                unavailableReason = passengerMissingReason();
              } else {
                // Two valid routes to the passenger panel:
                //   * A real passenger Display is present (L8 / L5L)
                //     → pickByRole returns its id, host am-starts.
                //   * DiShare cap is present (L5 / L5U)
                //     → no Display needed; host routes via the
                //       targetRole='passenger' hint to DishareTransport.
                // Either is sufficient; otherwise we genuinely have no
                // path and the card stays disabled.
                available = pickByRole('passenger') != null || hasVehicleCap('pkg.launch.dishare');
                if (!available) unavailableReason = 'No passenger display present';
              }
            } else {
              available = pickByRole(role) != null;
            }
            card.classList.toggle('disabled', !available);
            if (!available) {
              card.title = unavailableReason || '';
            } else if (fb && role !== 'ivi') {
              card.title = 'Best-effort on ' + trimLabel() + ' — capability list is an aggregate';
            } else {
              card.removeAttribute('title');
            }
          });
          $('#targetModal').classList.add('show');
        }
        function closeTargetPicker() {
          state.pendingLaunch = null;
          $('#targetModal').classList.remove('show');
        }

        document.addEventListener('click', function (e) {
          var closeBtn = e.target.closest('[data-close="target"]');
          if (closeBtn) return closeTargetPicker();
          var card = e.target.closest('.target-card');
          if (card && !card.classList.contains('disabled') && state.pendingLaunch) {
            // Pass the explicit display id when the card declares
            // one (Driver 3 / 4 / 5) so we can target a specific
            // cluster slot for testing without re-publishing.
            var explicitId = card.dataset.displayId ? parseInt(card.dataset.displayId, 10) : null;
            launchOnRole(state.pendingLaunch, card.dataset.role, explicitId);
            closeTargetPicker();
          }
        });

        // ── Launch routing ───────────────────────────────────
        async function launchOnRole(pkg, role, explicitDisplayId) {
          var args = { packageName: pkg.packageName };
          var op = 'pkg.launch';
          // "Driver" intent → resolveDriverTarget() picks the right
          // op + displayId for this trim:
          //   * Real cluster overlay (L8 / L5L)        → pkg.launch_cluster.
          //   * Driver-labeled passenger (Song Plus,    → pkg.launch.
          //     L7, HAN L)
          //   * No driver-eyeline display               → typed reason,
          //     toasted verbatim.
          // Explicit-id paths (Driver 3 / Driver 4 advanced testing
          // cards in the picker) bypass the resolver — those exist
          // specifically to address a particular cluster slot
          // without the auto-pick.
          if (role === 'cluster') {
            if (explicitDisplayId != null) {
              op = 'pkg.launch_cluster';
              args.displayId = explicitDisplayId;
            } else {
              var t = resolveDriverTarget();
              if (t.kind === 'none') {
                toast(t.reason, 'err');
                return;
              }
              op = t.op;
              args.displayId = t.displayId;
              // Fallback path (panel) — surface a soft notice so the
              // user knows this isn't a real cluster on their trim.
              // Same UX shape as vehicle.isFallback elsewhere; never
              // changes functional behaviour.
              if (t.isFallback) {
                toast(pkg.label + ' → driver panel (no cluster on ' + trimLabel() + ')');
              }
            }
          } else if (role === 'passenger') {
            // All-model passenger routing:
            //   * L8 / L5L (Di5.1)   — real passenger Display in display.list,
            //                          pickByRole returns its id, host am-starts
            //                          on display N.
            //   * L5 / L5U (Di5.0)   — no addressable passenger Display; the
            //                          panel is only reachable via DiShare's
            //                          mirror chain. Pass targetRole='passenger'
            //                          and OMIT displayId entirely (the host's
            //                          IntParamRule rejects null) — the host
            //                          routes to DishareTransport regardless.
            //   * L7 / HAN L / other — gated upstream (passengerLaunchAvailable
            //                          returns false), so the user can't reach
            //                          this branch on those trims.
            var passengerId = pickByRole('passenger');
            if (passengerId != null) {
              args.displayId = passengerId;
            } else if (hasVehicleCap('pkg.launch.dishare')) {
              args.targetRole = 'passenger';
            } else {
              toast('No passenger display detected', 'err');
              return;
            }
          }
          // role === 'ivi' → no displayId; host hits startActivity
          // on the default display.
          // Stamp display id into the toast for cluster launches so
          // we can correlate "did the app appear" ↔ "which slot we
          // hit" while triaging the XDJA topology.
          var idLabel = args.displayId != null ? ' [d=' + args.displayId + ']' : '';
          try {
            var r = await call(op, args);
            if (!r.ok) {
              // path === 'am-start-bounced' means the host saw the
              // launch land on the wrong display and couldn't move
              // it back. Surface the friendly explanation, not the
              // raw token.
              if (r.path === 'am-start-bounced') {
                toast(pkg.label + idLabel + ': fell back to IVI — try again or open here', 'err');
                return;
              }
              toast(pkg.label + idLabel + ': ' + (r.error || r.path || 'denied'), 'err');
              return;
            }
            // path === 'am-start-rePinned' means the launch
            // initially bounced (Waze / Maps / Spotify / YouTube)
            // and the host auto-recovered via move-task. Annotate
            // so users know the recovery happened — they were
            // about to lose trust if a launch silently moved.
            var pathLabel =
              r.path === 'am-start-rePinned' ? 'launched (recovered)' : r.path || 'launched';
            toast(pkg.label + idLabel + ' → ' + pathLabel);
            // Record every package we land on a cluster slot so Clear
            // can take down the whole stack, not just the last one,
            // AND so the touchpad targets the right displayId (not
            // whatever pickByRole's priority list happens to pick).
            // Map de-dupes by packageName; re-launching the same
            // package to a different slot updates its displayId.
            if (role === 'cluster') {
              state.clusterLaunches.set(pkg.packageName, args.displayId);
              updateRunningStates();
              updateClearButton();
            }
            // 0.9.0 UX: persist {role, displayId} so a future tap on
            // this card relaunches on the same target without reopening
            // the picker. Skip on a failed launch above (return earlier).
            rememberLaunch(pkg.packageName, role, args.displayId == null ? null : args.displayId);
          } catch (e) {
            toast('launch failed: ' + (e && e.message), 'err');
          }
        }

        // ── Clear cluster ────────────────────────────────────
        // pkg.stop every package the launcher pushed onto a cluster
        // slot in this session so XDJA's normal projection reclaims
        // the surface. Iterates the full set — earlier versions only
        // stopped the most-recent launch and left earlier ones
        // visible underneath. We never blanket-stop foreign packages
        // we didn't put there.
        $('#clearBtn').addEventListener('click', async function () {
          if (state.clusterLaunches.size === 0) {
            toast('No app to clear — driver screen unchanged');
            return;
          }
          // Snapshot the keys before iterating so deletes mid-loop
          // don't reshape what we walk.
          var pkgs = Array.from(state.clusterLaunches.keys());
          var stopped = [];
          var failed = [];
          for (var i = 0; i < pkgs.length; i++) {
            var pkg = pkgs[i];
            try {
              var r = await call('pkg.stop', { packageName: pkg });
              if (r && r.ok) {
                stopped.push(pkg);
                state.clusterLaunches.delete(pkg);
              } else {
                // Surface the host-side error verbatim so we can see
                // *why* a stop failed (permission denied, no such
                // package, am rejected) instead of guessing.
                failed.push(pkg + ' (' + ((r && (r.error || r.path)) || 'no response') + ')');
              }
            } catch (e) {
              failed.push(pkg + ' (' + (e && e.message) + ')');
            }
          }
          if (failed.length === 0) {
            toast('Driver screen cleared (' + stopped.length + ')');
          } else {
            toast(
              'cleared ' + stopped.length + ', failed ' + failed.length + ': ' + failed.join('; '),
              'err',
            );
          }
          updateRunningStates();
          updateClearButton();
        });

        // ── Touchpad modal ───────────────────────────────────
        // Opens any time. Drag → cursor.move (hot path, fire-and-
        // forget); release → gesture.tap at the cluster coord that
        // matches the release point on the pad. Pad aspect is
        // locked to 1920:720 (CSS aspect-ratio) so a tap on the
        // pad's center lands at (960, 360) on the cluster.
        //
        // Slot resolution: prefer the displayId of the most recent
        // cluster launch (so the pad targets exactly the slot the
        // user just put an app on); fall back to pickByRole('cluster')
        // when no launch has happened yet. The slot picker in the
        // modal header lets the user override at any time — useful
        // when XDJA's slot mapping isn't what we'd guess (overlay
        // vs primary differs per car / per content).
        var pad = $('#pad');
        var padStatus = $('#padStatus');
        var padSub = $('#padSub');
        var dragging = false;

        // The slot the touchpad currently targets. Changes when
        // the user (a) opens the touchpad after a fresh launch, or
        // (b) taps a slot pill in the modal header.
        state.padDisplayId = null;

        function defaultPadId() {
          // Single id for launch + cursor + gesture. The host
          // (DisplayInputResolver, since 1.5.2) auto-resolves the
          // launch-slot id to the surface display where input lands,
          // so mini-apps no longer need to track XDJA's
          // launch-vs-input asymmetry. Pre-resolver pkg-launcher
          // (≤ 0.5.15) returned the base XDJA slot here as a
          // workaround; that's now redundant.
          return pickByRole('cluster');
        }
        function refreshPadSub() {
          if (state.padDisplayId == null) {
            padSub.textContent = 'no cluster';
            return;
          }
          var d = state.displays.find(function (x) {
            return x.id === state.padDisplayId;
          });
          // Prefer the host-supplied overrideLabel ("Driver" on L8 /
          // L5L per VehicleProfile) so we render the same label as
          // the rest of the system. Fall back to the legacy XDJA-
          // suffix slot tag for trims without a profile or hosts
          // pre-1.6.
          var override = d && d.overrideLabel;
          var name = d ? d.name || '' : '';
          var slot =
            override ||
            (/_1$/.test(name)
              ? 'overlay'
              : /_0$/.test(name)
                ? 'primary'
                : /^fission_bg_/i.test(name)
                  ? 'base'
                  : '');
          padSub.textContent = 'displayId=' + state.padDisplayId + (slot ? ' · ' + slot : '');
        }
        $('#touchpadBtn').addEventListener('click', async function () {
          // 0.7.4: testing mode — touchpad always opens. The legacy
          // gate refused to open when the driver target wasn't a
          // cluster (Song Plus / L7 / HAN L treat driver as the
          // passenger panel; user can touch it directly). For
          // empirical-display testing the tester wants to point the
          // pad at any displayId on demand.
          //
          // Resolution order for the initial pad target:
          //   1. cluster role via pickByRole — works on L8 / L5L
          //   2. first non-default display from display.list — any
          //      addressable secondary surface
          //   3. default 0 fallback (the IVI itself; pad will land
          //      on the same screen the user is touching, which is
          //      a degenerate but observable case)
          // The slot pill in the modal header lets the user override.
          var resolved = pickByRole('cluster');
          if (resolved == null) {
            var nonDefault = state.displays.find(function (d) {
              return !d.isDefault;
            });
            resolved = nonDefault ? nonDefault.id : 0;
            // Soft toast so the tester knows we fell back from the
            // expected cluster path — useful triage signal.
            toast('Touchpad on display ' + resolved + ' (no cluster resolved)', 'info');
          }
          state.padDisplayId = resolved;
          state.padAttached = false;
          refreshPadSub();
          renderPadTargetRow();
          padStatus.textContent = 'Idle';
          $('#touchpadModal').classList.add('show');
          // Lazy-attach the cursor on first touch — saves a round-
          // trip if the user opens the modal and closes it without
          // touching.
        });

        // 0.7.5: per-display chip row in the touchpad modal header.
        // Renders one chip per known display from display.list();
        // tapping a chip retargets the pad to that displayId, detaches
        // the previous cursor binding, and re-attaches lazily on the
        // next pad touch. Lets on-car testers verify which displays
        // actually receive cursor.attach + cursor.move pixels without
        // closing the modal between tries.
        function renderPadTargetRow() {
          var row = $('#padTargetRow');
          if (!row) return;
          row.innerHTML = '';
          var displays = state.displays || [];
          if (displays.length === 0) {
            row.innerHTML =
              '<span class="pad-info" style="padding:8px 12px">No displays reported</span>';
            return;
          }
          displays.forEach(function (d) {
            var chip = document.createElement('div');
            chip.className = 'pad-target-chip' + (d.id === state.padDisplayId ? ' on' : '');
            var lbl =
              d.overrideLabel ||
              (d.isDefault ? 'Head Unit' : null) ||
              (d.name && d.name.toLowerCase() === 'fse' ? 'FSE' : null) ||
              (d.isCluster ? 'Cluster' : null) ||
              d.name ||
              'Display';
            chip.textContent = '[' + d.id + '] ' + lbl;
            var hints = [];
            if (d.hidden) hints.push('flagged hidden by profile');
            if (d.isDefault) hints.push('default IVI');
            if (hints.length) chip.title = hints.join(' · ');
            chip.addEventListener('click', async function () {
              if (d.id === state.padDisplayId) return;
              var prev = state.padDisplayId;
              state.padDisplayId = d.id;
              // Best-effort detach on the previous target so we don't
              // pile up cursor overlays. Some hosts implement
              // cursor.detach as no-op and a fresh attach replaces;
              // catching the rejection covers either shape.
              if (state.padAttached && prev != null) {
                try {
                  await call('cursor.detach', { targetDisplayId: prev });
                } catch (_) {}
              }
              state.padAttached = false;
              refreshPadSub();
              renderPadTargetRow();
              padStatus.textContent = 'Retargeted to displayId=' + d.id;
            });
            row.appendChild(chip);
          });
        }
        document.addEventListener('click', function (e) {
          if (e.target.closest('[data-close="touchpad"]')) {
            $('#touchpadModal').classList.remove('show');
            // Don't detach the cursor — the user might re-open
            // shortly. Cursor stays attached for the session and
            // the host garbage-collects it on session end.
          }
        });

        // 0.10.1: backdrop click dismisses an open modal. Tracked
        // pair (pointerdown + click both on the backdrop element)
        // guards against the iOS / Android pattern where a drag
        // that started on the modal-card and lifted on the
        // backdrop synthesizes a click whose target is the
        // backdrop — without this guard a near-edge slider drag
        // would silently close the picker.
        var modalDownTarget = null;
        document.addEventListener('pointerdown', function (e) {
          var modal = e.target.closest('.modal.show');
          // Down on backdrop directly (not on a child) records the
          // candidate close-on-release. Down on modal-card or any
          // descendant clears it.
          modalDownTarget = modal && e.target === modal ? modal : null;
        });
        document.addEventListener('click', function (e) {
          if (
            modalDownTarget &&
            e.target === modalDownTarget &&
            e.target.classList.contains('modal') &&
            e.target.classList.contains('show')
          ) {
            e.target.classList.remove('show');
            if (e.target.id === 'targetModal') state.pendingLaunch = null;
            // Touchpad keeps cursor.attach — same posture as the ✕
            // close path above. Re-opening reuses the existing
            // attach without a fresh round-trip.
          }
          modalDownTarget = null;
        });

        // Map a pad pointer event to a (0..1, 0..1) fraction of the
        // pad rect, then to a cluster coord. Aspect-ratio handling
        // is intrinsic: CSS forces the pad's width:height to be
        // 1920:720, so the fraction → cluster scaling is uniform on
        // both axes. No separate Y correction needed.
        function padToCluster(e) {
          var rect = pad.getBoundingClientRect();
          var fx = (e.clientX - rect.left) / Math.max(1, rect.width);
          var fy = (e.clientY - rect.top) / Math.max(1, rect.height);
          fx = Math.min(Math.max(fx, 0), 1);
          fy = Math.min(Math.max(fy, 0), 1);
          return {
            x: Math.round(fx * 1920),
            y: Math.round(fy * 720),
          };
        }
        function padDotPosition(e) {
          // Pad-relative pixel coords for the local CSS dot. Same
          // rect math as padToCluster but in screen pixels so the
          // dot sits exactly under the finger. Lives entirely in
          // the DOM — no host roundtrip, no chance of drifting from
          // the actual touch position.
          var rect = pad.getBoundingClientRect();
          return {
            left: e.clientX - rect.left,
            top: e.clientY - rect.top,
          };
        }

        async function ensurePadAttached() {
          if (state.padAttached) return;
          var clusterId = state.padDisplayId;
          if (clusterId == null) return;
          try {
            var r = await call('cursor.attach', {
              targetDisplayId: clusterId,
              style: 'dot',
            });
            state.padAttached = !!(r && r.ok);
          } catch (e) {
            // Best-effort — the tap on release still works without
            // the cursor overlay; the user just doesn't see drag
            // feedback on the cluster.
          }
        }

        var padDot = $('#padDot');
        function moveDot(e) {
          var p = padDotPosition(e);
          padDot.style.left = p.left + 'px';
          padDot.style.top = p.top + 'px';
        }

        // Touchpad gesture-detection state machine.
        //
        // Laptop-trackpad style — every gesture is finger-driven, no
        // buttons. Recognised gestures:
        //
        //   ── 1 finger ──
        //   * Tap         — quick down+up, motion < SWIPE_THRESH_PX
        //                   → gesture.tap at release point.
        //   * Long-press  — finger down ≥ LONG_PRESS_MS with motion
        //                   ≤ LONG_PRESS_TOL_PX → gesture.longPress
        //                   at down point. Release-tap suppressed.
        //   * Swipe       — pointerup with motion ≥ SWIPE_THRESH_PX
        //                   → gesture.swipe(from→to). Wall-clock
        //                   duration so apps can tell flick vs drag.
        //
        //   ── 2 fingers ──
        //   * Two-finger tap   — both pointers down + up within
        //                        TAP_MAX_MS, < SWIPE_THRESH_PX motion
        //                        each → gesture.longPress at midpoint
        //                        (right-click semantics on Android).
        //   * Two-finger swipe — both pointers down + significant
        //                        midpoint motion → gesture.swipe at
        //                        midpoint with shorter duration so
        //                        apps interpret it as scroll, not
        //                        a drag.
        //
        // Thresholds are CSS pixels on the IVI pad (not cluster
        // pixels). The pad surface is ~720–1000 px wide depending
        // on modal size; 30 px = 3–4% of pad width — large enough
        // that a steady tap doesn't read as a swipe, small enough
        // that even a small drag does. 500 ms matches Android's
        // built-in long-press timeout so the gesture feels native.
        var LONG_PRESS_MS = 500;
        var LONG_PRESS_TOL_PX = 10;
        var SWIPE_THRESH_PX = 30;
        var TAP_MAX_MS = 350; // upper bound for "tap" intent

        // Active pointer map. Key = pointerId. Value carries the
        // pointer's down + last position so we can compute midpoints
        // and per-finger deltas when the second finger lands.
        var activePointers = new Map();
        // True once a session has had ≥2 simultaneous pointers — used
        // so a brief stutter (release one, hold one) still treats
        // the session as multi-touch instead of switching modes
        // mid-gesture.
        var sessionMultiTouch = false;
        var longPressTimer = null;
        var longPressFired = false;
        var cursorClusterPos = { x: 960, y: 360 };

        // Translate a pad-relative pixel point to cluster coords.
        // Used wherever we need to feed cluster gesture ops (which
        // expect 1920×720) from pad pixels.
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
          padStatus.textContent = 'Long-press (' + c.x + ', ' + c.y + ')';
          try {
            var r = await call('gesture.longPress', {
              displayId: clusterId,
              x: c.x,
              y: c.y,
              durationMs: LONG_PRESS_MS,
            });
            if (!r || r.ok === false) {
              padStatus.textContent = 'Long-press failed: ' + (r && r.error ? r.error : 'denied');
            }
          } catch (err) {
            padStatus.textContent = 'Long-press failed: ' + (err && err.message);
          }
        }

        function resetSession() {
          clearLongPress();
          longPressFired = false;
          sessionMultiTouch = false;
        }

        pad.addEventListener('pointerdown', async function (e) {
          pad.setPointerCapture(e.pointerId);
          activePointers.set(e.pointerId, {
            startX: e.clientX,
            startY: e.clientY,
            currentX: e.clientX,
            currentY: e.clientY,
            startAt: Date.now(),
            maxDeltaPx: 0,
          });
          // First finger arms the standard one-finger long-press
          // timer + drives the cursor. A second finger landing
          // before the timer fires upgrades the session to
          // multi-touch and cancels the timer (two-finger gestures
          // fire on release, never from the timer).
          if (activePointers.size === 1) {
            pad.classList.add('touched');
            moveDot(e);
            padDot.classList.add('show');
            longPressFired = false;
            clearLongPress();
            longPressTimer = setTimeout(function () {
              var p = activePointers.get(e.pointerId);
              // Only fire if still single-touch (a second finger
              // would have made it multi) and motion stayed inside
              // the tolerance bubble.
              if (activePointers.size === 1 && p && p.maxDeltaPx <= LONG_PRESS_TOL_PX) {
                fireLongPressFor(p);
              }
            }, LONG_PRESS_MS);
            await ensurePadAttached();
            if (state.padAttached) {
              cursorClusterPos = padToCluster(e);
              call('cursor.move', cursorClusterPos).catch(function () {});
            }
            padStatus.textContent = 'Dragging…';
          } else if (activePointers.size === 2) {
            // Second finger — switch to multi-touch mode for the
            // whole session. Hide the IVI-side cursor since we
            // don't want it darting between fingers.
            sessionMultiTouch = true;
            pad.classList.add('two-finger');
            padDot.classList.remove('show');
            clearLongPress();
            padStatus.textContent = '2-finger gesture…';
          }
        });

        pad.addEventListener('pointermove', function (e) {
          var p = activePointers.get(e.pointerId);
          if (!p) return;
          p.currentX = e.clientX;
          p.currentY = e.clientY;
          var d = Math.hypot(e.clientX - p.startX, e.clientY - p.startY);
          if (d > p.maxDeltaPx) p.maxDeltaPx = d;
          // Cancel the long-press once motion crosses the tolerance.
          if (longPressTimer != null && d > LONG_PRESS_TOL_PX) {
            clearLongPress();
          }
          if (!sessionMultiTouch && activePointers.size === 1) {
            // One-finger drag: move the cursor on the cluster +
            // the IVI-side dot under the finger. Hot-path; never
            // await.
            moveDot(e);
            if (state.padAttached) {
              cursorClusterPos = padToCluster(e);
              call('cursor.move', cursorClusterPos).catch(function () {});
            }
          }
          // Multi-touch path doesn't move the cursor — it doesn't
          // make physical sense to follow a pinch midpoint with a
          // pointer cursor. The gesture fires on the second
          // pointerup with the midpoint delta.
        });

        pad.addEventListener('pointerup', async function (e) {
          var p = activePointers.get(e.pointerId);
          activePointers.delete(e.pointerId);
          try {
            pad.releasePointerCapture(e.pointerId);
          } catch (_) {}

          // ── Multi-touch path ─────────────────────────────────
          // Fires on the LAST pointer to lift in a 2-finger
          // session. Even if the user releases one finger before
          // the other, sessionMultiTouch stays true so we
          // dispatch the right gesture once the pad is fully
          // released.
          if (sessionMultiTouch) {
            if (activePointers.size > 0) {
              // Still fingers down — wait for the last lift.
              return;
            }
            pad.classList.remove('two-finger');
            // We need at least one snapshot to compute the gesture.
            // p is the last finger we just lifted; capture its
            // partner from before via maxDeltaPx via padStatus only
            // — for the dispatch we use the lifted finger's start
            // and end. Apps usually don't care which of the two
            // fingers we sampled as long as direction matches.
            var clusterId = state.padDisplayId;
            var fromC = padPxToCluster(p.startX, p.startY);
            var toC = padPxToCluster(p.currentX, p.currentY);
            var dx = p.currentX - p.startX;
            var dy = p.currentY - p.startY;
            var moved = Math.hypot(dx, dy);
            var dur = Date.now() - p.startAt;

            if (moved < SWIPE_THRESH_PX && dur < TAP_MAX_MS) {
              // 2-finger tap → long-press at the down-point.
              // Android maps long-press to context-menu (the
              // closest equivalent of a right-click).
              padStatus.textContent =
                '2-finger tap → long-press (' + fromC.x + ', ' + fromC.y + ')';
              try {
                var r = await call('gesture.longPress', {
                  displayId: clusterId,
                  x: fromC.x,
                  y: fromC.y,
                  durationMs: LONG_PRESS_MS,
                });
                if (!r || r.ok === false) {
                  padStatus.textContent =
                    '2-finger long-press failed: ' + (r && r.error ? r.error : 'denied');
                }
              } catch (err) {
                padStatus.textContent = '2-finger long-press failed: ' + (err && err.message);
              }
              resetSession();
              return;
            }

            // 2-finger swipe → scroll. Use a longer baseline
            // duration so it reads as scroll, not flick. Apps
            // that support 2-finger scroll on Android receive
            // ACTION_SCROLL via the a11y gesture stream; for ones
            // that don't, this still moves their content because
            // dispatchGesture replays the path as touch events.
            var scrollDur = Math.max(120, dur);
            padStatus.textContent =
              '2-finger scroll (' + fromC.x + ',' + fromC.y + ' → ' + toC.x + ',' + toC.y + ')';
            try {
              var sr = await call('gesture.swipe', {
                displayId: clusterId,
                fromX: fromC.x,
                fromY: fromC.y,
                toX: toC.x,
                toY: toC.y,
                durationMs: scrollDur,
              });
              if (!sr || sr.ok === false) {
                padStatus.textContent =
                  '2-finger scroll failed: ' + (sr && sr.error ? sr.error : 'denied');
              }
            } catch (err) {
              padStatus.textContent = '2-finger scroll failed: ' + (err && err.message);
            }
            resetSession();
            return;
          }

          // ── Single-touch path ────────────────────────────────
          padDot.classList.remove('show');
          // Long-press already fired from the timer — release is
          // just the lift-off, no further gesture to dispatch.
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
            // 1-finger swipe → wall-clock-paced gesture.swipe.
            // Apps interpret short flicks as scroll, long drags
            // as drag-and-drop — duration matters, so use real
            // wall-clock time.
            var durationMs = Math.max(50, Date.now() - p.startAt);
            padStatus.textContent =
              'Swipe (' + from.x + ',' + from.y + ' → ' + to.x + ',' + to.y + ')';
            try {
              var r2 = await call('gesture.swipe', {
                displayId: clusterId2,
                fromX: from.x,
                fromY: from.y,
                toX: to.x,
                toY: to.y,
                durationMs: durationMs,
              });
              if (!r2 || r2.ok === false) {
                padStatus.textContent = 'Swipe failed: ' + (r2 && r2.error ? r2.error : 'denied');
              }
            } catch (err) {
              padStatus.textContent = 'Swipe failed: ' + (err && err.message);
            }
            resetSession();
            return;
          }

          // Tap.
          padStatus.textContent = 'Tap (' + to.x + ', ' + to.y + ')';
          try {
            var rt = await call('gesture.tap', {
              displayId: clusterId2,
              x: to.x,
              y: to.y,
            });
            if (!rt || rt.ok === false) {
              padStatus.textContent = 'Tap failed: ' + (rt && rt.error ? rt.error : 'denied');
            }
          } catch (err) {
            padStatus.textContent = 'Tap failed: ' + (err && err.message);
          }
          resetSession();
        });

        pad.addEventListener('pointercancel', function (e) {
          activePointers.delete(e.pointerId);
          if (activePointers.size === 0) {
            padDot.classList.remove('show');
            pad.classList.remove('two-finger');
            resetSession();
          }
        });

        // ── Search ───────────────────────────────────────────
        var searchInput = $('#search');
        var searchClear = $('#searchClear');
        var kbdHint = $('#kbdHint');
        // Hide the "/" hint as soon as there's a value — the slot is
        // small and the ✕ is more useful at that point.
        function reflectSearchAffordances() {
          var has = state.filter.length > 0;
          if (searchClear) searchClear.classList.toggle('show', has);
          if (kbdHint) kbdHint.classList.toggle('hide', has);
        }
        searchInput.addEventListener('input', function (e) {
          state.filter = e.target.value;
          reflectSearchAffordances();
          renderPackages();
        });
        if (searchClear) {
          searchClear.addEventListener('click', function () {
            searchInput.value = '';
            state.filter = '';
            reflectSearchAffordances();
            renderPackages();
            searchInput.focus();
          });
        }
        // Global keydown:
        //   * "/"   focuses search (skip when an input already has it).
        //   * Esc   clears the filter, or blurs, or closes a modal.
        // We deliberately don't auto-focus the input on boot — that
        // would pop the soft keyboard the moment the launcher opens
        // on a head unit, hiding the grid. Press "/" to opt in.
        document.addEventListener('keydown', function (e) {
          var openModal = document.querySelector('.modal.show');
          if (openModal && e.key === 'Escape') {
            openModal.classList.remove('show');
            if (openModal.id === 'targetModal') state.pendingLaunch = null;
            e.preventDefault();
            return;
          }
          var inField =
            e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
          if (e.key === '/' && !inField && !openModal) {
            e.preventDefault();
            searchInput.focus();
            try {
              searchInput.select();
            } catch (_) {}
            return;
          }
          if (e.key === 'Escape' && e.target === searchInput) {
            if (state.filter) {
              searchInput.value = '';
              state.filter = '';
              reflectSearchAffordances();
              renderPackages();
            } else {
              searchInput.blur();
            }
          }
        });

        // ── Boot ─────────────────────────────────────────────
        loadPersistence();
        updateClearButton();
        await loadDisplays();
        await loadPackages();
        renderRecents();
      })().catch(function (e) {
        document.getElementById('list').innerHTML =
          '<div class="empty">init failed: ' + (e && e.message) + '</div>';
      });