# kjudhist.github.io

My personal site. It opens on two doors: one goes to my QA work, the other to The Willow Atelier, where I keep my art.

The look is *kintsugi* (金継ぎ): navy glazed ceramics mended with gold. Deep ruri glaze with pooling and a fine crackle; gold only as thin seams and highlights. The gate is a great glazed plate whose inner well is broken in two, and the halves are the doors (QA a clean cut with a ruled gold seam, the atelier a shard with branching rivers of gold); tap the glaze and it cracks, and gold flows in to mend it. The QA page is matte porcelain, calm and professional, with a gold reading line and a test runner that stamps each role with a gold 合格 seal. The atelier has a chawan you can shatter and mend (more gold every time), gold dust that drifts toward the pointer and tiles that crackle with gold. The worlds are a shattered realm that comes back together as you scroll, with a river of molten gold you steer. The 404 is a broken cup you mend. Page changes are the next page's glaze washing across behind a gold seam. Type is Kaisei Decol for display, Murecho for text and DM Mono for small facts. The design system is written down in `DESIGN.md`.

Plain HTML, CSS and JavaScript. No framework, no build step. GitHub Pages serves the files as they are.

Live at https://kjudhist.github.io/

## Folder structure

```
/
├── index.html            the gate (two doors)
├── qa/index.html         QA side
├── art/index.html        The Willow Atelier
├── world/index.html      Worlds: lore, maps, characters (linked from the end of the atelier)
├── 404.html              shown by GitHub Pages for any missing page
├── css/
│   ├── base.css          colours, type, header, language switcher, footer, motion
│   ├── gate.css          the gate: the plate and its two halves (and the 404's broken cup)
│   ├── qa.css
│   ├── art.css
│   └── world.css         loads after art.css and reuses its index, frames and viewer
├── js/
│   ├── i18n.js           the EN / ID / JA dictionary and the switcher
│   ├── main.js           shared bits: page changes, scroll reveals, menu, clock, local links
│   ├── kintsugi.js       the shared craft: glaze painting, shards, cracks, gold seams, the breakable vessel
│   ├── gate.js           the gate: the glazed plate, its cracks and gold, the two halves as doors
│   ├── qa.js             the QA test runner, the email Copy button and the gold reading line
│   ├── art.js            the atelier's bowl, gold dust, tile crackle, and the full-size viewer
│   ├── world.js          the shattered realm behind the worlds page, and its river of gold
│   └── lost.js           the 404's broken cup
├── assets/
│   ├── art/              artworks, photos and covers (empty for now)
│   ├── cv/               kevin-jg-cv.pdf (placeholder)
│   ├── icons/            favicon.svg, favicon.ico, apple-touch-icon, manifest icons
│   ├── og/               share images, 1200×630
│   └── src/              HTML sources for the icons and CV
├── .nojekyll             tells GitHub Pages to serve files as-is
└── README.md
```

All paths are relative, so the site also works when you open `index.html` straight from disk. Folder links like `qa/` get pointed at `qa/index.html` automatically in that case.

## Running it locally

Double-click `index.html`, or serve the folder so it behaves exactly like GitHub Pages:

```bash
python -m http.server 8080
```

Then open http://localhost:8080.

## Editing text (the i18n dictionary)

Every piece of copy lives in `js/i18n.js`, in one object with three languages:

```js
const DICT = {
  en: { 'qa.about.title': 'About me', ... },
  id: { 'qa.about.title': 'Tentang saya', ... },
  ja: { 'qa.about.title': '私について', ... }
};
```

The HTML points at those keys:

```html
<h2 data-i18n="qa.about.title">About me</h2>
<span aria-label="..." data-i18n-attr="aria-label:art.track.play"></span>
<meta name="description" content="..." data-i18n-attr="content:meta.qa.desc">
```

- `data-i18n` replaces the element's text.
- `data-i18n-attr` sets attributes, as `attribute:key`, separated by `;` if there's more than one.
- The English text written in the HTML is what shows if JavaScript is off, so keep it in step with the `en` entry.
- To add a string, add the key to all three languages. A key missing from `id` or `ja` falls back to English.

Which language a visitor sees, in order:

1. `?lang=en`, `?lang=id` or `?lang=ja` in the address
2. what they picked last time (saved in localStorage)
3. their browser languages, in their own order (`ja*` → Japanese, `id*` or `in*` → Indonesian, `en*` → English)
4. English

The Indonesian and Japanese strings are first drafts and need a read from a native speaker. The QA pitch and the atelier tagline are final in all three.

## The pages

