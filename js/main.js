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
    wait: wait,
    leaveTo: leaveTo,
    fixLocalLinks: fixLocalLinks,
    ensureVeil: ensureVeil
  };

  init();
})();
