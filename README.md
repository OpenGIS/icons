# @ogis/icons

Open GIS icon set — available as an **SVG sprite**, **icon font** (woff2/woff), and **CSS/SCSS** classes.

Live preview: <https://ogis.org/icons/>

---

## With a build step (npm)

### Install

```bash
npm install @ogis/icons
```

### CSS icon font

Import the stylesheet and use `<i>` tags with `oi-{name}` classes:

```css
@import "@ogis/icons/css";
```

```html
<i class="oi-search"></i> <i class="oi-gear"></i>
```

### SCSS

Import the full SCSS file (includes `@font-face` and all icon classes):

```scss
@use "@ogis/icons/scss";
```

If you only need the `$ogis-icons-map` Sass variable (no generated classes):

```scss
@use "@ogis/icons/scss-variables" as *;

.my-icon::before {
  content: map-get($ogis-icons-map, "search");
}
```

### SVG sprite

Copy or serve `node_modules/@ogis/icons/dist/ogis-icons.svg` and reference icons by ID:

```html
<svg width="16" height="16">
  <use href="/assets/ogis-icons.svg#search"></use>
</svg>
```

---

## Without a build step (CDN)

All assets are available via [jsDelivr](https://www.jsdelivr.com/) — no install required.

Replace `@0.1.0` with the version you want, or use `@latest` to always get the newest release.

### CSS icon font

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@ogis/icons@0.1.0/dist/ogis-icons.css"
/>

<i class="oi-search"></i>
<i class="oi-gear"></i>
```

### SVG sprite

```html
<svg width="16" height="16">
  <use
    href="https://cdn.jsdelivr.net/npm/@ogis/icons@0.1.0/dist/ogis-icons.svg#search"
  ></use>
</svg>
```

> **Note:** Browsers block cross-origin `<use href="…">` references to external SVG files. Either self-host the sprite or inline it at the top of your HTML before using fragment references.

---

## Development

### Build

Regenerates everything in `dist/` from the SVG sources in `src/svg/`:

```bash
npm run build
```

The build pipeline:

1. **PNG → SVG** — traces any PNGs in `src/png/` with Potrace and optimises them with SVGO.
2. **Normalise** — scales all SVGs to a 16 × 16 viewBox.
3. **SVG sprite** — bundles all icons into `dist/ogis-icons.svg`.
4. **Icon font** — generates `ogis-icons.woff2` / `.woff` plus CSS, SCSS, and JSON outputs.
5. **SCSS variables** — writes `dist/ogis-icons-variables.scss` with the `$ogis-icons-map`.

### Preview

Start a local dev server (uses Vite):

```bash
npm run dev
```

### Adding icons

- Place new `.svg` files in `src/svg/` (or `.png` files in `src/png/` for auto-tracing), then run `npm run build`.
- Codepoint assignments are persisted in `src/codepoints.json` so existing icons keep stable Unicode values.

---

## Outputs

| File                             | Description                              |
| -------------------------------- | ---------------------------------------- |
| `dist/ogis-icons.svg`            | SVG symbol sprite                        |
| `dist/ogis-icons.woff2`          | Icon font (woff2)                        |
| `dist/ogis-icons.woff`           | Icon font (woff)                         |
| `dist/ogis-icons.css`            | CSS with `@font-face` + `.oi-*` classes  |
| `dist/ogis-icons.scss`           | SCSS with `@font-face` + `.oi-*` classes |
| `dist/ogis-icons-variables.scss` | SCSS variables only (no classes)         |
| `dist/ogis-icons.json`           | Codepoint map as JSON                    |

---

## License

MIT
