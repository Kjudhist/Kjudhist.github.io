# Design system: satoyama (里山)

The Japanese countryside where low mountains meet rice fields. Recorded from the built site (css/base.css, gate.css, qa.css, art.css). Layout comes from folio: a 12-column grid with each section's name in a sticky left column.

## Idea

One stretch of countryside across a day. QA is the morning; the atelier is the evening ("outside of work, I make art").

- Gate: a single landscape from morning on the left to dusk on the right: hazy layered hills, a low sun on one side and a crescent moon and stars on the other, flooded paddies, utility poles and their wires running into the distance, mist drifting, fireflies at dusk. Over it, my name, Jakarta's local time, "Choose a door.", and two cards: QA (pale, morning side) and the atelier (night, evening side). Each whole card is the link, with an **Enter** pill.
- QA: a pale morning sky over the name, then a band of misty hills with a pair of poles. The page ends at dusk.
- The Willow Atelier: night over the hills, with stars, the moon, poles against the last light, and fireflies. Its index sits on the fields.
- 404: the hills, half lost in mist.

The landscapes are inline SVG, generated once (ridges from layered sine waves) and written into the pages; mist and fireflies are CSS.

## Colour

| Token | Value | Role |
|---|---|---|
| `--paper` | `#f2f5f9` | morning haze: light ground |
| `--sheet` | `#ffffff` | raised panels on light |
| `--ink` | `#131c3d` | blue-black text, like the far hills at dusk |
| `--ink-2` | `#3a4361` | body on light |
| `--grey` | `#616a86` | secondary on light |
| `--night` | `#0e1738` | the evening sky: dark ground |
| `--night-2` | `#18234e` | raised panels and empty frames at night |
| `--royal` | `#2445d6` | the one action colour on light (Enter, buttons) |
| firefly | `#f4e3a1` | fireflies, the atelier's Enter, its Japanese name |

Night text: `#f4f1e8` strong, `#ccd4ea` body, `#98a3c4` muted. Hills run from `#c3cfe0` (morning haze) to `#0e1640` (night).

## Type

- Shippori Mincho 500 to 700 for display: names, titles, section names.
- Schibsted Grotesk for text; IBM Plex Mono for the clock, dates and small labels; Noto Sans JP for Japanese.

## Motion

- Mist drifts sideways over 60 to 100 seconds; fireflies brighten and fade.
- Gate cards lift on hover; one click goes in, and the next page's ground slides up with a thin firefly-gold line leading.
- Reduced motion stops the mist and holds the fireflies still.
