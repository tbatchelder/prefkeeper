import { describe, it, expect } from "vitest";
import {
  CONTRAST_PRESETS,
  COLOR_VISION_PRESETS,
} from "../src/presets/index.js";
import { CONTRAST_PRESETS as DIRECT_CONTRAST } from "../src/presets/contrast.js";
import { COLOR_VISION_PRESETS as DIRECT_COLOR_VISION } from "../src/presets/colorblind.js";

/**
 * Same reasoning as entry.test.js: this barrel has no logic of its
 * own, but confirms the re-export chain from contrast.js/colorblind.js
 * stays intact -- and that panel.js (which imports from these two
 * files directly, not through this barrel) and the barrel are never
 * silently pointing at different data.
 */
describe("presets barrel (src/presets/index.js)", () => {
  it("re-exports CONTRAST_PRESETS matching the direct import", () => {
    expect(CONTRAST_PRESETS).toBe(DIRECT_CONTRAST);
    expect(Object.keys(CONTRAST_PRESETS)).toContain("dark");
  });

  it("re-exports COLOR_VISION_PRESETS matching the direct import", () => {
    expect(COLOR_VISION_PRESETS).toBe(DIRECT_COLOR_VISION);
    expect(Object.keys(COLOR_VISION_PRESETS)).toContain("deut");
  });

  it("every preset entry has a label and values, the shape panel.js depends on", () => {
    [CONTRAST_PRESETS, COLOR_VISION_PRESETS].forEach((presetSet) => {
      Object.values(presetSet).forEach((preset) => {
        expect(preset.label).toBeTypeOf("string");
        expect(preset.values).toBeTypeOf("object");
      });
    });
  });
});
