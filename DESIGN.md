# Design system: yozakura (夜桜)

Cherry blossoms at night under a deep navy sky: a hanami evening, moonlight, paper lamps, and petals that behave like petals. Recorded from the built site (css/base.css, gate.css, qa.css, art.css, world.css; js/sakura.js, main.js, gate.js, qa.js, art.js, world.js, lost.js).

## Idea

Navy is the night and the ink; blossom is a pale, cool pink-white used sparingly, as light on that night. Everything that moves is a petal, a branch or the wind:

- **Petals are physics** (js/sakura.js). Each petal tumbles (its flip angle squeezes it edge-on and back), flutters sideways, is dragged by the wind harder when it lies flat to it, falls, and can settle on a ground line and pile up. Strong wind lifts settled petals again.
- **The pointer is wind.** Moving it pushes nearby petals with its velocity; a fast swipe is a gust.
- **Branches grow.** A seeded grower makes trees of curved segments; branches are inked dark navy with a moonlit rim; flowers open with a little overshoot.
- **Page changes** are a wall of petals in the next page's colour sweeping across from the left; the next page starts under it and the wall carries on off to the right.

## Pages

- **Gate.** A great old cherry tree rises between the two doors and spans the sky, with the moon behind it, far hills and a pile of fallen petals along the bottom. Blossom clouds are kept clear of the words and the doors. Moving the pointer stirs the petals; a fast swipe through the canopy shakes blossom loose; clicking a branch grows a new twig there that flowers; clicking open sky scatters the petals near you. The QA door is a lamp-lit shoji pavilion: a precise kumiko grid a hair out of true and a light that flickers; on hover the light steadies and every line falls into place (and turns royal). The atelier door is a torii-like arch of blossom, drawn on the canvas, with a glow inside; on hover more flowers open and petals spiral into it. Click or Enter: a gust carries the petals through, then the wall sweeps in.
- **QA (professional).** Pale paper, navy type, a 3/9 grid with sticky section names. A still sprig of blossom in the hero corner, kept clear of the words. A branch grows along the bottom of the header as you read and its buds open as it passes them. The test runner checks each role in turn and blooms a small 合格 seal (an ink disc on a blossom). Copy button for the email. Nothing moves over text.
- **The Willow Atelier (extra).** A night garden hero: drag to paint a branch; the wood follows your stroke and thins as it goes, twigs sprout, buds swell and open. An invisible hand paints the first branch across the moon. Blossoms drop petals into a pond at the bottom where they ripple, float and melt; the pond mirrors the night above, wavering. The title stands in moonlight. The index is three tanzaku on a cord that sway in the breeze and swing when the pointer passes. A few petals drift behind the rest of the page.
- **Worlds (super extra).** A vast navy night with a giant moon. Each part (worlds, maps, characters, lore) sits on its own floating island: a glassy plate with sakura trees on top and a rock underneath, drifting in from its side and bobbing. A river of glowing petals flows down the page between the islands and bends toward the pointer or finger. The moon, far islands, stars and islands move at different depths with scroll and with the pointer or the phone's tilt. The hero index is four small floating islets.
- **404.** A single bare branch reaching in from the right. Touch it (or the hint) and it blossoms from the base outward and lets petals fall.

## Colour

| Token | Value | Use |
| --- | --- | --- |
| `--abyss` | `#040a26` | top of the night, deepest shadow |
| `--deep` | `#070f36` | night gradient |
| `--night` | `#0b1848` | the night ground, dark sections |
| `--ink` | `#0c1b4d` | type on paper, branches on paper |
| `--royal` | `#2449d8` | accents on paper, hover, the current role dot |
| `--moon` | `#eef1fb` | type on the night, the moon |
| `--blossom` | `#f3dce7` | secondary: blossom, accents on the night |
| `--blossom-deep` | `#d9a3bc` | petal shade, seals, rules |
| `--lamp` | `#fbefd9` | the lamp light in the shoji only |
| `--paper` | `#f5f4f0` | the QA ground |

Navy leads every page. Blossom is light, never a ground.

## Type

- Display: **Zen Old Mincho** (names, titles, roles, the poem).
- Text: **IBM Plex Sans JP** (body, UI; covers Japanese too).
- Small facts: **IBM Plex Mono** (dates, numbers, labels).

## Shape

Thin rules and square corners on the work side; pills for small controls; tanzaku strips, round-topped islands and rock undersides on the art side. Petal and five-petal flower shapes come from one path, used in canvas sprites, SVG and CSS masks.

## Motion

Canvas loops (gate, garden, drift, river, 404) run on one shared frame loop that pauses when the tab is hidden or the element is offscreen. Springs for swaying things, ease-out for reveals, a slight overshoot for flowers opening.

## Reduced motion

`prefers-reduced-motion`: canvases render one still frame (and redraw only when you click or paint, with flowers appearing open); no drift, river flow, parallax, bob, sway or lamp flicker; reveals are a short fade; page changes are a plain fade in the next page's colour.
