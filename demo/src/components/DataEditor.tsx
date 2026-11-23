import { useId, useState } from 'react';

import type { DataPreset } from '../playgrounds/types';

interface DataEditorProps {
  label: string;
  /** The shape the editor accepts, in words. */
  shape: string;
  presets: DataPreset[];
  /** Returns what is wrong with a parsed value, or null when it is usable. */
  validate: (value: unknown) => string | null;
  /** Called with every value that parses and validates. */
  onChange: (value: unknown) => void;
}

function format(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/**
 * A JSON editor for a chart's data. The chart keeps showing the last valid
 * value while the text is being edited into shape; the error says what to fix.
 */
function DataEditor({ label, shape, presets, validate, onChange }: DataEditorProps) {
  const [text, setText] = useState(() => format(presets[0]?.value));
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  const edit = (next: string) => {
    setText(next);
    let parsed: unknown;
    try {
      parsed = JSON.parse(next);
    } catch (cause) {
      setError(`Not valid JSON: ${cause instanceof Error ? cause.message : 'check the syntax'}.`);
      return;
    }
    const problem = validate(parsed);
    setError(problem);
    if (!problem) {
      onChange(parsed);
    }
  };

  return (
    <div className="site-data">
      <div className="site-data__head">
        <label className="site-panel__title" htmlFor={id}>
          {label}
        </label>
        <div className="site-data__presets" role="group" aria-label={`${label} presets`}>
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="cyber-btn cyber-btn--sm cyber-btn--ghost"
              onClick={() => edit(format(preset.value))}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      <textarea
        id={id}
        className={
          error
            ? 'cyber-textarea cyber-textarea--error site-data__text'
            : 'cyber-textarea site-data__text'
        }
        value={text}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-shape ${id}-error`}
        onChange={(event) => edit(event.target.value)}
      />
      <p className="cyber-field__hint" id={`${id}-shape`}>
        {shape}
      </p>
      {/* Mounted from the start, so the message is announced when it appears. */}
      <p className="cyber-field__error site-data__error" id={`${id}-error`} role="status">
        {error ? `${error} The chart still shows the last valid data.` : ''}
      </p>
    </div>
  );
}

export default DataEditor;
