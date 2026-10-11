# Design system: aizome (藍染)

Japanese indigo dyeing, set like a 1960s Japanese poster. Recorded from the built site (css/base.css, gate.css, qa.css, art.css), not from intentions.

## Idea

Cloth goes into the indigo vat again and again; each dip is a deeper blue. The site uses that ladder as its whole palette and "the dip" as its one motion idea:

- QA hero: the name is dipped halfway; the dye line rises into it on load (`--dip`, registered with `@property`).
- Experience: one band per role, deeper blue for the current role, paler for older ones.
- Gate: the chosen half soaks the screen; page changes rise in from the bottom (`.veil` clip-path).
- Colour fields marked `data-dye` rise into place on scroll; text marked `data-reveal` fades up.

## Colour

Strategy: committed. Indigo carries most surfaces; light pages are undyed cotton with indigo fields.

| Token | Value | Role |
|---|---|---|
| `--ai-50` | `#f2f6f9` | undyed cotton, light page ground, text on deep indigo |
| `--ai-100` | `#e0e9f1` | shoji paper, quiet tags, palest experience band |
| `--ai-200` | `#bfd2e3` | accent text on indigo |
| `--ai-300` | `#8eaecb` | middle experience band, 404 numerals |
| `--ai-400` | `#5a84ad` | scrollbar thumb |
| `--ai-500` | `#33608f` | record label, dots |
| `--ai-600` | `#234a77` | shibori cloth |
| `--ai-700` | `#193a62` | kon: doors, vat, current role, slots |
| `--ai-800` | `#12294a` | dark page ground |
| `--ai-900` | `#0b1a31` | ink on cotton, deepest band, page end |
| `--shu` | `#e2572f` | vermilion: marks only (door handle, arrows, active nav, focus ring). Never body text |
| `--shu-bright` | `#ef714b` | the same vermilion lifted for text on deep indigo (柳) |

Themes: `:root` and `.theme-light` are cotton; `.theme-dark` is indigo. Text on cotton is `--ai-900` / `#22344f`, muted `#4b5d77`; on indigo `--ai-50` / `#d6e2ee`, muted `#a3b8cf`.

## Type

- Latin: Archivo (variable width and weight). Display at `font-stretch: 125%`, weight 800, tight leading (0.9 to 0.95), tracking -0.02em. Body at normal width, 400 to 600.
- Japanese: Zen Kaku Gothic New 400/500/700/900. Used for the whole page when `lang="ja"`, and for 柳 and the vertical poem.
- Sizes are fluid `clamp()`; display tops out around 6.25rem.
- No serif, no monospace, no small uppercase labels above headings, no section numbers.

## Shape and texture

- Square corners everywhere. Circles appear only as objects (shibori rings, the record).
- Rules are poster-flat: 3px solid bars above groups, 1px hairlines between rows.
- Texture comes from resist dyeing, drawn in CSS: kanoko spots (repeating radial dots) on indigo grounds and placeholder slots, kumo rings (repeating radial gradients masked by conic "threads") on the art hero and record label.

## Components

- Buttons: solid fill, square, `--fg-strong` on `--bg`. Pending state is an outline with a tooltip.
- Language switcher: three squares; the chosen one is filled.
- Nav: plain links; the current section gets a vermilion stripe.
- Placeholders: `.ph` (italic, dotted underline) for text; `.slot` (kanoko-spotted indigo) for images.

## Motion

Exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`), CSS only. Reduced motion removes every travel and loop; doors still open, instantly.
