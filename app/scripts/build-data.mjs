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

const CATEGORICAL_VARIABLES = [
  "GenHlth",
  "HighBP",
  "DiffWalk",
  "HighChol",
  "Age",
  "HeartDiseaseorAttack",
  "Income",
  "Education",
  "PhysActivity",
  "Stroke",
  "CholCheck",
  "HvyAlcoholConsump",
  "Smoker",
  "Veggies",
  "Sex",
  "AnyHealthcare",
  "Fruits",
  "NoDocbcCost",
];

const BINARY_VARIABLES = new Set([
  "HighBP",
  "DiffWalk",
  "HighChol",
  "HeartDiseaseorAttack",
  "PhysActivity",
  "Stroke",
  "CholCheck",
  "HvyAlcoholConsump",
  "Smoker",
  "Veggies",
  "AnyHealthcare",
  "Fruits",
  "NoDocbcCost",
]);

const LEVEL_LABELS = {
  Sex: { "0": "Female", "1": "Male" },
  GenHlth: { "1": "Excellent", "2": "Very good", "3": "Good", "4": "Fair", "5": "Poor" },
  Age: {
    "1": "18-24",
    "2": "25-29",
    "3": "30-34",
    "4": "35-39",
    "5": "40-44",
    "6": "45-49",
    "7": "50-54",
    "8": "55-59",
    "9": "60-64",
    "10": "65-69",
    "11": "70-74",
    "12": "75-79",
    "13": "80+",
  },
  Education: {
    "1": "Never / kindergarten",
    "2": "Grades 1-8",
    "3": "Grades 9-11",
    "4": "High school graduate",
    "5": "Some college",
    "6": "College graduate",
  },
  Income: {
    "1": "< $10k",
    "2": "$10k-$15k",
    "3": "$15k-$20k",
    "4": "$20k-$25k",
    "5": "$25k-$35k",
    "6": "$35k-$50k",
    "7": "$50k-$75k",
    "8": "$75k+",
  },
};

function levelLabel(variable, value) {
  if (LEVEL_LABELS[variable]?.[value]) return LEVEL_LABELS[variable][value];
  if (BINARY_VARIABLES.has(variable)) return value === "1" ? "Yes" : "No";
  return `Level ${value}`;
}

function bmiBand(value) {
  if (value < 18.5) return "underweight";
  if (value < 25) return "healthy";
  if (value < 30) return "overweight";
  return "obesity";
}

function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  return result;
}

