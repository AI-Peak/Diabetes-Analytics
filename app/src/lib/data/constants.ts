export const PAGES = [
  { id: "overview", label: "Overview", href: "/overview", tag: "Study", description: "Evidence chain" },
  { id: "rq1", label: "Statistical association", href: "/rq1", idx: "01", tag: "Stats", description: "Effect sizes" },
  { id: "rq2", label: "Prediction & threshold", href: "/rq2", idx: "02", tag: "ML", description: "Recall-first" },
  { id: "rq3", label: "Explainable AI", href: "/rq3", idx: "03", tag: "XAI", description: "SHAP consistency" },
  { id: "assistant", label: "AI Assistant", href: "/assistant", tag: "Ask", description: "Grounded answers" },
] as const;

export const STUDY = {
  n: 229_474,
  testSize: 45_895,
  healthyPct: 84.7,
  diabeticPct: 15.3,
} as const;

export const VARIABLE_LABELS: Record<string, string> = {
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
