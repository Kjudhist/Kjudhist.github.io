/* ==========================================================================
   Gate doors.
   Hover and keyboard focus part the curtain through CSS alone. A click or
   tap goes straight in: the curtain parts fully, then the next page's
   colour rises over this one.
   ========================================================================== */

(function () {
  'use strict';

  const OPEN_MS = 550; // the curtain parts before the page changes
  const REDUCED_OPEN_MS = 150;

  const stage = document.querySelector('[data-gate]');
  if (!stage) return;

  const doors = Array.from(stage.querySelectorAll('[data-door]'));
  let entering = false;

  function enterDoor(door) {
    if (entering) return Promise.resolve();
    entering = true;
    const reduced = window.site.prefersReducedMotion();
    door.classList.add('is-open');
    stage.classList.add('has-open');
    return window.site.wait(reduced ? REDUCED_OPEN_MS : OPEN_MS).then(function () {
      return window.site.leaveTo(door.href, door.getAttribute('data-tone'));
    });
  }

  function resetDoors() {
    entering = false;
    stage.classList.remove('has-open');
    doors.forEach(function (door) {
      door.classList.remove('is-open');
    });
    document.documentElement.classList.remove('is-leaving');
  }

  function onDoorClick(event) {
    // Let ctrl/cmd/middle clicks open a new tab the normal way.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    enterDoor(event.currentTarget);
  }

  doors.forEach(function (door) {
    door.addEventListener('click', onDoorClick);
  });
  window.addEventListener('pageshow', function (event) {
    if (event.persisted) resetDoors();
  });

  window.gate = {
    enterDoor: enterDoor,
    resetDoors: resetDoors
  };
})();
