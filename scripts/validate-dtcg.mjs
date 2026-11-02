// DTCG 2025.10 structural lint for tokens.json (every combination) and resolver ↔ file agreement.
import { readFile } from 'node:fs/promises';
import { validate, flatten, unflatten } from './lib/dtcg.mjs';
import { GROUP_KEYS } from './lib/themes.mjs';

const root = new URL('../', import.meta.url);
const tokens = JSON.parse(await readFile(new URL('tokens.json', root), 'utf8'));
const resolver = JSON.parse(await readFile(new URL('tokens.resolver.json', root), 'utf8'));

const base = Object.fromEntries(Object.entries(tokens).filter(([k]) => !k.startsWith('$') && !GROUP_KEYS.includes(k)));
const errors = validate(base);
const baseFlat = flatten(base);
for (const g of GROUP_KEYS) {
  if (!tokens[g]) { errors.push(`missing override group ${g}`); continue; }
  for (const path of Object.keys(flatten(tokens[g]))) if (!baseFlat[path]) errors.push(`${g}.${path}: override has no base token`);
  errors.push(...validate(unflatten({ ...baseFlat, ...flatten(tokens[g]) })).map((e) => `${g}: ${e}`));
}

const referenced = JSON.stringify(resolver.modifiers).match(/tokens\.json#\/(\w+)/g)?.map((r) => r.split('/').pop()) ?? [];
for (const g of GROUP_KEYS) if (!referenced.includes(g)) errors.push(`tokens.resolver.json does not reference ${g}`);
for (const g of referenced) if (!GROUP_KEYS.includes(g)) errors.push(`tokens.resolver.json references unknown group ${g}`);
if (resolver.version !== '2025.10') errors.push(`resolver version ${resolver.version} is not 2025.10`);

if (errors.length) {
  console.error(`DTCG validation failed (${errors.length}):\n${errors.join('\n')}`);
  process.exit(1);
}
console.log(`DTCG 2025.10 OK: ${Object.keys(baseFlat).length} tokens, ${GROUP_KEYS.length} override groups, resolver in sync.`);
