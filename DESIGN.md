# Design system: origami (折り紙)

Folded paper. Recorded from the built site (css/base.css, gate.css, qa.css, art.css, world.css). Layout comes from folio: a 12-column grid with each section's name in a sticky left column.

## Idea

Origami paper is coloured on one side and white on the other. The whole site is that one sheet: QA is the white side, the atelier is the blue side ("outside of work, I make art"). Nothing is outlined. Things are sheets, told apart by tone, a soft shadow and a corner folded over to show the other side.

Three things recur on every page, so both sides read as one person's:

1. **The other side shows.** Every raised sheet has one corner turned over, and the corner is the colour of the reverse: blue on a white sheet, white on a blue one. On the gate the corners turn further on hover.
2. **Fold lines.** Rules are dashed, the way a folding diagram draws a fold. Each section is a step in the folding and carries its number. The window itself has one faint crease across it, and each page title is creased once: the far side of the fold catches the blue.
3. **A folded figure.** Flat faces in four tones, drifting a little and leaning toward the pointer: a paper dart for QA, a crane for the atelier, a compass star for Worlds.

Pages:

- Gate: one sheet folded down the middle and opened. The left half lies white side up (the dart), the right half blue side up (the crane); the seam is the fold, and each half darkens a little toward it. On arrival the two halves swing flat from behind. Each half has a vertical name beside the fold (品質保証 / 柳のアトリエ), a faint crease pattern under its figure, and a caption with the door's name and an **Enter** block. The whole half is the link; when one is chosen the other folds away. On a phone the sheet is folded across instead.
- QA: the name, the dart, then a pleated band in the sheet's blue. Contact is a sheet turned to its blue side. The page ends on a folded, pointed edge into the blue.
- The Willow Atelier: the blue side, so what is folded shows white: the crane, a white pleated band, then the index of work. Empty works are sheets with a white corner.
- Worlds (`/world/`, not on the gate; reached from the closing band of the atelier): the same blue side, with a folded compass star.
- 404: a sheet that was never folded. Only its crease pattern is there, valley folds dashed and mountain folds dash-dot.

The figures are inline SVG polygons, generated once and written into the pages. Faces take their colour from `--f1` to `--f4`, so the same figure works on either side of the sheet.

## Colour

One blue in five strengths, plus paper. Nothing else.

| Token | Value | Role |
|---|---|---|
| `--paper` | `#eef1f3` | the table the sheets lie on: light ground |
| `--sheet` | `#f9fafb` | the white side: raised sheets, the QA door |
| `--ai-1` | `#cfdcf1` | palest blue: hover on the white Enter block |
| `--ai-2` | `#8eabe3` | light face of a figure; the blue as text on the blue side |
| `--ai-3` / `--royal` | `#2449d8` | the blue at full strength: actions, folded corners, pleats |
| `--ai-4` | `#17318f` | deep face, hover, the shaded pleat |
| `--ai-5` / `--ink` | `#0c1b4d` | text on paper; the darkest face |
| `--night` | `#0b1848` | the coloured side: dark ground, the atelier door |
| `--night-2` | `#13235f` | raised sheets on the blue side |

On the blue side: text `#f1f4fa` strong, `#c5cfe8` body, `#94a2c8` muted; figure faces `#fff`, `#dfe7f7`, `#a9bfea`, `#7f9be0`.

## Type

- M PLUS 1 for everything, in every language: 800 with tight tracking for names and titles, 400 to 500 for text. Its flat, even strokes sit well beside flat paper faces, and it covers Latin and Japanese in one family.
- M PLUS 1 Code for the clock, dates, step numbers and small labels.

## Shape and line

- Square corners everywhere (`--radius: 0`).
- No outlines. A raised sheet is `--bg-raised` with `--shadow-sheet` and a folded corner (`--fold`, `--flap`, `--flap-edge`, and `--under` for whatever lies beneath the corner).
- Fold lines are `--rule` (1.5px) dashed in `--line-strong`: section rules, list tops. Hairlines (`--line`) only divide rows inside a block.
- Japanese section names carry a small folded-corner mark instead of a box.
- A faint paper grain and one diagonal crease lie over everything.

## Motion

- Arrival: on the gate the sheet opens flat; on a page the title's crease runs across it, the figure lands, and the pleated band is pulled open.
- Sections tip up into place as they scroll in, like a flap being folded down.
- Figures drift slowly and lean toward the pointer.
- Leaving a page: the next sheet folds over this one from the top corner.
- Reduced motion: no opening, no drift, no folding; everything is simply there.
