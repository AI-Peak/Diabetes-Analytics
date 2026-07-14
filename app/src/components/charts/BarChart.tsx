"use client";

import { Bar, BarChart as ReBarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "./Tooltip";
import { type ChartRole, useChartTheme } from "./theme";

export function BarChart({
  data,
  valueLabel = "Value",
  color = "accent",
  formatValue = (value) => value.toFixed(3),
  ariaLabel,
}: {
  data: { name: string; value: number }[];
  valueLabel?: string;
  color?: ChartRole;
  formatValue?: (value: number) => string;
  ariaLabel: string;
}) {
  const theme = useChartTheme();
  if (!data.length) return <div className="chart-empty">No chart data available.</div>;

  return (
    <div role="img" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={300}>
        <ReBarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid stroke={theme.grid} vertical={false} />
          <XAxis dataKey="name" tick={{ fill: theme.axis, fontSize: 9 }} tickLine={false} axisLine={{ stroke: theme.grid }} />
          <YAxis tick={{ fill: theme.axis, fontSize: 9 }} tickLine={false} axisLine={false} tickFormatter={formatValue} />
          <Tooltip content={<ChartTooltip formatter={(value) => formatValue(Number(value))} />} />
          <Bar dataKey="value" name={valueLabel} fill={theme[color]} radius={[6, 6, 2, 2]} />
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}
