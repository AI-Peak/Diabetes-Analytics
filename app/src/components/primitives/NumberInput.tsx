"use client";

export function NumberInput({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min?: number; max?: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input className="number-control num" type="number" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
