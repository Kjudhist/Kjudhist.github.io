/* ==========================================================================
   Shared behaviour: local links, page transitions, scroll reveals,
   sticky header, mobile menu, current-section highlight.
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

  // Fade to the next page's colour, then go. tone: "light" | "dark".
  function leaveTo(url, tone) {
    const veil = ensureVeil();
    veil.setAttribute('data-tone', tone === 'light' ? 'light' : 'dark');
    void veil.offsetWidth; // let the tone land before the fade starts
    root.classList.add('is-leaving');
    return wait(prefersReducedMotion() ? LEAVE_MS_REDUCED : LEAVE_MS).then(function () {
      window.location.assign(url);
    });
  }

  /* ------------------------------------------------------------------------
     Lite mode: a device that can't keep up gets a calmer page.
     The paper grain, frosted header and ambient loops go; doors, scroll and
     viewer stay. ?fx=lite or ?fx=full forces it for the rest of the visit.
     ------------------------------------------------------------------------ */

  const FX_KEY = 'kjg-fx';

  function readFx() {
    try {
      return window.sessionStorage.getItem(FX_KEY);
    } catch (e) {
      return null;
    }
  }

  function saveFx(value) {
    try {
      window.sessionStorage.setItem(FX_KEY, value);
    } catch (e) {
      // private mode: decide again on the next page
    }
  }

  function isLite() {
    return root.classList.contains('fx-lite');
  }

  function goLite(reason) {
    if (isLite()) return;
    root.classList.add('fx-lite');
    root.setAttribute('data-fx', reason);
    saveFx('lite');
    document.dispatchEvent(new CustomEvent('fxlite'));
  }

  // Hints the browser gives away for free.
  function lowPowerHint() {
    const nav = window.navigator;
    if (nav.connection && nav.connection.saveData) return 'save-data';
    if (nav.deviceMemory && nav.deviceMemory <= 2) return 'low-memory';
    if (nav.hardwareConcurrency && nav.hardwareConcurrency <= 2) return 'few-cores';
    return '';
  }

  // Watch up to 1.5s of frames once the page has settled. A median under
  // ~40fps, or lots of long frames, means the effects cost more than they're
  // worth. Phones in battery saver cap at 30fps and land here too, which is fine.
  function probeFrames() {
    const intervals = [];
    let first = 0;
    let prev = 0;
    function tick(now) {
      if (document.hidden) {
        document.addEventListener('visibilitychange', probeFrames, { once: true });
        return;
      }
      if (prev) intervals.push(now - prev);
      else first = now;
      prev = now;
      if (intervals.length < 90 && now - first < 1500) {
        window.requestAnimationFrame(tick);
        return;
      }
      // barely a handful of frames in 1.5s says it all
      if (intervals.length < 20) {
        goLite('slow-frames');
        return;
      }
      const sorted = intervals.slice().sort(function (a, b) {
        return a - b;
      });
      const median = sorted[Math.floor(sorted.length / 2)];
      const long = intervals.filter(function (ms) {
        return ms > 50;
      }).length;
      if (median > 25 || long > intervals.length * 0.2) goLite('slow-frames');
    }
    window.requestAnimationFrame(tick);
  }

  function initFx() {
    const forced = new URLSearchParams(window.location.search).get('fx');
    if (forced === 'lite' || forced === 'full') saveFx(forced);
    const saved = readFx();
    if (saved === 'lite') {
      goLite(forced ? 'forced' : 'remembered');
      return;
    }
    if (saved === 'full' || prefersReducedMotion()) return;
    const hint = lowPowerHint();
    if (hint) {
      goLite(hint);
      return;
    }
    const settle = function () {
      window.setTimeout(probeFrames, 1200);
    };
    if (document.readyState === 'complete') settle();
    else window.addEventListener('load', settle, { once: true });
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

  function initHeader() {
    const header = document.querySelector('.topbar--sticky');
    if (!header) return;
    const update = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
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

  function init() {
    initFx();
    fixLocalLinks();
    initPageTransitions();
    initReveal();
    initHeader();
    initMenu();
    initSectionSpy();
    window.addEventListener('pageshow', resetAfterBack);
  }

  window.site = {
    prefersReducedMotion: prefersReducedMotion,
    isLite: isLite,
    wait: wait,
    leaveTo: leaveTo,
    fixLocalLinks: fixLocalLinks,
    ensureVeil: ensureVeil
  };

  init();
})();
