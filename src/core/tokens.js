// src/core/tokens.js

// the canonical --pk-* variable list + defaults

/**
 * IMPORTANT: this file defines the FIXED SET of variable names PrefKeeper
 * ever writes to. It is never duplicated per theme/preset. Light mode, dark
 * mode, high contrast, each color-vision preset, and every manual slider
 * adjustment all write different VALUES into this same set — they never
 * introduce new variable names. A developer's CSS references a --pk-*
 * variable exactly once, ever, regardless of which preset or user
 * adjustment is currently active.
 *
 * Prefix: --pk- (PrefKeeper), not --a11y- — a11y is a generic category
 * name other tools/standards could plausibly also claim. --pk- is unique
 * to this project.
 */

// ---- Color tokens ----
// Each color token is stored internally as { hue, sat, light } (HSL parts)
// so sliders can read/write them directly. engine.js converts these to
// hsl(...) strings when writing the actual CSS custom property.
export const COLOR_TOKENS = {
  background: "--pk-background",
  text: "--pk-text",
  primary: "--pk-primary", // button background
  onPrimary: "--pk-on-primary", // button text — independent contrast pair from body text
  link: "--pk-link",
  focus: "--pk-focus",
};

export const colorDefaults = {
  background: { hue: 0, sat: 0, light: 100 },
  text: { hue: 0, sat: 0, light: 13 },
  primary: { hue: 210, sat: 80, light: 50 },
  onPrimary: { hue: 0, sat: 0, light: 100 },
  link: { hue: 210, sat: 80, light: 40 },
  focus: { hue: 200, sat: 100, light: 50 },
};

// ---- Text tokens ----
export const TEXT_TOKENS = {
  fontSize: "--pk-font-size", // percentage, e.g. "100%"
  lineHeight: "--pk-line-height", // unitless ratio, e.g. "1.5"
  letterSpacing: "--pk-letter-spacing", // px
  wordSpacing: "--pk-word-spacing", // px
  fontFamily: "--pk-font-family", // 'site' | 'atkinson'
};

export const textDefaults = {
  fontSize: 100,
  lineHeight: 1.5,
  letterSpacing: 0,
  wordSpacing: 0,
  fontFamily: "site",
};

// ---- Motion tokens ----
export const MOTION_TOKENS = {
  reduceMotion: "--pk-reduce-motion", // '0' | '1' — CSS reads this to gate transitions/animations
};

export const motionDefaults = {
  reduceMotion: false,
};

// ---- Focus tokens ----
export const FOCUS_TOKENS = {
  outlineColor: "--pk-focus-outline-color", // reuses the same {hue,sat,light} shape as color tokens
  outlineWidth: "--pk-focus-outline-width", // px
};

export const focusDefaults = {
  outlineColor: { hue: 200, sat: 100, light: 50 },
  outlineWidth: 3,
};

// ---- Convenience: full default state, matching the shape engine.js expects ----
export function getDefaultState() {
  return {
    colors: JSON.parse(JSON.stringify(colorDefaults)),
    text: JSON.parse(JSON.stringify(textDefaults)),
    motion: JSON.parse(JSON.stringify(motionDefaults)),
    focus: JSON.parse(JSON.stringify(focusDefaults)),
  };
}
