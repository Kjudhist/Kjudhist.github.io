/* ==========================================================================
   Kingyo-sukui (金魚すくい): scooping goldfish at the festival.

   The poi (a paper scoop on a frame) follows the pointer over the tub.
   Press to dip it in; the fish near it scatter. Let go to lift it: any fish
   over the paper may come up with it (slow ones more often) and go in the
   bag. Paper in water weakens, faster when dragged hard, and then it tears.
   Three poi, then "New poi" hands you three more. Fish that are caught are
   replaced after a while.

   Goldfish in the one ink: white, royal, pale blue, and a few deep navy
   demekin. Reduced motion: one still frame of the tub.
   ========================================================================== */

(function () {
  'use strict';

  const root = document.querySelector('[data-kingyo]');
  const canvas = root && root.querySelector('.kingyo__canvas');
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const catchOut = root.querySelector('[data-catch]');
  const poiOut = root.querySelector('[data-poi]');
  const again = root.querySelector('[data-again]');
  const hint = root.querySelector('.kingyo__hint');

  const COATS = [
    { body: '#f7f9fc', patch: '#2449d8', fin: 'rgba(247, 249, 252, 0.7)' },
    { body: '#2449d8', patch: '#f7f9fc', fin: 'rgba(91, 124, 255, 0.6)' },
    { body: '#f7f9fc', patch: '#8eabe3', fin: 'rgba(223, 231, 247, 0.75)' },
    { body: '#0c1b4d', patch: '#17318f', fin: 'rgba(12, 27, 77, 0.55)', demekin: true },
    { body: '#5b7cff', patch: '#f7f9fc', fin: 'rgba(142, 171, 227, 0.7)' }
  ];
  const SEG = 8;
  const POI_R = 34;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let last = 0;
  let frame = 0;
  let visible = true;
  let caught = 0;
  let poisLeft = 3;
  const fish = [];
  const ripples = [];
  const flying = [];
  const poi = { x: -1e3, y: -1e3, over: false, wet: false, life: 1, torn: false, lastX: 0, lastY: 0, tornAt: 0 };

  function t(key) {
    return window.i18n ? window.i18n.t(key) : key;
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

  function addFish(x, y) {
    const coat = COATS[Math.floor(Math.random() * COATS.length)];
    const len = (w < 500 ? 36 : 48) + Math.random() * 18;
    const a = Math.random() * Math.PI * 2;
    const spine = [];
    for (let s = 0; s < SEG; s++) spine.push({ x: x - Math.cos(a) * s * len / SEG, y: y - Math.sin(a) * s * len / SEG });
    fish.push({
      spine: spine, a: a, speed: 20, len: len, coat: coat, wander: Math.random() * 9,
      flutter: Math.random() * 9, panic: 0, tx: x, ty: y, base: 16 + Math.random() * 22
    });
  }

  function populate() {
    fish.length = 0;
    const n = w < 500 ? 7 : 11;
    for (let i = 0; i < n; i++) addFish((0.1 + Math.random() * 0.8) * w, (0.15 + Math.random() * 0.7) * h);
    for (let i = 0; i < 40; i++) step(1 / 30);
  }

  function ripple(x, y, size) {
    ripples.push({ x: x, y: y, r: 3, max: size });
    if (ripples.length > 30) ripples.shift();
  }

  function step(dt) {
    const margin = 24;
    fish.forEach(function (f) {
      const head = f.spine[0];
      // new wandering targets now and then
      if (Math.hypot(f.tx - head.x, f.ty - head.y) < 20 || Math.random() < dt * 0.2) {
        f.tx = margin + Math.random() * (w - margin * 2);
        f.ty = margin + Math.random() * (h - margin * 2);
      }
      let want = Math.atan2(f.ty - head.y, f.tx - head.x);
      // a wet poi nearby: dart away from it
      if (poi.wet && !poi.torn) {
        const d = Math.hypot(head.x - poi.x, head.y - poi.y);
        if (d < 110) {
          want = Math.atan2(head.y - poi.y, head.x - poi.x);
          f.panic = Math.max(f.panic, 1 - d / 110);
        }
      }
      // stay in the tub
      if (head.x < margin || head.x > w - margin || head.y < margin || head.y > h - margin) {
        want = Math.atan2(h / 2 - head.y, w / 2 - head.x);
      }
      let turn = want - f.a;
      while (turn > Math.PI) turn -= Math.PI * 2;
      while (turn < -Math.PI) turn += Math.PI * 2;
      const rate = 2 + f.panic * 5;
      f.a += Math.max(-rate * dt, Math.min(rate * dt, turn));
      f.wander += dt;
      f.a += Math.sin(f.wander * 2.3) * 0.4 * dt;
      const target = f.base + f.panic * 150;
      f.speed += (target - f.speed) * Math.min(1, dt * 3);
      f.panic = Math.max(0, f.panic - dt * 0.8);
      head.x += Math.cos(f.a) * f.speed * dt;
      head.y += Math.sin(f.a) * f.speed * dt;
      const seg = f.len / SEG;
      for (let s = 1; s < SEG; s++) {
        const p = f.spine[s - 1];
        const q = f.spine[s];
        const ang = Math.atan2(q.y - p.y, q.x - p.x);
        q.x = p.x + Math.cos(ang) * seg;
        q.y = p.y + Math.sin(ang) * seg;
      }
      f.flutter += dt * (5 + f.speed / 10);
    });
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.r += r.max * 1.3 * dt;
      if (r.r > r.max) ripples.splice(i, 1);
    }
    for (let i = flying.length - 1; i >= 0; i--) {
      const f = flying[i];
      f.t += dt * 1.6;
      if (f.t >= 1) flying.splice(i, 1);
    }
    // the paper weakens in the water, faster when hauled about
    if (poi.wet && !poi.torn) {
      const moved = Math.hypot(poi.x - poi.lastX, poi.y - poi.lastY);
      poi.life -= dt * 0.32 + moved * 0.0035;
      if (poi.life <= 0) tear();
    }
    poi.lastX = poi.x;
    poi.lastY = poi.y;
  }

  function radius(f, s) {
    const t = s / (SEG - 1);
    const shape = t < 0.35 ? 0.7 + 0.3 * (t / 0.35) : 1 - 0.75 * Math.pow((t - 0.35) / 0.65, 1.2);
    return f.len * 0.21 * shape + 0.5;
  }

  function drawFish(f, x0, y0, scale, alpha) {
    const sp = f.spine;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (scale !== 1) {
      ctx.translate(x0, y0);
      ctx.scale(scale, scale);
      ctx.translate(-sp[0].x, -sp[0].y);
    }
    // the fancy tail: two fans, fluttering
    const tail = sp[SEG - 1];
    const prev = sp[SEG - 2];
    const ang = Math.atan2(tail.y - prev.y, tail.x - prev.x);
    const fl = Math.sin(f.flutter) * 0.45;
    ctx.fillStyle = f.coat.fin;
    [-1, 1].forEach(function (side) {
      const a1 = ang + side * 0.55 + fl;
      const a2 = ang + side * 0.15 + fl;
      const L = f.len * 0.55;
      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.quadraticCurveTo(tail.x + Math.cos(a1) * L * 1.1, tail.y + Math.sin(a1) * L * 1.1,
        tail.x + Math.cos(a2) * L, tail.y + Math.sin(a2) * L);
      ctx.closePath();
      ctx.fill();
    });
    // body
    ctx.beginPath();
    for (let s = 0; s < SEG; s++) {
      const p = sp[s];
      const q = sp[Math.max(0, s - 1)] === p ? sp[1] : sp[s - 1];
      const a = s === 0 ? Math.atan2(sp[0].y - sp[1].y, sp[0].x - sp[1].x) : Math.atan2(q.y - p.y, q.x - p.x);
      const r = radius(f, s);
      const x = p.x + Math.cos(a + Math.PI / 2) * r;
      const y = p.y + Math.sin(a + Math.PI / 2) * r;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    for (let s = SEG - 1; s >= 0; s--) {
      const p = sp[s];
      const a = s === 0 ? Math.atan2(sp[0].y - sp[1].y, sp[0].x - sp[1].x) : Math.atan2(sp[s - 1].y - p.y, sp[s - 1].x - p.x);
      const r = radius(f, s);
      ctx.lineTo(p.x + Math.cos(a - Math.PI / 2) * r, p.y + Math.sin(a - Math.PI / 2) * r);
    }
    ctx.closePath();
    ctx.fillStyle = f.coat.body;
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.fillStyle = f.coat.patch;
    ctx.beginPath();
    ctx.arc(sp[2].x, sp[2].y, radius(f, 2) * 0.9, 0, Math.PI * 2);
    ctx.arc(sp[5].x, sp[5].y, radius(f, 5) * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // eyes (big ones for the demekin)
    const ha = Math.atan2(sp[0].y - sp[1].y, sp[0].x - sp[1].x);
    const er = f.coat.demekin ? 2.6 : 1.4;
    [1, -1].forEach(function (side) {
      const ex = sp[0].x + Math.cos(ha + side * 1.0) * radius(f, 0) * (f.coat.demekin ? 1.1 : 0.7);
      const ey = sp[0].y + Math.sin(ha + side * 1.0) * radius(f, 0) * (f.coat.demekin ? 1.1 : 0.7);
      ctx.fillStyle = f.coat.demekin ? '#8eabe3' : '#0c1b4d';
      ctx.beginPath();
      ctx.arc(ex, ey, er, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawPoi() {
    if (!poi.over && !poi.wet) return;
    const r = POI_R;
    // its shadow on the bottom of the tub
    if (!poi.wet) {
      ctx.fillStyle = 'rgba(12, 27, 77, 0.15)';
      ctx.beginPath();
      ctx.ellipse(poi.x + 10, poi.y + 14, r, r * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // handle
    ctx.strokeStyle = '#0c1b4d';
    ctx.lineWidth = 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(poi.x + r * 0.7, poi.y + r * 0.7);
    ctx.lineTo(poi.x + r * 1.9, poi.y + r * 1.9);
    ctx.stroke();
    // paper
    if (!poi.torn) {
      ctx.fillStyle = poi.wet
        ? 'rgba(247, 249, 252, ' + (0.25 + poi.life * 0.25).toFixed(2) + ')'
        : 'rgba(247, 249, 252, 0.85)';
      ctx.beginPath();
      ctx.arc(poi.x, poi.y, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // a torn rag of paper round the rim
      ctx.fillStyle = 'rgba(247, 249, 252, 0.7)';
      ctx.beginPath();
      for (let i = 0; i <= 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        const rr = r - 4 - ((i * 7919) % 5) * 1.6;
        ctx.lineTo(poi.x + Math.cos(a) * rr, poi.y + Math.sin(a) * rr);
      }
      ctx.arc(poi.x, poi.y, r, 0, Math.PI * 2, true);
      ctx.fill();
    }
    // frame
    ctx.strokeStyle = '#0c1b4d';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(poi.x, poi.y, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  function draw() {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#dfe7f7');
    g.addColorStop(1, '#a9bfea');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // light on the water
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(w * (0.1 + i * 0.22), h * 0.1 + i * 9, w * 0.12, 3);
    }
    // the fish's shadows, then the fish
    fish.forEach(function (f) {
      ctx.save();
      ctx.translate(5, 7);
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = '#0c1b4d';
      ctx.beginPath();
      f.spine.forEach(function (p, s) {
        ctx.moveTo(p.x + radius(f, s), p.y);
        ctx.arc(p.x, p.y, radius(f, s), 0, Math.PI * 2);
      });
      ctx.fill();
      ctx.restore();
    });
    fish.forEach(function (f) {
      drawFish(f, 0, 0, 1, 1);
    });
    ripples.forEach(function (r) {
      ctx.strokeStyle = 'rgba(12, 27, 77, ' + (0.35 * (1 - r.r / r.max)).toFixed(3) + ')';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(r.x, r.y, r.r, r.r * 0.85, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
    drawPoi();
    // caught fish leap out of the poi and away to the bag
    flying.forEach(function (f) {
      const x = f.x + (w + 40 - f.x) * f.t;
      const y = f.y - Math.sin(f.t * Math.PI) * 90 - f.t * 30;
      drawFish(f.fish, x, y, 1 + f.t * 0.3, 1 - f.t * 0.6);
    });
  }

  function loop(time) {
    const dt = Math.min(0.05, (time - (last || time)) / 1000);
    last = time;
    step(dt);
    draw();
    frame = window.requestAnimationFrame(loop);
  }

  function start() {
    if (reduced || frame || !visible || document.hidden) return;
    last = 0;
    frame = window.requestAnimationFrame(loop);
  }

  function stop() {
    window.cancelAnimationFrame(frame);
    frame = 0;
  }

  function showCounts() {
    catchOut.textContent = String(caught);
    poiOut.textContent = String(poisLeft);
  }

  function tear() {
    poi.torn = true;
    poi.wet = false;
    poi.tornAt = window.performance.now();
    poisLeft = Math.max(0, poisLeft - 1);
    showCounts();
    root.classList.add('is-torn');
    if (hint) hint.textContent = t('art.kingyo.torn');
    window.setTimeout(function () {
      root.classList.remove('is-torn');
      if (hint) hint.textContent = t('art.kingyo.hint');
      if (poisLeft > 0) {
        poi.torn = false;
        poi.life = 1;
      } else if (again) {
        again.hidden = false;
      }
    }, 1300);
  }

  function lift() {
    if (!poi.wet || poi.torn) return;
    poi.wet = false;
    ripple(poi.x, poi.y, 50);
    let got = 0;
    for (let i = fish.length - 1; i >= 0; i--) {
      const f = fish[i];
      const d = Math.hypot(f.spine[1].x - poi.x, f.spine[1].y - poi.y);
      if (d > POI_R) continue;
      const chance = 0.85 - Math.min(0.6, f.speed / 220);
      if (Math.random() < chance) {
        fish.splice(i, 1);
        flying.push({ fish: f, x: f.spine[0].x, y: f.spine[0].y, t: 0 });
        got += 1;
      }
    }
    if (got) {
      caught += got;
      showCounts();
      root.classList.remove('is-bagged');
      void root.offsetWidth;
      root.classList.add('is-bagged');
      window.setTimeout(function () {
        for (let k = 0; k < got; k++) addFish(Math.random() < 0.5 ? 10 : w - 10, (0.2 + Math.random() * 0.6) * h);
      }, 2500);
    }
    // a lift costs the paper a little too
    poi.life -= 0.12;
    if (poi.life <= 0) tear();
  }

  function local(event) {
    const box = canvas.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  resize();
  populate();
  draw();
  showCounts();
  root.classList.add('is-live');
  start();

  canvas.addEventListener('pointermove', function (event) {
    const p = local(event);
    poi.x = p.x;
    poi.y = p.y;
    poi.over = true;
  });
  canvas.addEventListener('pointerleave', function () {
    poi.over = false;
    lift();
  });
  canvas.addEventListener('pointerdown', function (event) {
    if (poi.torn || poisLeft <= 0) return;
    const p = local(event);
    poi.x = poi.lastX = p.x;
    poi.y = poi.lastY = p.y;
    poi.over = true;
    poi.wet = true;
    ripple(p.x, p.y, 40);
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch (e) {
      // capture is a nicety
    }
  });
  canvas.addEventListener('pointerup', function (event) {
    lift();
    if (event.pointerType !== 'mouse') poi.over = false;
  });
  canvas.addEventListener('pointercancel', function () {
    poi.wet = false;
    poi.over = false;
  });
  if (again) {
    again.addEventListener('click', function () {
      poisLeft = 3;
      poi.torn = false;
      poi.life = 1;
      again.hidden = true;
      showCounts();
    });
  }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
      else stop();
    }).observe(root);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else start();
  });
  document.addEventListener('langchange', function () {
    if (hint && !root.classList.contains('is-torn')) hint.textContent = t('art.kingyo.hint');
  });
  window.addEventListener('resize', function () {
    const ow = w;
    resize();
    if (Math.abs(w - ow) > 60) populate();
    draw();
  });
})();
