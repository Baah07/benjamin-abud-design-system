# AGENTS.md: construir con el Design System de Benjamín Abud

Reglas cortas para agentes de IA (y personas) que construyen interfaz para el portfolio. Para usarlas desde tu proyecto, agregá una línea a tu propio `AGENTS.md` o `CLAUDE.md`: `Antes de escribir UI para el portfolio de Benjamín Abud, leé https://raw.githubusercontent.com/Baah07/benjamin-abud-design-system/main/AGENTS.md y seguilo.`

## Linkeá la base, nunca la reconstruyas

<!-- AGENTS:links:start -->
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/gh/Baah07/benjamin-abud-design-system@main/tokens.css" rel="stylesheet">
```
<!-- AGENTS:links:end -->

Cargá las fuentes primero y `tokens.css` después: todo lo demás lee esas custom properties. Tema y estilo van en `<html>`: `data-theme="light|dark"` y `data-style="lienzo"`.

## Reglas

1. **Solo tokens.** Color, tipografía, espaciado, radio y sombra salen de `var(--…)` en `tokens.css`. Nada de hex, rgb, px sueltos para espaciado ni familias nuevas.
2. **Rol antes que primitivo.** Usá `bg.*`, `text.*`, `border.*` y `style.*`. `color.palette.*` es solo para definir un rol nuevo, y ese rol se propone primero en Figma.
3. **Temas por atributo.** Nunca dupliques un componente por tema; cambiá `data-theme` y `data-style`.
4. **Contraste WCAG 2.2 AA.** Texto 4.5:1; interfaz y bordes 3:1. Si combinás un par nuevo, agregalo a `checks/contrast-pairs.json` y corré `npm run validate`.
5. **Foco visible.** Usá `border.focus-ring`; nunca saques el outline sin reemplazo.
6. **Error con palabras.** `text.error` y `border.error` siempre van con un mensaje explícito.
7. **Movimiento reducido.** Todo lo que se desplaza respeta `prefers-reduced-motion`.
8. **Figma es la fuente.** No edites archivos generados (`tokens.*`, `components/`, `foundations/`, `docs/`, los bloques marcados de `DESIGN.md` y de este archivo).
9. **No inventes.** Si falta un dato, dejá el `TODO` visible.

## Componentes publicados

<!-- AGENTS:components:start -->
**Átomos:** [Button](components/button.md), [Link](components/link.md), [Input Field](components/input-field.md), [Toggle](components/toggle.md), [Checkbox](components/checkbox.md), [Radio button](components/radio-button.md), [Slider](components/slider.md), [Table cell](components/table-cell.md), [Table cell title](components/table-cell-title.md), [Token preview](components/token-preview.md), [Filter chip](components/filter-chip.md), [Dock item](components/dock-item.md), [Dot grid](components/dot-grid.md)

**Moléculas:** [Menu](components/menu.md), [Choice](components/choice.md), [Accordeon](components/accordion.md), [Card](components/card.md), [Navigation card](components/navigation-card.md), [Bottom sheet](components/bottom-sheet.md), [Table list](components/table-list.md), [Table header](components/table-header.md), [Folder](components/folder.md), [Paper note](components/paper-note.md), [Zoom control](components/zoom-control.md)

**Organismos:** [Header](components/header.md), [Panel content](components/panel-content.md), [Inspector](components/inspector.md), [System · Personalize](components/system-personalize.md), [System · Component detail](components/system-component-detail.md), [System · Mobile sheet](components/system-mobile-sheet.md), [Table](components/table.md), [Dock nav](components/dock-nav.md), [Canvas toolbar](components/canvas-toolbar.md), [Case study modal](components/case-study-modal.md), [Envelope contact](components/envelope-contact.md)
<!-- AGENTS:components:end -->

## Nombres de tokens que vas a usar

<!-- AGENTS:names:start -->
- **Superficies y rellenos:** `--bg-fill-primary`, `--bg-fill-primary-hover`, `--bg-fill-primary-pressed`, `--bg-fill-secondary`, `--bg-surface-container`, `--bg-surface-container-high`, `--bg-surface-default`, `--bg-surface-inverse`, `--bg-surface-white`
- **Texto:** `--text-error`, `--text-inverse-primary`, `--text-on-primary`, `--text-on-primary-container`, `--text-on-primary-container-pressed`, `--text-on-surface`, `--text-on-surface-variant`, `--text-primary`
- **Bordes y foco:** `--border-error`, `--border-focus-ring`, `--border-outline`, `--border-outline-variant`, `--border-primary`, `--border-primary-hover`, `--border-primary-pressed`
- **Estilo Clásico/Lienzo:** `--style-bg-accent`, `--style-bg-canvas`, `--style-bg-canvas-dot`, `--style-bg-control`, `--style-bg-folder`, `--style-bg-paper`, `--style-border-paper`, `--style-border-selection`, `--style-radius-control`, `--style-radius-paper`, `--style-radius-surface`, `--style-space-surface`, `--style-text-accent`, `--style-text-on-accent`, `--style-text-primary`, `--style-text-secondary`
- **Familias:** `--font-family-axiforma`, `--font-family-inter`
- **Estilos de texto:** `--typography-display-01`, `--typography-display-02`, `--typography-display-03`, `--typography-display-04`, `--typography-display-05`, `--typography-display-06`, `--typography-heading-3xl`, `--typography-heading-2xl`, `--typography-heading-xl`, `--typography-heading-lg`, `--typography-heading-subtitle-md`, `--typography-heading-subtitle-sm`, `--typography-body-lg`, `--typography-body-md`, `--typography-body-md-emphasized`, `--typography-body-sm`, `--typography-body-sm-emphasized`, `--typography-body-button-md`, `--typography-body-button-sm`, `--typography-body-label-md`, `--typography-body-label-md-emphasized`, `--typography-body-caption`, `--typography-body-caption-emphasized`
- **Radio:** `--radius-none`, `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-xl`, `--radius-full`
- **Espaciado:** `--space-0`, `--space-1`, `--space-2`, `--space-3`, `--space-4`, `--space-6`, `--space-8`, `--space-9`, `--space-12`, `--space-16`, `--space-24`, `--space-32`, `--space-48`, `--space-64`, `--space-96`, `--space-128`, `--space-160`, `--space-192`
- **Elevación:** `--elevation-low-shadow-1`, `--elevation-low-shadow-2`, `--elevation-medium-shadow-3`, `--elevation-high-shadow-4`, `--elevation-high-shadow-5`, `--elevation-paper-shadow-1`, `--elevation-paper-shadow-2`, `--elevation-paper-shadow-3`
- **Layout:** `--layout-breakpoint-min-width`, `--layout-container-reference-width`, `--layout-grid-columns`, `--layout-grid-gutter`, `--layout-grid-margin`, `--layout-viewport-reference-width`
<!-- AGENTS:names:end -->

## Más

- Todos los valores, reglas y roles: [DESIGN.md](https://raw.githubusercontent.com/Baah07/benjamin-abud-design-system/main/DESIGN.md)
- Los componentes como datos (props, variantes, tokens que leen): [components-api.json](https://raw.githubusercontent.com/Baah07/benjamin-abud-design-system/main/components-api.json)
- Índice para herramientas de IA: [llms.txt](https://raw.githubusercontent.com/Baah07/benjamin-abud-design-system/main/llms.txt)
- Plugin de Claude Code: `claude plugin marketplace add Baah07/benjamin-abud-design-system`, después `claude plugin install benjamin-abud-design-system@benjamin-abud-design-system`
