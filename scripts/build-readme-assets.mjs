// Renders the README images from the real tokens: assets/header-banner.png and the foundations bento
// (light + dark). Axiforma must be installed locally (it is commercial and not shipped); Inter loads from Google Fonts.
import { readFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { tokens as css } from '../tokens.js';

const root = new URL('../', import.meta.url);
const tokensCss = await readFile(new URL('tokens.css', root), 'utf8');
const v = (p) => `var(--${p.replace(/\./g, '-')})`;
const head = `<meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet"><style>${tokensCss}
*{box-sizing:border-box;margin:0}
body{width:860px;background:${v('style.bg.canvas')};color:${v('text.on-surface')};font:${v('typography.body.md')};
background-image:radial-gradient(${v('color.palette.paper.dot')} 1.2px,transparent 1.6px);background-size:24px 24px}
.paper{background:${v('style.bg.paper')};border:1px solid ${v('style.border.paper')};border-radius:18px;box-shadow:${v('elevation.paper.shadow-2')}}
.display{font-family:Axiforma,sans-serif}
.label{font:${v('typography.body.caption')};color:${v('text.on-surface-variant')};text-transform:uppercase;letter-spacing:.06em}
</style>`;

const banner = `<!doctype html><html data-style="lienzo"><head>${head}<style>
.wrap{height:340px;padding:40px;display:grid;grid-template-columns:1.4fr 1fr;gap:24px;align-items:center}
.title{font:${v('typography.display.06')};font-family:Axiforma,sans-serif;font-size:52px;line-height:1.05}
.sub{margin-top:12px;color:${v('text.on-surface-variant')}}
.pill{display:inline-block;margin-top:20px;background:${v('bg.fill.primary')};color:${v('text.on-primary')};font:${v('typography.body.button-sm')};padding:8px 16px;border-radius:999px}
.folder{padding:20px;transform:rotate(-3deg)}
.folder + .folder{transform:rotate(2deg);margin-top:16px;margin-left:40px}
.chips{display:flex;gap:6px;margin-top:10px}.chips span{width:22px;height:22px;border-radius:6px}
</style></head><body><div class="wrap">
<div><p class="label">Design system</p><h1 class="title display">Benjamín Abud</h1>
<p class="sub">Tokens DTCG desde Figma, compilados a CSS Color 4 y auditados con WCAG 2.2 AA.</p>
<span class="pill">tokens.json → tokens.css</span></div>
<div><div class="paper folder"><p class="label">Color</p><div class="chips">${['50', '200', '400', '600', '800', '950'].map((s) => `<span style="background:${v(`color.palette.indigo.${s}`)}"></span>`).join('')}</div></div>
<div class="paper folder"><p class="label">Tipografía</p><p class="display" style="font-size:34px;font-weight:700;line-height:1.1">Aa</p></div></div>
</div></body></html>`;

const ramp = (name) => ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'].map((s) => `<div><span style="background:${v(`color.palette.${name}.${s}`)}"></span><small>${s}</small></div>`).join('');
const spaces = ['1', '2', '3', '4', '6', '8', '12', '16', '24'];
const bento = (theme) => `<!doctype html><html data-theme="${theme}" data-style="lienzo"><head>${head}<style>
.grid{padding:24px;display:grid;grid-template-columns:repeat(6,1fr);gap:16px}
.tile{padding:20px}.wide{grid-column:span 6}.half{grid-column:span 3}.third{grid-column:span 2}
.ramp{display:grid;grid-template-columns:repeat(11,1fr);gap:6px;margin-top:12px}
.ramp span{display:block;height:40px;border-radius:8px;border:1px solid ${v('border.outline-variant')}}
.ramp small{display:block;text-align:center;font:${v('typography.body.caption')};color:${v('text.on-surface-variant')};margin-top:4px}
.spec{font-size:72px;line-height:1;font-weight:700;margin-top:8px}
.bars div{display:flex;align-items:center;gap:10px;margin-top:6px;font:${v('typography.body.caption')};color:${v('text.on-surface-variant')}}
.bars span{display:block;height:12px;background:${v('bg.fill.primary')};border-radius:4px}
.shadow{height:56px;border-radius:12px;background:${v('style.bg.paper')};border:1px solid ${v('style.border.paper')};margin-top:14px;padding:16px;font:${v('typography.body.caption')};color:${v('text.on-surface-variant')}}
</style></head><body><div class="grid">
<div class="paper tile wide"><p class="label">Indigo · color.palette.indigo</p><div class="ramp">${ramp('indigo')}</div></div>
<div class="paper tile wide"><p class="label">Neutral · color.palette.neutral</p><div class="ramp">${ramp('neutral')}</div></div>
<div class="paper tile half"><p class="label">Display · Axiforma</p><p class="display spec">Aa</p><p style="font:${v('typography.heading.lg')};font-family:Axiforma,sans-serif">Hola, soy Benja.</p></div>
<div class="paper tile half"><p class="label">Cuerpo · Inter</p><p class="spec" style="font-family:Inter">Aa</p><p>Diseño interfaces y sistemas.</p></div>
<div class="paper tile half bars"><p class="label">Espaciado · space.*</p>${spaces.map((s) => `<div><span style="width:${v(`space.${s}`)}"></span>${css.base[`space.${s}`]}</div>`).join('')}</div>
<div class="paper tile half"><p class="label">Elevación · elevation.paper.*</p>${['1', '2', '3'].map((s) => `<div class="shadow" style="box-shadow:${v(`elevation.paper.shadow-${s}`)}">shadow-${s}</div>`).join('')}</div>
</div></body></html>`;

const browser = await chromium.launch({ channel: 'chrome' });
const shoot = async (html, file) => {
  const page = await browser.newPage({ viewport: { width: 860, height: 340 }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const missing = await page.evaluate(() => !document.fonts.check('700 20px Axiforma'));
  if (missing) throw new Error('Axiforma is not installed locally; the images would fall back to another font.');
  await page.locator('body').screenshot({ path: new URL(file, root).pathname.replace(/^\/([A-Z]:)/, '$1') });
  await page.close();
  console.log(file);
};
try {
  await shoot(banner, 'assets/header-banner.png');
  await shoot(bento('light'), 'assets/bento-foundations-light.png');
  await shoot(bento('dark'), 'assets/bento-foundations-dark.png');
} finally {
  await browser.close();
}
