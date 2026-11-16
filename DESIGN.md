# Design system: eki (駅)

The Japanese railway station, as wayfinding. Recorded from the built site (css/base.css, gate.css, qa.css, art.css, world.css). The station style is Tokyo's: numbered stations, line colours, through services.

## Idea

The site is a small rail network. The gate is a station named after me (`KJ 00`); each side is a line with its own colour, and its sections are numbered stops on that line. QA and The Willow Atelier are the two destination stations. The Worlds page is a third line that the Willow Line runs through onto (直通運転, through service), so it is reached from the end of the atelier, not from the gate.

- Station signs: a white plate with a line-coloured band along the bottom; the band names the next stop with an arrow.
- Station numbers: a rounded square bordered in the line colour, line letters over a number (`QA 01`, `WA 03`). The last stop on a line is filled.
- Departure boards: dark panels with dot-matrix text; amber for times, white for names, green for type.
- Tickets: the gate is a ticket machine that has issued two tickets, one to each station. A ticket is cream paper with a fine security pattern in its line's colour, the line colour across the top, a perforated stub (乗車券, one way) and today's date in Jakarta with a serial number.
- Trains: three silver cars with a band in the line colour, doors and windows, and an amber destination display on the leading car (`WA 01 Bound for The Willow Atelier`).
- Platform furniture: yellow tactile paving at the edge of each page, the track under it, framed posters, a train window, yellow exit signs, a station clock in amber dot-matrix.

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
| `--sky` / `--sky-2` | `#1f78c8` / `#9cccf3` | Worlds Line: bands, map line, badges; sky as text on night |
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
- Gate: hover or focus picks a ticket up and the stub starts to give. Choosing it tears the stub off along the perforation (the stub's teeth and the body's notches are masks, so the halves meet as one sheet until torn), the gate punches a hole in it, and the other ticket drops back. Then a train on that line runs right to left along the bottom of the window. Behind its last car comes the next page's ground, led by a band of the line colour, so the page changes once the train has gone.
- Split-flap: `[data-flap]` text cycles through A-Z/0-9 and settles when it scrolls into view (station name, board roles). It starts after i18n settles, and a language switch restores the final text.
- Text reveals: a short fade and rise.
- Reduced motion turns all of it off: the ticket is still torn, instantly, and the page fades over; no train runs.
