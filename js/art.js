/* ==========================================================================
   The atelier (and the worlds, which borrow parts of it).

   - Bowl:     the chawan in the hero (Kintsugi.Vessel). Tap it to shatter
               it; press and hold to pull the shards home; once whole, the
               cracks fill with gold, which stays: more gold every time.
               A button does the same for keyboards.
   - Dust:     gold dust drifting toward the pointer, over the whole page.
   - Crackle:  the index and link tiles crackle with gold from wherever the
               pointer comes in (or from the middle, on focus).
   - Viewer:   opens a piece full size: any [data-view] button with an <img>
               inside, carrying data-title and data-meta for the caption.
   ========================================================================== */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const K = window.Kintsugi;

  function initBowl() {
    const canvas = document.querySelector('[data-bowl]');
    const ui = document.querySelector('[data-bowl-ui]');
    if (!canvas || !ui || !K) return;
    const hint = ui.querySelector('[data-bowl-hint]');
    const button = ui.querySelector('[data-bowl-btn]');
    const label = button.querySelector('span');
    const count = ui.querySelector('[data-bowl-count]');
    const HINTS = {
      whole: 'art.bowl.hint',
      broken: 'art.bowl.hold',
      mending: 'art.bowl.mending',
      gilding: 'art.bowl.gilding'
    };

    function update(state, mended) {
      let key = HINTS[state];
      if (state === 'whole' && mended) key = 'art.bowl.again';
      hint.setAttribute('data-i18n', key);
      hint.textContent = K.t(key);
      const action = state === 'whole' ? 'art.bowl.break' : 'art.bowl.mend';
      label.setAttribute('data-i18n', action);
      label.textContent = K.t(action);
      button.disabled = state === 'gilding' || state === 'mending';
      count.textContent = String(mended);
    }

    const vessel = K.Vessel(canvas, {
      shape: 'bowl',
      spot: document.querySelector('[data-bowl-spot]'),
      pieces: 22,
      seed: 11,
      onState: update
    });
    button.addEventListener('click', function () {
      if (vessel.state === 'whole') vessel.shatter();
      else vessel.mend();
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(vessel.redraw);
    ui.hidden = false;
  }

  // Gold dust drifting toward the pointer. Pauses with the tab.
  function initDust() {
    if (reduced || !K) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'dust';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const fine = window.matchMedia('(pointer: fine)').matches;
    const N = fine ? 70 : 34;
    let view = K.fit(canvas);
    const pointer = { x: view.w * 0.7, y: view.h * 0.4, on: false };
    const motes = [];
    for (let i = 0; i < N; i++) {
      motes.push({
        x: Math.random() * view.w,
        y: Math.random() * view.h,
        vx: 0,
        vy: 0,
        r: 0.5 + Math.random() * 1.4,
        tw: Math.random() * 6.28,
        k: 0.4 + Math.random() * 0.8
      });
    }
    window.addEventListener('pointermove', function (event) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.on = event.pointerType === 'mouse';
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', function () {
      pointer.on = false;
    });
    window.addEventListener('resize', function () {
      view = K.fit(canvas);
    });
    let last = 0;
    K.loop(null, function (time) {
      const dt = Math.min(0.05, (time - (last || time)) / 1000);
      last = time;
      const d = view.dpr;
      ctx.setTransform(d, 0, 0, d, 0, 0);
      ctx.clearRect(0, 0, view.w, view.h);
      ctx.globalCompositeOperation = 'lighter';
      motes.forEach(function (m) {
        if (pointer.on) {
          const dx = pointer.x - m.x;
          const dy = pointer.y - m.y;
          const dist = Math.hypot(dx, dy) + 40;
          // drawn in, and swirled round
          m.vx += ((dx / dist) * 60 - (dy / dist) * 30) * m.k * dt;
          m.vy += ((dy / dist) * 60 + (dx / dist) * 30) * m.k * dt;
        }
        m.vx *= Math.pow(0.35, dt);
        m.vy *= Math.pow(0.35, dt);
        m.x += (m.vx + Math.sin(time * 0.0004 + m.tw) * 3) * dt;
        m.y += (m.vy - 6) * dt;
        if (m.y < -10) m.y = view.h + 10;
        if (m.y > view.h + 10) m.y = -10;
        if (m.x < -10) m.x = view.w + 10;
        if (m.x > view.w + 10) m.x = -10;
        const a = 0.35 + 0.3 * Math.sin(m.tw + time * 0.002);
        ctx.fillStyle = 'rgba(240, 205, 130, ' + Math.max(0.05, a).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, 6.283);
        ctx.fill();
      });
    }).start();
  }

  // Gold crackle across a tile, from the point the pointer came in.
  function initCrackle() {
    if (!K) return;
    const NS = 'http://www.w3.org/2000/svg';
    document.querySelectorAll('.index__link, .card').forEach(function (tile) {
      let svg = null;
      let fade = 0;
      let seed = 1;

      function crack(x, y) {
        window.clearTimeout(fade);
        if (svg) svg.remove();
        const w = tile.clientWidth;
        const h = tile.clientHeight;
        seed += 1;
        const lines = K.cracks(x, y, {
          rand: K.rng(seed * 131 + w),
          count: 4,
          len: Math.max(w, h) * 0.7,
          step: 11,
          branch: 0.22,
          wander: 0.8,
          inside: function (px, py) {
            return px > -2 && py > -2 && px < w + 2 && py < h + 2;
          }
        });
        svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('class', 'crackle');
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        const paths = lines.map(function (line) {
          const path = document.createElementNS(NS, 'path');
          path.setAttribute('d', 'M' + line.map(function (p) {
            return p.x.toFixed(1) + ' ' + p.y.toFixed(1);
          }).join('L'));
          const len = line[line.length - 1].d - line[0].d + 2;
          path.style.strokeDasharray = len + ' ' + len;
          path.style.strokeDashoffset = reduced ? '0' : String(len);
          path.style.transitionDelay = (line[0].d / 400).toFixed(2) + 's';
          svg.appendChild(path);
          return path;
        });
        tile.insertBefore(svg, tile.firstChild);
        if (!reduced) {
          void svg.getBoundingClientRect();
          paths.forEach(function (path) {
            path.style.strokeDashoffset = '0';
          });
        }
      }

      function heal() {
        if (!svg) return;
        const old = svg;
        old.classList.add('is-fading');
        fade = window.setTimeout(function () {
          old.remove();
          if (svg === old) svg = null;
        }, 650);
      }

      tile.addEventListener('pointerenter', function (event) {
        const b = tile.getBoundingClientRect();
        crack(event.clientX - b.left, event.clientY - b.top);
      });
      tile.addEventListener('pointerleave', heal);
      tile.addEventListener('focus', function () {
        crack(tile.clientWidth / 2, tile.clientHeight / 2);
      });
      tile.addEventListener('blur', heal);
    });
  }

  function initViewer() {
    const dialog = document.querySelector('[data-viewer]');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    const img = dialog.querySelector('[data-viewer-img]');
    const title = dialog.querySelector('[data-viewer-title]');
    const meta = dialog.querySelector('[data-viewer-meta]');
    let opener = null;
    let closing = 0;

    function open(button) {
      const source = button.querySelector('img');
      if (!source) return;
      img.src = button.getAttribute('data-full') || source.currentSrc || source.src;
      img.alt = source.alt;
      title.textContent = button.getAttribute('data-title') || '';
      meta.textContent = button.getAttribute('data-meta') || '';
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
      }, 340);
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

  initViewer();
  initBowl();
  initDust();
  initCrackle();
})();
