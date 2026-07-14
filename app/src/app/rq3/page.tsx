import type { Metadata } from "next";
import Image from "next/image";
import { Rq3Explorer } from "@/components/Rq3Explorer";
import { ChartCard, Chip, KpiCard, PageHead, Reveal, Section } from "@/components/primitives";
import { loadRq3 } from "@/lib/data/load";

export const metadata: Metadata = { title: "RQ3 · Explainable AI" };

export default function Rq3Page() {
  const data = loadRq3();
  const top = data.features.slice(0, 4);

  return (
    <div className="page">
      <Reveal>
        <PageHead
          eyebrow="RQ3 · Explanation"
          title="Are XGBoost's SHAP explanations statistically consistent?"
          subtitle="Global and local SHAP evidence is compared against classical effect-size ranks to test whether the model learned credible epidemiological structure rather than opaque shortcuts."
          meta={["TreeExplainer", "Consistency", "Strong agreement"]}
        />
      </Reveal>

      <Section label="Global importance summary" source="rq3.json">
        <div className="kpi-grid">
          {top.map((feature, index) => (
            <KpiCard
              key={feature.variable}
              label={`SHAP rank #${feature.shapRank}`}
              value={feature.variable}
              note={`mean|SHAP| ${feature.shapImportance.toFixed(3)}${feature.variable === "BMI" ? " · Stat #1 / SHAP #4" : ""}`}
              tone={index === 0 ? "accent" : feature.variable === "BMI" ? "risk" : "neutral"}
            />
          ))}
        </div>
      </Section>

      <Section label="Interactive feature lab" source="results/xai/explanation_consistency.csv">
        <Rq3Explorer features={data.features} />

        <div className="group-cards section-block">
          {data.groups.map((group) => (
            <article className={`group-card${group.key === "under-represented" ? " under" : ""}`} key={group.key}>
              <h3>{group.label}</h3>
              <p>{group.key === "strong-agreement" ? "Model and statistics agree on the leading signals: the black box learned recognizable clinical structure." : "Univariate effects remain significant but receive lower multivariate SHAP rank, plausibly because correlated factors share signal with GenHlth."}</p>
              <div className="member-list">{group.members.map((member) => <Chip tone={group.key === "strong-agreement" ? "accent" : "teal"} key={member}>{member}</Chip>)}</div>
            </article>
          ))}
        </div>
      </Section>

      <Section label="Supporting global SHAP exports" source="results/xai/shap_summary_*.png">
        <div className="chart-pair">
          <ChartCard title="SHAP beeswarm" subtitle="Each point encodes feature value, direction, and contribution magnitude across the offline explanation sample." source="public/figures/shap_summary_dot.png">
            <figure><div className="figure-frame"><Image src={data.figures.beeswarm} alt="SHAP beeswarm showing feature contribution directions and magnitudes" width={1400} height={1000} sizes="(max-width: 920px) 100vw, 45vw" /></div><figcaption className="figure-caption">Exported TreeExplainer figure · shap_summary_dot.png</figcaption></figure>
          </ChartCard>
          <ChartCard title="Global SHAP summary" subtitle="The static export remains a reproducibility artifact; selection and comparison now happen in the interactive feature lab above." source="public/figures/shap_summary_bar.png">
            <figure><div className="figure-frame"><Image src={data.figures.bar} alt="Global mean absolute SHAP importance bar chart" width={1400} height={1000} sizes="(max-width: 920px) 100vw, 45vw" /></div><figcaption className="figure-caption">Exported TreeExplainer figure · shap_summary_bar.png</figcaption></figure>
          </ChartCard>
        </div>
      </Section>

      <Section label="Local explanations" source="results/xai/shap_local_*.png">
        <div className="chart-pair">
          <ChartCard title="Correctly predicted diabetic case" subtitle="This waterfall explains why one specific record moved the model output toward the diabetic class; it is not a diagnosis." source="public/figures/shap_local_diabetic.png">
            <figure><div className="figure-frame"><Image src={data.figures.localDiabetic} alt="SHAP waterfall for a correctly predicted diabetic record" width={1400} height={760} sizes="(max-width: 920px) 100vw, 45vw" /></div><figcaption className="figure-caption">Local TreeExplainer export · shap_local_diabetic.png</figcaption></figure>
          </ChartCard>
          <ChartCard title="Correctly predicted healthy case" subtitle="Feature contributions for one healthy record show how evidence can also push the output away from the positive class." source="public/figures/shap_local_healthy.png">
            <figure><div className="figure-frame"><Image src={data.figures.localHealthy} alt="SHAP waterfall for a correctly predicted healthy record" width={1400} height={760} sizes="(max-width: 920px) 100vw, 45vw" /></div><figcaption className="figure-caption">Local TreeExplainer export · shap_local_healthy.png</figcaption></figure>
          </ChartCard>
        </div>
      </Section>
    </div>
  );
}
