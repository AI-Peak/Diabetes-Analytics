import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(appRoot, "..");
const resultsRoot = path.join(repoRoot, "results");
const generatedRoot = path.join(appRoot, "data", "generated");
const figuresRoot = path.join(appRoot, "public", "figures");

const VARIABLE_LABELS = {
  HighBP: "High Blood Pressure",
  HighChol: "High Cholesterol",
  CholCheck: "Cholesterol Check (5 Years)",
  BMI: "Body Mass Index",
  Smoker: "Tobacco Smoker Status",
  Stroke: "Stroke History",
  HeartDiseaseorAttack: "Heart Disease or Attack History",
  PhysActivity: "Physical Activity",
  Fruits: "Daily Fruit Consumption",
  Veggies: "Daily Vegetable Consumption",
  HvyAlcoholConsump: "Heavy Alcohol Consumption",
  AnyHealthcare: "Healthcare Coverage Access",
  NoDocbcCost: "Doctor Cost Barrier",
  GenHlth: "Self-Rated General Health",
  MentHlth: "Poor Mental Health Days",
  PhysHlth: "Poor Physical Health Days",
  DiffWalk: "Difficulty Walking",
  Sex: "Biological Sex",
  Age: "Age Category",
  Education: "Education Level",
  Income: "Income Bracket",
};

async function parseCsv(relativePath) {
  const inputPath = path.join(repoRoot, relativePath);
  const raw = await readFile(inputPath, "utf8");
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error(`No data rows found in ${relativePath}`);
  const headers = lines[0].split(",").map((cell) => cell.trim());
  return lines.slice(1).map((line, rowIndex) => {
    const cells = line.split(",").map((cell) => cell.trim());
    if (cells.length !== headers.length) {
      throw new Error(`${relativePath}: row ${rowIndex + 2} has ${cells.length} cells; expected ${headers.length}`);
    }
    return Object.fromEntries(headers.map((header, index) => [header, cells[index]]));
  });
}

function number(row, key) {
  const value = Number(row[key]);
  if (!Number.isFinite(value)) throw new Error(`Invalid numeric value for ${key}: ${row[key]}`);
  return value;
}

async function datasetProfile() {
  const relativePath = path.join("data", "processed", "diabetes_cleaned.csv");
  const raw = await readFile(path.join(repoRoot, relativePath), "utf8");
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  const headers = lines[0].split(",").map((cell) => cell.trim());
  const targetIndex = headers.indexOf("Diabetes_binary");
  if (targetIndex === -1) throw new Error(`${relativePath}: Diabetes_binary column is missing`);

  let diabeticN = 0;
  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    if (Number(cells[targetIndex]) === 1) diabeticN += 1;
  }
  const nRows = lines.length - 1;
  const healthyN = nRows - diabeticN;
  return {
    nRows,
    nFeatures: headers.length - 1,
    healthyN,
    diabeticN,
    healthyPct: Number(((healthyN / nRows) * 100).toFixed(1)),
    diabeticPct: Number(((diabeticN / nRows) * 100).toFixed(1)),
  };
}

function categoricalRows(rows) {
  return rows
    .map((row) => ({
      variable: row.Variable,
      label: row.Description,
      chi2: number(row, "Chi2 Statistic"),
      pValue: number(row, "p-value"),
      df: number(row, "Degrees of Freedom"),
      cramersV: number(row, "Cramér's V"),
      interpretation: row["Effect Size Interpretation"],
      minRatePct: number(row, "Min Diabetes Rate (%)"),
      maxRatePct: number(row, "Max Diabetes Rate (%)"),
      maxDiffPct: number(row, "Max Difference (%)"),
    }))
    .sort((a, b) => b.cramersV - a.cramersV);
}

function numericRows(rows) {
  return rows.map((row) => ({
    variable: row.Variable,
    healthyMean: number(row, "Healthy Mean"),
    diabeticMean: number(row, "Diabetic Mean"),
    meanDiff: number(row, "Mean Difference"),
    healthyMedian: number(row, "Healthy Median"),
    diabeticMedian: number(row, "Diabetic Median"),
    tStat: number(row, "t-Statistic"),
    tPValue: number(row, "t p-value"),
    cohensD: number(row, "Cohen's d"),
    mwuPValue: number(row, "MWU p-value"),
    cles: number(row, "CLES (Superiority)"),
    rankBiserial: number(row, "Rank-Biserial Correlation"),
  }));
}

