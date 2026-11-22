/* ==========================================================================
   Kintsugi: the shared craft for every canvas on the site.

   - rng(seed)            a small seeded random, so a crack is repeatable
   - voronoi(boundary, seeds)
                          breaks a shape into shards (polygons), with the
                          inner edges made a little jagged, the same on
                          both sides, so the pieces fit back together
   - impactSeeds(...)     shard centres crowded around where it was struck
   - cracks(...)          a branching crack from a point, as polylines whose
                          points carry their distance from the strike
   - glaze(...)           paints a deep navy glaze into an offscreen canvas:
                          pooling, mottling, a fine crackle, speckle
   - seams(ctx, lines, front, glow)
                          draws gold along cracks, up to how far the gold
                          has flowed (front, in px from the strike)
   - Vessel(canvas, ...)  a bowl or cup you can break and mend (atelier,
                          404): Voronoi shards with simple physics; hold to
                          pull them home; when whole, the cracks fill with
                          gold that is then fired into the glaze for good.
   ========================================================================== */

(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const K = {};

  K.GOLD = { hi: '#fbedc0', mid: '#e0b95e', lo: '#a8792a', deep: '#5e3f0e' };

  K.reduced = function () {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };

  K.t = function (key) {
    return (window.i18n && window.i18n.t(key)) || key;
  };

  K.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  K.dpr = function () {
    return Math.min(2, window.devicePixelRatio || 1);
  };

  // Size a canvas to its CSS box. Returns {w, h, dpr}.
  K.fit = function (canvas) {
    const box = canvas.getBoundingClientRect();
    const dpr = K.dpr();
    const w = Math.max(1, Math.round(box.width));
    const h = Math.max(1, Math.round(box.height));
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    return { w: w, h: h, dpr: dpr };
  };

  K.offscreen = function (w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w));
    c.height = Math.max(1, Math.ceil(h));
    return c;
  };

  /* ------------------------------------------------------------ geometry */

  K.circle = function (cx, cy, r, n) {
    const pts = [];
    const steps = n || 72;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * TAU;
      pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
    }
    return pts;
  };

  K.centroid = function (poly) {
    let a = 0;
    let x = 0;
    let y = 0;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i];
      const q = poly[(i + 1) % poly.length];
      const f = p.x * q.y - q.x * p.y;
      a += f;
      x += (p.x + q.x) * f;
      y += (p.y + q.y) * f;
    }
    if (Math.abs(a) < 1e-6) return { x: poly[0].x, y: poly[0].y };
    return { x: x / (3 * a), y: y / (3 * a) };
  };

  K.pathOf = function (poly) {
    const p = new Path2D();
    poly.forEach(function (pt, i) {
      if (i) p.lineTo(pt.x, pt.y);
      else p.moveTo(pt.x, pt.y);
    });
    p.closePath();
    return p;
  };

  function clipHalf(poly, mx, my, nx, ny) {
    const out = [];
    const n = poly.length;
    for (let i = 0; i < n; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % n];
      const da = (a.x - mx) * nx + (a.y - my) * ny;
      const db = (b.x - mx) * nx + (b.y - my) * ny;
      if (da <= 0) out.push(a);
      if ((da <= 0) !== (db <= 0)) {
        const t = da / (da - db);
        out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      }
    }
    return out;
  }

  function distToSegment(p, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l));
    return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
  }

  function onBoundary(p, boundary) {
    for (let i = 0; i < boundary.length; i++) {
      if (distToSegment(p, boundary[i], boundary[(i + 1) % boundary.length]) < 0.75) return true;
    }
    return false;
  }

  // A jagged run between a and b, the same whichever side asks for it.
  function jag(a, b, rough) {
    const ka = a.x.toFixed(1) + ',' + a.y.toFixed(1);
    const kb = b.x.toFixed(1) + ',' + b.y.toFixed(1);
    const flip = ka > kb;
    const p = flip ? b : a;
    const q = flip ? a : b;
    const rand = K.rng(hash(flip ? kb + ka : ka + kb));
    const len = Math.hypot(q.x - p.x, q.y - p.y);
    const steps = Math.max(1, Math.round(len / 11));
    const nx = -(q.y - p.y) / (len || 1);
    const ny = (q.x - p.x) / (len || 1);
    const amp = Math.min(3.2, len * 0.07) * (rough == null ? 1 : rough);
    const pts = [];
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const o = (rand() - 0.5) * 2 * amp;
      pts.push({ x: p.x + (q.x - p.x) * t + nx * o, y: p.y + (q.y - p.y) * t + ny * o });
    }
    if (flip) pts.reverse();
    return pts;
  }

  // Break a shape into shards around the seeds. Returns
  // { shards: [{poly, c, r}], edges: [[pt, pt, ...]] } where edges are the
  // inner cracks (each once), for the gold.
  K.voronoi = function (boundary, seeds, rough) {
    const shards = [];
    const edges = [];
    const seen = new Set();
    seeds.forEach(function (s, i) {
      let poly = boundary.slice();
      for (let j = 0; j < seeds.length && poly.length > 2; j++) {
        if (i === j) continue;
        const o = seeds[j];
        poly = clipHalf(poly, (s.x + o.x) / 2, (s.y + o.y) / 2, o.x - s.x, o.y - s.y);
      }
      if (poly.length < 3) return;
      const out = [];
      for (let k = 0; k < poly.length; k++) {
        const a = poly[k];
        const b = poly[(k + 1) % poly.length];
        out.push(a);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        if (Math.hypot(b.x - a.x, b.y - a.y) < 0.5 || onBoundary(mid, boundary)) continue;
        const run = jag(a, b, rough);
        run.forEach(function (p) {
          out.push(p);
        });
        const key = [a.x.toFixed(0), a.y.toFixed(0), b.x.toFixed(0), b.y.toFixed(0)];
        const k1 = key.join(',');
        const k2 = [key[2], key[3], key[0], key[1]].join(',');
        if (!seen.has(k1) && !seen.has(k2)) {
          seen.add(k1);
          edges.push([a].concat(run, [b]));
        }
      }
      const c = K.centroid(out);
      let r = 0;
      out.forEach(function (p) {
        r = Math.max(r, Math.hypot(p.x - c.x, p.y - c.y));
      });
      if (r > 2) shards.push({ poly: out, c: c, r: r });
    });
    return { shards: shards, edges: edges };
  };

  // Shard centres, crowded near the strike (small pieces there, big ones far off).
  K.impactSeeds = function (ix, iy, reach, n, rand, inside) {
    const seeds = [];
    let tries = 0;
    while (seeds.length < n && tries < n * 30) {
      tries++;
      const a = rand() * TAU;
      const d = reach * (0.06 + 0.94 * Math.pow(rand(), 1.25));
      const p = { x: ix + Math.cos(a) * d, y: iy + Math.sin(a) * d };
      if (inside && !inside(p.x, p.y)) continue;
      seeds.push(p);
    }
    return seeds;
  };

  // A branching crack from (x, y). inside(x, y) keeps it to the surface.
  K.cracks = function (x, y, o) {
    const rand = o.rand || Math.random;
    const lines = [];
    const count = o.count || 6;
    const base = rand() * TAU;
    function walk(sx, sy, ang, len, d0, depth) {
      const pts = [{ x: sx, y: sy, d: d0 }];
      let px = sx;
      let py = sy;
      let d = d0;
      let left = len;
      while (left > 0) {
        ang += (rand() - 0.5) * (o.wander || 0.7);
        const s = (o.step || 12) * (0.55 + rand() * 0.9);
        const nx = px + Math.cos(ang) * s;
        const ny = py + Math.sin(ang) * s;
        if (o.inside && !o.inside(nx, ny)) break;
        px = nx;
        py = ny;
        d += s;
        left -= s;
        pts.push({ x: px, y: py, d: d });
        if (depth < 2 && rand() < (o.branch || 0.12)) {
          walk(px, py, ang + (rand() < 0.5 ? -1 : 1) * (0.45 + rand() * 0.7), left * (0.35 + rand() * 0.3), d, depth + 1);
        }
      }
      if (pts.length > 1) lines.push(pts);
    }
    for (let i = 0; i < count; i++) {
      const ang = base + (i / count) * TAU + (rand() - 0.5) * (TAU / count) * 0.7;
      walk(x, y, ang, (o.len || 120) * (0.55 + rand() * 0.6), 0, 0);
    }
    return lines;
  };

  // Give every point of plain polylines a distance from a strike point.
  K.measure = function (lines, ix, iy) {
    return lines.map(function (line) {
      return line.map(function (p) {
        return { x: p.x, y: p.y, d: Math.hypot(p.x - ix, p.y - iy) };
      });
    });
  };

  /* --------------------------------------------------------------- glaze */

  // Paint a navy glaze into a w x h canvas, clipped to shape (a Path2D).
  // o: { light: {x, y} where the glaze is thinnest/lightest, pool: {x, y, r}
  //      where it pools deepest, seed, crackle (count), drip (y of the glaze
  //      line, for a side view) }
  K.glaze = function (w, h, shape, o) {
    const opts = o || {};
    const c = K.offscreen(w, h);
    const g = c.getContext('2d');
    const rand = K.rng(opts.seed || 7);
    g.save();
    g.clip(shape);

    // body: deep ruri, lighter where the glaze runs thin
    const L = opts.light || { x: w * 0.35, y: h * 0.3 };
    const base = g.createRadialGradient(L.x, L.y, 0, L.x, L.y, Math.max(w, h) * 0.9);
    base.addColorStop(0, '#2c4fc2');
    base.addColorStop(0.35, '#1a3591');
    base.addColorStop(0.7, '#0f2063');
    base.addColorStop(1, '#070f38');
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);

    // mottling: the glaze is never one colour
    for (let i = 0; i < 70; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const r = (0.04 + rand() * 0.16) * Math.max(w, h);
      const dark = rand() < 0.55;
      const blob = g.createRadialGradient(x, y, 0, x, y, r);
      blob.addColorStop(0, dark ? 'rgba(4, 9, 36, 0.22)' : (rand() < 0.5 ? 'rgba(70, 108, 235, 0.13)' : 'rgba(36, 73, 216, 0.16)'));
      blob.addColorStop(1, 'rgba(0, 0, 0, 0)');
      g.fillStyle = blob;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }

    // the pool: glaze gathers deep and glassy
    if (opts.pool) {
      const P = opts.pool;
      const pg = g.createRadialGradient(P.x, P.y, 0, P.x, P.y, P.r);
      pg.addColorStop(0, 'rgba(46, 86, 230, 0.55)');
      pg.addColorStop(0.45, 'rgba(22, 48, 160, 0.35)');
      pg.addColorStop(0.8, 'rgba(5, 12, 44, 0.35)');
      pg.addColorStop(1, 'rgba(5, 12, 44, 0)');
      g.fillStyle = pg;
      g.fillRect(0, 0, w, h);
    }

    // runs: faint vertical streaks where the glaze flowed in the kiln
    if (opts.runs) {
      for (let i = 0; i < opts.runs; i++) {
        const x = rand() * w;
        const len = h * (0.2 + rand() * 0.5);
        const y0 = rand() * h * 0.4;
        const sg = g.createLinearGradient(0, y0, 0, y0 + len);
        sg.addColorStop(0, 'rgba(120, 150, 255, 0)');
        sg.addColorStop(0.5, rand() < 0.5 ? 'rgba(120, 150, 255, 0.07)' : 'rgba(3, 8, 30, 0.16)');
        sg.addColorStop(1, 'rgba(120, 150, 255, 0)');
        g.fillStyle = sg;
        g.fillRect(x, y0, 2 + rand() * 7, len);
      }
    }

    // crackle (kannyu): a fine net in the glaze
    const crackle = opts.crackle == null ? 140 : opts.crackle;
    g.lineCap = 'round';
    for (let i = 0; i < crackle; i++) {
      let x = rand() * w;
      let y = rand() * h;
      let a = rand() * TAU;
      g.beginPath();
      g.moveTo(x, y);
      const n = 3 + Math.floor(rand() * 6);
      for (let k = 0; k < n; k++) {
        a += (rand() - 0.5) * 1.4;
        const s = 6 + rand() * 16;
        x += Math.cos(a) * s;
        y += Math.sin(a) * s;
        g.lineTo(x, y);
      }
      g.lineWidth = 0.5 + rand() * 0.5;
      g.strokeStyle = rand() < 0.7 ? 'rgba(150, 175, 255, 0.075)' : 'rgba(2, 6, 26, 0.3)';
      g.stroke();
    }

    // speckle: iron spots and tiny bubbles
    for (let i = 0; i < (w * h) / 900; i++) {
      g.fillStyle = rand() < 0.6 ? 'rgba(200, 215, 255, 0.10)' : 'rgba(0, 0, 10, 0.25)';
      g.fillRect(rand() * w, rand() * h, 1, 1);
    }
    g.restore();
    return c;
  };

  // A soft specular highlight, added to whatever is clipped.
  K.spec = function (ctx, x, y, r, strength) {
    const s = ctx.createRadialGradient(x, y, 0, x, y, r);
    s.addColorStop(0, 'rgba(235, 242, 255, ' + (0.55 * strength) + ')');
    s.addColorStop(0.18, 'rgba(170, 195, 255, ' + (0.22 * strength) + ')');
    s.addColorStop(1, 'rgba(120, 150, 255, 0)');
    ctx.fillStyle = s;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  /* --------------------------------------------------------------- seams */

  // Build a Path2D of every line, up to distance `front` from the strike.
  function seamPath(lines, front) {
    const p = new Path2D();
    lines.forEach(function (line) {
      let pen = false;
      for (let i = 1; i < line.length; i++) {
        const a = line[i - 1];
        const b = line[i];
        const ain = a.d <= front;
        const bin = b.d <= front;
        if (!ain && !bin) {
          pen = false;
          continue;
        }
        let ax = a.x, ay = a.y, bx = b.x, by = b.y;
        if (!bin) {
          const t = (front - a.d) / ((b.d - a.d) || 1);
          bx = a.x + (b.x - a.x) * t;
          by = a.y + (b.y - a.y) * t;
        } else if (!ain) {
          const t = (front - b.d) / ((a.d - b.d) || 1);
          ax = b.x + (a.x - b.x) * t;
          ay = b.y + (a.y - b.y) * t;
          pen = false;
        }
        if (!pen) p.moveTo(ax, ay);
        p.lineTo(bx, by);
        pen = bin;
      }
    });
    return p;
  }
  K.seamPath = seamPath;

  // Gold along the lines, as far as `front`. glow 0..1 adds a bloom.
  // width scales the whole seam.
  K.seams = function (ctx, lines, front, glow, width) {
    if (!lines.length) return;
    const w = width || 1;
    const path = seamPath(lines, front == null ? Infinity : front);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (glow > 0) {
      ctx.strokeStyle = 'rgba(240, 200, 110, ' + (0.16 * glow) + ')';
      ctx.lineWidth = 9 * w;
      ctx.stroke(path);
      ctx.strokeStyle = 'rgba(250, 220, 150, ' + (0.28 * glow) + ')';
      ctx.lineWidth = 4.5 * w;
      ctx.stroke(path);
    }
    ctx.strokeStyle = K.GOLD.deep;
    ctx.lineWidth = 2.6 * w;
    ctx.stroke(path);
    ctx.strokeStyle = K.GOLD.mid;
    ctx.lineWidth = 1.7 * w;
    ctx.stroke(path);
    ctx.strokeStyle = 'rgba(253, 240, 200, 0.85)';
    ctx.lineWidth = 0.6 * w;
    ctx.stroke(path);
    ctx.restore();
  };

  // A bare crack, before the gold: a dark line with a pale lip.
  K.crackLines = function (ctx, lines, front, width) {
    const w = width || 1;
    const path = seamPath(lines, front == null ? Infinity : front);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(180, 200, 255, 0.35)';
    ctx.lineWidth = 2 * w;
    ctx.stroke(path);
    ctx.strokeStyle = 'rgba(2, 5, 20, 0.95)';
    ctx.lineWidth = 1.1 * w;
    ctx.stroke(path);
    ctx.restore();
  };

  // A point a fraction t of the way along a random line (for glints).
  K.along = function (line, t) {
    const total = line[line.length - 1].d - line[0].d || 1;
    const want = line[0].d + total * t;
    for (let i = 1; i < line.length; i++) {
      if (line[i].d >= want) {
        const a = line[i - 1];
        const b = line[i];
        const f = (want - a.d) / ((b.d - a.d) || 1);
        return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
      }
    }
    return line[line.length - 1];
  };

  K.glint = function (ctx, x, y, r, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255, 250, 230, ' + a + ')');
    g.addColorStop(0.25, 'rgba(250, 220, 150, ' + (a * 0.5) + ')');
    g.addColorStop(1, 'rgba(240, 200, 110, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };

  // Run fn(time) every frame while the element is on screen and the tab is
  // visible. Returns { start, stop, kick } — kick runs one frame.
  K.loop = function (el, fn) {
    let raf = 0;
    let onScreen = true;
    let wanted = false;
    function frame(time) {
      raf = 0;
      if (!wanted || !onScreen || document.hidden) return;
      if (fn(time) === false) {
        wanted = false;
        return;
      }
      raf = window.requestAnimationFrame(frame);
    }
    function run() {
      if (!raf && wanted && onScreen && !document.hidden) raf = window.requestAnimationFrame(frame);
    }
    if (el && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[entries.length - 1].isIntersecting;
        run();
      }).observe(el);
    }
    document.addEventListener('visibilitychange', run);
    return {
      start: function () {
        wanted = true;
        run();
      },
      stop: function () {
        wanted = false;
      },
      kick: function () {
        window.requestAnimationFrame(function (t) {
          fn(t);
        });
      }
    };
  };

  /* -------------------------------------------------------------- vessel */

  // Silhouettes in unit space, x in -0.5..0.5, plus where the rim and the
  // inside are, for painting.
  function bezier(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return {
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
    };
  }

  const SHAPES = {
    // a chawan, seen a little from above
    bowl: { rimY: -0.2, rimRx: 0.5, rimRy: 0.1, bodyEnd: { x: 0.17, y: 0.29 }, c1: { x: 0.5, y: 0.08 }, c2: { x: 0.36, y: 0.28 }, foot: 0.145, footY: 0.35, glazeLine: 0.245 },
    // a yunomi: tall, straight, a little narrower at the foot
    cup: { rimY: -0.36, rimRx: 0.33, rimRy: 0.075, bodyEnd: { x: 0.25, y: 0.37 }, c1: { x: 0.35, y: -0.1 }, c2: { x: 0.3, y: 0.3 }, foot: 0.21, footY: 0.43, glazeLine: 0.3 }
  };

  function silhouette(s) {
    const pts = [];
    // the far half of the rim is the top edge
    for (let i = 0; i <= 28; i++) {
      const a = Math.PI + (i / 28) * Math.PI;
      pts.push({ x: Math.cos(a) * s.rimRx, y: s.rimY + Math.sin(a) * s.rimRy });
    }
    const r0 = { x: s.rimRx, y: s.rimY };
    for (let i = 1; i <= 22; i++) {
      pts.push(bezier(r0, s.c1, s.c2, s.bodyEnd, i / 22));
    }
    pts.push({ x: s.foot, y: s.bodyEnd.y + 0.004 });
    pts.push({ x: s.foot - 0.008, y: s.footY });
    pts.push({ x: -s.foot + 0.008, y: s.footY });
    pts.push({ x: -s.foot, y: s.bodyEnd.y + 0.004 });
    const l0 = { x: -s.bodyEnd.x, y: s.bodyEnd.y };
    const lc2 = { x: -s.c2.x, y: s.c2.y };
    const lc1 = { x: -s.c1.x, y: s.c1.y };
    const lr = { x: -s.rimRx, y: s.rimY };
    for (let i = 0; i < 22; i++) {
      pts.push(bezier(l0, lc2, lc1, lr, i / 22));
    }
    return pts;
  }

  function paintVessel(size, s, seed) {
    const W = size;
    const H = size;
    const tx = function (p) {
      return { x: W / 2 + p.x * W, y: H / 2 + p.y * W };
    };
    const outline = silhouette(s).map(tx);
    const shape = K.pathOf(outline);
    const rim = { x: W / 2, y: H / 2 + s.rimY * W, rx: s.rimRx * W, ry: s.rimRy * W };
    const tex = K.glaze(W, H, shape, {
      seed: seed,
      light: { x: W * 0.36, y: rim.y + W * 0.08 },
      pool: { x: W / 2, y: rim.y + rim.ry * 0.4, r: rim.rx * 0.7 },
      runs: 22,
      crackle: 120
    });
    const g = tex.getContext('2d');
    g.save();
    g.clip(shape);

    // shading across the body: the glaze darkens where it turns away
    const side = g.createLinearGradient(rim.x - rim.rx, 0, rim.x + rim.rx, 0);
    side.addColorStop(0, 'rgba(2, 6, 26, 0.6)');
    side.addColorStop(0.22, 'rgba(2, 6, 26, 0)');
    side.addColorStop(0.7, 'rgba(2, 6, 26, 0.05)');
    side.addColorStop(1, 'rgba(2, 6, 26, 0.65)');
    g.fillStyle = side;
    g.fillRect(0, 0, W, H);
    const low = g.createLinearGradient(0, rim.y, 0, H / 2 + s.footY * W);
    low.addColorStop(0, 'rgba(2, 6, 26, 0)');
    low.addColorStop(1, 'rgba(2, 6, 26, 0.45)');
    g.fillStyle = low;
    g.fillRect(0, rim.y, W, H);

    // a long soft highlight down the lit side
    const gl = H / 2 + s.glazeLine * W;
    const hy = (rim.y + rim.ry + gl) / 2;
    const hh = (gl - rim.y - rim.ry) * 0.5;
    g.save();
    g.translate(W * 0.32, hy);
    g.scale(1, hh / (W * 0.05));
    const hl = g.createRadialGradient(0, 0, 0, 0, 0, W * 0.05);
    hl.addColorStop(0, 'rgba(210, 225, 255, 0.16)');
    hl.addColorStop(1, 'rgba(210, 225, 255, 0)');
    g.fillStyle = hl;
    g.fillRect(-W * 0.05, -W * 0.05, W * 0.1, W * 0.1);
    g.restore();

    // the inside: a dark well with the far wall catching light, and a pool
    g.save();
    g.beginPath();
    g.ellipse(rim.x, rim.y, rim.rx - 2, rim.ry - 1.5, 0, 0, TAU);
    g.clip();
    const inner = g.createLinearGradient(0, rim.y - rim.ry, 0, rim.y + rim.ry);
    inner.addColorStop(0, '#2a4cc0');
    inner.addColorStop(0.45, '#10215f');
    inner.addColorStop(1, '#050b2c');
    g.fillStyle = inner;
    g.fillRect(rim.x - rim.rx, rim.y - rim.ry, rim.rx * 2, rim.ry * 2);
    const pool = g.createRadialGradient(rim.x, rim.y + rim.ry * 0.25, 0, rim.x, rim.y + rim.ry * 0.25, rim.rx * 0.45);
    pool.addColorStop(0, 'rgba(60, 100, 240, 0.55)');
    pool.addColorStop(1, 'rgba(60, 100, 240, 0)');
    g.fillStyle = pool;
    g.fillRect(rim.x - rim.rx, rim.y - rim.ry, rim.rx * 2, rim.ry * 2);
    g.restore();

    // the lip: glaze runs thin and pale at the rim
    g.beginPath();
    g.ellipse(rim.x, rim.y, rim.rx - 1.2, rim.ry - 0.8, 0, 0, TAU);
    g.strokeStyle = 'rgba(165, 190, 255, 0.6)';
    g.lineWidth = 2;
    g.stroke();

    // the foot is bare clay below a soft, uneven line where the glaze stopped
    const rand = K.rng(seed + 3);
    const pts = [];
    for (let x = -W * 0.04; x <= W * 1.04; x += W / 16) {
      pts.push({ x: x, y: gl + (rand() - 0.35) * W * 0.018 });
    }
    g.beginPath();
    g.moveTo(pts[0].x, H);
    g.lineTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const m = { x: (pts[i - 1].x + pts[i].x) / 2, y: (pts[i - 1].y + pts[i].y) / 2 };
      g.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, m.x, m.y);
    }
    g.lineTo(pts[pts.length - 1].x, H);
    g.closePath();
    const clay = g.createLinearGradient(rim.x - W * 0.2, 0, rim.x + W * 0.2, 0);
    clay.addColorStop(0, '#20263f');
    clay.addColorStop(0.4, '#3a3f58');
    clay.addColorStop(1, '#171b30');
    g.fillStyle = clay;
    g.fill();
    // the glaze is thickest at its edge: a glassy bead
    g.strokeStyle = 'rgba(110, 140, 250, 0.35)';
    g.lineWidth = 2.5;
    g.stroke();
    g.strokeStyle = 'rgba(3, 8, 32, 0.7)';
    g.lineWidth = 1;
    g.stroke();
    g.restore();

    return { tex: tex, outline: outline, shape: shape, rim: rim };
  }

  /*
   * Vessel(canvas, { shape: 'bowl'|'cup', spot: element marking where the
   * vessel sits (defaults to the canvas centre), start: 'whole'|'broken',
   * pieces, tapToMend (one tap mends, instead of press and hold),
   * onState(state, mended) })
   * state: 'whole' | 'broken' | 'mending' | 'gilding'
   */
  K.Vessel = function (canvas, options) {
    const o = options || {};
    const reduced = K.reduced();
    const ctx = canvas.getContext('2d');
    const kind = SHAPES[o.shape || 'bowl'];
    let seed = o.seed || 11;
    let view = { w: 1, h: 1, dpr: 1 };
    let size = 300;
    let origin = { x: 0, y: 0 };  // canvas px of the vessel's top-left
    let art = null;               // the painted vessel (and fired gold)
    let shards = [];
    let edges = [];
    let impact = { x: 0, y: 0 };
    let state = 'whole';
    let mended = 0;
    let holding = false;
    let auto = false;
    let holdTime = 0;
    let gildT = 0;
    let gildMax = 1;
    let last = 0;
    let pointer = { x: -1, y: -1, on: false };
    let sparks = [];
    const firedSeams = []; // in vessel units, so they survive a resize

    function setState(next) {
      state = next;
      canvas.setAttribute('data-state', next);
      if (o.onState) o.onState(next, mended);
    }

    function layout() {
      view = K.fit(canvas);
      const cb = canvas.getBoundingClientRect();
      let spot = { x: view.w / 2, y: view.h / 2, s: Math.min(view.w, view.h) * 0.7 };
      if (o.spot) {
        const b = o.spot.getBoundingClientRect();
        spot = { x: b.left - cb.left + b.width / 2, y: b.top - cb.top + b.height / 2, s: Math.min(b.width, b.height) };
      }
      const newSize = Math.max(120, Math.round(spot.s));
      const old = size;
      size = newSize;
      origin = { x: spot.x - size / 2, y: spot.y - size / 2 };
      art = paintVessel(size, kind, seed);
      fire();
      if (shards.length && old !== size) {
        // keep the break, rescaled
        const f = size / old;
        shards.forEach(function (sh) {
          sh.poly = sh.poly.map(function (p) {
            return { x: p.x * f, y: p.y * f };
          });
          sh.c = { x: sh.c.x * f, y: sh.c.y * f };
          sh.r *= f;
          sh.x *= f;
          sh.y *= f;
          sh.path = K.pathOf(sh.poly);
        });
        edges = edges.map(function (line) {
          return line.map(function (p) {
            return { x: p.x * f, y: p.y * f, d: p.d * f };
          });
        });
        impact = { x: impact.x * f, y: impact.y * f };
      }
    }

    // fire the gold of every past mend into the glaze
    function fire() {
      if (!firedSeams.length) return;
      const g = art.tex.getContext('2d');
      g.save();
      g.clip(art.shape);
      firedSeams.forEach(function (set) {
        const lines = set.map(function (line) {
          return line.map(function (p) {
            return { x: p.x * size, y: p.y * size, d: 0 };
          });
        });
        K.seams(g, lines, Infinity, 0.25, Math.max(0.7, size / 420));
      });
      g.restore();
    }

    function insideLocal(x, y) {
      // x, y in vessel px; isPointInPath uses the canvas transform, so reset it
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const hit = ctx.isPointInPath(art.shape, x, y);
      ctx.restore();
      return hit;
    }

    function shatter(lx, ly) {
      if (state !== 'whole') return;
      seed += 1;
      const rand = K.rng(seed * 97 + 13);
      impact = { x: lx, y: ly };
      const seeds = K.impactSeeds(lx, ly, size * 0.55, o.pieces || 20, rand, insideLocal);
      const broken = K.voronoi(art.outline, seeds, 1);
      edges = K.measure(broken.edges, lx, ly);
      shards = broken.shards.map(function (sh) {
        const dx = sh.c.x - lx;
        const dy = sh.c.y - ly;
        const d = Math.hypot(dx, dy) || 1;
        const kick = (380 + rand() * 420) * (0.6 + 0.4 * (1 - Math.min(1, d / size)));
        return {
          poly: sh.poly, c: sh.c, r: sh.r, path: K.pathOf(sh.poly),
          x: 0, y: 0, a: 0,
          vx: (dx / d) * kick + (rand() - 0.5) * 120,
          vy: (dy / d) * kick - 260 - rand() * 220,
          va: (rand() - 0.5) * 9,
          rest: false
        };
      });
      holding = false;
      auto = false;
      setState('broken');
      if (reduced) settleNow();
      else go();
    }

    // run the physics to rest at once (reduced motion; a cup already broken)
    function settleNow() {
      for (let i = 0; i < 400; i++) step(1 / 60);
      draw(performance.now());
    }

    function bounds() {
      return {
        left: -origin.x,
        right: view.w - origin.x,
        floor: view.h - origin.y - 8,
        top: -origin.y - 400
      };
    }

    function step(dt) {
      const B = bounds();
      let home = true;
      const pull = holding || auto;
      if (pull) holdTime += dt;
      const k = pull ? Math.min(90, 6 + holdTime * holdTime * 40) : 0;
      shards.forEach(function (sh) {
        if (pull) {
          const damp = 2 * Math.sqrt(k) * 0.9;
          sh.vx += (-k * sh.x - damp * sh.vx) * dt;
          sh.vy += (-k * sh.y - damp * sh.vy) * dt;
          let da = sh.a % TAU;
          if (da > Math.PI) da -= TAU;
          if (da < -Math.PI) da += TAU;
          sh.a = da;
          sh.va += (-k * da - damp * sh.va) * dt;
        } else {
          sh.vy += 1500 * dt;
          sh.vx *= Math.pow(0.6, dt);
          sh.va *= Math.pow(0.5, dt);
        }
        sh.x += sh.vx * dt;
        sh.y += sh.vy * dt;
        sh.a += sh.va * dt;
        if (!pull) {
          const cx = sh.c.x + sh.x;
          const cy = sh.c.y + sh.y;
          const rr = sh.r * 0.55;
          sh.rest = false;
          if (cy + rr > B.floor) {
            sh.y = B.floor - rr - sh.c.y;
            if (sh.vy > 0) sh.vy = sh.vy > 140 ? -sh.vy * 0.28 : 0;
            sh.vx *= 0.82;
            sh.va *= 0.7;
            sh.rest = sh.vy === 0;
          }
          if (cx - rr < B.left) {
            sh.x = B.left + rr - sh.c.x;
            sh.vx = Math.abs(sh.vx) * 0.4;
          }
          if (cx + rr > B.right) {
            sh.x = B.right - rr - sh.c.x;
            sh.vx = -Math.abs(sh.vx) * 0.4;
          }
        }
        if (Math.abs(sh.x) > 0.6 || Math.abs(sh.y) > 0.6 || Math.abs(sh.a) > 0.01) home = false;
      });
      if (pull && home && holdTime > 0.25) {
        shards.forEach(function (sh) {
          sh.x = 0;
          sh.y = 0;
          sh.a = 0;
          sh.vx = sh.vy = sh.va = 0;
        });
        gild();
      }
    }

    function gild() {
      holding = false;
      auto = false;
      gildT = 0;
      gildMax = 0;
      edges.forEach(function (line) {
        line.forEach(function (p) {
          gildMax = Math.max(gildMax, p.d);
        });
      });
      mended += 1;
      setState('gilding');
      if (reduced) finishGild();
    }

    function finishGild() {
      firedSeams.push(edges.map(function (line) {
        return line.map(function (p) {
          return { x: p.x / size, y: p.y / size };
        });
      }));
      art = paintVessel(size, kind, o.seed || 11);
      fire();
      shards = [];
      edges = [];
      setState('whole');
      draw(performance.now());
    }

    function mend() {
      if (state !== 'broken') return;
      auto = true;
      holdTime = 0;
      setState('mending');
      if (reduced) {
        shards.forEach(function (sh) {
          sh.x = sh.y = sh.a = 0;
        });
        gild();
      } else go();
    }

    /* drawing */

    function lightAt() {
      // the light sits up and to the left, and leans toward the pointer
      let lx = origin.x + size * 0.36;
      let ly = origin.y + size * 0.3;
      if (pointer.on) {
        lx += (pointer.x - lx) * 0.25;
        ly += (pointer.y - ly) * 0.15;
      }
      return { x: lx, y: ly };
    }

    function draw(time) {
      const d = view.dpr;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.clearRect(0, 0, view.w, view.h);
      const L = lightAt();

      if (!shards.length || state === 'gilding') {
        // whole: shadow, vessel, light
        ctx.save();
        ctx.translate(origin.x, origin.y);
        const sr = size * 0.42;
        ctx.save();
        ctx.translate(size / 2, size * (0.5 + kind.footY));
        ctx.scale(1, 0.16);
        const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, sr);
        sh.addColorStop(0, 'rgba(0, 3, 18, 0.6)');
        sh.addColorStop(1, 'rgba(0, 3, 18, 0)');
        ctx.fillStyle = sh;
        ctx.fillRect(-sr, -sr, sr * 2, sr * 2);
        ctx.restore();
        ctx.drawImage(art.tex, 0, 0);
        ctx.save();
        ctx.clip(art.shape);
        ctx.globalCompositeOperation = 'lighter';
        K.spec(ctx, L.x - origin.x, L.y - origin.y + size * 0.1, size * 0.22, 0.75);
        ctx.restore();
        if (state === 'gilding') drawGild(time);
        ctx.restore();
        drawSparks();
        return;
      }

      ctx.save();
      ctx.translate(origin.x, origin.y);
      shards.forEach(function (s) {
        ctx.save();
        ctx.translate(s.c.x + s.x, s.c.y + s.y);
        ctx.rotate(s.a);
        ctx.translate(-s.c.x, -s.c.y);
        ctx.save();
        ctx.clip(s.path);
        ctx.drawImage(art.tex, 0, 0);
        ctx.restore();
        // the broken edge: a fine pale line of fired clay
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(205, 215, 240, 0.4)';
        ctx.stroke(s.path);
        ctx.restore();
      });
      ctx.restore();
    }

    function drawGild(time) {
      const front = gildT * gildMax * 1.05;
      const glow = gildT < 1 ? 1 : Math.max(0, 1 - (gildT - 1) / 1.2);
      const w = Math.max(0.7, size / 420);
      ctx.save();
      ctx.clip(art.shape);
      K.seams(ctx, edges, front, Math.min(1, glow + 0.2), w);
      // a glint running on the gold
      if (edges.length) {
        const line = edges[Math.floor(time / 400) % edges.length];
        const p = K.along(line, (time % 400) / 400);
        if (p) K.glint(ctx, p.x, p.y, 14 * w, 0.9 * glow);
      }
      ctx.restore();
    }

    function drawSparks() {
      if (!sparks.length) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      sparks.forEach(function (p) {
        K.glint(ctx, p.x, p.y, p.r * 3, p.life);
      });
      ctx.restore();
    }

    function emitSparks() {
      if (reduced) return;
      for (let i = 0; i < 46 && edges.length; i++) {
        const line = edges[Math.floor(Math.random() * edges.length)];
        const p = K.along(line, Math.random());
        sparks.push({ x: origin.x + p.x, y: origin.y + p.y, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 50, r: 1 + Math.random() * 1.8, life: 1 });
      }
    }

    /* loop */

    let sparked = false;
    const loop = K.loop(canvas, function (time) {
      const dt = Math.min(0.033, (time - (last || time)) / 1000);
      last = time;
      if (state === 'broken' || state === 'mending') step(dt);
      if (state === 'gilding') {
        gildT += dt / 1.6;
        if (!sparked && gildT > 0.7) {
          sparked = true;
          emitSparks();
        }
        if (gildT > 2.2) {
          sparked = false;
          finishGild();
        }
      }
      sparks.forEach(function (p) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy -= 10 * dt;
        p.life -= dt * 0.7;
      });
      sparks = sparks.filter(function (p) {
        return p.life > 0;
      });
      draw(time);
      const resting = state === 'broken' && shards.every(function (s) {
        return s.rest && Math.abs(s.vx) < 3 && Math.abs(s.va) < 0.05;
      });
      const idle = (state === 'whole' && !sparks.length && !pointer.on) || resting;
      if (idle) {
        last = 0;
        return false;
      }
      return true;
    });

    function go() {
      last = 0;
      loop.start();
    }

    /* input */

    function local(event) {
      const b = canvas.getBoundingClientRect();
      return { x: event.clientX - b.left, y: event.clientY - b.top };
    }

    canvas.addEventListener('pointerdown', function (event) {
      const p = local(event);
      if (state === 'whole') {
        if (!insideLocal(p.x - origin.x, p.y - origin.y)) return;
        shatter(p.x - origin.x, p.y - origin.y);
      } else if (o.tapToMend) {
        mend();
      } else if (state === 'broken' || state === 'mending') {
        holding = true;
        if (state === 'broken') holdTime = 0;
        setState('mending');
        try {
          canvas.setPointerCapture(event.pointerId);
        } catch (e) {
          // fine without capture
        }
        if (reduced) mend();
        else go();
      }
    });

    function release() {
      if (holding && !auto && state === 'mending') {
        holding = false;
        setState('broken');
        go();
      }
      holding = false;
    }
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);

    canvas.addEventListener('pointermove', function (event) {
      const p = local(event);
      pointer = { x: p.x, y: p.y, on: true };
      if (state === 'whole') {
        canvas.style.cursor = insideLocal(p.x - origin.x, p.y - origin.y) ? 'pointer' : '';
        if (!reduced) go();
      } else {
        canvas.style.cursor = 'grab';
      }
    });
    canvas.addEventListener('pointerleave', function () {
      pointer.on = false;
      if (!reduced) go();
    });

    function onResize() {
      layout();
      draw(performance.now());
    }
    window.addEventListener('resize', onResize);
    if (window.ResizeObserver && o.spot) new ResizeObserver(onResize).observe(o.spot);

    layout();
    setState('whole');
    if (o.start === 'broken') {
      // break it where it would have hit the floor, and let it come to rest
      const rand = K.rng(seed);
      shatter(size * (0.42 + rand() * 0.16), size * 0.2);
      if (!reduced) settleNow();
    }
    draw(performance.now());

    return {
      shatter: function () {
        shatter(size * (0.4 + Math.random() * 0.2), size * (0.05 + Math.random() * 0.2));
      },
      mend: mend,
      get state() {
        return state;
      },
      get mended() {
        return mended;
      },
      redraw: onResize
    };
  };

  window.Kintsugi = K;
})();