async function parseCsv(relativePath) {
  const inputPath = path.join(repoRoot, relativePath);
  const raw = await readFile(inputPath, "utf8");
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error(`No data rows found in ${relativePath}`);
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line, rowIndex) => {
    const cells = splitCsvLine(line);
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

async function datasetAnalytics() {
  const relativePath = path.join("data", "processed", "diabetes_cleaned.csv");
  const raw = await readFile(path.join(repoRoot, relativePath), "utf8");
  const lines = raw.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  const headers = lines[0].split(",").map((cell) => cell.trim());
  const index = Object.fromEntries(headers.map((header, position) => [header, position]));
  const required = ["Diabetes_binary", "Sex", "Age", "BMI", "HighBP", ...CATEGORICAL_VARIABLES];
  for (const column of required) {
    if (index[column] === undefined) throw new Error(`${relativePath}: ${column} column is missing`);
  }

  let diabeticN = 0;
  const cohortCells = new Map();
  const categoryCells = Object.fromEntries(CATEGORICAL_VARIABLES.map((variable) => [variable, new Map()]));

  for (const line of lines.slice(1)) {
    const cells = line.split(",");
    const diabetic = Number(cells[index.Diabetes_binary]) === 1 ? 1 : 0;
    diabeticN += diabetic;

    const sex = Number(cells[index.Sex]);
    const age = Number(cells[index.Age]);
    const highBP = Number(cells[index.HighBP]);
    const band = bmiBand(Number(cells[index.BMI]));
    const cohortKey = `${sex}|${age}|${band}|${highBP}`;
    const cohort = cohortCells.get(cohortKey) ?? { sex, age, bmiBand: band, highBP, n: 0, positiveClassN: 0 };
    cohort.n += 1;
    cohort.positiveClassN += diabetic;
    cohortCells.set(cohortKey, cohort);

    for (const variable of CATEGORICAL_VARIABLES) {
      const value = cells[index[variable]];
      const groups = categoryCells[variable];
      const group = groups.get(value) ?? { value, n: 0, positiveClassN: 0 };
      group.n += 1;
      group.positiveClassN += diabetic;
      groups.set(value, group);
    }
  }

  const nRows = lines.length - 1;
  const noDiabetesN = nRows - diabeticN;
  return {
    profile: {
      nRows,
      nFeatures: headers.length - 1,
      noDiabetesN,
      positiveClassN: diabeticN,
      noDiabetesPct: Number(((noDiabetesN / nRows) * 100).toFixed(1)),
      positiveClassPct: Number(((diabeticN / nRows) * 100).toFixed(1)),
    },
    cohortCube: [...cohortCells.values()].sort((a, b) => a.age - b.age || a.sex - b.sex || a.highBP - b.highBP),
    categoryLevels: Object.fromEntries(
      CATEGORICAL_VARIABLES.map((variable) => [
        variable,
        [...categoryCells[variable].values()]
          .sort((a, b) => Number(a.value) - Number(b.value))
          .map((group) => ({
            ...group,
            label: levelLabel(variable, group.value),
            prevalencePct: Number(((group.positiveClassN / group.n) * 100).toFixed(2)),
          })),
      ]),
    ),
  };
}

function categoricalRows(rows, categoryLevels) {
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
      levels: categoryLevels[row.Variable] ?? [],
    }))
    .sort((a, b) => b.cramersV - a.cramersV);
}

