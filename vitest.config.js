import { defineConfig, coverageConfigDefaults } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
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
      ["test/fonts.test.js", "jsdom"],
      ["test/panel.test.js", "jsdom"],
      ["test/dom.test.js", "jsdom"],
    ],
    coverage: {
      // scripts/copy-assets.mjs deliberately excluded: it's Node-only
      // build tooling (never shipped to consumers), and it runs its
      // real file-copy logic on import rather than exporting a
      // testable function -- meaningful testing would need a refactor
      // disproportionate to a 20-line script already verified
      // manually across many real `npm run build` runs.
      exclude: [...coverageConfigDefaults.exclude, "scripts/**"],
    },
  },
});
