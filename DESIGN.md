# Design system: matsuri (祭)

A Japanese summer festival at night, in one blue ink. Recorded from the built site (css/base.css, gate.css, qa.css, art.css, world.css; js/main.js, hanabi.js, gate.js, qa.js, kingyo.js). Layout comes from folio: a 12-column grid with each section's name in a sticky left column.

## Idea

Every page has something to play with, and the play is the point:

- **Fireworks (hanabi).** On the gate the whole window is sky: a shell goes up every few seconds, and a click anywhere that is not a control bursts one where you clicked. Five kinds: kiku (chrysanthemum, tailed), botan (peony, bright dots), shidare (willow: long silver trails that hang and fall, the atelier's own), ring (tilted), senrin (a thousand small crackling bursts). The worlds and the 404 have a strip of sky to launch in.
- **Lanterns (chōchin).** A string of paper lanterns on a sagging rope. Brush past one and it swings on a damped spring; click it to light it or put it out. Light every lantern on the gate and the sky answers with a finale. The QA page's string reads 品質保証検査合格.
- **Stalls with noren.** The gate's two doors are festival stalls. Each noren is four strips on springs: move the pointer through it and they swing with your speed; hover parts them; click and they fling aside and you go in. Past the noren: jars ticked off on shelves (QA) and paintings and brushes (the atelier).
- **Bug hunt (QA).** Now and then a small bug walks in from an edge and wanders. Click it to catch it; a tally in the corner counts them ("Bug #3 caught. Logged.").
- **Test runner (QA).** Run checks walks the experience as a test suite and stamps each role 合格.
- **Kingyo-sukui (the atelier).** A blue tub of goldfish and a paper poi that follows the pointer. Press to dip, let go to scoop; fish scatter from the poi, slow ones are easier, and the paper weakens in the water and tears. Three poi, then a new set.
- **Sparkler.** On the night pages the pointer throws a few short, branching sparks as it moves (senkō hanabi).
- **Noren between pages.** Changing page, a noren in the next page's colour drops over this one; the next page lifts it.
- Sound: fireworks can boom and crackle (synthesised); off until the Sound button on the gate is switched on.

Pages:

- Gate: the night. Name in the corner, then Sound, the clock and the language pill. The lantern string under the header, then the two stalls: QA's with a royal-and-white striped awning and a white noren 品質保証, the atelier's with a navy-and-pale awning and a navy noren アトリエ. Captions under them with the name and an Enter pill. A line tells you what you can do.
- QA: paper. Bunting under the header. The name, the willow, the lantern string. Sections on the grid; the test runner and the bug hunt; contact on the night colour with a Copy button.
- The Willow Atelier: the night. The name, the willow, the goldfish tub with the bag and poi count beside it, then the index of work.
- Worlds: the night, with a strip of sky to launch fireworks in.
- 404: the night: "Nothing behind this door", and a strip of sky.

## Colour

One ink in five strengths, paper and the night, plus the bright blue of a firework.

| Token | Value | Role |
|---|---|---|
| `--paper` | `#eef1f6` | QA ground |
| `--sheet` | `#f8f9fc` | cards, the QA caption, white noren and awning stripes |
| `--ai-1` | `#cfdcf1` | pale wash |
| `--ai-2` | `#8eabe3` | pale blue: awning stripes at night, text accents on night |
| `--ai-3` / `--royal` | `#2449d8` | actions, awning stripes, the goldfish tub |
| `--spark` | `#5b7cff` | firework blue, hover, bunting at night |
| `--ai-5` / `--ink` | `#0c1b4d` | text on paper, navy noren |
| `--night` | `#0a1440` | dark ground |
| `--night-2` | `#121f5c` | cards at night |
| `--night-3` | `#050b2e` | stall posts, the top of the sky, hills |

Fireworks use white, `#dfe7f7`, `#c9d6f0`, `#8eabe3`, `#5b7cff` and royal. Lit lanterns glow blue-white.

## Type

- Dela Gothic One for display: names, titles, section names, noren and lantern characters. One weight; faux bold is switched off.
- Zen Maru Gothic for text in every language; IBM Plex Mono for the clock, dates and counts.

## Shape

- Anything you press is a pill (`--radius: 999px`): buttons, the language switcher, Sound, tags. Cards are soft (`--radius-box: 14px`).
- Section names in Japanese sit on a filled tag.
- Bunting under the sticky header: two colours of triangular flag.
- A faint paper grain lies over everything.

## Motion

- Arrival: the noren lifts (0.8s); titles lift in out of a blur.
- Ambient: lanterns sway, the willow sways, fireworks go up on the gate and in the sky strips.
- Physics: lanterns and noren strips are damped springs driven by the pointer's speed.
- Reduced motion: no autoplay fireworks (a click paints one still burst), no sparkler, no swinging or sway, no bugs, a still goldfish tub, the test runner stamps at once, and page changes are a short fade.
