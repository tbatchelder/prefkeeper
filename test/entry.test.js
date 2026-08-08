import { describe, it, expect } from 'vitest';
import * as PrefKeeper from '../src/index.js';

/**
 * src/index.js is a pure re-export barrel -- there's no logic here to
 * exercise, but a real failure mode exists: a rename or a typo'd path
 * inside it (or in what it re-exports from) would silently break the
 * public API with nothing else in the suite catching it, since every
 * other test imports the internal files directly, not this entry
 * point. These confirm the actual published surface is intact.
 */
describe('public entry point (src/index.js)', () => {
  it('exports initPrefKeeper as a function', () => {
    expect(PrefKeeper.initPrefKeeper).toBeTypeOf('function');
  });

  it('exports storage as a namespace with the expected methods', () => {
    expect(PrefKeeper.storage).toBeTypeOf('object');
    expect(PrefKeeper.storage.get).toBeTypeOf('function');
    expect(PrefKeeper.storage.set).toBeTypeOf('function');
    expect(PrefKeeper.storage.clear).toBeTypeOf('function');
    expect(PrefKeeper.storage.exportState).toBeTypeOf('function');
    expect(PrefKeeper.storage.importState).toBeTypeOf('function');
  });
});
