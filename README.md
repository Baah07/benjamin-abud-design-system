# Benjamín Abud — Design System

The foundations and components behind [Benjamín Abud's portfolio](https://baah07.github.io/benjamin-abud-design-system/), exported from Figma and checked on every change.

| Standard | How it is enforced |
| --- | --- |
| **DTCG 2025.10** | [`tokens.json`](tokens.json) + [`tokens.resolver.json`](tokens.resolver.json); `scripts/validate-dtcg.mjs` lints types, aliases, cycles and resolver sync. |
| **Style Dictionary** | `scripts/build-tokens.mjs` builds [`tokens.css`](tokens.css), `tokens.js` and `tokens.d.ts`. |
| **CSS Color 4** | Every color ships as `oklch()`, with hex kept in `tokens.json` for reference. |
| **WCAG 2.2 AA** | `scripts/contrast-pairs.mjs` checks the pairs in [`checks/contrast-pairs.json`](checks/contrast-pairs.json) across light/dark × Clásico/Lienzo. Report: [`reports/contrast.json`](reports/contrast.json). |
| **axe-core** | `scripts/audit-axe.mjs` runs on the docs site in all four combinations. Report: [`reports/axe.json`](reports/axe.json). |
| **Lighthouse** | `scripts/audit-lighthouse.mjs`, mobile and desktop presets. Report: [`reports/lighthouse.json`](reports/lighthouse.json). |

## What's inside

- [`foundations/`](foundations/README.md) — color, typography, spacing, layout grid, elevation, icons, motion, logo. One page each.
- [`components/`](COMPONENTS.md) — 35 components by atomic level, one page each with Figma link, properties and preview.
- [`docs/`](docs/index.html) — the "Under the hood" site (GitHub Pages), generated from the tokens.
- [`figma/`](figma) — the sources: Token Exporter JSON, text/effect styles, component inventory and documented patches.

## Use the tokens

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Baah07/benjamin-abud-design-system@main/tokens.css" />
<html data-theme="dark" data-style="lienzo">  <!-- both optional; theme defaults to prefers-color-scheme -->
```

```css
.button { background: var(--bg-fill-primary); color: var(--text-on-primary); border-radius: var(--style-radius-control); font: var(--typography-body-button-md); }
```

## Update from Figma

1. In Figma, run **Token Exporter** → all collections → JSON → save as `figma/tokens.figma.json`.
2. `npm run build` (normalize → Style Dictionary → pages → site).
3. `npm test && npm run validate && npm run audit`.

Text and effect styles are not variables, so the exporter skips them; they live in `figma/styles.json`. `figma/patches.json` documents every fix applied to the export (orphaned variables, unitless line heights) and when to remove it.

## Known issues

- Axiforma is a commercial font and is not bundled; renders fall back to `sans-serif` unless the site provides it.

## License

MIT for code. Design and brand assets © Benjamín Abud.
