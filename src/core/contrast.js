// src/core/contrast.js

// WCAG/APCA ratio calc + readability grade

/**
 * WCAG relative luminance and contrast ratio calculations, plus a
 * rating helper. Pure functions, no DOM — this is the piece Vitest
 * can exercise directly without a browser.
 *
 * Ported from the CodePen prototype's luminance()/contrastRatio()
 * functions, unchanged math — just relocated and given real names.
 */

/**
 * Converts an HSL color (as used by the color tokens in tokens.js)
 * to a hex string, e.g. { hue: 210, sat: 80, light: 50 } -> "#1a75e0".
 */
export function hslToHex({ hue, sat, light }) {
  const s = sat / 100;
  const l = light / 100;
  const k = (n) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) =>
    Math.round(255 * x)
      .toString(16)
      .padStart(2, "0");
  return "#" + toHex(f(0)) + toHex(f(8)) + toHex(f(4));
}

/**
 * WCAG relative luminance of a hex color (#rrggbb).
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function luminance(hex) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substr(0, 2), 16) / 255;
  const g = parseInt(c.substr(2, 2), 16) / 255;
  const b = parseInt(c.substr(4, 2), 16) / 255;
  const lin = (v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * WCAG contrast ratio between two hex colors. Returns a number from
 * 1 (no contrast) to 21 (max possible, pure black on pure white).
 */
export function contrastRatio(hexA, hexB) {
  const l1 = luminance(hexA) + 0.05;
  const l2 = luminance(hexB) + 0.05;
  return l1 > l2 ? l1 / l2 : l2 / l1;
}

/**
 * Rates a contrast ratio against WCAG AA thresholds.
 * 4.5+  -> 'excellent' (passes AA for normal text)
 * 3–4.5 -> 'acceptable' (passes AA for large text/UI components only)
 * <3    -> 'difficult' (fails AA at any size)
 *
 * Returns { level, ratio } — UI layers (panel.js) decide how to
 * display this (badge color, emoji, wording); this module stays
 * presentation-free.
 */
export function rateContrast(hexA, hexB) {
  const ratio = contrastRatio(hexA, hexB);
  let level;
  if (ratio >= 4.5) level = "excellent";
  else if (ratio >= 3) level = "acceptable";
  else level = "difficult";
  return { level, ratio };
}

/**
 * Convenience wrapper: rates contrast directly from two color tokens
 * (the { hue, sat, light } shape used throughout tokens.js and
 * engine.js), so callers don't need to hslToHex() by hand first.
 */
export function rateTokenContrast(tokenA, tokenB) {
  return rateContrast(hslToHex(tokenA), hslToHex(tokenB));
}
