/* ==========================================================================
   The atelier.
   Everything that moves on this page is CSS. This file only opens a piece
   full size: any [data-view] button with an <img> inside, carrying
   data-title and data-meta for the caption.
   ========================================================================== */

(function () {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initViewer() {
    const dialog = document.querySelector('[data-viewer]');
    if (!dialog || typeof dialog.showModal !== 'function') return;
    const img = dialog.querySelector('[data-viewer-img]');
    const title = dialog.querySelector('[data-viewer-title]');
    const meta = dialog.querySelector('[data-viewer-meta]');
    let opener = null;
    let closing = 0;

    function open(button) {
      const source = button.querySelector('img');
      if (!source) return;
      img.src = button.getAttribute('data-full') || source.currentSrc || source.src;
      img.alt = source.alt;
      title.textContent = button.getAttribute('data-title') || '';
      meta.textContent = button.getAttribute('data-meta') || '';
      opener = button;
      window.clearTimeout(closing);
      closing = 0;
      dialog.classList.remove('is-closing');
      dialog.showModal();
    }

    function close() {
      if (!dialog.open || closing) return;
      if (reduced) {
        dialog.close();
        return;
      }
      dialog.classList.add('is-closing');
      closing = window.setTimeout(function () {
        closing = 0;
        dialog.classList.remove('is-closing');
        dialog.close();
      }, 340);
    }

    document.addEventListener('click', function (event) {
      const button = event.target.closest('[data-view]');
      if (button) open(button);
    });
    dialog.querySelector('[data-viewer-close]').addEventListener('click', close);
    dialog.addEventListener('cancel', function (event) {
      event.preventDefault();
      close();
    });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog || event.target.classList.contains('viewer__inner')) close();
    });
    dialog.addEventListener('close', function () {
      if (opener) opener.focus({ preventScroll: true });
    });
  }

  initViewer();
})();
