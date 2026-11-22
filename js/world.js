/* ==========================================================================
   Worlds: the shattered realm.

   One fixed canvas behind the page. A world (a painted map on a disc) has
   been broken into great shards that drift in a void, each at its own
   depth: navy glaze on the outside, the world painted on the inside, so as
   they turn they flash from one to the other. Gold threads tie each shard
   to its neighbours.

   - Scroll: the world comes back together shard by shard; by the end of
     the page it is whole, and its cracks are gold.
   - Pointer (or tilting a phone): parallax in depth; and a river of molten
     gold that runs through the void bends toward the pointer.
   - Click the void: the shards near it are pushed away, and drift back.
   - Each section of the page sits on a shard of its own that settles into
     place as it comes into view.
   Reduced motion: no drift, no river flow; the scene is redrawn on scroll.
   ========================================================================== */

(function () {
  'use strict';

  const K = window.Kintsugi;
  const canvas = document.querySelector('[data-realm]');
  if (!canvas || !K) return;

  const reduced = K.reduced();
  const ctx = canvas.getContext('2d');
  const TAU = Math.PI * 2;
  const N = 13;

  let view = { w: 1, h: 1, dpr: 1 };
  let W = null;          // the world: centre, radius, textures, shards
  let stars = null;
  let progress = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let river = [];
  let sparks = [];

  /* ------------------------------------------------------------ paint */

  function paintStars() {
    const c = K.offscreen(view.w, view.h);
    const g = c.getContext('2d');
    const rand = K.rng(3);
    const v = g.createRadialGradient(view.w / 2, view.h * 0.45, 0, view.w / 2, view.h * 0.45, Math.max(view.w, view.h) * 0.75);
    v.addColorStop(0, '#0d1b58');
    v.addColorStop(0.55, '#060f3a');
    v.addColorStop(1, '#02051a');
    g.fillStyle = v;
    g.fillRect(0, 0, view.w, view.h);
    // nebula-like pools of glaze in the void
    for (let i = 0; i < 6; i++) {
      const x = rand() * view.w;
      const y = rand() * view.h;
      const r = (0.2 + rand() * 0.3) * Math.max(view.w, view.h);
      const p = g.createRadialGradient(x, y, 0, x, y, r);
      p.addColorStop(0, 'rgba(36, 73, 216, 0.12)');
      p.addColorStop(1, 'rgba(36, 73, 216, 0)');
      g.fillStyle = p;
      g.fillRect(0, 0, view.w, view.h);
    }
    for (let i = 0; i < (view.w * view.h) / 2600; i++) {
      const gold = rand() < 0.25;
      g.fillStyle = gold ? 'rgba(240, 210, 140, ' + (0.2 + rand() * 0.5).toFixed(2) + ')' : 'rgba(200, 215, 255, ' + (0.15 + rand() * 0.45).toFixed(2) + ')';
      const s = rand() < 0.08 ? 1.6 : 1;
      g.fillRect(rand() * view.w, rand() * view.h, s, s);
    }
    return c;
  }

  // the inside of the world: an old chart of seas and lands, in gold line on navy
  function paintWorld(S) {
    const c = K.offscreen(S, S);
    const g = c.getContext('2d');
    const r = S / 2;
    const rand = K.rng(17);
    g.save();
    g.beginPath();
    g.arc(r, r, r, 0, TAU);
    g.clip();

    const sea = g.createRadialGradient(r * 0.8, r * 0.7, 0, r, r, r);
    sea.addColorStop(0, '#1d3aa8');
    sea.addColorStop(0.6, '#10226a');
    sea.addColorStop(1, '#060d36');
    g.fillStyle = sea;
    g.fillRect(0, 0, S, S);

    // seigaiha: the sea drawn as overlapping waves
    const wr = S / 26;
    g.lineWidth = 0.8;
    for (let row = 0; row < S / (wr * 0.5) + 2; row++) {
      for (let col = 0; col < S / (wr * 2) + 2; col++) {
        const x = col * wr * 2 + (row % 2 ? wr : 0);
        const y = row * wr * 0.5;
        for (let k = 3; k >= 1; k--) {
          g.beginPath();
          g.arc(x, y, (wr * k) / 3, Math.PI, TAU);
          g.strokeStyle = 'rgba(140, 165, 255, ' + (0.05 + k * 0.012).toFixed(3) + ')';
          g.stroke();
        }
      }
    }

    // lands
    const lands = [];
    for (let i = 0; i < 7; i++) {
      const a = rand() * TAU;
      const d = (0.15 + rand() * 0.55) * r;
      const cx = r + Math.cos(a) * d;
      const cy = r + Math.sin(a) * d;
      const size = (0.1 + rand() * 0.16) * r;
      const pts = [];
      const n = 22;
      const ph = rand() * 10;
      for (let k = 0; k < n; k++) {
        const t = (k / n) * TAU;
        const rr = size * (0.7 + 0.22 * Math.sin(t * 3 + ph) + 0.12 * Math.sin(t * 7 + ph * 2) + rand() * 0.12);
        pts.push({ x: cx + Math.cos(t) * rr, y: cy + Math.sin(t) * rr * 0.8 });
      }
      lands.push({ pts: pts, cx: cx, cy: cy, size: size });
    }
    lands.forEach(function (land) {
      const path = K.pathOf(land.pts);
      const fill = g.createRadialGradient(land.cx - land.size * 0.3, land.cy - land.size * 0.3, 0, land.cx, land.cy, land.size * 1.2);
      fill.addColorStop(0, '#2c4fc2');
      fill.addColorStop(1, '#17318f');
      // the coast's echo in the water
      g.save();
      g.translate(land.cx, land.cy);
      g.scale(1.14, 1.14);
      g.translate(-land.cx, -land.cy);
      g.strokeStyle = 'rgba(217, 180, 94, 0.25)';
      g.lineWidth = 0.8;
      g.setLineDash([2, 4]);
      g.stroke(path);
      g.restore();
      g.setLineDash([]);
      g.fillStyle = fill;
      g.fill(path);
      g.strokeStyle = 'rgba(224, 185, 94, 0.9)';
      g.lineWidth = 1.3;
      g.stroke(path);
      // mountains
      g.strokeStyle = 'rgba(240, 210, 150, 0.7)';
      g.lineWidth = 1;
      for (let m = 0; m < 4; m++) {
        const mx = land.cx + (rand() - 0.5) * land.size * 0.9;
        const my = land.cy + (rand() - 0.5) * land.size * 0.6;
        const ms = land.size * 0.12;
        g.beginPath();
        g.moveTo(mx - ms, my + ms * 0.5);
        g.lineTo(mx, my - ms * 0.6);
        g.lineTo(mx + ms, my + ms * 0.5);
        g.stroke();
      }
    });
    // routes between lands
    g.strokeStyle = 'rgba(240, 210, 150, 0.45)';
    g.lineWidth = 0.9;
    g.setLineDash([3, 6]);
    for (let i = 0; i < lands.length - 1; i++) {
      const a = lands[i];
      const b = lands[i + 1];
      g.beginPath();
      g.moveTo(a.cx, a.cy);
      g.quadraticCurveTo((a.cx + b.cx) / 2 + (rand() - 0.5) * r * 0.3, (a.cy + b.cy) / 2 + (rand() - 0.5) * r * 0.3, b.cx, b.cy);
      g.stroke();
    }
    g.setLineDash([]);
    // a moon over the far sea
    g.beginPath();
    g.arc(r * 1.42, r * 0.5, r * 0.07, 0, TAU);
    g.fillStyle = 'rgba(246, 226, 168, 0.18)';
    g.fill();
    g.strokeStyle = 'rgba(246, 226, 168, 0.8)';
    g.lineWidth = 1;
    g.stroke();
    // a wind rose
    const wx = r * 0.48;
    const wy = r * 1.5;
    const ws = r * 0.1;
    g.strokeStyle = 'rgba(224, 185, 94, 0.6)';
    g.lineWidth = 0.8;
    g.beginPath();
    g.arc(wx, wy, ws * 0.55, 0, TAU);
    g.stroke();
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU;
      const l = k % 2 ? ws * 0.6 : ws;
      g.beginPath();
      g.moveTo(wx, wy);
      g.lineTo(wx + Math.cos(a) * l, wy + Math.sin(a) * l);
      g.stroke();
    }
    // the chart's border: a double ring, ruled in degrees
    g.strokeStyle = 'rgba(224, 185, 94, 0.85)';
    g.lineWidth = 1.2;
    g.beginPath();
    g.arc(r, r, r - 6, 0, TAU);
    g.stroke();
    g.lineWidth = 0.7;
    g.beginPath();
    g.arc(r, r, r - 16, 0, TAU);
    g.stroke();
    for (let k = 0; k < 120; k++) {
      const a = (k / 120) * TAU;
      const l = k % 10 === 0 ? 10 : 5;
      g.beginPath();
      g.moveTo(r + Math.cos(a) * (r - 6), r + Math.sin(a) * (r - 6));
      g.lineTo(r + Math.cos(a) * (r - 6 - l), r + Math.sin(a) * (r - 6 - l));
      g.stroke();
    }
    g.restore();
    return c;
  }

  function paintGlazeBack(S) {
    const shape = new Path2D();
    shape.arc(S / 2, S / 2, S / 2, 0, TAU);
    const c = K.glaze(S, S, shape, {
      seed: 29,
      light: { x: S * 0.3, y: S * 0.25 },
      pool: { x: S * 0.55, y: S * 0.6, r: S * 0.3 },
      crackle: Math.round(S * 0.4)
    });
    return c;
  }

  /* ----------------------------------------------------------- layout */

  function layout() {
    view = K.fit(canvas);
    stars = paintStars();
    const R = Math.min(view.w, view.h) * (view.w < 700 ? 0.44 : 0.4);
    const S = Math.ceil(R * 2);
    const cx = view.w / 2;
    const cy = view.h / 2;
    const rand = K.rng(101);
    // the break: seeds spread over the disc (local coords 0..S)
    const seeds = [];
    while (seeds.length < N) {
      const a = rand() * TAU;
      const d = Math.sqrt(rand()) * R * 0.92;
      seeds.push({ x: R + Math.cos(a) * d, y: R + Math.sin(a) * d });
    }
    const broken = K.voronoi(K.circle(R, R, R, 96), seeds, 1.6);
    const shards = broken.shards.map(function (sh, i) {
      const z = 0.45 + rand() * 0.95;
      // keep the near shards off the title, top left
      let sx = 0;
      let sy = 0;
      for (let k = 0; k < 20; k++) {
        sx = view.w * (0.06 + rand() * 0.88);
        sy = view.h * (0.1 + rand() * 0.8);
        if (view.w < 700) {
          if (sy > view.h * 0.42 || z < 0.7) break;
        } else if (!(sx < view.w * 0.46 && sy < view.h * 0.62) || z < 0.65) {
          break;
        }
      }
      return {
        poly: sh.poly,
        path: K.pathOf(sh.poly),
        c: sh.c,
        r: sh.r,
        z: z,
        sx: sx,
        sy: sy,
        sa: (rand() - 0.5) * 2.4,
        ph: rand() * TAU,
        sp: 0.15 + rand() * 0.25,
        flip: rand() < 0.5 ? Math.PI : Math.PI * 0.85,
        order: i,
        t: 0,
        kx: 0,
        ky: 0,
        kvx: 0,
        kvy: 0
      };
    });
    // assemble from the middle outward
    shards.slice().sort(function (a, b) {
      return Math.hypot(a.c.x - R, a.c.y - R) - Math.hypot(b.c.x - R, b.c.y - R);
    }).forEach(function (sh, k) {
      sh.order = k;
    });
    // which shards share each crack: the two whose centres are nearest it
    const seams = broken.edges.map(function (line) {
      const mid = line[Math.floor(line.length / 2)];
      const near = shards.map(function (sh, i) {
        return { i: i, d: Math.hypot(sh.c.x - mid.x, sh.c.y - mid.y) };
      }).sort(function (a, b) {
        return a.d - b.d;
      });
      return { line: K.measure([line], line[0].x, line[0].y), a: near[0].i, b: near[1].i };
    });
    const pairs = [];
    const seen = {};
    seams.forEach(function (s) {
      const key = Math.min(s.a, s.b) + '-' + Math.max(s.a, s.b);
      if (seen[key]) return;
      seen[key] = true;
      pairs.push([s.a, s.b]);
    });
    W = {
      R: R, S: S, cx: cx, cy: cy,
      inside: paintWorld(S),
      outside: paintGlazeBack(S),
      shards: shards,
      seams: seams,
      pairs: pairs
    };
    pointer.x = pointer.tx = cx;
    pointer.y = pointer.ty = cy;
    // the river's nodes
    river = [];
    const n = 9;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      river.push({
        x: -0.08 * view.w + f * 1.16 * view.w,
        base: view.h * (0.7 - 0.38 * f) + Math.sin(i * 1.7) * view.h * 0.06,
        y: 0,
        v: 0
      });
    }
    river.forEach(function (node) {
      node.y = node.base;
    });
    readScroll();
  }

  function readScroll() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }

  function smooth(t) {
    return t * t * (3 - 2 * t);
  }

  function targetT(sh) {
    const start = 0.04 + (sh.order / N) * 0.72;
    return smooth(Math.min(1, Math.max(0, (progress - start) / 0.22)));
  }

  /* ------------------------------------------------------------- draw */

  function shardPose(sh, time) {
    const t = sh.t;
    const drift = reduced ? 0 : 1;
    const hx = W.cx - W.R + sh.c.x;
    const hy = W.cy - W.R + sh.c.y;
    const fx = sh.sx + Math.sin(time * 0.0003 * sh.sp * 3 + sh.ph) * 26 * drift;
    const fy = sh.sy + Math.cos(time * 0.00025 * sh.sp * 3 + sh.ph) * 20 * drift;
    const par = (sh.z - 0.6) * 60 * (1 - t) + 10 * t;
    const px = ((pointer.x - view.w / 2) / view.w) * par;
    const py = ((pointer.y - view.h / 2) / view.h) * par;
    const scale = sh.z * 0.85 + (1 - sh.z * 0.85) * t;
    const spin = drift * Math.sin(time * 0.0004 * sh.sp * 2 + sh.ph) * 0.6;
    return {
      x: fx + (hx - fx) * t + px + sh.kx,
      y: fy + (hy - fy) * t + py + sh.ky,
      a: (sh.sa + spin * 0.3) * (1 - t),
      s: scale,
      f: (sh.flip + spin) * (1 - t)
    };
  }

  function drawShard(sh, pose) {
    const cos = Math.cos(pose.f);
    ctx.save();
    ctx.translate(pose.x, pose.y);
    ctx.rotate(pose.a);
    ctx.scale(pose.s * (Math.abs(cos) < 0.04 ? 0.04 * Math.sign(cos || 1) : cos), pose.s);
    ctx.translate(-sh.c.x, -sh.c.y);
    // its edge, catching light like the thickness of the clay
    ctx.lineWidth = 3 / pose.s;
    ctx.strokeStyle = 'rgba(150, 170, 230, 0.35)';
    ctx.stroke(sh.path);
    ctx.save();
    ctx.clip(sh.path);
    ctx.drawImage(cos >= 0 ? W.inside : W.outside, 0, 0);
    // far shards sink into the dark
    const dim = Math.max(0, (1 - sh.z) * 0.6 * (1 - sh.t));
    if (dim > 0.01) {
      ctx.fillStyle = 'rgba(2, 5, 24, ' + dim.toFixed(3) + ')';
      ctx.fillRect(0, 0, W.S, W.S);
    }
    // a glint where the light strikes as it turns
    const sheen = Math.max(0, 1 - Math.abs(Math.abs(cos) - 0.35) * 4) * (1 - sh.t);
    if (sheen > 0.02) {
      ctx.globalCompositeOperation = 'lighter';
      K.spec(ctx, sh.c.x - sh.r * 0.3, sh.c.y - sh.r * 0.3, sh.r * 1.2, sheen * 0.6);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
    ctx.lineWidth = 1.2 / pose.s;
    ctx.strokeStyle = 'rgba(224, 185, 94, ' + (0.35 + 0.4 * (1 - sh.t)).toFixed(3) + ')';
    ctx.stroke(sh.path);
    ctx.restore();
  }

  function riverPath() {
    const p = new Path2D();
    p.moveTo(river[0].x, river[0].y);
    for (let i = 0; i < river.length - 1; i++) {
      const a = river[Math.max(0, i - 1)];
      const b = river[i];
      const c = river[i + 1];
      const d = river[Math.min(river.length - 1, i + 2)];
      p.bezierCurveTo(
        b.x + (c.x - a.x) / 6, b.y + (c.y - a.y) / 6,
        c.x - (d.x - b.x) / 6, c.y - (d.y - b.y) / 6,
        c.x, c.y
      );
    }
    return p;
  }

  function drawRiver(time) {
    const path = riverPath();
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = 'rgba(240, 190, 90, 0.05)';
    ctx.lineWidth = 46;
    ctx.stroke(path);
    ctx.strokeStyle = 'rgba(240, 195, 100, 0.09)';
    ctx.lineWidth = 20;
    ctx.stroke(path);
    ctx.globalCompositeOperation = 'source-over';
    const grad = ctx.createLinearGradient(0, 0, view.w, 0);
    grad.addColorStop(0, '#7a5418');
    grad.addColorStop(0.3, '#d9a948');
    grad.addColorStop(0.55, '#f3d58a');
    grad.addColorStop(0.8, '#d9a948');
    grad.addColorStop(1, '#7a5418');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 5;
    ctx.stroke(path);
    ctx.strokeStyle = 'rgba(255, 246, 215, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.stroke(path);
    if (!reduced) {
      // the melt flowing along it
      ctx.setLineDash([2, 34]);
      ctx.lineDashOffset = -time * 0.09;
      ctx.strokeStyle = 'rgba(255, 252, 235, 0.95)';
      ctx.lineWidth = 3.2;
      ctx.stroke(path);
      ctx.setLineDash([14, 60]);
      ctx.lineDashOffset = -time * 0.05;
      ctx.strokeStyle = 'rgba(255, 236, 180, 0.5)';
      ctx.lineWidth = 2.4;
      ctx.stroke(path);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  function drawThreads(poses, time) {
    ctx.save();
    ctx.lineCap = 'round';
    W.pairs.forEach(function (pair, i) {
      const a = W.shards[pair[0]];
      const b = W.shards[pair[1]];
      const t = Math.min(a.t, b.t);
      if (t > 0.97) return;
      const pa = poses[pair[0]];
      const pb = poses[pair[1]];
      const mx = (pa.x + pb.x) / 2;
      const my = (pa.y + pb.y) / 2 + 40 * (1 - t);
      const alpha = 0.3 * (1 - t) + 0.05;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.quadraticCurveTo(mx, my, pb.x, pb.y);
      ctx.strokeStyle = 'rgba(224, 185, 94, ' + alpha.toFixed(3) + ')';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      if (!reduced) {
        const u = (time * 0.00022 + i * 0.37) % 1;
        const x = (1 - u) * (1 - u) * pa.x + 2 * (1 - u) * u * mx + u * u * pb.x;
        const y = (1 - u) * (1 - u) * pa.y + 2 * (1 - u) * u * my + u * u * pb.y;
        ctx.globalCompositeOperation = 'lighter';
        K.glint(ctx, x, y, 6, alpha * 2.4);
        ctx.globalCompositeOperation = 'source-over';
      }
    });
    ctx.restore();
  }

  function drawSeams() {
    // once two neighbours are home, the crack between them is gold
    ctx.save();
    ctx.translate(W.cx - W.R + pointerShift().x, W.cy - W.R + pointerShift().y);
    W.seams.forEach(function (s) {
      const t = Math.min(W.shards[s.a].t, W.shards[s.b].t);
      const a = smooth(Math.min(1, Math.max(0, (t - 0.86) / 0.14)));
      if (a <= 0) return;
      ctx.globalAlpha = a;
      K.seams(ctx, s.line, Infinity, 0.35 * a, 1.1);
    });
    ctx.restore();
  }

  function pointerShift() {
    return {
      x: ((pointer.x - view.w / 2) / view.w) * 10,
      y: ((pointer.y - view.h / 2) / view.h) * 10
    };
  }

  function draw(time) {
    if (!W) return;
    const d = view.dpr;
    ctx.setTransform(d, 0, 0, d, 0, 0);
    ctx.drawImage(stars, 0, 0, view.w, view.h);

    // a halo where the world will be, growing as it mends
    const whole = W.shards.reduce(function (sum, sh) {
      return sum + sh.t;
    }, 0) / W.shards.length;
    const halo = ctx.createRadialGradient(W.cx, W.cy, W.R * 0.6, W.cx, W.cy, W.R * 1.6);
    halo.addColorStop(0, 'rgba(46, 86, 230, ' + (0.08 + whole * 0.2).toFixed(3) + ')');
    halo.addColorStop(1, 'rgba(46, 86, 230, 0)');
    ctx.fillStyle = halo;
    ctx.fillRect(0, 0, view.w, view.h);

    const poses = W.shards.map(function (sh) {
      return shardPose(sh, time);
    });
    const order = W.shards.map(function (sh, i) {
      return i;
    }).sort(function (a, b) {
      const za = W.shards[a].z + W.shards[a].t * 2;
      const zb = W.shards[b].z + W.shards[b].t * 2;
      return za - zb;
    });
    let riverDrawn = false;
    order.forEach(function (i) {
      const sh = W.shards[i];
      if (!riverDrawn && sh.z + sh.t * 2 > 0.95) {
        drawThreads(poses, time);
        drawRiver(time);
        riverDrawn = true;
      }
      drawShard(sh, poses[i]);
    });
    if (!riverDrawn) {
      drawThreads(poses, time);
      drawRiver(time);
    }
    drawSeams();

    if (sparks.length) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      sparks.forEach(function (p) {
        K.glint(ctx, p.x, p.y, p.r * 3, p.life * 0.8);
      });
      ctx.restore();
    }
  }

  /* ------------------------------------------------------------- step */

  function step(dt, time) {
    pointer.x += (pointer.tx - pointer.x) * Math.min(1, dt * 4);
    pointer.y += (pointer.ty - pointer.y) * Math.min(1, dt * 4);
    W.shards.forEach(function (sh) {
      const want = targetT(sh);
      sh.t += (want - sh.t) * Math.min(1, dt * 3.5);
      // pushes from a click drift back
      sh.kvx += (-12 * sh.kx - 4 * sh.kvx) * dt;
      sh.kvy += (-12 * sh.ky - 4 * sh.kvy) * dt;
      sh.kx += sh.kvx * dt;
      sh.ky += sh.kvy * dt;
    });
    // the river leans toward the pointer
    river.forEach(function (node, i) {
      const reach = Math.exp(-Math.pow((node.x - pointer.x) / (view.w * 0.2), 2));
      const wave = Math.sin(time * 0.0006 + i * 0.9) * view.h * 0.03;
      const target = node.base + wave + (pointer.y - node.base) * reach * 0.8;
      node.v += ((target - node.y) * 14 - node.v * 5) * dt;
      node.y += node.v * dt;
    });
    // embers rising off the melt
    if (Math.random() < dt * 14) {
      const node = river[1 + Math.floor(Math.random() * (river.length - 2))];
      sparks.push({ x: node.x + (Math.random() - 0.5) * 60, y: node.y, vx: (Math.random() - 0.5) * 12, vy: -16 - Math.random() * 26, r: 0.8 + Math.random() * 1.2, life: 1 });
    }
    sparks.forEach(function (p) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 0.45;
    });
    sparks = sparks.filter(function (p) {
      return p.life > 0;
    });
  }

  /* ----------------------------------------------------------- events */

  let last = 0;
  const loop = K.loop(null, function (time) {
    const dt = Math.min(0.05, (time - (last || time)) / 1000);
    last = time;
    step(dt, time);
    draw(time);
  });

  function redrawStill() {
    // reduced motion: the scene follows the scroll, nothing else moves
    W.shards.forEach(function (sh) {
      sh.t = targetT(sh);
    });
    draw(0);
  }

  window.addEventListener('scroll', function () {
    readScroll();
    if (reduced) redrawStill();
  }, { passive: true });

  window.addEventListener('resize', function () {
    layout();
    if (reduced) redrawStill();
  });

  let mouse = false;
  window.addEventListener('pointermove', function (event) {
    if (event.pointerType === 'mouse') mouse = true;
    pointer.tx = event.clientX;
    pointer.ty = event.clientY;
  }, { passive: true });

  // a phone's tilt stands in for the pointer
  window.addEventListener('deviceorientation', function (event) {
    if (mouse || event.gamma == null) return;
    pointer.tx = view.w / 2 + Math.max(-1, Math.min(1, event.gamma / 30)) * view.w * 0.45;
    pointer.ty = view.h / 2 + Math.max(-1, Math.min(1, (event.beta - 45) / 30)) * view.h * 0.45;
  });

  // click the void: the shards near it are pushed away
  document.addEventListener('click', function (event) {
    if (reduced || !W) return;
    if (event.target.closest('a, button, input, label, .lang, dialog, .section > .wrap, .index, .topbar')) return;
    pointer.tx = event.clientX;
    pointer.ty = event.clientY;
    const t = performance.now();
    W.shards.forEach(function (sh) {
      const p = shardPose(sh, t);
      const dx = p.x - event.clientX;
      const dy = p.y - event.clientY;
      const dist = Math.hypot(dx, dy) || 1;
      const f = Math.max(0, 1 - dist / 420) * 900;
      sh.kvx += (dx / dist) * f;
      sh.kvy += (dy / dist) * f;
    });
    for (let i = 0; i < 24; i++) {
      const a = Math.random() * TAU;
      const v = 30 + Math.random() * 90;
      sparks.push({ x: event.clientX, y: event.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 1 + Math.random() * 1.4, life: 1 });
    }
  });

  // each section's shard settles into place as it comes into view
  const sections = document.querySelectorAll('.world .section');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-set');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    sections.forEach(function (s) {
      io.observe(s);
    });
  } else {
    sections.forEach(function (s) {
      s.classList.add('is-set');
    });
  }

  const hint = document.querySelector('[data-world-hint]');
  if (hint && !reduced) hint.hidden = false;

  layout();
  if (reduced) {
    redrawStill();
  } else {
    W.shards.forEach(function (sh) {
      sh.t = targetT(sh);
    });
    loop.start();
  }
})();
