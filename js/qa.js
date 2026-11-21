/* ==========================================================================
   QA page: the experience runs as a test suite.

   "Run checks" walks every role and entry in order: each one is marked
   running, its fields light up one by one as they are asserted, and it gets
   a 合格 (passed) stamp. A role can be re-run on its own by clicking it. The
   summary line is announced politely. Also: a Copy button for the email, and a bug hunt.
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
     Bug hunt. Every so often a small bug walks onto the page from an edge and
     wanders across. Click it to catch it: it is squashed, logged, and the
     tally in the corner goes up. Never more than two at once; none at all
     with reduced motion.
     ------------------------------------------------------------------------ */
  const BUG_SVG = '<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">' +
    '<g class="bug__legs"><path d="M10 12L4 8M10 16H3M10 20L4 25M22 12L28 8M22 16H29M22 20L28 25"/></g>' +
    '<path class="bug__feelers" d="M14 7Q12 3 9 2M18 7Q20 3 23 2"/>' +
    '<ellipse class="bug__shell" cx="16" cy="18" rx="7" ry="9"/>' +
    '<circle class="bug__head" cx="16" cy="8" r="3.6"/>' +
    '<path class="bug__seam" d="M16 10V27"/><circle class="bug__dot" cx="13" cy="16" r="1.6"/><circle class="bug__dot" cx="19" cy="21" r="1.6"/>' +
    '</svg>';

  function initBugs() {
    if (reduced) return;
    const live = [];
    let caught = 0;
    let running = false;
    let last = 0;

    const hud = document.createElement('div');
    hud.className = 'bughud';
    hud.setAttribute('aria-live', 'polite');
    hud.innerHTML = BUG_SVG + '<span class="bughud__label"></span> <b class="bughud__count mono">0</b>' +
      '<span class="bughud__toast" aria-hidden="true"></span>';
    hud.hidden = true;
    document.body.appendChild(hud);
    const label = hud.querySelector('.bughud__label');
    const count = hud.querySelector('.bughud__count');
    const toast = hud.querySelector('.bughud__toast');
    function relabel() {
      label.textContent = t('qa.bugs.found');
    }
    relabel();
    document.addEventListener('langchange', relabel);

    function spawn() {
      if (document.hidden || live.length >= 2) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const edge = Math.floor(Math.random() * 4);
      const pos = [
        { x: Math.random() * w, y: -30, a: Math.PI / 2 },
        { x: w + 30, y: Math.random() * h, a: Math.PI },
        { x: Math.random() * w, y: h + 30, a: -Math.PI / 2 },
        { x: -30, y: Math.random() * h, a: 0 }
      ][edge];
      const el = document.createElement('div');
      el.className = 'bug';
      el.setAttribute('aria-hidden', 'true');
      el.innerHTML = BUG_SVG;
      document.body.appendChild(el);
      const bug = {
        el: el, x: pos.x, y: pos.y, a: pos.a + (Math.random() - 0.5) * 0.8,
        speed: 45 + Math.random() * 40, turn: 0, age: 0, dead: false, pause: 0
      };
      el.addEventListener('pointerdown', function (event) {
        event.preventDefault();
        squash(bug);
      });
      live.push(bug);
      hud.hidden = false;
      start();
    }

    function squash(bug) {
      if (bug.dead) return;
      bug.dead = true;
      bug.el.classList.add('is-squashed');
      caught += 1;
      count.textContent = String(caught);
      toast.textContent = t('qa.bugs.caught', { n: caught });
      hud.classList.remove('is-bumped');
      void hud.offsetWidth;
      hud.classList.add('is-bumped');
      window.setTimeout(function () {
        bug.el.remove();
        live.splice(live.indexOf(bug), 1);
      }, 1400);
    }

    function frame(time) {
      const dt = Math.min(0.05, (time - (last || time)) / 1000);
      last = time;
      const w = window.innerWidth;
      const h = window.innerHeight;
      live.forEach(function (bug) {
        if (bug.dead) return;
        bug.age += dt;
        // scuttle, stop, look about, scuttle on
        if (bug.pause > 0) {
          bug.pause -= dt;
          bug.el.classList.add('is-still');
        } else {
          bug.el.classList.remove('is-still');
          bug.turn += (Math.random() - 0.5) * 6 * dt;
          bug.turn *= 0.96;
          bug.a += bug.turn * dt * 3;
          bug.x += Math.cos(bug.a) * bug.speed * dt;
          bug.y += Math.sin(bug.a) * bug.speed * dt;
          if (Math.random() < dt * 0.35) bug.pause = 0.4 + Math.random() * 0.9;
        }
        // keep to the window for a while, then let it wander off
        if (bug.age < 14) {
          const cx = w / 2 - bug.x;
          const cy = h / 2 - bug.y;
          if (bug.x < 20 || bug.x > w - 20 || bug.y < 20 || bug.y > h - 20) {
            bug.a += (Math.atan2(cy, cx) - bug.a) * 0.08;
          }
        }
        bug.el.style.transform = 'translate(' + bug.x.toFixed(1) + 'px,' + bug.y.toFixed(1) + 'px) rotate(' + (bug.a + Math.PI / 2).toFixed(3) + 'rad)';
        if (bug.age > 14 && (bug.x < -60 || bug.x > w + 60 || bug.y < -60 || bug.y > h + 60)) {
          bug.dead = true;
          bug.el.remove();
        }
      });
      for (let i = live.length - 1; i >= 0; i--) {
        if (live[i].dead && !live[i].el.isConnected) live.splice(i, 1);
      }
      if (live.length) {
        window.requestAnimationFrame(frame);
      } else {
        running = false;
      }
    }

    function start() {
      if (running) return;
      running = true;
      last = 0;
      window.requestAnimationFrame(frame);
    }

    function schedule(ms) {
      window.setTimeout(function () {
        spawn();
        schedule(9000 + Math.random() * 8000);
      }, ms);
    }
    schedule(5000);
  }

  initRunner();
  initCopy();
  initBugs();
})();
