"use client";

import type { KeyboardEvent } from "react";
import { CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { useChartTheme } from "./theme";

type RankPoint = { variable: string; statRank: number; shapRank: number; strong: boolean };
type ScatterPayload = { payload?: RankPoint };

function RankTooltip({ active, payload }: { active?: boolean; payload?: ScatterPayload[] }) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="chart-tooltip">
      <div className="tooltip-label">{point.variable}</div>
      <div className="tooltip-row"><span>Stat rank</span><strong>#{point.statRank}</strong></div>
      <div className="tooltip-row"><span>SHAP rank</span><strong>#{point.shapRank}</strong></div>
    </div>
  );
}

export function RankScatter({ data, selectedVariable, onSelect }: { data: RankPoint[]; selectedVariable?: string; onSelect?: (variable: string, mode: "push" | "replace") => void }) {
  const theme = useChartTheme();
  const strong = data.filter((item) => item.strong);
  const under = data.filter((item) => !item.strong);
  const handleClick = (entry: unknown) => {
    if (!onSelect || !entry || typeof entry !== "object") return;
    const candidate = "payload" in entry ? entry.payload : entry;
    if (candidate && typeof candidate === "object" && "variable" in candidate && typeof candidate.variable === "string") onSelect(candidate.variable, "push");
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!onSelect || !data.length) return;
    const currentIndex = data.findIndex((item) => item.variable === selectedVariable);
    let nextIndex = Math.max(0, currentIndex);

    if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = currentIndex < 0 ? 0 : Math.min(data.length - 1, currentIndex + 1);
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = currentIndex < 0 ? data.length - 1 : Math.max(0, currentIndex - 1);
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = data.length - 1;
    else if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onSelect(data[nextIndex].variable, "replace");
  };
  return (
    <div
      className={`chart-scroll${onSelect ? " chart-interactive" : ""}`}
      role={onSelect ? "group" : "img"}
      aria-label={`Scatter plot comparing statistical rank on the x-axis and SHAP rank on the y-axis; the diagonal indicates perfect agreement${onSelect ? ". Use arrow keys, Home, or End to change the selected feature." : ""}`}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
    >
      <div className="chart-min-width">
        <ResponsiveContainer width="100%" height={430}>
          <ScatterChart margin={{ top: 18, right: 18, left: 0, bottom: 18 }}>
            <CartesianGrid stroke={theme.grid} />
            <XAxis type="number" dataKey="statRank" name="Stat rank" domain={[1, 21]} reversed tick={{ fill: theme.axis, fontSize: 11 }} tickLine={false} axisLine={{ stroke: theme.grid }} label={{ value: "Statistical rank (1 = strongest)", position: "insideBottom", offset: -12, fill: theme.axis, fontSize: 11 }} />
            <YAxis type="number" dataKey="shapRank" name="SHAP rank" domain={[1, 21]} reversed tick={{ fill: theme.axis, fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: "SHAP rank", angle: -90, position: "insideLeft", fill: theme.axis, fontSize: 11 }} />
            <ZAxis range={[70, 70]} />
            <ReferenceLine segment={[{ x: 1, y: 1 }, { x: 21, y: 21 }]} stroke={theme.axis} strokeDasharray="5 5" />
            <Tooltip content={<RankTooltip />} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter name="Strong Agreement" data={strong} fill={theme.accent} onClick={handleClick} cursor={onSelect ? "pointer" : undefined}>
              {strong.map((point) => <Cell key={point.variable} fill={theme.accent} fillOpacity={selectedVariable && selectedVariable !== point.variable ? 0.32 : 1} stroke={selectedVariable === point.variable ? theme.red : "transparent"} strokeWidth={selectedVariable === point.variable ? 2 : 0} />)}
            </Scatter>
            <Scatter name="Under-represented" data={under} fill={theme.cyan} shape="diamond" onClick={handleClick} cursor={onSelect ? "pointer" : undefined}>
              {under.map((point) => <Cell key={point.variable} fill={theme.cyan} fillOpacity={selectedVariable && selectedVariable !== point.variable ? 0.32 : 1} stroke={selectedVariable === point.variable ? theme.red : "transparent"} strokeWidth={selectedVariable === point.variable ? 2 : 0} />)}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
