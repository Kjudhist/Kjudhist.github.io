/* ==========================================================================
   紙 kami: paper, lit by one soft light.

   Shared by the gate and the 404:
   - Kami.light     the light follows the pointer (or drifts by itself until
                    the pointer moves); pages read it and redraw. It also sets
                    --lx / --ly (-1..1) on <html> for CSS shading.
   - Kami.shade     colour of a facet from its normal and the light.
   - Kami.fibres    a washi fibre texture, made once, for canvas patterns.
   - Kami.Sheet     a creased sheet: straight creases split it into flat
                    facets, each one shaded by where the light is. A corner
                    can be folded back (the white side shows).
   - [data-crumple] the 404's crumpled sheet: click to smooth it out.
   ========================================================================== */

(function () {
  'use strict';

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function hex(c) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function mix(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  function rgb(c, alpha) {
    const r = Math.round(c[0]);
    const g = Math.round(c[1]);
    const b = Math.round(c[2]);
    return alpha == null ? 'rgb(' + r + ',' + g + ',' + b + ')' : 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  /* ------------------------------------------------------------ light */

  const listeners = [];
  const light = {
    x: window.innerWidth * 0.3,
    y: window.innerHeight * 0.25,
    tx: window.innerWidth * 0.3,
    ty: window.innerHeight * 0.25,
    user: false,
    on: function (fn) {
      listeners.push(fn);
    }
  };
  let lightRun = false;
  let lightLast = 0;
  let drift = 0;

  function publish() {
    root.style.setProperty('--lx', ((light.x / window.innerWidth) * 2 - 1).toFixed(3));
    root.style.setProperty('--ly', ((light.y / window.innerHeight) * 2 - 1).toFixed(3));
    listeners.forEach(function (fn) {
      fn(light);
    });
  }

  function lightFrame(time) {
    const dt = Math.min(0.05, (time - (lightLast || time)) / 1000);
    lightLast = time;
    if (!light.user) {
      drift += dt * 0.25;
      light.tx = window.innerWidth * (0.5 + Math.cos(drift) * 0.32);
      light.ty = window.innerHeight * (0.42 + Math.sin(drift * 1.3) * 0.26);
    }
    const k = 1 - Math.exp(-dt * 7);
    light.x += (light.tx - light.x) * k;
    light.y += (light.ty - light.y) * k;
    publish();
    const settled = light.user && Math.abs(light.tx - light.x) < 0.5 && Math.abs(light.ty - light.y) < 0.5;
    if (settled || document.hidden) {
      lightRun = false;
      return;
    }
    window.requestAnimationFrame(lightFrame);
  }

  function wake() {
    if (lightRun || reduced) return;
    lightRun = true;
    lightLast = 0;
    window.requestAnimationFrame(lightFrame);
  }

  function startLight() {
    if (reduced) {
      publish();
      return;
    }
    window.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen' || event.buttons) {
        light.user = event.pointerType !== 'touch' || light.user;
        light.tx = event.clientX;
        light.ty = event.clientY;
        wake();
      }
    }, { passive: true });
    window.addEventListener('pointerdown', function (event) {
      light.tx = event.clientX;
      light.ty = event.clientY;
      wake();
    }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) wake();
    });
    wake();
  }

  /* ------------------------------------------------------------ shading */

  // n: unit normal [x,y,z], l: unit vector to the light. Returns 0..1.
  function lambert(n, l) {
    return clamp(n[0] * l[0] + n[1] * l[1] + n[2] * l[2], 0, 1);
  }

  function shade(n, from, lx, ly, lz, dark, lit) {
    const dx = lx - from[0];
    const dy = ly - from[1];
    const dz = lz - from[2];
    const d = Math.hypot(dx, dy, dz) || 1;
    const t = lambert(n, [dx / d, dy / d, dz / d]);
    return mix(dark, lit, Math.pow(t, 1.6));
  }

  /* ------------------------------------------------------------ washi */

  let fibreCanvas = null;
  function fibres(light) {
    if (fibreCanvas) return fibreCanvas;
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 256;
    const g = c.getContext('2d');
    // a fixed seed so the paper is the same paper every visit
    let seed = 7;
    function rnd() {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    }
    for (let i = 0; i < 260; i++) {
      const x = rnd() * 256;
      const y = rnd() * 256;
      const a = rnd() * Math.PI;
      const len = 6 + rnd() * 22;
      g.strokeStyle = (light === false ? 'rgba(0,0,0,' : 'rgba(255,255,255,') + (0.025 + rnd() * 0.05).toFixed(3) + ')';
      g.lineWidth = 0.6 + rnd() * 0.6;
      g.beginPath();
      g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a + 0.6) * len * 0.5, y + Math.sin(a + 0.6) * len * 0.5, x + Math.cos(a) * len, y + Math.sin(a) * len);
      g.stroke();
    }
    for (let i = 0; i < 900; i++) {
      g.fillStyle = 'rgba(255,255,255,' + (rnd() * 0.035).toFixed(3) + ')';
      g.fillRect(rnd() * 256, rnd() * 256, 1, 1);
    }
    fibreCanvas = c;
    return c;
  }

  /* ------------------------------------------------------------ geometry */

  // keep the part of a convex polygon where side(p) * sign >= 0
  function clipHalf(poly, nx, ny, c, sign) {
    const out = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i];
      const b = poly[(i + 1) % poly.length];
      const da = (nx * a[0] + ny * a[1] - c) * sign;
      const db = (nx * b[0] + ny * b[1] - c) * sign;
      if (da >= 0) out.push(a);
      if ((da >= 0) !== (db >= 0)) {
        const t = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  }

  function centroid(poly) {
    let x = 0;
    let y = 0;
    poly.forEach(function (p) {
      x += p[0];
      y += p[1];
    });
    return [x / poly.length, y / poly.length];
  }

  function pathPoly(ctx, poly) {
    ctx.beginPath();
    poly.forEach(function (p, i) {
      if (i) ctx.lineTo(p[0], p[1]);
      else ctx.moveTo(p[0], p[1]);
    });
    ctx.closePath();
  }

  /* ------------------------------------------------------------ the sheet

     creases: [{x, y, angle, a}] with x, y as fractions of the sheet and a the
     fold's strength (+ valley, - mountain). The sheet's height is
     z = sum a * |distance to crease|, so every facet between creases is flat
     and its normal is the same everywhere on it. */

  function Sheet(canvas, options) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.creases = options.creases;
    this.dark = hex(options.dark || '#071036');
    this.lit = hex(options.lit || '#3552b8');
    this.back = hex(options.back || '#f8f7f2');
    this.backDark = hex(options.backDark || '#b9bfd4');
    this.table = options.table || '#040a24';
    this.margin = options.margin || 0;
    this.corner = null; // the drag point for the folded corner, or null
    this.resize();
  }

  Sheet.prototype.resize = function () {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const m = typeof this.margin === 'function' ? this.margin(w, h) : this.margin;
    this.m = m;
    this.rect = [[m, m], [w - m, m], [w - m, h - m], [m, h - m]];
    // split the sheet along every crease
    let polys = [this.rect.map(function (p) {
      return p.slice();
    })];
    const lines = this.creases.map(function (c) {
      const nx = -Math.sin(c.angle);
      const ny = Math.cos(c.angle);
      const px = m + (w - 2 * m) * c.x;
      const py = m + (h - 2 * m) * c.y;
      return { nx: nx, ny: ny, c: nx * px + ny * py, a: c.a };
    });
    lines.forEach(function (ln) {
      const next = [];
      polys.forEach(function (poly) {
        const a = clipHalf(poly, ln.nx, ln.ny, ln.c, 1);
        const b = clipHalf(poly, ln.nx, ln.ny, ln.c, -1);
        if (a.length > 2) next.push(a);
        if (b.length > 2) next.push(b);
      });
      polys = next;
    });
    this.lines = lines;
    this.facets = polys.map(function (poly) {
      const cen = centroid(poly);
      let gx = 0;
      let gy = 0;
      let z = 0;
      lines.forEach(function (ln) {
        const d = ln.nx * cen[0] + ln.ny * cen[1] - ln.c;
        const s = d >= 0 ? 1 : -1;
        gx += ln.a * s * ln.nx;
        gy += ln.a * s * ln.ny;
        z += ln.a * Math.abs(d);
      });
      const len = Math.hypot(gx, gy, 1);
      return { poly: poly, c: [cen[0], cen[1], z], n: [-gx / len, -gy / len, 1 / len] };
    });
    this.pattern = this.ctx.createPattern(fibres(), 'repeat');
  };

  // the corner fold: everything past the perpendicular bisector of the
  // corner and the drag point is turned over onto the sheet
  Sheet.prototype.fold = function () {
    if (!this.corner) return null;
    const cx = this.w - this.m;
    const cy = this.h - this.m;
    const px = this.corner[0];
    const py = this.corner[1];
    const dx = cx - px;
    const dy = cy - py;
    const d = Math.hypot(dx, dy);
    if (d < 2) return null;
    const nx = dx / d;
    const ny = dy / d;
    const c = nx * (cx + px) / 2 + ny * (cy + py) / 2;
    return { nx: nx, ny: ny, c: c };
  };

  Sheet.prototype.draw = function (lx, ly) {
    const ctx = this.ctx;
    const w = this.w;
    const h = this.h;
    const lz = Math.max(w, h) * 0.55;
    const self = this;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = this.table;
    ctx.fillRect(0, 0, w, h);

    const f = this.fold();
    const kept = f ? clipHalf(this.rect, f.nx, f.ny, f.c, -1) : this.rect;
    const flap = f ? clipHalf(this.rect, f.nx, f.ny, f.c, 1) : null;

    // the sheet's shadow on the table
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = rgb(this.dark);
    pathPoly(ctx, kept);
    ctx.fill();
    ctx.restore();

    ctx.save();
    pathPoly(ctx, kept);
    ctx.clip();
    this.facets.forEach(function (fc) {
      const col = shade(fc.n, fc.c, lx, ly, lz, self.dark, self.lit);
      // a soft gradient across the facet, brighter on the side nearer the light
      const ang = Math.atan2(ly - fc.c[1], lx - fc.c[0]);
      const r = 260;
      const g = ctx.createLinearGradient(fc.c[0] - Math.cos(ang) * r, fc.c[1] - Math.sin(ang) * r, fc.c[0] + Math.cos(ang) * r, fc.c[1] + Math.sin(ang) * r);
      g.addColorStop(0, rgb(mix(col, self.dark, 0.18)));
      g.addColorStop(1, rgb(mix(col, self.lit, 0.1)));
      ctx.fillStyle = g;
      pathPoly(ctx, fc.poly);
      ctx.fill();
    });
    // a broad glow where the light falls
    const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.max(w, h) * 0.5);
    glow.addColorStop(0, 'rgba(120,150,255,0.13)');
    glow.addColorStop(1, 'rgba(120,150,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
    // creases: a fine dark line with a lit edge beside it
    this.facets.forEach(function (fc) {
      pathPoly(ctx, fc.poly);
      ctx.strokeStyle = 'rgba(0,0,10,0.28)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = this.pattern;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    ctx.restore();

    if (flap && flap.length > 2) {
      // reflect the turned part across the fold line
      const mirrored = flap.map(function (p) {
        const d = f.nx * p[0] + f.ny * p[1] - f.c;
        return [p[0] - 2 * d * f.nx, p[1] - 2 * d * f.ny];
      });
      // furthest point of the flap from the fold, for the gradient
      let far = mirrored[0];
      let farD = 0;
      mirrored.forEach(function (p) {
        const d = Math.abs(f.nx * p[0] + f.ny * p[1] - f.c);
        if (d > farD) {
          farD = d;
          far = p;
        }
      });
      const onLine = [far[0] + farD * f.nx, far[1] + farD * f.ny];
      // the flap lifts a little: its shadow falls away from the fold
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,12,0.5)';
      ctx.shadowBlur = 24;
      ctx.shadowOffsetX = -f.nx * 8;
      ctx.shadowOffsetY = -f.ny * 8 + 4;
      ctx.fillStyle = rgb(this.backDark);
      pathPoly(ctx, mirrored);
      ctx.fill();
      ctx.restore();
      // the white back of the paper, curling: dimmer at the crease, catching
      // the light toward its tip
      const toward = clamp(((lx - onLine[0]) * -f.nx + (ly - onLine[1]) * -f.ny) / Math.max(w, h) + 0.5, 0, 1);
      const g = ctx.createLinearGradient(onLine[0], onLine[1], far[0], far[1]);
      g.addColorStop(0, rgb(mix(this.backDark, this.back, 0.25)));
      g.addColorStop(0.35, rgb(mix(this.backDark, this.back, 0.75 + toward * 0.2)));
      g.addColorStop(1, rgb(mix(this.backDark, this.back, 0.6 + toward * 0.4)));
      ctx.fillStyle = g;
      pathPoly(ctx, mirrored);
      ctx.fill();
      // the crease itself
      pathPoly(ctx, mirrored);
      ctx.strokeStyle = 'rgba(12,27,77,0.18)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  /* ------------------------------------------------------------ 404: crumple */

  function initCrumple() {
    const box = document.querySelector('[data-crumple]');
    if (!box) return;
    const canvas = box.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const N = 9; // vertices per side
    let seed = 11;
    function rnd() {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    }
    const verts = [];
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const edge = i === 0 || j === 0 || i === N - 1 || j === N - 1;
        verts.push({
          u: i / (N - 1),
          v: j / (N - 1),
          ox: (rnd() - 0.5) * (edge ? 0.12 : 0.2),
          oy: (rnd() - 0.5) * (edge ? 0.12 : 0.2),
          z: (rnd() - 0.5) * 2,
          pull: 0.55 + rnd() * 0.3
        });
      }
    }
    const tris = [];
    for (let j = 0; j < N - 1; j++) {
      for (let i = 0; i < N - 1; i++) {
        const a = j * N + i;
        const b = a + 1;
        const c = a + N;
        const d = c + 1;
        if ((i + j) % 2) {
          tris.push([a, b, d], [a, d, c]);
        } else {
          tris.push([a, b, c], [b, d, c]);
        }
      }
    }
    let crumple = 1;
    let target = 1;
    let w = 0;
    let h = 0;
    let running = false;
    let last = 0;
    const dark = hex('#9aa6cc');
    const lit = hex('#ffffff');
    const ink = '#0c1b4d';

    function size() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function point(vx, c) {
      const s = Math.min(w, h) * 0.86;
      const x0 = (w - s) / 2;
      const y0 = (h - s) / 2;
      // crumpled, every point is drawn toward the middle and scattered
      const pull = 1 - c * (1 - vx.pull);
      const u = 0.5 + (vx.u - 0.5) * pull + vx.ox * c;
      const v = 0.5 + (vx.v - 0.5) * pull + vx.oy * c;
      return [x0 + u * s, y0 + v * s, vx.z * c * s * 0.12];
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const pts = verts.map(function (vx) {
        return point(vx, crumple);
      });
      const lx = (light.x - canvas.getBoundingClientRect().left);
      const ly = (light.y - canvas.getBoundingClientRect().top);
      const lz = Math.max(w, h) * 0.9;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,10,0.5)';
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 14;
      ctx.fillStyle = '#c9cfe2';
      ctx.beginPath();
      tris.forEach(function (t) {
        ctx.moveTo(pts[t[0]][0], pts[t[0]][1]);
        ctx.lineTo(pts[t[1]][0], pts[t[1]][1]);
        ctx.lineTo(pts[t[2]][0], pts[t[2]][1]);
        ctx.closePath();
      });
      ctx.fill();
      ctx.restore();
      tris.forEach(function (t) {
        const a = pts[t[0]];
        const b = pts[t[1]];
        const c = pts[t[2]];
        const ux = b[0] - a[0];
        const uy = b[1] - a[1];
        const uz = b[2] - a[2];
        const vx = c[0] - a[0];
        const vy = c[1] - a[1];
        const vz = c[2] - a[2];
        let nx = uy * vz - uz * vy;
        let ny = uz * vx - ux * vz;
        let nz = ux * vy - uy * vx;
        const len = Math.hypot(nx, ny, nz) || 1;
        nx /= len;
        ny /= len;
        nz /= len;
        if (nz < 0) {
          nx = -nx;
          ny = -ny;
          nz = -nz;
        }
        const cen = [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3];
        const col = shade([nx, ny, nz], cen, lx, ly, lz, dark, lit);
        ctx.fillStyle = rgb(col);
        ctx.strokeStyle = rgb(col);
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.lineTo(c[0], c[1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });
      // the print on the paper: 404 and a faint grid, crumpled with it
      ctx.save();
      const s = Math.min(w, h) * 0.86;
      ctx.globalAlpha = 1 - crumple * 0.55;
      // draw each grid line through the crumpled points, so it creases too
      ctx.strokeStyle = 'rgba(12,27,77,0.1)';
      ctx.lineWidth = 1;
      for (let k = 1; k < N - 1; k++) {
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const p = pts[k * N + i];
          if (i) ctx.lineTo(p[0], p[1]);
          else ctx.moveTo(p[0], p[1]);
        }
        ctx.stroke();
        ctx.beginPath();
        for (let j = 0; j < N; j++) {
          const p = pts[j * N + k];
          if (j) ctx.lineTo(p[0], p[1]);
          else ctx.moveTo(p[0], p[1]);
        }
        ctx.stroke();
      }
      const mid = pts[Math.floor(N * N / 2)];
      ctx.translate(mid[0], mid[1]);
      ctx.rotate(crumple * -0.35);
      ctx.scale(1 - crumple * 0.45, 1 - crumple * 0.3);
      ctx.fillStyle = ink;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 ' + Math.round(s * 0.3) + 'px "Shippori Mincho B1", serif';
      ctx.fillText('404', 0, -s * 0.02);
      ctx.font = '600 ' + Math.round(s * 0.06) + 'px "Shippori Mincho B1", serif';
      ctx.globalAlpha *= 0.7;
      ctx.fillText('迷子の紙', 0, s * 0.2);
      ctx.restore();
    }

    function frame(time) {
      const dt = Math.min(0.05, (time - (last || time)) / 1000);
      last = time;
      crumple += (target - crumple) * (1 - Math.exp(-dt * 4.5));
      if (Math.abs(target - crumple) < 0.002) crumple = target;
      draw();
      if (crumple !== target && !document.hidden) {
        window.requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }

    function kick() {
      if (reduced) {
        crumple = target;
        draw();
        return;
      }
      if (running) return;
      running = true;
      last = 0;
      window.requestAnimationFrame(frame);
    }

    function toggle() {
      target = target > 0.5 ? 0 : 1;
      box.setAttribute('aria-pressed', String(target === 0));
      box.classList.toggle('is-smooth', target === 0);
      kick();
    }

    box.addEventListener('click', toggle);
    size();
    draw();
    light.on(draw);
    window.addEventListener('resize', function () {
      size();
      draw();
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  }

  window.Kami = {
    reduced: reduced,
    light: light,
    hex: hex,
    mix: mix,
    rgb: rgb,
    shade: shade,
    fibres: fibres,
    clipHalf: clipHalf,
    pathPoly: pathPoly,
    Sheet: Sheet
  };

  startLight();
  initCrumple();
})();
