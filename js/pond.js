/* ==========================================================================
   The atelier's koi pond, seen from the engawa.

   Moving over the water leaves ripples; a click or tap drops food, and the
   koi turn and come for it. When there is nothing to eat they wander, and
   a few drift over to see what the pointer is. The moon's reflection
   wobbles on the surface. Everything is drawn on one canvas; without
   scripts (or before this runs) the still garden under the moon shows.

   Reduced motion: one still frame of the pond, no animation.
   ========================================================================== */

(function () {
  'use strict';

  const pond = document.querySelector('[data-pond]');
  const canvas = pond && pond.querySelector('.pond__canvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // koi in the one ink: white bodies with royal and pale-blue markings
  const COATS = [
    { body: '#eef2fa', spots: '#2449d8' },
    { body: '#eef2fa', spots: '#17318f' },
    { body: '#dfe7f7', spots: '#8eabe3' },
    { body: '#f7f9fc', spots: '#2449d8' },
    { body: '#c9d6f0', spots: '#0c1b4d' },
    { body: '#eef2fa', spots: '#5274d6' },
    { body: '#f7f9fc', spots: '#17318f' }
  ];
  const SEGMENTS = 12;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let last = 0;
  let frameId = 0;
  let visible = true;
  let seed = 7;
  const koi = [];
  const food = [];
  const ripples = [];
  const pads = [];
  const pointer = { x: -1e4, y: -1e4, inside: false, lastRipple: 0, lx: 0, ly: 0 };

  function rand() {
    // a fixed sequence, so the pads land in the same places every visit
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  }

  function resize() {
    const box = canvas.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = box.width;
    h = box.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function placePads() {
    pads.length = 0;
    seed = 7;
    const n = w < 600 ? 3 : 6;
    for (let i = 0; i < n; i++) {
      pads.push({
        x: (0.12 + rand() * 0.76) * w,
        y: (0.12 + rand() * 0.76) * h,
        r: 16 + rand() * 18,
        a: rand() * Math.PI * 2
      });
    }
  }

  function makeKoi() {
    koi.length = 0;
    const n = w < 600 ? 4 : 7;
    for (let i = 0; i < n; i++) {
      const length = (w < 600 ? 52 : 72) + Math.random() * 34;
      const x = (0.15 + Math.random() * 0.7) * w;
      const y = (0.2 + Math.random() * 0.6) * h;
      const heading = Math.random() * Math.PI * 2;
      const spine = [];
      for (let s = 0; s < SEGMENTS; s++) {
        spine.push({ x: x - Math.cos(heading) * s * length / SEGMENTS, y: y - Math.sin(heading) * s * length / SEGMENTS });
      }
      koi.push({
        spine: spine,
        heading: heading,
        speed: 18,
        length: length,
        coat: COATS[i % COATS.length],
        // which segments carry a marking
        spots: [1 + Math.floor(Math.random() * 3), 4 + Math.floor(Math.random() * 3), 7 + Math.floor(Math.random() * 2)],
        target: null,
        wander: Math.random() * 10,
        curious: Math.random() < 0.45,
        flutter: Math.random() * 10
      });
    }
  }

  function ripple(x, y, size) {
    ripples.push({ x: x, y: y, r: 2, max: size, life: 1 });
    if (ripples.length > 40) ripples.shift();
  }

  function drop(x, y) {
    for (let i = 0; i < 3; i++) {
      food.push({ x: x + (Math.random() - 0.5) * 26, y: y + (Math.random() - 0.5) * 18, life: 1, bob: Math.random() * 6 });
    }
    if (food.length > 30) food.splice(0, food.length - 30);
    ripple(x, y, 46);
    ripple(x, y, 26);
  }

  function pickTarget(k) {
    // food first: the nearest pellet
    let best = null;
    let bestD = Infinity;
    food.forEach(function (f) {
      const d = Math.hypot(f.x - k.spine[0].x, f.y - k.spine[0].y);
      if (d < bestD) {
        bestD = d;
        best = f;
      }
    });
    if (best) return { x: best.x, y: best.y, food: best, hurry: true };
    if (k.curious && pointer.inside) {
      const d = Math.hypot(pointer.x - k.spine[0].x, pointer.y - k.spine[0].y);
      if (d < 220) return { x: pointer.x, y: pointer.y, hurry: false, keep: 36 };
    }
    if (!k.target || k.target.food || k.target.keep || Math.hypot(k.target.x - k.spine[0].x, k.target.y - k.spine[0].y) < 30) {
      return { x: (0.08 + Math.random() * 0.84) * w, y: (0.12 + Math.random() * 0.76) * h, hurry: false };
    }
    return k.target;
  }

  function step(dt) {
    koi.forEach(function (k) {
      k.target = pickTarget(k);
      const head = k.spine[0];
      const dx = k.target.x - head.x;
      const dy = k.target.y - head.y;
      const dist = Math.hypot(dx, dy);
      let want = Math.atan2(dy, dx);
      let turn = want - k.heading;
      while (turn > Math.PI) turn -= Math.PI * 2;
      while (turn < -Math.PI) turn += Math.PI * 2;
      const turnRate = k.target.hurry ? 2.6 : 1.3;
      k.heading += Math.max(-turnRate * dt, Math.min(turnRate * dt, turn));
      // a lazy wiggle while cruising
      k.wander += dt;
      k.heading += Math.sin(k.wander * 1.7) * 0.25 * dt;
      let cruise = k.target.hurry ? 70 : 22;
      if (k.target.keep && dist < k.target.keep * 2) cruise = 6;
      k.speed += (cruise - k.speed) * Math.min(1, dt * 1.5);
      head.x += Math.cos(k.heading) * k.speed * dt;
      head.y += Math.sin(k.heading) * k.speed * dt;
      // the body follows the head, one segment length behind each other
      const seg = k.length / SEGMENTS;
      for (let s = 1; s < SEGMENTS; s++) {
        const a = k.spine[s - 1];
        const b = k.spine[s];
        const ang = Math.atan2(b.y - a.y, b.x - a.x);
        b.x = a.x + Math.cos(ang) * seg;
        b.y = a.y + Math.sin(ang) * seg;
      }
      k.flutter += dt * (4 + k.speed / 12);
      if (k.target.food && dist < 10) {
        const i = food.indexOf(k.target.food);
        if (i > -1) {
          food.splice(i, 1);
          ripple(head.x, head.y, 22);
        }
        k.target = null;
      }
    });
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.r += (r.max * 1.2) * dt;
      r.life = 1 - r.r / r.max;
      if (r.life <= 0) ripples.splice(i, 1);
    }
    food.forEach(function (f) {
      f.bob += dt * 2;
      f.x += Math.sin(f.bob) * 2 * dt;
    });
  }

  function drawWater(time) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#060e33');
    g.addColorStop(0.55, '#0b1848');
    g.addColorStop(1, '#0f1f5a');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // the moon on the water, wobbling
    const mx = w * 0.64;
    const my = h * 0.34;
    const wob = Math.sin(time / 900) * 0.06;
    ctx.save();
    ctx.translate(mx, my);
    ctx.scale(1 + wob, 0.82 - wob * 0.5);
    const R = Math.min(70, h * 0.2);
    const moon = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    moon.addColorStop(0, 'rgba(238, 242, 250, 0.6)');
    moon.addColorStop(0.45, 'rgba(238, 242, 250, 0.38)');
    moon.addColorStop(0.5, 'rgba(142, 171, 227, 0.16)');
    moon.addColorStop(1, 'rgba(142, 171, 227, 0)');
    ctx.fillStyle = moon;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // broken streaks of light under it
    ctx.fillStyle = 'rgba(223, 231, 247, 0.12)';
    for (let i = 0; i < 6; i++) {
      const y = my + 50 + i * 11;
      const len = 60 - i * 8 + Math.sin(time / 700 + i) * 10;
      ctx.fillRect(mx - len / 2 + Math.sin(time / 1100 + i * 2) * 8, y, len, 2);
    }
  }

  function drawPads() {
    pads.forEach(function (p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.fillStyle = 'rgba(3, 8, 32, 0.4)';
      ctx.beginPath();
      ctx.moveTo(4, 6);
      ctx.arc(4, 6, p.r, 0.1, Math.PI * 2 - 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#16297a';
      ctx.strokeStyle = 'rgba(142, 171, 227, 0.35)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, p.r, 0.1, Math.PI * 2 - 0.1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });
  }

  function radiusAt(k, s) {
    const t = s / (SEGMENTS - 1);
    // a koi: blunt head, widest a third of the way back, a thin wrist before the tail
    const shape = t < 0.3 ? 0.62 + 0.38 * (t / 0.3) : 1 - 0.82 * Math.pow((t - 0.3) / 0.7, 1.15);
    return k.length * 0.115 * shape + 0.6;
  }

  // the outline of the body: down one side of the spine and back up the other
  function bodyPath(k, ox, oy) {
    const sp = k.spine;
    const left = [];
    const right = [];
    for (let s = 0; s < SEGMENTS; s++) {
      const a = s === 0 ? sp[0] : sp[s - 1];
      const b = s === 0 ? sp[1] : sp[s];
      const ang = Math.atan2(a.y - b.y, a.x - b.x);
      const r = radiusAt(k, s);
      left.push({ x: sp[s].x + ox + Math.cos(ang + Math.PI / 2) * r, y: sp[s].y + oy + Math.sin(ang + Math.PI / 2) * r });
      right.push({ x: sp[s].x + ox + Math.cos(ang - Math.PI / 2) * r, y: sp[s].y + oy + Math.sin(ang - Math.PI / 2) * r });
    }
    const head = Math.atan2(sp[0].y - sp[1].y, sp[0].x - sp[1].x);
    ctx.beginPath();
    ctx.moveTo(left[0].x, left[0].y);
    for (let s = 1; s < SEGMENTS; s++) {
      const p = left[s - 1];
      const q = left[s];
      ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
    }
    ctx.lineTo(right[SEGMENTS - 1].x, right[SEGMENTS - 1].y);
    for (let s = SEGMENTS - 2; s >= 0; s--) {
      const p = right[s + 1];
      const q = right[s];
      ctx.quadraticCurveTo(p.x, p.y, (p.x + q.x) / 2, (p.y + q.y) / 2);
    }
    ctx.lineTo(right[0].x, right[0].y);
    // a rounded snout
    ctx.arc(sp[0].x + ox, sp[0].y + oy, radiusAt(k, 0), head - Math.PI / 2, head + Math.PI / 2);
    ctx.closePath();
  }

  function drawKoi(k, shadow) {
    const sp = k.spine;
    const ox = shadow ? 7 : 0;
    const oy = shadow ? 10 : 0;
    // tail fin, fanned and fluttering
    const tail = sp[SEGMENTS - 1];
    const prev = sp[SEGMENTS - 2];
    const ang = Math.atan2(tail.y - prev.y, tail.x - prev.x) + Math.sin(k.flutter) * 0.35;
    const fin = k.length * 0.22;
    ctx.fillStyle = shadow ? 'rgba(2, 6, 26, 0.45)' : 'rgba(223, 231, 247, 0.55)';
    ctx.beginPath();
    ctx.moveTo(tail.x + ox, tail.y + oy);
    ctx.lineTo(tail.x + ox + Math.cos(ang + 0.5) * fin, tail.y + oy + Math.sin(ang + 0.5) * fin);
    ctx.quadraticCurveTo(tail.x + ox + Math.cos(ang) * fin * 0.6, tail.y + oy + Math.sin(ang) * fin * 0.6,
      tail.x + ox + Math.cos(ang - 0.5) * fin, tail.y + oy + Math.sin(ang - 0.5) * fin);
    ctx.closePath();
    ctx.fill();
    // pectoral fins
    const chest = sp[2];
    const body = Math.atan2(sp[1].y - sp[3].y, sp[1].x - sp[3].x);
    [1, -1].forEach(function (side) {
      const a = body + side * (1.9 + Math.sin(k.flutter * 0.8) * 0.25);
      ctx.beginPath();
      ctx.ellipse(chest.x + ox + Math.cos(a) * radiusAt(k, 2), chest.y + oy + Math.sin(a) * radiusAt(k, 2),
        k.length * 0.1, k.length * 0.045, a, 0, Math.PI * 2);
      ctx.fill();
    });
    // the body, then its markings painted inside the outline
    bodyPath(k, ox, oy);
    ctx.fillStyle = shadow ? 'rgba(2, 6, 26, 0.45)' : k.coat.body;
    ctx.fill();
    if (!shadow) {
      ctx.save();
      bodyPath(k, 0, 0);
      ctx.clip();
      ctx.fillStyle = k.coat.spots;
      k.spots.forEach(function (s, i) {
        const p = sp[s];
        const r = radiusAt(k, s) * (1.05 + (i % 2) * 0.25);
        ctx.beginPath();
        ctx.arc(p.x + (i % 2 ? 1.5 : -1.5), p.y + (i % 2 ? -1 : 1.5), r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }
    if (!shadow) {
      // eyes
      const head = sp[0];
      const a = Math.atan2(sp[0].y - sp[1].y, sp[0].x - sp[1].x);
      ctx.fillStyle = '#0c1b4d';
      [1, -1].forEach(function (side) {
        ctx.beginPath();
        ctx.arc(head.x + Math.cos(a + side * 1.1) * radiusAt(k, 0) * 0.7, head.y + Math.sin(a + side * 1.1) * radiusAt(k, 0) * 0.7, 1.3, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  function draw(time) {
    drawWater(time);
    koi.forEach(function (k) {
      drawKoi(k, true);
    });
    koi.forEach(function (k) {
      drawKoi(k, false);
    });
    drawPads();
    food.forEach(function (f) {
      ctx.fillStyle = 'rgba(207, 220, 241, 0.9)';
      ctx.beginPath();
      ctx.arc(f.x, f.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
    ripples.forEach(function (r) {
      ctx.strokeStyle = 'rgba(223, 231, 247, ' + (r.life * 0.5).toFixed(3) + ')';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r, r.r * 0.8, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
  }

  function loop(time) {
    const dt = Math.min(0.05, (time - (last || time)) / 1000);
    last = time;
    step(dt);
    draw(time);
    frameId = window.requestAnimationFrame(loop);
  }

  function start() {
    if (reduced || frameId || !visible || document.hidden) return;
    last = 0;
    frameId = window.requestAnimationFrame(loop);
  }

  function stop() {
    window.cancelAnimationFrame(frameId);
    frameId = 0;
  }

  function local(event) {
    const box = canvas.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  resize();
  placePads();
  makeKoi();
  // settle the fish into natural curves before the first frame
  for (let i = 0; i < 60; i++) step(1 / 30);
  draw(0);
  pond.classList.add('is-live');
  const hint = pond.querySelector('.pond__hint');
  if (hint) hint.hidden = false;
  start();

  pond.addEventListener('pointermove', function (event) {
    const p = local(event);
    pointer.x = p.x;
    pointer.y = p.y;
    pointer.inside = true;
    const now = window.performance.now();
    if (!reduced && now - pointer.lastRipple > 110 && Math.hypot(p.x - pointer.lx, p.y - pointer.ly) > 22) {
      pointer.lastRipple = now;
      pointer.lx = p.x;
      pointer.ly = p.y;
      ripple(p.x, p.y, 30);
    }
  });
  pond.addEventListener('pointerleave', function () {
    pointer.inside = false;
  });
  pond.addEventListener('click', function (event) {
    const p = local(event);
    drop(p.x, p.y);
    if (reduced) draw(window.performance.now());
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else stop();
    }).observe(pond);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else start();
  });
  window.addEventListener('resize', function () {
    const oldW = w;
    const oldH = h;
    resize();
    if (Math.abs(w - oldW) > 40 || Math.abs(h - oldH) > 40) {
      placePads();
      makeKoi();
    }
    draw(window.performance.now());
  });
})();
