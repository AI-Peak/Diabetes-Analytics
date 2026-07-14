"use client";

export function SliderControl({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue = String,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}) {
  return (
    <label className="slider-field">
      <span className="slider-header"><span className="field-label">{label}</span><output className="slider-value">{formatValue(value)}</output></span>
      <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
