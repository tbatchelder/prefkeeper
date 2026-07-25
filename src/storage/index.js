// src/storage/index.js

// storage interface: get(), set(), export(), import())

/**
 * The single public storage API the rest of PrefKeeper talks to.
 * Nothing outside src/storage/ should import an adapter directly —
 * everything goes through get()/set()/clear()/exportState()/importState()
 * here instead.
 *
 * Why validation and export/import live HERE, not in each adapter:
 * these concerns (what a valid state object looks like, how to turn
 * it into/out of a JSON string) are identical no matter where the
 * data is actually stored. Duplicating them into every adapter would
 * mean re-solving the same problem twice as extensionAdapter.js
 * becomes real later. Adapters only ever handle the raw get/set/clear
 * of a state object — everything else is adapter-agnostic and lives
 * once, here.
 */

import { getDefaultState } from "../core/tokens.js";
import * as localStorageAdapter from "./localStorageAdapter.js";

// Hardcoded for now — the only adapter that exists. Once extensionAdapter.js
// is real, this becomes a small detection step (e.g. "is this running
// inside a page with a PrefKeeper marker AND does an extension respond?"),
// but everything below this line stays unchanged either way.
const activeAdapter = localStorageAdapter;

/**
 * Structural validation for a preferences state object. This is the
 * last line of defense against malformed/malicious data — anything
 * from a corrupted localStorage entry to a hand-crafted pasted-in
 * import. Deliberately strict: unknown or wrong-typed fields fail
 * closed rather than being coerced or ignored.
 *
 * NOTE: this checks *shape*, not *safety of use* — it doesn't (for
 * example) clamp hue to 0–360. The import UI (built later) will layer
 * additional sanitization on top of this before ever calling
 * importState(); this function is the shared floor everyone gets,
 * not the whole security story.
 */
export function isValidState(state) {
  if (!state || typeof state !== "object") return false;

  const isColorToken = (c) =>
    c &&
    typeof c === "object" &&
    typeof c.hue === "number" &&
    typeof c.sat === "number" &&
    typeof c.light === "number";

  const { colors, text, motion, focus } = state;

  if (!colors || typeof colors !== "object") return false;

  const colorTargets = [
    "background",
    "text",
    "primary",
    "onPrimary",
    "link",
    "focus",
  ];

  if (!colorTargets.every((target) => isColorToken(colors[target])))
    return false;

  if (
    !text ||
    typeof text.fontSize !== "number" ||
    typeof text.lineHeight !== "number" ||
    typeof text.letterSpacing !== "number" ||
    typeof text.wordSpacing !== "number" ||
    !["site", "atkinson"].includes(text.fontFamily)
  ) {
    return false;
  }

  if (!motion || typeof motion.reduceMotion !== "boolean") return false;

  if (
    !focus ||
    !isColorToken(focus.outlineColor) ||
    typeof focus.outlineWidth !== "number"
  ) {
    return false;
  }

  return true;
}

/**
 * Returns the saved state, or a fresh default state if nothing is
 * saved yet OR if what's saved fails validation (corrupted data is
 * treated the same as "nothing saved" rather than crashing the app).
 */
export async function get() {
  const saved = await activeAdapter.get();
  if (saved && isValidState(saved)) return saved;
  return getDefaultState();
}

/**
 * Persists a state object. Callers are expected to only ever pass a
 * state that already came from getDefaultState()/get()/importState(),
 * but this still validates before writing, since "what could possibly
 * call this incorrectly" is exactly the kind of assumption that stops
 * being true once an extension or an import flow exists.
 */
export async function set(state) {
  if (!isValidState(state)) {
    throw new Error(
      "Refusing to save: state does not match the expected preferences shape.",
    );
  }
  await activeAdapter.set(state);
}

export async function clear() {
  await activeAdapter.clear();
}

/**
 * Turns a state object into a JSON string for the Export panel to
 * display/copy. Pure — does not touch storage.
 */
export function exportState(state) {
  return JSON.stringify(state, null, 2);
}

/**
 * Parses and validates a pasted-in JSON string for the Import panel.
 * Pure — does NOT call set() itself. The caller (panel.js) decides
 * when/whether to actually persist the result, same as any other
 * edit — importing loads it into the working state and marks it
 * dirty, it doesn't silently save it.
 *
 * Throws a descriptive Error on anything invalid, rather than
 * returning null/undefined, so the Import panel can show the user
 * an actual reason rather than a silent failure.
 */
export function importState(jsonString) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("That doesn't look like valid JSON.");
  }

  if (!isValidState(parsed)) {
    throw new Error(
      "That JSON doesn't match the expected PrefKeeper preferences format.",
    );
  }

  return parsed;
}
