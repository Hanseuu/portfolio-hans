# Portfolio — Hans Hendyanto

Personal portfolio site: photography, videography, 3D modeling, and audio work.
Static HTML, CSS, and vanilla JavaScript — no build step, no dependencies.

```
index.html            markup and content
style.css             all styling (dark theme, responsive)
script.js             nav, scroll reveal, gallery filter, lightbox, contact form
asset/                original camera-resolution photos + social icons
asset/web/            1600px derivatives, used by the lightbox
asset/thumbs/         800px derivatives, used by the gallery grid
tools/optimize-images.py   regenerates the two derivative folders
```

## Running locally

No tooling needed — open `index.html` in a browser. To exercise it over HTTP
(closer to production, and required for `localStorage` in some browsers):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Images

The files in `asset/` are straight off the camera — up to 9.4 MB each, ~31 MB
total. Those are kept as the archive copies but are never sent to the browser.
The page loads the derivatives instead:

| Set             | Long edge | Used for      | Total (WebP) |
| --------------- | --------- | ------------- | ------------ |
| `asset/thumbs/` | 800 px    | gallery grid  | ~0.45 MB     |
| `asset/web/`    | 1600 px   | lightbox view | ~1.1 MB      |

Each derivative is written as both `.webp` and `.jpg`; the markup offers the
WebP through `<picture>` and falls back to JPEG on older browsers.

After adding or replacing a photo in `asset/`, regenerate the derivatives:

```bash
pip install Pillow
python3 tools/optimize-images.py
```

The script also bakes EXIF rotation into the pixels (two source files carry
orientation 8) and strips metadata.

## Adding a portfolio item

Copy an existing `<figure class="portfolio-item">` block in `index.html` and update:

- `data-category` — one of `event`, `product`, `food`, `3d` (must match a
  `data-filter` value on the filter buttons)
- `data-full` / `data-full-webp` — the `asset/web/` paths for the lightbox
- the `<source>` and `<img>` paths — the `asset/thumbs/` files
- `width` / `height` on the `<img>` — the real thumbnail dimensions, so the
  browser can reserve space and avoid layout shift
- the `alt` text, the `aria-label` on the button, and the overlay tag/title

## Notes

- The contact form has no backend. Submissions are validated client-side and
  saved to `localStorage` in the visitor's own browser only — nothing is sent
  anywhere, and Hans never receives them. The form says so, and lists the email
  and WhatsApp links as the real way to get in touch. Wiring this to a service
  such as Formspree or a serverless function would make it functional.
- Respects `prefers-reduced-motion`: scroll reveals and transitions are disabled.
- Keyboard support: the gallery tiles are buttons, and the lightbox handles
  `Esc` to close plus arrow keys to move between images.
