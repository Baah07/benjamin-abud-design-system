// figma/components.json + tokens.json → components/*.md, COMPONENTS.md, foundations/*.md
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { componentPage, componentsIndex, figmaUrl, HEADER } from './lib/pages.mjs';
import { combine, COMBINATIONS } from './lib/themes.mjs';
import { toOklch, toHex } from './lib/color.mjs';
import { aliasOf, flatten } from './lib/dtcg.mjs';

const root = new URL('../', import.meta.url);
const read = async (p) => JSON.parse(await readFile(new URL(p, root), 'utf8'));
const out = async (p, s) => {
  const dir = p.split('/').slice(0, -1).join('/');
  if (dir) await mkdir(new URL(`${dir}/`, root), { recursive: true });
  await writeFile(new URL(p, root), `${s.trim()}\n`);
};

const { fileKey, components, foundations } = await read('figma/components.json');
const tokens = await read('tokens.json');
const cfg = { fileKey };

for (const c of components) await out(`components/${c.slug}.md`, componentPage(c, cfg));
await out('COMPONENTS.md', componentsIndex(components, cfg));

// ---------- foundations ----------
const light = combine(tokens, []);
const dark = combine(tokens, COMBINATIONS['dark · clásico']);
const lienzo = combine(tokens, COMBINATIONS['light · lienzo']);
const raw = flatten(Object.fromEntries(Object.entries(tokens).filter(([k]) => !k.startsWith('$'))));
const v = (p) => `--${p.replace(/\./g, '-')}`;
const ref = (p) => aliasOf(raw[p]?.$value) ?? '—';
const desc = (p) => (light[p].$description ?? '').replace(/\|/g, '\\|');
const page = (slug, name, body) => {
  const f = foundations.find((x) => x.slug === slug);
  return [HEADER.replace('figma/components.json', 'tokens.json'), '', `# ${name}`, '', `**Figma:** [${f.name} page](${figmaUrl(fileKey, f.pageId)}) · **Tokens:** [\`tokens.json\`](../tokens.json) · **CSS:** [\`tokens.css\`](../tokens.css)`, '', body].join('\n');
};
const keys = (prefix) => Object.keys(light).filter((k) => k.startsWith(prefix));
const colorRow = (p) => `| \`${v(p)}\` | ${toHex(light[p].$value)} · \`${toOklch(light[p].$value)}\` | ${toHex(dark[p].$value)} · \`${toOklch(dark[p].$value)}\` | ${desc(p)} |`;
const semRow = (p) => `| \`${v(p)}\` | \`{${ref(p)}}\` | ${toHex(light[p].$value)} | ${toHex(dark[p].$value)} | ${desc(p)} |`;

const colorBody = [
  'Three tiers, all from Figma variables. **Primitives** (`color.palette.*`) are raw ramps with a Light and a Dark mode. **Semantic** roles (`bg`, `text`, `border`) alias primitives. **Style** tokens (`style.*`) switch the Clásico / Lienzo skin. Every value ships as CSS Color 4 `oklch()`; hex is shown for reference.',
  '', 'Contrast for every shipped pair is checked by [`scripts/contrast-pairs.mjs`](../scripts/contrast-pairs.mjs) — see [`reports/contrast.json`](../reports/contrast.json).',
  '', '## Primitives', '', '| Token | Light | Dark | Notes |', '| --- | --- | --- | --- |', ...keys('color.palette.').map(colorRow),
  '', '## Semantic roles', '', '| Token | Alias | Light | Dark | Notes |', '| --- | --- | --- | --- | --- |', ...['bg.', 'text.', 'border.'].flatMap(keys).map(semRow),
  '', '## Style (Clásico / Lienzo)', '', '| Token | Clásico | Lienzo |', '| --- | --- | --- |',
  ...keys('style.').filter((p) => light[p].$type === 'color').map((p) => `| \`${v(p)}\` | \`{${ref(p)}}\` ${toHex(light[p].$value)} | ${toHex(lienzo[p].$value)} |`),
].join('\n');

