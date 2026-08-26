import { defineConfig, coverageConfigDefaults } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // The inline `// @vitest-environment jsdom` comment at the top of
    // fonts.test.js and panel.test.js works correctly via the CLI
    // (`npm test`), but isn't always honored the same way by every
    // tool that runs Vitest -- notably, some editor test-runner
    // integrations resolve environment purely from a static config
    // file and don't fully respect per-file inline directives. This
    // mapping states the same thing explicitly and statically, so any
    // tool reading this config (VS Code's Vitest extension included)
    // gets the correct environment regardless of how it invokes tests.
    environmentMatchGlobs: [
      ['test/fonts.test.js', 'jsdom'],
      ['test/panel.test.js', 'jsdom'],
      ['test/dom.test.js', 'jsdom']
    ],
    coverage: {
      // Only copy-assets.mjs is excluded, NOT the whole scripts/**
      // folder. It's a real build script (postbuild hook, runs its
      // real logic on import, not exported for isolated testing) --
      // already manually verified across many real `npm run build`
      // runs. setup.mjs, also in scripts/, has genuine test coverage
      // via test/setup.test.js's runSetup()/buildRootCss() tests and
      // should NOT be hidden from the coverage report the way an
      // overly broad scripts/** glob would do.
      exclude: [...coverageConfigDefaults.exclude, 'scripts/copy-assets.mjs']
    }
  }
});
