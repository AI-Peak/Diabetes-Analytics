import type { Metadata } from "next";
import { Rq1Explorer } from "@/components/Rq1Explorer";
import { Callout, ChartCard, DataTable, KpiCard, PageHead, Reveal, Section, StatBadge, type TableColumn } from "@/components/primitives";
import { loadRq1 } from "@/lib/data/load";
import { fmtFloat } from "@/lib/format";
import type { Rq1Data } from "@/lib/data/schemas";

export const metadata: Metadata = { title: "RQ1 · Statistical Association" };

type AdjustedRow = Rq1Data["adjusted"][number];

const adjustedColumns: TableColumn<AdjustedRow>[] = [
  { id: "variable", header: "Variable", render: (row) => <><strong>{row.variable}</strong><br /><span className="card-source">{row.label}</span></> },
  { id: "or", header: "Adjusted OR", align: "right", render: (row) => fmtFloat(row.oddsRatio, 3) },
  { id: "ci", header: "95% CI", align: "right", render: (row) => `${fmtFloat(row.ciLower, 3)} – ${fmtFloat(row.ciUpper, 3)}` },
  { id: "vif", header: "VIF", align: "right", render: (row) => fmtFloat(row.vif, 2) },
  { id: "holm", header: "Holm p", align: "right", render: (row) => row.holmP === 0 ? "<1e-300" : row.holmP.toExponential(2) },
  { id: "sig", header: "After Holm", render: (row) => <StatBadge label={row.significant ? "Significant" : "Not significant"} tone={row.significant ? "moderate" : "neutral"} /> },
];

export default function Rq1Page() {
  const data = loadRq1();
  const topCategorical = data.categorical[0];
  const topNumeric = data.numeric.toSorted((a, b) => Math.abs(b.cohensD) - Math.abs(a.cohensD))[0];
  const maxVif = data.adjusted.toSorted((a, b) => b.vif - a.vif)[0];

  return (
    <div className="page">
      <Reveal>
        <PageHead
          eyebrow="RQ1 · Statistical association"
          title="Which factors are significantly associated with diabetes?"
          subtitle="Chi-square and Welch tests establish significance; Cramér's V, Cohen's d, and rank-biserial correlation show whether the association is substantively meaningful."
          meta={["Chi-square", "Cramér's V", "Welch t-test", "Cohen's d"]}
        />
      </Reveal>

      <Section label="Effect-size summary" source="rq1.json">
        <div className="kpi-grid">
          <KpiCard label="Categorical tested" value={String(data.categorical.length)} note="Chi-square + Cramér's V" />
          <KpiCard label="Numeric tested" value={String(data.numeric.length)} note="Welch t + Mann–Whitney" />
          <KpiCard label="Top Cramér's V" value={fmtFloat(topCategorical.cramersV, 3)} note={`${topCategorical.variable} · ${topCategorical.interpretation}`} tone="accent" />
          <KpiCard label="Top Cohen's d" value={fmtFloat(topNumeric.cohensD, 3)} note={`${topNumeric.variable} · largest numeric effect`} tone="risk" />
        </div>
      </Section>

      {data.notes.largeN ? (
        <div className="section-block">
          <Callout variant="warn"><strong>Large-N caution.</strong> With N = 253,680, nearly all p-values are approximately zero. Rank findings by <strong>effect size</strong>, not significance alone.</Callout>
        </div>
      ) : null}

      <Section label="Association explorer" source="results/statistical_analysis">
        <Rq1Explorer data={data} />
      </Section>

      <Section label="Adjusted multivariable associations" source="results/statistical_analysis/adjusted_association.csv">
        <ChartCard
          title="Odds ratios from the 21-predictor logistic regression"
          subtitle="The explorer above is univariate. This model adjusts every predictor for all others, so it separates factors that keep their association from those that were carrying shared information. An odds ratio above 1 raises the modelled odds of the positive class; a confidence interval spanning 1 does not."
          source="adjusted_association.csv"
        >
          <DataTable
            rows={data.adjusted}
            columns={adjustedColumns}
            rowKey={(row) => row.variable}
            caption="Adjusted odds ratios, 95% confidence intervals and variance inflation factors for all 21 predictors"
          />
          <p className="interaction-hint">
            Highest variance inflation factor is <strong>{maxVif.vif.toFixed(2)}</strong> ({maxVif.variable}), below the
            conventional threshold of 5, so no predictor is redundant enough to make these adjusted estimates unstable.
            Confidence intervals and Holm-adjusted p-values describe the analyzed sample only, not causal effects or
            weighted national estimates.
          </p>
        </ChartCard>
      </Section>
    </div>
  );
}
