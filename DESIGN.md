# Design system: hanga (版画)

The Japanese woodblock print, and within it *aizuri-e*: prints pulled almost entirely in one blue ink. Recorded from the built site (css/base.css, gate.css, qa.css, art.css, world.css). Layout comes from folio: a 12-column grid with each section's name in a sticky left column.

## Idea

The whole site is one series of prints from the same blocks. QA is the day sheet, the atelier is the night sheet ("outside of work, I make art"), and both show the same sea and the same mountain.

Three things recur on every page, so both sides read as one person's:

1. **The page prints itself.** On arrival the illustration is pulled in three passes, left to right: key lines, then the pale flats, then the deep flats. The page title takes its ink the same way, over a pale first pass.
2. **The willow.** Strands hang from the top edge of every page (from the header rule; on the gate, over the seam between the two sheets). Each sways on its own clock and leans a little toward the pointer.
3. **Registration marks (kento).** The printer's two marks, an L at the corner and a bar further along the same edge, sit fixed on the window's right edge. They are how a printer makes every colour land in the right place, which is also the QA job.

Pages:

- Gate: a diptych. Two sheets of paper side by side, each with an image inside its margin: the sea by day (a sun, mist bars) and by night (a full moon, stars), one mountain split across the seam. Each sheet has a vertical title cartouche (品質保証 / 柳のアトリエ) and a paper label with the door's name and an **Enter** block. The whole sheet is the link.
- QA: the name, the willow, then a strip of the day sea across the page. Contact is a block printed solid. The page ends where a wave edge rises into the night.
- The Willow Atelier: printed solid, lines left pale. The name, the willow, a strip of the night sea, then the index of work.
- Worlds (`/world/`, not on the gate; reached from the closing band of the atelier): the same night sheet, with stars joined into dashed charts.
- 404: a misprint. The colour blocks and the title's pale pass have slipped off their registration.

The illustrations are inline SVG, generated once and written into the pages. Each is three stacked `<svg>` layers (`.hanga__pass--light`, `--deep`, `--key`), which is what lets them print in sequence and slip on the 404.

## Colour

One ink in five strengths, plus paper. Nothing else.

| Token | Value | Role |
|---|---|---|
| `--paper` | `#eef1f3` | washi: light ground |
| `--sheet` | `#f9fafb` | bare paper: panels, labels, the gate sheets |
| `--ai-1` | `#cfdcf1` | palest wash: mist, far waves |
| `--ai-2` | `#8eabe3` | mid wash; the ink as text on night |
| `--ai-3` / `--royal` | `#2449d8` | the ink at full strength: actions, near waves |
| `--ai-4` | `#17318f` | deep: nearest waves, hover |
| `--ai-5` / `--ink` | `#0c1b4d` | the key block: text and lines on paper |
| `--night` | `#0b1848` | a sheet printed solid: dark ground |
| `--night-2` | `#13235f` | panels and empty frames at night |

Night text: `#f1f4fa` strong, `#c5cfe8` body, `#94a2c8` muted; key lines `#dfe7f7`.

## Type

- Kaisei Tokumin 500 to 800 for display: names, titles, section names. It has the cut, slightly uneven feel of carved type and covers Latin and Japanese.
- Zen Kaku Gothic New for text in every language; Spline Sans Mono for the clock, dates and small labels.

## Shape and line

- Square corners everywhere (`--radius: 2px`), including buttons, the language switcher and the play buttons.
- Key lines are `--rule` (1.5px) in `--key`: section rules, panel outlines, the header rule. Hairlines (`--line`) only divide rows inside a block.
- Japanese section names sit in a small ruled box, like a print's title cartouche.
- A faint paper grain lies over everything.

## Motion

- Arrival: three print passes (0.75s each, staggered) and the title's ink wipe.
- The sea rolls: each wave band slides one wave-length and loops, nearer bands faster.
- The willow sways and leans toward the pointer.
- Gate sheets lift on hover; one click goes in, and the next sheet's ground is pulled across with a band of ink leading.
- Reduced motion: no passes, no rolling sea, no sway; everything is simply there.
