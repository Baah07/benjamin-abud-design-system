// WCAG 2.2 contrast ratio (relative luminance, SC 1.4.3 / 1.4.6 / 1.4.11).

const channel = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = (hex) => {
  const n = parseInt(hex.replace('#', '').slice(0, 6), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// resolved: { [tokenPath]: '#rrggbb' }
export function checkPairs(resolved, pairs) {
  return pairs.map((pair) => {
    for (const key of [pair.fg, pair.bg]) if (!resolved[key]) throw new Error(`Unknown token in contrast pair: ${key}`);
    const ratio = contrastRatio(resolved[pair.fg], resolved[pair.bg]);
    return { ...pair, ratio: Number(ratio.toFixed(2)), pass: ratio >= pair.min };
  });
}
