import { initPrefKeeper } from 'prefkeeper';

/**
 * A small, reusable button that opens the PrefKeeper panel.
 *
 * Pass `customPresets` straight through if you want to offer your own
 * presets (see App.jsx below for a real example, and the "Custom
 * presets" section of the main README for the full shape). If you
 * don't need custom presets, just drop this in with no props:
 *
 *   <PrefKeeperButton />
 */
export default function PrefKeeperButton({ customPresets, children = 'Open PrefKeeper' }) {
  const handleClick = async () => {
    await initPrefKeeper({ customPresets });
  };

  return (
    <button type="button" onClick={handleClick}>
      {children}
    </button>
  );
}
