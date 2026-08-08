/**
 * help.js (component)
 *
 * Returns the Help overlay's markup. Static content only -- Help has
 * no state, no wiring beyond the shared overlay's own Back button.
 */
export function buildHelpScreen() {
  return `
    <div class="pk-overlay-body">
      <h3>Help</h3>
      <p>PrefKeeper lets you change how this site looks and reads for
      you -- colors, text size and spacing, motion, and focus
      indicators. Nothing you change here affects anyone else visiting
      this site.</p>
      <p><strong>Preview vs. Saved:</strong> changes only apply to your
      own view while you're adjusting them. Click Save to keep them for
      next time, or Close without saving to discard them.</p>
      <p><strong>Presets:</strong> the dropdowns on the Colors tab are
      starting points -- pick one, then fine-tune with the sliders if it
      isn't quite right.</p>
      <p><strong>Import / Export:</strong> your saved preferences can be
      copied out as text and brought back in on another device or
      browser.</p>
    </div>
  `;
}
