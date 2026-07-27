"use client";

import type { KeyboardEvent } from "react";
import { CartesianGrid, Cell, LabelList, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { useChartTheme } from "./theme";

type RankPoint = { variable: string; statRank: number; shapRank: number; group: 1 | 2 | 3 | 4 };
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
  const groups = [
    { group: 1 as const, name: "G1 · Consistent", color: theme.green, shape: "circle" as const },
    { group: 2 as const, name: "G2 · Lower model salience", color: theme.blue, shape: "square" as const },
    { group: 3 as const, name: "G3 · Model-salient", color: theme.orange, shape: "triangle" as const },
    { group: 4 as const, name: "G4 · Weak", color: theme.axis, shape: "diamond" as const },
  ];
  const handleClick = (entry: unknown) => {
    if (!onSelect || !entry || typeof entry !== "object") return;
    const candidate = "payload" in entry ? entry.payload : entry;
    if (candidate && typeof candidate === "object" && "variable" in candidate && typeof candidate.variable === "string") {
      onSelect(candidate.variable, "push");
    }
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
      aria-label={`Scatter plot comparing statistical rank on the x-axis and SHAP rank on the y-axis, with points colored and shaped by four consistency groups; the diagonal indicates perfect agreement${onSelect ? ". Use arrow keys, Home, or End to change the selected feature." : ""}`}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={onSelect ? handleKeyDown : undefined}
    >
      <div className="chart-min-width">
        <ResponsiveContainer width="100%" height={430}>
          <ScatterChart margin={{ top: 34, right: 18, left: 0, bottom: 18 }}>
            <CartesianGrid stroke={theme.grid} />
            <XAxis type="number" dataKey="statRank" name="Stat rank" domain={[1, 21]} reversed tick={{ fill: theme.axis, fontSize: 13 }} tickLine={false} axisLine={{ stroke: theme.grid }} label={{ value: "Statistical rank (1 = strongest)", position: "insideBottom", offset: -12, fill: theme.axis, fontSize: 13 }} />
            <YAxis type="number" dataKey="shapRank" name="SHAP rank" domain={[1, 21]} reversed tick={{ fill: theme.axis, fontSize: 13 }} tickLine={false} axisLine={false} label={{ value: "SHAP rank", angle: -90, position: "insideLeft", fill: theme.axis, fontSize: 13 }} />
            <ZAxis range={[120, 120]} />
            <ReferenceLine segment={[{ x: 1, y: 1 }, { x: 21, y: 21 }]} stroke={theme.axis} strokeDasharray="5 5" />
            <Tooltip content={<RankTooltip />} cursor={{ strokeDasharray: "3 3" }} />
            {groups.map((series) => {
              const points = data.filter((point) => point.group === series.group);
              return (
                <Scatter key={series.group} name={series.name} data={points} fill={series.color} shape={series.shape} onClick={handleClick} cursor={onSelect ? "pointer" : undefined}>
                  {points.map((point) => <Cell key={point.variable} fill={series.color} fillOpacity={selectedVariable && selectedVariable !== point.variable ? 0.32 : 1} stroke={selectedVariable === point.variable ? theme.red : "transparent"} strokeWidth={selectedVariable === point.variable ? 2 : 0} />)}
                  <LabelList dataKey="variable" position="top" offset={7} fill={theme.label} fontSize={10.5} fontWeight={400} />
                </Scatter>
              );
            })}
          </ScatterChart>
        </ResponsiveContainer>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px 18px", padding: "4px 12px 2px", color: theme.axis, fontSize: 13 }} aria-label="Consistency group legend">
          {groups.map((series) => (
            <span key={series.group} style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
              <span
                aria-hidden="true"
                style={{
                  width: 10,
                  height: 10,
                  flex: "0 0 auto",
                  background: series.color,
                  borderRadius: series.shape === "circle" ? "50%" : 0,
                  clipPath: series.shape === "triangle" ? "polygon(50% 0, 100% 100%, 0 100%)" : undefined,
                  transform: series.shape === "diamond" ? "rotate(45deg)" : undefined,
                }}
              />
              {series.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
