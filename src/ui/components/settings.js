/**
 * settings.js (component)
 *
 * Returns the Settings overlay's markup. Just the auto-load toggle
 * for now. No Save button by design -- toggles auto-save immediately,
 * same as any OS/browser settings screen, unlike the deliberate
 * Save-then-commit model the Colors/Text/Motion/Focus tabs use.
 */
export function buildSettingsScreen() {
  return `
    <div class="pk-overlay-body">
      <h3>Settings</h3>
      <label class="pk-settings-row">
        <input type="checkbox" class="pk-auto-load-toggle" checked>
        Auto-load my preferences on every page
      </label>
      <p class="pk-settings-hint">
        Turning this off is the same as Pause (in this menu) -- useful if
        you want to show this site to someone else without your
        preferences applied.
      </p>
    </div>
  `;
}
