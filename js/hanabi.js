/* ==========================================================================
   Hanabi (花火): the fireworks, shared by the gate, the worlds and the 404.

   window.Hanabi.create(canvas, options) runs a show on a canvas:
     launch(x, y, type)  a shell rises from below and bursts at (x, y)
     finale()            a volley of every kind
     options.auto        seconds between shells nobody asked for (0 = none)
     options.stars       how many stars to sprinkle behind the show

   Shells, in the one ink (white, pale blue, royal, silver):
     kiku     chrysanthemum: a sphere of stars, each dragging a tail
     botan    peony: a sphere of bright dots, no tails
     shidare  willow: long, drooping silver trails that hang and fall
     ring     a flat ring, tilted
     senrin   a thousand rings: little crackling bursts scattered round
   Bursts can boom and crackle (window.Hanabi.sound, off until switched on).

   Also: any [data-hanabi] strip gets its own show, launched by clicking it,
   and on dark pages the pointer is a sparkler (senko hanabi) that throws a
   few sparks as it moves. Reduced motion: no autoplay, no sparkler; a click
   paints one still burst.
   ========================================================================== */

(function () {
  'use strict';

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const INKS = [
    ['#ffffff', '#c9d6f0'],
    ['#dfe7f7', '#5b7cff'],
    ['#8eabe3', '#ffffff'],
    ['#5b7cff', '#dfe7f7'],
    ['#c9d6f0', '#2449d8'],
    ['#ffffff', '#8eabe3']
  ];
  const TYPES = ['kiku', 'botan', 'shidare', 'ring', 'senrin'];

  /* ---------------------------------------------------------------- sound */

  const sound = {
    on: false,
    ctx: null,
    noise: null,
    enable: function () {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      if (!this.ctx) {
        this.ctx = new Ctx();
        // one second of white noise, reused for every boom and crackle
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        this.noise = buffer;
      }
      if (this.ctx.state !== 'running') this.ctx.resume();
      this.on = true;
      return true;
    },
    disable: function () {
      this.on = false;
    },
    burst: function (size, distance) {
      if (!this.on || !this.ctx || this.ctx.state !== 'running') return;
      const ctx = this.ctx;
      const now = ctx.currentTime + distance * 0.25; // far shells are heard a beat later
      const vol = Math.max(0.15, 0.55 - distance * 0.3) * size;
      // the boom: low noise through a closing filter, and a thump
      const src = ctx.createBufferSource();
      src.buffer = this.noise;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(60, now + 1.2);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(vol, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);
      src.connect(filter).connect(gain).connect(ctx.destination);
      src.start(now, Math.random() * 0.5, 1.5);
      const thump = ctx.createOscillator();
      const tg = ctx.createGain();
      thump.frequency.setValueAtTime(110, now);
      thump.frequency.exponentialRampToValueAtTime(40, now + 0.35);
      tg.gain.setValueAtTime(vol * 0.9, now);
      tg.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      thump.connect(tg).connect(ctx.destination);
      thump.start(now);
      thump.stop(now + 0.45);
    },
    crackle: function (count, distance) {
      if (!this.on || !this.ctx || this.ctx.state !== 'running') return;
      const ctx = this.ctx;
      const start = ctx.currentTime + distance * 0.25 + 0.35;
      for (let i = 0; i < count; i++) {
        const t = start + Math.random() * 0.9;
        const src = ctx.createBufferSource();
        src.buffer = this.noise;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 2500 + Math.random() * 3000;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.08 + Math.random() * 0.08, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
        src.connect(hp).connect(g).connect(ctx.destination);
        src.start(t, Math.random() * 0.9, 0.04);
      }
    }
  };

  /* ----------------------------------------------------------------- show */

  function create(canvas, options) {
    const opts = Object.assign({ auto: 0, stars: 0, max: coarse ? 900 : 1800 }, options || {});
    const ctx = canvas.getContext('2d');
    const rockets = [];
    const sparks = [];
    const flashes = [];
    let stars = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let last = 0;
    let frame = 0;
    let nextAuto = 0;
    let visible = true;

    function resize() {
      const box = canvas.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.max(1, box.width);
      h = Math.max(1, box.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      for (let i = 0; i < opts.stars; i++) {
        stars.push({ x: Math.random() * w, y: Math.random() * h * 0.75, r: Math.random() < 0.15 ? 1.6 : 0.9, p: Math.random() * 6 });
      }
    }

    function pick(list) {
      return list[Math.floor(Math.random() * list.length)];
    }

    function spark(x, y, vx, vy, o) {
      if (sparks.length >= opts.max) sparks.shift();
      sparks.push(Object.assign({
        x: x, y: y, px: x, py: y, vx: vx, vy: vy,
        life: 1, decay: 0.6, drag: 0.985, gravity: 60,
        color: '#ffffff', size: 1.6, trail: 0, flicker: false, hist: null, child: null
      }, o));
    }

    function burst(x, y, type, inks) {
      const scale = Math.min(1.4, Math.max(0.6, Math.min(w, h * 1.6) / 900));
      const distance = Math.random() * 0.6;
      flashes.push({ x: x, y: y, r: 160 * scale, life: 1 });
      let count;
      if (type === 'kiku') {
        count = 90;
        for (let i = 0; i < count; i++) {
          const a = Math.random() * Math.PI * 2;
          const u = Math.acos(Math.random() * 2 - 1);
          const speed = 230 * scale * Math.sin(u) * (0.9 + Math.random() * 0.15);
          spark(x, y, Math.cos(a) * speed, Math.sin(a) * speed, {
            color: i % 5 === 0 ? inks[1] : inks[0], decay: 0.55 + Math.random() * 0.2, trail: 7, size: 1.7
          });
        }
      } else if (type === 'botan') {
        count = 110;
        for (let i = 0; i < count; i++) {
          const a = Math.random() * Math.PI * 2;
          const u = Math.acos(Math.random() * 2 - 1);
          const speed = 210 * scale * Math.sin(u);
          spark(x, y, Math.cos(a) * speed, Math.sin(a) * speed, {
            color: i % 2 ? inks[0] : inks[1], decay: 0.7 + Math.random() * 0.3, size: 2.4, flicker: true
          });
        }
      } else if (type === 'shidare') {
        // the willow: few stars, long life, heavy drag, they hang and then fall
        count = 70;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          const speed = 190 * scale * (0.85 + Math.random() * 0.25);
          spark(x, y, Math.cos(a) * speed, Math.sin(a) * speed, {
            color: i % 4 === 0 ? '#ffffff' : '#c9d6f0', decay: 0.28 + Math.random() * 0.08,
            drag: 0.955, gravity: 70, trail: 16, size: 1.3
          });
        }
      } else if (type === 'ring') {
        count = 64;
        const tilt = 0.35 + Math.random() * 0.5;
        const rot = Math.random() * Math.PI;
        for (let i = 0; i < count; i++) {
          const a = (i / count) * Math.PI * 2;
          const rx = Math.cos(a) * 220 * scale;
          const ry = Math.sin(a) * 220 * scale * tilt;
          spark(x, y, rx * Math.cos(rot) - ry * Math.sin(rot), rx * Math.sin(rot) + ry * Math.cos(rot), {
            color: inks[0], decay: 0.7, trail: 5, size: 2
          });
        }
        for (let i = 0; i < 24; i++) {
          const a = Math.random() * Math.PI * 2;
          spark(x, y, Math.cos(a) * 60 * scale, Math.sin(a) * 60 * scale, { color: inks[1], decay: 0.9, size: 2 });
        }
      } else {
        // senrin: a loose sphere whose stars each go off again, small
        count = 26;
        for (let i = 0; i < count; i++) {
          const a = Math.random() * Math.PI * 2;
          const speed = (90 + Math.random() * 120) * scale;
          spark(x, y, Math.cos(a) * speed, Math.sin(a) * speed, {
            color: inks[1], decay: 1.6 + Math.random() * 0.8, trail: 3, size: 1.6, child: inks[0]
          });
        }
      }
      sound.burst(type === 'shidare' ? 1.1 : 0.9, distance);
      sound.crackle(type === 'senrin' ? 24 : type === 'botan' ? 10 : 4, distance);
    }

    function launch(x, y, type) {
      if (x == null) x = w * (0.15 + Math.random() * 0.7);
      if (y == null) y = h * (0.15 + Math.random() * 0.3);
      type = type || pick(TYPES);
      const inks = pick(INKS);
      if (reduced) {
        burst(x, y, type, inks);
        // a still: let the burst open fully, then paint it once
        for (let i = 0; i < 24; i++) step(1 / 30);
        draw(0);
        return;
      }
      const sx = x + (Math.random() - 0.5) * 60;
      const flight = 1 + Math.random() * 0.3;
      rockets.push({
        x: sx, y: h + 10, tx: x, ty: y, sx: sx, sy: h + 10, t: 0, flight: flight, type: type, inks: inks
      });
      start();
    }

    function finale() {
      const types = TYPES.concat(TYPES).concat(['shidare', 'kiku']);
      types.forEach(function (type, i) {
        window.setTimeout(function () {
          launch(w * (0.1 + Math.random() * 0.8), h * (0.12 + Math.random() * 0.3), type);
        }, i * 260);
      });
    }

    function step(dt) {
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.t += dt / r.flight;
        const e = 1 - Math.pow(1 - Math.min(1, r.t), 2.2); // slows as it climbs
        const nx = r.sx + (r.tx - r.sx) * e;
        const ny = r.sy + (r.ty - r.sy) * e;
        // the rising shell sheds a few sparks
        spark(nx, ny, (Math.random() - 0.5) * 20, 30 + Math.random() * 30, {
          color: '#c9d6f0', decay: 2.2, size: 1.1, gravity: 20
        });
        r.x = nx;
        r.y = ny;
        if (r.t >= 1) {
          rockets.splice(i, 1);
          burst(r.x, r.y, r.type, r.inks);
        }
      }
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.px = s.x;
        s.py = s.y;
        s.vx *= Math.pow(s.drag, dt * 60);
        s.vy = s.vy * Math.pow(s.drag, dt * 60) + s.gravity * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.trail) {
          if (!s.hist) s.hist = [];
          s.hist.push(s.x, s.y);
          if (s.hist.length > s.trail * 2) s.hist.splice(0, 2);
        }
        s.life -= s.decay * dt;
        if (s.life <= 0) {
          if (s.child) {
            for (let k = 0; k < 7; k++) {
              const a = Math.random() * Math.PI * 2;
              spark(s.x, s.y, Math.cos(a) * 45, Math.sin(a) * 45, { color: s.child, decay: 2.4, size: 1.2, flicker: true });
            }
          }
          sparks.splice(i, 1);
        }
      }
      for (let i = flashes.length - 1; i >= 0; i--) {
        flashes[i].life -= dt * 3;
        if (flashes[i].life <= 0) flashes.splice(i, 1);
      }
    }

    function draw(time) {
      ctx.clearRect(0, 0, w, h);
      if (stars.length) {
        ctx.fillStyle = '#dfe7f7';
        stars.forEach(function (st) {
          ctx.globalAlpha = 0.35 + 0.35 * Math.sin(time / 1300 + st.p);
          ctx.fillRect(st.x, st.y, st.r, st.r);
        });
        ctx.globalAlpha = 1;
      }
      ctx.globalCompositeOperation = 'lighter';
      flashes.forEach(function (f) {
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r);
        g.addColorStop(0, 'rgba(142, 171, 227, ' + (0.22 * f.life).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(142, 171, 227, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2);
      });
      sparks.forEach(function (s) {
        let alpha = Math.max(0, Math.min(1, s.life * 1.4));
        if (s.flicker && Math.random() < 0.25) alpha *= 0.3;
        ctx.globalAlpha = alpha;
        if (s.hist && s.hist.length > 2) {
          ctx.strokeStyle = s.color;
          ctx.lineWidth = s.size * 0.8;
          ctx.beginPath();
          ctx.moveTo(s.hist[0], s.hist[1]);
          for (let k = 2; k < s.hist.length; k += 2) ctx.lineTo(s.hist[k], s.hist[k + 1]);
          ctx.stroke();
        }
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size * (0.6 + alpha * 0.5), 0, Math.PI * 2);
        ctx.fill();
      });
      rockets.forEach(function (r) {
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    function loop(time) {
      const dt = Math.min(0.05, (time - (last || time)) / 1000);
      last = time;
      if (opts.auto && time > nextAuto) {
        nextAuto = time + (opts.auto * 0.6 + Math.random() * opts.auto * 0.8) * 1000;
        if (nextAuto && rockets.length + sparks.length < opts.max * 0.5) launch();
      }
      step(dt);
      draw(time);
      const idle = !rockets.length && !sparks.length && !flashes.length;
      if (idle && !opts.auto && !stars.length) {
        frame = 0;
        return;
      }
      frame = window.requestAnimationFrame(loop);
    }

    function start() {
      if (reduced || frame || !visible || document.hidden) return;
      last = 0;
      frame = window.requestAnimationFrame(loop);
    }

    function stop() {
      window.cancelAnimationFrame(frame);
      frame = 0;
    }

    resize();
    draw(0);
    nextAuto = window.performance.now() + 1200;
    if (opts.auto || opts.stars) start();

    window.addEventListener('resize', function () {
      resize();
      draw(window.performance.now());
    });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) stop();
      else start();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) start();
        else stop();
      }).observe(canvas);
    }

    return { launch: launch, finale: finale, resize: resize };
  }

  /* ------------------------------------------------------------ sparkler */

  // senko hanabi: the pointer throws a few short, branching sparks as it moves
  function sparkler() {
    if (reduced || coarse) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'senko';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const bits = [];
    let w = 0;
    let h = 0;
    let frame = 0;
    let last = 0;
    let px = -1;
    let py = -1;

    function resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function loop(time) {
      const dt = Math.min(0.05, (time - (last || time)) / 1000);
      last = time;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = bits.length - 1; i >= 0; i--) {
        const b = bits[i];
        b.life -= dt * 3.2;
        if (b.life <= 0) {
          bits.splice(i, 1);
          continue;
        }
        const nx = b.x + b.vx * dt;
        const ny = b.y + b.vy * dt;
        b.vy += 120 * dt;
        ctx.strokeStyle = 'rgba(223, 231, 247, ' + b.life.toFixed(2) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(nx, ny);
        // pine-needle branches (matsuba): a short fork near the end of life
        if (b.life < 0.5 && b.fork) {
          ctx.moveTo(nx, ny);
          ctx.lineTo(nx + b.vy * 0.02, ny - b.vx * 0.02);
        }
        ctx.stroke();
        b.x = nx;
        b.y = ny;
      }
      ctx.globalCompositeOperation = 'source-over';
      if (bits.length) {
        frame = window.requestAnimationFrame(loop);
      } else {
        frame = 0;
        ctx.clearRect(0, 0, w, h);
      }
    }

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', function (event) {
      if (event.pointerType !== 'mouse') return;
      const moved = px < 0 ? 0 : Math.hypot(event.clientX - px, event.clientY - py);
      px = event.clientX;
      py = event.clientY;
      const n = Math.min(4, Math.floor(moved / 10));
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = 40 + Math.random() * 110;
        bits.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 0.5 + Math.random() * 0.5, fork: Math.random() < 0.5 });
      }
      if (bits.length > 160) bits.splice(0, bits.length - 160);
      if (!frame && bits.length) {
        last = 0;
        frame = window.requestAnimationFrame(loop);
      }
    }, { passive: true });
  }

  /* -------------------------------------------------------------- strips */

  function strips() {
    document.querySelectorAll('[data-hanabi]').forEach(function (strip) {
      const canvas = strip.querySelector('canvas');
      if (!canvas) return;
      const show = create(canvas, { auto: 5, stars: 60 });
      const hint = strip.querySelector('[hidden]');
      if (hint) hint.hidden = false;
      strip.addEventListener('click', function (event) {
        const box = canvas.getBoundingClientRect();
        show.launch(event.clientX - box.left, event.clientY - box.top);
        strip.classList.add('is-played');
      });
      window.setTimeout(function () {
        show.launch(null, null, 'shidare');
      }, 700);
    });
  }

  window.Hanabi = { create: create, sound: sound, reduced: reduced };

  strips();
  if (document.documentElement.classList.contains('theme-dark')) sparkler();
})();
