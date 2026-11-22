/* ==========================================================================
   404: a broken cup lies in pieces. Tap it and the shards come home, and
   the cracks fill with gold. Tap the mended cup and it breaks again.
   ========================================================================== */

(function () {
  'use strict';

  const K = window.Kintsugi;
  const stage = document.querySelector('[data-cup-stage]');
  if (!stage || !K) return;
  stage.hidden = false;
  const hint = document.querySelector('[data-cup-hint]');
  if (hint) hint.hidden = false;

  K.Vessel(stage.querySelector('[data-cup]'), {
    shape: 'cup',
    spot: stage.querySelector('[data-cup-spot]'),
    start: 'broken',
    pieces: 14,
    seed: 5,
    tapToMend: true
  });
})();
