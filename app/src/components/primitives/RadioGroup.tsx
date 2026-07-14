"use client";

export function RadioGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="field">
      <legend className="field-label">{label}</legend>
      <div className="radio-group">
        {options.map((option) => (
          <button
            className={`radio-option${value === option.value ? " active" : ""}`}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            key={option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
