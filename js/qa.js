/* ==========================================================================
   QA page: the experience runs as a test suite.

   "Run checks" walks every role and entry in order: each one is marked
   running, its fields light up one by one as they are asserted, and it gets
   a 合格 (passed) seal that blooms open. A role can be re-run on its own by
   clicking it. The summary line is announced politely. Also: a Copy button
   for the email, and the reading-progress branch in the header.
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
     Reading progress: a branch grows along the bottom of the header as the
     page is read, and its buds open as it passes them.
     ------------------------------------------------------------------------ */
  function initGrowth() {
    const growth = document.querySelector('[data-growth]');
    if (!growth) return;
    const buds = [];
    for (let i = 0; i < 9; i++) {
      const bud = document.createElement('span');
      bud.className = 'growth__bud';
      const at = 0.07 + i * 0.105;
      bud.style.left = (at * 100).toFixed(2) + '%';
      bud.style.rotate = (i * 47 % 72) + 'deg';
      growth.appendChild(bud);
      buds.push({ el: bud, at: at });
    }
    let queued = false;
    function update() {
      queued = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      growth.style.setProperty('--p', p.toFixed(4));
      buds.forEach(function (b) {
        b.el.classList.toggle('is-open', p >= b.at);
      });
    }
    window.addEventListener('scroll', function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  initRunner();
  initCopy();
  initGrowth();
})();
