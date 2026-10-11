# Design system: folio

A quiet, exact portfolio. Recorded from the built site (css/base.css, gate.css, qa.css, art.css).

## Idea

Restraint does the work: one accent, a strict grid, hairline rules, generous space, and type that is set carefully rather than loudly.

- Gate: my name and Jakarta's local time at the top, "Choose a door." large, then two full panels. Each whole panel is the link; a number and its Japanese name sit at the top, the title large at the bottom, and an **Enter** pill says what clicking does. QA is light, the atelier dark; hovering fills either with royal.
- Sections share one layout on both pages: a hairline across the top, the section's name (and its Japanese name, small) in a sticky left column, the content in the right nine columns.
- QA is light; contact sets the address large on a dark panel; the page ends on a dark band leading to the atelier.
- The atelier is near-black, with its three kinds of work as full-width index rows.

## Colour

One accent. Royal blue marks what you can act on and the one line that matters.

| Token | Value | Role |
|---|---|---|
| `--royal` | `#2445d6` | buttons, hover fills, the pitch, the current role's dot |
| `--royal-2` | `#1b36b3` | hover on royal |
| `--royal-soft` | `#8ea2ff` | royal as text on near-black |
| `--paper` | `#f5f6f8` | light ground |
| `--sheet` | `#ffffff` | raised panels on light |
| `--ink` | `#0b0d14` | text on light; the dark ground |
| `--ink-2` | `#3a3f4c` | body on light |
| `--grey` | `#6a7080` | secondary on light |
| `--night-2` | `#151925` | raised panels and empty frames on dark |

Dark text: `#f3f4f7` strong, `#c9cdd8` body, `#8d93a3` muted.

## Type

- Schibsted Grotesk 400 to 700 for text and display. Display is weight 500, tracked tight (to -0.055em), line-height under 1.
- IBM Plex Mono for numbers, dates, the clock and small field labels.
- Noto Sans JP for Japanese, including each section's Japanese name.
- No uppercase eyebrows. Small labels are mono, sentence case.

## Shape

- Pills (`999px`) for buttons, the switcher and skill tags; 6px for panels and frames.
- Hairlines: 1px at 10% for rows, 22% for section tops.
- No shadows except the pressed language option.

## Motion

- Gate: royal rises inside a panel on hover; a click fills it and the next page's ground slides up with a royal line leading (`.veil`).
- Index rows indent slightly on hover; arrows nudge.
- Text settles with a short fade and rise. Reduced motion turns movement off.
