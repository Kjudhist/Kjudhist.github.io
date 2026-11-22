/* ==========================================================================
   The gate: a navy glazed plate, mended with gold.

   Plate:  drawn on one canvas behind the page. The light follows the
           pointer across the glaze. Tap the glaze (the outer ring, not the
           doors) and it cracks from that point; then gold flows slowly
           into the cracks and stays. The plate already carries one old mend.
   Doors:  the plate's inner well is broken in two, and each half is a link.
           QA is a clean straight cut: a straight gold seam with ruled
           ticks along it. The atelier is the other half, its seams
           branching across it like rivers, glowing and running with light.
           Hover or focus lifts a half and brightens its seam; click or
           Enter and it lifts away and the next page's glaze washes in.
           Ctrl/cmd/middle clicks open a new tab the normal way.
   ========================================================================== */

(function () {
  'use strict';

  const K = window.Kintsugi;
  const stage = document.querySelector('[data-gate]');
  const canvas = document.querySelector('[data-plate]');
  if (!stage || !K) return;

  const OPEN_MS = 700;
  const REDUCED_MS = 150;
  const reduced = K.reduced();
  const doors = Array.from(stage.querySelectorAll('[data-door]'));
  const tall = window.matchMedia('(max-width: 700px)');
  const ctx = canvas ? canvas.getContext('2d') : null;
  let entering = false;

  let view = { w: 1, h: 1, dpr: 1 };
  let G = null;        // geometry, rebuilt on resize
  let tex = null;      // the painted plate
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, seen: false };
  const halves = doors.map(function (door, i) {
    return { door: door, side: i === 0 ? 1 : -1, hot: 0, hotT: 0, sep: 0, sepT: 0 };
  });
  // cracks are kept in plate terms (angle, distance) so they survive a resize
  const mends = [{ ang: -0.75, frac: 0.82, seed: 41, t0: -1e9 }, { ang: 2.45, frac: 0.86, seed: 77, t0: -1e9 }];
  let dust = [];

  /* ------------------------------------------------------------ layout */

  function layout() {
    if (!ctx) return;
    view = K.fit(canvas);
    const b = stage.getBoundingClientRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    const rr = b.width / 2;
    const R = rr / 0.66;
    const deg = Math.PI / 180;
    const u = tall.matches ? { x: Math.cos(6 * deg), y: -Math.sin(6 * deg) } : { x: Math.sin(8 * deg), y: -Math.cos(8 * deg) };
    const n = { x: u.y, y: -u.x }; // toward the QA half
    const cut = K.voronoi(K.circle(cx, cy, rr, 160), [
      { x: cx + n.x * 40, y: cy + n.y * 40 },
      { x: cx - n.x * 40, y: cy - n.y * 40 }
    ], 0);
    const ends = [{ x: cx - u.x * rr, y: cy - u.y * rr }, { x: cx + u.x * rr, y: cy + u.y * rr }];
    G = { cx: cx, cy: cy, rr: rr, R: R, u: u, n: n, ends: ends };
    halves.forEach(function (h, i) {
      h.poly = cut.shards[i].poly;
      h.path = K.pathOf(h.poly);
    });
    G.edge = K.measure([[ends[0], ends[1]]], ends[0].x, ends[0].y);
    G.rivers = rivers();
    tex = paintPlate();
    mends.forEach(function (m) {
      m.lines = crackAt(m);
    });
    if (!pointer.seen) {
      pointer.x = pointer.tx = cx - R * 0.5;
      pointer.y = pointer.ty = cy - R * 0.6;
    }
    if (!dust.length) {
      for (let i = 0; i < 44; i++) dust.push(newMote(true));
    }
  }

  function newMote(anywhere) {
    return {
      x: Math.random() * view.w,
      y: anywhere ? Math.random() * view.h : view.h + 10,
      vy: -(4 + Math.random() * 10),
      vx: (Math.random() - 0.5) * 4,
      r: 0.5 + Math.random() * 1.3,
      tw: Math.random() * Math.PI * 2
    };
  }

  function paintPlate() {
    const R = G.R;
    const size = Math.ceil(R * 2 + 4);
    const o = { x: G.cx - R - 2, y: G.cy - R - 2 };
    const lc = { x: R + 2, y: R + 2 };
    const shape = new Path2D();
    shape.arc(lc.x, lc.y, R, 0, Math.PI * 2);
    const c = K.glaze(size, size, shape, {
      seed: 5,
      light: { x: lc.x - R * 0.35, y: lc.y - R * 0.4 },
      pool: { x: lc.x, y: lc.y, r: G.rr * 1.05 },
      crackle: Math.round(R * 0.9)
    });
    const g = c.getContext('2d');
    g.save();
    g.clip(shape);
    // rings left by the wheel
    const rand = K.rng(9);
    for (let i = 0; i < 26; i++) {
      g.beginPath();
      g.arc(lc.x, lc.y, G.rr + rand() * (R - G.rr), 0, Math.PI * 2);
      g.strokeStyle = rand() < 0.5 ? 'rgba(150, 175, 255, 0.035)' : 'rgba(2, 6, 26, 0.12)';
      g.lineWidth = 1 + rand() * 2;
      g.stroke();
    }
    // the step down into the well
    g.beginPath();
    g.arc(lc.x, lc.y, G.rr + 3, 0, Math.PI * 2);
    g.strokeStyle = 'rgba(2, 6, 26, 0.55)';
    g.lineWidth = 5;
    g.stroke();
    g.beginPath();
    g.arc(lc.x, lc.y, G.rr + 7, 0, Math.PI * 2);
    g.strokeStyle = 'rgba(150, 175, 255, 0.14)';
    g.lineWidth = 2;
    g.stroke();
    // the rim: glaze thins and pales at the edge
    const rim = g.createRadialGradient(lc.x, lc.y, R * 0.9, lc.x, lc.y, R);
    rim.addColorStop(0, 'rgba(2, 6, 26, 0)');
    rim.addColorStop(0.6, 'rgba(2, 6, 26, 0.35)');
    rim.addColorStop(0.9, 'rgba(120, 150, 240, 0.18)');
    rim.addColorStop(1, 'rgba(180, 200, 255, 0.35)');
    g.fillStyle = rim;
    g.fillRect(0, 0, size, size);
    g.restore();
    return { canvas: c, x: o.x, y: o.y };
  }

  function inRing(x, y) {
    const d = Math.hypot(x - G.cx, y - G.cy);
    return d > G.rr + 10 && d < G.R - 5;
  }

  function crackAt(m) {
    const d = G.rr + (G.R - G.rr) * m.frac * 0.92;
    const x = G.cx + Math.cos(m.ang) * d;
    const y = G.cy + Math.sin(m.ang) * d;
    return K.cracks(x, y, {
      rand: K.rng(m.seed),
      count: 5 + (m.seed % 3),
      len: (G.R - G.rr) * 1.3,
      step: Math.max(7, G.R * 0.025),
      branch: 0.14,
      wander: 0.75,
      inside: inRing
    });
  }

  // the atelier's rivers: gold seams that rise from the cut and branch away
  function rivers() {
    const rand = K.rng(23);
    const lines = [];
    const n = G.n;
    const inArt = function (x, y) {
      const dx = x - G.cx;
      const dy = y - G.cy;
      return Math.hypot(dx, dy) < G.rr - 5 && dx * n.x + dy * n.y < -5;
    };
    // three rivers leave the cut, fanning out; tributaries branch off them
    [[-0.66, 0.75], [0.02, 0.05], [0.6, -0.7]].forEach(function (spec, i) {
      const t = spec[0];
      const x = G.cx + G.u.x * G.rr * t - n.x * 3;
      const y = G.cy + G.u.y * G.rr * t - n.y * 3;
      // u points "up" the cut on wide screens; fan away from the cut
      const away = Math.atan2(-n.y, -n.x) + spec[1] * (G.u.y < -0.5 ? -1 : 1) + (rand() - 0.5) * 0.2;
      const set = K.cracks(x, y, {
        rand: K.rng(31 + i * 7),
        count: 1,
        len: G.rr * 1.05,
        step: Math.max(8, G.rr * 0.06),
        branch: 0.32,
        wander: 0.45
      });
      // cracks() spreads its walks round the clock: point this one away from the cut
      if (!set.length) return;
      const trunk = set[set.length - 1]; // branches are finished first, the trunk last
      const rot = away - Math.atan2(trunk[1].y - trunk[0].y, trunk[1].x - trunk[0].x);
      const c = Math.cos(rot);
      const s = Math.sin(rot);
      set.forEach(function (line) {
        line.forEach(function (p) {
          const dx = p.x - x;
          const dy = p.y - y;
          p.x = x + dx * c - dy * s;
          p.y = y + dx * s + dy * c;
        });
      });
      set.forEach(function (line) {
        const kept = [];
        for (let k = 0; k < line.length; k++) {
          if (!inArt(line[k].x, line[k].y) && k > 0) break;
          kept.push(line[k]);
        }
        if (kept.length > 1) lines.push(kept);
      });
    });
    return lines;
  }

  /* -------------------------------------------------------------- draw */

  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function offsetOf(h) {
    const lift = h.hot * 7 + ease(h.sep) * G.R * 0.35;
    return { x: G.n.x * h.side * lift, y: G.n.y * h.side * lift - ease(h.sep) * G.R * 0.12 };
  }

  function draw(time) {
    if (!ctx || !G) return;
    const d = view.dpr;
    const R = G.R;
    ctx.setTransform(d, 0, 0, d, 0, 0);

    // the void around the plate
    const bg = ctx.createRadialGradient(G.cx, G.cy, R * 0.4, G.cx, G.cy, Math.max(view.w, view.h) * 0.85);
    bg.addColorStop(0, '#0f2160');
    bg.addColorStop(0.45, '#081342');
    bg.addColorStop(1, '#030720');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, view.w, view.h);

    // dust in the light
    ctx.save();
    dust.forEach(function (m) {
      const a = 0.25 + 0.35 * Math.sin(m.tw + time * 0.0016);
      ctx.fillStyle = 'rgba(240, 210, 140, ' + Math.max(0, a).toFixed(3) + ')';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // the plate's shadow, then the plate
    ctx.save();
    ctx.translate(G.cx, G.cy + R * 0.07);
    ctx.scale(1, 0.96);
    const sh = ctx.createRadialGradient(0, 0, R * 0.8, 0, 0, R * 1.14);
    sh.addColorStop(0, 'rgba(0, 2, 14, 0.7)');
    sh.addColorStop(1, 'rgba(0, 2, 14, 0)');
    ctx.fillStyle = sh;
    ctx.fillRect(-R * 1.2, -R * 1.2, R * 2.4, R * 2.4);
    ctx.restore();
    ctx.drawImage(tex.canvas, tex.x, tex.y);

    // cracks in the glaze, and the gold flowing into them
    mends.forEach(function (m) {
      const age = time - m.t0;
      const crackFront = reduced ? Infinity : age * 1.4;
      const goldFront = reduced ? Infinity : Math.max(0, age - 380) * 0.11;
      const full = goldFront > (G.R - G.rr) * 1.4;
      if (!full) K.crackLines(ctx, m.lines, crackFront, 1);
      const glow = full ? Math.max(0.12, 1 - (age - 380 - (G.R - G.rr) * 1.4 / 0.11) / 2500) : 1;
      K.seams(ctx, m.lines, goldFront, glow, 0.9);
      if (!full && goldFront > 0) {
        // the head of the flow glows
        m.lines.forEach(function (line) {
          for (let i = 1; i < line.length; i++) {
            if (line[i].d >= goldFront && line[i - 1].d < goldFront) {
              K.glint(ctx, line[i - 1].x, line[i - 1].y, 9, 0.8);
              break;
            }
          }
        });
      }
    });

    // the well beneath the halves
    ctx.save();
    ctx.beginPath();
    ctx.arc(G.cx, G.cy, G.rr + 1, 0, Math.PI * 2);
    const well = ctx.createRadialGradient(G.cx, G.cy, 0, G.cx, G.cy, G.rr);
    well.addColorStop(0, '#02051a');
    well.addColorStop(1, '#070f38');
    ctx.fillStyle = well;
    ctx.fill();
    ctx.restore();

    // the two halves: the chosen one is drawn last, on top
    const order = halves.slice().sort(function (a, b) {
      return a.sep - b.sep;
    });
    order.forEach(function (h) {
      drawHalf(h, time);
    });

    // the light, following the pointer
    const L = {
      x: G.cx + (pointer.x - G.cx) * 0.42,
      y: G.cy + (pointer.y - G.cy) * 0.42
    };
    ctx.save();
    ctx.beginPath();
    ctx.arc(G.cx, G.cy, R, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    K.spec(ctx, L.x, L.y, R * 0.6, 0.42);
    K.spec(ctx, L.x, L.y, R * 0.13, 0.55);
    ctx.restore();
    // and the rim catching it on the near side
    const phi = Math.atan2(pointer.y - G.cy, pointer.x - G.cx);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(190, 210, 255, 0.22)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(G.cx, G.cy, R - 2, phi - 0.8, phi + 0.8);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(230, 238, 255, 0.35)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(G.cx, G.cy, R - 1.5, phi - 0.35, phi + 0.35);
    ctx.stroke();
    ctx.restore();
  }

  function drawHalf(h, time) {
    const off = offsetOf(h);
    const sep = ease(h.sep);
    const others = halves.some(function (o) {
      return o !== h && o.sep > 0;
    });
    ctx.save();
    if (others) ctx.globalAlpha = 1 - 0.55 * Math.max.apply(null, halves.map(function (o) { return o === h ? 0 : ease(o.sep); }));
    ctx.translate(off.x, off.y);
    if (sep) {
      ctx.translate(G.cx, G.cy);
      ctx.rotate(sep * h.side * 0.12);
      ctx.scale(1 + sep * 0.05, 1 + sep * 0.05);
      ctx.translate(-G.cx, -G.cy);
    }
    // lifted shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 2, 14, 0.75)';
    ctx.shadowBlur = 8 + h.hot * 22 + sep * 30;
    ctx.shadowOffsetY = 2 + h.hot * 10 + sep * 24;
    ctx.fillStyle = '#081342';
    ctx.fill(h.path);
    ctx.restore();
    // the glaze, continuous with the plate
    ctx.save();
    ctx.clip(h.path);
    ctx.drawImage(tex.canvas, tex.x, tex.y);
    if (h.hot > 0.01) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(50, 80, 200, ' + (h.hot * 0.07).toFixed(3) + ')';
      ctx.fill(h.path);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (h.side === 1) drawRule(h);
    else drawRivers(h, time);
    // a soft deep pool under the label, so it reads
    const lc = { x: G.cx + G.n.x * h.side * G.rr * 0.48, y: G.cy + G.n.y * h.side * G.rr * 0.48 };
    const pool = ctx.createRadialGradient(lc.x, lc.y, 0, lc.x, lc.y, G.rr * 0.42);
    pool.addColorStop(0, 'rgba(4, 10, 40, 0.5)');
    pool.addColorStop(1, 'rgba(4, 10, 40, 0)');
    ctx.fillStyle = pool;
    ctx.fillRect(lc.x - G.rr, lc.y - G.rr, G.rr * 2, G.rr * 2);
    ctx.restore();
    // the cut edge, gold on both halves
    K.seams(ctx, G.edge, Infinity, 0.15 + h.hot * 0.85, 0.6 + h.hot * 0.3);
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(200, 212, 245, 0.18)';
    ctx.stroke(h.path);
    ctx.restore();
  }

  // QA: ruled ticks along the straight seam. Calm and exact.
  function drawRule(h) {
    const u = G.u;
    const n = G.n;
    const step = G.rr / 22;
    const a = 0.4 + h.hot * 0.5;
    ctx.save();
    ctx.lineCap = 'butt';
    for (let k = -22; k <= 22; k++) {
      const t = k * step;
      const major = k % 5 === 0;
      const len = major ? 13 : 6;
      if (Math.sqrt(Math.max(0, G.rr * G.rr - t * t)) < len + 10) continue;
      const px = G.cx + u.x * t + n.x * 5;
      const py = G.cy + u.y * t + n.y * 5;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + n.x * len, py + n.y * len);
      ctx.strokeStyle = 'rgba(224, 185, 94, ' + (major ? a : a * 0.65).toFixed(3) + ')';
      ctx.lineWidth = major ? 1.1 : 0.8;
      ctx.stroke();
    }
    // a hairline parallel to the cut, the way a draughtsman would rule it
    ctx.beginPath();
    const off = 24;
    const half = Math.sqrt(G.rr * G.rr - off * off) - 4;
    ctx.moveTo(G.cx + n.x * off - u.x * half, G.cy + n.y * off - u.y * half);
    ctx.lineTo(G.cx + n.x * off + u.x * half, G.cy + n.y * off + u.y * half);
    ctx.strokeStyle = 'rgba(224, 185, 94, ' + (0.16 + h.hot * 0.2).toFixed(3) + ')';
    ctx.lineWidth = 0.75;
    ctx.setLineDash([2, 5]);
    ctx.stroke();
    ctx.restore();
  }

  // The atelier: rivers of gold that breathe, with light running down them.
  function drawRivers(h, time) {
    const breathe = reduced ? 0.6 : 0.5 + 0.25 * Math.sin(time * 0.0012);
    K.seams(ctx, G.rivers, Infinity, Math.min(1, breathe + h.hot * 0.6), 0.8);
    if (reduced) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < G.rivers.length; i++) {
      const line = G.rivers[i];
      const speed = 2600 + (i % 3) * 700;
      const t = ((time + i * 977) % speed) / speed;
      const p = K.along(line, t);
      K.glint(ctx, p.x, p.y, 7 + h.hot * 4, (0.45 + h.hot * 0.4) * Math.sin(t * Math.PI));
    }
    ctx.restore();
  }

  /* -------------------------------------------------------------- loop */

  let last = 0;
  const loop = K.loop(null, function (time) {
    const dt = Math.min(0.05, (time - (last || time)) / 1000);
    last = time;
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 6);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 6);
    halves.forEach(function (h) {
      h.hot += (h.hotT - h.hot) * Math.min(1, dt * 9);
      if (h.sepT > h.sep) h.sep = Math.min(h.sepT, h.sep + dt / (OPEN_MS / 1000));
      else h.sep = h.sepT;
      const off = offsetOf(h);
      h.door.style.setProperty('--lx', off.x.toFixed(1) + 'px');
      h.door.style.setProperty('--ly', off.y.toFixed(1) + 'px');
    });
    dust.forEach(function (m, i) {
      // the motes drift up, and lean toward the light
      m.x += (m.vx + (pointer.x - m.x) * 0.004) * dt;
      m.y += m.vy * dt;
      if (m.y < -10) dust[i] = newMote(false);
    });
    draw(time);
  });

  function redraw() {
    draw(performance.now());
  }

  /* ------------------------------------------------------------ events */

  function onResize() {
    layout();
    redraw();
  }

  window.addEventListener('resize', onResize);
  tall.addEventListener('change', onResize);
  document.addEventListener('langchange', function () {
    // the labels may change the layout a little
    window.requestAnimationFrame(onResize);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(onResize);

  window.addEventListener('pointermove', function (event) {
    pointer.tx = event.clientX;
    pointer.ty = event.clientY;
    if (!pointer.seen) {
      pointer.seen = true;
      pointer.x = pointer.tx;
      pointer.y = pointer.ty;
    }
    if (reduced) {
      pointer.x = pointer.tx;
      pointer.y = pointer.ty;
      redraw();
    }
  }, { passive: true });

  // tap the glaze to crack it
  document.addEventListener('click', function (event) {
    if (entering || !G) return;
    if (event.target.closest('a, button, input, label, .lang')) return;
    const x = event.clientX;
    const y = event.clientY;
    if (!inRing(x, y)) return;
    const ang = Math.atan2(y - G.cy, x - G.cx);
    const frac = (Math.hypot(x - G.cx, y - G.cy) - G.rr) / ((G.R - G.rr) * 0.92);
    const m = { ang: ang, frac: frac, seed: (Math.random() * 1e9) | 0, t0: performance.now() };
    m.lines = crackAt(m);
    mends.push(m);
    if (mends.length > 24) mends.splice(2, 1);
    if (reduced) redraw();
  });

  function setHot(h, on) {
    if (entering) return;
    h.hotT = on ? 1 : 0;
    h.door.classList.toggle('is-hot', on);
    if (reduced) {
      h.hot = h.hotT;
      redraw();
    }
  }

  halves.forEach(function (h) {
    h.door.addEventListener('pointerenter', function () {
      setHot(h, true);
    });
    h.door.addEventListener('pointerleave', function () {
      setHot(h, false);
    });
    h.door.addEventListener('focus', function () {
      setHot(h, true);
    });
    h.door.addEventListener('blur', function () {
      setHot(h, false);
    });
    h.door.addEventListener('dragstart', function (event) {
      event.preventDefault();
    });
    h.door.addEventListener('click', function (event) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      enterDoor(h.door);
    });
  });

  function enterDoor(door) {
    if (entering) return Promise.resolve();
    const h = halves.find(function (x) {
      return x.door === door;
    });
    entering = true;
    door.classList.add('is-open');
    stage.classList.add('has-open');
    h.sepT = 1;
    if (reduced) {
      h.sep = 1;
      redraw();
    }
    return window.site.wait(reduced ? REDUCED_MS : OPEN_MS).then(function () {
      return window.site.leaveTo(door.href, door.getAttribute('data-tone'));
    });
  }

  function resetDoors() {
    entering = false;
    stage.classList.remove('has-open');
    halves.forEach(function (h) {
      h.door.classList.remove('is-open', 'is-hot');
      h.sep = h.sepT = 0;
      h.hot = h.hotT = 0;
    });
    document.documentElement.classList.remove('is-leaving');
    redraw();
  }

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) resetDoors();
  });

  layout();
  redraw();
  if (!reduced) loop.start();

  window.gate = {
    enterDoor: enterDoor,
    resetDoors: resetDoors
  };
})();