- **Gate:** a navy glazed plate fills the window, with my name, Jakarta's local time and the language switcher above it. Its inner well is broken in two and each half is a door: one click, tap or Enter goes in, and the half lifts away.
- **QA (porcelain):** the name large on a cool off-white ground beside a mended navy plate, the pitch and two actions under it. Each section has its name in a sticky left column and the content on the right. Experience is a table of roles with a test runner; skills lead with testing; contact sets the address large on a navy glazed panel. The page ends on a navy band leading to the atelier.
- **The Willow Atelier (the studio at night):** the name large, the tagline, a chawan to break and mend, and an index of glazed tiles:
  1. **Drawing & Painting**, a grid of frames
  2. **Photography**, a row of frames scrolled sideways
  3. **Music**, a ruled list of tracks

  Then the story with the poem set vertically beside a gold seam, two tiles for Instagram and the shop, and the way on to the worlds.
- **Worlds:** the realms, maps, characters and lore, each on a shard of its own, over the shattered world.

With reduced motion turned on nothing moves on its own: the canvases draw still frames, the worlds follow the scroll only, and page changes are a short fade. Everything still works.

## Replacing placeholders

Anything in `[square brackets]` is a placeholder. Most of them live in `js/i18n.js`. Search for `[` there and fill in all three languages. Placeholders are styled with the `ph` class (muted, dotted underline). Remove `class="ph"` from the element once it has real content.

| What | Where |
|---|---|
| About the atelier text | `art.about.*` in `js/i18n.js` |
| Case studies | hidden for now; the old markup is in git history (see the comment in `qa/index.html`) |
| Drawings and paintings | six empty frames ("Art 1" to "Art 6") under Drawing & Painting in `art/index.html`; `piece--wide` makes a landscape frame. Put the image in `assets/art/`, then swap a slot's `<div class="slot">` for `<button class="work__open" type="button" data-view data-title="Title" data-meta="Medium, Year"><img src="../assets/art/your-file.jpg" width="…" height="…" alt="…" loading="lazy"></button>`. Clicking it opens the full-size viewer |
| Photos | six frames ("Photo 1" to "Photo 6") under Photography. Same swap as above; `print--tall` makes a portrait frame |
| Music | four tracks under Music. Fill in `art.track.*` (or write the title straight into the HTML), and when a track is out turn its title into a link and drop the "Coming soon" tip |
| A line for each room | `art.painting.text`, `art.photo.text`, `art.music.text` in `js/i18n.js` |
| Instagram and shop links | `art/index.html`: add `href="..."` to the two `<a>` tags under "Find the atelier" and delete their "[Link coming soon]" lines |
| CV | the download buttons are greyed out ("Still in progress"). Replace `assets/cv/kevin-jg-cv.pdf`, then turn both `<span class="btn is-pending">` back into links (see the comments in `qa/index.html`) |
| LinkedIn | `qa/index.html`: uncomment the LinkedIn block in the contact list |
| Share images | `assets/og/og-gate.jpg` and `og-art.jpg` (see below) |

### Regenerating the share images, icons and CV

- Share images: serve the site locally, open the gate (or the atelier) in Chrome with the window at 1200×630 (DevTools device toolbar), and use "Capture screenshot". For the atelier, hide the header first.

The files in `assets/src/` are plain pages:

- `icons.html`: draws `assets/icons/favicon.svg` at 16, 32, 48, 180, 192 and 512 px and prints each PNG as a data URL.
- `cv.html`: the placeholder CV. Print to PDF at A4 with backgrounds on.

## Deploying to GitHub Pages

This repo is a GitHub user site, so it's served from the root of https://kjudhist.github.io/.

1. Push to `main` on `Kjudhist/kjudhist.github.io`:
   ```bash
   git push origin main
   ```
2. On GitHub, open the repo's **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **Deploy from a branch**, branch **main**, folder **/ (root)**, and save. Only needed the first time.
4. Wait a minute or two. The **Actions** tab shows the "pages build and deployment" run. When it's green, the site is live.
5. Open https://kjudhist.github.io/ and give it a hard refresh (Ctrl+F5) if you still see the old version.

`404.html` is picked up automatically for any address that doesn't exist. It pins its links to the site root, so it works at any depth (like `/some/old/link`). If the site ever moves to a project page (`username.github.io/repo/`), change the `<base href="/">` at the top of `404.html` to `/repo/`.

## Notes for tests later

Key elements carry `data-testid` attributes:

- Gate: `door-qa`, `door-art`, `gate-doors`
- Switcher: `lang-switcher`, `lang-option-en`, `lang-option-id`, `lang-option-ja`
- Navigation: `nav-*`, `nav-toggle`, `back-to-gate`, `link-to-art`
- Sections: `section-*`
- Gate name: `station-sign`
- Atelier: `art-index`, `index-*`, `painting-1` to `painting-6`, `photo-1` to `photo-6`, `track-1` to `track-4`, `viewer-close`, `link-instagram`, `link-shop`
- Footer: `site-footer`

The door logic and the language logic are small named functions exposed on `window.gate` and `window.i18n`, so they can be called directly from a test.
