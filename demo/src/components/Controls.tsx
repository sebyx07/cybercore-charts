import { useId } from 'react';

import type { Control, ControlValue } from '../playgrounds/types';

interface ControlFieldProps {
  control: Control;
  value: ControlValue;
  onChange: (value: ControlValue) => void;
}

/** One playground control, drawn with the matching cybercore-css form class. */
function ControlField({ control, value, onChange }: ControlFieldProps) {
  const id = useId();

  if (control.kind === 'switch') {
    return (
      <label className="cyber-switch cyber-switch--sm site-control">
        <input
          type="checkbox"
          role="switch"
          checked={value === true}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="cyber-switch__track" />
        <span className="cyber-switch__label">{control.label}</span>
      </label>
    );
  }

  if (control.kind === 'select') {
    return (
      <div className="cyber-field site-control">
        <label className="cyber-field__label" htmlFor={id}>
          {control.label}
        </label>
        <select
          id={id}
          className="cyber-select cyber-select--sm"
          value={String(value)}
          onChange={(event) => onChange(event.target.value)}
        >
          {control.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (control.kind === 'range') {
    return (
      <div className="cyber-field site-control">
        <div className="site-control__range-head">
          <label className="cyber-field__label" htmlFor={id}>
            {control.label}
          </label>
          <output className="site-control__value" htmlFor={id}>
            {String(value)}
          </output>
        </div>
        <input
          id={id}
          type="range"
          className="cyber-range"
          min={control.min}
          max={control.max}
          step={control.step}
          value={Number(value)}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      </div>
    );
  }

  return (
    <div className="cyber-field site-control site-control--wide">
      <label className="cyber-field__label" htmlFor={id}>
        {control.label}
      </label>
      <input
        id={id}
        type="text"
        className="cyber-input cyber-input--sm"
        value={String(value)}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

interface ControlsProps {
  controls: Control[];
  values: Record<string, ControlValue>;
  onChange: (key: string, value: ControlValue) => void;
}

/** The option controls of a playground: switches first, then the rest. */
function Controls({ controls, values, onChange }: ControlsProps) {
  const switches = controls.filter((control) => control.kind === 'switch');
  const fields = controls.filter((control) => control.kind !== 'switch');
  const field = (control: Control) => (
    <ControlField
      key={control.key}
      control={control}
      value={values[control.key] ?? control.default}
      onChange={(value) => onChange(control.key, value)}
    />
  );

  return (
    <div className="site-controls">
      <div className="site-controls__fields">{fields.map(field)}</div>
      <div className="site-controls__switches">{switches.map(field)}</div>
    </div>
  );
}

export default Controls;
