import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

function Layout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  // Scroll to top when navigating to a new page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="demo-layout">
      <nav className={`cyber-nav ${isMenuOpen ? 'cyber-nav--open' : ''}`}>
        <NavLink to="/" className="cyber-nav__brand" onClick={closeMenu}>
          CYBERCORE CHARTS
        </NavLink>

        <button
          className="cyber-nav__toggle"
          onClick={toggleMenu}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
        >
          <span className="cyber-nav__toggle-bar" />
          <span className="cyber-nav__toggle-bar" />
          <span className="cyber-nav__toggle-bar" />
        </button>

        <div className="cyber-nav__menu">
          <ul className="cyber-nav__links">
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `cyber-nav__link ${isActive ? 'cyber-nav__link--active' : ''}`
                }
                onClick={closeMenu}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/line-charts"
                className={({ isActive }) =>
                  `cyber-nav__link ${isActive ? 'cyber-nav__link--active' : ''}`
                }
                onClick={closeMenu}
              >
                Line
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/bar-charts"
                className={({ isActive }) =>
                  `cyber-nav__link ${isActive ? 'cyber-nav__link--active' : ''}`
                }
                onClick={closeMenu}
              >
                Bar
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/radial-charts"
                className={({ isActive }) =>
                  `cyber-nav__link ${isActive ? 'cyber-nav__link--active' : ''}`
                }
                onClick={closeMenu}
              >
                Radial
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/realtime"
                className={({ isActive }) =>
                  `cyber-nav__link ${isActive ? 'cyber-nav__link--active' : ''}`
                }
                onClick={closeMenu}
              >
                Real-time
              </NavLink>
            </li>
          </ul>

          <div className="cyber-nav__actions">
            <div className="cyber-status">
              <span className="cyber-status__dot" />
              <span>ONLINE</span>
            </div>

            <a
              href="https://github.com/sebyx07/cybercore-charts"
              target="_blank"
              rel="noopener noreferrer"
              className="cyber-btn cyber-btn--outline cyber-btn--sm"
              onClick={closeMenu}
            >
              GitHub
            </a>
          </div>
        </div>
      </nav>

      <main className="demo-main">
        <Outlet />
      </main>

      <footer className="demo-footer">
        <div className="cyber-container">
          <p className="cyber-mono">
            CYBERCORE CHARTS v1.0.0 // Cyberpunk Data Visualization // MIT License
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
