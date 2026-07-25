// test/tokens.test.js

import { describe, it, expect } from "vitest";
import {
  colorDefaults,
  textDefaults,
  motionDefaults,
  focusDefaults,
  getDefaultState,
} from "../src/core/tokens.js";

describe("tokens", () => {
  it("colorDefaults has all five expected targets", () => {
    expect(Object.keys(colorDefaults).sort()).toEqual(
      ["background", "text", "primary", "onPrimary", "link", "focus"].sort(),
    );
  });

  it("getDefaultState returns the full nested shape", () => {
    const state = getDefaultState();
    expect(state).toHaveProperty("colors");
    expect(state).toHaveProperty("text");
    expect(state).toHaveProperty("motion");
    expect(state).toHaveProperty("focus");
  });

  it("getDefaultState returns a deep copy, not a shared reference", () => {
    const stateA = getDefaultState();
    stateA.colors.text.hue = 999;
    const stateB = getDefaultState();
    expect(stateB.colors.text.hue).toBe(colorDefaults.text.hue);
    expect(stateB.colors.text.hue).not.toBe(999);
  });

  it("text/motion/focus defaults match expected starting values", () => {
    expect(textDefaults.fontFamily).toBe("site");
    expect(motionDefaults.reduceMotion).toBe(false);
    expect(focusDefaults.outlineWidth).toBe(3);
  });
});
