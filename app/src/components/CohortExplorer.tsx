"use client";

import { useMemo } from "react";
import { GroupedBar, HBarChart } from "@/components/charts";
import { Callout, ChartCard, Select, StatBadge } from "@/components/primitives";
import type { CohortCell } from "@/lib/data/schemas";
import { fmtInt } from "@/lib/format";
import { RotateCcw } from "@/lib/icons";
import { clearUrlState, useUrlState } from "@/lib/use-url-state";

const SMALL_SAMPLE_N = 30;
const SUPPRESS_ESTIMATE_N = 5;

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
  return cells.reduce((total, cell) => ({ n: total.n + cell.n, positiveClassN: total.positiveClassN + cell.positiveClassN }), { n: 0, positiveClassN: 0 });
}

export function CohortExplorer({
  cube,
  overall,
}: {
  cube: CohortCell[];
  overall: { positiveClassPct: number; positiveClassN: number };
}) {
  const [sex, setSex] = useUrlState<string>("sex", "all", (value) => SEX_OPTIONS.some((option) => option.value === value));
  const [age, setAge] = useUrlState<string>("age", "all", (value) => AGE_OPTIONS.some((option) => option.value === value));
  const [bmi, setBmi] = useUrlState<string>("bmi", "all", (value) => BMI_OPTIONS.some((option) => option.value === value));
  const [highBP, setHighBP] = useUrlState<string>("bp", "all", (value) => BP_OPTIONS.some((option) => option.value === value));

  const selectedCells = useMemo(() => cube.filter((cell) =>
    (sex === "all" || cell.sex === Number(sex)) &&
    (age === "all" || cell.age === Number(age)) &&
    (bmi === "all" || cell.bmiBand === bmi) &&
    (highBP === "all" || cell.highBP === Number(highBP)),
  ), [age, bmi, cube, highBP, sex]);

  const selected = useMemo(() => summarize(selectedCells), [selectedCells]);
  const prevalence = selected.n ? (selected.positiveClassN / selected.n) * 100 : 0;
  const lift = overall.positiveClassPct ? prevalence / overall.positiveClassPct : 0;
  const positiveShare = overall.positiveClassN ? (selected.positiveClassN / overall.positiveClassN) * 100 : 0;

  const ageSeries = useMemo(() => AGE_OPTIONS.slice(1).map((option) => {
    const cells = cube.filter((cell) =>
      cell.age === Number(option.value) &&
      (sex === "all" || cell.sex === Number(sex)) &&
      (bmi === "all" || cell.bmiBand === bmi) &&
      (highBP === "all" || cell.highBP === Number(highBP)),
    );
    const total = summarize(cells);
    const prevalence = total.n ? (total.positiveClassN / total.n) * 100 : 0;
    const suppressed = total.n < SUPPRESS_ESTIMATE_N;
    return {
      name: option.label,
      value: suppressed ? 0 : prevalence,
      displayValue: suppressed ? "Suppressed" : undefined,
      detail: suppressed
        ? `${fmtInt(total.n)} records; estimate suppressed`
        : `${fmtInt(total.positiveClassN)} positive records of ${fmtInt(total.n)}${total.n < SMALL_SAMPLE_N ? "; small sample, interpret cautiously" : ""}`,
      ageValue: option.value,
      n: total.n,
      tone: total.n < SMALL_SAMPLE_N ? "orange" as const : "red" as const,
    };
  }).filter((row) => row.n > 0), [bmi, cube, highBP, sex]);

  const selectedAgeLabel = AGE_OPTIONS.find((option) => option.value === age)?.label;
  const estimateSuppressed = selected.n > 0 && selected.n < SUPPRESS_ESTIMATE_N;
  const smallSample = selected.n > 0 && selected.n < SMALL_SAMPLE_N;
  const prevalenceLabel = selected.n === 0 ? "No data" : estimateSuppressed ? "Suppressed" : `${prevalence.toFixed(1)}%`;
  const liftLabel = selected.n === 0 ? "No data" : estimateSuppressed ? "Suppressed" : `${lift.toFixed(2)}x`;
  const positiveShareLabel = selected.n === 0 ? "No data" : estimateSuppressed ? "Suppressed" : `${positiveShare.toFixed(1)}%`;
  const composition = [
    { name: "Selected cohort", noDiabetes: 1 - prevalence / 100, prediabetesOrDiabetes: prevalence / 100 },
    { name: "Population", noDiabetes: 1 - overall.positiveClassPct / 100, prediabetesOrDiabetes: overall.positiveClassPct / 100 },
  ];

  const activeFilters = [sex, age, bmi, highBP].filter((value) => value !== "all").length;
  const reset = () => {
    clearUrlState(["sex", "age", "bmi", "bp"]);
  };

  return (
    <div className="analysis-workbench">
      <div className="filter-toolbar" aria-label="Cohort slicers">
        <Select label="Sex" value={sex} options={SEX_OPTIONS} onChange={setSex} hideLabel />
        <Select label="Age group" value={age} options={AGE_OPTIONS} onChange={setAge} hideLabel />
        <Select label="BMI band" value={bmi} options={BMI_OPTIONS} onChange={setBmi} hideLabel />
        <Select label="Blood pressure" value={highBP} options={BP_OPTIONS} onChange={setHighBP} hideLabel />
        <button
          className="quick-button secondary filter-reset"
          type="button"
          onClick={reset}
          disabled={activeFilters === 0}
          title={activeFilters === 0 ? "No filters applied" : `Clear ${activeFilters} active filter${activeFilters > 1 ? "s" : ""}`}
        >
          <RotateCcw size={15} aria-hidden="true" />
          <span>Reset filters{activeFilters > 0 ? ` · ${activeFilters}` : ""}</span>
        </button>
      </div>

      <div className="metric-strip" aria-live="polite">
        <div className="metric-mini"><span>Cohort records</span><strong>{fmtInt(selected.n)}</strong></div>
        <div className="metric-mini"><span>Diabetes prevalence</span><strong>{prevalenceLabel}</strong></div>
        <div className="metric-mini"><span>Population lift</span><strong>{liftLabel}</strong></div>
        <div className="metric-mini"><span>Share of positive cases</span><strong>{positiveShareLabel}</strong></div>
      </div>

      {smallSample ? (
        <Callout variant="warn">
          <strong>{estimateSuppressed ? "Estimate suppressed." : "Small sample warning."}</strong>{" "}
          {estimateSuppressed
            ? `This cohort contains only ${fmtInt(selected.n)} records, so prevalence, lift, and positive-case share are not displayed.`
            : `This cohort contains ${fmtInt(selected.n)} records. The displayed estimates are unstable and should not be generalized.`}
        </Callout>
      ) : null}

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
            onSelect={(datum, mode) => {
              const match = ageSeries.find((row) => row.name === datum.name);
              if (match) setAge(match.ageValue, mode);
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
          {estimateSuppressed ? (
            <div className="chart-empty">Cohort composition is suppressed when fewer than {SUPPRESS_ESTIMATE_N} records are selected.</div>
          ) : (
            <GroupedBar
              data={composition}
              series={[
                { key: "noDiabetes", label: "No diabetes", color: "accent" },
                { key: "prediabetesOrDiabetes", label: "Prediabetes or diabetes", color: "red" },
              ]}
              formatValue={(value) => `${(value * 100).toFixed(0)}%`}
              ariaLabel="Class composition for the selected cohort compared with the full population"
              minWidthClass="chart-min-width-narrow"
            />
          )}
          <p className="interaction-hint">Selections are computed from 208 anonymous aggregate cells; no person-level records are sent to the browser. Orange age bars have fewer than 30 records.</p>
        </ChartCard>
      </div>
    </div>
  );
}
