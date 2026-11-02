// Generates every doc from Figma data + tokens + DESIGN.md, mirroring the layout of a published design-system repo:
// components/*.md, COMPONENTS.md, foundations/*.md, DESIGN.md + AGENTS.md marker blocks, llms.txt, llms-full.txt,
// components-api.json, benjamin-abud-design-system.dsds.yaml, skill references and .last-sync.
import { readFile, writeFile, mkdir, rm, stat } from 'node:fs/promises';
import { tokens as css } from '../tokens.js';
import { flatten } from './lib/dtcg.mjs';
import { GROUP_KEYS } from './lib/themes.mjs';
import { GEN, SYSTEM, LEVELS, LEVEL_ONE, figmaUrl, cssVar, figmaToPath, replaceBlock, splitSections, tierOf, toYaml, componentPage, summary } from './lib/docs.mjs';

const root = new URL('../', import.meta.url);
const readText = (p) => readFile(new URL(p, root), 'utf8');
const read = async (p) => JSON.parse(await readText(p));
const out = async (p, s) => {
  const dir = p.split('/').slice(0, -1).join('/');
  if (dir) await mkdir(new URL(`${dir}/`, root), { recursive: true });
  await writeFile(new URL(p, root), `${s.trim()}\n`);
};

const { repo } = await read('ds.config.json');
const NAME = 'benjamin-abud-design-system';
const raw = (p) => `https://raw.githubusercontent.com/${repo}/main/${p}`;
const LIVE = 'https://benjaabud.framer.website/sistema';
const { fileKey, components, foundations: figmaFoundations } = await read('figma/components.json');
const tokens = await read('tokens.json');
const contrast = await read('reports/contrast.json');
const axe = await read('reports/axe.json');
const lighthouse = await read('reports/lighthouse.json');
const base = flatten(Object.fromEntries(Object.entries(tokens).filter(([k]) => !k.startsWith('$') && !GROUP_KEYS.includes(k))));
const hex = (p) => {
  const v = base[p]?.$value;
  return typeof v === 'string' && v.startsWith('{') ? hex(v.slice(1, -1)) : v?.hex;
};
const darkHex = (p) => {
  const dark = flatten(tokens.darkTheme);
  const v = (dark[p] ?? base[p])?.$value;
  if (typeof v === 'string' && v.startsWith('{')) return darkHex(v.slice(1, -1));
  return v?.hex;
};
const lookup = (path) => {
  if (!(path in css.base)) return null;
  return { tier: tierOf(path), value: css.base[path], dark: css.darkTheme[path], lienzo: css.lienzoStyle[path], description: base[path]?.$description ?? '' };
};
const ctx = { fileKey, repo, lookup };
const code = (s) => `\`${s}\``;
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const keys = (prefix) => Object.keys(base).filter((k) => k.startsWith(prefix));
const figmaPage = (slug) => figmaFoundations.find((f) => f.slug === slug);
const outsideOf = (c) => [...c.variables, ...c.textStyles, ...c.effectStyles].filter((n) => !lookup(figmaToPath(n)));

// ---------- components ----------
for (const c of components) await out(`components/${c.slug}.md`, componentPage(c, ctx));

