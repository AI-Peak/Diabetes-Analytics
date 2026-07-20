"use client";

import { useMemo, useState } from "react";
import { HBarChart } from "@/components/charts";
import { ChartCard, DataTable, RadioGroup, StatBadge, type TableColumn } from "@/components/primitives";
import type { Rq2Data } from "@/lib/data/schemas";
import { fmtPct } from "@/lib/format";

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
  const [metric, setMetric] = useState<MetricKey>("prAuc");
  const [selectedName, setSelectedName] = useState(initial.name);
  const selected = data.models.find((model) => model.name === selectedName) ?? initial;

  const ranked = useMemo(() => data.models.toSorted((a, b) => b[metric] - a[metric]), [data.models, metric]);
  const columns: TableColumn<ModelResult>[] = [
    { id: "model", header: "Model", render: (row) => <span><strong>{row.name}</strong>{row.isBest ? <> <StatBadge label="best PR-AUC" tone="best" /></> : null}</span> },
    { id: "accuracy", header: "Accuracy", align: "right", render: (row) => fmtPct(row.accuracy) },
    { id: "precision", header: "Precision", align: "right", render: (row) => fmtPct(row.precision) },
    { id: "recall", header: "Recall", align: "right", render: (row) => fmtPct(row.recall) },
    { id: "f1", header: "F1", align: "right", render: (row) => row.f1.toFixed(3) },
    { id: "roc", header: "ROC-AUC", align: "right", render: (row) => row.rocAuc.toFixed(3) },
    { id: "pr", header: "PR-AUC", align: "right", render: (row) => row.prAuc.toFixed(3) },
  ];

  return (
    <div className="analysis-workbench">
      <div className="control-row">
        <RadioGroup label="Comparison metric" value={metric} options={METRICS} onChange={(value) => setMetric(value as MetricKey)} />
      </div>

      <div className="workbench-grid">
        <ChartCard
          title={`Model ranking by ${metricLabel(metric)}`}
          subtitle="Change the metric, then click a bar. The selected model profile and scorecard row update together."
          source="results/modeling/cv_model_comparison.csv"
          action={<StatBadge label={`selected · ${selected.name}`} tone={selected.isBest ? "best" : "moderate"} />}
        >
          <HBarChart
            data={ranked.map((model) => ({
              name: model.name,
              value: model[metric],
              detail: `${metricLabel(metric)} · ${formatMetric(metric, model[metric])}`,
              tone: model.name === selected.name ? "accent" : model.isBest ? "cyan" : "blue",
            }))}
            valueLabel={metricLabel(metric)}
            selectedName={selected.name}
            onSelect={(datum) => setSelectedName(datum.name)}
            formatValue={(value) => formatMetric(metric, value)}
            ariaLabel={`Four models ranked by ${metricLabel(metric)}`}
          />
        </ChartCard>

        <ChartCard
          title="Selected model profile"
          subtitle="One model selection drives all six evaluation metrics."
          source="cv_model_comparison.csv · selected row"
        >
          <div className="selection-panel">
            <span className="eyebrow">Current model</span>
            <h3>{selected.name}</h3>
            <p>{selected.isBest ? "Highest PR-AUC in the four-model comparison." : `PR-AUC rank #${data.models.toSorted((a, b) => b.prAuc - a.prAuc).findIndex((model) => model.name === selected.name) + 1}.`}</p>
          </div>
          <div className="metric-strip metric-strip-compact" aria-live="polite">
            <div className="metric-mini"><span>Accuracy</span><strong>{fmtPct(selected.accuracy)}</strong></div>
            <div className="metric-mini"><span>Precision</span><strong>{fmtPct(selected.precision)}</strong></div>
            <div className="metric-mini"><span>Recall</span><strong>{fmtPct(selected.recall)}</strong></div>
            <div className="metric-mini"><span>F1</span><strong>{selected.f1.toFixed(3)}</strong></div>
            <div className="metric-mini"><span>ROC-AUC</span><strong>{selected.rocAuc.toFixed(3)}</strong></div>
            <div className="metric-mini"><span>PR-AUC</span><strong>{selected.prAuc.toFixed(3)}</strong></div>
          </div>
        </ChartCard>
      </div>

      <div className="section-block compact-section">
        <DataTable
          rows={data.models}
          columns={columns}
          rowKey={(row) => row.name}
          rowClassName={(row) => row.isBest ? "winner-row" : ""}
          selectedRowKey={selected.name}
          onRowClick={(row) => setSelectedName(row.name)}
          caption="Interactive comparison of four machine-learning models at threshold 0.50"
        />
      </div>
    </div>
  );
}
