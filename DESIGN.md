# Design system: kintsugi (金継ぎ)

Navy glazed ceramics, broken and mended with gold. Recorded from the built site (css/base.css, gate.css, qa.css, art.css, world.css; js/main.js, kintsugi.js, gate.js, qa.js, art.js, world.js, lost.js). Layout comes from folio: a 12-column grid with each section's name in a sticky left column.

## The idea

Beauty in repair. Everything is a deep ruri (瑠璃) glaze, with depth: it pools glassy and bright where it is thick, darkens where it turns away, runs thin and pale at a rim, and carries a fine crackle (kannyū). Gold is the only second colour, and it only ever appears as a line: a seam, a tick, a thread, a glint. Never a field of gold. Navy dominates every page.

The same craft runs through all the canvases (js/kintsugi.js): a glaze painted once into an offscreen canvas; shapes broken into Voronoi shards whose edges are a little jagged and identical on both sides, so they fit back together; branching cracks that grow from a point; and gold that flows into cracks outward from where they were struck, with a running glint and a soft bloom.

The fantasy gradient:

- **QA** is professional: porcelain, calm, useful. One thin gold rule. Nothing toy-like.
- **The Willow Atelier** is extra: a studio of glaze at night where you break and mend things.
- **Worlds** is the most: a shattered realm drifting in a void that you piece back together.
- **The gate** foreshadows both: one half of the plate is calm and exact, the other is magic.

## Pages

- **Gate.** A large navy glazed plate fills the stage, lit by a soft highlight that follows the pointer, with the rim catching the light on the near side; gold dust drifts up in the void. The plate already carries two old gold mends. Tap the glaze (the outer ring) and it cracks from that point, the cracks racing out dark, and then gold flows slowly into them and stays. The plate's inner well is broken in two, and the halves are the doors. QA: a clean straight cut, its edge a straight gold seam with ruled measurement ticks and a dotted hairline beside it. The atelier: a shard whose gold seams branch across it like rivers, breathing, with light running down them. Hover or focus lifts a half (with a deeper shadow) and brightens its seam; click or Enter and that half lifts away and turns, the other dims, and the next page's glaze washes in. On narrow screens the well breaks across, QA above the atelier.
- **QA.** Matte porcelain, cool (not cream). Navy type, a calm grid, hairline rules with one short gold run where each section begins. A mended navy plate sits beside the name, with one gold seam. A gold reading line is drawn across the top of the window as you read, as a slightly broken seam. The experience runs as a test suite: each field is checked in turn, a gold seam runs down the passed case's edge, and a fine double-ringed gold 合格 seal is stamped on it. Contact sits on a navy glazed panel crossed by one gold seam, with a Copy button. The page ends on a navy band to the atelier.
- **The Willow Atelier.** A dark navy studio. In the hero, a chawan: tap it and it shatters into shards that fly apart and fall to the floor; press and hold and they are pulled home; once whole, gold flows into every crack from where it was struck, glows, sparks, and is fired into the glaze for good, so the bowl carries more gold each time (a button does the same for keyboards, and a count keeps the mends). Gold dust drifts over the page and is drawn toward the pointer in a slow swirl. The index and the link cards are glazed tiles that crackle with gold from wherever the pointer came in, and heal when it leaves. Frames are glazed tiles with a sheen that slides across on hover. The poem is set vertically beside a gold seam.
- **Worlds.** A shattered realm behind the page: thirteen great shards of a world (navy glaze outside, the world painted inside as an old chart in gold line on a seigaiha sea) drift at different depths in a void, turning so they flash from glaze to painting, tied to their neighbours by gold threads with light running along them. Pointer (or a phone's tilt) moves them in parallax by depth. A river of molten gold runs through the void with embers rising off it, and bends toward the pointer. Clicking the void pushes nearby shards away. Scrolling reassembles the world shard by shard from the middle out; the cracks between home shards turn to gold, and at the end of the page the world is whole. Each section sits on a shard of its own: a glazed panel with a broken outline and a gold edge, which settles into place as it comes into view.
- **404.** A broken cup lies in pieces. Tap it and the shards come home and the cracks fill with gold. Then "Nothing behind this door."

## Colour

| Token | Value | Role |
|---|---|---|
| `--night-3` | `#060d2e` | the deepest ground: the gate's void, the 404 |
| `--night` | `#0b1848` | dark ground: atelier, panels, the QA end band |
| `--night-2` | `#112263` | raised on dark |
| `--ai-5` / `--ink` | `#0c1b4d` | text on porcelain, buttons on porcelain |
| `--ai-4` / `--royal-2` | `#17318f` | glaze body, hover |
| `--ai-3` / `--royal` | `#2449d8` | glaze where it pools, actions on dark |
| `--ai-2` | `#8ea4e0` | pale glaze at a rim, text accents on dark |
| `--porcelain` | `#f1f3f7` | QA ground (cool off-white) |
| `--porcelain-2` | `#fafbfd` | QA cards |
| `--gold` | `#d9b45e` | seams, ticks, threads (lines only) |
| `--gold-hi` | `#f6e2a8` | the bright core of a seam, glints, focus on dark |
| `--gold-lo` | `#a07a2c` | the shadowed edge of a seam |
| `--gold-ink` | `#8a6420` | gold dark enough to read on porcelain |

Glaze in the canvases runs `#2c4fc2` → `#1a3591` → `#0f2063` → `#070f38`, with pools of `rgba(46, 86, 230, …)` and crackle in `rgba(150, 175, 255, 0.075)`.

## Type

- Kaisei Decol for display: names, titles, section names, the Japanese labels, the 合格 seal, numbers in lists.
- Murecho for text in every language; DM Mono for the clock, dates, counts and small labels.

## Shape

- Ceramic, not round: `--radius: 4px` for anything you press, `--radius-box: 6px` for cards and tiles. The track buttons and the viewer's close are circles.
- Rules are hairlines; a section's top rule has one short gold run.
- Japanese section names are small, wide-tracked, with a gold tick before them.
- Worlds: panels and index tiles are clipped into irregular shards with a gold drop-shadow edge.

## Motion

- Page change: the next page's glaze (porcelain for QA, navy for the rest) washes across on a skew, led by a gold seam; the next page lets it run on and off the far side.
- Arrival: titles settle in out of a blur.
- Ambient: dust drifting on the gate and the atelier; the atelier half's rivers breathing; the worlds' shards drifting and turning, the river flowing.
- Physics: shards fly and fall with gravity and bounce on the floor; holding pulls them home on a spring; the river's nodes are springs that lean toward the pointer.
- Every canvas loop pauses when the tab is hidden, and the vessels' loops stop when they are at rest or off screen.
- Reduced motion: nothing moves on its own. The gate draws still frames (a tap shows the crack already gilded; hover still lifts a half); a broken vessel falls to rest at once and mends straight to gold; no dust; the worlds draw a still frame that follows the scroll only, with no drift, no river flow and no settling panels; the test runner stamps at once; page changes are a short fade.
