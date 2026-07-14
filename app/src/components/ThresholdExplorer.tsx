"use client";

import { useMemo } from "react";
import { ThresholdLineChart } from "@/components/charts";
import { Callout, ChartCard, SliderControl } from "@/components/primitives";
import type { Rq2Data } from "@/lib/data/schemas";
import { fmtInt, fmtPct } from "@/lib/format";
import { useUrlState } from "@/lib/use-url-state";

export function ThresholdExplorer({ data }: { data: Rq2Data }) {
  const optimizedIndex = Math.max(0, data.thresholds.findIndex((row) => row.t === data.highlights.optimized.t));
  const defaultIndex = Math.max(0, data.thresholds.findIndex((row) => row.t === data.highlights.default.t));
  const defaultThreshold = data.thresholds[optimizedIndex].t.toFixed(2);
  const [threshold, setThreshold] = useUrlState<string>("threshold", defaultThreshold, (value) => data.thresholds.some((row) => row.t.toFixed(2) === value));
  const index = Math.max(0, data.thresholds.findIndex((row) => row.t.toFixed(2) === threshold));
  const selected = data.thresholds[index];
  const lineData = useMemo(() => data.thresholds.map(({ t, precision, recall }) => ({ t, precision, recall })), [data.thresholds]);

  return (
    <div className="threshold-hero analysis-workbench">
      <ChartCard
        title="Decision-threshold explorer"
        subtitle="Move the slider or click the precision-recall chart. Metrics and the confusion matrix update together across 19 precomputed thresholds."
        source="results/modeling/threshold_analysis.csv"
      >
        <div className="control-row">
          <SliderControl
            label="Threshold index"
            value={index}
            min={0}
            max={data.thresholds.length - 1}
            step={1}
            onChange={(nextIndex) => setThreshold(data.thresholds[nextIndex].t.toFixed(2), "replace")}
            formatValue={() => `t = ${selected.t.toFixed(2)}`}
          />
          <div className="quick-actions">
            <button className="quick-button secondary" type="button" onClick={() => setThreshold(data.thresholds[defaultIndex].t.toFixed(2))}>Default 0.50</button>
            <button className="quick-button" type="button" onClick={() => setThreshold(defaultThreshold)}>Screening {data.highlights.optimized.t.toFixed(2)}</button>
          </div>
        </div>

        <div className="metric-strip" aria-live="polite">
          <div className="metric-mini"><span>Precision</span><strong>{fmtPct(selected.precision)}</strong></div>
          <div className="metric-mini"><span>Recall</span><strong>{fmtPct(selected.recall)}</strong></div>
          <div className="metric-mini"><span>F1</span><strong>{selected.f1.toFixed(3)}</strong></div>
          <div className="metric-mini"><span>Accuracy</span><strong>{fmtPct(selected.accuracy)}</strong></div>
        </div>

        <ThresholdLineChart
          data={lineData}
          currentT={selected.t}
          onSelectT={(threshold, mode) => {
            const nextIndex = data.thresholds.findIndex((row) => row.t === threshold);
            if (nextIndex >= 0) setThreshold(data.thresholds[nextIndex].t.toFixed(2), mode);
          }}
        />
        <div className="section-block">
          <Callout><strong>Screening trade-off.</strong> A false negative is the costly error in early screening. Lowering the threshold raises recall toward 80%, while accepting lower precision and more follow-up checks.</Callout>
        </div>
      </ChartCard>

      <ChartCard
        title={`Confusion matrix · t=${selected.t.toFixed(2)}`}
        subtitle="Rows represent actual class; columns represent predicted class (Development OOF). False negatives receive risk emphasis."
        source="threshold_analysis.csv · selected row"
      >
        <div className="confusion-grid" aria-live="polite" aria-label={`Confusion matrix at threshold ${selected.t.toFixed(2)}`}>
          <div className="cm-cell true-cell"><span className="cm-label">True negative · actual no diabetes</span><strong>{fmtInt(selected.tn)}</strong></div>
          <div className="cm-cell"><span className="cm-label">False positive · no diabetes flagged</span><strong>{fmtInt(selected.fp)}</strong></div>
          <div className="cm-cell fn-cell"><span className="cm-label">False negative · missed positive</span><strong>{fmtInt(selected.fn)}</strong></div>
          <div className="cm-cell true-cell"><span className="cm-label">True positive · positive found</span><strong>{fmtInt(selected.tp)}</strong></div>
        </div>
        <div className="legend-row">
          <span className="legend-item"><span className="legend-swatch" /> Correct classification</span>
          <span className="legend-item"><span className="legend-swatch risk" /> False negative emphasized</span>
        </div>
      </ChartCard>
    </div>
  );
}