const outsideCount = components.filter((c) => outsideOf(c).length).length;
await out('COMPONENTS.md', [
  GEN('figma/components.json'), '',
  '# Componentes', '',
  `> Todos los componentes del ${SYSTEM}: ${components.length} componentes en Figma (${LEVELS.map(([l, t]) => `${components.filter((c) => c.level === l).length} ${t.toLowerCase()}`).join(', ')}). Esta lista es el inventario completo; lo que no está acá no es parte del sistema.`, '',
  `Los componentes viven en Figma: sus props son las propiedades del componente y sus estilos son tokens. Los mismos datos, para máquinas: [${NAME}.dsds.yaml](${raw(`${NAME}.dsds.yaml`)}), un documento Design System Doc Spec 0.20.0 con cada componente y token, y [components-api.json](${raw('components-api.json')}).`, '',
  '## Todos los componentes', '',
  '| Componente | Para qué sirve | Nivel | Props | Variables fuera del sistema |',
  '|---|---|---|---|---|',
  ...components.map((c) => `| [${c.name}](components/${c.slug}.md) | ${esc(summary(c))} | ${LEVEL_ONE[c.level]} | ${c.props.map(([n]) => code(n)).join(', ') || '—'} | ${outsideOf(c).length ? `Sí (${outsideOf(c).length})` : 'No'} |`),
  '',
  `${outsideCount} componentes enlazan variables que no están en las colecciones exportadas; cada página las lista para reemplazarlas.`, '',
  '## Fuera de este sistema', '',
  '- **Capa CSS de componentes.** Los componentes se diseñan en Figma; todavía no hay `components.css` ni componentes en código.',
  '- **Tokens de movimiento e iconos.** Duraciones, curvas y tamaños de icono no son variables de Figma todavía.',
  '- **Colores de Playground.** `color.palette.playground.*` son muestras, no roles.',
].join('\n'));

// ---------- DESIGN.md generated blocks ----------
let design = await readText('DESIGN.md');
const roleKeys = [...['bg.', 'text.', 'border.'].flatMap(keys), ...keys('style.').filter((k) => base[k].$type === 'color')];
const yamlLines = (title, rows) => [`${title}:`, ...rows].join('\n');
design = replaceBlock(design, 'DESIGN:colors', yamlLines('colors', [
  ...roleKeys.map((k) => `  ${k.replace(/\./g, '-')}: "${hex(k)}" # ${cssVar(k)}`),
  'colorsDark:',
  ...roleKeys.filter((k) => darkHex(k) !== hex(k)).map((k) => `  ${k.replace(/\./g, '-')}: "${darkHex(k)}" # ${cssVar(k)} en data-theme="dark"`),
]));
design = replaceBlock(design, 'DESIGN:type-families', 'typography:\n  families:\n    display: Axiforma # --font-family-axiforma\n    body: Inter # --font-family-inter');
design = replaceBlock(design, 'DESIGN:type-styles', keys('typography.').map((k) => {
  const v = base[k].$value;
  return `  ${k.split('.').slice(1).join('-')}: { family: ${v.fontFamily}, size: ${v.fontSize.value}px, weight: ${v.fontWeight}, lineHeight: ${Math.round(v.fontSize.value * v.lineHeight)}px } # ${cssVar(k)}`;
}).join('\n'));
design = replaceBlock(design, 'DESIGN:rounded', yamlLines('rounded', keys('radius.').map((k) => `  ${k.split('.')[1]}: ${css.base[k]} # ${cssVar(k)}`)));
design = replaceBlock(design, 'DESIGN:spacing', yamlLines('spacing', keys('space.').filter((k) => k !== 'space.legacy-number').map((k) => `  s${k.split('.')[1]}: ${css.base[k]} # ${cssVar(k)}`)));
design = replaceBlock(design, 'DESIGN:structure', yamlLines('structure', [
  `  focus-ring: "${hex('border.focus-ring')}" # --border-focus-ring (oscuro: ${darkHex('border.focus-ring')})`,
  ...['mobile', 'tablet', 'desktop'].map((m, i) => `  breakpoint-${m}: ${[css.base, css.tabletViewport, css.desktopViewport][i]['layout.breakpoint.min-width'] ?? css.base['layout.breakpoint.min-width']} # --layout-breakpoint-min-width`),
  `  grid-margin: [${['base', 'tabletViewport', 'desktopViewport'].map((g) => css[g]['layout.grid.margin'] ?? css.base['layout.grid.margin']).join(', ')}] # --layout-grid-margin mobile/tablet/desktop`,
]));
design = replaceBlock(design, 'DESIGN:components', yamlLines('components', components.map((c) => `  ${c.slug}: { level: ${c.level}, figma: "${figmaUrl(fileKey, c.id)}", tokens: [${[...c.variables, ...c.textStyles, ...c.effectStyles].filter((n) => lookup(figmaToPath(n))).map((n) => figmaToPath(n)).join(', ')}] }`)));
const linksHtml = ['```html', '<link rel="preconnect" href="https://fonts.googleapis.com">', '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>', '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">', `<link href="https://cdn.jsdelivr.net/gh/${repo}@main/tokens.css" rel="stylesheet">`, '```'].join('\n');
design = replaceBlock(design, 'DESIGN:links', linksHtml);
design = replaceBlock(design, 'DESIGN:component-list', LEVELS.map(([l, t]) => [`**${t}**`, '', '| Componente | Para qué sirve |', '|---|---|', ...components.filter((c) => c.level === l).map((c) => `| [${c.name}](components/${c.slug}.md) | ${esc(summary(c))} |`)].join('\n')).join('\n\n'));
await out('DESIGN.md', design);

