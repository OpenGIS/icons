# @ogis/icons

Open GIS icon set — 49 SVG icons available as an **SVG sprite**, **icon font** (woff2/woff), and **CSS/SCSS** classes.

Live preview: <https://opengis.github.io/icons/>

---

## Installation

```bash
npm install @ogis/icons
```

---

## Usage

### CSS (icon font)

Import the stylesheet and use `<i>` tags with `oi-{name}` classes:

```html
<link rel="stylesheet" href="node_modules/@ogis/icons/dist/ogis-icons.css" />

<i class="oi-search"></i>
<i class="oi-gear"></i>
```

Or, when bundling with a CSS preprocessor:

```css
@import '@ogis/icons/css';
```

### SCSS

Import the full SCSS file (includes `@font-face` and all icon classes):

```scss
@use '@ogis/icons/scss';
```

If you only need the `$ogis-icons-map` Sass variable (no generated classes):

```scss
@use '@ogis/icons/scss-variables' as *;

.my-icon::before {
    content: map-get($ogis-icons-map, 'search');
}
```

### SVG sprite

The sprite is at `dist/ogis-icons.svg`. Reference individual icons via fragment identifier:

```html
<svg><use href="dist/ogis-icons.svg#search"></use></svg>
```

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

| File | Description |
|---|---|
| `dist/ogis-icons.svg` | SVG symbol sprite |
| `dist/ogis-icons.woff2` | Icon font (woff2) |
| `dist/ogis-icons.woff` | Icon font (woff) |
| `dist/ogis-icons.css` | CSS with `@font-face` + `.oi-*` classes |
| `dist/ogis-icons.scss` | SCSS with `@font-face` + `.oi-*` classes |
| `dist/ogis-icons-variables.scss` | SCSS variables only (no classes) |
| `dist/ogis-icons.json` | Codepoint map as JSON |

---

## License

MIT
