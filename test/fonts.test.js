// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest";

/**
 * jsdom gives us a real DOM to check structure against (a real
 * <style> tag really gets appended, with real text content) but it
 * does NOT do actual CSS layout or font rendering -- these tests
 * confirm the CORRECT RULES get injected, not that the font visually
 * renders. That's a browser/manual-testing concern, not a unit-test one.
 *
 * fonts.js tracks whether it has already injected its styles via a
 * module-level `injected` flag (correct for real usage -- avoids
 * duplicate <style> tags if initPrefKeeper() runs more than once on
 * a page). That same behavior means the module needs to be freshly
 * re-imported for each test here, or the flag would carry over from
 * a previous test and calls would silently no-op.
 */

async function freshFontsModule() {
  vi.resetModules();
  return import("../src/ui/fonts.js");
}

beforeEach(() => {
  document.head
    .querySelectorAll("[data-prefkeeper-fonts]")
    .forEach((el) => el.remove());
});

describe("FONT_FAMILY", () => {
  it("matches the actual bundled font (Atkinson Hyperlegible Next, not the older Atkinson Hyperlegible)", async () => {
    const { FONT_FAMILY } = await freshFontsModule();
    expect(FONT_FAMILY).toBe("Atkinson Hyperlegible Next");
  });
});

describe("injectFontFaces", () => {
  it("appends a style tag with the expected marker attribute", async () => {
    const { injectFontFaces } = await freshFontsModule();
    injectFontFaces();
    const tag = document.head.querySelector("[data-prefkeeper-fonts]");
    expect(tag).not.toBeNull();
    expect(tag.tagName).toBe("STYLE");
  });

  it("injects all 14 weight/style combinations", async () => {
    const { injectFontFaces } = await freshFontsModule();
    injectFontFaces();
    const tag = document.head.querySelector("[data-prefkeeper-fonts]");
    const count = (tag.textContent.match(/@font-face/g) || []).length;
    expect(count).toBe(14);
  });

  it("includes the full weight range, both normal and italic", async () => {
    const { injectFontFaces } = await freshFontsModule();
    injectFontFaces();
    const css = document.head.querySelector(
      "[data-prefkeeper-fonts]",
    ).textContent;
    [200, 300, 400, 500, 600, 700, 800].forEach((weight) => {
      expect(css).toContain(`font-weight: ${weight};`);
    });
    expect(css).toContain("font-style: normal;");
    expect(css).toContain("font-style: italic;");
  });

  it("references the correct family name in every rule", async () => {
    const { injectFontFaces } = await freshFontsModule();
    injectFontFaces();
    const css = document.head.querySelector(
      "[data-prefkeeper-fonts]",
    ).textContent;
    const occurrences = (css.match(/Atkinson Hyperlegible Next/g) || []).length;
    // 14 rules, each naming the family once
    expect(occurrences).toBe(14);
  });

  it("is idempotent -- calling it twice in the same module instance does not inject a second style tag", async () => {
    const { injectFontFaces } = await freshFontsModule();
    injectFontFaces();
    injectFontFaces();
    const tags = document.head.querySelectorAll("[data-prefkeeper-fonts]");
    expect(tags.length).toBe(1);
  });
});
