// test/engine.test.js

import { describe, it, expect, beforeEach } from "vitest";
import {
  applyColors,
  applyText,
  applyMotion,
  applyFocus,
  applyState,
  clearState,
} from "../src/core/engine.js";
import { getDefaultState } from "../src/core/tokens.js";

/**
 * A fake target standing in for document.documentElement (or any
 * element engine.js writes to). Records every setProperty/removeProperty
 * call in a plain object so tests can assert on it directly — no real
 * DOM or browser needed.
 */
function createFakeTarget() {
  const props = {};
  return {
    props,
    style: {
      setProperty: (key, value) => {
        props[key] = value;
      },
      removeProperty: (key) => {
        delete props[key];
      },
    },
  };
}

describe("applyColors", () => {
  it("writes each color token as an hsl() string", () => {
    const target = createFakeTarget();
    applyColors({ background: { hue: 0, sat: 0, light: 100 } }, target);
    expect(target.props["--pk-background"]).toBe("hsl(0, 0%, 100%)");
  });

  it("ignores tokens not present in the given state", () => {
    const target = createFakeTarget();
    applyColors({ background: { hue: 0, sat: 0, light: 100 } }, target);
    expect(target.props["--pk-text"]).toBeUndefined();
  });
});

describe("applyText", () => {
  it("writes font size, line height, letter spacing, word spacing", () => {
    const target = createFakeTarget();
    applyText(
      {
        fontSize: 120,
        lineHeight: 1.8,
        letterSpacing: 2,
        wordSpacing: 4,
        fontFamily: "site",
      },
      target,
    );
    expect(target.props["--pk-font-size"]).toBe("120%");
    expect(target.props["--pk-line-height"]).toBe("1.8");
    expect(target.props["--pk-letter-spacing"]).toBe("2px");
    expect(target.props["--pk-word-spacing"]).toBe("4px");
  });

  it('removes the font-family variable when fontFamily is "site"', () => {
    const target = createFakeTarget();
    target.style.setProperty(
      "--pk-font-family",
      "'Atkinson Hyperlegible', sans-serif",
    );
    applyText(
      {
        fontSize: 100,
        lineHeight: 1.5,
        letterSpacing: 0,
        wordSpacing: 0,
        fontFamily: "site",
      },
      target,
    );
    expect(target.props["--pk-font-family"]).toBeUndefined();
  });

  it('sets the Atkinson Hyperlegible stack when fontFamily is "atkinson"', () => {
    const target = createFakeTarget();
    applyText(
      {
        fontSize: 100,
        lineHeight: 1.5,
        letterSpacing: 0,
        wordSpacing: 0,
        fontFamily: "atkinson",
      },
      target,
    );
    expect(target.props["--pk-font-family"]).toContain("Atkinson Hyperlegible");
  });
});

describe("applyMotion", () => {
  it("writes 0 when reduceMotion is true", () => {
    const target = createFakeTarget();
    applyMotion({ reduceMotion: true }, target);
    expect(target.props["--pk-reduce-motion"]).toBe("0");
  });

  it("writes 1 when reduceMotion is false", () => {
    const target = createFakeTarget();
    applyMotion({ reduceMotion: false }, target);
    expect(target.props["--pk-reduce-motion"]).toBe("1");
  });
});

describe("applyFocus", () => {
  it("writes outline color as hsl() and width in px", () => {
    const target = createFakeTarget();
    applyFocus(
      { outlineColor: { hue: 200, sat: 100, light: 50 }, outlineWidth: 3 },
      target,
    );
    expect(target.props["--pk-focus-outline-color"]).toBe(
      "hsl(200, 100%, 50%)",
    );
    expect(target.props["--pk-focus-outline-width"]).toBe("3px");
  });
});

describe("applyState", () => {
  it("applies all four categories from the default state in one call", () => {
    const target = createFakeTarget();
    applyState(getDefaultState(), target);
    expect(target.props["--pk-background"]).toBeDefined();
    expect(target.props["--pk-font-size"]).toBeDefined();
    expect(target.props["--pk-reduce-motion"]).toBeDefined();
    expect(target.props["--pk-focus-outline-width"]).toBeDefined();
  });
});

describe("clearState", () => {
  it("removes every --pk-* property this module can set", () => {
    const target = createFakeTarget();
    applyState(getDefaultState(), target);
    expect(Object.keys(target.props).length).toBeGreaterThan(0);
    clearState(target);
    expect(Object.keys(target.props).length).toBe(0);
  });
});
