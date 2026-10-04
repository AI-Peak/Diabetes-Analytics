"use client";

import { useEffect, useMemo } from "react";
import { HBarChart, RankScatter } from "@/components/charts";
import { ChartCard, RadioGroup, Select, StatBadge } from "@/components/primitives";
import type { FeatureResult } from "@/lib/data/schemas";
import { useUrlState } from "@/lib/use-url-state";

type GroupFilter = "all" | "g1" | "g2" | "g3" | "g4";
type SortKey = "shapRank" | "statRank" | "gap";

const groupOptions: { value: GroupFilter; label: string }[] = [
  { value: "all", label: "All features" },
  { value: "g1", label: "Group 1 (Consistent)" },
  { value: "g2", label: "Group 2 (Meaningful Marginal)" },
  { value: "g3", label: "Group 3 (Model Salient)" },
  { value: "g4", label: "Group 4 (Weak Evidence)" },
];

function getGroupNumber(feature: FeatureResult): 1 | 2 | 3 | 4 {
  const parsed = Number(/^Group (\d)/.exec(feature.group)?.[1]);
  return parsed === 1 || parsed === 2 || parsed === 3 ? parsed : 4;
}

function getGroupKey(feature: FeatureResult): Exclude<GroupFilter, "all"> {
  return `g${getGroupNumber(feature)}`;
}

export function Rq3Explorer({ features }: { features: FeatureResult[] }) {
  const [group, setGroup] = useUrlState<GroupFilter>("group", "all", (value) => groupOptions.some((option) => option.value === value));
  const [sort, setSort] = useUrlState<SortKey>("sort", "shapRank", (value) => value === "shapRank" || value === "statRank" || value === "gap");
  const [selectedVariable, setSelectedVariable] = useUrlState<string>("feature", "", (value) => features.some((feature) => feature.variable === value));

  const rows = useMemo(() => features
    .filter((feature) => group === "all" || getGroupKey(feature) === group)
    .toSorted((a, b) => {
      if (sort === "statRank") return a.statRank - b.statRank;
      if (sort === "gap") return Math.abs(b.shapRank - b.statRank) - Math.abs(a.shapRank - a.statRank);
      return a.shapRank - b.shapRank;
    }), [features, group, sort]);

  useEffect(() => {
    if (selectedVariable && !rows.some((row) => row.variable === selectedVariable)) setSelectedVariable("", "replace");
  }, [rows, selectedVariable, setSelectedVariable]);

  const selected = features.find((feature) => feature.variable === selectedVariable);
  const toggleSelectedVariable = (variable: string, mode: "push" | "replace" = "push") => {
    setSelectedVariable(selectedVariable === variable ? "" : variable, mode);
  };

  return (
    <div className="analysis-workbench">
      <div className="control-row">
        <RadioGroup
          label="Consistency group"
          value={group}
          options={groupOptions}
          onChange={(value) => setGroup(value as GroupFilter)}
        />
        <Select
          label="Order features by"
          value={sort}
          options={[
            { value: "shapRank", label: "SHAP rank" },
            { value: "statRank", label: "Statistical rank" },
            { value: "gap", label: "Largest rank gap" },
          ]}
          onChange={(value) => setSort(value as SortKey)}
        />
      </div>

      <div className="feature-profile" aria-live="polite">
        <div className="selection-panel">
          <span className="eyebrow">Selected feature</span>
          <h3>{selected?.variable ?? "None"}</h3>
          <p>{selected ? `${selected.label} · ${selected.group}.` : "Click a bar or a scatter point to inspect a feature."}</p>
        </div>
        <div className="metric-strip metric-strip-compact">
          <div className="metric-mini"><span>mean|SHAP|</span><strong>{selected ? selected.shapImportance.toFixed(3) : "-"}</strong></div>
          <div className="metric-mini"><span>SHAP rank</span><strong>{selected ? `#${selected.shapRank}` : "-"}</strong></div>
          <div className="metric-mini"><span>Stat rank</span><strong>{selected ? `#${selected.statRank}` : "-"}</strong></div>
          <div className="metric-mini"><span>Rank gap</span><strong>{selected ? Math.abs(selected.shapRank - selected.statRank) : "-"}</strong></div>
          <div className="metric-mini metric-mini-wide">
            <span>{selected ? `Effect size · ${selected.effectSizeType}` : "Effect size"}</span>
            <strong>{selected ? selected.effectSize.toFixed(3) : "-"}</strong>
          </div>
        </div>
      </div>

      <div className="workbench-grid workbench-grid-even">
        <ChartCard
          title="Linked SHAP importance ranking"
          subtitle="Filter a consistency group, change the ordering, or click a bar to update the selected feature everywhere."
          source="results/xai/explanation_consistency.csv"
          action={<StatBadge label={`${rows.length} features`} />}
        >
          <HBarChart
            data={rows.map((feature) => ({
              name: feature.variable,
              value: feature.shapImportance,
              detail: `${feature.label} · SHAP #${feature.shapRank} · Stat #${feature.statRank} · ${feature.effectSizeType} ${feature.effectSize.toFixed(3)}`,
              tone: feature.group.startsWith("Group 1") ? "accent" : (feature.group.startsWith("Group 2") ? "cyan" : "orange"),
            }))}
            valueLabel="mean|SHAP|"
            selectedName={selectedVariable || undefined}
            onSelect={(datum, mode) => toggleSelectedVariable(datum.name, mode)}
            ariaLabel="Feature importance ranking linked to the selected feature profile"
          />
        </ChartCard>

        <ChartCard
          title="Rank agreement map"
          subtitle="Distance from the dashed diagonal is the rank gap. Click a point to link the scatter, profile and bar ranking."
          source="explanation_consistency.csv · SHAP and statistical ranks"
        >
          <RankScatter
            data={rows.map((feature) => ({ variable: feature.variable, statRank: feature.statRank, shapRank: feature.shapRank, group: getGroupNumber(feature), effectSize: feature.effectSize, effectSizeType: feature.effectSizeType }))}
            selectedVariable={selectedVariable || undefined}
            onSelect={(variable, mode) => toggleSelectedVariable(variable, mode)}
          />
        </ChartCard>
      </div>
    </div>
  );
}
