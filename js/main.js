/* ==========================================================================
   Shared behaviour: local links, page transitions (screens closing and
   opening), scroll reveals, mobile menu, current-section highlight, the
   clock, the lantern and its shadows, the engawa screens, the 404 wall.
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

  // A pair of screens in the next page's tone slides shut, then go. tone: "light" | "dark".
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

  // The lantern: a soft light under the page that follows the pointer (or the
  // last touch) a little behind it. The willow leans toward it (--lean, -1 to 1)
  // and every shadow on the paper slides away from it (--sx, --sy).
  function initLantern() {
    const lantern = document.createElement('div');
    lantern.className = 'lantern';
    lantern.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(lantern, document.body.firstChild);
    if (prefersReducedMotion()) return;

    const willows = Array.from(document.querySelectorAll('[data-willow]'));
    const casts = Array.from(document.querySelectorAll('[data-shadow]'));
    const target = { x: window.innerWidth * 0.72, y: window.innerHeight * 0.18 };
    const light = { x: target.x, y: target.y };
    let running = false;
    let lastShade = 0;

    function shade() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      willows.forEach(function (el) {
        const box = el.getBoundingClientRect();
        const lean = clamp((light.x - (box.left + box.width / 2)) / (w / 2), -1, 1);
        el.style.setProperty('--lean', lean.toFixed(3));
        el.style.setProperty('--sx', ((box.left + box.width / 2 - light.x) / w * 22).toFixed(1) + 'px');
        el.style.setProperty('--sy', (clamp((box.top - light.y) / h, -1, 1) * 8).toFixed(1) + 'px');
      });
      casts.forEach(function (el) {
        const box = el.parentNode.parentNode.getBoundingClientRect();
        el.style.setProperty('--sx', ((box.left + box.width / 2 - light.x) / w * 26).toFixed(1) + 'px');
        el.style.setProperty('--sy', ((box.top + box.height / 3 - light.y) / h * 12).toFixed(1) + 'px');
      });
    }

    function frame(now) {
      light.x += (target.x - light.x) * 0.14;
      light.y += (target.y - light.y) * 0.14;
      lantern.style.setProperty('--lx', light.x.toFixed(1) + 'px');
      lantern.style.setProperty('--ly', light.y.toFixed(1) + 'px');
      // shadows ease on their own (CSS transition), so they need fewer updates
      if (now - lastShade > 90) {
        lastShade = now;
        shade();
      }
      if (Math.abs(target.x - light.x) > 0.5 || Math.abs(target.y - light.y) > 0.5) {
        window.requestAnimationFrame(frame);
      } else {
        running = false;
        shade();
      }
    }

    function moveTo(x, y) {
      target.x = x;
      target.y = y;
      if (running) return;
      running = true;
      window.requestAnimationFrame(frame);
    }

    window.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') moveTo(event.clientX, event.clientY);
    }, { passive: true });
    window.addEventListener('pointerdown', function (event) {
      moveTo(event.clientX, event.clientY);
    }, { passive: true });
    window.addEventListener('scroll', function () {
      if (!running) shade();
    }, { passive: true });
    shade();
  }

  // The engawa: the middle pair of four screens slides open once the page is
  // up. Either one can be dragged; it stays wherever it is let go.
  function initEngawa() {
    document.querySelectorAll('[data-engawa]').forEach(function (strip) {
      const panels = Array.from(strip.querySelectorAll('.engawa__panel[data-panel="1"], .engawa__panel[data-panel="2"]'));
      const opening = prefersReducedMotion() ? 0 : 700;
      window.setTimeout(function () {
        panels.forEach(function (panel) {
          panel.style.setProperty('--o', '1');
        });
      }, opening);

      let drag = null;
      panels.forEach(function (panel) {
        const dir = panel.getAttribute('data-panel') === '1' ? -1 : 1;
        panel.addEventListener('pointerdown', function (event) {
          if (event.button !== 0) return;
          drag = {
            panel: panel,
            dir: dir,
            x: event.clientX,
            y: event.clientY,
            start: parseFloat(panel.style.getPropertyValue('--o')) || 0,
            width: panel.getBoundingClientRect().width,
            id: event.pointerId,
            active: false
          };
        });
      });
      strip.addEventListener('pointermove', function (event) {
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
          strip.classList.add('is-dragging');
          try {
            drag.panel.setPointerCapture(drag.id);
          } catch (e) {
            // capture is a nicety
          }
        }
        const value = clamp(drag.start + (dx * drag.dir) / drag.width, 0, 1);
        drag.panel.style.setProperty('--o', value.toFixed(3));
      });
      function end() {
        drag = null;
        strip.classList.remove('is-dragging');
      }
      strip.addEventListener('pointerup', end);
      strip.addEventListener('pointercancel', end);
    });
  }

  // The 404 wall: every click or tap pokes another hole in the paper. The
  // holes are cut with one mask layer each, intersected.
  function initPoke() {
    const wall = document.querySelector('[data-poke] .poke__wall');
    const paper = wall && wall.querySelector('[data-paper]');
    if (!paper) return;
    const MAX = 40;
    const holes = [{ x: 0.64, y: 0.48, rx: 46, ry: 38 }];

    function tear(hole) {
      const ring = document.createElement('span');
      ring.className = 'poke__tear';
      ring.style.left = (hole.x * 100).toFixed(2) + '%';
      ring.style.top = (hole.y * 100).toFixed(2) + '%';
      ring.style.width = hole.rx * 2 + 'px';
      ring.style.height = hole.ry * 2 + 'px';
      wall.appendChild(ring);
    }

    function cut() {
      const layers = holes.map(function (h) {
        return 'radial-gradient(ellipse ' + h.rx + 'px ' + h.ry + 'px at ' + (h.x * 100).toFixed(2) + '% ' +
          (h.y * 100).toFixed(2) + '%, transparent 94%, #000 100%)';
      }).join(', ');
      paper.style.webkitMaskImage = layers;
      paper.style.maskImage = layers;
    }

    tear(holes[0]);
    wall.addEventListener('click', function (event) {
      if (holes.length >= MAX) return;
      const box = wall.getBoundingClientRect();
      const rx = Math.round(18 + Math.random() * 26);
      const hole = {
        x: (event.clientX - box.left) / box.width,
        y: (event.clientY - box.top) / box.height,
        rx: rx,
        ry: Math.round(rx * (0.75 + Math.random() * 0.35))
      };
      holes.push(hole);
      cut();
      tear(hole);
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
    initLantern();
    initEngawa();
    initPoke();
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
