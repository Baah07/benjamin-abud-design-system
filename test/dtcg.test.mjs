import { test } from 'node:test';
import assert from 'node:assert/strict';
import { flatten, validate, resolve } from '../scripts/lib/dtcg.mjs';

const tree = {
  color: {
    white: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 1, 1] } },
    surface: { $type: 'color', $value: '{color.white}' },
  },
  size: { 8: { $type: 'dimension', $value: { value: 8, unit: 'px' } } },
};

test('flatten returns dot paths for every token', () => {
  assert.deepEqual(Object.keys(flatten(tree)).sort(), ['color.surface', 'color.white', 'size.8']);
});

test('valid tree has no errors', () => {
  assert.deepEqual(validate(tree), []);
});

test('detects broken alias', () => {
  const errors = validate({ a: { $type: 'color', $value: '{color.missing}' } });
  assert.match(errors[0], /a: alias \{color\.missing\} does not resolve/);
});

test('detects unknown $type', () => {
  assert.match(validate({ a: { $type: 'colour', $value: 'x' } })[0], /unknown \$type "colour"/);
});

test('detects malformed dimension value', () => {
  assert.match(validate({ a: { $type: 'dimension', $value: 8 } })[0], /dimension/);
});

test('detects alias cycles', () => {
  const errors = validate({ a: { $type: 'number', $value: '{b}' }, b: { $type: 'number', $value: '{a}' } });
  assert.ok(errors.some((e) => /cycle/.test(e)));
});

test('resolve follows alias chains to the final value', () => {
  assert.deepEqual(resolve(tree)['color.surface'].$value.components, [1, 1, 1]);
});