// ---------- AGENTS.md generated blocks ----------
let agents = await readText('AGENTS.md');
agents = replaceBlock(agents, 'AGENTS:links', linksHtml);
agents = replaceBlock(agents, 'AGENTS:components', LEVELS.map(([l, t]) => `**${t}:** ${components.filter((c) => c.level === l).map((c) => `[${c.name}](components/${c.slug}.md)`).join(', ')}`).join('\n\n'));
const names = (label, list) => `- **${label}:** ${list.map((k) => code(cssVar(k))).join(', ')}`;
agents = replaceBlock(agents, 'AGENTS:names', [
  names('Superficies y rellenos', keys('bg.')),
  names('Texto', keys('text.')),
  names('Bordes y foco', keys('border.')),
  names('Estilo Clásico/Lienzo', keys('style.')),
  names('Familias', keys('font.family.')),
  names('Estilos de texto', keys('typography.')),
  names('Radio', keys('radius.')),
  names('Espaciado', keys('space.').filter((k) => k !== 'space.legacy-number')),
  names('Elevación', keys('elevation.')),
  names('Layout', keys('layout.')),
].join('\n'));
await out('AGENTS.md', agents);

// ---------- foundations ----------
const S = splitSections(design);
const crumb = `Parte del [${SYSTEM}](../README.md): esta página es una sección de [DESIGN.md](../DESIGN.md), el contrato de marca entero en un archivo. Cada token con su propósito: [Tokens](tokens.md). Todas las foundations: [Foundations](README.md).`;
const figmaLine = (slug) => (figmaPage(slug) ? `\n\n**Figma:** [página ${figmaPage(slug).name}](${figmaUrl(fileKey, figmaPage(slug).pageId)})` : '');
const page = (title, blurb, body, slug, source = 'DESIGN.md') => [GEN(source), '', `# ${title}`, '', `> ${blurb}`, '', crumb + figmaLine(slug), '', body.trim()].join('\n');
const section = (name) => `## ${name}\n\n${(S[name] ?? '').trim()}`;
const tokenTable = (list, withDark = false) => [
  `| Token | Para qué es | Valor${withDark ? ' | Valor oscuro' : ''} | Fuente en tokens.json |`, `|---|---|---|${withDark ? '---|' : ''}---|`,
  ...list.map((k) => `| ${code(cssVar(k))} | ${esc(base[k].$description || '—')} | ${code(css.base[k])}${withDark ? ` | ${css.darkTheme[k] ? code(css.darkTheme[k]) : 'igual'}` : ''} | ${code(k)} |`),
].join('\n');
const valuesBlock = (name) => `## Valores\n\n\`\`\`yaml\n${design.match(new RegExp(`# DESIGN:${name}:start\\n([\\s\\S]*?)# DESIGN:${name}:end`))[1].trim()}\n\`\`\``;

