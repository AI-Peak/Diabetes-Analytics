import type { Metadata } from "next";
import { Rq1Explorer } from "@/components/Rq1Explorer";
import { Callout, KpiCard, PageHead, Reveal, Section } from "@/components/primitives";
import { loadRq1 } from "@/lib/data/load";
import { fmtFloat } from "@/lib/format";

export const metadata: Metadata = { title: "RQ1 · Statistical Association" };

export default function Rq1Page() {
  const data = loadRq1();
  const topCategorical = data.categorical[0];
  const topNumeric = data.numeric.toSorted((a, b) => Math.abs(b.cohensD) - Math.abs(a.cohensD))[0];

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
          <Callout variant="warn"><strong>Large-N caution.</strong> With N = 229,474, nearly all p-values are approximately zero. Rank findings by <strong>effect size</strong>, not significance alone.</Callout>
        </div>
      ) : null}

      <Section label="Association explorer" source="results/statistical_analysis">
        <Rq1Explorer data={data} />
      </Section>
    </div>
  );
}
