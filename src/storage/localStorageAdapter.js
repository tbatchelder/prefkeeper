/**
 * localStorageAdapter.js
 *
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
const SETTINGS_KEY = 'prefkeeper-settings';

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

// Settings are stored under a SEPARATE key from preferences —
// autoLoadPaused is app config, not user preference data. Per the
// earlier extension-architecture decision, this is also where a
// future extension adapter would own the real decision (the page
// only ever asks; it doesn't unilaterally decide) — for now, without
// an extension, this localStorage key is the only source of truth.
export async function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
