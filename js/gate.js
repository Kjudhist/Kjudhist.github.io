/* ==========================================================================
   The gate: one large sheet of navy washi, creased, lying on a dark table.

   Sheet:  drawn by js/kami.js. The pointer is the light: every flat facet
           between the creases catches it or loses it as the pointer moves.
           Until the pointer moves, the light drifts slowly by itself.
   Corner: the bottom-right corner is turned back a little (the white side
           of the paper shows). Drag it to fold the sheet back as far as you
           like; let go and it springs back.
   Doors:  two folded panels (a gatefold). Hover or focus half-opens the
           two leaves on their creases (CSS); click or Enter opens them flat
           and a sheet folds over the screen into the next page.
           Ctrl/cmd/middle clicks open a new tab the normal way.
   ========================================================================== */

(function () {
  'use strict';

  const stage = document.querySelector('[data-gate]');
  if (!stage || !window.Kami) return;
  const Kami = window.Kami;
  const reduced = window.site.prefersReducedMotion();
  const OPEN_MS = reduced ? 150 : 720;
  const doors = Array.from(stage.querySelectorAll('[data-door]'));
  let entering = false;

  /* ------------------------------------------------------------ sheet */

  const canvas = document.querySelector('[data-sheet]');
  const sheet = new Kami.Sheet(canvas, {
    creases: [
      { x: 0.5, y: 0.52, angle: 0.6, a: 0.42 },
      { x: 0.5, y: 0.52, angle: -0.6, a: -0.34 },
      { x: 0.5, y: 0.52, angle: Math.PI / 2, a: 0.22 },
      { x: 0.5, y: 0.78, angle: 0.02, a: -0.2 },
      { x: 0.84, y: 0.3, angle: 1.12, a: 0.26 },
      { x: 0.14, y: 0.24, angle: -1.02, a: 0.22 },
      { x: 0.3, y: 0.95, angle: -0.25, a: 0.15 }
    ],
    dark: '#040a2a',
    lit: '#2d49b0',
    table: '#030820',
    margin: function (w) {
      return Math.max(8, Math.min(18, w * 0.012));
    }
  });

  let queued = false;
  function draw() {
    queued = false;
    sheet.draw(Kami.light.x, Kami.light.y);
  }
  function requestDraw() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(draw);
  }

  /* ------------------------------------------------------------ corner */

  const peel = document.querySelector('[data-peel]');
  let rest = 0;
  let dragging = false;
  let spring = 0;

  function restPoint() {
    rest = window.innerWidth < 640 ? 34 : 50;
    return [sheet.w - sheet.m - rest, sheet.h - sheet.m - rest];
  }

  function clampPoint(x, y) {
    const cx = sheet.w - sheet.m;
    const cy = sheet.h - sheet.m;
    x = Math.max(sheet.m + 4, Math.min(cx - 6, x));
    y = Math.max(sheet.m + 4, Math.min(cy - 6, y));
    const d = Math.hypot(cx - x, cy - y);
    const max = Math.min(sheet.w, sheet.h) * 1.05;
    if (d > max) {
      x = cx - (cx - x) / d * max;
      y = cy - (cy - y) / d * max;
    }
    return [x, y];
  }

  function springBack() {
    const from = sheet.corner.slice();
    const to = restPoint();
    if (reduced) {
      sheet.corner = to;
      requestDraw();
      return;
    }
    const start = window.performance.now();
    const dur = 700;
    const id = ++spring;
    function step(now) {
      if (id !== spring || dragging) return;
      const t = Math.min(1, (now - start) / dur);
      // ease out with a small overshoot, like paper settling
      const k = 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
      sheet.corner = [from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k];
      draw();
      if (t < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  if (peel) {
    peel.addEventListener('pointerdown', function (event) {
      dragging = true;
      peel.setPointerCapture(event.pointerId);
      peel.classList.add('is-dragging');
      sheet.corner = clampPoint(event.clientX, event.clientY);
      requestDraw();
    });
    peel.addEventListener('pointermove', function (event) {
      if (!dragging) return;
      sheet.corner = clampPoint(event.clientX, event.clientY);
      requestDraw();
    });
    function release() {
      if (!dragging) return;
      dragging = false;
      peel.classList.remove('is-dragging');
      springBack();
    }
    peel.addEventListener('pointerup', release);
    peel.addEventListener('pointercancel', release);
  }

  function layout() {
    sheet.resize();
    sheet.corner = restPoint();
    draw();
  }

  /* ------------------------------------------------------------ doors */

  // each leaf's face catches the light where it falls on it
  const leaves = Array.from(stage.querySelectorAll('.door__leaf'));
  function lightLeaves(l) {
    leaves.forEach(function (leaf) {
      const box = leaf.getBoundingClientRect();
      leaf.style.setProperty('--hx', ((l.x - box.left) / Math.max(1, box.width) * 100).toFixed(1) + '%');
      leaf.style.setProperty('--hy', ((l.y - box.top) / Math.max(1, box.height) * 100).toFixed(1) + '%');
    });
  }

  function enterDoor(door) {
    if (entering) return Promise.resolve();
    entering = true;
    door.classList.add('is-open');
    stage.classList.add('has-open');
    return window.site.wait(OPEN_MS).then(function () {
      return window.site.leaveTo(door.href, door.getAttribute('data-tone'));
    });
  }

  function resetDoors() {
    entering = false;
    stage.classList.remove('has-open');
    doors.forEach(function (door) {
      door.classList.remove('is-open');
    });
    document.documentElement.classList.remove('is-leaving');
  }

  doors.forEach(function (door) {
    door.addEventListener('dragstart', function (event) {
      event.preventDefault();
    });
    door.addEventListener('click', function (event) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      enterDoor(door);
    });
  });

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) resetDoors();
  });

  Kami.light.on(function (l) {
    requestDraw();
    lightLeaves(l);
  });
  window.addEventListener('resize', layout);
  layout();
  lightLeaves(Kami.light);

  window.gate = {
    enterDoor: enterDoor,
    resetDoors: resetDoors,
    sheet: sheet
  };
})();
