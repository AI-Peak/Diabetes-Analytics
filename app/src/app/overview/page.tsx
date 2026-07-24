import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/lib/icons";
import { CohortExplorer } from "@/components/CohortExplorer";
import { loadOverview } from "@/lib/data/load";
import { fmtFloat, fmtInt } from "@/lib/format";
import { Chip, KpiCard, PageHead, Reveal, Section } from "@/components/primitives";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage() {
  const data = loadOverview();

  return (
    <div className="page">
      <Reveal>
        <PageHead
          eyebrow="Study overview"
          title="From population evidence to explainable diabetes-risk screening."
          subtitle="A CRISP-DM research arc connecting statistical association, imbalanced classification, threshold design, and SHAP-based explanation on CDC BRFSS 2015."
          meta={[
            `No reported diabetes ${data.classBalance.noDiabetesPct.toFixed(1)}%`,
            `Prediabetes/diabetes ${data.classBalance.positiveClassPct.toFixed(1)}%`,
            `${data.dataset.nFeatures} indicators`,
            "SQL · Python · XGBoost · SHAP",
          ]}
        />
      </Reveal>

      <Section label="Study at a glance" source="data/processed/diabetes_cleaned.csv">
        <div className="kpi-grid">
          <KpiCard label="Records" value={fmtInt(data.dataset.nRows)} note={`${data.dataset.name} · cleaned`} />
          <KpiCard label="Predictors" value={String(data.dataset.nFeatures)} note={`Target · ${data.dataset.target}`} />
          <KpiCard label="Prediabetes/Diabetes prevalence" value={`${data.classBalance.positiveClassPct.toFixed(1)}%`} note={`${fmtInt(data.classBalance.positiveClassN)} positive records`} tone="risk" />
          <KpiCard label="Holdout PR-AUC" value={fmtFloat(data.holdout.prAuc, 4)} note={`${data.bestModel.name} · locked holdout n=${fmtInt(data.holdout.sampleSize)} · CV PR-AUC ${fmtFloat(data.bestModel.prAuc, 3)}`} tone="accent" />
        </div>
      </Section>

      <Section label="Interactive cohort lab" source="pre-aggregated BRFSS cohort cube">
        <CohortExplorer cube={data.cohortCube} overall={{ positiveClassPct: data.classBalance.positiveClassPct, positiveClassN: data.classBalance.positiveClassN }} />
      </Section>

      <Section label="Evidence chain" source="RQ1 → RQ2 → RQ3">
        <div className="evidence-grid">
          {data.rqSummaries.map((rq, index) => (
            <Reveal delay={0.06 * index} key={rq.id}>
              <Link className="evidence-card" href={rq.href}>
                <span className="evidence-index">0{index + 1} / 03</span>
                <span className="eyebrow">{rq.eyebrow}</span>
                <h2 className="evidence-title">{rq.title}</h2>
                <p className="evidence-finding">{rq.finding}</p>
                <span className="chip-row">{rq.chips.map((chip) => <Chip key={chip}>{chip}</Chip>)}</span>
                <span className="evidence-link">Open {rq.id.toUpperCase()} <ArrowRight size={13} aria-hidden="true" /></span>
              </Link>
            </Reveal>
          ))}
        </div>
        <p className="connector-note">Each question builds on the last: identify evidence → test prediction → inspect what the model learned.</p>
      </Section>

      <Section label="Method & data profile" source="CRISP-DM · generated overview.json">
        <div className="two-col-wide">
          <article className="surface-card">
            <div className="chart-card-header">
              <div><h2 className="card-title">CRISP-DM evidence pipeline</h2><p className="card-subtitle">Six traceable stages, with explainability treated as a first-class research output.</p></div>
            </div>
            <div className="pipeline-strip" aria-label="CRISP-DM pipeline">
              {data.pipeline.map((item, index) => (
                <div className="pipeline-node" key={item.step}>
                  <div className="pipeline-num">0{index + 1}</div>
                  <div className="pipeline-step">{item.step}</div>
                  <div className="pipeline-tool">{item.tool}</div>
                </div>
              ))}
            </div>
          </article>

          <article className="surface-card">
            <div className="chart-card-header">
              <div><h2 className="card-title">Class balance</h2><p className="card-subtitle">The minority positive class makes accuracy alone an incomplete model-selection signal.</p></div>
            </div>
            <div className="balance-bar" role="img" aria-label={`No reported diabetes ${data.classBalance.noDiabetesPct}% and prediabetes/diabetes ${data.classBalance.positiveClassPct}%`}>
              <div className="balance-healthy" style={{ width: `${data.classBalance.noDiabetesPct}%` }}>{data.classBalance.noDiabetesPct.toFixed(1)}%</div>
              <div className="balance-diabetic" style={{ width: `${data.classBalance.positiveClassPct}%` }}>{data.classBalance.positiveClassPct.toFixed(1)}%</div>
            </div>
            <div className="legend-row">
              <span className="legend-item"><span className="legend-swatch" /> No reported diabetes · <span className="num">{fmtInt(data.classBalance.noDiabetesN)}</span></span>
              <span className="legend-item"><span className="legend-swatch risk" /> Prediabetes/Diabetes · <span className="num">{fmtInt(data.classBalance.positiveClassN)}</span></span>
            </div>
          </article>
        </div>
      </Section>
    </div>
  );
}
