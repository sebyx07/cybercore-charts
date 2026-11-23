import { THEMES, titleCase, useTheme } from '../lib/theme';

/** The accent themes as a row of toggle buttons. Sets the theme of the whole site. */
function ThemePicker() {
  const [theme, setTheme] = useTheme();

  return (
    <div className="site-themes__picker" role="group" aria-label="Accent theme">
      {THEMES.map((name) => (
        <button
          key={name}
          type="button"
          className={name === theme ? 'cyber-btn cyber-btn--filled' : 'cyber-btn'}
          aria-pressed={name === theme}
          // Each button wears its own accent, whatever the page theme is.
          data-theme={name}
          onClick={() => setTheme(name)}
        >
          {titleCase(name)}
        </button>
      ))}
    </div>
  );
}

export default ThemePicker;
