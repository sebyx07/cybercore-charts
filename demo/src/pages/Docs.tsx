import { Link } from 'react-router';

import CodeBlock from '../components/CodeBlock';
import InstallTabs from '../components/InstallTabs';
import ThemePicker from '../components/ThemePicker';
import {
  A11Y_OPTIONS,
  EMBER_CLASSIC,
  EMBER_CLASSIC_TEMPLATE,
  EMBER_USAGE,
  NEXT_USAGE,
  REACT_HOOK,
  REACT_REF,
  REACT_USAGE,
  THEME_ATTRIBUTE,
  THEME_OPTIONS,
  THEME_TOKENS,
  VANILLA_USAGE,
} from '../data/snippets';
import { THEMES } from '../lib/theme';
import { API_URL, CSS_URL } from '../site';

const SECTIONS = [
  { id: 'install', title: 'Install' },
  { id: 'first-chart', title: 'First chart' },
  { id: 'sizing', title: 'Sizing' },
  { id: 'react', title: 'React' },
  { id: 'ember', title: 'Ember' },
  { id: 'theming', title: 'Theming' },
  { id: 'accessibility', title: 'Accessibility' },
];

function Docs() {
  return (
    <article className="site-wrap site-page site-docs">
      <header className="site-page__header">
        <h1 className="site-page__title">Getting started</h1>
        <p className="site-page__lead">
          Install the package, draw a chart, then wire it into React or Ember. The{' '}
          <a href={API_URL}>README</a> has the full option reference.
        </p>
      </header>

      <nav className="site-toc" aria-label="On this page">
        <ul>
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>{section.title}</a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="site-docs__content">
        <section className="site-section" id="install" aria-labelledby="install-title">
          <h2 className="site-section__title" id="install-title">
            Install
          </h2>
          <p>
            One package holds the core, the React components and the Ember modifier. It has no
            runtime dependencies; React and Ember are optional peers.
          </p>
          <InstallTabs />
        </section>

        <section className="site-section" id="first-chart" aria-labelledby="first-chart-title">
          <h2 className="site-section__title" id="first-chart-title">
            First chart
          </h2>
          <p>
            Every chart is a class that takes a container (an element or a selector) and options. It
            draws an inline SVG into the container and returns an instance you can update, resize
            and destroy.
          </p>
          <CodeBlock code={VANILLA_USAGE} language="js" title="Vanilla JS" />
          <p>
            The other classes are <code>BarChart</code>, <code>DonutChart</code>,{' '}
            <code>GaugeChart</code> and <code>Sparkline</code>. Each has a{' '}
            <Link to="/charts">playground</Link> that writes this code for you.
          </p>
        </section>

        <section className="site-section" id="sizing" aria-labelledby="sizing-title">
          <h2 className="site-section__title" id="sizing-title">
            Sizing
          </h2>
          <p>
            Pass <code>width</code> and <code>height</code> for a fixed size. Pass{' '}
            <code>responsive: true</code> and the chart fills its container and follows it when it
            resizes, so give the container a height in CSS. A container without a height collapses
            to nothing, and so does the chart.
          </p>
        </section>

        <section className="site-section" id="react" aria-labelledby="react-title">
          <h2 className="site-section__title" id="react-title">
            React
          </h2>
          <p>
            <code>cybercore-charts/react</code> exports <code>CyberLineChart</code>,{' '}
            <code>CyberBarChart</code>, <code>CyberDonutChart</code>, <code>CyberGaugeChart</code>{' '}
            and <code>CyberSparkline</code> for React 18 and 19. Props are the chart options, plus
            any attribute of the container element.
          </p>
          <CodeBlock code={REACT_USAGE} language="tsx" title="React" />
          <ul className="site-list">
            <li>
              A changed prop updates the chart in place. Inline literals such as{' '}
              <code>{'xAxis={{ showGrid: false }}'}</code> are compared by content, so they do not
              redraw the chart on every render.
            </li>
            <li>
              The chart is destroyed on unmount, with its observers and tooltip. StrictMode’s double
              mount leaves one chart, not two.
            </li>
            <li>
              Event props (<code>onPointClick</code>, <code>onBarHover</code>,{' '}
              <code>onSegmentClick</code>, <code>onResize</code>) always call the handler of the
              latest render.
            </li>
          </ul>

          <h3 className="site-subtitle">Refs</h3>
          <p>
            A ref gives you the instance methods: <code>update</code>, <code>setOptions</code>,{' '}
            <code>resize</code>, <code>getSVG</code>, <code>toSVG</code> and <code>getChart</code>.
          </p>
          <CodeBlock code={REACT_REF} language="tsx" title="Export as SVG" />

          <h3 className="site-subtitle">Server rendering</h3>
          <p>
            Nothing touches the DOM during render. On the server a component emits its empty
            container; the chart is drawn after hydration. In the Next.js App Router, import the
            components from a client component.
          </p>
          <CodeBlock code={NEXT_USAGE} language="tsx" title="charts.tsx" />

          <h3 className="site-subtitle">Your own chart class</h3>
          <CodeBlock code={REACT_HOOK} language="tsx" title="useChart" />
        </section>

        <section className="site-section" id="ember" aria-labelledby="ember-title">
          <h2 className="site-section__title" id="ember-title">
            Ember
          </h2>
          <p>
            <code>cybercore-charts/ember</code> exports one modifier, <code>cyberChart</code>, for
            Ember 5 and later. It needs <code>ember-modifier</code> 4 or later in your app. The
            first argument names the chart; named arguments are its options and event handlers.
          </p>
          <CodeBlock code={EMBER_USAGE} language="gts" title="Template tag" />
          <ul className="site-list">
            <li>
              The chart is created when the element is inserted, updated in place when a tracked
              argument changes, and destroyed with the element.
            </li>
            <li>
              <code>onCreated</code> receives the chart instance, for <code>toSVG()</code> and other
              calls. <code>onWillDestroy</code> runs just before it goes.
            </li>
            <li>
              Replace tracked arrays instead of mutating them:{' '}
              <code>this.data = [...this.data, point]</code>.
            </li>
          </ul>
          <h3 className="site-subtitle">Classic templates</h3>
          <p>Re-export the modifier once, then use it by its dashed name.</p>
          <CodeBlock code={EMBER_CLASSIC} language="js" title="app/modifiers/cyber-chart.js" />
          <CodeBlock code={EMBER_CLASSIC_TEMPLATE} language="html" title="Template" />
        </section>

        <section className="site-section" id="theming" aria-labelledby="theming-title">
          <h2 className="site-section__title" id="theming-title">
            Theming
          </h2>
          <p>
            Charts paint with CSS custom properties and fall back to the built-in neon palette. On a
            page that loads <a href={CSS_URL}>cybercore-css</a>, a single series uses the accent, so{' '}
            <code>data-theme</code> on the page or on any ancestor retints it.
          </p>
          {THEMES.length > 1 ? (
            <div className="site-docs__try">
              <ThemePicker />
              <p className="cyber-field__hint">Sets the theme of this site, charts included.</p>
            </div>
          ) : null}
          <CodeBlock code={THEME_ATTRIBUTE} language="html" title="Theme attribute" />
          <p>
            When a colour carries meaning, pin it: <code>theme</code> takes <code>cyan</code>,{' '}
            <code>magenta</code>, <code>green</code> or <code>yellow</code>, and a series or a
            segment takes any CSS colour.
          </p>
          <CodeBlock code={THEME_OPTIONS} language="js" title="Pinned colours" />
          <p>Without cybercore-css, define the tokens yourself.</p>
          <CodeBlock code={THEME_TOKENS} language="css" title="Tokens" />
        </section>

        <section className="site-section" id="accessibility" aria-labelledby="accessibility-title">
          <h2 className="site-section__title" id="accessibility-title">
            Accessibility
          </h2>
          <p>
            A chart is a picture of data, so each one also ships the data in forms that do not need
            eyes or a mouse.
          </p>
          <ul className="site-list">
            <li>
              <strong>Name and description.</strong> <code>ariaLabel</code> becomes the SVG’s{' '}
              <code>title</code>. A description is generated from the data (point count, lowest and
              highest value) unless you pass your own.
            </li>
            <li>
              <strong>Keyboard.</strong> One tab stop per chart. Arrow keys move between marks, Home
              and End jump to the ends, Enter or Space activates a mark, Escape closes the tooltip.
            </li>
            <li>
              <strong>Data table.</strong> A visually hidden table of the values sits next to the
              SVG for screen readers.
            </li>
            <li>
              <strong>Gauges</strong> are <code>role="meter"</code> with current, minimum and
              maximum values.
            </li>
            <li>
              <strong>Motion.</strong> Entrance animations do not play under{' '}
              <code>prefers-reduced-motion: reduce</code> or inside{' '}
              <code>[data-motion="reduce"]</code>.
            </li>
            <li>
              <strong>Contrast.</strong> Glow filters are dropped inside{' '}
              <code>[data-contrast="high"]</code>, leaving solid marks.
            </li>
          </ul>
          <CodeBlock code={A11Y_OPTIONS} language="js" title="Accessibility options" />
          <h3 className="site-subtitle">What stays your job</h3>
          <ul className="site-list">
            <li>Write an accessible name that says what the data is.</li>
            <li>
              Do not let colour carry a status alone. Put the state in words next to a gauge or a
              coloured series.
            </li>
            <li>
              Give live data a pause control, as the <Link to="/dashboard">dashboard</Link> does,
              and do not announce every tick.
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}

export default Docs;
