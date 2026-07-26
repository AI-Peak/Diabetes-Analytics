"use client";

export type SelectOption = { value: string; label: string };

export function Select({
  label,
  value,
  options,
  onChange,
  hideLabel = false,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  hideLabel?: boolean;
}) {
  return (
    <label className="field">
      <span className={hideLabel ? "sr-only" : "field-label"}>{label}</span>
      <select className="select-control" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