const FOUNDATIONS = [
  ['getting-started', 'Primeros pasos', 'Linkeá los tokens publicados y construí con ellos: la configuración y el carácter del sistema en una lectura.', [section('Usar el CSS publicado'), section('Visión general')].join('\n\n')],
  ['tokens', 'Tokens', 'Cada token que te da tokens.css, para qué es y su valor.', [
    '## Tres niveles', '', '| Nivel | Qué es | Ejemplo | Dónde está | ¿Usarlo? |', '|---|---|---|---|---|',
    `| Primitivo | Valores crudos, por tono y escala | ${code('--color-palette-indigo-600')} | [Color](color.md) | Solo para definir roles nuevos |`,
    `| Semántico | Roles que apuntan a primitivos | ${code('--bg-fill-primary')} | Esta página | Sí |`,
    `| Componente | Componentes de Figma que leen roles | Button | [Componentes](../COMPONENTS.md) | Sí |`,
    '', '## Color', '', tokenTable(roleKeys, true),
    '', '## Familias tipográficas', '', tokenTable(keys('font.family.')),
    '', '## Estilos de texto', '', tokenTable(keys('typography.')),
    '', '## Radio', '', tokenTable(keys('radius.')),
    '', '## Espaciado', '', tokenTable(keys('space.')),
    '', '## Elevación', '', tokenTable(keys('elevation.')),
    '', '## Layout', '', tokenTable(keys('layout.')),
  ].join('\n'), 'tokens.json'],
  ['color', 'Color', 'Los roles de color y cada valor resuelto, en claro y oscuro.', [section('Roles de color'), valuesBlock('colors')].join('\n\n')],
  ['typography', 'Tipografía', 'Dos familias y los estilos de texto con nombre, con cada tamaño resuelto.', [section('Reglas tipográficas'), valuesBlock('type-styles')].join('\n\n')],
  ['layout', 'Layout y espaciado', 'Los principios de layout y la escala de espaciado.', [section('Principios de layout'), valuesBlock('spacing')].join('\n\n')],
  ['depth-and-radius', 'Profundidad y radio', 'Profundidad por escalones de superficie y sombras; la escala de radios.', [section('Profundidad y elevación'), valuesBlock('rounded'), '', tokenTable(keys('elevation.'))].join('\n\n')],
  ['responsive', 'Comportamiento responsive', 'Cómo se comporta el sistema en cada ancho.', [section('Comportamiento responsive'), '## Valores', '',
    '| Token | Mobile | Tablet | Desktop |', '|---|---|---|---|',
    ...keys('layout.').map((k) => `| ${code(cssVar(k))} | ${code(css.base[k])} | ${code(css.tabletViewport[k] ?? css.base[k])} | ${code(css.desktopViewport[k] ?? css.base[k])} |`)].join('\n')],
  ['voice-and-tone', 'Voz y tono', 'Cómo suenan las palabras.', section('Voz y tono')],
  ['dos-and-donts', "Do's and don'ts", 'Las reglas de todo el sistema.', section("Do's and Don'ts")],
  ['agent-guide', 'Guía para agentes', 'Cómo pedirle a un agente que use este sistema, y qué no cubre todavía.', [section('Guía para agentes'), section('Brechas conocidas')].join('\n\n')],
];

const focusUsers = components.filter((c) => c.variables.includes('border/focus-ring'));
const accessibility = [
  '## Contraste', '', `Cada par que el sistema combina se verifica contra WCAG 2.2 en las cuatro combinaciones de tema y estilo ([checks/contrast-pairs.json](${raw('checks/contrast-pairs.json')})).`, '',
  ...Object.entries(contrast).flatMap(([combo, rows]) => [`### ${combo}`, '', '| Par | Uso | Contraste | Mínimo | Resultado |', '|---|---|---|---|---|',
    ...rows.map((r) => `| ${code(cssVar(r.fg))} sobre ${code(cssVar(r.bg))} | ${esc(r.use)} | ${r.ratio.toFixed(2)}:1 | ${r.min}:1 | ${r.pass ? 'Pasa' : 'Falla'} |`), '']),
  '## Foco', '', `El foco usa ${code('--border-focus-ring')}: ${hex('border.focus-ring')} en claro y ${darkHex('border.focus-ring')} en oscuro. Componentes con estado de foco enlazado en Figma: ${focusUsers.map((c) => `[${c.name}](../components/${c.slug}.md)`).join(', ')}.`, '',
  '## Auditoría del sitio de docs', '',
  '| Herramienta | Resultado |', '|---|---|',
  ...Object.entries(axe).map(([combo, v]) => `| axe-core · ${combo} | ${v.length} violaciones |`),
  ...['mobile', 'desktop'].map((f) => `| Lighthouse · ${f} | ${Object.entries(lighthouse[f]).map(([k, v]) => `${k} ${v}`).join(' · ')} |`),
].join('\n');
FOUNDATIONS.push(['accessibility', 'Accesibilidad', 'Cada par de contraste, el foco y la auditoría automática del sitio de docs.', accessibility, 'reports/contrast.json, reports/axe.json and reports/lighthouse.json']);

