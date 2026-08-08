// test/contrast.js

import { describe, it, expect } from 'vitest';
import {
  hslToHex,
  luminance,
  contrastRatio,
  rateContrast,
  rateTokenContrast
} from '../src/core/contrast.js';

describe('hslToHex', () => {
  it('converts pure white correctly', () => {
    expect(hslToHex({ hue: 0, sat: 0, light: 100 })).toBe('#ffffff');
  });

  it('converts pure black correctly', () => {
    expect(hslToHex({ hue: 0, sat: 0, light: 0 })).toBe('#000000');
  });
});

describe('luminance', () => {
  it('white has luminance of 1', () => {
    expect(luminance('#ffffff')).toBeCloseTo(1, 5);
  });

  it('black has luminance of 0', () => {
    expect(luminance('#000000')).toBeCloseTo(0, 5);
  });
});

describe('contrastRatio', () => {
  it('black on white is the maximum ratio, 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1);
  });

  it('a color against itself is the minimum ratio, 1:1', () => {
    expect(contrastRatio('#3366cc', '#3366cc')).toBeCloseTo(1, 5);
  });

  it('is symmetric regardless of argument order', () => {
    const a = contrastRatio('#000000', '#ffffff');
    const b = contrastRatio('#ffffff', '#000000');
    expect(a).toBeCloseTo(b, 5);
  });
});

describe('rateContrast', () => {
  it('rates black on white as excellent', () => {
    expect(rateContrast('#000000', '#ffffff').level).toBe('excellent');
  });

  it('rates a low-contrast pair as difficult', () => {
    expect(rateContrast('#999999', '#aaaaaa').level).toBe('difficult');
  });

  it('rates a mid-range pair as acceptable', () => {
    // Chosen to land in the 3–4.5 WCAG AA-large band
    const result = rateContrast('#8a8a8a', '#ffffff');
    expect(result.ratio).toBeGreaterThanOrEqual(3);
    expect(result.ratio).toBeLessThan(4.5);
    expect(result.level).toBe('acceptable');
  });
});

describe('rateTokenContrast', () => {
  it('matches rateContrast when given equivalent hex colors', () => {
    const white = { hue: 0, sat: 0, light: 100 };
    const black = { hue: 0, sat: 0, light: 0 };
    const fromTokens = rateTokenContrast(black, white);
    const fromHex = rateContrast('#000000', '#ffffff');
    expect(fromTokens.level).toBe(fromHex.level);
    expect(fromTokens.ratio).toBeCloseTo(fromHex.ratio, 5);
  });
});
