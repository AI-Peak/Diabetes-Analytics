import type { Metadata } from "next";
import { ModelExplorer } from "@/components/ModelExplorer";
import { ThresholdExplorer } from "@/components/ThresholdExplorer";
import { Callout, ChartCard, FigureTabs, KpiCard, PageHead, Reveal, Section } from "@/components/primitives";
import { loadRq2 } from "@/lib/data/load";
import { fmtPct } from "@/lib/format";

export const metadata: Metadata = { title: "RQ2 · Model & Threshold" };

export default function Rq2Page() {
  const data = loadRq2();
  const winner = data.models.find((model) => model.isBest) ?? data.models[0];
  return (
    <div className="page">
      <Reveal>
        <PageHead
          eyebrow="RQ2 · Prediction"
          title="Which model is reliable on imbalanced data, and which threshold suits screening?"
          subtitle="Four offline-trained classifiers are compared with minority-aware metrics, then XGBoost's decision threshold is tuned for a recall-first screening context."
          meta={["4 models", "PR-AUC", "Recall-first"]}
        />
      </Reveal>

      <Section label="Final result on the untouched holdout" source="results/modeling/final_test_metrics.csv">
        <div className="kpi-grid">
          <KpiCard label="Winner" value={winner.name} note={`Selected by CV PR-AUC ${winner.prAuc.toFixed(3)}`} tone="accent" />
          <KpiCard label={`Holdout recall @ ${data.holdout.selected.t.toFixed(2)}`} value={fmtPct(data.holdout.selected.recall)} note={`${data.holdout.selected.cm.fn.toLocaleString("en-US")} missed positives, down from ${data.holdout.default.cm.fn.toLocaleString("en-US")} at t=0.50`} tone="risk" />
          <KpiCard label="Holdout PR-AUC" value={data.holdout.selected.prAuc.toFixed(4)} note={`ROC-AUC ${data.holdout.selected.rocAuc.toFixed(4)} · n=${data.holdout.sampleSize.toLocaleString("en-US")}`} />
          <KpiCard label={`Holdout precision @ ${data.holdout.selected.t.toFixed(2)}`} value={fmtPct(data.holdout.selected.precision)} note={`${data.holdout.selected.cm.fp.toLocaleString("en-US")} false alarms accepted`} />
        </div>

        <ChartCard
          title="Probability calibration on the same holdout"
          subtitle="Discrimination alone does not make probabilities usable. A slope near 1 and an intercept near 0 mean the scores can be read as risk levels rather than as a ranking order only. No recalibration was applied."
          source="results/modeling/calibration_metrics.csv"
        >
          <div className="metric-strip metric-strip-thirds">
            <div className="metric-mini">
              <span>Brier score · lower is better</span>
              <strong>{data.calibration.brierScore.toFixed(4)}</strong>
            </div>
            <div className="metric-mini">
              <span>Calibration slope · ideal 1.00</span>
              <strong>{data.calibration.slope.toFixed(4)}</strong>
            </div>
            <div className="metric-mini">
              <span>Calibration intercept · ideal 0.00</span>
              <strong>{data.calibration.intercept.toFixed(4)}</strong>
            </div>
          </div>
        </ChartCard>

        <Callout>
          <strong>Read the split labels.</strong> The tiles and calibration figures above are the locked{" "}
          {data.holdout.evaluationSplit.toLowerCase()} evaluation (n={data.holdout.sampleSize.toLocaleString("en-US")}),
          which is what the report headlines. Every panel below this one is computed on the{" "}
          <strong>development set</strong> (n={data.splits.developmentSize.toLocaleString("en-US")}),
          because model choice and threshold choice must never touch the holdout.
        </Callout>
      </Section>

      <Section label="Development-set selection evidence" source="rq2.json">
        <div className="kpi-grid">
          <KpiCard label="CV winner PR-AUC" value={winner.prAuc.toFixed(4)} note={data.modelsSplit} tone="accent" />
          <KpiCard label="OOF accuracy @ 0.50" value={fmtPct(data.highlights.default.accuracy)} note={`Recall ${fmtPct(data.highlights.default.recall)} · ${data.thresholdsSplit}`} />
          <KpiCard label={`OOF recall @ ${data.highlights.optimized.t.toFixed(2)}`} value={fmtPct(data.highlights.optimized.recall)} note={`${data.highlights.optimized.cm.fn.toLocaleString("en-US")} false negatives · ${data.thresholdsSplit}`} tone="risk" />
          <KpiCard label={`OOF F1 @ ${data.highlights.optimized.t.toFixed(2)}`} value={data.highlights.optimized.f1.toFixed(3)} note={`vs ${data.highlights.default.f1.toFixed(3)} at t=0.50`} tone="accent" />
        </div>
      </Section>

      <Section label="Model comparison" source="results/modeling/cv_model_comparison.csv">
        <ModelExplorer data={data} />
      </Section>

      <Section label="Interactive threshold explorer" source="results/modeling/threshold_analysis.csv">
        <ThresholdExplorer data={data} />
      </Section>

      <Section label="Exported evaluation curves" source="results/modeling">
        <ChartCard
          title="Reproducibility exports"
          subtitle="Curve-point data is not exported, so these verified offline figures are shown directly. They are archival artifacts rather than the primary reading path; the panels above already carry the numbers."
          source="public/figures/holdout_roc_pr_curves.png · threshold_analysis.png"
        >
          <FigureTabs
            items={[
              {
                id: "holdout-curves",
                label: "Holdout ROC and PR",
                src: data.figures.holdoutCurves,
                alt: "ROC and precision-recall curves for the selected XGBoost model on the untouched holdout test set",
                width: 3893,
                height: 1600,
                caption: `${data.holdout.evaluationSplit}, n=${data.holdout.sampleSize.toLocaleString("en-US")} · holdout_roc_pr_curves.png`,
              },
              {
                id: "threshold-sweep",
                label: "Threshold sweep",
                src: data.figures.thresholdSweep,
                alt: "Precision, recall and F1 plotted against the decision threshold, with the selected screening threshold marked",
                width: 4157,
                height: 1602,
                caption: `${data.thresholdsSplit}, n=${data.splits.developmentSize.toLocaleString("en-US")} · threshold_analysis.png`,
              },
            ]}
          />
        </ChartCard>
      </Section>
    </div>
  );
}