const typoBody = [
  'Axiforma for display and headings, Inter for body and UI. Composite styles come from Figma text styles; the `font.*` scales come from the Typography Tokens collection.',
  '', '| Token | Shorthand (`font:`) | Family | Weight | Size / line height |', '| --- | --- | --- | --- | --- |',
  ...keys('typography.').map((p) => { const t = light[p].$value; return `| \`${v(p)}\` | \`${t.fontWeight} ${t.fontSize.value}px/${t.lineHeight}\` | ${t.fontFamily} | ${t.fontWeight} | ${t.fontSize.value} / ${Math.round(t.fontSize.value * t.lineHeight)} px |`; }),
  '', '## Scales', '', '| Token | Value |', '| --- | --- |',
  ...keys('font.').map((p) => { const t = light[p]; return `| \`${v(p)}\` | ${typeof t.$value === 'object' ? `${t.$value.value}${t.$value.unit}` : t.$value} |`; }),
].join('\n');

const dimRows = (prefix) => keys(prefix).map((p) => `| \`${v(p)}\` | ${ref(p) !== '—' ? `\`{${ref(p)}}\` → ` : ''}${light[p].$value.value}px | ${desc(p)} |`);
const spacingBody = ['4 px base scale. `space.*` and `radius.*` alias `size.*`.', '', '## Space', '', '| Token | Value | Notes |', '| --- | --- | --- |', ...dimRows('space.'), '', '## Radius', '', '| Token | Value | Notes |', '| --- | --- | --- |', ...dimRows('radius.'), '', '## Style radius & surface spacing', '', '| Token | Clásico | Lienzo |', '| --- | --- | --- |', ...keys('style.').filter((p) => light[p].$type === 'dimension').map((p) => `| \`${v(p)}\` | ${light[p].$value.value}px | ${lienzo[p].$value.value}px |`)].join('\n');

const tablet = combine(tokens, ['tabletViewport']);
const desktop = combine(tokens, ['desktopViewport']);
const lay = (m, p) => (typeof m[p].$value === 'object' ? `${m[p].$value.value}px` : m[p].$value);
const layoutBody = ['Mobile-first. Tablet and desktop values apply from `layout.breakpoint.min-width` up, as `@media (min-width)` blocks in `tokens.css`.', '', '| Token | Mobile | Tablet | Desktop | Notes |', '| --- | --- | --- | --- | --- |', ...keys('layout.').map((p) => `| \`${v(p)}\` | ${lay(light, p)} | ${lay(tablet, p)} | ${lay(desktop, p)} | ${desc(p)} |`)].join('\n');

const elevationBody = ['Figma effect styles. `elevation.paper.*` are the softer multi-layer shadows of the Lienzo paper surfaces.', '', '| Token | Layers | CSS |', '| --- | --- | --- |', ...keys('elevation.').map((p) => `| \`${v(p)}\` | ${light[p].$value.length} | \`box-shadow: var(${v(p)})\` |`)].join('\n');

const todo = (what) => `> TODO: ${what} not exported as tokens yet. The Figma page is the source of truth until it is.`;

await out('foundations/color.md', page('color', 'Color', colorBody));
await out('foundations/typography.md', page('typography', 'Typography', typoBody));
await out('foundations/spacing.md', page('spacing', 'Spacing & radius', spacingBody));
await out('foundations/layout-grid.md', page('layout-grid', 'Layout grid', layoutBody));
await out('foundations/elevation.md', page('elevation', 'Elevation', elevationBody));
await out('foundations/icons.md', page('icons', 'Icons', `Components use [Phosphor](https://phosphoricons.com) icons (named in the Figma component descriptions) and inherit the semantic text color.\n\n${todo('Icon names and sizes are')}`));
await out('foundations/motion.md', page('motion', 'Motion', `Documented motion in components: Card hover Smart Animate 300 ms ease-out; case-sheet entrance 0.8 s \`cubic-bezier(0.87, 0, 0.13, 1)\`, no movement with \`prefers-reduced-motion\` (from the Card description in Figma).\n\n${todo('Durations and easings are')}`));
await out('foundations/logo.md', page('logo', 'Logo', todo('The logo is an asset, so it is')));
await out('foundations/README.md', [HEADER.replace('figma/components.json', 'tokens.json'), '', '# Foundations', '', ...foundations.map((f) => `- [${f.name}](${f.slug}.md)`), '', 'Themes: light (default) and dark — `prefers-color-scheme`, overridable with `<html data-theme>`. Styles: Clásico (default) and Lienzo — `<html data-style="lienzo">`. Viewports: mobile-first with tablet and desktop media queries.'].join('\n'));

console.log(`${components.length} component pages, COMPONENTS.md, ${foundations.length} foundation pages`);
