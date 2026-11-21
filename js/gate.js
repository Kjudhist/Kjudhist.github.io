/* ==========================================================================
   Gate doors. Each door is a link wrapped round a pair of shoji.

   Drag:  pull the pair apart sideways (either panel, either direction away
          from the middle) and the screens follow your hand. Let go past
          the middle and you go in; short of it they slide shut again.
          Vertical swipes are left to the page, so phones still scroll.
   Click, tap or Enter: the screens slide all the way open and you go in.
   Ctrl/cmd/middle clicks open a new tab the normal way.
   ========================================================================== */

(function () {
  'use strict';

  const OPEN_MS = 800;   // the screens part
  const STEP_MS = 280;   // then a step into the room
  const REDUCED_MS = 150;
  const GO_PAST = 0.42;  // let go beyond this and the door opens

  const stage = document.querySelector('[data-gate]');
  if (!stage) return;

  const doors = Array.from(stage.querySelectorAll('[data-door]'));
  let entering = false;

  function setOpen(door, value) {
    door.style.setProperty('--open', value.toFixed(3));
  }

  function enterDoor(door) {
    if (entering) return Promise.resolve();
    entering = true;
    const reduced = window.site.prefersReducedMotion();
    door.classList.remove('is-dragging');
    door.classList.add('is-open');
    stage.classList.add('has-open');
    setOpen(door, 1);
    return window.site.wait(reduced ? REDUCED_MS : OPEN_MS).then(function () {
      door.classList.add('is-entering');
      return window.site.wait(reduced ? 0 : STEP_MS);
    }).then(function () {
      return window.site.leaveTo(door.href, door.getAttribute('data-tone'));
    });
  }

  function resetDoors() {
    entering = false;
    stage.classList.remove('has-open');
    doors.forEach(function (door) {
      door.classList.remove('is-open', 'is-entering', 'is-dragging');
      setOpen(door, 0);
    });
    document.documentElement.classList.remove('is-leaving');
  }

  doors.forEach(function (door) {
    const frame = door.querySelector('.door__frame');
    let drag = null;
    let dragged = false;

    frame.addEventListener('pointerdown', function (event) {
      if (entering || event.button !== 0) return;
      const box = frame.getBoundingClientRect();
      drag = {
        x: event.clientX,
        y: event.clientY,
        half: box.width / 2,
        // the left panel opens leftward, the right one rightward
        side: event.clientX < box.left + box.width / 2 ? -1 : 1,
        start: parseFloat(door.style.getPropertyValue('--open')) || 0,
        id: event.pointerId,
        active: false
      };
      dragged = false;
    });

    frame.addEventListener('pointermove', function (event) {
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
        dragged = true;
        door.classList.add('is-dragging');
        try {
          frame.setPointerCapture(drag.id);
        } catch (e) {
          // capture is a nicety
        }
      }
      const value = Math.max(0, Math.min(1, drag.start + (dx * drag.side) / drag.half));
      setOpen(door, value);
    });

    function release() {
      if (!drag) return;
      const wasActive = drag.active;
      drag = null;
      if (!wasActive) return;
      door.classList.remove('is-dragging');
      const value = parseFloat(door.style.getPropertyValue('--open')) || 0;
      if (value > GO_PAST) {
        enterDoor(door);
      } else {
        setOpen(door, 0);
      }
    }

    frame.addEventListener('pointerup', release);
    frame.addEventListener('pointercancel', function () {
      drag = null;
      door.classList.remove('is-dragging');
      if (!entering) setOpen(door, 0);
    });

    // a link would otherwise start a native drag of its URL
    door.addEventListener('dragstart', function (event) {
      event.preventDefault();
    });

    door.addEventListener('click', function (event) {
      if (dragged) {
        // the drag already decided; this click is just its tail
        event.preventDefault();
        dragged = false;
        return;
      }
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      enterDoor(door);
    });
  });

  window.addEventListener('pageshow', function (event) {
    if (event.persisted) resetDoors();
  });

  window.gate = {
    enterDoor: enterDoor,
    resetDoors: resetDoors
  };
})();
