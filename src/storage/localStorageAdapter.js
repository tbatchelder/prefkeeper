// src/storage/localStorageAdaper.js

// default adapter, used today

/**
 * The only adapter that exists today. Wraps the browser's localStorage
 * under a single fixed key. Every method is declared async even though
 * localStorage itself is synchronous — this matches the shape
 * extensionAdapter.js will need later (chrome.storage.local is
 * genuinely async), so storage/index.js never has to change based on
 * which adapter is active.
 *
 * Adapters are intentionally "dumb": they only know how to get/set/clear
 * a raw state object. Validation and JSON string conversion (export/
 * import) are NOT an adapter's job — that logic lives once in
 * storage/index.js and applies the same way regardless of which
 * adapter is active.
 */

const STORAGE_KEY = 'prefkeeper-preferences';

export async function get() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    // Corrupted/unparseable data is treated the same as "nothing saved yet" —
    // storage/index.js's own validation is what actually decides whether
    // to fall back to defaults, this just guards against a JSON.parse throw.
    return null;
  }
}

export async function set(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export async function clear() {
  localStorage.removeItem(STORAGE_KEY);
}
