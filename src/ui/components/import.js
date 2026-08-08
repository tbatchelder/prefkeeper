/**
 * import.js (component)
 *
 * Returns the Import overlay's markup: a paste-in textarea, an Apply
 * button, and a slot for an inline error message (invalid/malformed
 * JSON shows here rather than as a disruptive alert()).
 */
export function buildImportScreen() {
  return `
    <div class="pk-overlay-body">
      <h3>Import</h3>
      <p>Paste preferences exported from another device or browser.</p>
      <textarea class="pk-import-input" rows="10" placeholder="Paste exported JSON here"></textarea>
      <p class="pk-import-error" hidden></p>
      <div class="pk-export-actions">
        <button class="pk-footer-btn pk-import-apply" type="button">Apply</button>
      </div>
    </div>
  `;
}
