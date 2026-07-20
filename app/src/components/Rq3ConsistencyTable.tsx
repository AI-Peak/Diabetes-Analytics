"use client";

import { useMemo, useState } from "react";
import { DataTable, Select, StatBadge, type TableColumn } from "@/components/primitives";
import type { FeatureResult } from "@/lib/data/schemas";

const notable = new Set(["BMI", "Age", "DiffWalk"]);

export function Rq3ConsistencyTable({ features }: { features: FeatureResult[] }) {
  const [sort, setSort] = useState("shapRank");
  const rows = useMemo(() => features.toSorted((a, b) => {
    if (sort === "statRank") return a.statRank - b.statRank;
    if (sort === "gap") return Math.abs(b.shapRank - b.statRank) - Math.abs(a.shapRank - a.statRank);
    return a.shapRank - b.shapRank;
  }).slice(0, 12), [features, sort]);

  const columns: TableColumn<FeatureResult>[] = [
    { id: "feature", header: "Feature", render: (row) => <><strong>{row.variable}</strong><br /><span className="card-source">{row.label}</span></> },
    { id: "shap", header: "mean|SHAP|", align: "right", render: (row) => row.shapImportance.toFixed(3) },
    { id: "shapRank", header: "SHAP rank", align: "right", render: (row) => `#${row.shapRank}` },
    { id: "statRank", header: "Stat rank", align: "right", render: (row) => `#${row.statRank}` },
    { id: "effect", header: "Effect size", align: "right", render: (row) => <>{row.effectSize.toFixed(3)}<br /><span className="card-source">{row.effectSizeType}</span></> },
    { id: "group", header: "Consistency", render: (row) => <StatBadge label={row.group} tone={row.group.startsWith("Group 1") ? "moderate" : (row.group.startsWith("Group 2") ? "neutral" : (row.group.startsWith("Group 3") ? "best" : "risk"))} /> },
  ];

  return (
    <>
      <div className="control-row">
        <Select
          label="Sort top 12 by"
          value={sort}
          options={[{ value: "shapRank", label: "SHAP rank" }, { value: "statRank", label: "Statistical rank" }, { value: "gap", label: "Largest rank gap" }]}
          onChange={setSort}
        />
      </div>
      <DataTable rows={rows} columns={columns} rowKey={(row) => row.variable} rowClassName={(row) => notable.has(row.variable) ? "clash-row" : ""} caption="Top twelve features comparing SHAP and statistical ranks" />
    </>
  );
}
