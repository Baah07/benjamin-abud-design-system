---
name: benjamin-abud-design-system
description: Construí cualquier página, prototipo, componente o documento que tenga que verse como el portfolio de Benjamín Abud, usando su design system. Usalo cuando un pedido nombre a Benjamín Abud, benjaabud.framer.website, su portfolio, su sistema o el estilo Lienzo, o pida algo "en marca" para él. Linkea tokens.css, usa los tokens por nombre y sigue las reglas de contraste y de roles.
license: MIT
metadata:
  author: Benjamín Abud
  homepage: https://benjaabud.framer.website/sistema
---

# Design System de Benjamín Abud

El sistema son tokens DTCG exportados de Figma y compilados a `tokens.css`. Los componentes viven en Figma. Linkeás los tokens; nunca los reconstruís desde valores.

## Hacé esto, en orden

1. Leé [references/AGENTS.md](references/AGENTS.md): reglas, componentes y nombres de tokens.
2. Linkeá las fuentes y `tokens.css` como muestra AGENTS.md.
3. Para un componente, abrí su página en `components/` y usá exactamente los tokens que lista.
4. Para valores y reglas, leé [references/DESIGN.md](references/DESIGN.md); para datos, `components-api.json`.
5. Revisá el resultado en claro y oscuro (`data-theme`), en Clásico y Lienzo (`data-style`), y verificá contraste WCAG 2.2 AA.

## Nunca

- Escribas hex, rgb o px sueltos donde existe un token.
- Uses `color.palette.playground.*` ni `color.palette.brand.base` como color de texto.
- Saques el foco sin reemplazo (`border.focus-ring`).
- Inventes un dato que no está en Figma: dejá el `TODO` visible.

Los archivos en `references/` son copias de los documentos publicados en el repo; `npm run build` los regenera.
