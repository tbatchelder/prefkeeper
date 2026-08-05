// src/core/engine.js

// applies variables to :root, reads/writes the token map

/**
 * Converts the state shapes defined in tokens.js into real CSS custom
 * properties on a target element — by default document.documentElement,
 * i.e. the host page's :root, which is what makes a developer's own
 * CSS (color: var(--pk-text)) actually update.
 *
 * Every function accepts an optional `target` element instead of
 * hardcoding document.documentElement. Two reasons:
 *   1. It's what lets panel.js reuse this exact same code to update
 *      its own internal .preview mock, instead of duplicating the
 *      hsl-string-building logic a second time in the UI layer.
 *   2. It's what makes this file testable with Vitest — tests can
 *      pass a plain object with a .style.setProperty stub instead of
 *      needing a real browser/DOM.
 */

import {
  COLOR_TOKENS,
  TEXT_TOKENS,
  MOTION_TOKENS,
  FOCUS_TOKENS,
} from "./tokens.js";

// The one real font PrefKeeper ships and can offer as an alternative.
// 'site' is intentionally NOT a font stack — see applyText() below.
const FONT_STACKS = {
  atkinson: "'Atkinson Hyperlegible Next', sans-serif",
};

function hslString({ hue, sat, light }) {
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

/**
 * Writes each color token as an hsl() string.
 */
export function applyColors(colorState, target = document.documentElement) {
  Object.entries(COLOR_TOKENS).forEach(([key, cssVar]) => {
    const value = colorState[key];
    if (!value) return;
    target.style.setProperty(cssVar, hslString(value));
  });
}

/**
 * Writes text metric tokens. fontFamily is a special case: when the
 * state says 'site', the variable is REMOVED rather than set to some
 * value — this lets the developer's own font keep applying naturally,
 * rather than PrefKeeper asserting an opinion about what "site font"
 * means. Only 'atkinson' ever actually sets the variable.
 */
export function applyText(textState, target = document.documentElement) {
  target.style.setProperty(TEXT_TOKENS.fontSize, `${textState.fontSize}%`);
  target.style.setProperty(TEXT_TOKENS.lineHeight, `${textState.lineHeight}`);
  target.style.setProperty(
    TEXT_TOKENS.letterSpacing,
    `${textState.letterSpacing}px`,
  );
  target.style.setProperty(
    TEXT_TOKENS.wordSpacing,
    `${textState.wordSpacing}px`,
  );

  if (textState.fontFamily === "atkinson") {
    target.style.setProperty(TEXT_TOKENS.fontFamily, FONT_STACKS.atkinson);
  } else {
    target.style.removeProperty(TEXT_TOKENS.fontFamily);
  }
}

/**
 * Writes the motion token as a 0/1 SCALE, not a boolean and not a
 * duration. This is deliberate: CSS can't read a JS boolean, and
 * PrefKeeper can't know what transition durations a developer's site
 * actually uses. Instead, a developer writes their own transitions
 * against this scale, e.g.:
 *
 *   transition-duration: calc(var(--pk-reduce-motion) * 0.3s);
 *
 * reduceMotion: true  -> writes '0' -> that calc() collapses to 0s
 * reduceMotion: false -> writes '1' -> the developer's own 0.3s applies
 *
 * This keeps PrefKeeper from having to guess or override any specific
 * duration value — it only ever supplies the multiplier.
 */
export function applyMotion(motionState, target = document.documentElement) {
  target.style.setProperty(
    MOTION_TOKENS.reduceMotion,
    motionState.reduceMotion ? "0" : "1",
  );
}

/**
 * Writes the focus outline color/width tokens.
 */
export function applyFocus(focusState, target = document.documentElement) {
  target.style.setProperty(
    FOCUS_TOKENS.outlineColor,
    hslString(focusState.outlineColor),
  );
  target.style.setProperty(
    FOCUS_TOKENS.outlineWidth,
    `${focusState.outlineWidth}px`,
  );
}

/**
 * Applies a full state object (the shape returned by
 * tokens.getDefaultState(), or whatever storage.get() returns) in one
 * call. This is what Save/Close/View-toggle logic in panel.js will
 * actually call — the four functions above exist individually mainly
 * so panel.js can also update just one category at a time (e.g. when
 * only the Colors tab's sliders moved).
 */
export function applyState(state, target = document.documentElement) {
  applyColors(state.colors, target);
  applyText(state.text, target);
  applyMotion(state.motion, target);
  applyFocus(state.focus, target);
}

/**
 * Removes every --pk-* custom property this module ever sets, letting
 * the host page fall back to its own original design entirely. This
 * is the mechanism behind "Restore Site Default" (called against the
 * real document.documentElement) — NOT behind "View Site Default,"
 * which is a display-only toggle inside panel.js's own preview and
 * never touches the real page or calls into engine.js at all.
 */
export function clearState(target = document.documentElement) {
  [
    ...Object.values(COLOR_TOKENS),
    ...Object.values(TEXT_TOKENS),
    ...Object.values(MOTION_TOKENS),
    ...Object.values(FOCUS_TOKENS),
  ].forEach((cssVar) => target.style.removeProperty(cssVar));
}
