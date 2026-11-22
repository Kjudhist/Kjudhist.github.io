/* ==========================================================================
   Worlds: the sky islands.

   River:    a stream of glowing petals and motes flows down the page,
             weaving from side to side between the islands. Its course
             bends toward the pointer (or a finger), so you can lead it.
   Depth:    the giant moon, the far islands, the stars and the islands
             themselves move at different rates with scroll, and lean
             with the pointer or the tilt of the phone.
   Islands:  each section's island drifts in from its side when it comes
             into view, then floats (CSS).
   Reduced motion: one still frame of the river, no parallax.
   ========================================================================== */

(function () {
  'use strict';

  const S = window.Sakura;
  const reduced = S ? S.reduced : true;
  const canvas = document.querySelector('[data-river]');
  const layers = Array.from(document.querySelectorAll('[data-depth]'));
  const isles = Array.from(document.querySelectorAll('[data-isle]'));

  /* islands drift into view */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    isles.forEach(function (el) {
      io.observe(el);
    });
  } else {
    isles.forEach(function (el) {
      el.classList.add('is-in');
    });
  }

  if (!S || !canvas) return;
  const g = canvas.getContext('2d');
  let W = 0;
  let H = 0;
  let dpr = 1;
  let stars = [];
  let motes = [];
  let pointer = { x: -1, y: -1, on: false };
  let tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  let scrollY = window.scrollY;
  let flow = 0;

  function layout() {
    const s = S.fit(canvas);
    W = s.w;
    H = s.h;
    dpr = s.dpr;
    const r = S.rng(4);
    stars = [];
    for (let i = 0; i < W * H / 3200; i++) {
      stars.push({ x: r() * W, y: r() * H, r: r() < 0.1 ? 1.3 : 0.6, a: 0.2 + r() * 0.6, d: 0.02 + r() * 0.06, tw: r() * S.TAU });
    }
    const n = Math.round(Math.min(260, W * H / 4200));
    motes = [];
    for (let i = 0; i < n; i++) motes.push(mote(Math.random() * H));
  }

  function mote(y) {
    const petal = Math.random() < 0.38;
    return {
      y: y,
      lane: (Math.random() + Math.random() - 1),
      speed: 30 + Math.random() * 60,
      size: petal ? 6 + Math.random() * 6 : 5 + Math.random() * 16,
      petal: petal,
      spr: S.sprites.petals[Math.floor(Math.random() * 4)],
      rot: Math.random() * S.TAU,
      spin: (Math.random() - 0.5) * 2,
      flip: Math.random() * S.TAU,
      ph: Math.random() * S.TAU,
      x: 0
    };
  }

  // the river's course at height y on screen
  function course(y, t) {
    const page = y + scrollY;
    let x = W * 0.5 + W * 0.3 * Math.sin(page * 0.0021 + t * 0.12) + W * 0.06 * Math.sin(page * 0.0067 - t * 0.3);
    if (pointer.on) {
      const f = Math.exp(-Math.pow((y - pointer.y) / (H * 0.32), 2));
      x += (pointer.x - x) * f * 0.85;
    }
    return x;
  }

  function width(y) {
    return Math.max(34, W * 0.045) * (0.8 + 0.3 * Math.sin((y + scrollY) * 0.004));
  }

  function frame(dt, t) {
    // depth: smooth the lean toward its target
    tilt.x += (tilt.tx - tilt.x) * Math.min(1, dt * 3);
    tilt.y += (tilt.ty - tilt.y) * Math.min(1, dt * 3);
    const sy = window.scrollY;
    const ds = sy - scrollY;
    scrollY = sy;
    flow += dt;

    layers.forEach(function (el) {
      const d = parseFloat(el.getAttribute('data-depth')) || 0;
      el.style.setProperty('--dx', (-tilt.x * 400 * d).toFixed(1) + 'px');
      el.style.setProperty('--dy', (-tilt.y * 300 * d - scrollY * d).toFixed(1) + 'px');
    });
    if (!reduced) {
      isles.forEach(function (el, i) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > H + 200) return;
        const c = (r.top + r.height / 2 - H / 2) / H;
        const k = i % 2 ? 1 : -1;
        el.style.setProperty('--ix', (tilt.x * 16 * k).toFixed(1) + 'px');
        el.style.setProperty('--iy', (c * -40 + tilt.y * 10).toFixed(1) + 'px');
      });
    }

    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);

    // stars, a little parallax and twinkle
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      let y = (s.y - scrollY * s.d) % H;
      if (y < 0) y += H;
      const x = s.x - tilt.x * 30 * s.d * 10;
      g.globalAlpha = s.a * (0.75 + 0.25 * Math.sin(t * 1.3 + s.tw));
      g.fillStyle = '#eef1fb';
      g.fillRect(x * dpr, y * dpr, s.r * 1.6 * dpr, s.r * 1.6 * dpr);
    }

    // the river
    g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < motes.length; i++) {
      const m = motes[i];
      if (!reduced) {
        m.y += (m.speed * dt) - ds * 0.35;
        if (m.y > H + 30) {
          motes[i] = mote(-20 - Math.random() * 40);
          continue;
        }
        if (m.y < -80) m.y += H + 100;
        m.rot += m.spin * dt;
        m.flip += dt * 3;
      }
      const target = course(m.y, t) + m.lane * width(m.y) + Math.sin(t * 1.1 + m.ph) * 8;
      m.x = m.x ? m.x + (target - m.x) * Math.min(1, dt * 2.5) : target;
      if (reduced) m.x = target;
      if (m.petal) {
        const k = m.size / 28 * dpr;
        const fx = Math.max(0.15, Math.abs(Math.cos(m.flip)));
        const c = Math.cos(m.rot);
        const s2 = Math.sin(m.rot);
        g.globalAlpha = 0.85;
        g.setTransform(c * fx * k, s2 * fx * k, -s2 * k, c * k, m.x * dpr, m.y * dpr);
        g.drawImage(m.spr, -16, -16);
        g.setTransform(1, 0, 0, 1, 0, 0);
      } else {
        const sz = m.size * dpr * (0.8 + 0.2 * Math.sin(t * 2 + m.ph));
        g.globalAlpha = 0.55;
        g.drawImage(S.sprites.spirit, m.x * dpr - sz / 2, m.y * dpr - sz / 2, sz, sz);
      }
    }
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    return !reduced;
  }

  layout();
  let resizeTimer = 0;
  window.addEventListener('resize', function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(function () {
      layout();
      engine.wake();
    }, 150);
  });

  window.addEventListener('pointermove', function (e) {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.on = true;
    tilt.tx = e.clientX / W - 0.5;
    tilt.ty = e.clientY / H - 0.5;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', function () {
    pointer.on = false;
    tilt.tx = 0;
    tilt.ty = 0;
  });

  // phones: lean with the tilt (asks for permission on iOS on first touch)
  function onTilt(e) {
    if (e.gamma === null) return;
    tilt.tx = Math.max(-0.5, Math.min(0.5, e.gamma / 60));
    tilt.ty = Math.max(-0.5, Math.min(0.5, (e.beta - 40) / 80));
  }
  if (!reduced && 'DeviceOrientationEvent' in window) {
    if (typeof window.DeviceOrientationEvent.requestPermission === 'function') {
      window.addEventListener('touchend', function ask() {
        window.removeEventListener('touchend', ask);
        window.DeviceOrientationEvent.requestPermission().then(function (state) {
          if (state === 'granted') window.addEventListener('deviceorientation', onTilt);
        }).catch(function () {});
      });
    } else {
      window.addEventListener('deviceorientation', onTilt);
    }
  }

  const engine = S.loop(null, frame);
  if (reduced) {
    window.addEventListener('scroll', function () {
      engine.wake();
    }, { passive: true });
  }
})();
