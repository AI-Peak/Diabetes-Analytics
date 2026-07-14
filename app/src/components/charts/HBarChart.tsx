"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "./Tooltip";
import { type ChartRole, useChartTheme } from "./theme";

export type HBarDatum = { name: string; value: number; detail?: string; tone?: ChartRole };

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
  onSelect?: (datum: HBarDatum) => void;
}) {
  const theme = useChartTheme();
  if (!data.length) return <div className="chart-empty">No chart data available.</div>;
  const height = Math.max(260, data.length * 33 + 50);
  const handleClick = (entry: unknown) => {
    if (!onSelect || !entry || typeof entry !== "object") return;
    const candidate = "payload" in entry ? entry.payload : entry;
    if (candidate && typeof candidate === "object" && "name" in candidate && typeof candidate.name === "string") {
      onSelect(candidate as HBarDatum);
    }
  };

  return (
    <div className="chart-scroll" role="img" aria-label={ariaLabel}>
      <div className="chart-min-width" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, left: 10, bottom: 4 }}>
            <CartesianGrid stroke={theme.grid} horizontal={false} />
            <XAxis type="number" tick={{ fill: theme.axis, fontSize: 9 }} tickLine={false} axisLine={{ stroke: theme.grid }} tickFormatter={formatValue} />
            <YAxis type="category" dataKey="name" width={155} tick={{ fill: theme.axis, fontSize: 9 }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip formatter={(value) => formatValue(Number(value))} />} />
            <Bar dataKey="value" name={valueLabel} fill={theme[color]} radius={[0, 6, 6, 0]} maxBarSize={18} onClick={handleClick} cursor={onSelect ? "pointer" : undefined}>
              {data.map((entry) => {
                const selected = selectedName === entry.name;
                const dimmed = Boolean(selectedName && !selected);
                return <Cell fill={theme[entry.tone ?? color]} fillOpacity={dimmed ? 0.38 : 1} stroke={selected ? theme.red : "transparent"} strokeWidth={selected ? 2 : 0} key={entry.name} />;
              })}
              <LabelList dataKey="value" position="right" formatter={(value: number) => formatValue(value)} fill={theme.axis} fontSize={9} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
