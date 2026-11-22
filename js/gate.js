/* ==========================================================================
   The gate: 夜桜, a hanami night.

   Night:  one canvas behind everything. A great old cherry tree grows from
           between the two doors and spans the sky; the moon; distant hills.
           Petals drift on a slow breeze and pile up on the ground and on
           the pavilion roof.
   Wind:   the pointer is wind. Moving it pushes petals with its velocity;
           a fast swipe through the canopy shakes blossoms loose.
   Bloom:  click a branch and a new twig grows from that point and opens
           into flowers. Click open sky and the petals near you scatter.
   Doors:  QA is a lamp-lit shoji pavilion (CSS; hover steadies it). The
           atelier is an arch of blossom drawn here over its empty frame;
           hover and it blooms further while petals spiral into it.
           Click or Enter: a gust carries you through, then the petal wall
           of the next page sweeps in (window.site.leaveTo).
   ========================================================================== */

(function () {
  'use strict';

  const S = window.Sakura;
  const canvas = document.querySelector('[data-night]');
  const stage = document.querySelector('[data-gate]');
  if (!S || !canvas || !stage) return;

  const g = canvas.getContext('2d');
  const reduced = S.reduced;
  const doors = Array.from(stage.querySelectorAll('[data-door]'));
  const archEl = document.querySelector('[data-arch]');
  const roofEl = document.querySelector('.pavilion__roof');
  const wind = new S.Wind({ base: 16, radius: 150 });
  const swirl = { x: 0, y: 0, r: 120, power: 0, on: false };
  wind.swirls.push(swirl);

  let W = 0;
  let H = 0;
  let dpr = 1;
  let bg = null;           // sky, moon, hills and the tree, drawn once per size
  let tree = null;
  let clusters = [];
  let twigs = [];          // segments grown by clicks: {seg..., t0, dur}
  let blooms = [];         // flowers opened by clicks: {x, y, s, spr, rot, t0}
  let arch = null;         // the arch geometry in canvas pixels
  let roof = null;
  let archOpen = 0;
  let archHover = false;
  let entering = false;
  let now = 0;
  let emitAcc = 0;

  const petals = new S.Petals({
    max: reduced ? 160 : 460,
    restMax: 220,
    ground: function (x, y) {
      if (roof && x > roof.l && x < roof.r && y < roof.t + 14) return roof.t + 2;
      if (arch && x > arch.beamL && x < arch.beamR && y < arch.beamY + 10 && y > arch.beamY - 30) return arch.beamY - 2;
      return H - 7 - heapAt(x);
    },
    onLand: function (p) {
      const i = Math.floor(p.x / 8);
      if (i >= 0 && i < heap.length) heap[i] = Math.min(22, heap[i] + 1.1);
    },
    sink: function (p) {
      if (!swirl.on) return false;
      return Math.hypot(p.x - swirl.x, p.y - swirl.y) < 10 + 6 * archOpen;
    }
  });

  // the pile: a height per 8px column, rebuilt from the settled petals now
  // and then so that lifted or melted petals lower it again
  let heap = new Float32Array(1);
  function heapAt(x) {
    const i = Math.floor(x / 8);
    if (i < 0 || i >= heap.length) return 0;
    return (heap[i] + (heap[i - 1] || heap[i]) + (heap[i + 1] || heap[i])) / 3;
  }
  function rebuildHeap() {
    heap.fill(0);
    petals.list.forEach(function (p) {
      if (!p.landed || p.y < H - 30) return;
      const i = Math.floor(p.x / 8);
      if (i >= 0 && i < heap.length) heap[i] = Math.min(22, heap[i] + 1.1);
    });
  }

  /* ------------------------------------------------------------ layout */

  function rectOf(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  }

  function buildArch() {
    if (!archEl) return null;
    const r = rectOf(archEl);
    const rnd = S.rng(808);
    const a = {
      x: r.x,
      y: r.y,
      w: r.w,
      h: r.h,
      beamL: r.x - r.w * 0.06,
      beamR: r.x + r.w * 1.06,
      beamY: r.y + r.h * 0.08,
      cx: r.x + r.w / 2,
      cy: r.y + r.h * 0.62,
      flowers: [],
      drapes: []
    };
    // flowers crowd the top beam, gather on the tie beam, climb the pillars
    function add(u, v, s, k) {
      a.flowers.push({
        x: r.x + u * r.w,
        y: r.y + v * r.h,
        s: s * r.w / 200,
        k: k,
        spr: S.sprites.flowers[Math.floor(rnd() * 4)],
        rot: rnd() * S.TAU,
        ph: rnd() * S.TAU
      });
    }
    for (let i = 0; i < 70; i++) {
      const u = -0.08 + rnd() * 1.16;
      const lift = Math.pow(Math.abs(u - 0.5) * 2, 3) * 0.05;
      add(u, 0.075 - lift + (rnd() - 0.5) * 0.09, 18 + rnd() * 14, rnd());
    }
    for (let i = 0; i < 26; i++) add(0.1 + rnd() * 0.8, 0.25 + (rnd() - 0.5) * 0.06, 14 + rnd() * 10, rnd());
    for (let i = 0; i < 34; i++) {
      const left = rnd() < 0.5;
      const v = 0.12 + Math.pow(rnd(), 1.6) * 0.86;
      add((left ? 0.19 : 0.81) + (rnd() - 0.5) * 0.08 - (left ? 1 : -1) * (1 - v) * 0.015, v, 10 + rnd() * 10 * (1 - v * 0.5), 0.25 + rnd() * 0.75);
    }
    // shidare: blossom drapes hanging from the beam ends
    [[-0.04, 1], [0.03, 1], [0.97, -1], [1.04, -1]].forEach(function (d) {
      const len = 0.18 + rnd() * 0.16;
      a.drapes.push({ u: d[0], len: len, ph: rnd() * S.TAU });
      for (let j = 0; j < 7; j++) add(d[0] + (rnd() - 0.5) * 0.03, 0.1 + (j / 7) * len, 9 + rnd() * 7, 0.2 + rnd() * 0.8);
    });
    return a;
  }

  function buildBackground() {
    bg = document.createElement('canvas');
    bg.width = canvas.width;
    bg.height = canvas.height;
    const b = bg.getContext('2d');
    const rnd = S.rng(2026);

    // stars
    for (let i = 0; i < Math.round(W * H / 6000); i++) {
      const x = rnd() * W;
      const y = rnd() * H * 0.8;
      const r = rnd() < 0.08 ? 1.3 : 0.7;
      b.fillStyle = 'rgba(238, 241, 251,' + (0.2 + rnd() * 0.6).toFixed(2) + ')';
      b.beginPath();
      b.arc(x * dpr, y * dpr, r * dpr, 0, S.TAU);
      b.fill();
    }

    // the moon
    const mx = W * (W > 720 ? 0.64 : 0.74);
    const my = H * (W > 720 ? 0.16 : 0.27);
    const mr = Math.max(30, Math.min(78, W * 0.05));
    let gr = b.createRadialGradient(mx * dpr, my * dpr, mr * dpr * 0.8, mx * dpr, my * dpr, mr * dpr * 5);
    gr.addColorStop(0, 'rgba(220, 228, 255, 0.22)');
    gr.addColorStop(1, 'rgba(220, 228, 255, 0)');
    b.fillStyle = gr;
    b.fillRect(0, 0, bg.width, bg.height);
    gr = b.createRadialGradient((mx - mr * 0.3) * dpr, (my - mr * 0.3) * dpr, 0, mx * dpr, my * dpr, mr * dpr);
    gr.addColorStop(0, '#fbfaf5');
    gr.addColorStop(1, '#e4e6ef');
    b.fillStyle = gr;
    b.beginPath();
    b.arc(mx * dpr, my * dpr, mr * dpr, 0, S.TAU);
    b.fill();
    b.fillStyle = 'rgba(160, 170, 205, 0.16)';
    [[-0.3, -0.2, 0.22], [0.25, 0.1, 0.16], [-0.05, 0.38, 0.12], [0.35, -0.35, 0.09]].forEach(function (c) {
      b.beginPath();
      b.arc((mx + c[0] * mr) * dpr, (my + c[1] * mr) * dpr, c[2] * mr * dpr, 0, S.TAU);
      b.fill();
    });

    // distant hills, with far-off trees in bloom as a pale haze
    function hill(base, amp, color, seed) {
      const r = S.rng(seed);
      const ph = r() * 10;
      b.fillStyle = color;
      b.beginPath();
      b.moveTo(0, H * dpr);
      for (let x = 0; x <= W + 10; x += 10) {
        const y = H * base - amp * (0.6 * Math.sin(x * 0.004 + ph) + 0.4 * Math.sin(x * 0.011 + ph * 2));
        b.lineTo(x * dpr, y * dpr);
      }
      b.lineTo(W * dpr, H * dpr);
      b.fill();
      for (let i = 0; i < W / 40; i++) {
        const x = r() * W;
        const y = H * base - amp * (0.6 * Math.sin(x * 0.004 + ph) + 0.4 * Math.sin(x * 0.011 + ph * 2)) + 4;
        b.globalAlpha = 0.04 + r() * 0.05;
        const s = 20 + r() * 30;
        b.drawImage(S.sprites.glow, (x - s / 2) * dpr, (y - s / 2) * dpr, s * dpr, s * dpr);
      }
      b.globalAlpha = 1;
    }
    hill(0.8, 40, '#0a1546', 5);
    hill(0.88, 26, '#071037', 9);

    // the tree
    const mobile = W < 720;
    tree = S.growTree({
      x: W * 0.5,
      y: H + 20,
      angle: -Math.PI / 2 - 0.06,
      len: H * (mobile ? 0.23 : 0.31),
      width: Math.max(14, Math.min(32, W * 0.021)),
      depth: mobile ? 6 : 7,
      seed: 17,
      spread: mobile ? 0.5 : 0.56,
      shrink: 0.8,
      wide: mobile ? 0.1 : 0.18,
      up: 0.22
    });
    S.drawSegs(b, tree.segs, dpr, { rim: 'rgba(150, 170, 240, 0.32)', wood: '#040a24', rimX: 1.2, rimY: -1 });

    // blossom clouds where the twigs end
    const scale = Math.max(0.45, Math.min(1, W / 1500));
    const r2 = S.rng(99);
    clusters = [];
    tree.tips.forEach(function (tip) {
      if (r2() < 0.2) return;
      clusters.push({ x: tip.x, y: tip.y, s: (64 + r2() * 46) * scale, spr: S.sprites.clusters[Math.floor(r2() * 6)], ph: r2() * S.TAU, k: 0 });
    });
    tree.buds.forEach(function (bud) {
      if (bud.level < 4 || r2() < 0.6) return;
      clusters.push({ x: bud.x, y: bud.y, s: (44 + r2() * 34) * scale, spr: S.sprites.clusters[Math.floor(r2() * 6)], ph: r2() * S.TAU, k: 0 });
    });
    // keep the blossom clouds off the words and the doors
    const keep = Array.from(document.querySelectorAll('.g-name, .g-intro, .g-meta, .door, .g-hint')).map(function (el) {
      const r = el.getBoundingClientRect();
      return { l: r.left - 24, r: r.right + 24, t: r.top - 24, b: r.bottom + 24 };
    });
    clusters = clusters.filter(function (c) {
      const pad = c.s * 0.3;
      return !keep.some(function (k) {
        return c.x > k.l - pad && c.x < k.r + pad && c.y > k.t - pad && c.y < k.b + pad;
      });
    });
  }

  function layout() {
    const size = S.fit(canvas);
    W = size.w;
    H = size.h;
    dpr = size.dpr;
    petals.w = W;
    petals.h = H;
    heap = new Float32Array(Math.ceil(W / 8) + 1);
    arch = buildArch();
    if (roofEl) {
      const r = rectOf(roofEl);
      roof = { l: r.x + r.w * 0.06, r: r.x + r.w * 0.94, t: r.y + r.h * 0.42 };
    }
    if (arch) {
      swirl.x = arch.cx;
      swirl.y = arch.cy;
      swirl.r = arch.w * 0.75;
    }
    buildBackground();
    twigs = [];
    blooms = [];
  }

  function seed() {
    const n = reduced ? 70 : 90;
    for (let i = 0; i < n; i++) {
      petals.spawn(Math.random() * W, Math.random() * H, 0, 0);
    }
    // a pile already on the ground, deeper under the tree
    for (let i = 0; i < 140; i++) {
      const x = W * 0.5 + (Math.random() + Math.random() + Math.random() - 1.5) * W * 0.45;
      const p = petals.spawn(x, H - 7 - heapAt(x), 0, 0);
      p.landed = true;
      p.flip = 0;
      p.rot = Math.PI / 2 + (Math.random() - 0.5) * 1.4;
      petals.onLand(p);
    }
  }

  /* -------------------------------------------------------------- draw */

  function drawArch(t) {
    if (!arch) return;
    const a = arch;
    const open = archOpen;
    // the light inside
    const pulse = 0.82 + 0.18 * Math.sin(t * 1.6);
    const gr = g.createRadialGradient(a.cx * dpr, a.cy * dpr, 0, a.cx * dpr, a.cy * dpr, a.w * (0.55 + open * 0.25) * dpr);
    gr.addColorStop(0, 'rgba(250, 232, 242,' + (0.42 * pulse + open * 0.3).toFixed(3) + ')');
    gr.addColorStop(0.35, 'rgba(200, 190, 255,' + (0.16 + open * 0.14).toFixed(3) + ')');
    gr.addColorStop(1, 'rgba(120, 140, 255, 0)');
    g.fillStyle = gr;
    g.fillRect((a.x - a.w * 0.4) * dpr, (a.y - a.h * 0.1) * dpr, a.w * 1.8 * dpr, a.h * 1.2 * dpr);

    // the wood: two leaning pillars, a tie beam, and the top beam with lifted ends
    const segs = [
      { x: a.x + a.w * 0.205, y: a.y + a.h * 0.07, cx: a.x + a.w * 0.195, cy: a.y + a.h * 0.55, x2: a.x + a.w * 0.18, y2: a.y + a.h, w: a.w * 0.05, w2: a.w * 0.055 },
      { x: a.x + a.w * 0.795, y: a.y + a.h * 0.07, cx: a.x + a.w * 0.805, cy: a.y + a.h * 0.55, x2: a.x + a.w * 0.82, y2: a.y + a.h, w: a.w * 0.05, w2: a.w * 0.055 },
      { x: a.x + a.w * 0.1, y: a.y + a.h * 0.25, cx: a.x + a.w * 0.5, cy: a.y + a.h * 0.255, x2: a.x + a.w * 0.9, y2: a.y + a.h * 0.25, w: a.h * 0.028, w2: a.h * 0.028 },
      { x: a.x - a.w * 0.08, y: a.y + a.h * 0.02, cx: a.x + a.w * 0.5, cy: a.y + a.h * 0.14, x2: a.x + a.w * 1.08, y2: a.y + a.h * 0.02, w: a.h * 0.04, w2: a.h * 0.04 }
    ];
    S.drawSegs(g, segs, dpr, { rim: 'rgba(243, 220, 231, 0.35)', wood: '#050b2a', rimX: 0, rimY: -1.2 });

    // drapes
    g.strokeStyle = 'rgba(20, 30, 80, 0.9)';
    g.lineWidth = 1 * dpr;
    a.drapes.forEach(function (d) {
      const x0 = a.x + d.u * a.w;
      const y0 = a.y + a.h * 0.06;
      const sway = Math.sin(t * 1.3 + d.ph) * 3 + wind.gx * 0.004;
      g.beginPath();
      g.moveTo(x0 * dpr, y0 * dpr);
      g.quadraticCurveTo((x0 + sway * 0.5) * dpr, (y0 + d.len * a.h * 0.5) * dpr, (x0 + sway) * dpr, (y0 + d.len * a.h) * dpr);
      g.stroke();
    });

    // flowers: more of them open as the door is hovered
    const show = 0.62 + 0.38 * open;
    for (let i = 0; i < a.flowers.length; i++) {
      const f = a.flowers[i];
      if (f.k > show) continue;
      const grow = Math.min(1, (show - f.k) * 8);
      const s = f.s * (1 + open * 0.18) * (0.4 + 0.6 * grow) * dpr;
      const dx = Math.sin(t * 1.4 + f.ph) * 0.8;
      g.globalAlpha = 0.6 + 0.4 * grow;
      g.setTransform(Math.cos(f.rot), Math.sin(f.rot), -Math.sin(f.rot), Math.cos(f.rot), (f.x + dx) * dpr, f.y * dpr);
      g.drawImage(f.spr, -s / 2, -s / 2, s, s);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
  }

  function drawClusters(t) {
    const breeze = wind.gx * 0.006;
    for (let i = 0; i < clusters.length; i++) {
      const c = clusters[i];
      c.k *= 0.94;
      const dx = Math.sin(t * 0.9 + c.ph) * 1.6 + breeze + Math.sin(t * 38 + c.ph) * c.k * 4;
      const dy = Math.cos(t * 0.7 + c.ph) * 1.0;
      const s = c.s * dpr;
      g.drawImage(c.spr, (c.x + dx) * dpr - s / 2, (c.y + dy) * dpr - s / 2, s, s);
    }
  }

  function drawTwigs() {
    if (!twigs.length && !blooms.length) return;
    twigs.forEach(function (s) {
      s.p = reduced ? 1 : Math.max(0, Math.min(1, (now - s.t0) / s.dur));
    });
    S.drawSegs(g, twigs, dpr, { rim: 'rgba(150, 170, 240, 0.35)', wood: '#040a24', rimX: 1, rimY: -1 });
    for (let i = 0; i < blooms.length; i++) {
      const b = blooms[i];
      const k = reduced ? 1 : Math.max(0, Math.min(1, (now - b.t0) / 0.7));
      if (k <= 0) continue;
      const s = b.s * S.easeOutBack(k) * dpr;
      g.setTransform(Math.cos(b.rot), Math.sin(b.rot), -Math.sin(b.rot), Math.cos(b.rot), b.x * dpr, b.y * dpr);
      g.drawImage(b.spr, -s / 2, -s / 2, s, s);
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }

  function render(t) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.drawImage(bg, 0, 0);
    drawTwigs();
    drawClusters(t);
    drawArch(t);
    petals.draw(g, dpr);
  }

  /* -------------------------------------------------------------- step */

  function emitFrom(c, vx, vy) {
    const a = Math.random() * S.TAU;
    const d = Math.random() * c.s * 0.3;
    petals.spawn(c.x + Math.cos(a) * d, c.y + Math.sin(a) * d * 0.8, vx, vy);
  }

  let heapClock = 0;
  function step(dt) {
    wind.step(dt);
    heapClock += dt;
    if (heapClock > 0.5) {
      heapClock = 0;
      rebuildHeap();
    }
    archOpen += ((archHover ? 1 : 0) - archOpen) * Math.min(1, dt * 4);
    swirl.power = 260 * archOpen;
    swirl.on = archOpen > 0.03;

    // the breeze lets a few go
    emitAcc += dt * (W > 720 ? 7 : 4) * (1 + Math.abs(wind.gx) / 200);
    while (emitAcc > 1 && clusters.length) {
      emitAcc -= 1;
      emitFrom(clusters[Math.floor(Math.random() * clusters.length)], 0, 0);
    }
    // a gust through the canopy shakes blossom loose
    if (wind.speed > 650 && wind.px > -9000) {
      for (let i = 0; i < clusters.length; i++) {
        const c = clusters[i];
        const d = Math.hypot(c.x - wind.px, c.y - wind.py);
        if (d < c.s * 0.7 + 30) {
          c.k = 1;
          const n = Math.random() < dt * wind.speed / 60 ? 1 + Math.floor(Math.random() * 2) : 0;
          for (let j = 0; j < n; j++) emitFrom(c, wind.vx * 0.35, wind.vy * 0.35);
        }
      }
    }
    // petals gather into the arch while it is hovered
    if (arch && archOpen > 0.2 && Math.random() < dt * 40 * archOpen) {
      const a = Math.random() * S.TAU;
      const r = arch.w * (0.7 + Math.random() * 0.5);
      petals.spawn(arch.cx + Math.cos(a) * r, arch.cy + Math.sin(a) * r * 0.9, 0, 0, 6 + Math.random() * 5);
    }
    petals.step(dt, wind);
  }

  /* ------------------------------------------------------------ bloom */

  function grow(hit) {
    const up = Math.sin(hit.a + 0.8) < Math.sin(hit.a - 0.8) ? 0.8 : -0.8;
    const t = S.growTree({
      x: hit.x,
      y: hit.y,
      angle: hit.a + up + (Math.random() - 0.5) * 0.3,
      len: 26 + Math.random() * 20,
      width: Math.max(1.6, Math.min(5, hit.seg.w * 0.45)),
      depth: 3,
      seed: Math.floor(Math.random() * 1e6),
      spread: 0.6,
      shrink: 0.74,
      lift: 0.1
    });
    const t0 = now;
    t.segs.forEach(function (s) {
      s.t0 = t0 + s.level * 0.22;
      s.dur = 0.28;
      s.p = 0;
      twigs.push(s);
    });
    t.tips.concat(t.buds).forEach(function (p) {
      for (let i = 0; i < 3; i++) {
        blooms.push({
          x: p.x + (Math.random() - 0.5) * 14,
          y: p.y + (Math.random() - 0.5) * 12,
          s: 12 + Math.random() * 12,
          spr: S.sprites.flowers[Math.floor(Math.random() * 4)],
          rot: Math.random() * S.TAU,
          t0: t0 + (p.level + 1) * 0.22 + 0.1 + Math.random() * 0.5
        });
      }
    });
    // keep it bounded: the oldest grown twigs go first
    while (twigs.length > 500) twigs.shift();
    while (blooms.length > 900) blooms.shift();
    for (let i = 0; i < 10; i++) {
      petals.spawn(hit.x, hit.y, (Math.random() - 0.5) * 120, -40 - Math.random() * 60);
    }
  }

  function scatter(x, y) {
    petals.list.forEach(function (p) {
      const dx = p.x - x;
      const dy = p.y - y;
      const d = Math.hypot(dx, dy) || 1;
      if (d > 160) return;
      const f = (1 - d / 160) * 420;
      p.landed = false;
      p.vx += dx / d * f;
      p.vy += dy / d * f - 60;
    });
  }

  /* ---------------------------------------------------------- events */

  let engine = null;

  window.addEventListener('pointermove', function (event) {
    wind.point(event.clientX, event.clientY);
  }, { passive: true });

  document.documentElement.addEventListener('pointerleave', function () {
    wind.leave();
  });

  document.addEventListener('pointerdown', function (event) {
    if (entering || event.button !== 0) return;
    if (event.target.closest('a, button, input, label, .lang')) return;
    const segs = tree ? tree.segs.concat(twigs) : twigs;
    const hit = S.nearestSeg(segs, event.clientX, event.clientY, event.pointerType === 'touch' ? 22 : 14);
    if (hit) {
      grow(hit);
    } else {
      scatter(event.clientX, event.clientY);
    }
    if (engine) engine.wake();
  });

  const artDoor = archEl && archEl.closest('[data-door]');
  if (artDoor) {
    ['pointerenter', 'focus'].forEach(function (type) {
      artDoor.addEventListener(type, function () {
        archHover = true;
        if (engine) engine.wake();
      });
    });
    ['pointerleave', 'blur'].forEach(function (type) {
      artDoor.addEventListener(type, function () {
        archHover = false;
        if (engine) engine.wake();
      });
    });
  }

  doors.forEach(function (door) {
    door.addEventListener('click', function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (entering) return;
      entering = true;
      door.classList.add('is-entering');
      if (!reduced) {
        // a gust: everything lifts and streams through to the right
        wind.gust(820, -70);
        petals.list.forEach(function (p) {
          p.landed = false;
          p.vy -= 80 + Math.random() * 120;
        });
        for (let i = 0; i < 140; i++) {
          petals.spawn(-40 - Math.random() * W * 0.4, Math.random() * H, 700 + Math.random() * 400, (Math.random() - 0.5) * 120);
        }
      }
      window.setTimeout(function () {
        window.site.leaveTo(door.href, door.getAttribute('data-tone'));
      }, reduced ? 0 : 240);
    });
  });

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) {
      entering = false;
      doors.forEach(function (d) {
        d.classList.remove('is-entering');
      });
    }
  });

  let resizeTimer = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      layout();
      if (engine) engine.wake();
    }, 120);
  });

  /* ------------------------------------------------------------ start */

  function start() {
    layout();
    seed();
    engine = S.loop(null, function (dt, t) {
      now = t;
      if (reduced) {
        // a still frame; it redraws only when something is clicked
        archOpen = archHover ? 1 : 0;
        render(t);
        return false;
      }
      step(dt);
      render(t);
      return true;
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(start);
  } else {
    start();
  }
})();
