// Google Lighthouse on docs/index.html (mobile + desktop). Fails if any category is below 100.
import { writeFile, mkdir } from 'node:fs/promises';
import lighthouse from 'lighthouse';
import desktopConfig from 'lighthouse/core/config/desktop-config.js';
import * as chromeLauncher from 'chrome-launcher';
import { serve } from './lib/serve.mjs';

const root = new URL('../', import.meta.url);
const site = await serve(new URL('docs/', root));
const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'], chromePath: process.env.CHROME_PATH });
const categories = ['performance', 'accessibility', 'best-practices', 'seo'];
const report = {};
let below = 0;

try {
  for (const formFactor of ['mobile', 'desktop']) {
    const flags = { port: chrome.port, output: 'json', onlyCategories: categories, logLevel: 'error' };
    const config = formFactor === 'desktop' ? desktopConfig : undefined; // official presets: Moto G Power vs desktop
    const { lhr } = await lighthouse(site.url, flags, config);
    report[formFactor] = Object.fromEntries(categories.map((c) => [c, Math.round(lhr.categories[c].score * 100)]));
    const failed = Object.values(lhr.audits).filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode === 'binary').map((a) => a.id);
    report[`${formFactor}Failed`] = failed;
    console.log(`${formFactor}: ${categories.map((c) => `${c} ${report[formFactor][c]}`).join(' · ')}${failed.length ? `\n  failing audits: ${failed.join(', ')}` : ''}`);
    below += Object.values(report[formFactor]).filter((s) => s < 100).length;
  }
} finally {
  await chrome.kill();
  await site.close();
}

await mkdir(new URL('reports/', root), { recursive: true });
await writeFile(new URL('reports/lighthouse.json', root), `${JSON.stringify(report, null, 2)}\n`);
process.exit(below ? 1 : 0);
