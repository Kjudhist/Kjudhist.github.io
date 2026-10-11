# kjudhist.github.io

My personal site. It opens on one screen split in two: a door on cream that goes to my QA work, and a shoji on navy that goes to The Willow Atelier, where I keep my art.

The look is *ma* (間): two colours, thin lines, a lot of room, and only small, cheap motion.

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
│   ├── gate.css          the split gate and its doors (and the 404)
│   ├── qa.css
│   └── art.css
├── js/
│   ├── i18n.js           the EN / ID / JA dictionary and the switcher
│   ├── main.js           shared bits: page fades, scroll reveals, menu, local links
│   ├── gate.js           door behaviour (hover, tap twice on phones, walk through)
│   └── art.js            the full-size viewer for artworks
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

- **Gate:** cream on the left, navy on the right. Hover (or tap once on a phone) and the door opens a little: a tick waits behind the QA door, the moon behind the shoji. Click (or tap again) and that half takes the whole screen before the next page fades in.
- **QA:** a report you can scan. Every section head has a small box that gets ticked as it comes into view, and the hero has a tiny "test run" of the facts.
- **The Willow Atelier:** a moon and a willow, then three rooms:
  1. **Drawing & Painting**, a wall of pieces
  2. **Photography**, a strip of frames you scroll sideways
  3. **Music**, a record (it turns while you're in the section) and a track list

  Then a cream sheet for the story, and the links.

With reduced motion turned on, nothing travels: doors still open, but instantly, and the willow, record and water stand still.

## Replacing placeholders

Anything in `[square brackets]` is a placeholder. Most of them live in `js/i18n.js`. Search for `[` there and fill in all three languages. Placeholders are styled with the `ph` class (muted, dotted underline). Remove `class="ph"` from the element once it has real content.

| What | Where |
|---|---|
| About the atelier text | `art.about.*` in `js/i18n.js` |
| Case studies | hidden for now; the old markup is in git history (see the comment in `qa/index.html`) |
| Drawings and paintings | six empty slots ("Art 1" to "Art 6") under Drawing & Painting in `art/index.html`. Put the image in `assets/art/`, then swap a slot's `<div class="slot">` for `<button class="work__open" type="button" data-view data-title="Title" data-meta="Medium, Year"><img src="../assets/art/your-file.jpg" width="…" height="…" alt="…" loading="lazy"></button>`. Clicking it opens the full-size viewer |
| Photos | six frames ("Photo 1" to "Photo 6") under Photography. Same swap as above; `frame--tall` makes a portrait frame |
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
- Gate cues: `door-qa-cue`, `door-art-cue`
- Atelier: `art-index`, `index-*`, `painting-1` to `painting-6`, `photo-1` to `photo-6`, `track-1` to `track-4`, `viewer-close`, `link-instagram`, `link-shop`
- Footer: `site-footer`

The door logic and the language logic are small named functions exposed on `window.gate` and `window.i18n`, so they can be called directly from a test.
