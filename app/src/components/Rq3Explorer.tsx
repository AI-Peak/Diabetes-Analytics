"use client";

import { useEffect, useMemo, useState } from "react";
import { HBarChart, RankScatter } from "@/components/charts";
import { ChartCard, DataTable, RadioGroup, Select, StatBadge, type TableColumn } from "@/components/primitives";
import type { FeatureResult } from "@/lib/data/schemas";

type GroupFilter = "all" | "g1" | "g2" | "g3" | "g4";
type SortKey = "shapRank" | "statRank" | "gap";

function getGroupKey(feature: FeatureResult) {
  if (feature.group.startsWith("Group 1")) return "g1";
  if (feature.group.startsWith("Group 2")) return "g2";
  if (feature.group.startsWith("Group 3")) return "g3";
  return "g4";
}

export function Rq3Explorer({ features }: { features: FeatureResult[] }) {
  const [group, setGroup] = useState<GroupFilter>("all");
  const [sort, setSort] = useState<SortKey>("shapRank");
  const [selectedVariable, setSelectedVariable] = useState(features[0]?.variable ?? "");

  const rows = useMemo(() => features
    .filter((feature) => group === "all" || getGroupKey(feature) === group)
    .toSorted((a, b) => {
      if (sort === "statRank") return a.statRank - b.statRank;
      if (sort === "gap") return Math.abs(b.shapRank - b.statRank) - Math.abs(a.shapRank - a.statRank);
      return a.shapRank - b.shapRank;
    }), [features, group, sort]);

  useEffect(() => {
    if (rows.length && !rows.some((row) => row.variable === selectedVariable)) setSelectedVariable(rows[0].variable);
  }, [rows, selectedVariable]);

  const selected = features.find((feature) => feature.variable === selectedVariable) ?? rows[0] ?? features[0];
  const rankGap = Math.abs(selected.shapRank - selected.statRank);
  const columns: TableColumn<FeatureResult>[] = [
    { id: "feature", header: "Feature", render: (row) => <><strong>{row.variable}</strong><br /><span className="card-source">{row.label}</span></> },
    { id: "shap", header: "mean|SHAP|", align: "right", render: (row) => row.shapImportance.toFixed(3) },
    { id: "shapRank", header: "SHAP rank", align: "right", render: (row) => `#${row.shapRank}` },
    { id: "statRank", header: "Stat rank", align: "right", render: (row) => `#${row.statRank}` },
    { id: "gap", header: "Rank gap", align: "right", render: (row) => String(Math.abs(row.shapRank - row.statRank)) },
    { id: "effect", header: "Effect size", align: "right", render: (row) => <>{row.effectSize.toFixed(3)}<br /><span className="card-source">{row.effectSizeType}</span></> },
    { id: "group", header: "Consistency", render: (row) => <StatBadge label={row.group} tone={row.group.startsWith("Group 1") ? "moderate" : (row.group.startsWith("Group 2") ? "neutral" : (row.group.startsWith("Group 3") ? "best" : "risk"))} /> },
  ];

  return (
    <div className="analysis-workbench">
      <div className="control-row">
        <RadioGroup
          label="Consistency group"
          value={group}
          options={[
            { value: "all", label: "All features" },
            { value: "g1", label: "Group 1 (Consistent)" },
            { value: "g2", label: "Group 2 (Meaningful Marginal)" },
            { value: "g3", label: "Group 3 (Model Salient)" },
            { value: "g4", label: "Group 4 (Weak Evidence)" },
          ]}
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
          <h3>{selected.variable}</h3>
          <p>{selected.label} · {selected.group}.</p>
        </div>
        <div className="metric-strip metric-strip-compact">
          <div className="metric-mini"><span>mean|SHAP|</span><strong>{selected.shapImportance.toFixed(3)}</strong></div>
          <div className="metric-mini"><span>SHAP rank</span><strong>#{selected.shapRank}</strong></div>
          <div className="metric-mini"><span>Stat rank</span><strong>#{selected.statRank}</strong></div>
          <div className="metric-mini"><span>Rank gap</span><strong>{rankGap}</strong></div>
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
              detail: `${feature.label} · SHAP #${feature.shapRank} · Stat #${feature.statRank}`,
              tone: feature.group.startsWith("Group 1") ? "accent" : (feature.group.startsWith("Group 2") ? "cyan" : "orange"),
            }))}
            valueLabel="mean|SHAP|"
            selectedName={selected.variable}
            onSelect={(datum) => setSelectedVariable(datum.name)}
            ariaLabel="Feature importance ranking linked to the selected feature profile"
          />
        </ChartCard>

        <ChartCard
          title="Rank agreement map"
          subtitle="Click a point to link the scatter, profile, bar ranking and table selection."
          source="explanation_consistency.csv · SHAP and statistical ranks"
        >
          <RankScatter
            data={rows.map((feature) => ({ variable: feature.variable, statRank: feature.statRank, shapRank: feature.shapRank, strong: feature.group.startsWith("Group 1") }))}
            selectedVariable={selected.variable}
            onSelect={setSelectedVariable}
          />
        </ChartCard>
      </div>

      <div className="section-block compact-section">
        <DataTable
          rows={rows}
          columns={columns}
          rowKey={(row) => row.variable}
          rowClassName={(row) => ["BMI", "Age", "DiffWalk"].includes(row.variable) ? "clash-row" : ""}
          selectedRowKey={selected.variable}
          onRowClick={(row) => setSelectedVariable(row.variable)}
          stickyHeader
          caption="Interactive feature table comparing SHAP and statistical ranks"
        />
      </div>
    </div>
  );
}
