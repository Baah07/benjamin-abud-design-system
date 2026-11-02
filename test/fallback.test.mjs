import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { toLegacy } from '../scripts/lib/color.mjs';

// Walks nested CSS blocks and returns { "<at-rule> > <selector>": { --var: value } }.
function rules(css) {
  const out = {};
  const stack = [];
  let buf = '';
  for (const ch of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
    if (ch === '{') { stack.push(buf.trim()); buf = ''; }
    else if (ch === '}') {
      const key = stack.join(' > ');
      for (const [, name, value] of buf.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) (out[key] ??= {})[name] = value.trim();
      stack.pop(); buf = '';
    } else buf += ch;
  }
  return out;
}

const SUPPORTS = '@supports not (color: oklch(0% 0 0))';

test('toLegacy returns hex for opaque colors and rgba() with alpha', () => {
  assert.equal(toLegacy({ colorSpace: 'srgb', components: [64 / 255, 56 / 255, 219 / 255] }), '#4038db');
  assert.equal(toLegacy({ colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.04 }), 'rgba(0, 0, 0, 0.04)');
});

test('every oklch() declaration has a legacy fallback under the same selector in @supports not', () => {
  const r = rules(readFileSync(new URL('../tokens.css', import.meta.url), 'utf8'));
  const main = Object.entries(r).filter(([k]) => !k.startsWith(SUPPORTS));
  let checked = 0;
  for (const [key, decls] of main) {
    for (const [name, value] of Object.entries(decls)) {
      if (!value.includes('oklch(')) continue;
      const fallback = r[`${SUPPORTS} > ${key}`]?.[name];
      assert.ok(fallback, `${key} ${name} has no fallback`);
      assert.ok(!fallback.includes('oklch('), `${key} ${name} fallback still uses oklch`);
      checked += 1;
    }
  }
  assert.ok(checked > 50, `only ${checked} oklch declarations found`);
});
