import { useId } from 'react';

import { THEMES, titleCase, useTheme } from '../lib/theme';

/**
 * Lists the accent themes the bundled cybercore-css declares with
 * `[data-theme]`. Renders nothing when that build has none.
 */
function ThemeSwitcher() {
  const [theme, setTheme] = useTheme();
  const id = useId();

  if (THEMES.length < 2) {
    return null;
  }

  return (
    <div className="site-theme">
      <label className="site-theme__label" htmlFor={id}>
        Theme
      </label>
      <select
        id={id}
        className="cyber-select site-theme__select"
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
      >
        {THEMES.map((name) => (
          <option key={name} value={name}>
            {titleCase(name)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ThemeSwitcher;
