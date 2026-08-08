// src/presets/colorblind.js

// protanopia/deuteranopia/tritanopia/achromatopsia starting points

/**
 * Color-vision presets. Same label+values shape as contrast.js -- see
 * that file's header comment for why. Labels use plain language first
 * (most people don't recall the clinical term for their own type),
 * ordered roughly by real-world prevalence.
 */
export const COLOR_VISION_PRESETS = {
  deut: {
    label: 'Red-green, most common (Deuteranopia)',
    values: {
      primary: { hue: 210, sat: 85, light: 45 },
      onPrimary: { hue: 0, sat: 0, light: 100 },
      link: { hue: 35, sat: 90, light: 45 }
    }
  },
  prot: {
    label: 'Red-green, less common (Protanopia)',
    values: {
      primary: { hue: 205, sat: 85, light: 40 },
      onPrimary: { hue: 0, sat: 0, light: 100 },
      link: { hue: 40, sat: 95, light: 45 }
    }
  },
  trit: {
    label: 'Blue-yellow (Tritanopia)',
    values: {
      primary: { hue: 340, sat: 70, light: 45 },
      onPrimary: { hue: 0, sat: 0, light: 100 },
      link: { hue: 175, sat: 60, light: 35 }
    }
  },
  achroma: {
    label: 'No color / grayscale (Achromatopsia)',
    values: {
      background: { hue: 0, sat: 0, light: 100 },
      text: { hue: 0, sat: 0, light: 0 },
      primary: { hue: 0, sat: 0, light: 25 },
      onPrimary: { hue: 0, sat: 0, light: 100 },
      link: { hue: 0, sat: 0, light: 15 }
    }
  }
};