const checks = [
  '## Automáticos', '', 'Corren en cada push en GitHub Actions ([ci.yml](../.github/workflows/ci.yml)).', '',
  '### Validación DTCG', '', `[scripts/validate-dtcg.mjs](../scripts/validate-dtcg.mjs): tipos DTCG 2025.10 válidos, alias que resuelven, sin ciclos, y \`tokens.resolver.json\` sincronizado con los grupos de override.`, '',
  '### Cruce con Token Exporter', '', `[scripts/crosscheck-plugin-css.mjs](../scripts/crosscheck-plugin-css.mjs): cada valor del export CSS propio de Token Exporter (\`figma/tokens.figma.css\`) tiene que ser igual al que resuelve este pipeline, en cada modo. Prueba independiente de que el build no pierde ni cambia nada.`, '',
  '### Contraste WCAG', '', `[scripts/contrast-pairs.mjs](../scripts/contrast-pairs.mjs): WCAG 2.2 SC 1.4.3 (texto, 4.5:1) y SC 1.4.11 (no texto, 3:1) en claro/oscuro × Clásico/Lienzo.`, '',
  '### Build reproducible', '', 'Regenerar desde los exports de Figma no puede cambiar ningún archivo publicado; si cambia, alguien editó a mano un archivo generado.', '',
  '### axe-core', '', `[scripts/audit-axe.mjs](../scripts/audit-axe.mjs): reglas WCAG 2.0–2.2 A/AA y best practices sobre el sitio de docs, en las cuatro combinaciones.`, '',
  '### Lighthouse', '', `[scripts/audit-lighthouse.mjs](../scripts/audit-lighthouse.mjs): performance, accesibilidad, best practices y SEO, con los presets oficiales de mobile y desktop. Falla por debajo de 100.`, '',
  '### Tests unitarios', '', 'node:test sobre la conversión Figma → DTCG, el color oklch, el contraste y los generadores de docs.', '',
  '## Manuales', '', '> TODO: todavía no hay revisiones manuales documentadas.',
].join('\n');
FOUNDATIONS.push(['checks', 'Cómo se verifican las reglas', 'Cada chequeo automático: qué hace, qué criterio WCAG respalda y cuándo corre.', checks, 'the scripts in scripts/']);

FOUNDATIONS.push(['icons', 'Iconos', 'Los iconos de la interfaz.', 'Los componentes usan iconos [Phosphor](https://phosphoricons.com), nombrados en las descripciones de Figma, y heredan el color semántico del texto.\n\n> TODO: nombres y tamaños de icono todavía no son tokens; la página de Figma es la fuente.', 'figma/components.json']);
FOUNDATIONS.push(['motion', 'Movimiento', 'El ritmo de la interfaz.', 'Movimiento documentado en componentes: hover de Card con Smart Animate de 300 ms ease-out; entrada del caso de estudio de 0.8 s con `cubic-bezier(0.87, 0, 0.13, 1)`, sin desplazamiento con `prefers-reduced-motion` (descripción de Card en Figma).\n\n> TODO: duraciones y curvas todavía no son tokens.', 'figma/components.json']);
FOUNDATIONS.push(['logo', 'Logo', 'La marca.', '> TODO: el logo es un asset de Figma; todavía no se exporta a este repo.', 'figma/components.json']);

