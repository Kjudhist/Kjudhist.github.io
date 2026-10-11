# Design system: bungu (文具)

Japanese stationery, written in royal blue fountain-pen ink. Recorded from the built site (css/base.css, gate.css, qa.css, art.css).

## Idea

The site is a desk. The gate is a cutting mat with a name sticker and two notebooks on it; each side of the site is one of those notebooks.

- QA is the white school notebook: graph paper, blue ink, and the things a careful tester leaves on a page: a contents sheet, a sticky note, a test log, index cards, label stickers, a postcard.
- The Willow Atelier is the royal blue sketchbook: the page is the ink itself, and the work is white paper taped onto it: sheets, prints with photo corners, staff paper, manuscript squares.
- Red pen appears only where a tester would use it: the 検査済 stamp and the circle around the current role.

## Colour

Strategy: one ink. Royal blue carries the brand on both sides; blue-black is for text; red is a single, rare correction mark.

| Token | Value | Role |
|---|---|---|
| `--paper` | `#f4f6fa` | light ground (QA, 404), with the graph-paper grid |
| `--sheet` | `#ffffff` | paper laid on top: cards, sheets, covers, tabs |
| `--grid` / `--grid-strong` | royal at 7.5% / 13% | graph-paper lines, card rules |
| `--royal` | `#2348c8` | the ink: accents, buttons, handwriting; the whole atelier ground |
| `--royal-2` | `#1a379f` | hover on royal |
| `--royal-4` | `#0a1648` | photo corners, viewer backdrop |
| `--sky` | `#cdd9ff` | pale blue: text and tape on royal, the ruler, sticky notes |
| `--ink` | `#131a38` | blue-black text |
| `--ink-2` | `#2d3657` | body text on paper |
| `--pencil` | `#58617f` | secondary text, placeholders |
| `--red` | `#c8352a` | red pen: stamp and circle only |
| `--mat` | `#121a3c` | the cutting mat on the gate |

On royal: `#ffffff` strong, `#e8eeff` body, `--sky` muted.

## Type

- Zen Kaku Gothic New 400/500/700/900 for printed text. Display headings are 900 with tight tracking.
- Klee One 400/600 for anything handwritten: the name sticker, the pitch, the atelier title, notes, dates, page numbers, placeholders (written in pencil).
- Curly quotes and the middle dot come from the system Latin sans (`Latin Punct`, a unicode-range face), because Japanese faces draw them full-width.
- No small uppercase labels above headings. Section heads are a heading over a ruled line with the page number in the corner; page numbers are meaningful because the contents and the divider tabs link to them.

## Shape

- Paper is square-cornered (`--radius: 4px` at most). Sheets sit at small tilts (under 2.5deg) and straighten on hover.
- Interactive labels are pills (`--radius-pill`): buttons, the language switcher, skill stickers.
- Tape: a pale blue strip across the top of taped things (`.tape`), tilted.
- Shadows are tinted with royal, never black.

## Motion

- Page change: a drop of ink spreads from the middle until it fills the screen (`.veil`, clip-path circle), royal or paper depending on where you are going.
- Gate: the QA cover swings on its left edge, the sketchbook cover flips up on its spiral; 34deg/28deg on peek, all the way on open.
- Handwriting (`[data-reveal="write"]`) is uncovered left to right, like a pen moving. Other text settles with a short fade and rise.
- The inspection stamp lands once after the pitch is written.
- Reduced motion turns all of it off; covers still open, instantly.
