/* ==========================================================================
   The atelier.
   Arrival bloom, the night garden (a swaying willow and a few fireflies),
   the emaki, and the viewer.
   ========================================================================== */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
     Fireflies
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

  function createSprites(canvas) {
    const ctx = canvas.getContext('2d');
    const count = window.innerWidth < 640 ? 8 : 14;
    const glow = makeGlow();
    const rand = Math.random;
    const flies = [];
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
        size: 16 + rand() * 18
      };
    }

    resize();
    for (let i = 0; i < count; i++) flies.push(newFly());

    function step(dt) {
      flies.forEach(function (f) {
        f.heading += (rand() - 0.5) * 2.2 * dt;
        const tx = Math.cos(f.heading) * f.speed;
        const ty = Math.sin(f.heading) * f.speed * 0.6;
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
    }

    function draw(time) {
      ctx.clearRect(0, 0, w, h);
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

    const canvas = hero.querySelector('[data-sprites]');
    const sprites = canvas && canvas.getContext ? createSprites(canvas) : null;
    if (!sprites) return;
    let visible = true;
    let running = false;
    let last = 0;

    function frame(now) {
      if (!visible || document.hidden) {
        running = false;
        return;
      }
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      sprites.step(dt);
      sprites.draw(now / 1000);
      window.requestAnimationFrame(frame);
    }

    function start() {
      if (running || !visible || document.hidden) return;
      running = true;
      last = performance.now();
      window.requestAnimationFrame(frame);
    }

    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      start();
    }).observe(hero);
    document.addEventListener('visibilitychange', start);
    window.addEventListener('resize', function () {
      sprites.resize();
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
  }

  window.atelier = {
    splitTagline: splitTagline,
    leafWillow: leafWillow
  };

  init();
})();
