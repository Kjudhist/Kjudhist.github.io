# Design system: noren (暖簾)

The split curtain hung over a Japanese shop entrance. Recorded from the built site (css/base.css, gate.css, qa.css, art.css).

## Idea

A noren says "we're open, come in". The gate is two shop entrances, and each door is plainly a door.

- Gate: two cards side by side (stacked on phones). Each has its noren at the top, a name, one line, and an **Enter** button; the whole card is the link. One click or tap goes in.
- QA: the white side. The name beside a royal noren reading 品質保証, a royal band with the pitch, ruled tables and lists, and the address set large on a royal field.
- The Willow Atelier: royal throughout, with a white noren reading 柳の工房.
- Every section opens with a short noren tab carrying its name in Japanese (自己紹介, 経歴, 技能, 連絡; 絵画, 写真, 音楽, 由来, 所在). These are decoration and hidden from screen readers.
- 404: a noren reading 本日休業, "closed today".

## Colour

| Token | Value | Role |
|---|---|---|
| `--royal` | `#2445d6` | the cloth: QA noren, buttons, the atelier ground |
| `--royal-2` | `#1b35b0` | hover on royal, the doorway behind the atelier noren, empty frames |
| `--royal-3` | `#0f1f7a` | lintel on royal, viewer backdrop |
| `--white` | `#ffffff` | cards, the atelier noren |
| `--paper` | `#eef1f8` | gate ground (the street wall) |
| `--ink` | `#0b1030` | headings on white, the lintel |
| `--ink-2` | `#2b3152` | body on white |
| `--grey` | `#5a6080` | secondary text on white |
| `--pale` | `#c9d2ff` | secondary text on royal |

## Type

- Zen Old Mincho 600/900 for display: names, section titles, the characters on the cloth.
- Zen Kaku Gothic New 400/500/700 for everything else.
- Characters on noren are set vertically (`writing-mode: vertical-rl`).
- No small uppercase labels above headings; the noren tab does that job.

## Shape

- `--radius: 4px` on buttons and the switcher; gate cards 6px.
- A noren is a dark lintel (10px) over two panels with a 4px slit.
- Rules: 2px over tables and lists, 1px between rows.

## Motion

- Gate: hover or focus lifts the card and parts the curtain a little; a click parts it fully, then the next page's colour rises from the bottom (`.veil`).
- Text settles with a short fade and rise.
- Reduced motion turns movement off; the page still changes.
