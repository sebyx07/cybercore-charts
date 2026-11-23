interface LiveSwitchProps {
  live: boolean;
  onChange: (live: boolean) => void;
}

/** Pauses and resumes a synthetic data feed. */
function LiveSwitch({ live, onChange }: LiveSwitchProps) {
  return (
    <label className="cyber-switch cyber-switch--sm">
      <input
        type="checkbox"
        role="switch"
        checked={live}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="cyber-switch__track" />
      <span className="cyber-switch__label">Live data</span>
    </label>
  );
}

export default LiveSwitch;
