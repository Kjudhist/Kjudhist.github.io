/* ==========================================================================
   Gate doors. Each door is a link wrapped round a pair of shoji.

   Drag:  pull the pair apart sideways (either panel, either direction away
          from the middle) and the screens follow your hand. Let go past
          the middle and you go in; short of it they slide shut again.
          Vertical swipes are left to the page, so phones still scroll.
   Click, tap or Enter: the screens slide all the way open and you go in.
   Ctrl/cmd/middle clicks open a new tab the normal way.

   Around the doors, the night garden: fireflies that gather round the
   pointer, and a wind chime that swings and rings.
   ========================================================================== */

(function () {
  'use strict';

  const OPEN_MS = 800;   // the screens part
  const STEP_MS = 280;   // then a step into the room
  const REDUCED_MS = 150;
  const GO_PAST = 0.42;  // let go beyond this and the door opens

  const stage = document.querySelector('[data-gate]');
  if (!stage) return;

  const doors = Array.from(stage.querySelectorAll('[data-door]'));
  let entering = false;

  function setOpen(door, value) {
    door.style.setProperty('--open', value.toFixed(3));
  }

  function enterDoor(door) {
    if (entering) return Promise.resolve();
    entering = true;
    const reduced = window.site.prefersReducedMotion();
    door.classList.remove('is-dragging');
    door.classList.add('is-open');
    stage.classList.add('has-open');
    setOpen(door, 1);
    return window.site.wait(reduced ? REDUCED_MS : OPEN_MS).then(function () {
      door.classList.add('is-entering');
      return window.site.wait(reduced ? 0 : STEP_MS);
    }).then(function () {
      return window.site.leaveTo(door.href, door.getAttribute('data-tone'));
    });
  }

  function resetDoors() {
    entering = false;
    stage.classList.remove('has-open');
    doors.forEach(function (door) {
      door.classList.remove('is-open', 'is-entering', 'is-dragging');
      setOpen(door, 0);
    });
    document.documentElement.classList.remove('is-leaving');
  }

  doors.forEach(function (door) {
    const frame = door.querySelector('.door__frame');
    let drag = null;
    let dragged = false;

    frame.addEventListener('pointerdown', function (event) {
      if (entering || event.button !== 0) return;
      const box = frame.getBoundingClientRect();
      drag = {
        x: event.clientX,
        y: event.clientY,
        half: box.width / 2,
        // the left panel opens leftward, the right one rightward
        side: event.clientX < box.left + box.width / 2 ? -1 : 1,
        start: parseFloat(door.style.getPropertyValue('--open')) || 0,
        id: event.pointerId,
        active: false
      };
      dragged = false;
    });

    frame.addEventListener('pointermove', function (event) {
      if (!drag) return;
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.active) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) {
          drag = null;
          return;
        }
        if (Math.abs(dx) < 6) return;
        drag.active = true;
        dragged = true;
        door.classList.add('is-dragging');
        try {
          frame.setPointerCapture(drag.id);
        } catch (e) {
          // capture is a nicety
        }
      }
      const value = Math.max(0, Math.min(1, drag.start + (dx * drag.side) / drag.half));
      setOpen(door, value);
    });

    function release() {
      if (!drag) return;
      const wasActive = drag.active;
      drag = null;
      if (!wasActive) return;
      door.classList.remove('is-dragging');
      const value = parseFloat(door.style.getPropertyValue('--open')) || 0;
      if (value > GO_PAST) {
        enterDoor(door);
      } else {
        setOpen(door, 0);
      }
    }

    frame.addEventListener('pointerup', release);
    frame.addEventListener('pointercancel', function () {
      drag = null;
      door.classList.remove('is-dragging');
      if (!entering) setOpen(door, 0);
    });

    // a link would otherwise start a native drag of its URL
    door.addEventListener('dragstart', function (event) {
      event.preventDefault();
    });

    door.addEventListener('click', function (event) {
      if (dragged) {
        // the drag already decided; this click is just its tail
        event.preventDefault();
        dragged = false;
        return;
      }
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      enterDoor(door);
    });
  });

  /* ------------------------------------------------------------------------
     Hotaru: fireflies over the night garden. They wander, pulse on their own
     clocks, and gather loosely round the pointer (never on it). Clicking the
     garden, anywhere that is not a door or a control, lets out a few more.
     Reduced motion: one still frame, redrawn when more are added.
     ------------------------------------------------------------------------ */
  function initHotaru() {
    const canvas = document.querySelector('[data-hotaru]');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const reduced = window.site.prefersReducedMotion();
    const MAX = 90;
    const flies = [];
    const pointer = { x: -1e4, y: -1e4, until: 0 };
    let w = 0;
    let h = 0;
    let dpr = 1;
    let last = 0;
    let frameId = 0;

    // one soft glow, drawn once and stamped for every firefly
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const sg = sprite.getContext('2d');
    const glow = sg.createRadialGradient(32, 32, 0, 32, 32, 32);
    glow.addColorStop(0, 'rgba(248, 250, 255, 1)');
    glow.addColorStop(0.14, 'rgba(226, 235, 255, 0.95)');
    glow.addColorStop(0.3, 'rgba(160, 186, 240, 0.4)');
    glow.addColorStop(0.6, 'rgba(142, 171, 227, 0.1)');
    glow.addColorStop(1, 'rgba(142, 171, 227, 0)');
    sg.fillStyle = glow;
    sg.fillRect(0, 0, 64, 64);

    function spawn(x, y, burst) {
      const angle = Math.random() * Math.PI * 2;
      const speed = burst ? 60 + Math.random() * 90 : 8 + Math.random() * 14;
      flies.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        heading: angle,
        phase: Math.random() * Math.PI * 2,
        rate: 0.6 + Math.random() * 1.1,
        size: 22 + Math.random() * 20
      });
      if (flies.length > MAX) flies.shift();
    }

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(time) {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      flies.forEach(function (f) {
        const near = Math.max(0, 1 - Math.hypot(f.x - pointer.x, f.y - pointer.y) / 260);
        const pulse = Math.pow(Math.sin(time / 1000 * f.rate + f.phase) * 0.5 + 0.5, 2);
        ctx.globalAlpha = Math.min(1, 0.12 + pulse * 0.78 + near * 0.3);
        const s = f.size * (0.8 + pulse * 0.35);
        ctx.drawImage(sprite, f.x - s / 2, f.y - s / 2, s, s);
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    function step(dt, time) {
      const active = time < pointer.until;
      flies.forEach(function (f) {
        f.heading += (Math.random() - 0.5) * 2.4 * dt;
        f.vx += Math.cos(f.heading) * 18 * dt;
        f.vy += Math.sin(f.heading) * 18 * dt - 2 * dt;
        if (active) {
          const dx = pointer.x - f.x;
          const dy = pointer.y - f.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < 280) {
            // drawn in from afar, pushed off when too close: a loose ring round the light
            const pull = d > 70 ? 40 : -90;
            f.vx += (dx / d) * pull * dt;
            f.vy += (dy / d) * pull * dt;
          }
        }
        const speed = Math.hypot(f.vx, f.vy);
        const top = 46;
        if (speed > top) {
          f.vx *= 1 - Math.min(0.9, 2.5 * dt);
          f.vy *= 1 - Math.min(0.9, 2.5 * dt);
        }
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        if (f.x < -20) f.x = w + 20;
        if (f.x > w + 20) f.x = -20;
        if (f.y < -20) f.y = h + 20;
        if (f.y > h + 20) f.y = -20;
      });
    }

    function loop(time) {
      const dt = Math.min(0.05, (time - (last || time)) / 1000);
      last = time;
      step(dt, time);
      draw(time);
      frameId = window.requestAnimationFrame(loop);
    }

    function start() {
      if (reduced || frameId) return;
      last = 0;
      frameId = window.requestAnimationFrame(loop);
    }

    function stop() {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
    }

    resize();
    const count = Math.round(Math.max(14, Math.min(40, (w * h) / 36000)));
    for (let i = 0; i < count; i++) spawn(Math.random() * w, Math.random() * h, false);
    draw(0);
    start();

    window.addEventListener('resize', function () {
      resize();
      draw(window.performance.now());
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else start();
    });
    window.addEventListener('pointermove', function (event) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.until = window.performance.now() + (event.pointerType === 'mouse' ? 1e9 : 2500);
    }, { passive: true });
    document.addEventListener('pointerleave', function () {
      pointer.until = 0;
    });
    document.addEventListener('click', function (event) {
      if (event.target.closest('a, button, [data-door], .lang, input, label')) return;
      for (let i = 0; i < 6; i++) spawn(event.clientX, event.clientY, true);
      if (reduced) draw(window.performance.now());
    });
  }

  /* ------------------------------------------------------------------------
     Furin: a glass wind chime. Hover (or focus) sets it swinging; a click or
     tap rings it out loud. Sound only ever starts from a click or tap, and
     after that a hover rings it softly.
     ------------------------------------------------------------------------ */
  function initFurin() {
    const furin = document.querySelector('[data-furin]');
    if (!furin) return;
    const NOTES = [1318.5, 1568, 1760, 2093, 2349.3];
    let audio = null;
    let lastRing = 0;

    function chime(volume) {
      if (!audio || audio.state !== 'running') return;
      const now = audio.currentTime;
      const base = NOTES[Math.floor(Math.random() * NOTES.length)];
      // a glass bell: a fundamental and two inharmonic partials, struck and left to ring
      [[1, 0.16, 2.6], [2.76, 0.05, 1.4], [5.4, 0.025, 0.8]].forEach(function (partial) {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.type = 'sine';
        osc.frequency.value = base * partial[0];
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(partial[1] * volume, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + partial[2]);
        osc.connect(gain).connect(audio.destination);
        osc.start(now);
        osc.stop(now + partial[2] + 0.05);
      });
    }

    function swing() {
      furin.classList.remove('is-ringing');
      void furin.offsetWidth;
      furin.classList.add('is-ringing');
    }

    function ring(volume) {
      const now = window.performance.now();
      if (now - lastRing < 350) return;
      lastRing = now;
      swing();
      chime(volume);
    }

    furin.addEventListener('animationend', function () {
      furin.classList.remove('is-ringing');
    });
    furin.addEventListener('pointerenter', function (event) {
      if (event.pointerType === 'mouse') ring(0.45);
    });
    furin.addEventListener('focus', function () {
      swing();
    });
    furin.addEventListener('click', function () {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!audio && Ctx) audio = new Ctx();
      lastRing = 0;
      if (audio && audio.state !== 'running') {
        audio.resume().then(function () {
          ring(1);
        });
      } else {
        ring(1);
      }
    });
  }

  initHotaru();
  initFurin();

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) resetDoors();
  });

  window.gate = {
    enterDoor: enterDoor,
    resetDoors: resetDoors
  };
})();
