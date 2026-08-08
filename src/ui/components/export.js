/**
 * export.js (component)
 *
 * Returns the Export overlay's markup: a read-only textarea holding
 * the current preferences as JSON, plus Copy All and Download
 * buttons. The actual JSON content is filled in by panel.js after
 * this template is inserted (this file has no access to `state`) --
 * this only builds the shape.
 */
export function buildExportScreen() {
  return `
    <div class="pk-overlay-body">
      <h3>Export</h3>
      <p>Copy this or download it as a file, then use Import on another
      device or browser to bring it back.</p>
      <textarea class="pk-export-output" readonly rows="10"></textarea>
      <div class="pk-export-actions">
        <button class="pk-footer-btn pk-export-copy" type="button">Copy All</button>
        <button class="pk-footer-btn pk-export-download" type="button">Download File</button>
      </div>
    </div>
  `;
}
