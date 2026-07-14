"use client";

import { useMemo, useState } from "react";
import { GroupedBar, HBarChart } from "@/components/charts";
import { ChartCard, Select, StatBadge } from "@/components/primitives";
import type { CohortCell } from "@/lib/data/schemas";
import { fmtInt } from "@/lib/format";

const SEX_OPTIONS = [
  { value: "all", label: "All sexes" },
  { value: "0", label: "Female" },
  { value: "1", label: "Male" },
];

const AGE_OPTIONS = [
  { value: "all", label: "All ages" },
  { value: "1", label: "18-24" },
  { value: "2", label: "25-29" },
  { value: "3", label: "30-34" },
  { value: "4", label: "35-39" },
  { value: "5", label: "40-44" },
  { value: "6", label: "45-49" },
  { value: "7", label: "50-54" },
  { value: "8", label: "55-59" },
  { value: "9", label: "60-64" },
  { value: "10", label: "65-69" },
  { value: "11", label: "70-74" },
  { value: "12", label: "75-79" },
  { value: "13", label: "80+" },
];

const BMI_OPTIONS = [
  { value: "all", label: "All BMI bands" },
  { value: "underweight", label: "Underweight (<18.5)" },
  { value: "healthy", label: "Healthy (18.5-24.9)" },
  { value: "overweight", label: "Overweight (25-29.9)" },
  { value: "obesity", label: "Obesity (30+)" },
];

const BP_OPTIONS = [
  { value: "all", label: "Any blood pressure" },
  { value: "0", label: "No high BP" },
  { value: "1", label: "High BP" },
];

function summarize(cells: CohortCell[]) {
  return cells.reduce((total, cell) => ({ n: total.n + cell.n, diabeticN: total.diabeticN + cell.diabeticN }), { n: 0, diabeticN: 0 });
}

export function CohortExplorer({
  cube,
  overall,
}: {
  cube: CohortCell[];
  overall: { diabeticPct: number; diabeticN: number };
}) {
  const [sex, setSex] = useState("all");
  const [age, setAge] = useState("all");
  const [bmi, setBmi] = useState("all");
  const [highBP, setHighBP] = useState("all");

  const selectedCells = useMemo(() => cube.filter((cell) =>
    (sex === "all" || cell.sex === Number(sex)) &&
    (age === "all" || cell.age === Number(age)) &&
    (bmi === "all" || cell.bmiBand === bmi) &&
    (highBP === "all" || cell.highBP === Number(highBP)),
  ), [age, bmi, cube, highBP, sex]);

  const selected = useMemo(() => summarize(selectedCells), [selectedCells]);
  const prevalence = selected.n ? (selected.diabeticN / selected.n) * 100 : 0;
  const lift = overall.diabeticPct ? prevalence / overall.diabeticPct : 0;
  const positiveShare = overall.diabeticN ? (selected.diabeticN / overall.diabeticN) * 100 : 0;

  const ageSeries = useMemo(() => AGE_OPTIONS.slice(1).map((option) => {
    const cells = cube.filter((cell) =>
      cell.age === Number(option.value) &&
      (sex === "all" || cell.sex === Number(sex)) &&
      (bmi === "all" || cell.bmiBand === bmi) &&
      (highBP === "all" || cell.highBP === Number(highBP)),
    );
    const total = summarize(cells);
    return {
      name: option.label,
      value: total.n ? (total.diabeticN / total.n) * 100 : 0,
      detail: `${fmtInt(total.diabeticN)} diabetic records of ${fmtInt(total.n)}`,
      ageValue: option.value,
    };
  }).filter((row) => row.value > 0), [bmi, cube, highBP, sex]);

  const selectedAgeLabel = AGE_OPTIONS.find((option) => option.value === age)?.label;
  const composition = [
    { name: "Selected cohort", healthy: 1 - prevalence / 100, diabetic: prevalence / 100 },
    { name: "Population", healthy: 1 - overall.diabeticPct / 100, diabetic: overall.diabeticPct / 100 },
  ];

  const reset = () => {
    setSex("all");
    setAge("all");
    setBmi("all");
    setHighBP("all");
  };

  return (
    <div className="analysis-workbench">
      <div className="filter-toolbar" aria-label="Cohort slicers">
        <Select label="Sex" value={sex} options={SEX_OPTIONS} onChange={setSex} />
        <Select label="Age group" value={age} options={AGE_OPTIONS} onChange={setAge} />
        <Select label="BMI band" value={bmi} options={BMI_OPTIONS} onChange={setBmi} />
        <Select label="Blood pressure" value={highBP} options={BP_OPTIONS} onChange={setHighBP} />
        <button className="quick-button secondary filter-reset" type="button" onClick={reset}>Reset slicers</button>
      </div>

      <div className="metric-strip" aria-live="polite">
        <div className="metric-mini"><span>Cohort records</span><strong>{fmtInt(selected.n)}</strong></div>
        <div className="metric-mini"><span>Diabetes prevalence</span><strong>{prevalence.toFixed(1)}%</strong></div>
        <div className="metric-mini"><span>Population lift</span><strong>{lift.toFixed(2)}x</strong></div>
        <div className="metric-mini"><span>Share of positive cases</span><strong>{positiveShare.toFixed(1)}%</strong></div>
      </div>

      <div className="workbench-grid">
        <ChartCard
          title="Age risk profile"
          subtitle="The other slicers remain active. Click an age bar to filter the cohort and all summary tiles."
          source="data/processed/diabetes_cleaned.csv · pre-aggregated cohort cube"
          action={age === "all" ? <StatBadge label="all ages" /> : <StatBadge label={selectedAgeLabel ?? age} tone="moderate" />}
        >
          <HBarChart
            data={ageSeries}
            valueLabel="Diabetes prevalence"
            color="red"
            selectedName={age === "all" ? undefined : selectedAgeLabel}
            onSelect={(datum) => {
              const match = ageSeries.find((row) => row.name === datum.name);
              if (match) setAge(match.ageValue);
            }}
            formatValue={(value) => `${value.toFixed(1)}%`}
            ariaLabel="Diabetes prevalence by age group under the selected cohort filters"
          />
        </ChartCard>

        <ChartCard
          title="Selected cohort vs population"
          subtitle="Class composition updates with every slicer and age-bar selection."
          source="overview.json · cohortCube"
        >
          <GroupedBar
            data={composition}
            series={[
              { key: "healthy", label: "Healthy", color: "accent" },
              { key: "diabetic", label: "Diabetic", color: "red" },
            ]}
            formatValue={(value) => `${(value * 100).toFixed(0)}%`}
            ariaLabel="Class composition for the selected cohort compared with the full population"
          />
          <p className="interaction-hint">Selections are computed from 208 anonymous aggregate cells; no person-level records are sent to the browser.</p>
        </ChartCard>
      </div>
    </div>
  );
}
