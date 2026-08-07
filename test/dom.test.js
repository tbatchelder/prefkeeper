// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { el } from "../src/utils/dom.js";

describe("el", () => {
  it("parses an HTML string into a real detached element", () => {
    const node = el('<div class="test">Hello</div>');
    expect(node).toBeInstanceOf(HTMLElement);
    expect(node.className).toBe("test");
    expect(node.textContent).toBe("Hello");
    expect(node.isConnected).toBe(false); // detached, not yet inserted anywhere
  });

  it("returns only the first top-level element if given multiple siblings", () => {
    const node = el("<p>First</p><p>Second</p>");
    expect(node.textContent).toBe("First");
  });

  it("trims leading/trailing whitespace before parsing", () => {
    const node = el("\n   <span>trimmed</span>   \n");
    expect(node.tagName).toBe("SPAN");
  });

  it("preserves nested structure", () => {
    const node = el("<div><ul><li>one</li><li>two</li></ul></div>");
    expect(node.querySelectorAll("li").length).toBe(2);
  });
});
