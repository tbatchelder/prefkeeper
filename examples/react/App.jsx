import './index.css';
import PrefKeeperButton from './PrefKeeperButton';

/**
 * Real "site content" -- styled entirely with var(--pk-*), the same
 * way examples/vanilla/index.html is. Open PrefKeeper, change
 * something, then Close it to see this content actually update.
 */
function App() {
  return (
    <div className="pk-demo-page">
      <h1>Example host site (React)</h1>
      <p>
        This paragraph, the link below, and the button are real "site content" — styled entirely
        with <code>var(--pk-*)</code>, the same way a real developer's page would be.
      </p>
      <p>
        <a href="#" onClick={e => e.preventDefault()}>
          A sample link
        </a>
      </p>
      <p>
        <button className="demo-btn" type="button">
          Primary Action
        </button>
      </p>
      <p>
        <input className="demo-input" type="text" placeholder="Sample input" />
      </p>

      <hr />

      {/* Un-comment this version instead to see a custom preset in the
          dropdown -- same "Forest" theme verified in examples/vanilla,
          reused here so both examples demonstrate the identical API. */}
      {/*
      <PrefKeeperButton
        customPresets={{
          contrast: {
            forest: {
              label: 'Forest',
              values: {
                background: { hue: 90, sat: 15, light: 95 },
                text: { hue: 30, sat: 45, light: 15 },
                primary: { hue: 140, sat: 45, light: 25 },
                onPrimary: { hue: 60, sat: 20, light: 98 },
                link: { hue: 95, sat: 40, light: 28 }
              }
            }
          }
        }}
      />
      */}

      <PrefKeeperButton />
    </div>
  );
}

export default App;
