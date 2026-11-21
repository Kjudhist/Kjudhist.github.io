# Design system: shoji (障子)

Sliding screens of paper in a lacquered frame, with a thin wooden lattice (kumiko) over the paper. The site is one house at night: QA is the room by day, the atelier is the room after dark ("outside of work, I make art"), and both look out on the same garden. Recorded from the built site (css/base.css, gate.css, qa.css, art.css, world.css; js/main.js, gate.js). Layout comes from folio: a 12-column grid with each section's name in a sticky left column.

## Idea

The design is meant to be handled, not only looked at. Four things recur:

1. **Doors you slide.** On the gate each door is a pair of shoji. Drag the pair apart and the screens follow your hand; let go past the middle and you go in, short of it they slide shut. A click, a tap or Enter slides them open for you. Hover parts them a finger's width.
2. **The lantern.** A soft light under the page follows the pointer (or the last touch), and where it falls you can see the lattice of the screen behind the page.
3. **Shadows on the paper.** The willow is a shadow cast by the lantern: it sways, leans toward the light and slides away from it. On the gate, bamboo throws its shadow on the day door and the willow on the night door; the shadow stays put while the paper slides under it.
4. **Screens between pages.** Changing page, a pair of screens in the next page's tone slides shut; the next page opens them again.

Pages:

- Gate: two doors side by side (stacked on phones). Each is a frame with a heavy lintel and a sill, two panels with pulls (hikite), and a garden behind: by day for QA, under the moon for the atelier. A vertical name plate (品質保証 / 柳のアトリエ) hangs on the lintel's corner. Under each frame is a caption with the door's name and an **Enter** block: on paper for QA, on the night for the atelier. A line under both says how the doors work. The whole door is a plain link.
- QA: the name, the willow's shadow, then the engawa: four screens across the page, the middle pair sliding open on arrival to show the garden by day. Either middle screen can be dragged. Contact is a block in the night colour. The page ends on a sill (a double rail) over the night, leading to the atelier.
- The Willow Atelier: the same, after dark. The paper is lit low; the garden has the moon and stars.
- Worlds (`/world/`, not on the gate; reached from the closing band of the atelier): the same night, with more stars and the charts.
- 404: a shoji wall with a hole in it, and nothing behind but the night. Click or tap the paper to poke more holes; the lattice stays where the paper is torn.

The garden views are inline SVG (sky gradient, sun or moon, mist bars, four ridges), generated once and written into the pages.

## Colour

One ink in five strengths, paper, and the night. Nothing else.

| Token | Value | Role |
|---|---|---|
| `--paper` | `#edf0f4` | the wall: light ground |
| `--sheet` / `--shoji-paper` | `#f7f9fc` | screen paper, captions, name plates |
| `--ai-1` | `#cfdcf1` | far ridge, mist |
| `--ai-2` | `#8eabe3` | mid ridge; the ink as text on night |
| `--ai-3` / `--royal` | `#2449d8` | actions |
| `--ai-4` | `#17318f` | hover |
| `--ai-5` / `--ink` / `--frame` | `#0c1b4d` | text, rules, the lacquered frames and lattice |
| `--night` | `#0b1848` | dark ground |
| `--night-2` | `#13235f` | panels at night; the dark page-change screens |

At night the screen paper is lit low (`#dbe3f2`). Night text: `#f1f4fa` strong, `#c5cfe8` body, `#94a2c8` muted.

## Type

- Shippori Mincho B1 500 to 800 for display: names, titles, section names. A mincho with a brushed finish, covering Latin and Japanese.
- Zen Kaku Gothic New for text in every language; DM Mono for the clock, dates and small labels.

## Shape and line

- Square corners everywhere (`--radius: 2px`).
- Frames are thick and solid: a heavier lintel on top, a sill below. The lattice is 2px bars in the frame colour, three columns by seven rows on a door.
- The sticky header ends in a double rule, like the top rail of a screen. Hairlines (`--line`) only divide rows inside a block.
- Japanese section names sit in a small ruled box. A faint paper grain lies over everything.

## Motion

- Arrival: the screens open from the middle (0.85s); the title is revealed the same way, from the middle out; the engawa's middle pair slides open after 0.7s.
- Gate: hover parts a door slightly; drag follows the hand; opening takes 0.8s, then a short step into the garden (the view scales up) before the page-change screens close.
- Ambient: the willow and bamboo sway, the stars twinkle, the lantern trails the pointer.
- Reduced motion: no sway, no twinkle, no lantern movement, the engawa is already open, and page changes are a short fade.
