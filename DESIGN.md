# Design system: eki (駅)

The Japanese railway station, as wayfinding. Recorded from the built site (css/base.css, gate.css, qa.css, art.css).

## Idea

The site is a small rail network. The gate is a station named after me; each side is a line with its own colour, and its sections are numbered stops on that line.

- Station signs: a white plate with a line-coloured band along the bottom; the band names the next stop with an arrow.
- Station numbers: a rounded square bordered in the line colour, line letters over a number (`QA 01`, `WA 03`). The last stop on a line is filled.
- Departure boards: dark panels with dot-matrix text; amber for times, white for names, green for type.
- Platform furniture: screen doors on the gate, yellow tactile paving at the edge of each page, framed posters, a train window, yellow exit signs.

## Colour

Strategy: full palette with fixed roles. Each colour means one thing.

| Token | Value | Role |
|---|---|---|
| `--concrete` | `#e6e9ec` | light ground (gate, QA), with a faint 4.5rem tile grid |
| `--plate` | `#fbfcfc` | sign plates, ticket stub, panels |
| `--ink` | `#15181d` | text on plates |
| `--ink-2` | `#353c46` | body text on concrete |
| `--steel` | `#5b6470` | secondary text on light grounds |
| `--navy` | `#1c3d73` | QA Line: bands, route line, badges, buttons |
| `--night` | `#0f1f3a` | dark ground (atelier, 404) |
| `--night-2` / `--night-3` | `#172b4d` / `#0a1528` | slots; boards and the track |
| `--willow` | `#237a4b` | Willow Line: bands, map line, badges |
| `--willow-2` | `#8fd1aa` | Willow green as text on night |
| `--signal` | `#f6b800` | safety yellow: tactile paving, exit signs, tooltips, focus ring |
| `--led` | `#ffb21f` | amber LED text on boards |

Dark theme text: `#f4f6f9` strong, `#d7dee8` body, `#b0c4e2` muted (tinted toward the night, not grey).

## Type

- BIZ UDPGothic 400/700 for everything: Latin, Indonesian and Japanese. It is a universal-design face used in Japanese public signage.
- DotGothic16 only on boards (times, roles, track titles).
- Curly quotes and the middle dot come from the system Latin sans (`Sign Latin Punct`, a unicode-range face), because BIZ UDPGothic draws them full-width.
- Sizes are fluid `clamp()`; display tops out around 6rem. No small uppercase labels above headings; the station number does that job.

## Shape

- `--radius: 6px` on plates, badges, buttons, boards, tickets.
- `--radius-window: 14px` only for train windows.
- Line swatches and the route line are fully rounded bars.

## Motion

- Page change: a panel slides across left to right with a band of the line colour leading (`.veil`).
- Gate: platform doors slide 38% open on peek, fully on enter.
- Split-flap: `[data-flap]` text cycles through A-Z/0-9 and settles when it scrolls into view (station name, board roles). It starts after i18n settles, and a language switch restores the final text.
- Text reveals: a short fade and rise.
- Reduced motion turns all of it off; doors still open, instantly.
