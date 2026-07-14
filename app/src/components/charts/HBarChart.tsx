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
}: {
  data: HBarDatum[];
  valueLabel?: string;
  color?: ChartRole;
  formatValue?: (value: number) => string;
  ariaLabel: string;
}) {
  const theme = useChartTheme();
  if (!data.length) return <div className="chart-empty">No chart data available.</div>;
  const height = Math.max(260, data.length * 33 + 50);

  return (
    <div className="chart-scroll" role="img" aria-label={ariaLabel}>
      <div className="chart-min-width" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 56, left: 10, bottom: 4 }}>
            <CartesianGrid stroke={theme.grid} horizontal={false} />
            <XAxis type="number" tick={{ fill: theme.axis, fontSize: 9 }} tickLine={false} axisLine={{ stroke: theme.grid }} tickFormatter={formatValue} />
            <YAxis type="category" dataKey="name" width={155} tick={{ fill: theme.axis, fontSize: 9 }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip formatter={(value) => formatValue(Number(value))} />} />
            <Bar dataKey="value" name={valueLabel} fill={theme[color]} radius={[0, 6, 6, 0]} maxBarSize={18}>
              {data.map((entry) => <Cell fill={theme[entry.tone ?? color]} key={entry.name} />)}
              <LabelList dataKey="value" position="right" formatter={(value: number) => formatValue(value)} fill={theme.axis} fontSize={9} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
