import type { Metadata } from "next";
import Image from "next/image";
import { GroupedBar, type GroupedDatum } from "@/components/charts";
import { ThresholdExplorer } from "@/components/ThresholdExplorer";
import { Callout, ChartCard, DataTable, KpiCard, PageHead, Reveal, Section, StatBadge, type TableColumn } from "@/components/primitives";
import { loadRq2 } from "@/lib/data/load";
import type { Rq2Data } from "@/lib/data/schemas";
import { fmtPct } from "@/lib/format";

export const metadata: Metadata = { title: "RQ2 · Model & Threshold" };

export default function Rq2Page() {
  const data = loadRq2();
  const winner = data.models.find((model) => model.isBest) ?? data.models[0];
  const modelColumns: TableColumn<Rq2Data["models"][number]>[] = [
    { id: "model", header: "Model", render: (row) => <span><strong>{row.name}</strong>{row.isBest ? <> <StatBadge label="best PR-AUC" tone="best" /></> : null}</span> },
    { id: "accuracy", header: "Accuracy", align: "right", render: (row) => fmtPct(row.accuracy) },
    { id: "precision", header: "Precision", align: "right", render: (row) => fmtPct(row.precision) },
    { id: "recall", header: "Recall", align: "right", render: (row) => fmtPct(row.recall) },
    { id: "f1", header: "F1", align: "right", render: (row) => row.f1.toFixed(3) },
    { id: "roc", header: "ROC-AUC", align: "right", render: (row) => row.rocAuc.toFixed(3) },
    { id: "pr", header: "PR-AUC", align: "right", render: (row) => row.prAuc.toFixed(3) },
  ];
  const chartData: GroupedDatum[] = data.models.map((model) => ({ name: model.name.replace("Logistic Regression", "Logistic"), rocAuc: model.rocAuc, prAuc: model.prAuc }));

  return (
    <div className="page">
      <Reveal>
        <PageHead
          eyebrow="RQ2 · Prediction"
          title="Which model is reliable on imbalanced data—and which threshold suits screening?"
          subtitle="Four offline-trained classifiers are compared with minority-aware metrics, then XGBoost's decision threshold is tuned for a recall-first screening context."
          meta={["4 models", "PR-AUC", "Recall-first"]}
        />
      </Reveal>

      <Section label="Model & screening summary" source="rq2.json">
        <div className="kpi-grid">
          <KpiCard label="Winner" value={winner.name} note={`PR-AUC ${winner.prAuc.toFixed(3)} · highest of four`} tone="accent" />
          <KpiCard label="Accuracy @ 0.50" value={fmtPct(data.highlights.default.accuracy)} note={`Recall ${fmtPct(data.highlights.default.recall)}`} />
          <KpiCard label="Recall @ 0.15" value={fmtPct(data.highlights.optimized.recall)} note={`${data.highlights.optimized.cm.fn.toLocaleString("en-US")} false negatives`} tone="risk" />
          <KpiCard label="F1 @ 0.15" value={data.highlights.optimized.f1.toFixed(3)} note={`vs ${data.highlights.default.f1.toFixed(3)} at t=0.50`} tone="accent" />
        </div>
      </Section>

      <Section label="Model comparison" source="results/modeling/model_comparison.csv">
        <div className="two-col-wide">
          <ChartCard title="Four-model scorecard" subtitle="XGBoost is highlighted because PR-AUC is the primary selection metric for the 15.3% minority class." source="model_comparison.csv">
            <DataTable rows={data.models} columns={modelColumns} rowKey={(row) => row.name} rowClassName={(row) => row.isBest ? "winner-row" : ""} caption="Comparison of four machine-learning models at threshold 0.50" />
            <div className="section-block"><Callout variant="warn"><strong>Why PR-AUC?</strong> A classifier can appear accurate by favoring the 84.7% healthy majority. PR-AUC focuses evaluation on positive-case retrieval and precision.</Callout></div>
          </ChartCard>
          <ChartCard title="ROC-AUC vs PR-AUC" subtitle="The gap between ROC and precision-recall performance makes class imbalance visible." source="model_comparison.csv">
            <GroupedBar data={chartData} series={[{ key: "rocAuc", label: "ROC-AUC", color: "accent" }, { key: "prAuc", label: "PR-AUC", color: "red" }]} ariaLabel="Grouped bars comparing ROC-AUC and PR-AUC across four models" />
          </ChartCard>
        </div>
      </Section>

      <Section label="Interactive threshold explorer" source="results/modeling/threshold_analysis.csv">
        <ThresholdExplorer data={data} />
      </Section>

      <Section label="Exported evaluation curves" source="results/modeling">
        <div className="chart-pair">
          <ChartCard title="ROC curves" subtitle="Curve-point data is not available, so this verified offline export is shown directly." source="public/figures/roc_curves.png">
            <figure><div className="figure-frame"><Image src="/figures/roc_curves.png" alt="ROC curves comparing Logistic Regression, Decision Tree, Random Forest, and XGBoost" width={1200} height={900} sizes="(max-width: 920px) 100vw, 45vw" /></div><figcaption className="figure-caption">Exported figure · roc_curves.png</figcaption></figure>
          </ChartCard>
          <ChartCard title="Precision–recall curves" subtitle="PR curves are the more informative view for the diabetic minority class." source="public/figures/pr_curves.png">
            <figure><div className="figure-frame"><Image src="/figures/pr_curves.png" alt="Precision-recall curves comparing four classification models" width={1200} height={900} sizes="(max-width: 920px) 100vw, 45vw" /></div><figcaption className="figure-caption">Exported figure · pr_curves.png</figcaption></figure>
          </ChartCard>
        </div>
      </Section>
    </div>
  );
}
