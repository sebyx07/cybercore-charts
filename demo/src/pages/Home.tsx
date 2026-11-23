import { Link } from 'react-router';

import { CyberBarChart, CyberDonutChart } from '@cybercore-charts/react';

import ChartGallery from '../components/ChartGallery';
import CodeTabs from '../components/CodeTabs';
import CopyButton from '../components/CopyButton';
import InstallTabs from '../components/InstallTabs';
import LiveSwitch from '../components/LiveSwitch';
import TelemetryDeck from '../components/TelemetryDeck';
import ThemePicker from '../components/ThemePicker';
import { BAR_SINGLE, DONUT_PROTOCOLS } from '../data/samples';
import { EMBER_USAGE, REACT_USAGE, THEME_ATTRIBUTE, VANILLA_USAGE } from '../data/snippets';
import { THEMES } from '../lib/theme';
import { useLiveToggle } from '../lib/useLive';
import { CSS_URL, NPM_INSTALL } from '../site';

import type { CodeTab } from '../components/CodeTabs';

const FRAMEWORKS: CodeTab[] = [
  {
    id: 'vanilla',
    label: 'Vanilla JS',
    language: 'js',
    code: VANILLA_USAGE,
    note: 'A chart is a class: give it an element or a selector, and options.',
  },
  {
    id: 'react',
    label: 'React',
    language: 'tsx',
    code: REACT_USAGE,
    note: 'React 18 and 19. Props are the chart options; the chart updates in place when they change and cleans up on unmount, StrictMode included.',
  },
  {
    id: 'ember',
    label: 'Ember',
    language: 'gts',
    code: EMBER_USAGE,
    note: 'Ember 5 and later, with ember-modifier. One modifier draws every chart type and follows tracked data.',
  },
];

const FACTS: { term: string; value: string }[] = [
  { term: 'Runtime dependencies', value: '0' },
  { term: 'Output', value: 'Inline SVG' },
  { term: 'Chart types', value: 'Line, bar, donut, gauge, sparkline' },
  { term: 'Keyboard', value: 'Arrows, Home, End, Enter, Esc' },
  { term: 'Reduced motion', value: 'Honoured' },
  { term: 'Types', value: 'TypeScript, included' },
];

