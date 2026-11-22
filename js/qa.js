/* ==========================================================================
   QA page: the experience runs as a test suite.

   "Run checks" walks every role and entry in order: each one is marked
   running, its fields light up one by one as they are asserted, and it gets
   a gold 合格 (passed) seal. A role can be re-run on its own by clicking it. The
   summary line is announced politely. Also: a Copy button for the email, and
   a reading line drawn as a gold seam along the top.
   Nothing here hides content; without scripts the page is the same, minus
   the runner.
   ========================================================================== */

(function () {
  'use strict';

  const reduced = window.site ? window.site.prefersReducedMotion() : false;
  const STEP_MS = reduced ? 0 : 90;   // per field asserted
  const GAP_MS = reduced ? 0 : 90;    // between cases

  function t(key, vars) {
    let text = window.i18n ? window.i18n.t(key) : key;
    Object.keys(vars || {}).forEach(function (name) {
      text = text.replace('{' + name + '}', vars[name]);
    });
    return text;
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function initRunner() {
    const runner = document.querySelector('[data-runner]');
    if (!runner) return;
    const button = runner.querySelector('[data-run]');
    const label = button.querySelector('span');
    const fill = runner.querySelector('[data-fill]');
    const out = runner.querySelector('[data-out]');
    const cases = Array.from(document.querySelectorAll('#experience .row, #experience .entry'));
    const total = cases.length;
    let running = false;
    let status = { key: 'qa.run.idle', vars: {} };

    function say(key, vars) {
      status = { key: key, vars: vars || {} };
      out.textContent = t(key, vars);
    }

    // the summary and button follow the language switcher
    out.removeAttribute('data-i18n');
    document.addEventListener('langchange', function () {
      out.textContent = t(status.key, status.vars);
      if (runner.classList.contains('is-done')) label.textContent = t('qa.run.again');
    });

    cases.forEach(function (item) {
      item.classList.add('case');
      const stamp = document.createElement('span');
      stamp.className = 'stamp';
      stamp.setAttribute('lang', 'ja');
      stamp.setAttribute('aria-hidden', 'true');
      stamp.textContent = '合格';
      item.appendChild(stamp);
    });

    function runCase(item) {
      item.classList.remove('is-passed');
      item.classList.add('is-running');
      const fields = Array.from(item.children).filter(function (el) {
        return !el.classList.contains('stamp');
      });
      fields.forEach(function (el) {
        el.classList.remove('is-checked');
      });
      let chain = Promise.resolve();
      fields.forEach(function (el) {
        chain = chain.then(function () {
          el.classList.add('is-checked');
          return wait(STEP_MS);
        });
      });
      return chain.then(function () {
        item.classList.remove('is-running');
        item.classList.add('is-passed');
      });
    }

    function runAll() {
      if (running) return;
      running = true;
      runner.classList.remove('is-done');
      runner.classList.add('is-running');
      button.disabled = true;
      cases.forEach(function (item) {
        item.classList.remove('is-passed', 'is-running');
      });
      fill.style.width = '0%';
      const started = window.performance.now();
      let chain = Promise.resolve();
      cases.forEach(function (item, index) {
        chain = chain.then(function () {
          say('qa.run.running', { i: index + 1, n: total });
          return runCase(item);
        }).then(function () {
          fill.style.width = ((index + 1) / total * 100).toFixed(1) + '%';
          return wait(GAP_MS);
        });
      });
      chain.then(function () {
        const secs = ((window.performance.now() - started) / 1000).toFixed(2);
        say('qa.run.done', { n: total, t: secs });
        running = false;
        button.disabled = false;
        runner.classList.remove('is-running');
        runner.classList.add('is-done');
        label.removeAttribute('data-i18n');
        label.textContent = t('qa.run.again');
      });
    }

    button.addEventListener('click', runAll);

    // click a single case to re-run just that one
    cases.forEach(function (item) {
      item.addEventListener('click', function (event) {
        if (running || event.target.closest('a, button')) return;
        if (window.getSelection && String(window.getSelection()).length) return;
        runCase(item);
      });
    });

    runner.hidden = false;
  }

  function initCopy() {
    document.querySelectorAll('[data-copy]').forEach(function (button) {
      if (!navigator.clipboard) return;
      const label = button.querySelector('span');
      let timer = 0;
      button.addEventListener('click', function () {
        navigator.clipboard.writeText(button.getAttribute('data-copy')).then(function () {
          button.classList.add('is-copied');
          label.setAttribute('data-i18n', 'qa.contact.copied');
          label.textContent = t('qa.contact.copied');
          window.clearTimeout(timer);
          timer = window.setTimeout(function () {
            button.classList.remove('is-copied');
            label.setAttribute('data-i18n', 'qa.contact.copy');
            label.textContent = t('qa.contact.copy');
          }, 1800);
        });
      });
      button.hidden = false;
    });
  }

  /* ------------------------------------------------------------------------
     The reading line: a gold seam along the top of the window, drawn as far
     as you have read. It is a slightly broken line, the way a mend runs.
     ------------------------------------------------------------------------ */
  function initProgress() {
    const NS = 'http://www.w3.org/2000/svg';
    const bar = document.createElement('div');
    bar.className = 'progress';
    bar.setAttribute('aria-hidden', 'true');
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('focusable', 'false');
    const paths = ['', 'progress__hi'].map(function (cls) {
      const path = document.createElementNS(NS, 'path');
      if (cls) path.setAttribute('class', cls);
      svg.appendChild(path);
      return path;
    });
    bar.appendChild(svg);
    document.body.appendChild(bar);
    let length = 1;
    let width = 0;

    // the line is laid out in real pixels, so the dash is exact
    function shape() {
      width = window.innerWidth;
      svg.setAttribute('viewBox', '0 0 ' + width + ' 6');
      let d = 'M0 3';
      let seed = 7;
      for (let x = 22; x < width + 22; x += 22) {
        seed = (seed * 16807) % 2147483647;
        d += ' L' + Math.min(width, x) + ' ' + (1.5 + (seed % 1000) / 1000 * 3).toFixed(2);
      }
      paths.forEach(function (path) {
        path.setAttribute('d', d);
      });
      length = paths[0].getTotalLength();
      paths.forEach(function (path) {
        path.style.strokeDasharray = length + ' ' + length;
      });
    }
    let queued = false;
    function update() {
      queued = false;
      if (width !== window.innerWidth) shape();
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      paths.forEach(function (path) {
        path.style.strokeDashoffset = String(length * (1 - p));
      });
    }
    function queue() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue);
    shape();
    update();
  }

  initRunner();
  initCopy();
  initProgress();
})();
