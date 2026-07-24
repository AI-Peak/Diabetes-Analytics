"use client";

import { useMemo } from "react";
import { ChartCard, DataTable, RadioGroup, StatBadge, type TableColumn } from "@/components/primitives";
import type { Rq2Data } from "@/lib/data/schemas";
import { fmtPct } from "@/lib/format";
import { useUrlState } from "@/lib/use-url-state";

type ModelResult = Rq2Data["models"][number];
type MetricKey = "accuracy" | "precision" | "recall" | "f1" | "rocAuc" | "prAuc";

const METRICS: { value: MetricKey; label: string }[] = [
  { value: "prAuc", label: "PR-AUC" },
  { value: "rocAuc", label: "ROC-AUC" },
  { value: "recall", label: "Recall" },
  { value: "precision", label: "Precision" },
  { value: "f1", label: "F1" },
  { value: "accuracy", label: "Accuracy" },
];

function metricLabel(metric: MetricKey) {
  return METRICS.find((item) => item.value === metric)?.label ?? metric;
}

function formatMetric(metric: MetricKey, value: number) {
  if (metric === "accuracy" || metric === "precision" || metric === "recall") return fmtPct(value);
  return value.toFixed(3);
}

export function ModelExplorer({ data }: { data: Rq2Data }) {
  const initial = data.models.find((model) => model.isBest) ?? data.models[0];
  const [metric, setMetric] = useUrlState<MetricKey>("metric", "prAuc", (value) => METRICS.some((item) => item.value === value));
  const [selectedName, setSelectedName] = useUrlState<string>("model", initial.name, (value) => data.models.some((model) => model.name === value));
  const selected = data.models.find((model) => model.name === selectedName) ?? initial;

  const ranked = useMemo(() => data.models.toSorted((a, b) => b[metric] - a[metric]), [data.models, metric]);
  const rankOf = (row: ModelResult) => ranked.findIndex((model) => model.name === row.name) + 1;

  // The active metric column is emphasised so the ranking order stays readable without a second chart.
  const cell = (key: MetricKey, row: ModelResult) => {
    const text = formatMetric(key, row[key]);
    return key === metric ? <strong>{text}</strong> : text;
  };

  const columns: TableColumn<ModelResult>[] = [
    { id: "rank", header: "#", render: (row) => <span className="num">{rankOf(row)}</span> },
    { id: "model", header: "Model", render: (row) => <span><strong>{row.name}</strong>{row.isBest ? <> <StatBadge label="best PR-AUC" tone="best" /></> : null}</span> },
    { id: "accuracy", header: "Accuracy", align: "right", render: (row) => cell("accuracy", row) },
    { id: "precision", header: "Precision", align: "right", render: (row) => cell("precision", row) },
    { id: "recall", header: "Recall", align: "right", render: (row) => cell("recall", row) },
    { id: "f1", header: "F1", align: "right", render: (row) => cell("f1", row) },
    { id: "roc", header: "ROC-AUC", align: "right", render: (row) => cell("rocAuc", row) },
    { id: "pr", header: "PR-AUC", align: "right", render: (row) => cell("prAuc", row) },
  ];

  const prRank = data.models.toSorted((a, b) => b.prAuc - a.prAuc).findIndex((model) => model.name === selected.name) + 1;

  return (
    <div className="analysis-workbench">
      <div className="control-row">
        <RadioGroup label="Rank by metric" value={metric} options={METRICS} onChange={(value) => setMetric(value as MetricKey)} />
      </div>

      <ChartCard
        title={`Model scorecard, ranked by ${metricLabel(metric)}`}
        subtitle="Change the metric to re-rank the table, then click a row to select a model. All four models are shown at threshold 0.50."
        source="results/modeling/cv_model_comparison.csv"
        action={<StatBadge label={`selected · ${selected.name}`} tone={selected.isBest ? "best" : "moderate"} />}
      >
        <DataTable
          rows={ranked}
          columns={columns}
          rowKey={(row) => row.name}
          rowClassName={(row) => row.isBest ? "winner-row" : ""}
          selectedRowKey={selected.name}
          onRowClick={(row) => setSelectedName(row.name)}
          caption="Interactive comparison of four machine-learning models at threshold 0.50"
        />
        <p className="interaction-hint" aria-live="polite">
          <strong>{selected.name}</strong>{" "}
          {selected.isBest
            ? `holds the highest PR-AUC in the four-model comparison and was carried forward to threshold selection.`
            : `ranks #${prRank} by PR-AUC, the primary selection metric, so it was not carried forward.`}{" "}
          Ranked #{rankOf(selected)} of {ranked.length} by {metricLabel(metric)}.
        </p>
      </ChartCard>
    </div>
  );
}
