// Turns a Token Exporter (Figma) export into per-mode DTCG trees with mode-free aliases.
import { aliasOf, isToken } from './dtcg.mjs';

const clone = (v) => structuredClone(v);

function deepMerge(target, patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value && typeof value === 'object' && !isToken(value) && target[key] && typeof target[key] === 'object') deepMerge(target[key], value);
    else target[key] = clone(value);
  }
  return target;
}

export function applyPatches(exported, patches) {
  const { $description, $retype, ...rest } = patches;
  return deepMerge(clone(exported), rest);
}

// modes: { [collection]: string[] } — empty array means a single-mode collection without a mode level.
export function splitModes(exported, modes) {
  const out = {};
  for (const [collection, body] of Object.entries(exported)) {
    const list = modes[collection] ?? [];
    out[collection] = list.length ? Object.fromEntries(list.map((m) => [m, body[m]])) : { default: body };
  }
  return out;
}

// Rewrites {Collection.Mode.path} and {Collection.path} to {path}. Pairing modes is done by the build
// (Light semantics are built with Light primitives), which is how the Figma file says to use them.
export function stripModeFromAliases(tree, modes) {
  const rewrite = (ref) => {
    const parts = ref.split('.');
    if (!(parts[0] in modes)) return ref;
    const skip = modes[parts[0]].includes(parts[1]) ? 2 : 1;
    return parts.slice(skip).join('.');
  };
  const walk = (node) => {
    if (isToken(node)) {
      const target = aliasOf(node.$value);
      return target ? { ...node, $value: `{${rewrite(target)}}` } : clone(node);
    }
    return Object.fromEntries(Object.entries(node).map(([k, v]) => [k, v && typeof v === 'object' ? walk(v) : v]));
  };
  return walk(tree);
}

// rules: [{ pattern: 'font.line-height.*', to: 'dimension', unit: 'px' }] — fixes types the exporter guesses wrong.
export function applyRetype(flat, rules = []) {
  const toRegex = (p) => new RegExp(`^${p.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^.]+')}$`);
  const compiled = rules.map((r) => ({ ...r, re: toRegex(r.pattern) }));
  return Object.fromEntries(Object.entries(flat).map(([path, token]) => {
    const rule = compiled.find((r) => r.re.test(path));
    if (!rule || typeof token.$value !== 'number') return [path, token];
    return [path, { ...token, $type: rule.to, $value: rule.to === 'dimension' ? { value: token.$value, unit: rule.unit } : token.$value }];
  }));
}

// DTCG requires an alias to share its target's type; Figma FLOAT variables lose that distinction.
export function retypeFromAliases(flat) {
  const tokens = clone(flat);
  const changes = [];
  for (const [path, token] of Object.entries(tokens)) {
    const target = aliasOf(token.$value);
    const targetType = target && tokens[target]?.$type;
    if (targetType && targetType !== token.$type) {
      changes.push({ path, from: token.$type, to: targetType });
      token.$type = targetType;
    }
  }
  return { tokens, changes };
}
