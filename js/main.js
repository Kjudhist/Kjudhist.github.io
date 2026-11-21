/* ==========================================================================
   Shared behaviour: local links, page transitions (a noren drops and lifts),
   scroll reveals, mobile menu, current-section highlight, the clock, the
   willow, and strings of paper lanterns that swing and light.
   ========================================================================== */

(function () {
  'use strict';

  const root = document.documentElement;
  const LEAVE_MS = 850;
  const LEAVE_MS_REDUCED = 300;

  function prefersReducedMotion() {
    return Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  // Opened from disk, a folder link like "qa/" shows a directory listing
  // instead of the page. Point those at index.html. The live site keeps clean URLs.
  function fixLocalLinks(scope) {
    if (window.location.protocol !== 'file:') return;
    (scope || document).querySelectorAll('a[href]').forEach(function (a) {
      const href = a.getAttribute('href');
      if (!href || /^(#|[a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) return;
      const match = href.match(/^([^?#]*)(.*)$/);
      const path = match[1];
      const rest = match[2];
      if (!path) return;
      if (path.endsWith('/')) {
        a.setAttribute('href', path + 'index.html' + rest);
      } else if (path === '.' || path === '..') {
        a.setAttribute('href', path + '/index.html' + rest);
      }
    });
  }

  function ensureVeil() {
    let veil = document.querySelector('.veil');
    if (!veil) {
      veil = document.createElement('div');
      veil.className = 'veil';
      veil.setAttribute('aria-hidden', 'true');
      document.body.appendChild(veil);
    }
    return veil;
  }

  // A noren in the next page's tone drops over this one, then go. tone: "light" | "dark".
  function leaveTo(url, tone) {
    const veil = ensureVeil();
    veil.setAttribute('data-tone', tone === 'light' ? 'light' : 'dark');
    void veil.offsetWidth; // let the tone land before the fade starts
    root.classList.add('is-leaving');
    // The next page picks the veil up where this one leaves it (see js/i18n.js).
    try {
      window.sessionStorage.setItem('kjg-veil', tone === 'light' ? 'light' : 'dark');
    } catch (e) {
      // no storage: the next page simply fades in
    }
    return wait(prefersReducedMotion() ? LEAVE_MS_REDUCED : LEAVE_MS).then(function () {
      window.location.assign(url);
    });
  }

  function isPlainLeftClick(event) {
    return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
  }

  function initPageTransitions() {
    document.addEventListener('click', function (event) {
      const link = event.target.closest('a[data-transition]');
      if (!link || event.defaultPrevented || !isPlainLeftClick(event)) return;
      if (link.target && link.target !== '_self') return;
      event.preventDefault();
      leaveTo(link.href, link.getAttribute('data-transition'));
    });
  }

  // Coming back via the back button restores the page from cache with the veil still up.
  function resetAfterBack(event) {
    if (event.persisted) root.classList.remove('is-leaving');
  }

  function initReveal() {
    const items = document.querySelectorAll('[data-reveal]');
    if (!items.length) return;
    if (!('IntersectionObserver' in window)) {
      items.forEach(function (el) {
        el.classList.add('is-visible');
      });
      return;
    }
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0 });
    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  // A live clock for Jakarta, for anything marked [data-clock].
  function initClock() {
    const clocks = document.querySelectorAll('[data-clock]');
    if (!clocks.length || !window.Intl) return;
    const format = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false });
    function tick() {
      const text = format.format(new Date());
      clocks.forEach(function (el) {
        el.textContent = text;
      });
    }
    tick();
    window.setInterval(tick, 15000);
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  // The willow leans a little toward the pointer: --lean runs from -1 to 1.
  function initWillow() {
    const willows = document.querySelectorAll('[data-willow]');
    if (!willows.length || prefersReducedMotion()) return;
    if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    let pointerX = 0;
    let queued = false;
    function update() {
      queued = false;
      willows.forEach(function (el) {
        const box = el.getBoundingClientRect();
        el.style.setProperty('--lean', clamp((pointerX - (box.left + box.width / 2)) / (window.innerWidth / 2), -1, 1).toFixed(3));
      });
    }
    window.addEventListener('pointermove', function (event) {
      pointerX = event.clientX;
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
  }

  // Chochin: a string of paper lanterns hung on a sagging rope. Brush past one
  // and it swings (a damped spring on its angle); click it to light or put it
  // out. When every lantern on a string is lit, the string says so with a
  // "lanterns:alllit" event (the gate answers with fireworks).
  function initLanterns() {
    const reduced = prefersReducedMotion();
    document.querySelectorAll('[data-lanterns]').forEach(function (string) {
      const lanterns = Array.from(string.querySelectorAll('[data-lantern]'));
      const rope = string.querySelector('.lanterns__rope');
      const path = rope && rope.querySelector('path');
      const state = lanterns.map(function () {
        return { a: 0, v: 0 };
      });
      let running = false;
      let last = 0;
      let px = null;
      let py = null;
      let pt = 0;

      function layout() {
        const w = string.clientWidth;
        const sag = Math.min(54, Math.max(18, w * 0.035));
        const n = lanterns.length;
        lanterns.forEach(function (el, i) {
          const f = (i + 0.5) / n;
          el.style.left = (f * 100).toFixed(3) + '%';
          el.style.top = (4 * sag * f * (1 - f)).toFixed(1) + 'px';
        });
        if (rope && path) {
          rope.setAttribute('viewBox', '0 0 ' + w + ' ' + (sag * 2 + 4));
          rope.style.height = (sag * 2 + 4) + 'px';
          path.setAttribute('d', 'M0,1 Q' + w / 2 + ',' + (sag * 2 + 1) + ' ' + w + ',1');
        }
      }

      function frame(time) {
        const dt = Math.min(0.05, (time - (last || time)) / 1000);
        last = time;
        let moving = false;
        state.forEach(function (s, i) {
          s.v += (-38 * s.a - 3.2 * s.v) * dt;
          s.a += s.v * dt;
          if (Math.abs(s.a) > 0.05 || Math.abs(s.v) > 0.05) moving = true;
          lanterns[i].style.setProperty('--swing', s.a.toFixed(2) + 'deg');
        });
        if (moving) {
          window.requestAnimationFrame(frame);
        } else {
          running = false;
        }
      }

      function kick() {
        if (running || reduced) return;
        running = true;
        last = 0;
        window.requestAnimationFrame(frame);
      }

      window.addEventListener('pointermove', function (event) {
        const now = window.performance.now();
        if (px !== null && now - pt < 100) {
          const vx = (event.clientX - px) / Math.max(1, now - pt) * 1000;
          lanterns.forEach(function (el, i) {
            const box = el.getBoundingClientRect();
            if (event.clientX > box.left - 12 && event.clientX < box.right + 12 &&
                event.clientY > box.top - 8 && event.clientY < box.bottom + 8) {
              state[i].v = clamp(state[i].v + vx * 0.06, -160, 160);
              kick();
            }
          });
        }
        px = event.clientX;
        py = event.clientY;
        pt = now;
      }, { passive: true });

      lanterns.forEach(function (el, i) {
        el.addEventListener('click', function (event) {
          event.stopPropagation();
          el.classList.toggle('is-lit');
          state[i].v += (Math.random() < 0.5 ? -1 : 1) * 90;
          kick();
          if (lanterns.every(function (l) {
            return l.classList.contains('is-lit');
          })) {
            string.classList.add('is-all-lit');
            string.dispatchEvent(new CustomEvent('lanterns:alllit', { bubbles: true }));
          } else {
            string.classList.remove('is-all-lit');
          }
        });
      });

      layout();
      window.addEventListener('resize', layout);
    });
  }

  function initMenu() {
    const nav = document.querySelector('[data-nav]');
    const toggle = nav && nav.querySelector('.nav__toggle');
    if (!toggle) return;

    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    }

    toggle.addEventListener('click', function () {
      setOpen(!nav.classList.contains('is-open'));
    });
    nav.addEventListener('click', function (event) {
      if (event.target.closest('.nav__link')) setOpen(false);
    });
    document.addEventListener('click', function (event) {
      if (!nav.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setOpen(false);
        toggle.focus();
      }
    });
  }

  // Marks the nav link for whichever section sits in the middle of the screen.
  function initSectionSpy() {
    const links = Array.from(document.querySelectorAll('.nav__link[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    const byId = new Map();
    links.forEach(function (link) {
      const section = document.getElementById(link.getAttribute('href').slice(1));
      if (section) byId.set(section, link);
    });
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        const link = byId.get(entry.target);
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach(function (other) {
            other.removeAttribute('aria-current');
          });
          link.setAttribute('aria-current', 'true');
        } else if (link.getAttribute('aria-current')) {
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    byId.forEach(function (_, section) {
      observer.observe(section);
    });
  }

  // Arriving under the previous page's veil (set up in js/i18n.js): wait until
  // this page has painted a frame under it, then let it slide off.
  function initArrival() {
    if (!root.classList.contains('is-arriving')) return;
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        root.classList.add('is-arrived');
      });
    });
  }

  function init() {
    initArrival();
    fixLocalLinks();
    initPageTransitions();
    initReveal();
    initWillow();
    initLanterns();
    initMenu();
    initSectionSpy();
    initClock();
    window.addEventListener('pageshow', resetAfterBack);
  }

  window.site = {
    prefersReducedMotion: prefersReducedMotion,
    wait: wait,
    leaveTo: leaveTo,
    fixLocalLinks: fixLocalLinks,
    ensureVeil: ensureVeil
  };

  init();
})();
