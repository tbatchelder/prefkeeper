import { describe, it, expect, beforeEach } from 'vitest';
import {
  get,
  set,
  clear,
  exportState,
  importState,
  isValidState,
  getSettings,
  setSettings
} from '../src/storage/index.js';
import { getDefaultState } from '../src/core/tokens.js';

/**
 * Vitest's default environment is plain Node, which has no
 * localStorage global. Rather than pull in jsdom as a dependency just
 * for this one file, a tiny in-memory stub is enough to exercise
 * localStorageAdapter.js's real code path (getItem/setItem/removeItem)
 * exactly as the browser would call it.
 */
function installFakeLocalStorage() {
  const store = {};
  globalThis.localStorage = {
    getItem: key => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: key => {
      delete store[key];
    }
  };
}

beforeEach(() => {
  installFakeLocalStorage();
});

describe('isValidState', () => {
  it('accepts a full default state', () => {
    expect(isValidState(getDefaultState())).toBe(true);
  });

  it('rejects null/undefined', () => {
    expect(isValidState(null)).toBe(false);
    expect(isValidState(undefined)).toBe(false);
  });

  it('rejects a state missing a required top-level key', () => {
    const state = getDefaultState();
    delete state.motion;
    expect(isValidState(state)).toBe(false);
  });

  it('rejects a color token missing a numeric field', () => {
    const state = getDefaultState();
    delete state.colors.text.light;
    expect(isValidState(state)).toBe(false);
  });

  it('rejects an unrecognized fontFamily value', () => {
    const state = getDefaultState();
    state.text.fontFamily = 'comic-sans-injection-attempt';
    expect(isValidState(state)).toBe(false);
  });

  it('rejects a non-boolean reduceMotion', () => {
    const state = getDefaultState();
    state.motion.reduceMotion = 'yes';
    expect(isValidState(state)).toBe(false);
  });

  it('rejects a malformed focus outline token', () => {
    const state = getDefaultState();
    state.focus.outlineWidth = '3px'; // should be a number, not a string
    expect(isValidState(state)).toBe(false);
  });

  it('rejects a completely unrelated object', () => {
    expect(isValidState({ hello: 'world' })).toBe(false);
  });
});

describe('get', () => {
  it('returns default state when nothing has been saved', async () => {
    const state = await get();
    expect(state).toEqual(getDefaultState());
  });

  it('returns default state when saved data is corrupted JSON', async () => {
    localStorage.setItem('prefkeeper-preferences', '{not valid json');
    const state = await get();
    expect(state).toEqual(getDefaultState());
  });

  it('returns default state when saved data is valid JSON but wrong shape', async () => {
    localStorage.setItem('prefkeeper-preferences', JSON.stringify({ hello: 'world' }));
    const state = await get();
    expect(state).toEqual(getDefaultState());
  });

  it('returns the actual saved state when it is valid', async () => {
    const custom = getDefaultState();
    custom.colors.background.hue = 240;
    localStorage.setItem('prefkeeper-preferences', JSON.stringify(custom));
    const state = await get();
    expect(state.colors.background.hue).toBe(240);
  });
});

describe('set', () => {
  it('persists a valid state so a later get() returns it', async () => {
    const custom = getDefaultState();
    custom.text.fontFamily = 'atkinson';
    await set(custom);
    const state = await get();
    expect(state.text.fontFamily).toBe('atkinson');
  });

  it('throws rather than saving an invalid state', async () => {
    await expect(set({ hello: 'world' })).rejects.toThrow();
  });
});

describe('clear', () => {
  it('removes saved data so get() falls back to defaults again', async () => {
    await set(getDefaultState());
    await clear();
    const state = await get();
    expect(state).toEqual(getDefaultState());
    expect(localStorage.getItem('prefkeeper-preferences')).toBeNull();
  });
});

describe('exportState / importState', () => {
  it('round-trips a state through export then import unchanged', () => {
    const original = getDefaultState();
    original.colors.link.hue = 45;
    const json = exportState(original);
    const imported = importState(json);
    expect(imported).toEqual(original);
  });

  it('importState throws on malformed JSON', () => {
    expect(() => importState('{not valid json')).toThrow(/valid JSON/);
  });

  it('importState throws on well-formed JSON that is the wrong shape', () => {
    expect(() => importState(JSON.stringify({ hello: 'world' }))).toThrow(/expected PrefKeeper/);
  });

  it('importState does not itself persist anything to storage', async () => {
    const json = exportState(getDefaultState());
    importState(json);
    expect(localStorage.getItem('prefkeeper-preferences')).toBeNull();
  });
});

describe('getSettings / setSettings', () => {
  it('returns defaults (autoLoadPaused: false) when nothing has been saved', async () => {
    const settings = await getSettings();
    expect(settings).toEqual({ autoLoadPaused: false });
  });

  it('returns defaults when saved settings data is corrupted JSON', async () => {
    localStorage.setItem('prefkeeper-settings', '{not valid json');
    const settings = await getSettings();
    expect(settings).toEqual({ autoLoadPaused: false });
  });

  it('persists a valid settings value so a later getSettings() returns it', async () => {
    await setSettings({ autoLoadPaused: true });
    const settings = await getSettings();
    expect(settings.autoLoadPaused).toBe(true);
  });

  it('throws rather than saving an invalid settings shape', async () => {
    await expect(setSettings({ autoLoadPaused: 'yes' })).rejects.toThrow();
    await expect(setSettings(null)).rejects.toThrow();
  });
});
