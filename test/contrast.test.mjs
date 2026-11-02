import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contrastRatio, checkPairs } from '../scripts/lib/contrast.mjs';

test('black on white is 21:1', () => {
  assert.equal(contrastRatio('#000000', '#ffffff').toFixed(2), '21.00');
});

test('ratio is symmetric', () => {
  assert.equal(contrastRatio('#4038db', '#ffffff'), contrastRatio('#ffffff', '#4038db'));
});

test('#767676 on white is the classic 4.54:1 AA boundary', () => {
  assert.equal(contrastRatio('#767676', '#ffffff').toFixed(2), '4.54');
});

test('checkPairs reports pass/fail per pair with the minimum required', () => {
  const resolved = { fg: '#767676', bg: '#ffffff', weak: '#cccccc' };
  const results = checkPairs(resolved, [
    { fg: 'fg', bg: 'bg', min: 4.5, use: 'body text' },
    { fg: 'weak', bg: 'bg', min: 3, use: 'border' },
  ]);
  assert.equal(results[0].pass, true);
  assert.equal(results[1].pass, false);
  assert.equal(results[1].min, 3);
});

test('checkPairs throws on an unknown token so a typo never passes silently', () => {
  assert.throws(() => checkPairs({}, [{ fg: 'nope', bg: 'nope2', min: 4.5 }]), /nope/);
});
