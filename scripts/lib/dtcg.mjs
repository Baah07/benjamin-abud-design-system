// Minimal DTCG 2025.10 helpers: flatten, alias resolution and structural validation.

export const TYPES = new Set([
  'color', 'dimension', 'fontFamily', 'fontWeight', 'duration', 'cubicBezier', 'number',
  'strokeStyle', 'border', 'transition', 'shadow', 'gradient', 'typography', 'string',
]);

const ALIAS = /^\{([^{}]+)\}$/;

export const isToken = (node) => node !== null && typeof node === 'object' && '$value' in node;
export const aliasOf = (value) => (typeof value === 'string' ? value.match(ALIAS)?.[1] ?? null : null);

export function flatten(tree, prefix = [], out = {}) {
  for (const [key, node] of Object.entries(tree)) {
    if (key.startsWith('$') || node === null || typeof node !== 'object') continue;
    const path = [...prefix, key];
    if (isToken(node)) out[path.join('.')] = node;
    else flatten(node, path, out);
  }
  return out;
}

export function unflatten(flat) {
  const tree = {};
  for (const [path, token] of Object.entries(flat)) {
    const keys = path.split('.');
    let node = tree;
    for (const k of keys.slice(0, -1)) node = node[k] ??= {};
    node[keys.at(-1)] = token;
  }
  return tree;
}

function checkValue(type, value) {
  if (aliasOf(value)) return null;
  const isDim = (v) => v && typeof v === 'object' && typeof v.value === 'number' && ['px', 'rem'].includes(v.unit);
  const isColor = (v) => v && typeof v === 'object' && typeof v.colorSpace === 'string' && Array.isArray(v.components) && v.components.length === 3;
  switch (type) {
    case 'color': return isColor(value) ? null : 'color must be { colorSpace, components[3] }';
    case 'dimension': return isDim(value) ? null : 'dimension must be { value: number, unit: "px" | "rem" }';
    case 'number': return typeof value === 'number' ? null : 'number must be a number';
    case 'fontWeight': return typeof value === 'number' || typeof value === 'string' ? null : 'fontWeight must be number or keyword';
    case 'fontFamily': return typeof value === 'string' || Array.isArray(value) ? null : 'fontFamily must be string or string[]';
    case 'shadow': {
      const layers = Array.isArray(value) ? value : [value];
      return layers.every((l) => isColor(l.color) && isDim(l.offsetX) && isDim(l.offsetY) && isDim(l.blur) && isDim(l.spread)) ? null : 'shadow layer needs color, offsetX, offsetY, blur, spread';
    }
    case 'typography':
      return value && value.fontFamily && value.fontWeight && isDim(value.fontSize) && typeof value.lineHeight === 'number' ? null : 'typography needs fontFamily, fontWeight, fontSize, lineHeight';
    default: return null;
  }
}

export function validate(tree) {
  const flat = flatten(tree);
  const errors = [];
  for (const [path, token] of Object.entries(flat)) {
    if (!TYPES.has(token.$type)) errors.push(`${path}: unknown $type "${token.$type}"`);
    const target = aliasOf(token.$value);
    if (target && !flat[target]) errors.push(`${path}: alias {${target}} does not resolve`);
    const problem = TYPES.has(token.$type) ? checkValue(token.$type, token.$value) : null;
    if (problem) errors.push(`${path}: ${problem}`);
  }
  for (const path of Object.keys(flat)) {
    const seen = new Set([path]);
    let next = aliasOf(flat[path].$value);
    while (next && flat[next]) {
      if (seen.has(next)) { errors.push(`${path}: alias cycle through {${next}}`); break; }
      seen.add(next);
      next = aliasOf(flat[next].$value);
    }
  }
  return errors;
}

export function resolve(tree) {
  const flat = flatten(tree);
  const out = {};
  for (const [path, token] of Object.entries(flat)) {
    let current = token;
    const seen = new Set();
    for (let target = aliasOf(current.$value); target; target = aliasOf(current.$value)) {
      if (seen.has(target) || !flat[target]) throw new Error(`${path}: cannot resolve {${target}}`);
      seen.add(target);
      current = flat[target];
    }
    out[path] = { ...token, $value: current.$value };
  }
  return out;
}
