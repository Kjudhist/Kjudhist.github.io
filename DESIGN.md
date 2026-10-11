# Design system: poster

A Japanese modernist poster, 1960s Tokyo by way of Swiss grids. Recorded from the built site (css/base.css, gate.css, qa.css, art.css).

## Idea

Two colours in flat fields, one circle, heavy wide type, thin rules, and Japanese set vertically beside the Latin.

- The gate is the poster itself: a white field for QA, a royal field for the atelier, and one circle split across the seam, each half in the other field's colour.
- QA is the white side: the name wide and heavy, a royal band under it, ruled tables and lists.
- The Willow Atelier is the royal side: white type, a white circle with 柳 in it, plain frames for the work.
- Every section opens on a heavy rule, with its name in Japanese running down the right edge (自己紹介, 経歴, 技能, 連絡先; 絵画, 写真, 音楽, 由来, 所在). These are decoration and hidden from screen readers.

## Colour

Strategy: two colours. Royal blue and white carry everything; ink is for text on white.

| Token | Value | Role |
|---|---|---|
| `--royal` | `#2340d8` | the royal field: atelier ground, bands, accents, the circle |
| `--royal-2` | `#1a32b4` | hover on royal, circles inside royal fields, empty frames |
| `--royal-3` | `#0f1f7a` | viewer backdrop |
| `--white` | `#ffffff` | the white field |
| `--paper` | `#f3f4f8` | quiet raised surfaces on white |
| `--ink` | `#0b1030` | headings and strong text on white |
| `--ink-2` | `#2b3152` | body on white |
| `--grey` | `#5a6080` | secondary text on white |
| `--pale` | `#c9d2ff` | secondary text on royal |

## Type

- Archivo (variable, with width) for Latin. Display is weight 800 at `font-stretch: 125%`, tracked tight (-0.03em to -0.045em), line-height under 1.
- Noto Sans JP 400/700/900 for Japanese. Vertical labels (`.tate`) are 900 with wide tracking.
- Japanese headings drop the width and tracking and open the line-height.
- No small uppercase labels above headings; the vertical Japanese does that job.

## Shape

- Square corners everywhere. The only curve is the circle (and the round play and close buttons).
- Rules: 6px under section heads and the index, 2px over tables and lists, 1px between rows.
- No shadows.

## Motion

- Gate: hovering, focusing or first-tapping a field widens it (flex-grow 1.3) and lengthens the bar under its label; opening it pushes the other field off the page and slides its half-circle out.
- Page change: a field of the next page's colour rises from the bottom (`.veil`).
- Text settles with a short fade and rise.
- Reduced motion turns all of it off; fields still open, instantly.
