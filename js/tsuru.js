/* ==========================================================================
   鶴 tsuru: a flock of paper cranes over the atelier.

   Flock:  boids (keep apart, fly together, keep close) on a fixed canvas
           behind the page. They drift toward the pointer from afar and
           shy away from it up close.
   Fold:   click anywhere that isn't a link or control and a square of
           paper folds into a crane where you clicked (in half, in half
           again, then the crane), and it joins the flock. The count of
           cranes you have folded sits under the title.
   Unfold: tap a crane and it opens out into its flat square, printed with
           waves (seigaiha), then folds itself up again and flies on.
   Reduced motion: a still flock; a click places a crane, no animation.
   Pauses while the tab is hidden.
   ========================================================================== */

(function () {
  'use strict';

  const canvas = document.querySelector('[data-flock]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bar = document.querySelector('[data-flock-bar]');
  const counter = document.querySelector('[data-crane-count]');
  const TAU = Math.PI * 2;
  const MAX = 46;

  let w = 0;
  let h = 0;
  let dpr = 1;
  const cranes = [];
  const pointer = { x: -9999, y: -9999, on: false };
  let folded = 0;
  let running = false;
  let last = 0;

  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  function size() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeCrane(x, y, vx, vy) {
    return {
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      z: rand(0.55, 1.15),        // depth: small and faint is far away
      phase: rand(0, TAU),
      mode: 'fly',                // fly | fold | flat
      t: 0,
      dir: vx < 0 ? -1 : 1
    };
  }

  /* ------------------------------------------------------------ drawing */

  // a crane seen from the side, beak to the left, in a 100-unit box
  const BODY = [
    { c: '#ffffff', p: [-44, -2, -18, 4, -10, 14] },        // neck
    { c: '#c3cbe6', p: [-44, -2, -50, 6, -40, 2] },         // head
    { c: '#e6eaf6', p: [38, -30, 14, 4, 22, 10] },          // tail
    { c: '#ffffff', p: [-18, 4, 22, 10, 0, 20] },           // belly
    { c: '#c9d1ea', p: [-18, 4, 14, 4, 22, 10] }            // back
  ];

  function poly(points, sx, sy) {
    ctx.beginPath();
    for (let i = 0; i < points.length; i += 2) {
      const x = points[i] * sx;
      const y = points[i + 1] * sy;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
  }

  function drawCrane(c, scale, alpha) {
    const s = c.z * 0.72 * scale;
    const flap = Math.sin(c.phase);
    const tilt = Math.max(-0.45, Math.min(0.45, Math.atan2(c.vy, Math.abs(c.vx) + 1) * 0.8));
    ctx.save();
    ctx.globalAlpha = alpha * (0.45 + c.z * 0.5);
    ctx.translate(c.x, c.y);
    ctx.rotate(tilt * c.dir);
    ctx.scale(-c.dir * s, s); // the drawing faces left; face the way it flies
    // back wing, a beat behind
    const fb = Math.sin(c.phase - 0.5);
    ctx.fillStyle = fb > 0 ? '#a7b3d9' : '#8796c8';
    poly([-8, 4, 14, 4, 2, 4 - 56 * fb], 1, 1);
    ctx.fill();
    BODY.forEach(function (part) {
      ctx.fillStyle = part.c;
      poly(part.p, 1, 1);
      ctx.fill();
    });
    // front wing in two facets; it darkens as it beats down past the body
    const wy = 6 - 56 * flap;
    ctx.fillStyle = flap > 0 ? '#ffffff' : '#b9c3e3';
    poly([-14, 6, 10, 6, -10, wy], 1, 1);
    ctx.fill();
    ctx.fillStyle = flap > 0 ? '#dfe4f4' : '#a3afd8';
    poly([-14, 6, -2, 6, -10, wy], 1, 1);
    ctx.fill();
    ctx.restore();
  }

  // seigaiha: overlapping rings of waves, printed on the inside of the paper
  function waves(size) {
    const r = size / 4;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-size / 2, -size / 2, size, size);
    ctx.clip();
    ctx.fillStyle = '#f8f7f2';
    ctx.fillRect(-size / 2, -size / 2, size, size);
    for (let row = 0; row < 7; row++) {
      const y = -size / 2 + row * r * 0.5;
      const off = row % 2 ? r : 0;
      for (let x = -size / 2 - r + off; x < size / 2 + r * 2; x += r * 2) {
        for (let k = 3; k >= 1; k--) {
          ctx.beginPath();
          ctx.arc(x, y + r * 0.5, r * k / 3, Math.PI, 0);
          ctx.fillStyle = k % 2 ? '#1a2f78' : '#f8f7f2';
          ctx.fill();
        }
      }
    }
    ctx.restore();
    // its creases, still showing
    ctx.strokeStyle = 'rgba(12,27,77,0.35)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(-size / 2, -size / 2);
    ctx.lineTo(size / 2, size / 2);
    ctx.moveTo(size / 2, -size / 2);
    ctx.lineTo(-size / 2, size / 2);
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(0, size / 2);
    ctx.moveTo(-size / 2, 0);
    ctx.lineTo(size / 2, 0);
    ctx.stroke();
  }

  function ease(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  // the folding sequence, t from 0 to 1
  function drawFolding(c) {
    const t = c.t;
    const S = 54 * c.z;
    ctx.save();
    ctx.translate(c.x, c.y);
    if (t < 0.32) {
      // a square on its point; the top corner folds down to the bottom
      const k = ease(t / 0.32);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = '#e3e8f6';
      ctx.fillRect(-S / 2, -S / 2, S, S);
      ctx.rotate(-Math.PI / 4);
      const d = S / Math.SQRT2;
      ctx.fillStyle = k < 0.5 ? '#ffffff' : '#b8c3e6';
      ctx.beginPath();
      ctx.moveTo(-d, 0);
      ctx.lineTo(d, 0);
      ctx.lineTo(0, -d * (1 - 2 * k));
      ctx.closePath();
      ctx.fill();
    } else if (t < 0.6) {
      // a triangle; its left half folds over onto the right
      const k = ease((t - 0.32) / 0.28);
      const d = S / Math.SQRT2;
      ctx.fillStyle = '#d7deef';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(d, 0);
      ctx.lineTo(0, d);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = k < 0.5 ? '#ffffff' : '#c3cce9';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-d * (1 - 2 * k), 0);
      ctx.lineTo(0, d);
      ctx.closePath();
      ctx.fill();
    } else {
      // the small triangle shrinks into a crane that opens its wings
      const k = ease((t - 0.6) / 0.4);
      const d = S / Math.SQRT2;
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(d * (1 - k), 0);
      ctx.lineTo(0, d * (1 - k));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      drawCrane(c, 0.4 + k * 0.6, k);
      return;
    }
    ctx.restore();
  }

  // a crane opening flat and folding back, t from 0 to 1
  function drawFlat(c) {
    const t = c.t;
    const open = t < 0.25 ? ease(t / 0.25) : t > 0.8 ? 1 - ease((t - 0.8) / 0.2) : 1;
    if (open < 1) drawCrane(c, 1 - open * 0.6, 1 - open);
    if (open <= 0) return;
    const S = 96 * Math.max(0.8, c.z);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate((1 - open) * 0.8 - 0.08);
    ctx.scale(open, open);
    ctx.shadowColor = 'rgba(0,0,10,0.45)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = '#f8f7f2';
    ctx.fillRect(-S / 2, -S / 2, S, S);
    ctx.shadowColor = 'transparent';
    waves(S);
    ctx.restore();
  }

  /* ------------------------------------------------------------ the flock */

  function steer(c, dt) {
    let sx = 0;
    let sy = 0;
    let ax = 0;
    let ay = 0;
    let cx = 0;
    let cy = 0;
    let n = 0;
    for (let i = 0; i < cranes.length; i++) {
      const o = cranes[i];
      if (o === c || o.mode !== 'fly') continue;
      const dx = o.x - c.x;
      const dy = o.y - c.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < 140 * 140) {
        n++;
        ax += o.vx;
        ay += o.vy;
        cx += o.x;
        cy += o.y;
        if (d2 < 64 * 64) {
          const d = Math.sqrt(d2) || 1;
          sx -= dx / d * (64 - d);
          sy -= dy / d * (64 - d);
        }
      }
    }
    let fx = sx * 3.2;
    let fy = sy * 3.2;
    if (n) {
      fx += (ax / n - c.vx) * 0.9 + (cx / n - c.x) * 0.35;
      fy += (ay / n - c.vy) * 0.9 + (cy / n - c.y) * 0.35;
    }
    // the pointer: drawn in from afar, shied from up close
    if (pointer.on) {
      const dx = pointer.x - c.x;
      const dy = pointer.y - c.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < 120) {
        fx -= dx / d * (120 - d) * 9;
        fy -= dy / d * (120 - d) * 9;
      } else if (d < 620) {
        fx += dx / d * 26;
        fy += dy / d * 26;
      }
    }
    // keep inside the window, turning softly at the edges
    const m = 70;
    if (c.x < m) fx += (m - c.x) * 2.4;
    if (c.x > w - m) fx -= (c.x - (w - m)) * 2.4;
    if (c.y < m) fy += (m - c.y) * 2.4;
    if (c.y > h - m) fy -= (c.y - (h - m)) * 2.4;
    // a little wander
    fx += Math.cos(c.phase * 0.13) * 8;
    fy += Math.sin(c.phase * 0.11) * 6;

    c.vx += fx * dt;
    c.vy += fy * dt;
    const sp = Math.hypot(c.vx, c.vy) || 1;
    const lo = 38 * c.z;
    const hi = 120 * c.z;
    const k = sp < lo ? lo / sp : sp > hi ? hi / sp : 1;
    c.vx *= k;
    c.vy *= k;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    // turning round takes a moment: only flip when clearly going the other way
    if (c.vx < -8) c.dir = -1;
    else if (c.vx > 8) c.dir = 1;
    // beat faster climbing, glide a little when diving
    c.phase += dt * (c.vy < -10 ? 11 : c.vy > 30 ? 4 : 8);
  }

  function frame(time) {
    const dt = Math.min(0.05, (time - (last || time)) / 1000);
    last = time;
    ctx.clearRect(0, 0, w, h);
    cranes.sort(function (a, b) {
      return a.z - b.z;
    });
    cranes.forEach(function (c) {
      if (c.mode === 'fly') {
        steer(c, dt);
        drawCrane(c, 1, 1);
      } else if (c.mode === 'fold') {
        c.t += dt / 1.2;
        drawFolding(c);
        if (c.t >= 1) {
          c.mode = 'fly';
          c.vy = -70;
          c.vx = rand(-40, 40);
        }
      } else {
        c.t += dt / 2.6;
        drawFlat(c);
        if (c.t >= 1) {
          c.mode = 'fly';
          c.vy = -50;
        }
      }
    });
    if (document.hidden) {
      running = false;
      return;
    }
    window.requestAnimationFrame(frame);
  }

  function start() {
    if (running || reduced) return;
    running = true;
    last = 0;
    window.requestAnimationFrame(frame);
  }

  function drawStill() {
    ctx.clearRect(0, 0, w, h);
    cranes.forEach(function (c) {
      c.phase = 1.2;
      drawCrane(c, 1, 1);
    });
  }

  /* ------------------------------------------------------------ clicks */

  function interactive(target) {
    return target.closest('a, button, input, select, textarea, label, summary, dialog, [role="button"], [role="link"], [tabindex], .lang, .strip');
  }

  document.addEventListener('click', function (event) {
    if (interactive(event.target)) return;
    if (window.getSelection && String(window.getSelection()).length) return;
    const x = event.clientX;
    const y = event.clientY;
    // a crane under the pointer opens; otherwise fold a new one
    let hit = null;
    let best = Infinity;
    cranes.forEach(function (c) {
      if (c.mode !== 'fly') return;
      const d = Math.hypot(c.x - x, c.y - y);
      if (d < 34 * c.z + 8 && d < best) {
        best = d;
        hit = c;
      }
    });
    if (hit && !reduced) {
      hit.mode = 'flat';
      hit.t = 0;
      hit.vx *= 0.2;
      hit.vy *= 0.2;
      return;
    }
    if (cranes.length >= MAX) {
      // the oldest flies on to make room
      cranes.splice(cranes.indexOf(cranes.reduce(function (a, b) {
        return a.born < b.born ? a : b;
      })), 1);
    }
    const c = makeCrane(x, y, 0, 0);
    c.z = rand(0.85, 1.15);
    c.born = window.performance.now();
    c.mode = reduced ? 'fly' : 'fold';
    c.t = 0;
    cranes.push(c);
    folded += 1;
    if (counter) counter.textContent = String(folded);
    if (reduced) drawStill();
  });

  window.addEventListener('pointermove', function (event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.on = true;
  }, { passive: true });
  document.addEventListener('pointerleave', function () {
    pointer.on = false;
  });
  window.addEventListener('pointerup', function (event) {
    if (event.pointerType === 'touch') pointer.on = false;
  });

  /* ------------------------------------------------------------ start */

  size();
  const n = w < 640 ? 9 : 18;
  for (let i = 0; i < n; i++) {
    const c = makeCrane(rand(w * 0.15, w * 0.85), rand(h * 0.12, h * 0.7), rand(-60, 60), rand(-20, 20));
    c.born = i;
    cranes.push(c);
  }
  if (bar) bar.hidden = false;
  window.addEventListener('resize', function () {
    size();
    if (reduced) drawStill();
  });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) start();
  });
  if (reduced) drawStill();
  else start();
})();
