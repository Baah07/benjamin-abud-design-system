// Independent check: every value in Token Exporter's own CSS export (figma/tokens.figma.css) must equal what
// our DTCG → Style Dictionary pipeline resolves for the same mode. Proves the build loses or changes nothing.
import { readFile } from 'node:fs/promises';
import { parsePluginCss } from './lib/plugin-css.mjs';
import { combine } from './lib/themes.mjs';
import { toHex } from './lib/color.mjs';

const root = new URL('../', import.meta.url);
const tokens = JSON.parse(await readFile(new URL('tokens.json', root), 'utf8'));
const entries = parsePluginCss(await readFile(new URL('figma/tokens.figma.css', root), 'utf8'));
const GROUPS = { Dark: ['darkTheme'], Lienzo: ['lienzoStyle'], Tablet: ['tabletViewport'], Desktop: ['desktopViewport'] };
const resolved = {};
const byDash = (mode) => {
  resolved[mode] ??= Object.fromEntries(Object.entries(combine(tokens, GROUPS[mode] ?? [])).map(([k, t]) => [k.replace(/\./g, '-'), t]));
  return resolved[mode];
};
const ours = (t) => (t.$type === 'color' ? toHex(t.$value) : typeof t.$value === 'object' ? `${t.$value.value}${t.$value.unit}` : String(t.$value));
const norm = (s) => String(s).toLowerCase().replace(/^"|"$/g, '').replace(/px$/, '');

const problems = [];
for (const { path, mode, value } of entries) {
  const t = byDash(mode)[path];
  if (!t) problems.push(`${path} [${mode ?? 'base'}]: not in tokens.json`);
  else if (norm(ours(t)) !== norm(value)) problems.push(`${path} [${mode ?? 'base'}]: ours ${ours(t)} vs Token Exporter ${value}`);
}
if (problems.length) {
  console.error(`Token Exporter cross-check failed (${problems.length}):\n${problems.join('\n')}`);
  process.exit(1);
}
console.log(`Token Exporter cross-check OK: ${entries.length} values match figma/tokens.figma.css.`);
