/* ==========================================================================
   Gate tickets.
   Hover and keyboard focus pick a ticket up through CSS alone. A click, tap
   or Enter tears its stub off and punches it, the other ticket drops back,
   and a train on that line runs past. Its wake is the next page's ground,
   so the page changes once the train has gone.
   ========================================================================== */

(function () {
  'use strict';

  const TEAR_MS = 650;          // the stub falls and the ticket is punched
  const RUN_MS = 1900;          // the train runs past
  const REDUCED_TEAR_MS = 200;

  const stage = document.querySelector('[data-gate]');
  if (!stage) return;

  const tickets = Array.from(stage.querySelectorAll('[data-door]'));
  let entering = false;
  let train = null;

  // Each ticket is dated today, in Jakarta, and gets a serial number.
  function issue() {
    let date = '';
    try {
      const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      const get = function (type) {
        const part = parts.find(function (p) { return p.type === type; });
        return part ? part.value : '';
      };
      date = get('year') + '.' + get('month') + '.' + get('day');
    } catch (e) {
      date = '';
    }
    const start = 1000 + Math.floor(Math.random() * 8000);
    tickets.forEach(function (ticket, i) {
      const d = ticket.querySelector('[data-ticket-date]');
      const n = ticket.querySelector('[data-ticket-no]');
      if (d && date) d.textContent = date;
      if (n) n.textContent = String(start + i * 7);
    });
  }

  function el(tag, cls, parent) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (parent) parent.appendChild(node);
    return node;
  }

  // Three cars. The side of each: window, door, two windows, door, two windows, door, window.
  function buildTrain(ticket) {
    const line = ticket.classList.contains('ticket--art') ? 'art' : 'qa';
    const node = el('div', 'train');
    node.setAttribute('aria-hidden', 'true');
    node.setAttribute('data-line', line);
    node.setAttribute('data-tone', ticket.getAttribute('data-tone') === 'light' ? 'light' : 'dark');
    for (let c = 0; c < 3; c++) {
      const car = el('div', 'car' + (c === 0 ? ' car--lead' : ''), node);
      if (c === 0) {
        el('span', 'car__cab', car);
        el('span', 'car__lamp', car);
        const dest = el('span', 'car__dest', car);
        const code = el('b', null, dest);
        code.textContent = ticket.getAttribute('data-code') || '';
        const name = el('span', null, dest);
        const key = ticket.getAttribute('data-name-key');
        const label = (window.i18n && key && window.i18n.t(key)) || '';
        const bound = (window.i18n && window.i18n.t('train.bound')) || '';
        // Japanese puts "bound for" after the name.
        name.textContent = window.i18n && window.i18n.current === 'ja' ? label + ' ' + bound : bound + ' ' + label;
      }
      const side = el('span', 'car__side', car);
      ['win', 'door', 'win', 'win', 'door', 'win', 'win', 'door', 'win'].forEach(function (part) {
        el('span', 'car__' + part, side);
      });
    }
    el('div', 'train__wake', node);
    document.body.appendChild(node);
    return node;
  }

  function runTrain(ticket) {
    train = buildTrain(ticket);
    // the distance to travel: the length of the cars (the wake trails behind them)
    const cars = train.querySelectorAll('.car');
    const last = cars[cars.length - 1];
    train.style.setProperty('--train-w', (last.offsetLeft + last.offsetWidth) + 'px');
    train.style.setProperty('--run', RUN_MS + 'ms');
    void train.offsetWidth;
    train.classList.add('is-running');
    return new Promise(function (resolve) {
      let done = false;
      function finish() {
        if (done) return;
        done = true;
        resolve();
      }
      train.addEventListener('animationend', finish, { once: true });
      window.setTimeout(finish, RUN_MS + 300);
    });
  }

  function enter(ticket) {
    if (entering) return Promise.resolve();
    entering = true;
    const reduced = window.site.prefersReducedMotion();
    ticket.classList.add('is-torn');
    stage.classList.add('has-open');
    if (reduced) {
      return window.site.wait(REDUCED_TEAR_MS).then(function () {
        return window.site.leaveTo(ticket.href, ticket.getAttribute('data-tone'));
      });
    }
    return window.site.wait(TEAR_MS)
      .then(function () {
        return runTrain(ticket);
      })
      .then(function () {
        window.location.assign(ticket.href);
      });
  }

  function reset() {
    entering = false;
    stage.classList.remove('has-open');
    tickets.forEach(function (ticket) {
      ticket.classList.remove('is-torn');
    });
    if (train) {
      train.remove();
      train = null;
    }
    document.documentElement.classList.remove('is-leaving');
  }

  function onClick(event) {
    // Let ctrl/cmd/middle clicks open a new tab the normal way.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    enter(event.currentTarget);
  }

  issue();
  tickets.forEach(function (ticket) {
    ticket.addEventListener('click', onClick);
  });
  // Coming back with the back button restores the page as it was left.
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) reset();
  });

  window.gate = {
    enter: enter,
    reset: reset
  };
})();
