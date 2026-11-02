// DTCG color objects → CSS Color 4 strings.
import Color from 'colorjs.io';

const round = (n, digits) => {
  const v = Number(n.toFixed(digits));
  return Object.is(v, -0) ? 0 : v;
};

const toColor = ({ colorSpace, components, alpha = 1 }) => new Color(colorSpace === 'srgb' ? 'srgb' : colorSpace, components, alpha);

export function toOklch(dtcg) {
  const [l, c, h] = toColor(dtcg).to('oklch').coords;
  const chroma = round(c, 3);
  const hue = chroma === 0 || Number.isNaN(h) ? 0 : round(h, 2);
  const alpha = dtcg.alpha ?? 1;
  return `oklch(${round(l * 100, 2)}% ${chroma} ${hue}${alpha < 1 ? ` / ${round(alpha, 3)}` : ''})`;
}

export function toHex(dtcg) {
  return toColor({ ...dtcg, alpha: 1 }).to('srgb').toString({ format: 'hex', collapse: false });
}