for (const old of ['spacing', 'layout-grid', 'elevation']) await rm(new URL(`foundations/${old}.md`, root), { force: true });
const figmaSlugFor = { color: 'color', typography: 'typography', layout: 'spacing', 'depth-and-radius': 'elevation', responsive: 'layout-grid', icons: 'icons', motion: 'motion', logo: 'logo' };
for (const [slug, title, blurb, body, source] of FOUNDATIONS) await out(`foundations/${slug}.md`, page(title, blurb, body, figmaSlugFor[slug], source));
await out('foundations/README.md', [GEN('scripts/build-docs.mjs'), '', '# Foundations', '',
  '> Las decisiones debajo de cada componente: tokens, color, tipografía, espaciado, profundidad, responsive, voz, accesibilidad y cómo se verifican las reglas.', '',
  `La mayoría de las páginas son un tema de [DESIGN.md](../DESIGN.md). Tres se construyen con datos: Tokens desde tokens.json, y Accesibilidad y Cómo se verifican desde los reportes de auditoría. La fuente de tokens: [tokens.json](${raw('tokens.json')}).`, '',
  '## Todas las foundations', '', '| Página | Qué cubre |', '|---|---|',
  ...FOUNDATIONS.map(([slug, title, blurb]) => `| [${title}](${slug}.md) | ${esc(blurb)} |`)].join('\n'));

// ---------- components-api.json ----------
const api = {
  name: SYSTEM,
  description: 'Los componentes del sistema como datos: props de Figma, variantes, valores por defecto y los tokens que lee cada uno.',
  stylesheets: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap', `https://cdn.jsdelivr.net/gh/${repo}@main/tokens.css`],
  rules: raw('AGENTS.md'), values: raw('DESIGN.md'), pages: raw('COMPONENTS.md'),
  components: LEVELS.map(([level, title]) => ({
    name: title, level,
    items: components.filter((c) => c.level === level).map((c) => ({
      name: c.name, slug: c.slug, figma: figmaUrl(fileKey, c.id), page: raw(`components/${c.slug}.md`), description: c.description,
      variants: c.variants, defaultVariant: c.defaultVariant,
      props: c.props.map(([name, type, value]) => ({ name, type, ...(type === 'VARIANT' ? { values: value } : { default: value }) })),
      reads: [...c.variables, ...c.textStyles, ...c.effectStyles].map(figmaToPath).filter((p) => lookup(p)).map(cssVar),
      outsideSystem: outsideOf(c),
    })),
  })),
};
await out('components-api.json', JSON.stringify(api, null, 2));

// ---------- dsds.yaml ----------
const dsds = {
  $schema: 'https://designsystemdocspec.org/v0.20.0/dsds.bundled.yaml',
  schemaVersion: '0.20.0',
  name: SYSTEM,
  entries: [
    { id: NAME, kind: 'system', name: SYSTEM, description: 'Tokens DTCG exportados de Figma y componentes de Figma del portfolio de Benjamín Abud.', purpose: 'Mantener consistente el portfolio en Figma, Framer y código.',
      metadata: { version: '1.0.0', organization: 'Benjamín Abud', url: LIVE, license: 'MIT', platforms: ['web', 'figma'], status: { status: 'experimental' }, origin: { method: 'exported', author: 'Benjamín Abud', note: 'Figma FvaEDyROUUsM8ntHj8C9f8 vía Token Exporter' } },
      refs: [{ href: raw('DESIGN.md'), rel: 'contract', role: 'rules' }, { href: raw('tokens.json'), rel: 'source', role: 'tokens' }] },
    ...components.map((c) => ({
      id: c.slug, kind: 'component', name: c.name, description: summary(c), purpose: c.description || 'TODO',
      metadata: { status: { status: 'design-only' }, level: c.level },
      refs: [{ href: figmaUrl(fileKey, c.id), rel: 'design', role: 'figma' }, { href: raw(`components/${c.slug}.md`), rel: 'documentation', role: 'page' }],
      traits: c.props.filter(([, t]) => t === 'VARIANT').map(([name, , values]) => ({ kind: 'enum', id: name.toLowerCase(), name, setBy: 'consumer', values: values.map((v) => ({ id: String(v).toLowerCase().replace(/\s+/g, '-'), name: String(v) })) })),
    })),
    ...Object.keys(base).filter((k) => !k.startsWith('color.palette.') && !k.startsWith('size.') && !k.startsWith('count.') && !k.startsWith('font.')).map((k) => ({
      id: k, kind: 'token', name: cssVar(k), description: base[k].$description || '', tokenType: base[k].$type, source: './tokens.json', metadata: { group: tierOf(k) },
    })),
  ],
};
await out(`${NAME}.dsds.yaml`, `# Generated by scripts/build-docs.mjs from tokens.json and figma/components.json. Do not edit.\n# Design System Doc Spec 0.20.0\n${toYaml(dsds)}`);

