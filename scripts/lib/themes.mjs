// Builds the resolved token map for a combination of override groups from tokens.json.
import { flatten, unflatten, resolve } from './dtcg.mjs';

export const GROUP_KEYS = ['darkTheme', 'lienzoStyle', 'tabletViewport', 'desktopViewport'];

export function combine(tokens, groups = []) {
  const base = Object.fromEntries(Object.entries(tokens).filter(([k]) => !k.startsWith('$') && !GROUP_KEYS.includes(k)));
  const flat = flatten(base);
  for (const g of groups) Object.assign(flat, flatten(tokens[g] ?? {}));
  return resolve(unflatten(flat));
}

export const COMBINATIONS = {
  'light · clásico': [],
  'dark · clásico': ['darkTheme'],
  'light · lienzo': ['lienzoStyle'],
  'dark · lienzo': ['darkTheme', 'lienzoStyle'],
};
