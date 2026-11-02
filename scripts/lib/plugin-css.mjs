// Parses Token Exporter's CSS export: blocks headed by "/* Collection (Mode) */", names prefixed by the collection.

export function parsePluginCss(css) {
  const out = [];
  for (const [, label, mode, body] of css.matchAll(/\/\* ([^*]+?) \*\/\s*(?::root|\[data-theme="([^"]+)"\]) \{([^}]*)\}/g)) {
    const prefix = `${label.replace(/ \(.*\)$/, '').trim().replace(/ /g, '-')}-`;
    for (const [, name, value] of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
      out.push({ path: name.startsWith(prefix) ? name.slice(prefix.length) : name, mode: mode ?? null, value: value.trim() });
    }
  }
  return out;
}
