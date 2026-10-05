/* ==========================================================================
   The atelier.
   Arrival bloom, the night garden (parallax, wind in the willow, fireflies
   and drifting leaves), the emaki, the viewer, and the noren.
   ========================================================================== */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  // Small seeded random, so the ink river is drawn the same way every visit.
  function seeded(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      let n = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n;
      return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------------------------
     Arrival
     ------------------------------------------------------------------------ */

  let introDone = false;

  function playBloom() {
    const bloom = document.querySelector('[data-bloom]');
    window.setTimeout(function () {
      introDone = true;
    }, 2600);
    if (!bloom) return;
    const done = function () {
      bloom.classList.add('is-done');
    };
    const grow = bloom.querySelector('animate');
    if (reduced || !grow || typeof grow.beginElement !== 'function') {
      done();
      return;
    }
    // one beat, so the garden is painted underneath before the ink opens
    window.setTimeout(function () {
      grow.beginElement();
      window.setTimeout(done, 2500);
    }, 120);
  }

  /* ------------------------------------------------------------------------
     Tagline, one character at a time
     ------------------------------------------------------------------------ */

  const CJK = /[぀-ヿ㐀-鿿]/;
  const CLOSERS = /[、。，．！？」』）,.!?]/;

  // Japanese has no spaces, so each character is its own unit,
  // with closing punctuation kept on the character before it.
  function groupCjk(text) {
    const out = [];
    Array.from(text).forEach(function (ch) {
      if (CLOSERS.test(ch) && out.length) out[out.length - 1] += ch;
      else out.push(ch);
    });
    return out;
  }

  function splitTagline(firstTime) {
    const source = document.querySelector('[data-split-source]');
    const target = document.querySelector('[data-split-target]');
    if (!source || !target) return;
    const text = source.textContent.trim();
    const parts = CJK.test(text) ? groupCjk(text) : text.split(/(\s+)/).filter(Boolean);
    let i = 0;
    target.textContent = '';
    parts.forEach(function (part) {
      if (/^\s+$/.test(part)) {
        target.append(' ');
        return;
      }
      const word = document.createElement('span');
      word.className = 'w';
      Array.from(part).forEach(function (ch) {
        const span = document.createElement('span');
        span.className = 'ch';
        span.textContent = ch;
        span.style.setProperty('--i', i++);
        word.append(span);
      });
      target.append(word);
    });
    target.style.setProperty('--base', firstTime ? '1.9s' : '0s');
    // the whole line lands in about a second, however long it is
    target.style.setProperty('--step', Math.min(45, 1100 / Math.max(1, i)).toFixed(1) + 'ms');
    source.parentElement.classList.add('is-split');
  }

  /* ------------------------------------------------------------------------
     Willow leaves. The HTML ships each strand with a dashed stroke as a
     stand-in; this swaps it for slender leaves angled down the strand.
     ------------------------------------------------------------------------ */

  function cubicAt(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return [
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]
    ];
  }

  function cubicTangent(p0, p1, p2, p3, t) {
    const u = 1 - t;
    const x = 3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]);
    const y = 3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]);
    const len = Math.hypot(x, y) || 1;
    return [x / len, y / len];
  }

  function leafWillow(svg) {
    if (!svg) return;
    const fmt = function (p) {
      return p[0].toFixed(1) + ' ' + p[1].toFixed(1);
    };
    svg.querySelectorAll('.willow__strand').forEach(function (strand, index) {
      const paths = strand.querySelectorAll('path');
      const n = paths.length > 1 ? (paths[0].getAttribute('d').match(/-?\d*\.?\d+/g) || []).map(Number) : [];
      if (n.length < 8) return;
      const p0 = [n[0], n[1]];
      const p1 = [n[2], n[3]];
      const p2 = [n[4], n[5]];
      const p3 = [n[6], n[7]];
      const rand = seeded(index + 7);
      const count = Math.round((Number(strand.dataset.len) || 400) / 12);
      let d = '';
      for (let i = 0; i < count; i++) {
        const t = 0.05 + (0.95 * (i + rand() * 0.6)) / count;
        const at = cubicAt(p0, p1, p2, p3, t);
        const tan = cubicTangent(p0, p1, p2, p3, t);
        const angle = (i % 2 ? 1 : -1) * (0.16 + rand() * 0.24);
        const dir = [tan[0] * Math.cos(angle) - tan[1] * Math.sin(angle), tan[0] * Math.sin(angle) + tan[1] * Math.cos(angle)];
        const length = (11 + rand() * 7) * (1 - t * 0.3);
        const width = length * (0.15 + rand() * 0.05);
        const tip = [at[0] + dir[0] * length, at[1] + dir[1] * length];
        const mid = [at[0] + dir[0] * length * 0.5, at[1] + dir[1] * length * 0.5];
        const c1 = [mid[0] - dir[1] * width, mid[1] + dir[0] * width];
        const c2 = [mid[0] + dir[1] * width, mid[1] - dir[0] * width];
        d += 'M' + fmt(at) + 'Q' + fmt(c1) + ' ' + fmt(tip) + 'Q' + fmt(c2) + ' ' + fmt(at) + 'Z';
      }
      const leaves = paths[1];
      leaves.setAttribute('d', d);
      leaves.removeAttribute('stroke-dasharray');
      leaves.setAttribute('stroke', 'none');
      leaves.setAttribute('fill', 'currentColor');
    });
  }

  /* ------------------------------------------------------------------------
     Wind in the willow: strands swing away from a passing cursor
     ------------------------------------------------------------------------ */

  function createWind(svg) {
    const strands = Array.from(svg.querySelectorAll('.willow__strand')).map(function (g) {
      return {
        g: g,
        x: Number(g.dataset.x),
        y: Number(g.dataset.y),
        dx: Number(g.dataset.dx),
        len: Number(g.dataset.len),
        a: 0,
        v: 0
      };
    });
    let active = false;

    function push(clientX, clientY, vx) {
      const ctm = svg.getScreenCTM();
      if (!ctm || !vx) return;
      const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
      const unitsPerPx = 1 / ctm.a;
      const reach = 64;
      strands.forEach(function (s) {
        if (p.y < s.y || p.y > s.y + s.len) return;
        const along = (p.y - s.y) / s.len;
        const sx = s.x + s.dx * Math.pow(along, 1.3);
        const dist = Math.abs(p.x - sx);
        if (dist > reach) return;
        // rotating a hanging strand by a negative angle moves its tip right
        s.v -= vx * unitsPerPx * 0.012 * (1 - dist / reach) * (0.4 + along);
        active = true;
      });
    }

    function step() {
      if (!active) return;
      let energy = 0;
      strands.forEach(function (s) {
        s.v += -0.02 * s.a - 0.07 * s.v;
        s.a = clamp(s.a + s.v, -9, 9);
        energy += Math.abs(s.a) + Math.abs(s.v);
        s.g.setAttribute('transform', 'rotate(' + s.a.toFixed(3) + ' ' + s.x + ' ' + s.y + ')');
      });
      if (energy < 0.02) {
        active = false;
        strands.forEach(function (s) {
          s.a = 0;
          s.v = 0;
          s.g.removeAttribute('transform');
        });
      }
    }

    return { push: push, step: step };
  }

  /* ------------------------------------------------------------------------
     Fireflies, and willow leaves drifting down
     ------------------------------------------------------------------------ */

  function makeGlow() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(255, 249, 220, 1)');
    grad.addColorStop(0.16, 'rgba(242, 228, 172, 0.9)');
    grad.addColorStop(0.42, 'rgba(214, 198, 130, 0.22)');
    grad.addColorStop(1, 'rgba(214, 198, 130, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    return c;
  }

  // willow green, silvered by the moon
  const LEAF_COLOURS = ['rgb(168, 180, 152)', 'rgb(150, 166, 142)', 'rgb(186, 194, 166)', 'rgb(136, 152, 136)'];

  function createSprites(canvas) {
    const ctx = canvas.getContext('2d');
    const small = window.innerWidth < 640;
    const flyCount = small ? 12 : 22;
    const fallCount = small ? 6 : 10;
    const glow = makeGlow();
    const rand = Math.random;
    const flies = [];
    const falls = [];
    let w = 0;
    let h = 0;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function newFly() {
      return {
        x: rand() * w,
        y: h * (0.3 + rand() * 0.6),
        vx: 0,
        vy: 0,
        heading: rand() * Math.PI * 2,
        speed: 10 + rand() * 18,
        phase: rand() * 10,
        blink: 0.5 + rand() * 1.1,
        size: 16 + rand() * 18,
        orbit: 24 + rand() * 64,
        angle: rand() * Math.PI * 2
      };
    }

    function newFall(fromTop) {
      return {
        x: rand() * (w + 120) - 60,
        y: fromTop ? -20 - rand() * h * 0.25 : rand() * h,
        phase: rand() * 10,
        rot: rand() * Math.PI * 2,
        alpha: 0.45 + rand() * 0.3,
        size: 6 + rand() * 5,
        vy: 18 + rand() * 18,
        sway: 18 + rand() * 14,
        swayRate: 0.7 + rand() * 0.8,
        drift: 10 + rand() * 12,
        spin: (rand() - 0.5) * 2.6,
        colour: LEAF_COLOURS[Math.floor(rand() * LEAF_COLOURS.length)]
      };
    }

    resize();
    for (let i = 0; i < flyCount; i++) flies.push(newFly());
    for (let i = 0; i < fallCount; i++) falls.push(newFall(false));

    function step(dt, time, pointer) {
      const still = pointer.inside && performance.now() - pointer.lastMove > 450;
      const fast = Math.hypot(pointer.vx, pointer.vy) > 6;

      flies.forEach(function (f) {
        f.heading += (rand() - 0.5) * 2.2 * dt;
        let tx = Math.cos(f.heading) * f.speed;
        let ty = Math.sin(f.heading) * f.speed * 0.6;
        if (pointer.inside) {
          const dx = pointer.x - f.x;
          const dy = pointer.y - f.y;
          const d = Math.hypot(dx, dy) || 1;
          if (still && d < 360) {
            // hold still and they come to rest around you
            f.angle += dt * 0.5;
            tx = (pointer.x + Math.cos(f.angle) * f.orbit - f.x) * 0.6;
            ty = (pointer.y + Math.sin(f.angle) * f.orbit * 0.6 - f.y) * 0.6;
          } else if (fast && d < 150) {
            tx -= (dx / d) * 120;
            ty -= (dy / d) * 120;
          }
        }
        const ease = Math.min(1, dt * 1.6);
        f.vx += (tx - f.vx) * ease;
        f.vy += (ty - f.vy) * ease;
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        if (f.x < -30) f.x = w + 30;
        if (f.x > w + 30) f.x = -30;
        if (f.y < h * 0.2) f.vy += 40 * dt;
        if (f.y > h * 0.96) f.vy -= 40 * dt;
      });

      falls.forEach(function (p, i) {
        p.y += p.vy * dt;
        p.x += (Math.sin(time * p.swayRate + p.phase) * p.sway + p.drift) * dt;
        p.rot += p.spin * dt;
        if (fast && pointer.inside) {
          const d = Math.hypot(p.x - pointer.x, p.y - pointer.y);
          if (d < 120) {
            p.x += pointer.vx * 0.5 * (1 - d / 120);
            p.y += pointer.vy * 0.3 * (1 - d / 120);
          }
        }
        if (p.y > h + 30 || p.x < -80 || p.x > w + 80) falls[i] = newFall(true);
      });
    }

    function drawFall(p, time) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.alpha;
      // a slender leaf turning over as it falls
      ctx.scale(0.4 + 0.6 * Math.abs(Math.sin(time * p.swayRate + p.phase)), 1);
      ctx.fillStyle = p.colour;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 0.22, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function draw(time) {
      ctx.clearRect(0, 0, w, h);
      falls.forEach(function (p) {
        drawFall(p, time);
      });
      ctx.globalCompositeOperation = 'lighter';
      flies.forEach(function (f) {
        const pulse = 0.5 + 0.5 * Math.sin(time * f.blink * 2 + f.phase);
        const size = f.size * (0.7 + 0.3 * pulse);
        ctx.globalAlpha = 0.12 + 0.88 * pulse * pulse * pulse;
        ctx.drawImage(glow, f.x - size / 2, f.y - size / 2, size, size);
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    return { resize: resize, step: step, draw: draw };
  }

  /* ------------------------------------------------------------------------
     Pond: touch the water
     ------------------------------------------------------------------------ */

  function ripple(pond, x, y, delay) {
    const ring = document.createElement('span');
    ring.className = 'ripple';
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    ring.style.animationDelay = delay + 'ms';
    ring.addEventListener('animationend', function () {
      ring.remove();
    });
    pond.appendChild(ring);
  }

  function initRipples(hero) {
    const pond = hero.querySelector('[data-pond]');
    if (!pond || reduced) return;
    hero.addEventListener('pointerdown', function (event) {
      if (event.target.closest('a, button')) return;
      const r = pond.getBoundingClientRect();
      if (event.clientY < r.top || event.clientY > r.bottom) return;
      ripple(pond, event.clientX - r.left, event.clientY - r.top, 0);
      ripple(pond, event.clientX - r.left, event.clientY - r.top, 280);
    });
  }

  /* ------------------------------------------------------------------------
     The night garden
     ------------------------------------------------------------------------ */

  function initHero() {
    const hero = document.querySelector('[data-hero]');
    if (!hero) return;

    leafWillow(hero.querySelector('[data-willow]'));
    initRipples(hero);
    if (reduced) return;

    hero.querySelectorAll('[data-depth]').forEach(function (el) {
      el.style.setProperty('--d', el.getAttribute('data-depth'));
    });

    const canvas = hero.querySelector('[data-sprites]');
    const sprites = canvas && canvas.getContext ? createSprites(canvas) : null;
    const willow = hero.querySelector('[data-willow]');
    const wind = willow ? createWind(willow) : null;
    const pointer = { x: 0, y: 0, nx: 0, ny: 0, vx: 0, vy: 0, inside: false, lastMove: 0 };
    let mx = 0;
    let my = 0;
    let lastSy = -1;
    let visible = true;
    let running = false;
    let last = 0;

    function onMove(event) {
      const r = hero.getBoundingClientRect();
      const x = event.clientX - r.left;
      const y = event.clientY - r.top;
      const now = performance.now();
      if (pointer.inside) {
        const dt = Math.max(8, now - pointer.lastMove);
        pointer.vx = ((x - pointer.x) / dt) * 16;
        pointer.vy = ((y - pointer.y) / dt) * 16;
      }
      pointer.x = x;
      pointer.y = y;
      pointer.nx = (x / r.width) * 2 - 1;
      pointer.ny = clamp((y / r.height) * 2 - 1, -1, 1);
      pointer.inside = y >= 0 && y <= r.height && x >= 0 && x <= r.width;
      pointer.lastMove = now;
      if (wind && pointer.inside) wind.push(event.clientX, event.clientY, pointer.vx);
      start();
    }

    function frame(now) {
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;

      if (finePointer) {
        const nmx = mx + (pointer.nx - mx) * 0.05;
        const nmy = my + (pointer.ny - my) * 0.05;
        if (Math.abs(nmx - mx) > 0.0005 || Math.abs(nmy - my) > 0.0005) {
          mx = nmx;
          my = nmy;
          hero.style.setProperty('--mx', mx.toFixed(4));
          hero.style.setProperty('--my', my.toFixed(4));
        }
      }
      const sy = Math.min(window.scrollY, hero.offsetHeight);
      if (sy !== lastSy) {
        lastSy = sy;
        hero.style.setProperty('--sy', sy.toFixed(1));
      }

      if (wind) wind.step();
      if (sprites) {
        sprites.step(dt, now / 1000, pointer);
        sprites.draw(now / 1000);
      }
      pointer.vx *= 0.9;
      pointer.vy *= 0.9;
      window.requestAnimationFrame(frame);
    }

    function start() {
      if (running || !visible || document.hidden) return;
      running = true;
      last = performance.now();
      window.requestAnimationFrame(frame);
    }

    window.addEventListener('pointermove', onMove, { passive: true });
    hero.addEventListener('pointerleave', function () {
      pointer.inside = false;
    });
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      start();
    }).observe(hero);
    document.addEventListener('visibilitychange', start);
    window.addEventListener('resize', function () {
      if (sprites) sprites.resize();
    });
    start();
  }

  /* ------------------------------------------------------------------------
     Emaki
     ------------------------------------------------------------------------ */

  function initEmaki() {
    const section = document.querySelector('[data-emaki]');
    if (!section) return;
    const viewport = section.querySelector('[data-emaki-viewport]');
    const track = section.querySelector('[data-emaki-track]');
    const paper = section.querySelector('[data-emaki-paper]');
    const ink = section.querySelector('[data-emaki-ink]');
    const line = ink.querySelector('.emaki__ink-line');
    const wash = ink.querySelector('.emaki__ink-wash');
    const bar = section.querySelector('[data-emaki-progress]');
    const wide = window.matchMedia('(min-width: 900px)');
    let pinned = false;
    let distance = 0;
    let inkLength = 0;
    let ticking = false;

    // A river of ink wandering the length of the paper, behind the pieces.
    function drawInk() {
      const W = paper.offsetWidth;
      const H = paper.offsetHeight;
      if (!W || !H) return;
      ink.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      const title = paper.querySelector('.emaki__title');
      const startX = title ? title.offsetLeft + title.offsetWidth + 24 : 0;
      const endX = W - 48;
      const rand = seeded(19);
      const pts = [];
      for (let x = startX; x < endX; x += 220 + rand() * 120) pts.push([x, H * (0.22 + rand() * 0.56)]);
      pts.push([endX, H * 0.5]);
      let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] || pts[i];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[i + 2] || p2;
        d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) +
          ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) +
          ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
      }
      line.setAttribute('d', d);
      wash.setAttribute('d', d);
      inkLength = line.getTotalLength();
      line.style.strokeDasharray = inkLength + ' ' + inkLength;
      wash.style.strokeDasharray = inkLength + ' ' + inkLength;
    }

    function progress() {
      if (pinned) {
        return distance ? clamp(-section.getBoundingClientRect().top / distance, 0, 1) : 1;
      }
      const max = viewport.scrollWidth - viewport.clientWidth;
      return max > 0 ? clamp(viewport.scrollLeft / max, 0, 1) : 1;
    }

    function update() {
      ticking = false;
      const p = progress();
      if (pinned) track.style.setProperty('--emaki-x', (-p * distance).toFixed(1) + 'px');
      const drawn = reduced ? 1 : clamp(p * 1.1 + 0.08, 0, 1);
      const offset = (inkLength * (1 - drawn)).toFixed(1);
      line.style.strokeDashoffset = offset;
      wash.style.strokeDashoffset = offset;
      bar.style.setProperty('--p', p.toFixed(4));
      section.classList.toggle('is-started', p > 0.02);
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    function layout() {
      pinned = !reduced && wide.matches;
      section.classList.toggle('is-pinned', pinned);
      if (pinned) {
        distance = Math.max(0, track.scrollWidth - window.innerWidth);
        section.style.setProperty('--emaki-h', window.innerHeight + distance + 'px');
      } else {
        distance = 0;
        section.style.removeProperty('--emaki-h');
        track.style.removeProperty('--emaki-x');
      }
      drawInk();
      update();
    }

    let resizeTimer = 0;
    window.addEventListener('scroll', requestUpdate, { passive: true });
    viewport.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(layout, 150);
    });
    if (wide.addEventListener) wide.addEventListener('change', layout);
    window.addEventListener('load', layout);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    document.addEventListener('langchange', function () {
      window.requestAnimationFrame(layout);
    });

    // Keyboard: while pinned, scrolling the page is what moves the paper,
    // so bring a focused piece into view by scrolling to it.
    track.addEventListener('focusin', function (event) {
      if (!pinned) return;
      const item = event.target.closest('figure') || event.target;
      const r = item.getBoundingClientRect();
      const centre = r.left - track.getBoundingClientRect().left + r.width / 2;
      const want = clamp(centre - window.innerWidth / 2, 0, distance);
      const top = section.getBoundingClientRect().top + window.scrollY + want;
      window.scrollTo({ top: top, behavior: 'instant' });
    });

    layout();
  }

  /* ------------------------------------------------------------------------
     Viewer
     ------------------------------------------------------------------------ */

  function initViewer() {
    const dialog = document.querySelector('[data-viewer]');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    const img = dialog.querySelector('[data-viewer-img]');
    const no = dialog.querySelector('[data-viewer-no]');
    const title = dialog.querySelector('[data-viewer-title]');
    const meta = dialog.querySelector('[data-viewer-meta]');
    let opener = null;
    let closing = 0;

    function copyText(from, to) {
      to.textContent = from ? from.textContent : '';
      to.classList.toggle('ph', Boolean(from && from.classList.contains('ph')));
    }

    function open(button) {
      const figure = button.closest('figure');
      const source = figure.querySelector('img');
      img.src = source.currentSrc || source.src;
      img.alt = source.alt;
      const number = figure.querySelector('.emaki__no');
      no.textContent = number ? number.textContent : '';
      copyText(figure.querySelector('.emaki__ctitle'), title);
      copyText(figure.querySelector('.emaki__cmeta'), meta);
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
      }, 430);
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

  /* ------------------------------------------------------------------------
     Noren: on touch, the first tap parts the curtain
     ------------------------------------------------------------------------ */

  function initNoren() {
    let lastPointer = 'mouse';
    document.addEventListener('pointerdown', function (event) {
      lastPointer = event.pointerType || 'mouse';
    }, { passive: true });
    document.querySelectorAll('[data-noren]').forEach(function (noren) {
      noren.addEventListener('click', function (event) {
        if (lastPointer === 'mouse') return;
        const wasOpen = noren.classList.contains('is-open');
        const isLink = noren.hasAttribute('href');
        if (isLink && !wasOpen) event.preventDefault();
        document.querySelectorAll('[data-noren].is-open').forEach(function (other) {
          if (other !== noren) other.classList.remove('is-open');
        });
        noren.classList.toggle('is-open', isLink ? true : !wasOpen);
      });
    });
  }

  /* ------------------------------------------------------------------------ */

  function init() {
    playBloom();
    initHero();
    if (!reduced) {
      splitTagline(true);
      document.addEventListener('langchange', function () {
        splitTagline(!introDone);
      });
    }
    initEmaki();
    initViewer();
    initNoren();
  }

  window.atelier = {
    splitTagline: splitTagline,
    leafWillow: leafWillow
  };

  init();
})();
