// src/presets/contrast.js

// high/low contrast

/**
 * Display-mode presets: High/Low Contrast, Dark/Light Mode. Each
 * entry carries its own `label` (shown in the dropdown) alongside
 * `values` (the actual color tokens applied) -- this is what lets
 * panel.js generate the <option> elements from this data at runtime,
 * instead of the dropdown text being hardcoded HTML disconnected from
 * the preset keys. It's also what makes custom presets (see the
 * `customPresets` option on initPrefKeeper) show up as real,
 * selectable options rather than only being usable if you already
 * know the key.
 *
 * Keyed by the same token names as core/tokens.js (background, text,
 * primary, onPrimary, link) so they can be handed straight to
 * core/engine.js's applyColors().
 */
export const CONTRAST_PRESETS = {
  high: {
    label: "High contrast",
    values: {
      background: { hue: 0, sat: 0, light: 100 },
      text: { hue: 0, sat: 0, light: 0 },
      primary: { hue: 0, sat: 0, light: 0 },
      onPrimary: { hue: 0, sat: 0, light: 100 },
      link: { hue: 240, sat: 100, light: 45 },
    },
  },
  low: {
    label: "Low contrast",
    values: {
      background: { hue: 0, sat: 0, light: 92 },
      text: { hue: 0, sat: 0, light: 42 },
      primary: { hue: 0, sat: 0, light: 62 },
      onPrimary: { hue: 0, sat: 0, light: 100 },
      link: { hue: 0, sat: 0, light: 48 },
    },
  },
  dark: {
    label: "Dark mode",
    values: {
      background: { hue: 0, sat: 0, light: 12 },
      text: { hue: 0, sat: 0, light: 94 },
      primary: { hue: 210, sat: 75, light: 55 },
      onPrimary: { hue: 210, sat: 80, light: 10 },
      link: { hue: 45, sat: 90, light: 65 },
    },
  },
  light: {
    label: "Light mode",
    values: {
      background: { hue: 0, sat: 0, light: 100 },
      text: { hue: 0, sat: 0, light: 13 },
      primary: { hue: 210, sat: 80, light: 50 },
      onPrimary: { hue: 0, sat: 0, light: 100 },
      link: { hue: 210, sat: 80, light: 40 },
    },
  },
};
