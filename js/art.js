/* ==========================================================================
   The atelier: a night garden.

   Garden:  drag across the hero to paint a branch. The wood follows your
            stroke, thinning as it goes; twigs sprout off it, buds swell and
            open into flowers. Finished growth is baked into a still layer
            so any number of branches stay cheap. Blossoms let petals go;
            they fall into the pond at the bottom, ripple, float and melt.
            The pond shows the branches upside down, wavering.
   Drift:   a few petals drift behind the rest of the page; the pointer is
            wind.
   Viewer:  any [data-view] button with an <img> opens full size, with
            data-title and data-meta for the caption.
   ========================================================================== */

(function () {
  'use strict';

  const S = window.Sakura;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --------------------------------------------------------------- garden */

  function initGarden() {
    const root = document.querySelector('[data-garden]');
    if (!root || !S) return;
    const canvas = root.querySelector('canvas');
    const g = canvas.getContext('2d');
    const ui = root.querySelector('[data-garden-ui]');
    const clearBtn = root.querySelector('[data-garden-clear]');
    const wind = new S.Wind({ base: 10, radius: 120 });

    let W = 0;
    let H = 0;
    let dpr = 1;
    let pondY = 0;
    let baked = null;         // finished wood and flowers
    let bg = null;            // sky, stars, pond
    let bk = null;
    let live = [];            // growing twig segments
    let opening = [];         // buds becoming flowers
    let blossoms = [];        // where petals can come from
    let ripples = [];
    let stroke = null;
    let now = 0;
    let emitAcc = 0;
    let engine = null;
    let autoPainting = false;

    const petals = new S.Petals({
      max: 260,
      restMax: 120,
      ground: function () {
        return pondY + 10 + Math.random() * (H - pondY - 18);
      },
      onLand: function (p) {
        p.fade = 0.07 + Math.random() * 0.05;
        p.drift = 6 + Math.random() * 10;
        ripples.push({ x: p.x, y: p.y, r: 2, life: 1 });
      }
    });

    function layout() {
      const old = baked;
      const oldW = W;
      const size = S.fit(canvas);
      W = size.w;
      H = size.h;
      dpr = size.dpr;
      pondY = H * 0.8;
      petals.w = W;
      petals.h = H;
      baked = document.createElement('canvas');
      baked.width = canvas.width;
      baked.height = canvas.height;
      bk = baked.getContext('2d');
      if (old && oldW) bk.drawImage(old, 0, 0, baked.width, baked.height);
      buildBackground();
    }

    function buildBackground() {
      bg = document.createElement('canvas');
      bg.width = canvas.width;
      bg.height = canvas.height;
      const b = bg.getContext('2d');
      const r = S.rng(7);
      let gr = b.createLinearGradient(0, 0, 0, pondY * dpr);
      gr.addColorStop(0, '#040a26');
      gr.addColorStop(1, '#0b1848');
      b.fillStyle = gr;
      b.fillRect(0, 0, bg.width, pondY * dpr);
      for (let i = 0; i < W * pondY / 5000; i++) {
        b.fillStyle = 'rgba(238,241,251,' + (0.15 + r() * 0.55).toFixed(2) + ')';
        b.beginPath();
        b.arc(r() * W * dpr, r() * pondY * 0.9 * dpr, (r() < 0.1 ? 1.2 : 0.6) * dpr, 0, S.TAU);
        b.fill();
      }
      // the moon, high on the right
      const mx = W * (W > 760 ? 0.8 : 0.76);
      const my = pondY * 0.24;
      const mr = Math.max(46, Math.min(110, Math.min(W, H) * 0.11));
      gr = b.createRadialGradient(mx * dpr, my * dpr, mr * 0.8 * dpr, mx * dpr, my * dpr, mr * 4 * dpr);
      gr.addColorStop(0, 'rgba(220, 228, 255, 0.24)');
      gr.addColorStop(1, 'rgba(220, 228, 255, 0)');
      b.fillStyle = gr;
      b.fillRect(0, 0, bg.width, pondY * dpr);
      gr = b.createRadialGradient((mx - mr * 0.3) * dpr, (my - mr * 0.3) * dpr, 0, mx * dpr, my * dpr, mr * dpr);
      gr.addColorStop(0, '#fbfaf5');
      gr.addColorStop(1, '#e1e4ee');
      b.fillStyle = gr;
      b.beginPath();
      b.arc(mx * dpr, my * dpr, mr * dpr, 0, S.TAU);
      b.fill();
      // the far bank
      b.fillStyle = '#060d31';
      b.beginPath();
      b.moveTo(0, pondY * dpr);
      for (let x = 0; x <= W + 8; x += 8) {
        b.lineTo(x * dpr, (pondY - 10 - 8 * Math.sin(x * 0.006) - 5 * Math.sin(x * 0.019)) * dpr);
      }
      b.lineTo(W * dpr, pondY * dpr);
      b.fill();
      // the water
      gr = b.createLinearGradient(0, pondY * dpr, 0, H * dpr);
      gr.addColorStop(0, '#081241');
      gr.addColorStop(1, '#040a26');
      b.fillStyle = gr;
      b.fillRect(0, pondY * dpr, bg.width, (H - pondY) * dpr);
      b.fillStyle = 'rgba(143,165,255,0.35)';
      b.fillRect(0, pondY * dpr, bg.width, 1 * dpr);
      // the moon's path on the water
      for (let i = 0; i < 26; i++) {
        const y = pondY + 6 + i * (H - pondY) / 28;
        const w = mr * (0.9 - i * 0.02) * (0.6 + r() * 0.6);
        b.fillStyle = 'rgba(238, 241, 251,' + (0.28 - i * 0.009).toFixed(3) + ')';
        b.fillRect((mx - w / 2 + (r() - 0.5) * 10) * dpr, y * dpr, w * dpr, 1.2 * dpr);
      }
    }

    /* growing */

    function addFlower(x, y, size, delay) {
      opening.push({
        x: x,
        y: y,
        s: size,
        rot: Math.random() * S.TAU,
        spr: S.sprites.flowers[Math.floor(Math.random() * 4)],
        t0: now + delay
      });
    }

    function sprout(x, y, a, w) {
      const side = Math.random() < 0.5 ? -1 : 1;
      const tr = S.growTree({
        x: x,
        y: y,
        angle: a + side * (0.6 + Math.random() * 0.5),
        len: 16 + Math.random() * 18,
        width: Math.max(1.2, w * 0.5),
        depth: 2,
        seed: Math.floor(Math.random() * 1e6),
        spread: 0.7,
        shrink: 0.7
      });
      const t0 = now;
      tr.segs.forEach(function (s) {
        s.t0 = t0 + s.level * 0.25;
        s.dur = 0.3;
        s.p = 0;
        live.push(s);
      });
      tr.tips.forEach(function (tip) {
        addFlower(tip.x, tip.y, 14 + Math.random() * 10, (tip.level + 1) * 0.25 + 0.2 + Math.random() * 0.4);
        if (Math.random() < 0.6) addFlower(tip.x + (Math.random() - 0.5) * 12, tip.y + (Math.random() - 0.5) * 12, 10 + Math.random() * 8, 0.8 + Math.random() * 0.6);
      });
    }

    function begin(x, y) {
      stroke = { x: x, y: y, len: 0, w: 8 + Math.random() * 3, next: 30 };
      if (ui) ui.classList.add('is-painting');
    }

    function extend(x, y) {
      if (!stroke) return;
      const dx = x - stroke.x;
      const dy = y - stroke.y;
      const d = Math.hypot(dx, dy);
      if (d < 5) return;
      const w = Math.max(1.4, stroke.w - stroke.len * 0.011);
      const w2 = Math.max(1.2, stroke.w - (stroke.len + d) * 0.011);
      const seg = { x: stroke.x, y: stroke.y, cx: (stroke.x + x) / 2, cy: (stroke.y + y) / 2, x2: x, y2: y, w: w, w2: w2 };
      S.drawSegs(bk, [seg], dpr, { rim: 'rgba(150, 170, 240, 0.35)', wood: '#040a24', rimX: 1, rimY: -1 });
      stroke.len += d;
      const a = Math.atan2(dy, dx);
      if (stroke.len > stroke.next) {
        stroke.next = stroke.len + 26 + Math.random() * 30;
        if (w > 1.6) sprout(x, y, a, w);
        else addFlower(x, y, 12 + Math.random() * 8, 0.3);
      }
      if (Math.random() < 0.25) addFlower(x + (Math.random() - 0.5) * 8, y + (Math.random() - 0.5) * 8, 8 + Math.random() * 7, 0.4 + Math.random() * 0.6);
      stroke.x = x;
      stroke.y = y;
      if (stroke.len > 900) end();
    }

    function end() {
      if (!stroke) return;
      for (let i = 0; i < 4; i++) addFlower(stroke.x + (Math.random() - 0.5) * 16, stroke.y + (Math.random() - 0.5) * 16, 14 + Math.random() * 10, 0.2 + i * 0.15);
      stroke = null;
      if (ui) ui.classList.remove('is-painting');
    }

    function bakeFinished() {
      for (let i = live.length - 1; i >= 0; i--) {
        const s = live[i];
        s.p = reduced ? 1 : Math.max(0, Math.min(1, (now - s.t0) / s.dur));
        if (s.p >= 1) {
          S.drawSegs(bk, [s], dpr, { rim: 'rgba(150, 170, 240, 0.35)', wood: '#040a24', rimX: 1, rimY: -1 });
          live.splice(i, 1);
        }
      }
      for (let i = opening.length - 1; i >= 0; i--) {
        const f = opening[i];
        if (reduced || now - f.t0 > 0.9) {
          drawFlower(bk, f, 1);
          blossoms.push({ x: f.x, y: f.y });
          if (blossoms.length > 500) blossoms.shift();
          opening.splice(i, 1);
        }
      }
    }

    function drawFlower(c, f, k) {
      const s = f.s * dpr;
      if (k < 0.35) {
        // a bud, swelling
        const b = (6 + 6 * k / 0.35) * dpr;
        c.setTransform(1, 0, 0, 1, f.x * dpr, f.y * dpr);
        c.drawImage(S.sprites.bud, -b / 2, -b / 2, b, b);
      } else {
        const e = S.easeOutBack((k - 0.35) / 0.65);
        const sz = s * Math.max(0.2, e);
        const r = f.rot - (1 - e) * 0.8;
        c.setTransform(Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), f.x * dpr, f.y * dpr);
        c.drawImage(f.spr, -sz / 2, -sz / 2, sz, sz);
      }
      c.setTransform(1, 0, 0, 1, 0, 0);
    }

    /* the frame */

    function drawReflection(t) {
      const top = pondY * dpr;
      const h = (H - pondY) * dpr;
      const step = 3 * dpr;
      g.globalAlpha = 0.22;
      for (let y = 0; y < h; y += step) {
        const shift = Math.sin(t * 1.6 + y * 0.05) * (1 + y / h * 4) * dpr;
        // the whole night above is mirrored, squeezed into the pond
        const k = top / h;
        const sy = top - (y + step) * k;
        if (sy < 0) break;
        g.drawImage(baked, 0, sy, baked.width, step * k, shift, top + y, baked.width, step);
      }
      g.globalAlpha = 1;
    }

    function render(t) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      g.drawImage(bg, 0, 0);
      drawReflection(t);
      // ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        g.strokeStyle = 'rgba(238, 241, 251,' + (r.life * 0.45).toFixed(3) + ')';
        g.lineWidth = 1 * dpr;
        g.beginPath();
        g.ellipse(r.x * dpr, r.y * dpr, r.r * dpr, r.r * 0.28 * dpr, 0, 0, S.TAU);
        g.stroke();
      }
      g.drawImage(baked, 0, 0);
      if (live.length) S.drawSegs(g, live, dpr, { rim: 'rgba(150, 170, 240, 0.35)', wood: '#040a24', rimX: 1, rimY: -1 });
      for (let i = 0; i < opening.length; i++) {
        const k = (now - opening[i].t0) / 0.9;
        if (k > 0) drawFlower(g, opening[i], Math.min(1, k));
      }
      petals.draw(g, dpr);
    }

    function step(dt) {
      wind.step(dt);
      bakeFinished();
      emitAcc += dt * Math.min(10, blossoms.length * 0.04);
      while (emitAcc > 1 && blossoms.length) {
        emitAcc -= 1;
        const b = blossoms[Math.floor(Math.random() * blossoms.length)];
        petals.spawn(b.x + (Math.random() - 0.5) * 10, b.y, 0, 0);
      }
      petals.step(dt, wind);
      petals.list.forEach(function (p) {
        if (p.landed) p.x += p.drift * dt;
      });
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.r += dt * 26;
        r.life -= dt * 0.7;
        if (r.life <= 0) ripples.splice(i, 1);
      }
    }

    // an invisible hand paints the first branch, from the top corner down
    function autoPaint() {
      const pts = [];
      const x0 = W * 1.02;
      const y0 = H * 0.06;
      const x1 = W * (W > 760 ? 0.52 : 0.3);
      const y1 = H * (W > 760 ? 0.42 : 0.36);
      for (let i = 0; i <= 60; i++) {
        const u = i / 60;
        pts.push({
          x: x0 + (x1 - x0) * u,
          y: y0 + (y1 - y0) * u + Math.sin(u * Math.PI * 1.4) * H * 0.08
        });
      }
      begin(pts[0].x, pts[0].y);
      if (reduced) {
        pts.forEach(function (p) {
          extend(p.x, p.y);
        });
        end();
        return;
      }
      autoPainting = true;
      let i = 0;
      const timer = window.setInterval(function () {
        if (!autoPainting) {
          window.clearInterval(timer);
          return;
        }
        i++;
        if (i >= pts.length) {
          window.clearInterval(timer);
          autoPainting = false;
          end();
          return;
        }
        extend(pts[i].x, pts[i].y);
      }, 24);
    }

    /* input */

    function local(event) {
      const r = canvas.getBoundingClientRect();
      return { x: event.clientX - r.left, y: event.clientY - r.top };
    }

    let pointerId = null;
    root.addEventListener('pointerdown', function (event) {
      if (event.button !== 0 || event.target.closest('a, button')) return;
      if (autoPainting) {
        autoPainting = false;
        end();
      }
      pointerId = event.pointerId;
      const p = local(event);
      begin(p.x, p.y);
      if (engine) engine.wake();
    });
    root.addEventListener('pointermove', function (event) {
      const p = local(event);
      wind.point(p.x, p.y);
      if (pointerId === event.pointerId && stroke) {
        extend(p.x, p.y);
        if (engine) engine.wake();
      }
    });
    ['pointerup', 'pointercancel'].forEach(function (type) {
      window.addEventListener(type, function (event) {
        if (pointerId !== event.pointerId) return;
        pointerId = null;
        end();
        if (engine) engine.wake();
      });
    });
    root.addEventListener('pointerleave', function () {
      wind.leave();
    });

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        bk.clearRect(0, 0, baked.width, baked.height);
        live = [];
        opening = [];
        blossoms = [];
        if (engine) engine.wake();
      });
    }

    let resizeTimer = 0;
    let lastW = 0;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        if (Math.abs(canvas.clientWidth - lastW) < 2 && Math.abs(canvas.clientHeight - H) < 120) return;
        lastW = canvas.clientWidth;
        layout();
        if (engine) engine.wake();
      }, 150);
    });

    layout();
    lastW = W;
    if (ui) ui.hidden = false;
    engine = S.loop(root, function (dt, sec) {
      now = sec;
      if (reduced) {
        bakeFinished();
        render(sec);
        return false;
      }
      step(dt);
      render(sec);
      return true;
    });
    // `now` starts once the loop has run a frame
    window.requestAnimationFrame(function (ms) {
      now = ms / 1000;
      autoPaint();
      if (engine) engine.wake();
    });
  }

  /* ---------------------------------------------------------------- drift */

  function initDrift() {
    const canvas = document.querySelector('[data-drift]');
    if (!canvas || !S || reduced) return;
    const g = canvas.getContext('2d');
    const wind = new S.Wind({ base: 12, radius: 160 });
    const petals = new S.Petals({ max: 40, scale: 0.9 });
    let W = 0;
    let H = 0;
    let dpr = 1;
    function layout() {
      const s = S.fit(canvas);
      W = s.w;
      H = s.h;
      dpr = s.dpr;
      petals.w = W;
      petals.h = H;
    }
    layout();
    window.addEventListener('resize', layout);
    for (let i = 0; i < 18; i++) petals.spawn(Math.random() * W, Math.random() * H);
    window.addEventListener('pointermove', function (e) {
      wind.point(e.clientX, e.clientY);
    }, { passive: true });
    let acc = 0;
    S.loop(null, function (dt) {
      wind.step(dt);
      acc += dt * 1.2;
      if (acc > 1 && petals.list.length < 26) {
        acc = 0;
        petals.spawn(-20 + Math.random() * W * 0.6, -20);
      }
      petals.step(dt, wind);
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      petals.draw(g, dpr);
    });
  }

  /* --------------------------------------------------------------- viewer */

  function initViewer() {
    const dialog = document.querySelector('[data-viewer]');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    const img = dialog.querySelector('[data-viewer-img]');
    const title = dialog.querySelector('[data-viewer-title]');
    const meta = dialog.querySelector('[data-viewer-meta]');
    let opener = null;
    let closing = 0;

    function open(button) {
      const source = button.querySelector('img');
      if (!source) return;
      img.src = button.getAttribute('data-full') || source.currentSrc || source.src;
      img.alt = source.alt;
      title.textContent = button.getAttribute('data-title') || '';
      meta.textContent = button.getAttribute('data-meta') || '';
      opener = button;
      window.clearTimeout(closing);
      closing = 0;
      dialog.classList.remove('is-closing');
      dialog.showModal();
    }

    function close() {
      if (!dialog.open || closing) return;
      if (reduced) {
        dialog.close();
        return;
      }
      dialog.classList.add('is-closing');
      closing = window.setTimeout(function () {
        closing = 0;
        dialog.classList.remove('is-closing');
        dialog.close();
      }, 340);
    }

    document.addEventListener('click', function (event) {
      const button = event.target.closest('[data-view]');
      if (button) open(button);
    });
    dialog.querySelector('[data-viewer-close]').addEventListener('click', close);
    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      close();
    });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog || event.target.classList.contains('viewer__inner')) close();
    });
    dialog.addEventListener('close', function () {
      if (opener) opener.focus({ preventScroll: true });
    });
  }

  initGarden();
  initDrift();
  initViewer();
})();
