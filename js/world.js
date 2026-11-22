/* ==========================================================================
   Worlds: the pop-up book.

   Pages:  as each spread comes up the screen, the page before it turns over
           on the gutter (--turn, 0 to 1) and its scene stands up off the
           paper, back layers first (--p, 0 to 1). Both follow the scroll.
   Drag:   drag the book sideways (mouse or finger) to turn to the next or
           previous spread.
   Tilt:   the book and its scene lean with the pointer, or with the phone
           when it reports its orientation (--tx, --ty on <html>).
   Dragon: across the last spread a paper dragon unfolds segment by segment
           as you arrive, then swims in place while the spread is on screen.
   Reduced motion: every scene stands, no turning, no tilt, a still dragon.
   ========================================================================== */

(function () {
  'use strict';

  const book = document.querySelector('[data-book]');
  if (!book) return;
  const root = document.documentElement;
  const reduced = window.site ? window.site.prefersReducedMotion() : false;
  const spreads = Array.from(book.querySelectorAll('[data-spread]'));
  const hint = document.querySelector('[data-book-hint]');
  if (hint) hint.hidden = false;

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  /* ------------------------------------------------------------ dragon */

  const dragon = document.querySelector('[data-dragon]');
  const segs = dragon ? Array.from(dragon.querySelectorAll('[data-seg]')).reverse() : [];
  // segs[0] is the head (drawn last, on top); the body trails off to the left
  let unfold = reduced ? 1 : 0;
  let dragonOn = false;
  let dragonRun = false;
  let dragonT = 0;
  let dragonLast = 0;

  function placeDragon(t) {
    const n = segs.length;
    const spacing = 50;
    const headX = 860;
    let prev = null;
    segs.forEach(function (seg, i) {
      // each segment comes out of the one before it, from the head back
      const out = clamp(unfold * (n + 3) - i, 0, 1);
      const x = headX - i * spacing * (0.25 + out * 0.75);
      const y = 210 + Math.sin(t * 1.6 - i * 0.5) * 44 * Math.min(1, unfold * 1.4) + (1 - out) * 10;
      let angle = 0;
      if (prev) angle = Math.atan2(prev[1] - y, prev[0] - x) * 180 / Math.PI;
      else angle = Math.cos(t * 1.6) * 12;
      prev = [x, y];
      seg.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + angle.toFixed(1) + ') scale(' + (0.2 + out * 0.8).toFixed(3) + ' ' + out.toFixed(3) + ')');
      seg.style.opacity = out > 0.02 ? '1' : '0';
    });
  }

  function dragonFrame(time) {
    const dt = Math.min(0.05, (time - (dragonLast || time)) / 1000);
    dragonLast = time;
    dragonT += dt;
    placeDragon(dragonT);
    if (dragonOn && !document.hidden) {
      window.requestAnimationFrame(dragonFrame);
    } else {
      dragonRun = false;
    }
  }

  function wakeDragon() {
    if (reduced || dragonRun || !dragonOn) return;
    dragonRun = true;
    dragonLast = 0;
    window.requestAnimationFrame(dragonFrame);
  }

  if (dragon) {
    placeDragon(0.6);
    if ('IntersectionObserver' in window && !reduced) {
      new IntersectionObserver(function (entries) {
        dragonOn = entries[0].isIntersecting;
        wakeDragon();
      }).observe(dragon.closest('[data-spread]'));
      document.addEventListener('visibilitychange', wakeDragon);
    }
  }

  /* ------------------------------------------------------------ pages */

  if (reduced) return;

  spreads.forEach(function (spread, i) {
    if (i === 0) return; // the cover spread is open already
    const leaf = document.createElement('div');
    leaf.className = 'leaf';
    leaf.setAttribute('aria-hidden', 'true');
    spread.querySelector('.book').appendChild(leaf);
  });

  let queued = false;
  function update() {
    queued = false;
    const vh = window.innerHeight;
    spreads.forEach(function (spread, i) {
      const top = spread.getBoundingClientRect().top;
      // 0 when the spread's top meets the bottom of the window, 1 by the time
      // it is a third of the way up
      const p = i === 0 ? 1 : clamp((vh - top) / (vh * 0.62), 0, 1);
      spread.style.setProperty('--p', p.toFixed(3));
      spread.style.setProperty('--turn', clamp(p * 1.5 - 0.05, 0, 1).toFixed(3));
      if (dragon && spread.contains(dragon)) {
        unfold = clamp((p - 0.35) / 0.65, 0, 1);
        if (!dragonRun) placeDragon(dragonT);
      }
    });
  }
  function request() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(update);
  }
  // the hero stands up on arrival
  spreads[0].style.setProperty('--p', '0');
  window.requestAnimationFrame(function () {
    window.setTimeout(function () {
      spreads[0].classList.add('is-rising');
      let start = 0;
      function rise(time) {
        start = start || time;
        const k = Math.min(1, (time - start) / 1400);
        spreads[0].style.setProperty('--p', (1 - Math.pow(1 - k, 3)).toFixed(3));
        if (k < 1) window.requestAnimationFrame(rise);
      }
      window.requestAnimationFrame(rise);
    }, 250);
  });
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  spreads.forEach(function (s, i) {
    if (i) s.style.setProperty('--p', '0');
  });
  update();

  /* ------------------------------------------------------------ drag to turn */

  let dragX = null;
  let dragY = null;
  let dragId = null;
  book.addEventListener('pointerdown', function (event) {
    if (event.button !== 0 || event.target.closest('a, button, [tabindex], .lang')) return;
    dragX = event.clientX;
    dragY = event.clientY;
    dragId = event.pointerId;
  });
  window.addEventListener('pointerup', function (event) {
    if (dragX === null || event.pointerId !== dragId) return;
    const dx = event.clientX - dragX;
    const dy = event.clientY - dragY;
    dragX = null;
    if (Math.abs(dx) < 80 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    // which spread is the reader on?
    const mid = window.innerHeight * 0.4;
    let current = 0;
    spreads.forEach(function (s, i) {
      if (s.getBoundingClientRect().top <= mid) current = i;
    });
    const next = clamp(current + (dx < 0 ? 1 : -1), 0, spreads.length - 1);
    spreads[next].scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* ------------------------------------------------------------ tilt */

  let tiltQueued = false;
  let tx = 0;
  let ty = 0;
  function tilt() {
    tiltQueued = false;
    root.style.setProperty('--tx', tx.toFixed(3));
    root.style.setProperty('--ty', ty.toFixed(3));
  }
  function requestTilt() {
    if (tiltQueued) return;
    tiltQueued = true;
    window.requestAnimationFrame(tilt);
  }
  window.addEventListener('pointermove', function (event) {
    if (event.pointerType !== 'mouse') return;
    tx = clamp(event.clientX / window.innerWidth * 2 - 1, -1, 1);
    ty = clamp(event.clientY / window.innerHeight * 2 - 1, -1, 1);
    requestTilt();
  }, { passive: true });
  window.addEventListener('deviceorientation', function (event) {
    if (event.gamma == null || event.beta == null) return;
    tx = clamp(event.gamma / 30, -1, 1);
    ty = clamp((event.beta - 45) / 30, -1, 1);
    requestTilt();
  });
})();
