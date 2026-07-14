"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { HBarChart } from "@/components/charts";
import { Callout, ChartCard, Chip, DataTable, Select, SliderControl, StatBadge, type TableColumn } from "@/components/primitives";
import type { Rq1Data } from "@/lib/data/schemas";
import { fmtFloat, fmtInt } from "@/lib/format";

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
  const orderedLevels = selected.levels.toSorted((a, b) => b.prevalencePct - a.prevalencePct);
  const highest = orderedLevels[0];
  const lowest = orderedLevels.at(-1) ?? orderedLevels[0];
  const selectedN = selected.levels.reduce((sum, level) => sum + level.n, 0);

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
        title="Linked categorical association explorer"
        subtitle={`${visible.length} of ${data.categorical.length} variables shown. Click a bar or use the factor selector; the category chart and profile update together.`}
        source="chi_square_results.csv + diabetes_cleaned.csv aggregate levels"
        action={<StatBadge label={`selected · ${selected.variable}`} tone="moderate" />}
      >
        <div className="control-row">
          <Select
            label="Selected factor"
            value={selected.variable}
            options={data.categorical.map((item) => ({ value: item.variable, label: `${item.variable} · ${item.label}` }))}
            onChange={setSelectedVariable}
          />
          <Select
            label="Rank by"
            value={sortBy}
            options={[{ value: "cramersV", label: "Cramer's V" }, { value: "maxDiffPct", label: "Max prevalence difference" }]}
            onChange={setSortBy}
          />
          <SliderControl
            label="Minimum Cramer's V"
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
            detail: item.label,
            tone: item.interpretation.includes("Moderate") ? "accent" : item.interpretation.includes("Negligible") ? "track" : "blue",
          }))}
          valueLabel={sortBy === "maxDiffPct" ? "Prevalence difference" : "Cramer's V"}
          selectedName={selected.variable}
          onSelect={(datum) => setSelectedVariable(datum.name)}
          formatValue={(value) => sortBy === "maxDiffPct" ? `${value.toFixed(1)} pp` : value.toFixed(3)}
          ariaLabel="Interactive ranking of categorical factors by effect size or prevalence range"
        />
        <div className="chip-row interaction-summary" aria-live="polite">
          <Chip tone="accent">{selected.variable}</Chip>
          <Chip>{selected.interpretation}</Chip>
          <Chip>{selected.levels.length} levels</Chip>
          <Chip>{fmtInt(selectedN)} records</Chip>
        </div>
      </ChartCard>

      <div className="workbench-grid section-block">
        <ChartCard
          title={`Diabetes prevalence by ${selected.variable} level`}
          subtitle="This chart is generated from category-level aggregates, replacing the previous min/max-only view."
          source="data/processed/diabetes_cleaned.csv · grouped counts"
        >
          <HBarChart
            data={selected.levels.map((level) => ({
              name: level.label,
              value: level.prevalencePct,
              detail: `${fmtInt(level.diabeticN)} diabetic records of ${fmtInt(level.n)}`,
              tone: level.prevalencePct === highest.prevalencePct ? "red" : "cyan",
            }))}
            valueLabel="Diabetes prevalence"
            color="cyan"
            formatValue={(value) => `${value.toFixed(1)}%`}
            ariaLabel={`Diabetes prevalence across the observed levels of ${selected.variable}`}
          />
        </ChartCard>

        <ChartCard
          title="Selected factor profile"
          subtitle="Ranking selection, category prevalence and evidence summary share the same factor state."
          source="rq1.json · selected variable"
        >
          <div className="metric-strip metric-strip-compact" aria-live="polite">
            <div className="metric-mini"><span>Cramer&apos;s V</span><strong>{selected.cramersV.toFixed(3)}</strong></div>
            <div className="metric-mini"><span>Rate spread</span><strong>{selected.maxDiffPct.toFixed(1)} pp</strong></div>
            <div className="metric-mini"><span>Highest group</span><strong>{highest.prevalencePct.toFixed(1)}%</strong></div>
            <div className="metric-mini"><span>Lowest group</span><strong>{lowest.prevalencePct.toFixed(1)}%</strong></div>
          </div>
          <div className="selection-panel">
            <span className="eyebrow">Current selection</span>
            <h3>{selected.label}</h3>
            <p><strong>{highest.label}</strong> has the highest observed diabetes prevalence at {highest.prevalencePct.toFixed(1)}%, compared with {lowest.prevalencePct.toFixed(1)}% for <strong>{lowest.label}</strong>.</p>
          </div>
          <Callout><strong>Interpret carefully.</strong> This is a bivariate association profile. It supports exploration but does not estimate an adjusted or causal effect.</Callout>
        </ChartCard>
      </div>

      <div className="section-block">
        <ChartCard title="Numeric variables: mean differences and effect sizes" subtitle="P-values are secondary here; magnitude is summarized by Cohen's d and absolute rank-biserial correlation." source="results/statistical_analysis/numerical_results.csv">
          <DataTable rows={data.numeric} columns={numericColumns} rowKey={(row) => row.variable} caption="Numeric association results for BMI, mental health days, and physical health days" />
        </ChartCard>
      </div>

      <div className="section-block">
        <ChartCard title="BMI distribution by class" subtitle="The exported boxplot remains supporting evidence; the primary categorical analysis above is now fully interactive." source="public/figures/bmi_boxplot.png">
          <figure>
            <div className="figure-frame"><Image src="/figures/bmi_boxplot.png" alt="Boxplot comparing BMI between healthy and diabetic classes" width={1200} height={720} sizes="100vw" /></div>
            <figcaption className="figure-caption">Supporting figure · bmi_boxplot.png</figcaption>
          </figure>
        </ChartCard>
      </div>
    </>
  );
}