function modelRows(rows) {
  const mapped = rows.map((row) => ({
    name: row.Model,
    accuracy: number(row, "Accuracy"),
    precision: number(row, "Precision"),
    recall: number(row, "Recall"),
    f1: number(row, "F1-score"),
    rocAuc: number(row, "ROC-AUC"),
    prAuc: number(row, "PR-AUC"),
    isBest: false,
  }));
  const best = mapped.reduce((winner, model) => (model.prAuc > winner.prAuc ? model : winner));
  return mapped.map((model) => ({ ...model, isBest: model.name === best.name }));
}

function thresholdRows(rows) {
  return rows.map((row) => ({
    t: Number(number(row, "Threshold").toFixed(2)),
    accuracy: number(row, "Accuracy"),
    precision: number(row, "Precision"),
    recall: number(row, "Recall"),
    f1: number(row, "F1-score"),
    tp: number(row, "True Positives"),
    fn: number(row, "False Negatives"),
    fp: number(row, "False Positives"),
    tn: number(row, "True Negatives"),
  }));
}

function featureRows(rows) {
  return rows
    .map((row) => ({
      variable: row.Variable,
      label: VARIABLE_LABELS[row.Variable] ?? row.Variable,
      shapImportance: number(row, "SHAP_Importance"),
      pValue: number(row, "p-value"),
      effectSize: number(row, "Effect_Size"),
      effectSizeType: row.Effect_Size_Type,
      statInterpretation: row.Stat_Interpretation,
      shapRank: number(row, "SHAP_Rank"),
      statRank: number(row, "Stat_Rank"),
      group: row.Consistency_Group,
    }))
    .sort((a, b) => a.shapRank - b.shapRank);
}