function Home() {
  const [live, setLive] = useLiveToggle();
  const themed = THEMES.length > 1;

  return (
    <>
      <section className="site-hero" aria-labelledby="hero-title">
        <div className="site-wrap site-hero__grid">
          <div className="site-hero__copy">
            <h1 id="hero-title" className="site-hero__title">
              Neon charts in{' '}
              <span
                className="cyber-glitch cyber-inline-block site-hero__accent"
                data-text="plain SVG"
              >
                plain SVG
              </span>
            </h1>
            <p className="site-hero__lead">
              Line, bar, donut, gauge and sparkline in one small TypeScript library. No
              dependencies, keyboard access built in, adapters for React and Ember.
            </p>
            <div className="cyber-flex cyber-flex-wrap cyber-gap-sm">
              <Link to="/charts/line" className="cyber-btn cyber-btn--filled cyber-btn--lg">
                Open the playground
              </Link>
              <Link to="/docs" className="cyber-btn cyber-btn--lg">
                Get started
              </Link>
            </div>
            <div className="site-hero__install">
              <code className="site-hero__command">{NPM_INSTALL}</code>
              <CopyButton text={NPM_INSTALL} label="Copy npm install command" />
            </div>
          </div>

          <div className="site-hero__panel">
            <TelemetryDeck live={live} />
            <div className="site-hero__feed">
              <LiveSwitch live={live} onChange={setLive} />
              <span className="site-hero__feed-note">
                Synthetic data, one sample every 2 seconds.
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="site-band" aria-labelledby="gallery-title">
        <div className="site-wrap">
          <div className="site-band__head">
            <h2 id="gallery-title" className="site-band__title">
              Five charts, each with a playground
            </h2>
            <p className="site-band__lead">
              Nothing below is a screenshot. Open one, move the controls, edit the data, and copy
              the code it writes for you.
            </p>
          </div>
          <ChartGallery />
        </div>
      </section>

      <section className="site-band" aria-labelledby="install-title">
        <div className="site-wrap site-split">
          <div>
            <h2 id="install-title" className="site-band__title">
              Install in one line
            </h2>
            <p className="site-band__lead">
              From npm for a bundler, or a single script tag from a CDN. There is nothing else to
              set up: no stylesheet, no peer dependency.
            </p>
            <Link to="/docs" className="site-more">
              Read the setup guide
            </Link>
          </div>
          <InstallTabs />
        </div>
      </section>

      <section className="site-band" aria-labelledby="frameworks-title">
        <div className="site-wrap site-split">
          <div>
            <h2 id="frameworks-title" className="site-band__title">
              The same chart in your framework
            </h2>
            <p className="site-band__lead">
              The core is framework-free. The React components and the Ember modifier are thin
              bindings over it, shipped in the same package.
            </p>
            <Link to="/docs#react" className="site-more">
              See the adapter guides
            </Link>
          </div>
          <CodeTabs label="Framework" tabs={FRAMEWORKS} />
        </div>
      </section>

      <section className="site-band" aria-labelledby="themes-title">
        <div className="site-wrap">
          <div className="site-band__head">
            <h2 id="themes-title" className="site-band__title">
              {themed ? 'One attribute retints every chart' : 'Colours come from your tokens'}
            </h2>
            <p className="site-band__lead">
              Charts read the cybercore-css accent tokens, so they follow the theme of the page or
              of the region they sit in. Pin a hue per chart or per series when the colour carries
              meaning.
            </p>
          </div>
          <div className="site-themes">
            <div className="site-stack">
              {themed ? <ThemePicker /> : null}
              <CodeTabs
                label="Theme markup"
                tabs={[{ id: 'html', label: 'HTML', language: 'html', code: THEME_ATTRIBUTE }]}
              />
            </div>
            <div className="site-themes__sample">
              <div className="site-chart" style={{ height: 240 }}>
                <CyberBarChart
                  data={BAR_SINGLE}
                  responsive
                  showValues
                  ariaLabel="Requests per region, in thousands"
                />
              </div>
              <div className="site-chart" style={{ height: 240 }}>
                <CyberDonutChart
                  data={DONUT_PROTOCOLS}
                  responsive
                  showLabels={false}
                  legend={{ show: true, position: 'bottom' }}
                  centerText="2.4k"
                  centerSubtext="req/s"
                  ariaLabel="Traffic by protocol"
                />
              </div>
            </div>
          </div>
          <p className="site-band__foot">
            <Link to="/docs#theming" className="site-more">
              Read about theming
            </Link>
          </p>
        </div>
      </section>

      <section className="site-band" aria-labelledby="facts-title">
        <div className="site-wrap site-split">
          <div>
            <h2 id="facts-title" className="site-band__title">
              Small, and readable without a mouse
            </h2>
            <p className="site-band__lead">
              Every chart has an accessible name and a text description, one tab stop with arrow-key
              navigation, and a hidden data table for screen readers. Animations stop when the
              visitor asks for reduced motion.
            </p>
            <Link to="/docs#accessibility" className="site-more">
              Read the accessibility notes
            </Link>
          </div>
          <dl className="site-specs">
            {FACTS.map((fact) => (
              <div key={fact.term} className="site-specs__row">
                <dt>{fact.term}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="site-band" aria-labelledby="family-title">
        <div className="site-wrap site-split">
          <div>
            <h2 id="family-title" className="site-band__title">
              Made to sit inside Cybercore CSS
            </h2>
            <p className="site-band__lead">
              The header, buttons, tabs and HUD frames on this site are cybercore-css, a pure CSS
              cyberpunk design system. The charts share its palette and its tokens, so a dashboard
              built from both reads as one interface.
            </p>
            <div className="cyber-flex cyber-flex-wrap cyber-gap-sm">
              <Link to="/dashboard" className="cyber-btn">
                See the dashboard example
              </Link>
              <a href={CSS_URL} className="cyber-btn cyber-btn--ghost">
                Open Cybercore CSS
              </a>
            </div>
          </div>
          <dl className="site-specs">
            <div className="site-specs__row">
              <dt>Frames and stats</dt>
              <dd>cyber-hud, cyber-stat</dd>
            </div>
            <div className="site-specs__row">
              <dt>Controls</dt>
              <dd>cyber-switch, cyber-range, cyber-select</dd>
            </div>
            <div className="site-specs__row">
              <dt>Themes</dt>
              <dd>[data-theme]</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="site-band site-close" aria-labelledby="close-title">
        <div className="site-wrap">
          <h2 id="close-title" className="site-close__title">
            Draw the first one
          </h2>
          <div className="cyber-flex cyber-flex-wrap cyber-gap-sm cyber-justify-center">
            <Link to="/charts/line" className="cyber-btn cyber-btn--filled cyber-btn--lg">
              Open the playground
            </Link>
            <Link to="/docs" className="cyber-btn cyber-btn--lg">
              Get started
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