function numericRows(rows) {
  return rows.map((row) => ({
    variable: row.Variable,
    noDiabetesMean: number(row, "No Reported Diabetes Mean" in row ? "No Reported Diabetes Mean" : "Healthy Mean"),
    positiveClassMean: number(row, "Prediabetes/Diabetes Positive Mean" in row ? "Prediabetes/Diabetes Positive Mean" : "Diabetic Mean"),
    meanDiff: number(row, "Mean Difference"),
    noDiabetesMedian: number(row, "No Reported Diabetes Median" in row ? "No Reported Diabetes Median" : "Healthy Median"),
    positiveClassMedian: number(row, "Prediabetes/Diabetes Positive Median" in row ? "Prediabetes/Diabetes Positive Median" : "Diabetic Median"),
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
    accuracy: number(row, "Mean_Accuracy" in row ? "Mean_Accuracy" : "Accuracy"),
    precision: number(row, "Mean_Precision" in row ? "Mean_Precision" : "Precision"),
    recall: number(row, "Mean_Recall" in row ? "Mean_Recall" : "Recall"),
    f1: number(row, "Mean_F1" in row ? "Mean_F1" : ("F1-score" in row ? "F1-score" : "F1")),
    rocAuc: number(row, "Mean_ROC_AUC" in row ? "Mean_ROC_AUC" : "ROC-AUC"),
    prAuc: number(row, "Mean_PR_AUC" in row ? "Mean_PR_AUC" : "PR-AUC"),
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

function holdoutRows(rows) {
  // results/modeling/final_test_metrics.csv: the locked holdout evaluation.
  // Kept separate from the OOF threshold sweep so neither can be mistaken for the other.
  const shape = (row) => ({
    t: number(row, "Threshold"),
    accuracy: number(row, "Accuracy"),
    precision: number(row, "Precision"),
    recall: number(row, "Recall"),
    specificity: number(row, "Specificity"),
    f1: number(row, "F1-score"),
    rocAuc: number(row, "ROC-AUC"),
    prAuc: number(row, "PR-AUC"),
    cm: {
      tn: number(row, "TN"),
      fp: number(row, "FP"),
      fn: number(row, "FN"),
      tp: number(row, "TP"),
    },
  });
  const byThreshold = (target) =>
    rows.find((row) => Math.abs(number(row, "Threshold") - target) < 0.001);
  const defaultRow = byThreshold(0.5);
  const selectedRow = rows.find((row) => Math.abs(number(row, "Threshold") - 0.5) >= 0.001);
  if (!defaultRow || !selectedRow) throw new Error("final_test_metrics.csv is missing a required row");
  const shaped = shape(selectedRow);
  return {
    evaluationSplit: selectedRow["Evaluation_Split"] || "Untouched holdout test",
    sampleSize: shaped.cm.tn + shaped.cm.fp + shaped.cm.fn + shaped.cm.tp,
    default: shape(defaultRow),
    selected: shaped,
  };
}

function featureRows(rows) {
  return rows
    .map((row) => ({
      variable: row.Variable,
      label: VARIABLE_LABELS[row.Variable] ?? row.Variable,
      shapImportance: number(row, "SHAP_Importance"),
      pValue: number(row, "p_value" in row ? "p_value" : "p-value"),
      effectSize: number(row, "Effect_Size"),
      effectSizeType: row.Effect_Size_Type,
      statInterpretation: row.Stat_Interpretation ?? row.Consistency_Interpretation ?? "Non-negligible",
      shapRank: number(row, "SHAP_Rank"),
      statRank: number(row, "Stat_Rank" in row ? "Stat_Rank" : "Effect_Size_Rank"),
      group: row.Consistency_Group,
    }))
    .sort((a, b) => a.shapRank - b.shapRank);
}

function adjustedRows(rows) {
  return rows
    .map((row) => ({
      variable: row.Variable,
      label: VARIABLE_LABELS[row.Variable] ?? row.Description ?? row.Variable,
      oddsRatio: number(row, "Odds_Ratio"),
      ciLower: number(row, "OR_95_CI_Lower"),
      ciUpper: number(row, "OR_95_CI_Upper"),
      vif: number(row, "VIF"),
      holmP: number(row, "Holm_p_value"),
      significant: String(row.Reject_Holm).toLowerCase() === "true",
    }))
    .sort((a, b) => b.oddsRatio - a.oddsRatio);
}

// Average ("midrank") ranking, so tied ranks are handled the way scipy.stats.spearmanr does.
function midranks(values) {
  const order = values.map((value, index) => index).sort((a, b) => values[a] - values[b]);
  const out = new Array(values.length);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && values[order[j + 1]] === values[order[i]]) j += 1;
    const average = (i + j) / 2 + 1;
    for (let k = i; k <= j; k += 1) out[order[k]] = average;
    i = j + 1;
  }
  return out;
}

function pearson(a, b) {
  const n = a.length;
  const meanA = a.reduce((sum, value) => sum + value, 0) / n;
  const meanB = b.reduce((sum, value) => sum + value, 0) / n;
  let num = 0;
  let devA = 0;
  let devB = 0;
  for (let i = 0; i < n; i += 1) {
    num += (a[i] - meanA) * (b[i] - meanB);
    devA += (a[i] - meanA) ** 2;
    devB += (b[i] - meanB) ** 2;
  }
  if (devA === 0 || devB === 0) throw new Error("Cannot compute rank correlation: zero variance");
  return num / Math.sqrt(devA * devB);
}

function alignmentSummary(features, sensitivityCsv) {
  // Spearman is printed but never exported by shap_analysis.py, so it is recomputed here
  // from the same SHAP and effect-size ranks. Verified to reproduce the reported 0.7098.
  const spearman = pearson(
    midranks(features.map((item) => item.shapRank)),
    midranks(features.map((item) => item.statRank)),
  );
  const topK = sensitivityCsv
    .map((row) => ({
      k: number(row, "Top_K"),
      overlap: number(row, "SHAP_vs_Univariate_Overlap"),
      jaccard: number(row, "SHAP_vs_Univariate_Jaccard"),
      overlapAdjustedOr: number(row, "SHAP_vs_AdjustedOR_Overlap"),
      jaccardAdjustedOr: number(row, "SHAP_vs_AdjustedOR_Jaccard"),
    }))
    .sort((a, b) => a.k - b.k);
  if (!topK.length) throw new Error("No rank sensitivity rows found");
  return { spearman, featureCount: features.length, topK };
}

async function writeJson(name, value, summary) {
  await writeFile(path.join(generatedRoot, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
  console.log(`[build-data] ${name}: ${summary}`);
}

async function main() {
  await mkdir(generatedRoot, { recursive: true });
  await mkdir(figuresRoot, { recursive: true });

  const [dataset, categoricalCsv, numericCsv, modelsCsv, thresholdsCsv, consistencyCsv, calibrationCsv, holdoutCsv, adjustedCsv, sensitivityCsv, modelSelectionMeta] = await Promise.all([
    datasetAnalytics(),
    parseCsv(path.join("results", "statistical_analysis", "chi_square_results.csv")),
    parseCsv(path.join("results", "statistical_analysis", "numerical_results.csv")),
    parseCsv(path.join("results", "modeling", "cv_model_comparison.csv")),
    parseCsv(path.join("results", "modeling", "threshold_analysis.csv")),
    parseCsv(path.join("results", "xai", "explanation_consistency.csv")),
    parseCsv(path.join("results", "modeling", "calibration_metrics.csv")),
    parseCsv(path.join("results", "modeling", "final_test_metrics.csv")),
    parseCsv(path.join("results", "statistical_analysis", "adjusted_association.csv")),
    parseCsv(path.join("results", "xai", "rank_sensitivity_analysis.csv")),
    readFile(path.join(repoRoot, "results", "modeling", "model_selection.json"), "utf8").then(JSON.parse).catch(() => null),
  ]);

  const profile = dataset.profile;
  const categorical = categoricalRows(categoricalCsv, dataset.categoryLevels);
  const numeric = numericRows(numericCsv);
  const models = modelRows(modelsCsv);
  const thresholds = thresholdRows(thresholdsCsv);
  const features = featureRows(consistencyCsv);
  const calibRow = calibrationCsv[0] || {};
  const calibration = {
    brierScore: number(calibRow, "Brier_Score"),
    slope: number(calibRow, "Calibration_Slope"),
    intercept: number(calibRow, "Calibration_Intercept"),
    sampleSize: number(calibRow, "Holdout_Sample_Size"),
    evaluationSplit: calibRow["Evaluation_Split"] || "Untouched holdout test",
  };
  const holdout = holdoutRows(holdoutCsv);
  const bestModel = models.find((model) => model.isBest);
  if (!bestModel) throw new Error("Could not determine the best model");

  const developmentSize = modelSelectionMeta
    ? Number(modelSelectionMeta.development_sample_size)
    : profile.nRows - holdout.sampleSize;
  const holdoutSize = modelSelectionMeta
    ? Number(modelSelectionMeta.holdout_test_sample_size)
    : holdout.sampleSize;
  if (holdoutSize !== holdout.sampleSize) {
    throw new Error(`Holdout size disagrees: model_selection.json says ${holdoutSize}, final_test_metrics.csv sums to ${holdout.sampleSize}`);
  }
  if (developmentSize + holdoutSize !== profile.nRows) {
    throw new Error(`Split sizes do not sum to the dataset: ${developmentSize} + ${holdoutSize} != ${profile.nRows}`);
  }

  const MODELS_SPLIT = "5-fold cross-validation on the development set";
  const THRESHOLDS_SPLIT = "Development out-of-fold";

  const selectedThresholdVal = modelSelectionMeta ? Number(modelSelectionMeta.selected_threshold) : 0.13;
  const defaultThreshold = thresholds.find((row) => Math.abs(row.t - 0.5) < 0.01);
  const optimizedThreshold = thresholds.find((row) => Math.abs(row.t - selectedThresholdVal) < 0.01) || thresholds.reduce((closest, row) => (Math.abs(row.t - selectedThresholdVal) < Math.abs(closest.t - selectedThresholdVal) ? row : closest));
  if (!defaultThreshold || !optimizedThreshold) throw new Error("Required threshold rows are missing");

  const overview = {
    dataset: {
      name: "CDC BRFSS 2015",
      nRows: profile.nRows,
      nFeatures: profile.nFeatures,
      target: "Diabetes_binary",
      testSize: holdoutSize,
      developmentSize,
      split: "stratified 80/20",
    },
    classBalance: {
      noDiabetesPct: profile.noDiabetesPct,
      positiveClassPct: profile.positiveClassPct,
      noDiabetesN: profile.noDiabetesN,
      positiveClassN: profile.positiveClassN,
    },
    cohortCube: dataset.cohortCube,
    bestModel: {
      name: bestModel.name,
      rocAuc: bestModel.rocAuc,
      prAuc: bestModel.prAuc,
      evaluationSplit: MODELS_SPLIT,
    },
    holdout: {
      evaluationSplit: holdout.evaluationSplit,
      sampleSize: holdout.sampleSize,
      rocAuc: holdout.selected.rocAuc,
      prAuc: holdout.selected.prAuc,
    },
    topAssociations: categorical.slice(0, 6).map(({ variable, label, cramersV }) => ({ variable, label, cramersV })),
    rqSummaries: [
      {
        id: "rq1",
        eyebrow: "Statistical association",
        title: "Which factors move with diabetes?",
        finding: "General health and high blood pressure lead categorical associations; BMI has the largest numeric rank-biserial effect.",
        chips: ["Cramér's V", "Rank-Biserial", `N = ${profile.nRows.toLocaleString()}`],
        href: "/rq1",
      },
      {
        id: "rq2",
        eyebrow: "Prediction",
        title: "Which model and threshold fit screening?",
        finding: `${bestModel.name} leads on PR-AUC; adjusting the threshold to ${selectedThresholdVal.toFixed(2)} raises recall to ${(optimizedThreshold.recall * 100).toFixed(1)}%.`,
        chips: [bestModel.name, `PR-AUC ${bestModel.prAuc.toFixed(3)}`, `Recall ${(optimizedThreshold.recall * 100).toFixed(1)}%`],
        href: "/rq2",
      },
      {
        id: "rq3",
        eyebrow: "Explainability",
        title: "Do SHAP and statistics tell the same story?",
        finding: "The strongest model signals align with statistical evidence, classified across four evidence alignment groups.",
        chips: ["TreeExplainer", "4 groups", "21 features"],
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

  const adjusted = adjustedRows(adjustedCsv);
  const rq1 = { categorical, numeric, adjusted, notes: { largeN: true } };
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
    modelsSplit: MODELS_SPLIT,
    bestModelName: bestModel.name,
    splits: { developmentSize, holdoutSize },
    thresholds,
    thresholdsSplit: THRESHOLDS_SPLIT,
    highlights: { default: highlight(defaultThreshold), optimized: highlight(optimizedThreshold) },
    holdout,
    calibration,
    figures: {
      holdoutCurves: "/figures/holdout_roc_pr_curves.png",
      thresholdSweep: "/figures/threshold_analysis.png",
    },
  };

  const uniqueGroups = [...new Set(features.map((f) => f.group))];
  const rq3 = {
    features,
    groups: uniqueGroups.map((grp) => ({
      key: grp.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      label: grp,
      members: features.filter((item) => item.group === grp).map((item) => item.variable),
    })),
    alignment: alignmentSummary(features, sensitivityCsv),
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
    writeJson("rq1.json", rq1, `categorical=${categorical.length}, numeric=${numeric.length}, adjusted=${adjusted.length}`),
    writeJson("rq2.json", rq2, `models=${models.length}, thresholds=${thresholds.length}`),
    writeJson("rq3.json", rq3, `features=${features.length}, groups=${rq3.groups.length}, spearman=${rq3.alignment.spearman.toFixed(4)}`),
  ]);

  const figurePaths = [
    ["xai", "shap_summary_dot.png"],
    ["xai", "shap_summary_bar.png"],
    ["xai", "shap_local_diabetic.png"],
    ["xai", "shap_local_healthy.png"],
    ["modeling", "holdout_roc_pr_curves.png"],
    ["modeling", "threshold_analysis.png"],
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
