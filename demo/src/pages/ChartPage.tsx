import { useMemo, useState } from 'react';

import { Link, useParams } from 'react-router';

import CodeTabs from '../components/CodeTabs';
import Controls from '../components/Controls';
import DataEditor from '../components/DataEditor';
import RichText from '../components/RichText';
import ScrollTable from '../components/ScrollTable';
import { emberSnippet, reactSnippet, vanillaSnippet } from '../lib/snippets';
import { PLAYGROUNDS } from '../playgrounds';
import { CHART_ROUTES } from '../routes';
import { API_URL } from '../site';

import NotFound from './NotFound';

import type { CodeTab } from '../components/CodeTabs';
import type { Control, ControlValue, PlaygroundDef } from '../playgrounds/types';
import type { ChartRoute } from '../routes';

function initialValues(controls: Control[]): Record<string, ControlValue> {
  return Object.fromEntries(
    controls.map((control) => [control.key, control.initial ?? control.default])
  );
}

/** Sets `options.xAxis.showGrid` from the path "xAxis.showGrid". */
function setPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split('.');
  let node = target;
  for (const key of keys.slice(0, -1)) {
    node[key] ??= {};
    node = node[key] as Record<string, unknown>;
  }
  node[keys[keys.length - 1] ?? path] = value;
}

/** The options the controls describe, leaving out values at the library default. */
function buildOptions(
  def: PlaygroundDef,
  values: Record<string, ControlValue>
): Record<string, unknown> {
  const options: Record<string, unknown> = {};
  for (const control of def.controls) {
    const value = values[control.key] ?? control.default;
    if (value !== control.default) {
      setPath(options, control.key, value);
    }
  }
  return { ...options, ...def.fixed };
}

function typeOf(control: Control): string {
  switch (control.kind) {
    case 'switch':
      return 'boolean';
    case 'range':
      return 'number';
    case 'select':
      return control.options.map((option) => `'${option.value}'`).join(' | ');
    default:
      return 'string';
  }
}

function defaultOf(control: Control): string {
  if (control.kind === 'range' && control.default < control.min) {
    return 'required';
  }
  return control.default === '' ? "''" : String(control.default);
}

function Playground({ def, route }: { def: PlaygroundDef; route: ChartRoute }) {
  const [values, setValues] = useState(() => initialValues(def.controls));
  const [data, setData] = useState<unknown>(def.presets[0]?.value);
  // Remounting the chart replays its entrance animation.
  const [run, setRun] = useState(0);
  // Remounting the editor puts its text back to the first preset.
  const [resets, setResets] = useState(0);

  const options = useMemo(() => buildOptions(def, values), [def, values]);

  const tabs = useMemo<CodeTab[]>(() => {
    const input = {
      className: def.className,
      reactName: def.reactName,
      emberType: def.slug,
      options,
      dataKey: def.dataKey,
      data,
      height: def.height,
    };
    return [
      { id: 'vanilla', label: 'Vanilla JS', language: 'js', code: vanillaSnippet(input) },
      { id: 'react', label: 'React', language: 'tsx', code: reactSnippet(input) },
      { id: 'ember', label: 'Ember', language: 'gts', code: emberSnippet(input) },
    ];
  }, [def, options, data]);

  const reset = () => {
    setValues(initialValues(def.controls));
    setData(def.presets[0]?.value);
    setResets((count) => count + 1);
  };

  return (
    <div className="site-play">
      <section className="site-play__stage" aria-labelledby="preview-title">
        <div className="cyber-hud site-play__frame">
          <h2 className="cyber-hud__label" id="preview-title">
            Live preview
          </h2>
          <div
            key={run}
            className={def.height === null ? 'site-chart site-chart--inline' : 'site-chart'}
            style={def.height === null ? undefined : { height: def.height }}
          >
            {def.render({ ...options, [def.dataKey]: data })}
          </div>
        </div>
        <div className="site-play__actions">
          <button
            type="button"
            className="cyber-btn cyber-btn--sm"
            onClick={() => setRun((count) => count + 1)}
          >
            Replay animation
          </button>
          <button
            type="button"
            className="cyber-btn cyber-btn--sm cyber-btn--ghost"
            onClick={reset}
          >
            Reset
          </button>
        </div>
      </section>

      <section className="site-play__panel" aria-labelledby="options-title">
        <h2 className="site-panel__title" id="options-title">
          Options
        </h2>
        <Controls
          controls={def.controls}
          values={values}
          onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))}
        />
        <DataEditor
          key={resets}
          label={def.dataLabel}
          shape={def.dataShape}
          presets={def.presets}
          validate={def.validate}
          onChange={setData}
        />
      </section>

      <section className="site-play__code" aria-labelledby="code-title">
        <h2 className="site-section__title" id="code-title">
          Code for this chart
        </h2>
        <p className="site-play__hint">
          It follows the controls: only options you moved off their default are printed.
        </p>
        <CodeTabs label={`${route.name} chart code`} tabs={tabs} />
      </section>
    </div>
  );
}

function ChartPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const index = CHART_ROUTES.findIndex((candidate) => candidate.slug === slug);
  const route = CHART_ROUTES[index];
  if (!route) {
    return <NotFound />;
  }
  const def = PLAYGROUNDS[route.slug];
  const previous = CHART_ROUTES[index - 1];
  const next = CHART_ROUTES[index + 1];

  return (
    <article className="site-wrap site-page">
      <header className="site-page__header">
        <p className="site-page__crumb">
          <Link to="/charts">Charts</Link>
        </p>
        <h1 className="site-page__title">{route.name} chart</h1>
        <p className="site-page__lead">{def.lead}</p>
      </header>

      {/* Keyed by chart, so moving to another chart starts from its own defaults. */}
      <Playground key={route.slug} def={def} route={route} />

      <div className="site-columns">
        <section className="site-section" aria-labelledby="when-title">
          <h2 className="site-section__title" id="when-title">
            When to use it
          </h2>
          <ul className="site-list">
            {def.useWhen.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="site-section" aria-labelledby="a11y-title">
          <h2 className="site-section__title" id="a11y-title">
            Accessibility
          </h2>
          <ul className="site-list">
            {def.accessibility.map((item) => (
              <li key={item}>
                <RichText text={item} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="site-section" aria-labelledby="reference-title">
        <h2 className="site-section__title" id="reference-title">
          Options on this page
        </h2>
        <p>
          The options the controls above set. The <a href={API_URL}>README</a> lists the rest:
          padding, axes, tooltips and animation timing.
        </p>
        <ScrollTable label={`${route.name} chart options`}>
          <table className="cyber-table cyber-table--compact site-table">
            <thead>
              <tr>
                <th scope="col">Option</th>
                <th scope="col">Type</th>
                <th scope="col">Default</th>
                <th scope="col">What it does</th>
              </tr>
            </thead>
            <tbody>
              {def.controls.map((control) => (
                <tr key={control.key}>
                  <th scope="row" className="site-table__key">
                    {control.key}
                  </th>
                  <td className="site-table__value">{typeOf(control)}</td>
                  <td className="site-table__value">{defaultOf(control)}</td>
                  <td>{control.help}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      </section>

      <nav className="site-pager" aria-label="Chart types">
        {previous ? (
          <Link to={previous.path} className="site-pager__link">
            <span className="site-pager__hint">Previous</span>
            {previous.name}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={next.path} className="site-pager__link site-pager__link--next">
            <span className="site-pager__hint">Next</span>
            {next.name}
          </Link>
        ) : (
          <Link to="/dashboard" className="site-pager__link site-pager__link--next">
            <span className="site-pager__hint">Next</span>
            Dashboard example
          </Link>
        )}
      </nav>
    </article>
  );
}

export default ChartPage;
