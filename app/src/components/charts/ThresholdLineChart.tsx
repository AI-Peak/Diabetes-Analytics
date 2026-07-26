"use client";

import type { KeyboardEvent } from "react";
import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltip } from "./Tooltip";
import { useChartTheme } from "./theme";

export function ThresholdLineChart({ data, currentT, onSelectT }: { data: { t: number; precision: number; recall: number }[]; currentT: number; onSelectT?: (threshold: number, mode: "push" | "replace") => void }) {
  const theme = useChartTheme();
  const handleClick = (state: unknown) => {
    if (!onSelectT || !state || typeof state !== "object" || !("activeLabel" in state)) return;
    const value = Number(state.activeLabel);
    if (Number.isFinite(value)) onSelectT(value, "push");
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelectT || !data.length) return;
    const currentIndex = Math.max(0, data.findIndex((item) => item.t === currentT));
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight" || event.key === "ArrowUp") nextIndex = Math.min(data.length - 1, currentIndex + 1);
    else if (event.key === "ArrowLeft" || event.key === "ArrowDown") nextIndex = Math.max(0, currentIndex - 1);
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = data.length - 1;
    else if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onSelectT(data[nextIndex].t, "replace");
  };
  return (
    <div
      className={`chart-scroll${onSelectT ? " chart-interactive" : ""}`}
      role={onSelectT ? "group" : "img"}
      aria-label={`Precision and recall across decision thresholds with the selected threshold marked${onSelectT ? ". Use arrow keys, Home, or End to change the threshold." : ""}`}
      tabIndex={onSelectT ? 0 : undefined}
      onKeyDown={onSelectT ? handleKeyDown : undefined}
    >
      <div className="chart-min-width">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 8, right: 14, left: 0, bottom: 8 }} onClick={handleClick} style={{ cursor: onSelectT ? "crosshair" : "default" }}>
            <CartesianGrid stroke={theme.grid} vertical={false} />
            <XAxis dataKey="t" tick={{ fill: theme.axis, fontSize: 13 }} tickFormatter={(value: number) => value.toFixed(2)} tickLine={false} axisLine={{ stroke: theme.grid }} />
            <YAxis domain={[0, 1]} tick={{ fill: theme.axis, fontSize: 13 }} tickFormatter={(value: number) => `${Math.round(value * 100)}%`} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip formatter={(value) => `${(Number(value) * 100).toFixed(1)}%`} />} />
            <Legend wrapperStyle={{ fontSize: 13, color: theme.axis }} />
            <ReferenceLine x={currentT} stroke={theme.red} strokeDasharray="4 4" label={{ value: `t=${currentT.toFixed(2)}`, fill: theme.red, fontSize: 13, position: "insideTopRight" }} />
            <Line type="monotone" dataKey="precision" name="Precision" stroke={theme.cyan} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
            <Line type="monotone" dataKey="recall" name="Recall" stroke={theme.red} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
