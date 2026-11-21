/* ==========================================================================
   The gate: a summer festival at night.

   Sky:      the whole window is sky (js/hanabi.js). A shell goes up every
             few seconds on its own; click anywhere that isn't a stall, a
             lantern or a control and one bursts where you clicked.
   Lanterns: handled by js/main.js. Light every one and the sky answers
             with a finale.
   Stalls:   two festival stalls are the doors. Each noren (the split
             curtain) is four strips on damped springs: move the pointer
             through it and the strips swing with your speed; hover parts
             them; click (or Enter) and they fling aside and you go in.
             Ctrl/cmd/middle clicks open a new tab the normal way.
   Sound:    the fireworks can boom and crackle. Off until switched on.
   ========================================================================== */

(function () {
  'use strict';

  const OPEN_MS = 650;
  const REDUCED_MS = 150;

  const stage = document.querySelector('[data-gate]');
  if (!stage) return;
  const reduced = window.site.prefersReducedMotion();
  const stalls = Array.from(stage.querySelectorAll('[data-door]'));
  const partings = new Map(); // each stall's noren control, by stall
  let entering = false;

  /* ------------------------------------------------------------- sky */

  const canvas = document.querySelector('[data-sky]');
  const sky = canvas && window.Hanabi ? window.Hanabi.create(canvas, { auto: 6, stars: 160 }) : null;

  if (sky) {
    window.setTimeout(function () {
      sky.launch(null, null, 'shidare');
    }, 900);
    document.addEventListener('click', function (event) {
      if (entering) return;
      if (event.target.closest('a, button, input, label, .lang, [data-lantern], [data-door]')) return;
      sky.launch(event.clientX, event.clientY);
    });
    document.addEventListener('lanterns:alllit', function () {
      sky.finale();
    });
  }

  /* ----------------------------------------------------------- sound */

  const soundButton = document.querySelector('[data-sound]');
  if (soundButton && window.Hanabi) {
    soundButton.addEventListener('click', function () {
      const on = soundButton.getAttribute('aria-pressed') !== 'true';
      if (on) {
        if (!window.Hanabi.sound.enable()) return;
        if (sky) sky.launch(null, null, 'botan');
      } else {
        window.Hanabi.sound.disable();
      }
      soundButton.setAttribute('aria-pressed', String(on));
    });
  }

  /* ----------------------------------------------------------- noren */

  stalls.forEach(function (stall) {
    const booth = stall.querySelector('.stall__booth');
    const strips = Array.from(stall.querySelectorAll('.noren__strip'));
    const mid = (strips.length - 1) / 2;
    const state = strips.map(function () {
      return { a: 0, v: 0 };
    });
    let rest = 0;          // how far apart the strips hang: 0 closed, 1 hover, big = flung open
    let running = false;
    let last = 0;
    let px = null;
    let pt = 0;

    function frame(time) {
      const dt = Math.min(0.05, (time - (last || time)) / 1000);
      last = time;
      let moving = false;
      state.forEach(function (s, i) {
        const side = i < mid ? -1 : 1;
        const target = side * rest * (Math.abs(i - mid) + 0.5) * 4;
        s.v += (-(rest > 5 ? 90 : 34) * (s.a - target) - 4.2 * s.v) * dt;
        s.a += s.v * dt;
        s.a = Math.max(-80, Math.min(80, s.a));
        if (Math.abs(s.a - target) > 0.05 || Math.abs(s.v) > 0.05) moving = true;
        strips[i].style.setProperty('--a', s.a.toFixed(2) + 'deg');
      });
      if (moving) {
        window.requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }

    function kick() {
      if (running) return;
      running = true;
      last = 0;
      window.requestAnimationFrame(frame);
    }

    function settle() {
      // reduced motion: no swing, the strips just take their place
      state.forEach(function (s, i) {
        const side = i < mid ? -1 : 1;
        s.a = side * rest * (Math.abs(i - mid) + 0.5) * 4;
        s.v = 0;
        strips[i].style.setProperty('--a', s.a.toFixed(2) + 'deg');
      });
    }

    function part(value) {
      rest = value;
      if (reduced) settle();
      else kick();
    }

    booth.addEventListener('pointerenter', function () {
      if (!entering) part(1);
    });
    booth.addEventListener('pointerleave', function () {
      if (!entering) part(0);
      px = null;
    });
    stall.addEventListener('focus', function () {
      part(1);
    });
    stall.addEventListener('blur', function () {
      if (!entering) part(0);
    });

    // brushing through: each strip near the pointer takes some of its speed
    booth.addEventListener('pointermove', function (event) {
      if (reduced || entering) return;
      const now = window.performance.now();
      if (px !== null && now - pt < 100) {
        const vx = (event.clientX - px) / Math.max(1, now - pt) * 1000;
        strips.forEach(function (strip, i) {
          const box = strip.getBoundingClientRect();
          if (event.clientX > box.left - 16 && event.clientX < box.right + 16 && event.clientY < box.bottom + 10) {
            state[i].v = Math.max(-260, Math.min(260, state[i].v + vx * 0.16));
          }
        });
        kick();
      }
      px = event.clientX;
      pt = now;
    });

    partings.set(stall, part);
  });

  function enterStall(stall) {
    if (entering) return Promise.resolve();
    entering = true;
    stall.classList.add('is-open');
    stage.classList.add('has-open');
    partings.get(stall)(14);
    return window.site.wait(reduced ? REDUCED_MS : OPEN_MS).then(function () {
      return window.site.leaveTo(stall.href, stall.getAttribute('data-tone'));
    });
  }

  function resetStalls() {
    entering = false;
    stage.classList.remove('has-open');
    stalls.forEach(function (stall) {
      stall.classList.remove('is-open');
      partings.get(stall)(0);
    });
    document.documentElement.classList.remove('is-leaving');
  }

  stalls.forEach(function (stall) {
    stall.addEventListener('dragstart', function (event) {
      event.preventDefault();
    });
    stall.addEventListener('click', function (event) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      enterStall(stall);
    });
  });

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) resetStalls();
  });

  window.gate = {
    enterDoor: enterStall,
    resetDoors: resetStalls,
    sky: sky
  };
})();
