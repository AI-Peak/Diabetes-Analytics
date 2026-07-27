import type { Metadata } from "next";
import { Rq3Explorer } from "@/components/Rq3Explorer";
import { ChartCard, Chip, DataTable, FigureTabs, KpiCard, PageHead, Reveal, Section, type TableColumn } from "@/components/primitives";
import { loadRq3 } from "@/lib/data/load";
import type { Rq3Data } from "@/lib/data/schemas";

export const metadata: Metadata = { title: "RQ3 · Explainable AI" };

type AlignmentRow = Rq3Data["alignment"]["topK"][number];

// Keyed by the group number so a rename in the pipeline's Consistency_Group text
// cannot silently drop every card into one branch, which is what happened before.
const GROUP_META: Record<number, { variant: string; tone: "accent" | "teal" | "risk" | "neutral"; description: string }> = {
  1: {
    variant: "",
    tone: "accent",
    description: "Model and statistics agree on the leading signals: the black box learned recognizable clinical structure.",
  },
  2: {
    variant: " under",
    tone: "teal",
    description: "Univariate effects remain meaningful but receive lower multivariate SHAP rank, plausibly because correlated factors share signal with GenHlth.",
  },
  3: {
    variant: " salient",
    tone: "risk",
    description: "Weak on its own, yet salient inside the model: the contribution is conditional on the other predictors, so a bivariate reading alone would have missed it.",
  },
  4: {
    variant: " weak",
    tone: "neutral",
    description: "Weak on both axes. Neither the marginal association nor the model assigns much weight, so these are reported for completeness rather than interpreted.",
  },
};

function groupNumber(key: string, label: string) {
  return Number(/^group-(\d)/.exec(key)?.[1] ?? /^Group (\d)/.exec(label)?.[1] ?? 0);
}

function formatGroupLabel(label: string) {
  return label.replace(/\s+[—–]\s+/, ": ");
}

const alignmentColumns: TableColumn<AlignmentRow>[] = [
  { id: "k", header: "Cutoff", render: (row) => <strong>Top-{row.k}</strong> },
  { id: "overlap", header: "Overlap vs univariate", align: "right", render: (row) => `${row.overlap} / ${row.k}` },
  { id: "jaccard", header: "Jaccard vs univariate", align: "right", render: (row) => row.jaccard.toFixed(4) },
  { id: "overlapOr", header: "Overlap vs adjusted OR", align: "right", render: (row) => `${row.overlapAdjustedOr} / ${row.k}` },
  { id: "jaccardOr", header: "Jaccard vs adjusted OR", align: "right", render: (row) => row.jaccardAdjustedOr.toFixed(4) },
];

export default function Rq3Page() {
  const data = loadRq3();
  const top = data.features.slice(0, 4);
  const byK = (k: number) => data.alignment.topK.find((row) => row.k === k);
  const top5 = byK(5);
  const top10 = byK(10);
  const top15 = byK(15);

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
          {data.groups
            .toSorted((a, b) => groupNumber(a.key, a.label) - groupNumber(b.key, b.label))
            .map((group) => {
              const meta = GROUP_META[groupNumber(group.key, group.label)] ?? GROUP_META[4];
              return (
                <article className={`group-card${meta.variant}`} key={group.key}>
                  <h3>{formatGroupLabel(group.label)}</h3>
                  <p>{meta.description}</p>
                  <div className="member-list">{group.members.map((member) => <Chip tone={meta.tone} key={member}>{member}</Chip>)}</div>
                </article>
              );
            })}
        </div>
      </Section>

      <Section label="Quantitative evidence alignment" source="results/xai/rank_sensitivity_analysis.csv">
        <ChartCard
          title="How closely do SHAP ranks and statistical effect-size ranks agree?"
          subtitle="The four groups above are qualitative. These figures put a number on the same question across all 21 features. Agreement is meaningful but incomplete, which is what the exploratory reading depends on."
          source="rank_sensitivity_analysis.csv + explanation_consistency.csv"
        >
          <div className="metric-strip metric-strip-thirds">
            <div className="metric-mini">
              <span>Spearman rank correlation</span>
              <strong>{data.alignment.spearman.toFixed(4)}</strong>
            </div>
            <div className="metric-mini">
              <span>Top-10 Jaccard similarity</span>
              <strong>{(top10?.jaccard ?? 0).toFixed(4)}</strong>
            </div>
            <div className="metric-mini">
              <span>Features compared</span>
              <strong>{data.alignment.featureCount}</strong>
            </div>
          </div>
          <DataTable
            rows={data.alignment.topK}
            columns={alignmentColumns}
            rowKey={(row) => String(row.k)}
            caption="Top-K overlap and Jaccard similarity between SHAP ranks, univariate effect-size ranks, and adjusted odds-ratio ranks"
          />
          <p className="interaction-hint">
            Overlap grows from {top5?.overlap ?? 0}/5 to {top15?.overlap ?? 0}/15 as the cutoff widens, so the two
            rankings agree on which features matter more than on the exact order. This is evidence alignment, not
            clinical or statistical validation of SHAP.
          </p>
        </ChartCard>
      </Section>

      <Section label="Direction and individual-level evidence" source="results/xai">
        <ChartCard
          title="What the ranking above cannot show"
          subtitle="The feature lab ranks features by mean absolute SHAP, which discards two things: which way a feature pushes the prediction, and how the evidence combines for one specific person. These verified TreeExplainer exports cover both. One tab is shown at a time, so the section costs the height of a single figure."
          source="public/figures/shap_summary_dot.png · shap_local_diabetic.png · shap_local_healthy.png"
        >
          <FigureTabs
            items={[
              {
                id: "beeswarm",
                label: "Global beeswarm",
                src: data.figures.beeswarm,
                alt: "SHAP beeswarm showing feature contribution directions and magnitudes",
                width: 2332,
                height: 2819,
                size: "compact",
                caption: "Each dot is one record. Horizontal position is the signed SHAP value, colour is the feature value, so the plot recovers the direction the mean absolute ranking discards · shap_summary_dot.png",
              },
              {
                id: "local-diabetic",
                label: "Local · positive case",
                src: data.figures.localDiabetic,
                alt: "SHAP waterfall for a correctly predicted prediabetes or diabetes record",
                width: 2862,
                height: 1660,
                caption: "Why one specific record moved toward the positive class. Not a diagnosis · shap_local_diabetic.png",
              },
              {
                id: "local-healthy",
                label: "Local · negative case",
                src: data.figures.localHealthy,
                alt: "SHAP waterfall for a correctly predicted no reported diabetes record",
                width: 2602,
                height: 1660,
                caption: "How evidence can also push the output away from the positive class · shap_local_healthy.png",
              },
            ]}
          />
        </ChartCard>
      </Section>
    </div>
  );
}
