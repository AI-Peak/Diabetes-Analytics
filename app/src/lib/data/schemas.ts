import { z } from "zod";

const RqSummarySchema = z.object({
  id: z.enum(["rq1", "rq2", "rq3"]),
  eyebrow: z.string(),
  title: z.string(),
  finding: z.string(),
  chips: z.array(z.string()),
  href: z.enum(["/rq1", "/rq2", "/rq3"]),
});

const CohortCellSchema = z.object({
  sex: z.number().int().min(0).max(1),
  age: z.number().int().min(1).max(13),
  bmiBand: z.enum(["underweight", "healthy", "overweight", "obesity"]),
  highBP: z.number().int().min(0).max(1),
  n: z.number().int().positive(),
  positiveClassN: z.number().int().nonnegative(),
});

export const OverviewSchema = z.object({
  dataset: z.object({
    name: z.string(),
    nRows: z.number().int().positive(),
    nFeatures: z.number().int().positive(),
    target: z.string(),
    testSize: z.number().int().positive(),
    split: z.string(),
  }),
  classBalance: z.object({
    noDiabetesPct: z.number(),
    positiveClassPct: z.number(),
    noDiabetesN: z.number().int(),
    positiveClassN: z.number().int(),
  }),
  cohortCube: z.array(CohortCellSchema).min(1),
  bestModel: z.object({ name: z.string(), rocAuc: z.number(), prAuc: z.number() }),
  topAssociations: z.array(
    z.object({ variable: z.string(), label: z.string(), cramersV: z.number() }),
  ),
  rqSummaries: z.array(RqSummarySchema).length(3),
  pipeline: z.array(z.object({ step: z.string(), tool: z.string() })).length(6),
});

const CategoricalSchema = z.object({
  variable: z.string(),
  label: z.string(),
  chi2: z.number(),
  pValue: z.number(),
  df: z.number().int(),
  cramersV: z.number(),
  interpretation: z.string(),
  minRatePct: z.number(),
  maxRatePct: z.number(),
  maxDiffPct: z.number(),
  levels: z.array(z.object({
    value: z.string(),
    label: z.string(),
    n: z.number().int().positive(),
    positiveClassN: z.number().int().nonnegative(),
    prevalencePct: z.number().min(0).max(100),
  })).min(2),
});

const NumericSchema = z.object({
  variable: z.string(),
  noDiabetesMean: z.number(),
  positiveClassMean: z.number(),
  meanDiff: z.number(),
  noDiabetesMedian: z.number(),
  positiveClassMedian: z.number(),
  tStat: z.number(),
  tPValue: z.number(),
  cohensD: z.number(),
  mwuPValue: z.number(),
  cles: z.number(),
  rankBiserial: z.number(),
});

export const Rq1Schema = z.object({
  categorical: z.array(CategoricalSchema).length(18),
  numeric: z.array(NumericSchema).length(3),
  notes: z.object({ largeN: z.boolean() }),
});

const ThresholdSchema = z.object({
  t: z.number(),
  accuracy: z.number(),
  precision: z.number(),
  recall: z.number(),
  f1: z.number(),
  tp: z.number().int(),
  fn: z.number().int(),
  fp: z.number().int(),
  tn: z.number().int(),
});

const HighlightSchema = z.object({
  t: z.number(),
  accuracy: z.number(),
  precision: z.number(),
  recall: z.number(),
  f1: z.number(),
  cm: z.object({ tn: z.number().int(), fp: z.number().int(), fn: z.number().int(), tp: z.number().int() }),
});

export const Rq2Schema = z.object({
  models: z.array(
    z.object({
      name: z.string(),
      accuracy: z.number(),
      precision: z.number(),
      recall: z.number(),
      f1: z.number(),
      rocAuc: z.number(),
      prAuc: z.number(),
      isBest: z.boolean(),
    }),
  ).length(4),
  bestModelName: z.string(),
  thresholds: z.array(ThresholdSchema).min(1),
  highlights: z.object({ default: HighlightSchema, optimized: HighlightSchema }),
  calibration: z.object({
    brierScore: z.number(),
    slope: z.number(),
    intercept: z.number(),
    sampleSize: z.number().int(),
    evaluationSplit: z.string(),
  }),
});

const FeatureSchema = z.object({
  variable: z.string(),
  label: z.string(),
  shapImportance: z.number(),
  pValue: z.number(),
  effectSize: z.number(),
  effectSizeType: z.string(),
  statInterpretation: z.string(),
  shapRank: z.number().int(),
  statRank: z.number().int(),
  group: z.string(),
});

export const Rq3Schema = z.object({
  features: z.array(FeatureSchema).length(21),
  groups: z.array(
    z.object({
      key: z.string(),
      label: z.string(),
      members: z.array(z.string()),
    }),
  ).min(1),
  figures: z.object({
    beeswarm: z.string(),
    bar: z.string(),
    localDiabetic: z.string(),
    localHealthy: z.string(),
  }),
});

export type OverviewData = z.infer<typeof OverviewSchema>;
export type Rq1Data = z.infer<typeof Rq1Schema>;
export type Rq2Data = z.infer<typeof Rq2Schema>;
export type Rq3Data = z.infer<typeof Rq3Schema>;
export type CategoricalResult = Rq1Data["categorical"][number];
export type CategoryLevel = CategoricalResult["levels"][number];
export type CohortCell = OverviewData["cohortCube"][number];
export type ThresholdResult = Rq2Data["thresholds"][number];
export type FeatureResult = Rq3Data["features"][number];
