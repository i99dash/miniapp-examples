      (function () {
        // ── Safe global ─────────────────────────────────────
        // Defensive: most DiLink WebViews are modern, but some older
        // BYD ROM WebViews predate `globalThis` (ES2020) — and
        // esbuild's es2019 target down-levels *syntax* but NOT this
        // global identifier, so a bare `globalThis` would
        // `ReferenceError` there. Resolve a safe global once (in a
        // WebView `window` is always the global). `typeof` on an
        // undeclared name never throws, so this probe is itself safe.
        var G =
          typeof globalThis !== 'undefined'
            ? globalThis
            : typeof window !== 'undefined'
              ? window
              : typeof self !== 'undefined'
                ? self
                : {};

        // Host resolution: prefer the branded `__i99dashHost`
        // (car-i99dash injects `window.__i99dashHost =
        // window.flutter_inappwebview` via an AT_DOCUMENT_START user
        // script), fall back to the plugin's transport global, and
        // accept ONLY a candidate that actually exposes `callHandler`.
        function resolveHost() {
          var branded = G.__i99dashHost;
          if (branded && typeof branded.callHandler === 'function') return branded;
          var legacy = G.flutter_inappwebview;
          if (legacy && typeof legacy.callHandler === 'function') return legacy;
          return null;
        }

        // Raw bridge — host injects flutter_inappwebview.callHandler. The
        // typed `i99dash` package wraps the same calls; this example uses
        // raw to keep the bundle a single static file with no build step.
        //
        // L5 "—"/no-bridge ROOT CAUSE — a readiness race, NOT a crash:
        // `flutter_inappwebview`'s `callHandler` is not guaranteed wired
        // at initial synchronous script execution; the plugin signals
        // readiness via the `flutterInAppWebViewPlatformReady` window
        // event. Resolving the host ONCE eagerly and bailing means L8's
        // faster WebView wins that race while the slower DiLink 5.0
        // loses it (bridge still null → alert → app never boots). Fix:
        // wait for the host. Resolve immediately if it's already there
        // (L8 path — zero behaviour change); otherwise resolve on the
        // readiness event AND poll as a belt-and-suspenders, capped by a
        // timeout after which we conclude we're genuinely not in a host.
        var bridge = resolveHost();

        function whenHostReady(timeoutMs) {
          if (timeoutMs == null) timeoutMs = 8000;
          return new Promise(function (resolve) {
            var found = resolveHost();
            if (found) return resolve(found);
            var settled = false;
            function finish(h) {
              if (settled) return;
              settled = true;
              window.removeEventListener('flutterInAppWebViewPlatformReady', onReady);
              clearInterval(poll);
              clearTimeout(timer);
              resolve(h);
            }
            function tryNow() {
              var h = resolveHost();
              if (h) finish(h);
            }
            function onReady() {
              tryNow();
            }
            window.addEventListener('flutterInAppWebViewPlatformReady', onReady);
            var poll = setInterval(tryNow, 150);
            var timer = setTimeout(function () {
              finish(resolveHost());
            }, timeoutMs);
          });
        }

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
        // `edit` carries every photo-fit / opacity / border tweak
        // that gets serialized into the surface route. wallpaper.html
        // parses the same params back on the rendering side.
        //  - fit / zoom / posX / posY apply to uploads only (object-*
        //    + transform only make sense on raster content).
        //  - opacity + border apply to every mode (gallery preset,
        //    upload, gradient) so the style strip is always live.
        var EDIT_DEFAULT = {
          fit: 'cover',
          zoom: 100,        // percent
          posX: 50,         // percent
          posY: 50,         // percent
          opacity: 100,     // percent
          borderWidth: 0,   // px
          borderColor: '#000000',
        };
        var state = {
          targets: new Set(), // displayId set
          activeSurfaces: new Map(), // displayId → surfaceId
          mode: null, // 'preset' | 'upload' | 'gradient'
          preset: null,
          upload: null, // { dataUrl, kind: 'image'|'video' }
          gradient: { c1: '#0f1c33', c2: '#c8a8ff', angle: 135 },
          edit: Object.assign({}, EDIT_DEFAULT),
        };

        // ── DOM helpers ─────────────────────────────────────
        function $(sel) {
          return document.querySelector(sel);
        }
        function $$(sel) {
          return Array.from(document.querySelectorAll(sel));
        }

        function toast(msg, kind) {
          var el = $('#toast');
          el.textContent = msg;
          el.classList.toggle('err', kind === 'err');
          el.classList.add('show');
          clearTimeout(el._t);
          el._t = setTimeout(function () {
            el.classList.remove('show');
          }, 2400);
        }

        // ── Display picker ──────────────────────────────────
        function displayLabel(d) {
          // 0.4.4: prepend the displayId in [brackets] so on-car
          // testers can identify which physical screen each chip
          // maps to. The friendly name (overrideLabel / Head Unit /
          // Passenger / Cluster) follows.
          var idTag = '[' + d.id + '] ';
          if (d.overrideLabel)
            return { name: idTag + d.overrideLabel, meta: d.width + '×' + d.height };
          if (d.isDefault) return { name: idTag + 'Head Unit', meta: d.width + '×' + d.height };
          if (d.name && d.name.toLowerCase() === 'fse')
            return { name: idTag + 'Passenger', meta: d.width + '×' + d.height };
          if (d.isCluster) {
            var secondary = /XDJAScreenProjection_1$/i.test(d.name);
            return {
              name: idTag + 'Cluster',
              meta: secondary ? 'overlay' : d.width + '×' + d.height,
            };
          }
          return {
            name: idTag + (d.name || 'Display ' + d.id),
            meta: d.width + '×' + d.height,
          };
        }

        function renderTrimPill(vehicle) {
          var pill = $('#trimPill');
          if (!pill) return;
          var label =
            vehicle && (vehicle.friendlyName || vehicle.variantId || vehicle.dilinkFamily);
          if (!label) {
            pill.hidden = true;
            return;
          }
          var detail =
            vehicle.variantId && vehicle.friendlyName !== vehicle.variantId
              ? ' (' + vehicle.variantId + ')'
              : '';
          pill.textContent = label + detail;
          pill.hidden = false;
        }

        async function loadDisplays() {
          var r = await call('display.list');
          var all = (r && r.displays) || [];
          // host 1.6+ ships {variantId, friendlyName, dilinkFamily}
          // alongside the displays. Older hosts return undefined —
          // we hide the trim pill in that case.
          var vehicle = (r && r.vehicle) || null;
          // Tag every captured Sentry event from this point on with
          // the active trim's identity. Lets us slice errors by
          // car.variant in Sentry — identical pattern to pkg-launcher.
          if (typeof Sentry !== 'undefined' && vehicle) {
            Sentry.getCurrentScope().setTags({
              'car.variant': vehicle.variantId || 'unknown',
              'car.subTrim': vehicle.subTrim || '',
              'car.dilinkFamily': vehicle.dilinkFamily || 'unknown',
              'car.friendlyName': vehicle.friendlyName || '',
              'car.isFallback': String(vehicle.isFallback === true),
            });
          }
          renderTrimPill(vehicle);
          // 0.4.4: testing mode — show ALL displays including the
          // ones the active VehicleProfile flags as `hidden` (e.g.
          // display 3 on L8 mirrors 5). On-car testers can verify
          // which numeric displays actually deliver pixels per trim.
          // The chip shows [id] prefix so each one is identifiable.
          var visible = all;
          // Whether the cluster is physically reachable on this trim.
          // False on Leopard 5 / 5 Ultra / 7 / HAN L. We still render
          // the cluster chip but disable it + tooltip "why" so users
          // don't tap into a guaranteed-fail surface.create call.
          var clusterOk = visible.some(function (d) {
            return d.isCluster && d.clusterAvailable !== false;
          });
          var trimName = r && r.vehicle && (r.vehicle.friendlyName || r.vehicle.variantId);
          // Order: IVI, passenger, friendly cluster slot, then any others.
          var ordered = visible.slice().sort(function (a, b) {
            var rank = function (d) {
              if (d.isDefault) return 0;
              if (d.name && d.name.toLowerCase() === 'fse') return 1;
              if (/XDJAScreenProjection_1$/i.test(d.name)) return 2;
              if (d.isCluster) return 3;
              return 4;
            };
            return rank(a) - rank(b);
          });

          var host = $('#targets');
          host.innerHTML = '';
          ordered.forEach(function (d) {
            var lbl = displayLabel(d);
            // 0.4.4: testing mode — every chip is clickable.
            // We still write the historical disable hints into the
            // tooltip (cluster-unavailable, head-unit-self) so the
            // tester knows the existing capability story, but they
            // can still TRY the chip. The host's surface.create call
            // will fail cleanly if the cap really isn't there;
            // empirical truth wins over profile inference.
            var clusterUnavailable = d.isCluster && d.clusterAvailable === false && !clusterOk;
            var chip = document.createElement('div');
            chip.className = 'chip';
            chip.dataset.displayId = d.id;
            var hints = [];
            if (d.isDefault) hints.push('default IVI — surface.create may not target self');
            if (clusterUnavailable) {
              hints.push(
                'Cluster flagged unsupported' + (trimName ? ' on ' + trimName : '') + ' — try anyway',
              );
            }
            if (d.hidden) hints.push('flagged hidden by profile (mirror / shadow)');
            if (hints.length) chip.title = hints.join(' · ');
            chip.innerHTML =
              '<span class="dot"></span>' +
              '<span class="name">' +
              lbl.name +
              '</span>' +
              '<span class="meta">' +
              lbl.meta +
              '</span>';
            chip.addEventListener('click', function () {
              if (state.targets.has(d.id)) state.targets.delete(d.id);
              else state.targets.add(d.id);
              chip.classList.toggle('on');
              updateUI();
            });
            host.appendChild(chip);
          });
          updateUI();
        }

        // ── Tabs ────────────────────────────────────────────
        $$('.tab').forEach(function (tab) {
          tab.addEventListener('click', function () {
            $$('.tab').forEach(function (t) {
              t.classList.remove('active');
            });
            tab.classList.add('active');
            $$('.panel').forEach(function (p) {
              p.classList.remove('active');
            });
            $('[data-panel="' + tab.dataset.tab + '"]').classList.add('active');
          });
        });

        // ── Gallery ─────────────────────────────────────────
        $$('.preset').forEach(function (el) {
          el.addEventListener('click', function () {
            $$('.preset').forEach(function (p) {
              p.classList.remove('selected');
            });
            el.classList.add('selected');
            state.mode = 'preset';
            state.preset = el.dataset.preset;
            updateUI();
          });
        });

        // ── Upload ──────────────────────────────────────────
        var drop = $('#drop');
        var fi = $('#fileInput');

        drop.addEventListener('dragover', function (e) {
          e.preventDefault();
          drop.classList.add('dragover');
        });
        drop.addEventListener('dragleave', function () {
          drop.classList.remove('dragover');
        });
        drop.addEventListener('drop', function (e) {
          e.preventDefault();
          drop.classList.remove('dragover');
          var f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        });
        fi.addEventListener('change', function (e) {
          var f = e.target.files[0];
          if (f) handleFile(f);
        });

        function handleFile(f) {
          var MAX = 8 * 1024 * 1024;
          if (f.size > MAX) {
            toast('File too large — 8 MB max', 'err');
            return;
          }
          var kind = f.type.startsWith('video/') ? 'video' : 'image';
          var reader = new FileReader();
          reader.onload = function () {
            state.upload = { dataUrl: reader.result, kind: kind };
            state.mode = 'upload';
            // Reset position + zoom for a fresh upload — keep the
            // user's opacity / border picks since those are
            // mode-agnostic in the style strip.
            state.edit.zoom = 100;
            state.edit.posX = 50;
            state.edit.posY = 50;
            // Preview
            var prev = $('#uploadedPreview');
            var thumb = $('#uploadedThumb');
            prev.style.display = 'block';
            thumb.innerHTML = '';
            if (kind === 'image') {
              var img = document.createElement('img');
              img.src = reader.result;
              thumb.appendChild(img);
            } else {
              var vid = document.createElement('video');
              vid.src = reader.result;
              vid.muted = true;
              vid.loop = true;
              vid.autoplay = true;
              vid.playsInline = true;
              thumb.appendChild(vid);
            }
            $('#editPanel').classList.add('visible');
            applyEditToPreview();
            syncEditUI();
            updateUI();
          };
          reader.readAsDataURL(f);
        }

        // ── Edit tools — fit / zoom / pan / opacity / border ─────
        var preview = $('#uploadedPreview');

        // Mirror state.edit into CSS custom properties on the preview.
        // wallpaper.html does the same on the rendered surface.
        function applyEditToPreview() {
          if (!preview) return;
          preview.style.setProperty('--fit', state.edit.fit);
          preview.style.setProperty('--posX', state.edit.posX + '%');
          preview.style.setProperty('--posY', state.edit.posY + '%');
          preview.style.setProperty('--zoom', state.edit.zoom / 100);
          preview.style.setProperty('--op', state.edit.opacity / 100);
          preview.style.setProperty('--bw', state.edit.borderWidth + 'px');
          preview.style.setProperty('--bc', state.edit.borderColor);
        }

        function syncEditUI() {
          $$('#fitChips .fit-chip').forEach(function (c) {
            c.classList.toggle('on', c.dataset.fit === state.edit.fit);
          });
          $('#zoomSlider').value = state.edit.zoom;
          $('#zoomVal').textContent = state.edit.zoom + '%';
          $('#posVal').textContent =
            Math.round(state.edit.posX) + '% · ' + Math.round(state.edit.posY) + '%';
          $('#opSlider').value = state.edit.opacity;
          $('#opVal').textContent = state.edit.opacity + '%';
          $('#bwSlider').value = state.edit.borderWidth;
          $('#bwVal').textContent = state.edit.borderWidth + 'px';
          $$('#bcSwatches .bc-swatch').forEach(function (s) {
            s.classList.toggle('selected', s.dataset.hex === state.edit.borderColor);
          });
        }

        // Fit chips
        $$('#fitChips .fit-chip').forEach(function (c) {
          c.addEventListener('click', function () {
            state.edit.fit = c.dataset.fit;
            applyEditToPreview();
            syncEditUI();
          });
        });

        // Zoom slider
        $('#zoomSlider').addEventListener('input', function (e) {
          state.edit.zoom = parseInt(e.target.value, 10);
          applyEditToPreview();
          syncEditUI();
        });

        // Pan — pointer drag on the preview translates into posX/posY %.
        // touch-action:none on the element prevents the WebView from
        // intercepting horizontal swipes as page scroll.
        (function bindPan() {
          var dragging = false;
          var startX = 0, startY = 0;
          var startPosX = 50, startPosY = 50;
          preview.addEventListener('pointerdown', function (e) {
            if (state.mode !== 'upload') return;
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startPosX = state.edit.posX;
            startPosY = state.edit.posY;
            preview.classList.add('dragging');
            preview.setPointerCapture(e.pointerId);
          });
          preview.addEventListener('pointermove', function (e) {
            if (!dragging) return;
            var rect = preview.getBoundingClientRect();
            var dxPct = ((e.clientX - startX) / rect.width) * 100;
            var dyPct = ((e.clientY - startY) / rect.height) * 100;
            // Invert: dragging right exposes the left side of the image
            // (object-position % is "show this point at center").
            state.edit.posX = Math.max(0, Math.min(100, startPosX - dxPct));
            state.edit.posY = Math.max(0, Math.min(100, startPosY - dyPct));
            applyEditToPreview();
            syncEditUI();
          });
          function endDrag(e) {
            if (!dragging) return;
            dragging = false;
            preview.classList.remove('dragging');
            try { preview.releasePointerCapture(e.pointerId); } catch (_) {}
          }
          preview.addEventListener('pointerup', endDrag);
          preview.addEventListener('pointercancel', endDrag);
        })();

        // Reset edit (only resets the upload-scoped fields)
        $('#resetEdit').addEventListener('click', function () {
          state.edit.fit = EDIT_DEFAULT.fit;
          state.edit.zoom = EDIT_DEFAULT.zoom;
          state.edit.posX = EDIT_DEFAULT.posX;
          state.edit.posY = EDIT_DEFAULT.posY;
          applyEditToPreview();
          syncEditUI();
        });

        // Opacity slider — global
        $('#opSlider').addEventListener('input', function (e) {
          state.edit.opacity = parseInt(e.target.value, 10);
          applyEditToPreview();
          syncEditUI();
        });

        // Border width slider — global
        $('#bwSlider').addEventListener('input', function (e) {
          state.edit.borderWidth = parseInt(e.target.value, 10);
          applyEditToPreview();
          syncEditUI();
        });

        // Border color swatches
        var BORDER_COLORS = [
          '#000000', '#ffffff', '#58c7ff', '#c8a8ff', '#b9f0c5',
          '#f0b9b9', '#ff8e3c', '#ffd166', '#1a1a1a', '#404040',
        ];
        (function renderBorderSwatches() {
          var host = $('#bcSwatches');
          host.innerHTML = '';
          BORDER_COLORS.forEach(function (hex) {
            var s = document.createElement('div');
            s.className = 'bc-swatch';
            s.style.background = hex;
            s.dataset.hex = hex;
            if (hex === state.edit.borderColor) s.classList.add('selected');
            s.addEventListener('click', function () {
              state.edit.borderColor = hex;
              applyEditToPreview();
              syncEditUI();
            });
            host.appendChild(s);
          });
        })();

        // Initial paint of style-strip controls
        syncEditUI();

        // ── Gradient ────────────────────────────────────────
        // 20-color curated palette — covers the obvious wallpaper
        // moods (deep blues / purples, warm sunsets, neons,
        // monochromes). The native `<input type=color>` doesn't open
        // a picker on the IVI WebView; tap-friendly swatches are
        // both more reliable and more car-ergonomic anyway.
        var SWATCHES = [
          '#0f1c33',
          '#1a0a3a',
          '#4a0e6f',
          '#001f1a',
          '#024d4d',
          '#00bfa5',
          '#c8a8ff',
          '#1a0838',
          '#c52a4d',
          '#ff8e3c',
          '#ffd166',
          '#000000',
          '#1a1a1a',
          '#404040',
          '#ffffff',
          '#0a0e16',
          '#58c7ff',
          '#b9f0c5',
          '#f0b9b9',
          '#1a2848',
        ];
        var gPrev = $('#gradPreview');
        var gC1Hex = $('#gradC1Hex'),
          gC2Hex = $('#gradC2Hex');

        function gradientCss(g) {
          if (g.angle === 'radial') {
            return 'radial-gradient(circle at 30% 30%, ' + g.c1 + ', ' + g.c2 + ')';
          }
          return 'linear-gradient(' + g.angle + 'deg, ' + g.c1 + ', ' + g.c2 + ')';
        }

        function renderSwatches(hostId, slot) {
          var host = $('#' + hostId);
          host.innerHTML = '';
          SWATCHES.forEach(function (hex) {
            var sw = document.createElement('div');
            sw.className = 'swatch';
            if (hex === state.gradient[slot]) sw.classList.add('selected');
            sw.style.background = hex;
            sw.dataset.hex = hex;
            sw.addEventListener('click', function () {
              state.gradient[slot] = hex;
              renderSwatches(hostId, slot); // refresh selected ring
              refreshGradient();
            });
            host.appendChild(sw);
          });
        }

        function refreshGradient() {
          gPrev.style.background = gradientCss(state.gradient);
          gC1Hex.textContent = state.gradient.c1;
          gC2Hex.textContent = state.gradient.c2;
          state.mode = 'gradient';
          updateUI();
        }

        $$('.gradient-btn').forEach(function (b) {
          b.addEventListener('click', function () {
            $$('.gradient-btn').forEach(function (x) {
              x.classList.remove('on');
            });
            b.classList.add('on');
            var raw = b.dataset.angle;
            state.gradient.angle = raw === 'radial' ? 'radial' : parseInt(raw, 10);
            refreshGradient();
          });
        });

        // initial paint
        renderSwatches('gradC1Swatches', 'c1');
        renderSwatches('gradC2Swatches', 'c2');
        refreshGradient();

        // ── Apply / Clear ──────────────────────────────────
        function selectionLabel() {
          if (!state.mode) return 'Pick a wallpaper above';
          if (state.mode === 'preset') return 'Selected: ' + state.preset;
          if (state.mode === 'upload')
            return 'Uploaded ' + (state.upload.kind === 'video' ? 'video' : 'image');
          if (state.mode === 'gradient') return 'Custom gradient';
          return '';
        }

        function updateUI() {
          $('#targetCount').textContent = state.targets.size;
          $('#selection').innerHTML =
            (state.mode ? '<span class="ok">✓</span> ' : '') + selectionLabel();
          $('#apply').disabled = state.targets.size === 0 || !state.mode;
        }

        // route(?src=…&kind=…&grad=…&fit=…&zoom=…&px=…&py=…&op=…&bw=…&bc=…)
        // wallpaper.html parses every key and applies it to #stage.
        // We omit defaults to keep the URL short — important on data:
        // URI uploads where every byte counts toward WebView limits.
        function buildRoute() {
          var p = new URLSearchParams();
          if (state.mode === 'preset') {
            p.set('preset', state.preset);
          } else if (state.mode === 'upload') {
            p.set('src', state.upload.dataUrl);
            p.set('kind', state.upload.kind);
            // Edit params apply only when there's raster content.
            if (state.edit.fit !== EDIT_DEFAULT.fit) p.set('fit', state.edit.fit);
            if (state.edit.zoom !== EDIT_DEFAULT.zoom) p.set('zoom', state.edit.zoom);
            if (state.edit.posX !== EDIT_DEFAULT.posX) p.set('px', Math.round(state.edit.posX));
            if (state.edit.posY !== EDIT_DEFAULT.posY) p.set('py', Math.round(state.edit.posY));
          } else if (state.mode === 'gradient') {
            p.set('grad', gradientCss(state.gradient));
          }
          // Style strip — opacity + border apply to every mode.
          if (state.edit.opacity !== EDIT_DEFAULT.opacity) p.set('op', state.edit.opacity);
          if (state.edit.borderWidth !== EDIT_DEFAULT.borderWidth) {
            p.set('bw', state.edit.borderWidth);
            p.set('bc', state.edit.borderColor.replace('#', ''));
          }
          return '/wallpaper.html?' + p.toString();
        }

        async function clearAll() {
          var ids = Array.from(state.activeSurfaces.values());
          state.activeSurfaces.clear();
          for (var i = 0; i < ids.length; i++) {
            try {
              await call('surface.destroy', { surfaceId: ids[i] });
            } catch (e) {
              // surface might already be gone — swallow
            }
          }
          toast('Cleared');
        }

        $('#clear').addEventListener('click', clearAll);

        $('#apply').addEventListener('click', async function () {
          var route = buildRoute();
          var ok = 0,
            fail = 0;
          for (var displayId of state.targets) {
            // Replace existing surface on this display, if any.
            var existing = state.activeSurfaces.get(displayId);
            if (existing) {
              try {
                await call('surface.destroy', { surfaceId: existing });
              } catch (e) {}
              state.activeSurfaces.delete(displayId);
            }
            try {
              var r = await call('surface.create', { displayId: displayId, route: route });
              state.activeSurfaces.set(displayId, r.surfaceId);
              ok++;
            } catch (e) {
              fail++;
              console.error('apply on ' + displayId + ':', e);
            }
          }
          if (fail === 0) toast('Applied to ' + ok + ' screen(s)');
          else if (ok === 0) toast(fail + ' failed', 'err');
          else toast(ok + ' applied · ' + fail + ' failed');
        });

        // ── Boot ─────────────────────────────────────────────
        (async function () {
          // Wait for the host bridge to actually be ready before
          // concluding anything (the L5 readiness race — see
          // whenHostReady). Only after the bounded wait do we show the
          // "no host bridge" notice.
          bridge = await whenHostReady();
          if (!bridge) {
            alert('No host bridge — run inside i99dash.');
            return;
          }
          loadDisplays().catch(function (e) {
            toast('display.list failed: ' + (e && e.message), 'err');
          });
        })();
      })();