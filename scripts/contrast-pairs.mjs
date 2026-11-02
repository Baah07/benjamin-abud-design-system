// WCAG 2.2 contrast gate: every pair in checks/contrast-pairs.json, in every theme × style combination.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { checkPairs } from './lib/contrast.mjs';
import { combine, COMBINATIONS } from './lib/themes.mjs';
import { toHex } from './lib/color.mjs';

const root = new URL('../', import.meta.url);
const tokens = JSON.parse(await readFile(new URL('tokens.json', root), 'utf8'));
const { pairs } = JSON.parse(await readFile(new URL('checks/contrast-pairs.json', root), 'utf8'));

const report = {};
let failures = 0;
for (const [name, groups] of Object.entries(COMBINATIONS)) {
  const resolved = combine(tokens, groups);
  const hex = Object.fromEntries(Object.entries(resolved).filter(([, t]) => t.$type === 'color').map(([k, t]) => [k, toHex(t.$value)]));
  report[name] = checkPairs(hex, pairs).map((r) => ({ ...r, fgHex: hex[r.fg], bgHex: hex[r.bg] }));
  for (const r of report[name]) if (!r.pass) failures += 1;
}

await mkdir(new URL('reports/', root), { recursive: true });
await writeFile(new URL('reports/contrast.json', root), `${JSON.stringify(report, null, 2)}\n`);
for (const [name, rows] of Object.entries(report)) {
  console.log(`\n${name}`);
  for (const r of rows) console.log(`  ${r.pass ? 'PASS' : 'FAIL'} ${r.ratio.toFixed(2).padStart(5)}:1 (min ${r.min}) ${r.fg} on ${r.bg} — ${r.use}`);
}
console.log(`\n${failures ? `${failures} failing pair(s)` : 'All pairs pass WCAG 2.2 AA'} across ${Object.keys(COMBINATIONS).length} combinations.`);
process.exit(failures ? 1 : 0);
