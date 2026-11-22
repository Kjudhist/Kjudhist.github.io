/* ==========================================================================
   Sakura: the shared blossom engine.

   Petals are real particles: each one tumbles (a flip angle squeezes it
   edge-on and back), flutters sideways, is dragged by the wind more when it
   lies flat to it, falls, and can settle on a ground line and pile up.
   The wind is a slow breeze plus the pointer: moving the pointer pushes
   nearby petals with its velocity, so a fast swipe is a gust.

   Also here: sprites (petal, flower, bud, glow), a seeded branch grower,
   branch drawing, and a frame loop that pauses when the tab is hidden or
   its element is offscreen.

   window.Sakura = { reduced, rng, fit, loop, Wind, Petals, sprites,
                     growTree, drawSegs, nearestSeg, easeOutBack }
   ========================================================================== */

(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const reduced = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // size a canvas to its box at device resolution
  function fit(canvas) {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    if (canvas.width !== Math.round(w * DPR) || canvas.height !== Math.round(h * DPR)) {
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
    }
    return { w: w, h: h, dpr: DPR };
  }

  // rAF loop that sleeps while the page is hidden or `el` is offscreen.
  // fn(dt, seconds) returning false parks the loop until wake().
  function loop(el, fn) {
    let raf = 0;
    let last = 0;
    let onscreen = true;
    let parked = false;
    function frame(time) {
      raf = 0;
      const dt = Math.min(0.05, (time - (last || time)) / 1000);
      last = time;
      if (fn(dt, time / 1000) === false) {
        parked = true;
        return;
      }
      schedule();
    }
    function schedule() {
      if (!raf && !document.hidden && onscreen && !parked) raf = window.requestAnimationFrame(frame);
    }
    document.addEventListener('visibilitychange', function () {
      last = 0;
      schedule();
    });
    if (el && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onscreen = entries[entries.length - 1].isIntersecting;
        last = 0;
        schedule();
      }).observe(el);
    }
    schedule();
    return {
      wake: function () {
        parked = false;
        schedule();
      }
    };
  }

  /* ------------------------------------------------------------ sprites */

  function canvasOf(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    draw(c.getContext('2d'));
    return c;
  }

  // a sakura petal, notched at the tip, pointing up; s is half its length
  function petalPath(g, s) {
    g.beginPath();
    g.moveTo(0, s);
    g.bezierCurveTo(-s * 0.95, s * 0.42, -s * 0.86, -s * 0.72, -s * 0.24, -s);
    g.lineTo(0, -s * 0.72);
    g.lineTo(s * 0.24, -s);
    g.bezierCurveTo(s * 0.86, -s * 0.72, s * 0.95, s * 0.42, 0, s);
    g.closePath();
  }

  const TONES = [
    ['#fbf1f5', '#ecc6d7'],
    ['#f6e6ee', '#e3b4c9'],
    ['#fdf7fa', '#f0d3e0'],
    ['#f3dfe9', '#d9a3bc']
  ];

  const sprites = {
    petals: TONES.map(function (tone) {
      return canvasOf(32, 32, function (g) {
        g.translate(16, 16);
        const gr = g.createLinearGradient(0, -14, 0, 14);
        gr.addColorStop(0, tone[0]);
        gr.addColorStop(1, tone[1]);
        g.fillStyle = gr;
        petalPath(g, 14);
        g.fill();
      });
    }),
    // an open five-petal flower, 64px
    flowers: TONES.map(function (tone, k) {
      return canvasOf(64, 64, function (g) {
        g.translate(32, 32);
        g.rotate(k * 0.4);
        for (let i = 0; i < 5; i++) {
          g.save();
          g.rotate(i * TAU / 5);
          g.translate(0, -15);
          const gr = g.createLinearGradient(0, -15, 0, 15);
          gr.addColorStop(0, tone[0]);
          gr.addColorStop(1, tone[1]);
          g.fillStyle = gr;
          petalPath(g, 15);
          g.fill();
          g.restore();
        }
        g.fillStyle = 'rgba(196, 92, 132, 0.55)';
        g.beginPath();
        g.arc(0, 0, 6, 0, TAU);
        g.fill();
        g.fillStyle = '#f7e9c9';
        for (let i = 0; i < 7; i++) {
          const a = i * TAU / 7;
          g.beginPath();
          g.arc(Math.cos(a) * 6.5, Math.sin(a) * 6.5, 1.3, 0, TAU);
          g.fill();
        }
      });
    }),
    bud: canvasOf(24, 24, function (g) {
      g.translate(12, 12);
      g.fillStyle = '#d98fae';
      g.beginPath();
      g.ellipse(0, 0, 5, 7.5, 0, 0, TAU);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)';
      g.beginPath();
      g.ellipse(-1.5, -2, 1.8, 3.5, 0, 0, TAU);
      g.fill();
    }),
    glow: canvasOf(128, 128, function (g) {
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(250, 226, 238, 0.55)');
      gr.addColorStop(0.45, 'rgba(240, 200, 222, 0.16)');
      gr.addColorStop(1, 'rgba(240, 200, 222, 0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 128, 128);
    }),
    spirit: canvasOf(64, 64, function (g) {
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255, 246, 250, 0.95)');
      gr.addColorStop(0.2, 'rgba(244, 206, 226, 0.5)');
      gr.addColorStop(0.55, 'rgba(150, 170, 255, 0.12)');
      gr.addColorStop(1, 'rgba(150, 170, 255, 0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 64, 64);
    })
  };

  // a cloud of blossom: a soft glow with a dozen flowers on it, 160px
  function cluster(seed) {
    const r = rng(seed);
    return canvasOf(160, 160, function (g) {
      g.globalAlpha = 0.9;
      g.drawImage(sprites.glow, 0, 0, 160, 160);
      g.globalAlpha = 1;
      const n = 13 + Math.floor(r() * 6);
      for (let i = 0; i < n; i++) {
        const a = r() * TAU;
        const d = Math.sqrt(r()) * 46;
        const s = 20 + r() * 16;
        g.globalAlpha = 0.7 + r() * 0.3;
        g.drawImage(sprites.flowers[Math.floor(r() * 4)], 80 + Math.cos(a) * d - s / 2, 80 + Math.sin(a) * d * 0.8 - s / 2, s, s);
      }
      g.globalAlpha = 1;
      for (let i = 0; i < 5; i++) {
        const a = r() * TAU;
        const d = 30 + r() * 26;
        g.drawImage(sprites.bud, 80 + Math.cos(a) * d - 5, 80 + Math.sin(a) * d * 0.8 - 5, 10, 10);
      }
    });
  }
  sprites.clusters = [11, 23, 37, 41, 59, 67].map(cluster);

  /* --------------------------------------------------------------- wind */

  // A breeze plus the pointer. The pointer pushes with its own velocity,
  // fading with distance, so a slow drift nudges and a swipe is a gust.
  function Wind(opts) {
    const o = opts || {};
    this.base = o.base || 14;
    this.radius = o.radius || 150;
    this.px = -9999;
    this.py = -9999;
    this.vx = 0;
    this.vy = 0;
    this.gx = 0;
    this.gy = 0;
    this.t = 0;
    this.speed = 0;
    this.swirls = [];
    this._lt = 0;
  }

  Wind.prototype.point = function (x, y) {
    const now = window.performance.now();
    if (this._lt && now - this._lt < 120 && this.px > -9000) {
      const k = 1000 / Math.max(8, now - this._lt);
      const ix = (x - this.px) * k;
      const iy = (y - this.py) * k;
      this.vx += (ix - this.vx) * 0.5;
      this.vy += (iy - this.vy) * 0.5;
    }
    this.px = x;
    this.py = y;
    this._lt = now;
  };

  Wind.prototype.leave = function () {
    this.px = -9999;
    this.py = -9999;
  };

  Wind.prototype.gust = function (x, y) {
    this.gx += x;
    this.gy += y;
  };

  Wind.prototype.step = function (dt) {
    this.t += dt;
    const f = Math.exp(-dt * 3.2);
    this.vx *= f;
    this.vy *= f;
    const g = Math.exp(-dt * 1.4);
    this.gx *= g;
    this.gy *= g;
    this.speed = Math.hypot(this.vx, this.vy);
  };

  Wind.prototype.at = function (x, y, out) {
    const t = this.t;
    let wx = this.base * (0.7 + 0.5 * Math.sin(t * 0.31) + 0.25 * Math.sin(t * 0.83 + y * 0.004)) + this.gx;
    let wy = 6 * Math.sin(t * 0.47 + x * 0.003) + this.gy;
    const dx = x - this.px;
    const dy = y - this.py;
    const d2 = dx * dx + dy * dy;
    const r2 = this.radius * this.radius;
    if (d2 < r2 * 4) {
      const f = Math.exp(-d2 / r2) * 0.9;
      wx += this.vx * f;
      wy += this.vy * f;
    }
    for (let i = 0; i < this.swirls.length; i++) {
      const s = this.swirls[i];
      if (!s.on) continue;
      const sx = x - s.x;
      const sy = y - s.y;
      const d = Math.hypot(sx, sy) || 1;
      if (d > s.r * 2.2) continue;
      const f = Math.exp(-(d * d) / (s.r * s.r)) * s.power;
      wx += (-sy / d - sx / d * 0.85) * f;
      wy += (sx / d - sy / d * 0.85) * f;
    }
    out.x = wx;
    out.y = wy;
    return out;
  };

  /* ------------------------------------------------------------- petals */

  // opts: max, ground(x, y) -> y or null, restMax, sink(p) -> true to remove,
  // onLand(p)
  function Petals(opts) {
    const o = opts || {};
    this.list = [];
    this.max = o.max || 360;
    this.ground = o.ground || null;
    this.restMax = o.restMax || 260;
    this.sink = o.sink || null;
    this.onLand = o.onLand || null;
    this.w = 0;
    this.h = 0;
    this.scale = o.scale || 1;
    this._w = { x: 0, y: 0 };
    this._t = 0;
  }

  Petals.prototype.spawn = function (x, y, vx, vy, size) {
    if (this.list.length >= this.max) {
      // drop the oldest settled petal first, else the oldest of all
      let idx = -1;
      for (let i = 0; i < this.list.length; i++) {
        if (this.list[i].landed) {
          idx = i;
          break;
        }
      }
      this.list.splice(idx < 0 ? 0 : idx, 1);
    }
    const p = {
      x: x,
      y: y,
      vx: vx || 0,
      vy: vy || 0,
      rot: Math.random() * TAU,
      spin: (Math.random() - 0.5) * 3,
      flip: Math.random() * TAU,
      flipV: 2 + Math.random() * 4,
      size: (size || (7 + Math.random() * 6)) * this.scale,
      spr: sprites.petals[Math.floor(Math.random() * sprites.petals.length)],
      phase: Math.random() * TAU,
      fall: 22 + Math.random() * 26,
      landed: false,
      life: 1,
      fade: 0
    };
    this.list.push(p);
    return p;
  };

  Petals.prototype.step = function (dt, wind) {
    this._t += dt;
    const t = this._t;
    const w = this._w;
    let landed = 0;
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i];
      if (p.fade) {
        p.life -= dt * p.fade;
        if (p.life <= 0) {
          this.list.splice(i, 1);
          continue;
        }
      }
      wind.at(p.x, p.y, w);
      if (p.landed) {
        landed++;
        // a strong enough wind lifts it off the pile again
        if (Math.abs(w.x) + Math.abs(w.y) > 240) {
          p.landed = false;
          p.vx = w.x * 0.5;
          p.vy = -60 - Math.random() * 80;
          p.flipV = 4 + Math.random() * 4;
        }
        continue;
      }
      const face = Math.abs(Math.cos(p.flip));
      const k = 0.7 + 2.0 * face;
      p.vx += (w.x - p.vx) * k * dt;
      p.vy += (p.fall + w.y - p.vy) * (0.5 + 1.2 * face) * dt;
      // flutter: a flat petal slides sideways and rocks
      p.vx += Math.sin(t * 2.3 + p.phase) * 36 * face * dt;
      p.vy += Math.cos(t * 4.1 + p.phase) * 18 * dt;
      const sp = Math.abs(p.vx) + Math.abs(p.vy);
      p.flip += p.flipV * dt * (0.6 + sp / 160);
      p.rot += (p.spin + p.vx * 0.004) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (this.ground) {
        const gy = this.ground(p.x, p.y);
        if (gy !== null && p.y >= gy) {
          p.y = gy + Math.random() * 3;
          p.landed = true;
          p.vx = 0;
          p.vy = 0;
          p.flip = (Math.random() - 0.5) * 0.6;
          p.rot = (Math.random() - 0.5) * 1.2 + (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
          if (this.onLand) this.onLand(p);
          continue;
        }
      }
      if (this.sink && this.sink(p)) {
        this.list.splice(i, 1);
        continue;
      }
      if (p.x < -80 || p.x > this.w + 80 || p.y > this.h + 60 || p.y < -400) {
        this.list.splice(i, 1);
      }
    }
    // keep the pile from growing forever: the oldest settled petals melt away
    if (landed > this.restMax) {
      let over = landed - this.restMax;
      for (let i = 0; i < this.list.length && over > 0; i++) {
        if (this.list[i].landed && !this.list[i].fade) {
          this.list[i].fade = 0.5;
          over--;
        }
      }
    }
  };

  Petals.prototype.draw = function (g, dpr) {
    for (let i = 0; i < this.list.length; i++) {
      const p = this.list[i];
      const c = Math.cos(p.rot);
      const s = Math.sin(p.rot);
      let fx = Math.cos(p.flip);
      if (p.landed) fx = 1;
      const sx = (Math.abs(fx) < 0.12 ? 0.12 * (fx < 0 ? -1 : 1) : fx);
      const k = p.size / 28 * dpr;
      const sy = p.landed ? 0.55 : 1;
      g.globalAlpha = Math.max(0, p.life) * (0.72 + 0.28 * Math.abs(fx));
      g.setTransform(c * sx * k, s * sx * k, -s * sy * k, c * sy * k, p.x * dpr, p.y * dpr);
      g.drawImage(p.spr, -16, -16);
    }
    g.globalAlpha = 1;
    g.setTransform(1, 0, 0, 1, 0, 0);
  };

  /* ----------------------------------------------------------- branches */

  // Grow a tree of quadratic segments. o: {x, y, angle, len, width, depth,
  // seed, spread, shrink, lift (0..1 pull upward), wide (push sideways)}.
  // Returns {segs, tips, buds}.
  function growTree(o) {
    const r = rng(o.seed || 1);
    const out = { segs: [], tips: [], buds: [] };
    const spread = o.spread || 0.55;
    const shrink = o.shrink || 0.76;
    const lift = o.lift || 0;
    const wide = o.wide || 0;
    function grow(x, y, a, len, w, depth, level) {
      const bend = (r() - 0.5) * 0.7;
      const x2 = x + Math.cos(a) * len;
      const y2 = y + Math.sin(a) * len;
      const cx = (x + x2) / 2 + Math.cos(a + Math.PI / 2) * len * bend * 0.4;
      const cy = (y + y2) / 2 + Math.sin(a + Math.PI / 2) * len * bend * 0.4;
      const seg = { x: x, y: y, cx: cx, cy: cy, x2: x2, y2: y2, w: w, w2: Math.max(0.8, w * 0.72), level: level };
      out.segs.push(seg);
      if (depth <= 2) out.buds.push({ x: cx, y: cy, a: a, level: level });
      if (depth <= 0 || w < 1.1) {
        out.tips.push({ x: x2, y: y2, a: a, level: level });
        return;
      }
      const n = r() < 0.3 && level > 0 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const side = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2;
        let na = a + side * spread * (0.7 + r() * 0.6) + (r() - 0.5) * 0.3;
        // pull toward level, so the canopy spreads instead of climbing
        if (wide) na += (Math.cos(na) > 0 ? 1 : -1) * wide * (Math.abs(Math.sin(na)));
        if (lift) na += (-Math.PI / 2 - na) * lift;
        // keep the limbs climbing: never below level (minus a little droop)
        if (o.up !== undefined) {
          const droop = level < 3 ? -o.up : 0.25;
          na = Math.max(-Math.PI - droop, Math.min(droop, na));
        }
        const nl = len * (shrink + (r() - 0.5) * 0.18) * (side === 0 ? 1 : 0.92);
        grow(x2, y2, na, nl, w * (0.62 + r() * 0.12), depth - 1, level + 1);
      }
    }
    grow(o.x, o.y, o.angle, o.len, o.width, o.depth, 0);
    return out;
  }

  // ink the branches: a moonlit rim, then the dark wood
  function drawSegs(g, segs, dpr, opts) {
    const o = opts || {};
    const rim = o.rim || 'rgba(120, 140, 220, 0.35)';
    const wood = o.wood || '#050b2a';
    const ox = (o.rimX || -0.8) * dpr;
    const oy = (o.rimY || -1) * dpr;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    [[rim, ox, oy, 1.6], [wood, 0, 0, 0]].forEach(function (pass) {
      g.strokeStyle = pass[0];
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        const p = s.p === undefined ? 1 : s.p;
        if (p <= 0) continue;
        g.lineWidth = Math.max(0.6, ((s.w + s.w2) / 2 + pass[3])) * dpr;
        g.beginPath();
        g.moveTo(s.x * dpr + pass[1], s.y * dpr + pass[2]);
        if (p >= 1) {
          g.quadraticCurveTo(s.cx * dpr + pass[1], s.cy * dpr + pass[2], s.x2 * dpr + pass[1], s.y2 * dpr + pass[2]);
        } else {
          // partial quadratic (de Casteljau split at p)
          const ax = s.x + (s.cx - s.x) * p;
          const ay = s.y + (s.cy - s.y) * p;
          const bx = s.cx + (s.x2 - s.cx) * p;
          const by = s.cy + (s.y2 - s.cy) * p;
          g.quadraticCurveTo(ax * dpr + pass[1], ay * dpr + pass[2], (ax + (bx - ax) * p) * dpr + pass[1], (ay + (by - ay) * p) * dpr + pass[2]);
        }
        g.stroke();
      }
    });
  }

  function nearestSeg(segs, x, y, maxD) {
    let best = null;
    let bd = maxD;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      const dx = s.x2 - s.x;
      const dy = s.y2 - s.y;
      const l2 = dx * dx + dy * dy || 1;
      const u = Math.max(0, Math.min(1, ((x - s.x) * dx + (y - s.y) * dy) / l2));
      const px = s.x + dx * u;
      const py = s.y + dy * u;
      const d = Math.hypot(x - px, y - py) - s.w / 2;
      if (d < bd) {
        bd = d;
        best = { seg: s, x: px, y: py, u: u, a: Math.atan2(dy, dx) };
      }
    }
    return best;
  }

  function easeOutBack(t) {
    const c = 1.9;
    const u = t - 1;
    return 1 + (c + 1) * u * u * u + c * u * u;
  }

  window.Sakura = {
    TAU: TAU,
    reduced: reduced,
    dpr: DPR,
    rng: rng,
    fit: fit,
    loop: loop,
    Wind: Wind,
    Petals: Petals,
    sprites: sprites,
    petalPath: petalPath,
    growTree: growTree,
    drawSegs: drawSegs,
    nearestSeg: nearestSeg,
    easeOutBack: easeOutBack
  };
})();
