"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "./Tooltip";
import { type ChartRole, useChartTheme } from "./theme";

export type GroupedDatum = { name: string } & Record<string, string | number>;

export function GroupedBar({
  data,
  series,
  formatValue = (value) => value.toFixed(3),
  ariaLabel,
}: {
  data: GroupedDatum[];
  series: { key: string; label: string; color: ChartRole }[];
  formatValue?: (value: number) => string;
  ariaLabel: string;
}) {
  const theme = useChartTheme();
  if (!data.length) return <div className="chart-empty">No chart data available.</div>;

  return (
    <div className="chart-scroll" role="img" aria-label={ariaLabel}>
      <div className="chart-min-width">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 12 }}>
            <CartesianGrid stroke={theme.grid} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: theme.axis, fontSize: 11 }} tickLine={false} axisLine={{ stroke: theme.grid }} />
            <YAxis domain={[0, 1]} tick={{ fill: theme.axis, fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatValue} />
            <Tooltip content={<ChartTooltip formatter={(value) => formatValue(Number(value))} />} />
            <Legend wrapperStyle={{ fontSize: 11, color: theme.axis }} />
            {series.map((item) => <Bar dataKey={item.key} fill={theme[item.color]} key={item.key} name={item.label} radius={[4, 4, 0, 0]} maxBarSize={24} />)}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
