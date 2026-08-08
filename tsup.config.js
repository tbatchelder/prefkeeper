import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.js'],
  format: ['esm', 'cjs', 'iife'],
  globalName: 'PrefKeeper',
  dts: true,
  clean: true
  // NOTE: previously had a `.woff2: 'file'` loader entry here, based on
  // an incorrect assumption that esbuild auto-detects and copies
  // `new URL(path, import.meta.url)` asset references. It doesn't —
  // confirmed by actually running the build and by an isolated esbuild
  // test. Font files are handled instead by scripts/copy-assets.mjs
  // (a plain file copy) plus fonts.js resolving its own URL at
  // runtime — no esbuild involvement needed. See fonts.js for the
  // full explanation.
});
