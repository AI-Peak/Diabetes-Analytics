"use client";

import { useMemo, useState } from "react";
import { ThresholdLineChart } from "@/components/charts";
import { Callout, ChartCard, SliderControl } from "@/components/primitives";
import type { Rq2Data } from "@/lib/data/schemas";
import { fmtInt, fmtPct } from "@/lib/format";

export function ThresholdExplorer({ data }: { data: Rq2Data }) {
  const optimizedIndex = Math.max(0, data.thresholds.findIndex((row) => row.t === data.highlights.optimized.t));
  const defaultIndex = Math.max(0, data.thresholds.findIndex((row) => row.t === data.highlights.default.t));
  const [index, setIndex] = useState(optimizedIndex);
  const selected = data.thresholds[index];
  const lineData = useMemo(() => data.thresholds.map(({ t, precision, recall }) => ({ t, precision, recall })), [data.thresholds]);

  return (
    <div className="threshold-hero">
      <ChartCard
        title="Decision-threshold explorer"
        subtitle="Move across the 19 precomputed thresholds. No model inference runs in this dashboard."
        source="results/modeling/threshold_analysis.csv"
      >
        <div className="control-row">
          <SliderControl
            label="Threshold index"
            value={index}
            min={0}
            max={data.thresholds.length - 1}
            step={1}
            onChange={setIndex}
            formatValue={() => `t = ${selected.t.toFixed(2)}`}
          />
          <div className="quick-actions">
            <button className="quick-button secondary" type="button" onClick={() => setIndex(defaultIndex)}>Default 0.50</button>
            <button className="quick-button" type="button" onClick={() => setIndex(optimizedIndex)}>Screening 0.15</button>
          </div>
        </div>

        <div className="metric-strip" aria-live="polite">
          <div className="metric-mini"><span>Precision</span><strong>{fmtPct(selected.precision)}</strong></div>
          <div className="metric-mini"><span>Recall</span><strong>{fmtPct(selected.recall)}</strong></div>
          <div className="metric-mini"><span>F1</span><strong>{selected.f1.toFixed(3)}</strong></div>
          <div className="metric-mini"><span>Accuracy</span><strong>{fmtPct(selected.accuracy)}</strong></div>
        </div>

        <ThresholdLineChart data={lineData} currentT={selected.t} />
        <div className="section-block">
          <Callout><strong>Screening trade-off.</strong> A false negative is the costly error in early screening. Lowering the threshold raises recall toward 80%, while accepting lower precision and more follow-up checks.</Callout>
        </div>
      </ChartCard>

      <ChartCard
        title={`Confusion matrix · t=${selected.t.toFixed(2)}`}
        subtitle="Rows represent actual class; columns represent predicted class. False negatives receive risk emphasis."
        source="threshold_analysis.csv · selected row"
      >
        <div className="confusion-grid" aria-live="polite" aria-label={`Confusion matrix at threshold ${selected.t.toFixed(2)}`}>
          <div className="cm-cell true-cell"><span className="cm-label">True negative · actual healthy</span><strong>{fmtInt(selected.tn)}</strong></div>
          <div className="cm-cell"><span className="cm-label">False positive · healthy flagged</span><strong>{fmtInt(selected.fp)}</strong></div>
          <div className="cm-cell fn-cell"><span className="cm-label">False negative · missed diabetic</span><strong>{fmtInt(selected.fn)}</strong></div>
          <div className="cm-cell true-cell"><span className="cm-label">True positive · diabetic found</span><strong>{fmtInt(selected.tp)}</strong></div>
        </div>
        <div className="legend-row">
          <span className="legend-item"><span className="legend-swatch" /> Correct classification</span>
          <span className="legend-item"><span className="legend-swatch risk" /> False negative emphasized</span>
        </div>
      </ChartCard>
    </div>
  );
}
