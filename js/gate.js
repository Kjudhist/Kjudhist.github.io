/* ==========================================================================
   Gate doors.
   Hover and keyboard focus peek through CSS alone. This file handles touch
   (first tap peeks, second tap enters), the full open on click, where the
   chosen half takes the screen, and the walk through into the next page.
   ========================================================================== */

(function () {
  'use strict';

  const OPEN_MS = 1000; // the half fills the screen while the door swings
  const ENTER_MS = 400;
  const REDUCED_OPEN_MS = 250;

  const stage = document.querySelector('[data-gate]');
  if (!stage) return;

  const doors = Array.from(stage.querySelectorAll('[data-door]'));
  let lastPointer = 'mouse';
  let entering = false;

  function isTouchLike(pointerType) {
    return pointerType === 'touch' || pointerType === 'pen';
  }

  function setCue(door, key) {
    const cue = door.querySelector('[data-cue]');
    if (!cue) return;
    cue.setAttribute('data-i18n', key);
    const text = window.i18n ? window.i18n.t(key) : null;
    if (text) cue.textContent = text;
  }

  function setPeek(door, on) {
    door.classList.toggle('is-peek', on);
    setCue(door, on ? 'gate.again' : 'gate.tap');
  }

  function clearPeeks(except) {
    doors.forEach(function (door) {
      if (door !== except && door.classList.contains('is-peek')) setPeek(door, false);
    });
  }

  // On touch, the first tap only opens the door a little.
  function shouldPreviewFirst(door, pointerType, fromKeyboard) {
    return !fromKeyboard && isTouchLike(pointerType) && !door.classList.contains('is-peek');
  }

  function enterDoor(door) {
    if (entering) return Promise.resolve();
    entering = true;
    const reduced = window.site.prefersReducedMotion();
    clearPeeks(door);
    door.classList.add('is-peek', 'is-open');
    stage.classList.add('has-open');
    return window.site.wait(reduced ? REDUCED_OPEN_MS : OPEN_MS)
      .then(function () {
        door.classList.add('is-entering');
        return window.site.wait(reduced ? 0 : ENTER_MS);
      })
      .then(function () {
        return window.site.leaveTo(door.href, door.getAttribute('data-tone'));
      });
  }

  function resetDoors() {
    entering = false;
    stage.classList.remove('has-open');
    doors.forEach(function (door) {
      door.classList.remove('is-open', 'is-entering');
      setPeek(door, false);
    });
    document.documentElement.classList.remove('is-leaving');
  }

  function onPointerDown(event) {
    lastPointer = event.pointerType || 'mouse';
    if (isTouchLike(lastPointer)) document.documentElement.classList.add('touch-used');
    if (!event.target.closest('[data-door]')) clearPeeks(null);
  }

  function onDoorClick(event) {
    // Let ctrl/cmd/middle clicks open a new tab the normal way.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (entering) return;

    const door = event.currentTarget;
    const fromKeyboard = event.detail === 0;
    if (shouldPreviewFirst(door, lastPointer, fromKeyboard)) {
      clearPeeks(door);
      setPeek(door, true);
      return;
    }
    enterDoor(door);
  }

  function init() {
    document.addEventListener('pointerdown', onPointerDown, { passive: true });
    doors.forEach(function (door) {
      door.addEventListener('click', onDoorClick);
    });
    window.addEventListener('pageshow', function (event) {
      if (event.persisted) resetDoors();
    });
  }

  window.gate = {
    setPeek: setPeek,
    clearPeeks: clearPeeks,
    shouldPreviewFirst: shouldPreviewFirst,
    enterDoor: enterDoor,
    resetDoors: resetDoors
  };

  init();
})();
