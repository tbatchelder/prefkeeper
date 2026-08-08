// scripts/copy-assets.mjs

/**
 * Copies src/assets/ to a top-level assets/ folder, a SIBLING of
 * dist/, not nested inside it. This matters: fonts.js's relative path
 * ('../assets/fonts/X.woff2') is written as "one level up from
 * wherever this bundled file ends up." Both src/index.js and
 * dist/index.js sit one level below the package root, so the same
 * relative path correctly reaches a top-level assets/ folder in
 * either case — verified against Node's URL class, matching the
 * WHATWG spec browsers implement.
 *
 * Runs automatically after `npm run build` via npm's postbuild
 * lifecycle hook (no separate script needs to call this directly).
 */
import { cpSync, existsSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, '..', 'src', 'assets');
const destDir = join(__dirname, '..', 'assets');

if (!existsSync(srcDir)) {
  console.warn(`copy-assets: no src/assets directory found at ${srcDir}, skipping.`);
  process.exit(0);
}

if (existsSync(destDir)) {
  rmSync(destDir, { recursive: true, force: true });
}

cpSync(srcDir, destDir, { recursive: true });
console.log(`copy-assets: copied ${srcDir} -> ${destDir}`);
