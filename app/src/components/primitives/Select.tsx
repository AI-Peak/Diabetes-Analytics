"use client";

export type SelectOption = { value: string; label: string };

export function Select({ label, value, options, onChange }: { label: string; value: string; options: SelectOption[]; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select className="select-control" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}
