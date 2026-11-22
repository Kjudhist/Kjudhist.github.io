/* ==========================================================================
   404: a single bare branch reaching in from the right. Touch it (or press
   Enter on the hint) and it blossoms from the base outward; petals start
   to fall. Touch again and it lets more go.
   ========================================================================== */

(function () {
  'use strict';

  const S = window.Sakura;
  const canvas = document.querySelector('[data-lost]');
  if (!S || !canvas) return;
  const g = canvas.getContext('2d');
  const reduced = S.reduced;
  const wind = new S.Wind({ base: 12, radius: 140 });
  const petals = new S.Petals({ max: 240, ground: function () { return H - 6; }, restMax: 140 });
  let W = 0;
  let H = 0;
  let dpr = 1;
  let branch = null;
  let flowers = [];
  let bloomAt = -1;
  let now = 0;
  let engine = null;

  function layout() {
    const s = S.fit(canvas);
    W = s.w;
    H = s.h;
    dpr = s.dpr;
    petals.w = W;
    petals.h = H;
    const mobile = W < 720;
    branch = S.growTree({
      x: W + 10,
      y: H * (mobile ? 0.2 : 0.3),
      angle: Math.PI + 0.25,
      len: Math.min(W, H) * (mobile ? 0.3 : 0.28),
      width: mobile ? 9 : 13,
      depth: 5,
      seed: 404,
      spread: 0.55,
      shrink: 0.78
    });
    const r = S.rng(44);
    flowers = [];
    branch.tips.concat(branch.buds).forEach(function (p) {
      const n = 2 + Math.floor(r() * 3);
      for (let i = 0; i < n; i++) {
        flowers.push({
          x: p.x + (r() - 0.5) * 18,
          y: p.y + (r() - 0.5) * 14,
          s: (mobile ? 12 : 16) + r() * 12,
          rot: r() * S.TAU,
          spr: S.sprites.flowers[Math.floor(r() * 4)],
          // bloom from the base of the branch outward
          delay: (W - p.x) / W * 1.6 + r() * 0.5
        });
      }
    });
  }

  function render() {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, canvas.width, canvas.height);
    S.drawSegs(g, branch.segs, dpr, { rim: 'rgba(150, 170, 240, 0.35)', wood: '#040a24', rimX: 1, rimY: -1 });
    if (bloomAt >= 0) {
      for (let i = 0; i < flowers.length; i++) {
        const f = flowers[i];
        const k = reduced ? 1 : Math.min(1, (now - bloomAt - f.delay) / 0.7);
        if (k <= 0) continue;
        const sz = f.s * S.easeOutBack(k) * dpr;
        g.setTransform(Math.cos(f.rot), Math.sin(f.rot), -Math.sin(f.rot), Math.cos(f.rot), f.x * dpr, f.y * dpr);
        g.drawImage(f.spr, -sz / 2, -sz / 2, sz, sz);
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
    }
    petals.draw(g, dpr);
  }

  function bloom() {
    if (bloomAt < 0) {
      bloomAt = now;
      document.documentElement.classList.add('is-bloomed');
    }
    for (let i = 0; i < 24; i++) {
      const f = flowers[Math.floor(Math.random() * flowers.length)];
      petals.spawn(f.x, f.y, (Math.random() - 0.7) * 120, -20 - Math.random() * 40);
    }
    if (engine) engine.wake();
  }

  document.addEventListener('pointerdown', function (e) {
    if (e.target.closest('a, button')) return;
    if (S.nearestSeg(branch.segs, e.clientX, e.clientY, 40)) bloom();
  });
  window.addEventListener('pointermove', function (e) {
    wind.point(e.clientX, e.clientY);
    if (engine) engine.wake();
  }, { passive: true });
  const hint = document.querySelector('[data-lost-hint]');
  if (hint) {
    hint.setAttribute('tabindex', '0');
    hint.setAttribute('role', 'button');
    hint.addEventListener('click', bloom);
    hint.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        bloom();
      }
    });
  }
  window.addEventListener('resize', function () {
    layout();
    if (engine) engine.wake();
  });

  layout();
  engine = S.loop(null, function (dt, t) {
    now = t;
    if (reduced) {
      render();
      return false;
    }
    wind.step(dt);
    if (bloomAt >= 0 && Math.random() < dt * 5) {
      const f = flowers[Math.floor(Math.random() * flowers.length)];
      petals.spawn(f.x, f.y, 0, 0);
    }
    petals.step(dt, wind);
    render();
    return true;
  });
})();
