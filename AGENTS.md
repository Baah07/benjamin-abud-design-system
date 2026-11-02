# AGENTS.md — rules for AI agents using this design system

1. **Tokens only.** Every color, font, spacing, radius and shadow is `var(--…)` from `tokens.css`. No hex, rgb, raw px for spacing, or new font stacks.
2. **Semantic over primitive.** Use `bg.*`, `text.*`, `border.*`, `style.*` roles. Reach for `color.palette.*` only to define a new role, and propose that role in Figma first.
3. **Themes are attributes on `<html>`.** `data-theme="light|dark"` (default: `prefers-color-scheme`), `data-style="lienzo"` for the Lienzo skin. Never fork components per theme.
4. **Pairs must pass WCAG 2.2 AA.** Text 4.5:1, UI and borders 3:1. If you combine a new fg/bg pair, add it to `checks/contrast-pairs.json` and run `npm run validate`.
5. **Figma is the source of truth.** Do not edit generated files (`tokens.*`, `components/*.md`, `foundations/*.md`, `docs/`). Change Figma, re-export with Token Exporter, run `npm run build`.
6. **Don't invent.** If a component has no description or a value is missing, leave the visible `TODO`.

Machine-readable entry points: [`tokens.json`](tokens.json) (DTCG 2025.10), [`tokens.resolver.json`](tokens.resolver.json), [`figma/components.json`](figma/components.json), [`llms.txt`](llms.txt).
