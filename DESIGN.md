# Design system: orikami (折り紙)

A world made of folded paper, in navy washi and white kami. Crisp creases, flat facets lit by one soft light, the light and dark sides of every fold. Recorded from the built site (css/base.css, gate.css, qa.css, art.css, world.css; js/main.js, kami.js, gate.js, qa.js, tsuru.js, art.js, world.js).

## Idea

Everything is paper, and the paper behaves like paper:

- **The light.** On the gate and the 404 the pointer is a light source. Each flat facet of the sheet is shaded from its normal and the direction to the light, so facets catch and lose light as you move. Until the pointer moves, the light drifts slowly by itself.
- **Origami paper has a white back.** Wherever a fold turns over (the gate's corner, the inside of the door leaves, the atelier's dog-eared cards) the white side shows.
- **Folds, not fades.** Reveals unfold from their top crease, menus and tips fold down, page changes are a sheet folding over the screen.

Pages:

- **Gate.** One large sheet of navy washi on a dark table, split by straight creases into flat facets (canvas, js/kami.js). Light follows the pointer. The two doors are gatefolds: hover or focus half-opens both leaves on their creases (CSS 3D, `--open` is a registered custom property so it animates). Inside the QA fold is a white ruled sheet, a 検査表 whose rows get ticked and stamped 合格: calm and precise. Inside the atelier fold is a night with a moon, and a paper crane that lifts off and flutters. Click (or Enter) opens the leaves flat and the page folds over into the next. The bottom-right corner is turned back; drag it to fold the sheet back as far as you like, and it springs back when you let go.
- **QA (professional).** White kami with faint crease lines as a grid. Navy type. A crane crease pattern drawn on in the hero (mountain folds solid, valley folds dashed). Sections on folded white cards with a soft crease across the middle. The header's lower edge is a crease; the reading progress runs along it like a fold line. The experience is a stack of tickets (notched ends, a perforated stub); Run checks walks them and each stub flips to show a 合格 seal. The email has a Copy button. Nothing moves on its own.
- **The Willow Atelier (extra).** Night-blue washi. A flock of paper cranes (boids) drifts toward the pointer from afar and shies from it up close. Click anywhere that is not a control and a square folds into a crane where you clicked (in half, in half again, then the crane) and joins the flock; a counter keeps how many you have folded. Tap a crane and it opens into its flat square printed with seigaiha waves, then folds up again. The title is set on a folded paper banner with swallowtail ends that tilts toward the pointer. The index is three white cards with a corner folded down; hover unfolds the corner and the kanji underneath (絵, 写, 音) comes up. Work hangs on white kami mats; photos are prints on a sideways strip.
- **Worlds (super extra).** A pop-up book. Each section is a spread of navy washi with a page block under it. As a spread comes up the screen, the page before it turns over on the gutter and its scene rises off the paper in layers, back layers first (scroll-linked). The book and its scene tilt with the pointer, or the phone's orientation. Drag the book sideways to turn to the next or previous spread; a folded corner on each spread is a "Turn the page" link. Scenes: moon and three mountain ranges (cover), a castle on its hill (the worlds), waves with a boat and a lighthouse island (maps), a great faceted tree with falling leaves (characters), and a paper dragon that unfolds segment by segment across the last spread and swims there (lore). Placeholder content stays in brackets.
- **404.** A crumpled sheet of white paper, lit by the pointer. Click it to smooth it out (and again to crumple it): 404 and 迷子の紙 are printed on it, and its grid creases with it.

## Colour

Navy leads every page; white kami is the second voice; one vermilion is kept for seals.

| Token | Value | Use |
|---|---|---|
| `--deep` | `#060d2c` | the table under the gate's sheet, deepest shadow |
| `--night` | `#0b1848` | night pages, QA's end band and footer |
| `--ink` | `#0c1b4d` | text on paper, buttons on paper |
| `--washi` | `#14265f` | navy washi: slots, cards, book pages |
| `--washi-hi` | `#1e3479` | the lit side of navy washi |
| `--royal` | `#2449d8` | links, focus, ticks, the progress fold line |
| `--royal-hi` | `#5b7cff` | focus on dark, lit canopy and waves |
| `--kami` | `#f8f7f2` | white paper: QA background, mats, cards, the banner |
| `--kami-2`, `--kami-3` | `#eeede6`, `#dfe0dc` | the shaded side of white paper |
| `--mist` | `#aebbe6` | secondary text on navy |
| `--shu` | `#c23b26` | the 合格 seal and "In progress" only |

The gate's sheet is shaded between `#040a2a` (turned away) and `#2d49b0` (facing the light). Pop-up layers run from pale `#c7d1f1` (far) through royal `#3a5bd0` to navy `#13256a` (near), with kami clouds and moons.

## Type

- Shippori Mincho B1 (500–800) for display: names, titles, section names, the kanji on the leaves, the banner, the book's headings.
- Zen Kaku Gothic New (400/500/700) for text in every language: clean on the QA page, quiet elsewhere.
- IBM Plex Mono for the clock, dates, counts and small labels.
- Japanese section labels are set vertically beside each heading.

## Shape

- Square paper corners. Buttons, tabs and the active language have one corner clipped and folded back (a small lighter triangle).
- Cards carry one soft horizontal crease: the lower half sits a shade lower than the upper.
- Tickets have notched ends and a dashed perforation before the stub.
- Shadows are long and soft, as paper lying on paper.

## Motion

- Easing: `--fold` `cubic-bezier(.55,.05,.25,1)` for folds, `--ease-out` for settling.
- Page change: a sheet in the next page's paper (white for QA, navy for the rest, a diagonal crease across it) folds over the screen from the left edge (0.75s); the next page starts under it and it folds away to the right.
- Reveals: blocks unfold from their top crease (rotateX from -28°).
- Gate: leaves on `--open` (0, 0.36 on hover, 1 on enter), ticks drawn in one by one, the seal pressed last; the crane flaps while the door is open.
- Atelier: boids at 38–120 px/s scaled by depth; a fold takes 1.2s; an unfold holds the flat sheet about 1.5s.
- Worlds: `--p` (0 to 1) per spread from its scroll position; each layer stands with `rotateX((1 - clamp(p*1.8 - i*0.18)) * 88deg)`; the turning leaf has a single face, so it vanishes once it passes upright.
- Every loop pauses while the tab is hidden; the dragon only swims while its spread is on screen.

## Reduced motion

- No page-change fold (a short fade instead), no reveals beyond a fade, no title lift.
- Gate: the light stays still (it does not drift or follow), doors change state without a swing, the crane does not flap; the corner can still be dragged and returns at once.
- Atelier: a still flock; a click places a crane without the folding sequence; no unfolding; the banner does not tilt.
- Worlds: every scene stands, no page turns, no tilt, a still dragon, leaves still.
- 404: the sheet smooths and crumples without animation.
