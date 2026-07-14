"use client";

type TooltipItem = { name?: string | number; value?: string | number; color?: string };

export function ChartTooltip({
  active,
  payload,
  label,
  formatter = (value) => String(value),
}: {
  active?: boolean;
  payload?: TooltipItem[];
  label?: string | number;
  formatter?: (value: string | number, name?: string | number) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      {label !== undefined ? <div className="tooltip-label">{label}</div> : null}
      {payload.map((item, index) => (
        <div className="tooltip-row" key={`${item.name ?? "value"}-${index}`}>
          <span>{item.name ?? "Value"}</span>
          <strong>{formatter(item.value ?? "", item.name)}</strong>
        </div>
      ))}
    </div>
  );
}
