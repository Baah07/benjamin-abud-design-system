import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toOklch, toHex } from '../scripts/lib/color.mjs';

test('white converts to oklch(100% 0 0)', () => {
  assert.equal(toOklch({ colorSpace: 'srgb', components: [1, 1, 1] }), 'oklch(100% 0 0)');
});

test('black converts to oklch(0% 0 0)', () => {
  assert.equal(toOklch({ colorSpace: 'srgb', components: [0, 0, 0] }), 'oklch(0% 0 0)');
});

test('indigo 600 #4038db converts to CSS Color 4 oklch with 3 decimals', () => {
  const out = toOklch({ colorSpace: 'srgb', components: [64 / 255, 56 / 255, 219 / 255] });
  assert.match(out, /^oklch\(\d+(\.\d+)?% 0\.\d{1,3} \d+(\.\d+)?\)$/);
  const [l, c, h] = out.slice(6, -1).split(' ');
  // Reference computed by hand with Ottosson's OKLab matrices: 47.17% 0.235 274.68
  assert.ok(Math.abs(parseFloat(l) - 47.17) < 0.05, `lightness ${l}`);
  assert.ok(Math.abs(parseFloat(c) - 0.235) < 0.002, `chroma ${c}`);
  assert.ok(Math.abs(parseFloat(h) - 274.68) < 0.1, `hue ${h}`);
});

test('alpha below 1 is emitted with slash syntax', () => {
  assert.match(toOklch({ colorSpace: 'srgb', components: [0, 0, 0], alpha: 0.04 }), / \/ 0\.04\)$/);
});

test('toHex round-trips srgb components', () => {
  assert.equal(toHex({ colorSpace: 'srgb', components: [64 / 255, 56 / 255, 219 / 255] }), '#4038db');
});
