// src/utils/dom.js

// small DOM helpers, debounce, etc.

/**
 * dom.js
 *
 * Small, generic DOM helpers -- deliberately NOT a home for actual UI
 * screens. panel.js's tab templates and the hamburger menu's
 * Import/Export/Help/Settings screens belong in ui/components/ (one
 * file per screen); this file is only for genuinely reusable,
 * content-agnostic helpers like the one below.
 */

/**
 * Parses an HTML string into a real, detached DOM element.
 * There's no page of our own to put static markup in -- this is what
 * lets panel.js build its UI at runtime from a template string, then
 * insert the result into whatever host page calls initPrefKeeper().
 */
export function el(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}
