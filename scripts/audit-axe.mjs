// axe-core (WCAG 2.0–2.2 A/AA) on docs/index.html in every theme × style combination. Fails on any violation.
import { writeFile, mkdir } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { AxeBuilder } from '@axe-core/playwright';
import { serve } from './lib/serve.mjs';

const root = new URL('../', import.meta.url);
const site = await serve(new URL('docs/', root));
const browser = await chromium.launch({ channel: process.env.CHROME_PATH ? undefined : 'chrome', executablePath: process.env.CHROME_PATH });
const combos = [['light', 'clasico'], ['dark', 'clasico'], ['light', 'lienzo'], ['dark', 'lienzo']];
const report = {};
let total = 0;

try {
  for (const [theme, style] of combos) {
    const context = await browser.newContext({ colorScheme: theme });
    const page = await context.newPage();
    await page.goto(site.url, { waitUntil: 'networkidle' });
    await page.evaluate(([t, s]) => {
      document.documentElement.dataset.theme = t;
      if (s === 'lienzo') document.documentElement.dataset.style = 'lienzo';
    }, [theme, style]);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    const key = `${theme} · ${style}`;
    report[key] = result.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 5) }));
    total += result.violations.length;
    console.log(`${key}: ${result.violations.length} violations, ${result.passes.length} rules passed`);
    for (const v of report[key]) console.log(`  ✖ ${v.id} (${v.impact}) ${v.help} → ${v.nodes.join(', ')}`);
    await context.close();
  }
} finally {
  await browser.close();
  await site.close();
}

await mkdir(new URL('reports/', root), { recursive: true });
await writeFile(new URL('reports/axe.json', root), `${JSON.stringify(report, null, 2)}\n`);
process.exit(total ? 1 : 0);
