"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { HBarChart } from "@/components/charts";
import { ChartCard, Chip, DataTable, Select, SliderControl, StatBadge, type TableColumn } from "@/components/primitives";
import type { Rq1Data } from "@/lib/data/schemas";
import { fmtFloat } from "@/lib/format";

function badgeTone(interpretation: string): "neutral" | "moderate" {
  return interpretation.toLowerCase().includes("moderate") ? "moderate" : "neutral";
}

function numericMagnitude(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude >= 0.8) return "Large";
  if (magnitude >= 0.5) return "Medium";
  if (magnitude >= 0.2) return "Small";
  return "Negligible";
}

export function Rq1Explorer({ data }: { data: Rq1Data }) {
  const [sortBy, setSortBy] = useState("cramersV");
  const [minEffect, setMinEffect] = useState(0);
  const [selectedVariable, setSelectedVariable] = useState(data.categorical[0]?.variable ?? "");

  const visible = useMemo(() => {
    const rows = data.categorical.filter((item) => item.cramersV >= minEffect);
    return rows.toSorted((a, b) => sortBy === "maxDiffPct" ? b.maxDiffPct - a.maxDiffPct : b.cramersV - a.cramersV);
  }, [data.categorical, minEffect, sortBy]);

  const selected = data.categorical.find((item) => item.variable === selectedVariable) ?? data.categorical[0];
  const numericColumns: TableColumn<Rq1Data["numeric"][number]>[] = [
    { id: "variable", header: "Variable", render: (row) => <><strong>{row.variable}</strong><br /><span className="card-source">numeric factor</span></> },
    { id: "healthy", header: "Healthy mean", align: "right", render: (row) => fmtFloat(row.healthyMean, 2) },
    { id: "diabetic", header: "Diabetic mean", align: "right", render: (row) => fmtFloat(row.diabeticMean, 2) },
    { id: "diff", header: "Mean diff", align: "right", render: (row) => fmtFloat(row.meanDiff, 2) },
    { id: "d", header: "Cohen's d", align: "right", render: (row) => fmtFloat(row.cohensD, 3) },
    { id: "rb", header: "|Rank-biserial|", align: "right", render: (row) => fmtFloat(Math.abs(row.rankBiserial), 3) },
    { id: "magnitude", header: "Magnitude", render: (row) => <StatBadge label={numericMagnitude(row.cohensD)} tone={Math.abs(row.cohensD) >= 0.5 ? "moderate" : "neutral"} /> },
  ];

  return (
    <>
      <ChartCard
        title="Categorical association ranking"
        subtitle={`${visible.length} of ${data.categorical.length} variables shown. Sort and filter are computed locally over precomputed effect sizes.`}
        source="results/statistical_analysis/chi_square_results.csv"
      >
        <div className="control-row">
          <Select
            label="Rank by"
            value={sortBy}
            options={[{ value: "cramersV", label: "Cramér's V" }, { value: "maxDiffPct", label: "Max prevalence difference" }]}
            onChange={setSortBy}
          />
          <SliderControl
            label="Minimum Cramér's V"
            value={minEffect}
            min={0}
            max={0.25}
            step={0.025}
            onChange={setMinEffect}
            formatValue={(value) => value.toFixed(3)}
          />
        </div>
        <HBarChart
          data={visible.map((item) => ({
            name: item.variable,
            value: sortBy === "maxDiffPct" ? item.maxDiffPct : item.cramersV,
            tone: item.interpretation.includes("Moderate") ? "accent" : item.interpretation.includes("Negligible") ? "track" : "blue",
          }))}
          valueLabel={sortBy === "maxDiffPct" ? "Prevalence difference" : "Cramér's V"}
          formatValue={(value) => sortBy === "maxDiffPct" ? `${value.toFixed(1)} pp` : value.toFixed(3)}
          ariaLabel="Interactive ranking of 18 categorical factors by effect size or prevalence range"
        />
        <div className="chip-row" aria-label="Effect-size labels for visible variables">
          {visible.map((item) => <span className="legend-item" key={item.variable}><span className="mono">{item.variable}</span><StatBadge label={item.interpretation} tone={badgeTone(item.interpretation)} /></span>)}
        </div>
      </ChartCard>

      <div className="two-col section-block">
        <ChartCard
          title="Observed prevalence range"
          subtitle="Only the minimum and maximum rates are available; this is a range, not a per-level curve."
          source="chi_square_results.csv · min/max fields"
        >
          <Select
            label="Categorical variable"
            value={selected.variable}
            options={data.categorical.map((item) => ({ value: item.variable, label: `${item.variable} · ${item.label}` }))}
            onChange={setSelectedVariable}
          />
          <div className="range-visual">
            <div className="range-labels">
              <div><strong>{selected.minRatePct.toFixed(1)}%</strong><span>minimum observed rate</span></div>
              <div style={{ textAlign: "right" }}><strong>{selected.maxRatePct.toFixed(1)}%</strong><span>maximum observed rate</span></div>
            </div>
            <div className="range-track" aria-label={`${selected.variable}: ${selected.minRatePct.toFixed(1)} percent to ${selected.maxRatePct.toFixed(1)} percent`}>
              <div className="range-fill" style={{ left: `${(selected.minRatePct / 40) * 100}%`, width: `${((selected.maxRatePct - selected.minRatePct) / 40) * 100}%` }} />
              <span className="range-point" style={{ left: `${(selected.minRatePct / 40) * 100}%` }} />
              <span className="range-point max" style={{ left: `${(selected.maxRatePct / 40) * 100}%` }} />
            </div>
            <div className="chip-row"><Chip tone="risk">Δ {selected.maxDiffPct.toFixed(1)} percentage points</Chip><Chip>{selected.interpretation}</Chip></div>
          </div>
        </ChartCard>

        <ChartCard title="Supporting prevalence figure" subtitle="Exported offline from the statistical analysis pipeline." source="public/figures/top_categorical_prevalence.png">
          <figure>
            <div className="figure-frame"><Image src="/figures/top_categorical_prevalence.png" alt="Diabetes prevalence for the leading categorical factors" width={1200} height={720} sizes="(max-width: 920px) 100vw, 45vw" /></div>
            <figcaption className="figure-caption">Supporting figure · top_categorical_prevalence.png</figcaption>
          </figure>
        </ChartCard>
      </div>

      <div className="section-block">
        <ChartCard title="Numeric variables: mean differences and effect sizes" subtitle="P-values are secondary here; magnitude is summarized by Cohen's d and absolute rank-biserial correlation." source="results/statistical_analysis/numerical_results.csv">
          <DataTable rows={data.numeric} columns={numericColumns} rowKey={(row) => row.variable} caption="Numeric association results for BMI, mental health days, and physical health days" />
        </ChartCard>
      </div>

      <div className="section-block">
        <ChartCard title="BMI distribution by class" subtitle="The exported boxplot supports the numeric effect-size table without recomputing statistics in the browser." source="public/figures/bmi_boxplot.png">
          <figure>
            <div className="figure-frame"><Image src="/figures/bmi_boxplot.png" alt="Boxplot comparing BMI between healthy and diabetic classes" width={1200} height={720} sizes="100vw" /></div>
            <figcaption className="figure-caption">Supporting figure · bmi_boxplot.png</figcaption>
          </figure>
        </ChartCard>
      </div>
    </>
  );
}
