"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "./Tooltip";
import { type ChartRole, useChartTheme } from "./theme";

export type GroupedDatum = { name: string } & Record<string, string | number>;

type GroupedBarHoverState = {
  activeLabel?: unknown;
  isTooltipActive?: boolean;
};

export function GroupedBar({
  data,
  series,
  formatValue = (value) => value.toFixed(3),
  ariaLabel,
  minWidthClass = "chart-min-width",
  showValues = false,
}: {
  data: GroupedDatum[];
  series: { key: string; label: string; color: ChartRole }[];
  formatValue?: (value: number) => string;
  ariaLabel: string;
  minWidthClass?: string;
  showValues?: boolean;
}) {
  const theme = useChartTheme();
  const [hoveredBar, setHoveredBar] = useState<string>();
  const [hoveredGroup, setHoveredGroup] = useState<string>();
  if (!data.length) return <div className="chart-empty">No chart data available.</div>;

  return (
    <div className="chart-scroll" role="img" aria-label={ariaLabel}>
      <div className={minWidthClass}>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={data}
            margin={{ top: showValues ? 30 : 10, right: 12, left: 0, bottom: 12 }}
            onMouseMove={(state: GroupedBarHoverState) => {
              const label = state.isTooltipActive ? state.activeLabel : undefined;
              setHoveredGroup(typeof label === "string" ? label : undefined);
            }}
            onMouseLeave={() => {
              setHoveredBar(undefined);
              setHoveredGroup(undefined);
            }}
          >
            <CartesianGrid stroke={theme.grid} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: theme.axis, fontSize: 13 }} tickLine={false} axisLine={{ stroke: theme.grid }} />
            <YAxis domain={[0, 1]} tick={{ fill: theme.axis, fontSize: 13 }} tickLine={false} axisLine={false} tickFormatter={formatValue} />
            <Tooltip content={<ChartTooltip formatter={(value) => formatValue(Number(value))} />} />
            <Legend wrapperStyle={{ fontSize: 13, color: theme.axis }} />
            {series.map((item) => (
              <Bar dataKey={item.key} fill={theme[item.color]} key={item.key} name={item.label} radius={[4, 4, 0, 0]} maxBarSize={24}>
                {data.map((datum) => {
                  const barId = `${datum.name}:${item.key}`;
                  return (
                    <Cell
                      key={barId}
                      fill={theme[item.color]}
                      onMouseEnter={() => setHoveredBar(barId)}
                      onMouseLeave={() => setHoveredBar(undefined)}
                    />
                  );
                })}
                {showValues ? (
                  <LabelList
                    dataKey={item.key}
                    content={({ x, y, width, value, index }) => {
                      const datum = typeof index === "number" ? data[index] : undefined;
                      const barId = datum ? `${datum.name}:${item.key}` : undefined;
                      return (
                        <text
                          x={Number(x) + Number(width) / 2}
                          y={Number(y) - 8}
                          textAnchor="middle"
                          fill={barId === hoveredBar || datum?.name === hoveredGroup ? "#000000" : theme.label}
                          fontSize={13}
                        >
                          {formatValue(Number(value))}
                        </text>
                      );
                    }}
                  />
                ) : null}
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
