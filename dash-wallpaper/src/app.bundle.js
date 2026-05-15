(() => {
  // src/app.js
  (function() {
    var bridge = window.flutter_inappwebview;
    if (!bridge) {
      alert("No host bridge \u2014 run inside i99dash.");
      return;
    }
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
    var EDIT_DEFAULT = {
      fit: "cover",
      zoom: 100,
      // percent
      posX: 50,
      // percent
      posY: 50,
      // percent
      opacity: 100,
      // percent
      borderWidth: 0,
      // px
      borderColor: "#000000"
    };
    var state = {
      targets: /* @__PURE__ */ new Set(),
      // displayId set
      activeSurfaces: /* @__PURE__ */ new Map(),
      // displayId → surfaceId
      mode: null,
      // 'preset' | 'upload' | 'gradient'
      preset: null,
      upload: null,
      // { dataUrl, kind: 'image'|'video' }
      gradient: { c1: "#0f1c33", c2: "#c8a8ff", angle: 135 },
      edit: Object.assign({}, EDIT_DEFAULT)
    };
    function $(sel) {
      return document.querySelector(sel);
    }
    function $$(sel) {
      return Array.from(document.querySelectorAll(sel));
    }
    function toast(msg, kind) {
      var el = $("#toast");
      el.textContent = msg;
      el.classList.toggle("err", kind === "err");
      el.classList.add("show");
      clearTimeout(el._t);
      el._t = setTimeout(function() {
        el.classList.remove("show");
      }, 2400);
    }
    function displayLabel(d) {
      var idTag = "[" + d.id + "] ";
      if (d.overrideLabel)
        return { name: idTag + d.overrideLabel, meta: d.width + "\xD7" + d.height };
      if (d.isDefault) return { name: idTag + "Head Unit", meta: d.width + "\xD7" + d.height };
      if (d.name && d.name.toLowerCase() === "fse")
        return { name: idTag + "Passenger", meta: d.width + "\xD7" + d.height };
      if (d.isCluster) {
        var secondary = /XDJAScreenProjection_1$/i.test(d.name);
        return {
          name: idTag + "Cluster",
          meta: secondary ? "overlay" : d.width + "\xD7" + d.height
        };
      }
      return {
        name: idTag + (d.name || "Display " + d.id),
        meta: d.width + "\xD7" + d.height
      };
    }
    function renderTrimPill(vehicle) {
      var pill = $("#trimPill");
      if (!pill) return;
      var label = vehicle && (vehicle.friendlyName || vehicle.variantId || vehicle.dilinkFamily);
      if (!label) {
        pill.hidden = true;
        return;
      }
      var detail = vehicle.variantId && vehicle.friendlyName !== vehicle.variantId ? " (" + vehicle.variantId + ")" : "";
      pill.textContent = label + detail;
      pill.hidden = false;
    }
    async function loadDisplays() {
      var r = await call("display.list");
      var all = r && r.displays || [];
      var vehicle = r && r.vehicle || null;
      if (typeof Sentry !== "undefined" && vehicle) {
        Sentry.getCurrentScope().setTags({
          "car.variant": vehicle.variantId || "unknown",
          "car.subTrim": vehicle.subTrim || "",
          "car.dilinkFamily": vehicle.dilinkFamily || "unknown",
          "car.friendlyName": vehicle.friendlyName || "",
          "car.isFallback": String(vehicle.isFallback === true)
        });
      }
      renderTrimPill(vehicle);
      var visible = all;
      var clusterOk = visible.some(function(d) {
        return d.isCluster && d.clusterAvailable !== false;
      });
      var trimName = r && r.vehicle && (r.vehicle.friendlyName || r.vehicle.variantId);
      var ordered = visible.slice().sort(function(a, b) {
        var rank = function(d) {
          if (d.isDefault) return 0;
          if (d.name && d.name.toLowerCase() === "fse") return 1;
          if (/XDJAScreenProjection_1$/i.test(d.name)) return 2;
          if (d.isCluster) return 3;
          return 4;
        };
        return rank(a) - rank(b);
      });
      var host = $("#targets");
      host.innerHTML = "";
      ordered.forEach(function(d) {
        var lbl = displayLabel(d);
        var clusterUnavailable = d.isCluster && d.clusterAvailable === false && !clusterOk;
        var chip = document.createElement("div");
        chip.className = "chip";
        chip.dataset.displayId = d.id;
        var hints = [];
        if (d.isDefault) hints.push("default IVI \u2014 surface.create may not target self");
        if (clusterUnavailable) {
          hints.push(
            "Cluster flagged unsupported" + (trimName ? " on " + trimName : "") + " \u2014 try anyway"
          );
        }
        if (d.hidden) hints.push("flagged hidden by profile (mirror / shadow)");
        if (hints.length) chip.title = hints.join(" \xB7 ");
        chip.innerHTML = '<span class="dot"></span><span class="name">' + lbl.name + '</span><span class="meta">' + lbl.meta + "</span>";
        chip.addEventListener("click", function() {
          if (state.targets.has(d.id)) state.targets.delete(d.id);
          else state.targets.add(d.id);
          chip.classList.toggle("on");
          updateUI();
        });
        host.appendChild(chip);
      });
      updateUI();
    }
    $$(".tab").forEach(function(tab) {
      tab.addEventListener("click", function() {
        $$(".tab").forEach(function(t) {
          t.classList.remove("active");
        });
        tab.classList.add("active");
        $$(".panel").forEach(function(p) {
          p.classList.remove("active");
        });
        $('[data-panel="' + tab.dataset.tab + '"]').classList.add("active");
      });
    });
    $$(".preset").forEach(function(el) {
      el.addEventListener("click", function() {
        $$(".preset").forEach(function(p) {
          p.classList.remove("selected");
        });
        el.classList.add("selected");
        state.mode = "preset";
        state.preset = el.dataset.preset;
        updateUI();
      });
    });
    var drop = $("#drop");
    var fi = $("#fileInput");
    drop.addEventListener("dragover", function(e) {
      e.preventDefault();
      drop.classList.add("dragover");
    });
    drop.addEventListener("dragleave", function() {
      drop.classList.remove("dragover");
    });
    drop.addEventListener("drop", function(e) {
      e.preventDefault();
      drop.classList.remove("dragover");
      var f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    });
    fi.addEventListener("change", function(e) {
      var f = e.target.files[0];
      if (f) handleFile(f);
    });
    function handleFile(f) {
      var MAX = 8 * 1024 * 1024;
      if (f.size > MAX) {
        toast("File too large \u2014 8 MB max", "err");
        return;
      }
      var kind = f.type.startsWith("video/") ? "video" : "image";
      var reader = new FileReader();
      reader.onload = function() {
        state.upload = { dataUrl: reader.result, kind };
        state.mode = "upload";
        state.edit.zoom = 100;
        state.edit.posX = 50;
        state.edit.posY = 50;
        var prev = $("#uploadedPreview");
        var thumb = $("#uploadedThumb");
        prev.style.display = "block";
        thumb.innerHTML = "";
        if (kind === "image") {
          var img = document.createElement("img");
          img.src = reader.result;
          thumb.appendChild(img);
        } else {
          var vid = document.createElement("video");
          vid.src = reader.result;
          vid.muted = true;
          vid.loop = true;
          vid.autoplay = true;
          vid.playsInline = true;
          thumb.appendChild(vid);
        }
        $("#editPanel").classList.add("visible");
        applyEditToPreview();
        syncEditUI();
        updateUI();
      };
      reader.readAsDataURL(f);
    }
    var preview = $("#uploadedPreview");
    function applyEditToPreview() {
      if (!preview) return;
      preview.style.setProperty("--fit", state.edit.fit);
      preview.style.setProperty("--posX", state.edit.posX + "%");
      preview.style.setProperty("--posY", state.edit.posY + "%");
      preview.style.setProperty("--zoom", state.edit.zoom / 100);
      preview.style.setProperty("--op", state.edit.opacity / 100);
      preview.style.setProperty("--bw", state.edit.borderWidth + "px");
      preview.style.setProperty("--bc", state.edit.borderColor);
    }
    function syncEditUI() {
      $$("#fitChips .fit-chip").forEach(function(c) {
        c.classList.toggle("on", c.dataset.fit === state.edit.fit);
      });
      $("#zoomSlider").value = state.edit.zoom;
      $("#zoomVal").textContent = state.edit.zoom + "%";
      $("#posVal").textContent = Math.round(state.edit.posX) + "% \xB7 " + Math.round(state.edit.posY) + "%";
      $("#opSlider").value = state.edit.opacity;
      $("#opVal").textContent = state.edit.opacity + "%";
      $("#bwSlider").value = state.edit.borderWidth;
      $("#bwVal").textContent = state.edit.borderWidth + "px";
      $$("#bcSwatches .bc-swatch").forEach(function(s) {
        s.classList.toggle("selected", s.dataset.hex === state.edit.borderColor);
      });
    }
    $$("#fitChips .fit-chip").forEach(function(c) {
      c.addEventListener("click", function() {
        state.edit.fit = c.dataset.fit;
        applyEditToPreview();
        syncEditUI();
      });
    });
    $("#zoomSlider").addEventListener("input", function(e) {
      state.edit.zoom = parseInt(e.target.value, 10);
      applyEditToPreview();
      syncEditUI();
    });
    (function bindPan() {
      var dragging = false;
      var startX = 0, startY = 0;
      var startPosX = 50, startPosY = 50;
      preview.addEventListener("pointerdown", function(e) {
        if (state.mode !== "upload") return;
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startPosX = state.edit.posX;
        startPosY = state.edit.posY;
        preview.classList.add("dragging");
        preview.setPointerCapture(e.pointerId);
      });
      preview.addEventListener("pointermove", function(e) {
        if (!dragging) return;
        var rect = preview.getBoundingClientRect();
        var dxPct = (e.clientX - startX) / rect.width * 100;
        var dyPct = (e.clientY - startY) / rect.height * 100;
        state.edit.posX = Math.max(0, Math.min(100, startPosX - dxPct));
        state.edit.posY = Math.max(0, Math.min(100, startPosY - dyPct));
        applyEditToPreview();
        syncEditUI();
      });
      function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        preview.classList.remove("dragging");
        try {
          preview.releasePointerCapture(e.pointerId);
        } catch (_) {
        }
      }
      preview.addEventListener("pointerup", endDrag);
      preview.addEventListener("pointercancel", endDrag);
    })();
    $("#resetEdit").addEventListener("click", function() {
      state.edit.fit = EDIT_DEFAULT.fit;
      state.edit.zoom = EDIT_DEFAULT.zoom;
      state.edit.posX = EDIT_DEFAULT.posX;
      state.edit.posY = EDIT_DEFAULT.posY;
      applyEditToPreview();
      syncEditUI();
    });
    $("#opSlider").addEventListener("input", function(e) {
      state.edit.opacity = parseInt(e.target.value, 10);
      applyEditToPreview();
      syncEditUI();
    });
    $("#bwSlider").addEventListener("input", function(e) {
      state.edit.borderWidth = parseInt(e.target.value, 10);
      applyEditToPreview();
      syncEditUI();
    });
    var BORDER_COLORS = [
      "#000000",
      "#ffffff",
      "#58c7ff",
      "#c8a8ff",
      "#b9f0c5",
      "#f0b9b9",
      "#ff8e3c",
      "#ffd166",
      "#1a1a1a",
      "#404040"
    ];
    (function renderBorderSwatches() {
      var host = $("#bcSwatches");
      host.innerHTML = "";
      BORDER_COLORS.forEach(function(hex) {
        var s = document.createElement("div");
        s.className = "bc-swatch";
        s.style.background = hex;
        s.dataset.hex = hex;
        if (hex === state.edit.borderColor) s.classList.add("selected");
        s.addEventListener("click", function() {
          state.edit.borderColor = hex;
          applyEditToPreview();
          syncEditUI();
        });
        host.appendChild(s);
      });
    })();
    syncEditUI();
    var SWATCHES = [
      "#0f1c33",
      "#1a0a3a",
      "#4a0e6f",
      "#001f1a",
      "#024d4d",
      "#00bfa5",
      "#c8a8ff",
      "#1a0838",
      "#c52a4d",
      "#ff8e3c",
      "#ffd166",
      "#000000",
      "#1a1a1a",
      "#404040",
      "#ffffff",
      "#0a0e16",
      "#58c7ff",
      "#b9f0c5",
      "#f0b9b9",
      "#1a2848"
    ];
    var gPrev = $("#gradPreview");
    var gC1Hex = $("#gradC1Hex"), gC2Hex = $("#gradC2Hex");
    function gradientCss(g) {
      if (g.angle === "radial") {
        return "radial-gradient(circle at 30% 30%, " + g.c1 + ", " + g.c2 + ")";
      }
      return "linear-gradient(" + g.angle + "deg, " + g.c1 + ", " + g.c2 + ")";
    }
    function renderSwatches(hostId, slot) {
      var host = $("#" + hostId);
      host.innerHTML = "";
      SWATCHES.forEach(function(hex) {
        var sw = document.createElement("div");
        sw.className = "swatch";
        if (hex === state.gradient[slot]) sw.classList.add("selected");
        sw.style.background = hex;
        sw.dataset.hex = hex;
        sw.addEventListener("click", function() {
          state.gradient[slot] = hex;
          renderSwatches(hostId, slot);
          refreshGradient();
        });
        host.appendChild(sw);
      });
    }
    function refreshGradient() {
      gPrev.style.background = gradientCss(state.gradient);
      gC1Hex.textContent = state.gradient.c1;
      gC2Hex.textContent = state.gradient.c2;
      state.mode = "gradient";
      updateUI();
    }
    $$(".gradient-btn").forEach(function(b) {
      b.addEventListener("click", function() {
        $$(".gradient-btn").forEach(function(x) {
          x.classList.remove("on");
        });
        b.classList.add("on");
        var raw = b.dataset.angle;
        state.gradient.angle = raw === "radial" ? "radial" : parseInt(raw, 10);
        refreshGradient();
      });
    });
    renderSwatches("gradC1Swatches", "c1");
    renderSwatches("gradC2Swatches", "c2");
    refreshGradient();
    function selectionLabel() {
      if (!state.mode) return "Pick a wallpaper above";
      if (state.mode === "preset") return "Selected: " + state.preset;
      if (state.mode === "upload")
        return "Uploaded " + (state.upload.kind === "video" ? "video" : "image");
      if (state.mode === "gradient") return "Custom gradient";
      return "";
    }
    function updateUI() {
      $("#targetCount").textContent = state.targets.size;
      $("#selection").innerHTML = (state.mode ? '<span class="ok">\u2713</span> ' : "") + selectionLabel();
      $("#apply").disabled = state.targets.size === 0 || !state.mode;
    }
    function buildRoute() {
      var p = new URLSearchParams();
      if (state.mode === "preset") {
        p.set("preset", state.preset);
      } else if (state.mode === "upload") {
        p.set("src", state.upload.dataUrl);
        p.set("kind", state.upload.kind);
        if (state.edit.fit !== EDIT_DEFAULT.fit) p.set("fit", state.edit.fit);
        if (state.edit.zoom !== EDIT_DEFAULT.zoom) p.set("zoom", state.edit.zoom);
        if (state.edit.posX !== EDIT_DEFAULT.posX) p.set("px", Math.round(state.edit.posX));
        if (state.edit.posY !== EDIT_DEFAULT.posY) p.set("py", Math.round(state.edit.posY));
      } else if (state.mode === "gradient") {
        p.set("grad", gradientCss(state.gradient));
      }
      if (state.edit.opacity !== EDIT_DEFAULT.opacity) p.set("op", state.edit.opacity);
      if (state.edit.borderWidth !== EDIT_DEFAULT.borderWidth) {
        p.set("bw", state.edit.borderWidth);
        p.set("bc", state.edit.borderColor.replace("#", ""));
      }
      return "/wallpaper.html?" + p.toString();
    }
    async function clearAll() {
      var ids = Array.from(state.activeSurfaces.values());
      state.activeSurfaces.clear();
      for (var i = 0; i < ids.length; i++) {
        try {
          await call("surface.destroy", { surfaceId: ids[i] });
        } catch (e) {
        }
      }
      toast("Cleared");
    }
    $("#clear").addEventListener("click", clearAll);
    $("#apply").addEventListener("click", async function() {
      var route = buildRoute();
      var ok = 0, fail = 0;
      for (var displayId of state.targets) {
        var existing = state.activeSurfaces.get(displayId);
        if (existing) {
          try {
            await call("surface.destroy", { surfaceId: existing });
          } catch (e) {
          }
          state.activeSurfaces.delete(displayId);
        }
        try {
          var r = await call("surface.create", { displayId, route });
          state.activeSurfaces.set(displayId, r.surfaceId);
          ok++;
        } catch (e) {
          fail++;
          console.error("apply on " + displayId + ":", e);
        }
      }
      if (fail === 0) toast("Applied to " + ok + " screen(s)");
      else if (ok === 0) toast(fail + " failed", "err");
      else toast(ok + " applied \xB7 " + fail + " failed");
    });
    loadDisplays().catch(function(e) {
      toast("display.list failed: " + (e && e.message), "err");
    });
  })();
})();
