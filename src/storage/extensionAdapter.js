/**
 * extensionAdapter.js
 *
 * STUB. Not implemented yet — this is the seam for the future browser
 * extension work. Once built, this will read/write via
 * chrome.storage.local instead of localStorage, matching the exact
 * same { get, set, clear } shape as localStorageAdapter.js, so
 * storage/index.js can swap between the two without any changes
 * to itself, engine.js, or panel.js.
 *
 * Deliberately throws for now rather than silently doing nothing —
 * a loud failure here is much easier to debug than a page that quietly
 * never saves anything.
 */

export async function get() {
  throw new Error('extensionAdapter is not implemented yet.');
}

export async function set() {
  throw new Error('extensionAdapter is not implemented yet.');
}

export async function clear() {
  throw new Error('extensionAdapter is not implemented yet.');
}

// Settings (autoLoadPaused) are exactly the case the earlier
// extension-design decision was about: the page should never
// unilaterally decide this, only ask -- so once real, this is where
// that request/response actually gets honored via the extension's
// own chrome.storage, not the page's.
export async function getSettings() {
  throw new Error('extensionAdapter is not implemented yet.');
}

export async function setSettings() {
  throw new Error('extensionAdapter is not implemented yet.');
}