async function writeJson(name, value, summary) {
  await writeFile(path.join(generatedRoot, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
  console.log(`[build-data] ${name}: ${summary}`);
}

async function main() {
  await mkdir(generatedRoot, { recursive: true });
  await mkdir(figuresRoot, { recursive: true });

  const [profile, categoricalCsv, numericCsv, modelsCsv, thresholdsCsv, consistencyCsv] = await Promise.all([
    datasetProfile(),
    parseCsv(path.join("results", "statistical_analysis", "chi_square_results.csv")),
    parseCsv(path.join("results", "statistical_analysis", "numerical_results.csv")),
    parseCsv(path.join("results", "modeling", "model_comparison.csv")),
    parseCsv(path.join("results", "modeling", "threshold_analysis.csv")),
    parseCsv(path.join("results", "xai", "explanation_consistency.csv")),
  ]);

  const categorical = categoricalRows(categoricalCsv);
  const numeric = numericRows(numericCsv);
  const models = modelRows(modelsCsv);
  const thresholds = thresholdRows(thresholdsCsv);
  const features = featureRows(consistencyCsv);
  const bestModel = models.find((model) => model.isBest);
  if (!bestModel) throw new Error("Could not determine the best model");

  const overview = {
    dataset: {
      name: "CDC BRFSS 2015",
      nRows: profile.nRows,
      nFeatures: profile.nFeatures,
      target: "Diabetes_binary",
      testSize: Math.round(profile.nRows * 0.2),
      split: "stratified 80/20",
    },
    classBalance: {
      healthyPct: profile.healthyPct,
      diabeticPct: profile.diabeticPct,
      healthyN: profile.healthyN,
      diabeticN: profile.diabeticN,
    },
    bestModel: { name: bestModel.name, rocAuc: bestModel.rocAuc, prAuc: bestModel.prAuc },
    topAssociations: categorical.slice(0, 6).map(({ variable, label, cramersV }) => ({ variable, label, cramersV })),
    rqSummaries: [
      {
        id: "rq1",
        eyebrow: "Statistical association",
        title: "Which factors move with diabetes?",
        finding: "General health and high blood pressure lead the categorical associations; BMI has the largest numeric effect.",
        chips: ["Cramér's V", "Cohen's d", "N = 229,474"],
        href: "/rq1",
      },
      {
        id: "rq2",
        eyebrow: "Prediction",
        title: "Which model and threshold fit screening?",
        finding: "XGBoost leads on PR-AUC; lowering the threshold to 0.15 raises recall to about 80%.",
        chips: ["XGBoost", "PR-AUC 0.445", "Recall 79.6%"],
        href: "/rq2",
      },
      {
        id: "rq3",
        eyebrow: "Explainability",
        title: "Do SHAP and statistics tell the same story?",
        finding: "The strongest model signals align with the study's statistical evidence, with correlated factors under-represented in SHAP.",
        chips: ["TreeExplainer", "2 groups", "21 features"],
        href: "/rq3",
      },
    ],
    pipeline: [
      { step: "Business", tool: "3 research questions" },
      { step: "Data", tool: "SQL" },
      { step: "Preparation", tool: "pandas" },
      { step: "Modeling", tool: "4 models" },
      { step: "Evaluation", tool: "PR-AUC" },
      { step: "Explainability", tool: "SHAP" },
    ],
  };

  const rq1 = { categorical, numeric, notes: { largeN: true } };
  const defaultThreshold = thresholds.find((row) => row.t === 0.5);
  const optimizedThreshold = thresholds.find((row) => row.t === 0.15);
  if (!defaultThreshold || !optimizedThreshold) throw new Error("Required threshold rows are missing");
  const highlight = (row) => ({
    t: row.t,
    accuracy: row.accuracy,
    precision: row.precision,
    recall: row.recall,
    f1: row.f1,
    cm: { tn: row.tn, fp: row.fp, fn: row.fn, tp: row.tp },
  });
  const rq2 = {
    models,
    bestModelName: bestModel.name,
    thresholds,
    highlights: { default: highlight(defaultThreshold), optimized: highlight(optimizedThreshold) },
  };

  const strongGroup = "Group 1: Strong Agreement (Significant & High SHAP)";
  const underGroup = "Group 2: Under-represented (Significant & Low SHAP)";
  const rq3 = {
    features,
    groups: [
      { key: "strong-agreement", label: "Strong Agreement", members: features.filter((item) => item.group === strongGroup).map((item) => item.variable) },
      { key: "under-represented", label: "Under-represented", members: features.filter((item) => item.group === underGroup).map((item) => item.variable) },
    ],
    figures: {
      beeswarm: "/figures/shap_summary_dot.png",
      bar: "/figures/shap_summary_bar.png",
      localDiabetic: "/figures/shap_local_diabetic.png",
      localHealthy: "/figures/shap_local_healthy.png",
    },
  };

  if (rq3.groups.some((group) => group.members.length === 0)) throw new Error("Unexpected consistency group data");

  await Promise.all([
    writeJson("overview.json", overview, `topAssociations=${overview.topAssociations.length}, pipeline=${overview.pipeline.length}`),
    writeJson("rq1.json", rq1, `categorical=${categorical.length}, numeric=${numeric.length}`),
    writeJson("rq2.json", rq2, `models=${models.length}, thresholds=${thresholds.length}`),
    writeJson("rq3.json", rq3, `features=${features.length}, groups=${rq3.groups.length}`),
  ]);

  const figurePaths = [
    ["xai", "shap_summary_dot.png"],
    ["xai", "shap_summary_bar.png"],
    ["xai", "shap_local_diabetic.png"],
    ["xai", "shap_local_healthy.png"],
    ["modeling", "roc_curves.png"],
    ["modeling", "pr_curves.png"],
    ["statistical_analysis", "top_categorical_prevalence.png"],
    ["statistical_analysis", "bmi_boxplot.png"],
  ];
  await Promise.all(
    figurePaths.map(([folder, filename]) =>
      copyFile(path.join(resultsRoot, folder, filename), path.join(figuresRoot, filename)),
    ),
  );
  console.log(`[build-data] figures: ${figurePaths.length} copied`);
}

main().catch((error) => {
  console.error(`[build-data] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
