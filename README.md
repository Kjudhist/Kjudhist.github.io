# kjudhist.github.io

My personal site. It opens on two doors: the left one goes to my QA work, the right one to The Willow Atelier, where I keep my art.

Plain HTML, CSS and JavaScript. No framework, no build step. GitHub Pages serves the files as they are.

Live at https://kjudhist.github.io/

## Folder structure

```
/
├── index.html            the gate (two doors)
├── qa/index.html         QA side
├── art/index.html        The Willow Atelier
├── 404.html              shown by GitHub Pages for any missing page
├── css/
│   ├── base.css          colours, type, header, language switcher, footer, motion
│   ├── gate.css          the doors (and the 404, which shares the dark room)
│   ├── qa.css
│   └── art.css
├── js/
│   ├── i18n.js           the EN / ID / JA dictionary and the switcher
│   ├── main.js           shared bits: page fades, scroll reveals, menu, local links
│   ├── gate.js           door behaviour (hover, tap twice on phones, walk through)
│   └── art.js            the atelier: ink bloom, night garden, emaki, viewer, noren
├── assets/
│   ├── art/              placeholder artworks (SVG)
│   ├── cv/               kevin-jg-cv.pdf (placeholder)
│   ├── icons/            favicon.svg, favicon.ico, apple-touch-icon, manifest icons
│   ├── og/               share images, 1200×630
│   └── src/              HTML sources for the share images, icons and CV
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
<img alt="..." data-i18n-attr="alt:art.alt.1">
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

## The atelier page

The art side is built as a night garden you walk through:

- **Arrival:** the page opens through spreading ink.
- **Hero:** a moon with drifting clouds, misty hills and a pond (click the water). Willow strands swing away from the cursor. Fireflies wander, and gather around the cursor when it rests.
- **Works:** an emaki (handscroll). On screens 900px and wider it pins in place and scrolling down unrolls it sideways while an ink river paints itself. On phones it's a swipeable strip. Clicking a piece opens it full size.
- **About:** a sheet of washi with torn edges, where an ensō paints itself around the tagline.
- **Links:** two noren (shop curtains) that sway, and part when hovered or tapped.

With reduced motion turned on, all of that becomes a still scene: no bloom, nothing pinned, the ink and ensō already drawn.

## Replacing placeholders

Anything in `[square brackets]` is a placeholder. Most of them live in `js/i18n.js`. Search for `[` there and fill in all three languages. Placeholders are styled with the `ph` class (muted, dotted underline). Remove `class="ph"` from the element once it has real content.

| What | Where |
|---|---|
| About, extra job bullet, case studies, skill and tool placeholders | `js/i18n.js` |
| Artworks | swap the files in `assets/art/`, then update `width`/`height` on each `<img>` in `art/index.html` to the new image's size. How tall each piece sits on the scroll is `--h` in `css/art.css` (`.emaki__work--1` to `--6`), as a share of the paper's height |
| Artwork titles, medium, year | `art.ph.*` keys in `js/i18n.js`. Each artwork needs its own keys once they're real |
| Instagram and shop links | `art/index.html`: add `href="..."` to the two noren `<a>` tags under "Find the atelier" and delete their "[Link coming soon]" lines |
| CV | replace `assets/cv/kevin-jg-cv.pdf`, keeping the file name |
| LinkedIn | `qa/index.html`: uncomment the LinkedIn block in the contact list |
| Share images | `assets/og/og-gate.jpg` and `og-art.jpg`. Sources are in `assets/src/` (see below) |

### Regenerating the share images, icons and CV

The files in `assets/src/` are plain pages built from the site's own CSS:

- `og-gate.html` and `og-art.html`: serve the site locally, open the page in Chrome with the window at 1200×630 (DevTools device toolbar), and use "Capture screenshot".
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
- Atelier: `art-tile-1` to `art-tile-6`, `viewer-close`, `link-instagram`, `link-shop`
- Footer: `site-footer`

The door logic and the language logic are small named functions exposed on `window.gate` and `window.i18n`, so they can be called directly from a test.
