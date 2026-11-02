import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyPatches, splitModes, stripModeFromAliases, retypeFromAliases, applyRetype } from '../scripts/lib/normalize.mjs';

test('applyRetype turns matching unitless numbers into px dimensions and leaves others alone', () => {
  const flat = {
    'font.line-height.20': { $type: 'number', $value: 20 },
    'font.weight.bold': { $type: 'number', $value: 700 },
  };
  const out = applyRetype(flat, [{ pattern: 'font.line-height.*', to: 'dimension', unit: 'px' }]);
  assert.deepEqual(out['font.line-height.20'], { $type: 'dimension', $value: { value: 20, unit: 'px' } });
  assert.deepEqual(out['font.weight.bold'], flat['font.weight.bold']);
});

const exported = {
  'Primitives-colors': {
    Light: { color: { gray: { $type: 'color', $value: { colorSpace: 'srgb', components: [1, 1, 1], hex: '#ffffff' } } } },
    Dark: { color: { gray: { $type: 'color', $value: { colorSpace: 'srgb', components: [0, 0, 0], hex: '#000000' } } } },
  },
  'Semantic-Tokens': {
    Light: { bg: { $type: 'color', $value: '{Primitives-colors.Light.color.gray}' } },
    Dark: { bg: { $type: 'color', $value: '{Primitives-colors.Dark.color.gray}' } },
  },
  Dimension: { size: { 8: { $type: 'dimension', $value: { value: 8, unit: 'px' } } } },
};

test('splitModes separates mode keys and keeps single-mode collections as default', () => {
  const modes = { 'Primitives-colors': ['Light', 'Dark'], 'Semantic-Tokens': ['Light', 'Dark'], Dimension: [] };
  const out = splitModes(exported, modes);
  assert.deepEqual(Object.keys(out['Primitives-colors']), ['Light', 'Dark']);
  assert.deepEqual(Object.keys(out.Dimension), ['default']);
  assert.equal(out.Dimension.default.size[8].$value.value, 8);
});

test('stripModeFromAliases rewrites collection and mode prefixes to bare token paths', () => {
  const known = { 'Primitives-colors': ['Light', 'Dark'], Dimension: [] };
  const tree = { a: { $type: 'color', $value: '{Primitives-colors.Dark.color.gray}' }, b: { $type: 'dimension', $value: '{Dimension.size.8}' } };
  const out = stripModeFromAliases(tree, known);
  assert.equal(out.a.$value, '{color.gray}');
  assert.equal(out.b.$value, '{size.8}');
});

test('stripModeFromAliases does not mutate its input', () => {
  const tree = { a: { $type: 'color', $value: '{Dimension.size.8}' } };
  stripModeFromAliases(tree, { Dimension: [] });
  assert.equal(tree.a.$value, '{Dimension.size.8}');
});

test('applyPatches deep-merges patch tokens and ignores $description at the root', () => {
  const out = applyPatches(exported, { $description: 'x', Dimension: { count: { 4: { $type: 'number', $value: 4 } } } });
  assert.equal(out.Dimension.count[4].$value, 4);
  assert.equal(out.Dimension.size[8].$value.value, 8);
  assert.equal(out.$description, undefined);
});

test('retypeFromAliases adopts the target type when an alias points to a different type', () => {
  const flat = { 'count.4': { $type: 'number', $value: 4 }, 'grid.columns': { $type: 'dimension', $value: '{count.4}' } };
  const { tokens, changes } = retypeFromAliases(flat);
  assert.equal(tokens['grid.columns'].$type, 'number');
  assert.deepEqual(changes, [{ path: 'grid.columns', from: 'dimension', to: 'number' }]);
});
