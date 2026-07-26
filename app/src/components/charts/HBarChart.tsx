"use client";

import type { KeyboardEvent } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "./Tooltip";
import { type ChartRole, useChartTheme } from "./theme";

export type HBarDatum = { name: string; value: number; detail?: string; displayValue?: string; tone?: ChartRole };

export function HBarChart({
  data,
  valueLabel = "Value",
  color = "accent",
  formatValue = (value) => value.toFixed(3),
  ariaLabel,
  selectedName,
  onSelect,
}: {
  data: HBarDatum[];
  valueLabel?: string;
  color?: ChartRole;
  formatValue?: (value: number) => string;
  ariaLabel: string;
  selectedName?: string;
  onSelect?: (datum: HBarDatum, mode: "push" | "replace") => void;
}) {
  const theme = useChartTheme();
  if (!data.length) return <div className="chart-empty">No chart data available.</div>;
  const height = Math.max(260, data.length * 33 + 50);
  const handleClick = (entry: unknown) => {
    if (!onSelect || !entry || typeof entry !== "object") return;
    const candidate = "payload" in entry ? entry.payload : entry;
    if (candidate && typeof candidate === "object" && "name" in candidate && typeof candidate.name === "string") {
      onSelect(candidate as HBarDatum, "push");
    }
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect || !data.length) return;
    const currentIndex = data.findIndex((item) => item.name === selectedName);
    let nextIndex = Math.max(0, currentIndex);

    if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = currentIndex < 0 ? 0 : Math.min(data.length - 1, currentIndex + 1);
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = currentIndex < 0 ? data.length - 1 : Math.max(0, currentIndex - 1);
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = data.length - 1;
    else if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onSelect(data[nextIndex], "replace");
  };

  return (
    <div
      className={`chart-scroll${onSelect ? " chart-interactive" : ""}`}
      role={onSelect ? "group" : "img"}
      aria-label={onSelect ? `${ariaLabel}. Use arrow keys, Home, or End to change the selection.` : ariaLabel}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
    >
      <div className="chart-min-width" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 68, left: 10, bottom: 4 }}>
            <CartesianGrid stroke={theme.grid} horizontal={false} />
            <XAxis type="number" tick={{ fill: theme.axis, fontSize: 13 }} tickLine={false} axisLine={{ stroke: theme.grid }} tickFormatter={formatValue} />
            <YAxis type="category" dataKey="name" width={190} tick={{ fill: theme.axis, fontSize: 13 }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip formatter={(value) => formatValue(Number(value))} />} />
            <Bar dataKey="value" name={valueLabel} fill={theme[color]} radius={[0, 6, 6, 0]} maxBarSize={18} onClick={handleClick} cursor={onSelect ? "pointer" : undefined}>
              {data.map((entry) => {
                const dimmed = Boolean(selectedName && selectedName !== entry.name);
                return <Cell fill={theme[entry.tone ?? color]} fillOpacity={dimmed ? 0.32 : 1} key={entry.name} />;
              })}
              <LabelList
                dataKey={(entry: Record<string, unknown>) => {
                  const datum = entry as HBarDatum;
                  return datum.displayValue ?? formatValue(datum.value);
                }}
                position="right"
                fill={theme.label}
                stroke="none"
                strokeWidth={0}
                fontSize={13}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