// ---------- llms.txt, llms-full.txt, skill references, .last-sync ----------
const llms = [
  `# ${SYSTEM}`, '',
  '> Tokens DTCG 2025.10 exportados de Figma, compilados con Style Dictionary a custom properties CSS Color 4 (oklch). Temas claro y oscuro, estilos Clásico y Lienzo, layout mobile/tablet/desktop. Contraste WCAG 2.2 AA, axe-core y Lighthouse verificados.', '',
  `El design system del portfolio de Benjamín Abud. ${components.length} componentes en Figma, ${Object.keys(base).length} tokens.`, '',
  '## Para agentes', '',
  `- [AGENTS.md](${raw('AGENTS.md')}): las reglas cortas, los componentes y los nombres de tokens`,
  `- [DESIGN.md](${raw('DESIGN.md')}): cada valor resuelto, los roles y las reglas`,
  `- [components-api.json](${raw('components-api.json')}): los componentes como datos`, '',
  '## Componentes y foundations', '',
  `- [COMPONENTS.md](${raw('COMPONENTS.md')}): todos los componentes, cada uno con su página`,
  `- [foundations/README.md](${raw('foundations/README.md')}): todas las foundations`,
  `- [foundations/tokens.md](${raw('foundations/tokens.md')}): cada token con su propósito`,
  `- [foundations/checks.md](${raw('foundations/checks.md')}): cómo se verifican las reglas`, '',
  '## Fuente', '',
  `- [tokens.json](${raw('tokens.json')}): todos los tokens, DTCG 2025.10`,
  `- [tokens.resolver.json](${raw('tokens.resolver.json')}): cómo se combinan temas, estilos y viewports`,
  `- [tokens.css](${raw('tokens.css')}): las custom properties`,
  `- [Repositorio público](https://github.com/${repo})`,
  `- [Plugin de Claude Code](${raw('.claude-plugin/marketplace.json')}): \`claude plugin marketplace add ${repo}\``, '',
  '## Opcional', '',
  `- [${NAME}.dsds.yaml](${raw(`${NAME}.dsds.yaml`)}): el sistema entero como Design System Doc Spec`,
  `- [llms-full.txt](${raw('llms-full.txt')}): este índice, AGENTS.md y DESIGN.md en un archivo`,
  `- [Sistema en vivo](${LIVE}): cada sección del sistema con sus valores`,
  '- [Portfolio](https://benjaabud.framer.website): el sitio que usa este sistema',
].join('\n');
await out('llms.txt', llms);
await out('llms-full.txt', [GEN('llms.txt, AGENTS.md and DESIGN.md'), '', llms, '', `<!-- AGENTS.md: ${raw('AGENTS.md')} -->`, '', agents, '', `<!-- DESIGN.md: ${raw('DESIGN.md')} -->`, '', design].join('\n'));
await out(`skills/${NAME}/references/AGENTS.md`, agents);
await out(`skills/${NAME}/references/DESIGN.md`, design);
const exported = await stat(new URL('figma/tokens.figma.json', root));
await writeFile(new URL('.last-sync', root), `${exported.mtime.toISOString().replace(/\.\d+Z$/, 'Z')}\n`);

console.log(`${components.length} component pages, COMPONENTS.md, ${FOUNDATIONS.length} foundations, DESIGN.md, AGENTS.md, llms(.txt|-full.txt), components-api.json, dsds.yaml, skill references`);
