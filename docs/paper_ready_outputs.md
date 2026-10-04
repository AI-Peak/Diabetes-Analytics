# Paper-Ready Output Reference Guide

This document maps all canonical datasets, method scripts, main tables, main figures, and manuscript wording restrictions for writing the research paper based on the **Predicting Diabetes Risk Using CDC Health Indicators** study.

---

## 1. Dataset & Study Parameters

- **Primary Cleaned Dataset:** `data/processed/diabetes_cleaned.csv`
- **Total Analyzed Sample Size ($N$):** 253,680 survey respondents
- **Target Variable:** `Diabetes_binary`
- **Class 0 Definition:** `No reported diabetes` ($n = 218,334$, 86.07%)
- **Class 1 Definition:** `Prediabetes or diabetes` ($n = 35,346$, 13.93%)
- **Development Set ($80\%$):** $n = 202,944$
- **Holdout Test Set ($20\%$):** $n = 50,736$ (independent internal holdout)

---

## 2. Analytical Methods & Core Scripts

| Analytical Stage | Primary Script | Description |
| :--- | :--- | :--- |
| **Data Preprocessing & Validation** | `notebooks/data_preprocessing.py` | Missingness check, range validation, repeated profile inspection, int casting. |
| **Univariate Statistical Analysis** | `python_analysis/statistical_analysis.py` | Chi-square ($\chi^2$), Cramér's V, Welch t-test, Mann-Whitney U, Rank-Biserial $r$, Holm adjustment. |
| **Adjusted Association Analysis** | `python_analysis/statistical_analysis.py` | Multivariable Logistic Regression, Odds Ratios (OR), 95% CIs, VIF multicollinearity. |
| **Predictive Modeling & Selection** | `python_analysis/model_training.py` | 5-Fold Stratified CV on Dev set; PR-AUC selection criterion; pipelines for scaling. |
| **Threshold Optimization** | `python_analysis/model_training.py` | Out-Of-Fold (OOF) Dev predictions, screening objective ($\text{Recall} \ge 0.80$). |
| **Holdout Evaluation & Bootstrap CIs** | `python_analysis/model_training.py` | Single holdout test fit, 1,000-fold stratified bootstrap 95% CIs. |
| **Holdout Calibration Assessment** | `python_analysis/model_training.py` | Brier score, Cox calibration slope, intercept, reliability diagram. |
| **Explainable AI (SHAP)** | `python_analysis/shap_analysis.py` | TreeExplainer on 10,000 holdout sample, global summary & local waterfall plots. |
| **Evidence Alignment Diagnostics** | `python_analysis/shap_analysis.py` | 4 evidence groups, Top-K overlap, Jaccard similarity, Spearman rank correlation. |

---

## 3. Main Canonical Tables

| Paper Table | Artifact File Location | Key Contents |
| :--- | :--- | :--- |
| **Table 1: Preprocessing & Data Overview** | `results/data_preprocessing/preprocessing_summary.csv` | Preprocessing steps, repeated profiles count, class distribution. |
| **Table 2: Univariate & Effect Size Statistics** | `results/statistical_analysis/chi_square_results.csv`, `numerical_results.csv` | $\chi^2$, Cramér's V, Mann-Whitney U, Rank-Biserial $r$, Holm-adjusted p-values. |
| **Table 3: Multivariable Adjusted Associations** | `results/statistical_analysis/adjusted_association.csv` | Coefficients, SE, z-stat, Adjusted ORs, 95% CIs, VIF values. |
| **Table 4: 5-Fold Cross-Validation Comparison** | `results/modeling/cv_model_comparison.csv` | Mean $\pm$ SD across 5 folds for PR-AUC, ROC-AUC, F1, Recall, Precision. |
| **Table 5: Threshold Selection Analysis** | `results/modeling/threshold_analysis.csv` | OOF Recall, Precision, F1, TP, FP, TN, FN across thresholds 0.01 to 0.99. |
| **Table 6: Untouched Holdout Test Metrics** | `results/modeling/final_test_metrics.csv` | Holdout performance at default (0.50) vs validation-selected threshold (0.13). |
| **Table 7: Holdout Calibration Assessment** | `results/modeling/calibration_metrics.csv` | Brier score, calibration slope, calibration intercept. |
| **Table 8: SHAP–Statistical Evidence Alignment** | `results/xai/explanation_consistency.csv` | Multivariable likelihood-ratio chi2 contributions vs global SHAP importance attributions. |
| **Table 9: Rank Alignment Sensitivity Analysis** | `results/xai/rank_sensitivity_analysis.csv` | Top-5, Top-10, Top-15 Jaccard similarity and degree-of-freedom sensitivity (Chi2 - df, Chi2 / df). |
| **Table 10: Primary vs Grouped Comparison** | `results/phase2_sensitivity/primary_vs_grouped_comparison.csv` | Full metric comparison and deltas between Primary Stratified and Profile-Grouped Redevelopment. |

---

## 4. Main Canonical Figures

The 9 authoritative publication figures tracked in `docs/figures/` (cataloged in `docs/figures/final_figure_inventory.csv`):

| Figure ID | Filename | Research Question | Purpose |
| :---: | :--- | :---: | :--- |
| **FIG-01** | `methodology_pipeline_final.png` | Overall Methodology | End-to-end 12-step scientific methodology workflow diagram |
| **FIG-02** | `effect_size_ranking.png` | RQ1 | Univariate statistical associations (Cramer's V & rank-biserial with Holm-Bonferroni correction) |
| **FIG-03** | `cv_model_comparison.png` | RQ2 | 5-fold cross-validation performance comparison across supervised classifiers |
| **FIG-04** | `threshold_tradeoff.png` | RQ2 | Development out-of-fold screening decision threshold optimization curve ($t^* = 0.13$) |
| **FIG-05** | `holdout_roc_pr_curves.png` | RQ2 | Primary internal holdout discrimination curves (ROC and PR) |
| **FIG-06** | `figure2_calibration_curves.png` | RQ2 / RQ4 | Joint Cox calibration curves comparing primary stratified vs zero-overlap grouped models |
| **FIG-07** | `shap_summary_beeswarm.png` | RQ3 | TreeExplainer SHAP beeswarm plot displaying global importance and directional attribution |
| **FIG-08** | `effect_size_shap_alignment.png` | RQ3 | Likelihood-ratio Chi2 vs global SHAP importance ranking alignment and quadrant classification |
| **FIG-09** | `figure1_discrimination_comparison.png` | RQ4 | Primary stratified vs profile-grouped redevelopment discrimination comparison (ROC and PR) |

### Exploratory & Supplementary Figures (`docs/figures/`)

| Supplementary Figure | Artifact Path | Description |
| :--- | :--- | :--- |
| **Class Distribution** | `docs/figures/class_distribution.png` | Pre-modeling binary class balance (86.07% vs 13.93%). |
| **Local SHAP Waterfall** | `docs/figures/shap_local_high_risk.png` | Local high-risk individual prediction explanation. |
| **Univariate Numeric Distributions** | `docs/figures/eda_univariate_numeric.png` | Distribution of continuous/discrete numeric indicators across target classes. |
| **Univariate Categorical Composition** | `docs/figures/eda_univariate_categorical.png` | Proportions of ordinal and binary indicators across target classes. |
| **Correlation Heatmap** | `docs/figures/eda_correlation_heatmap.png` | 22x22 Spearman rank correlation matrix demonstrating absence of high collinearity. |

---

## 5. Scientific Wording Restrictions for Paper Authors

When writing the manuscript, strictly observe the following phrasing rules:
- **No Causal Language:** Do NOT use words like `cause`, `causal factor`, `determinant`, `independent predictor`, or `population risk factor`. Use `associated feature`, `marginal association`, `sample-level association`, `predictive feature contribution`.
- **No Population-Level Overclaims:** Do NOT claim results represent the overall US population, as survey weights are not incorporated. Specify: `within the unweighted analyzed BRFSS sample`.
- **Neutral Class Labels:** Do NOT refer to Class 0 as "healthy" or Class 1 as "diabetic". Always use `No reported diabetes` for Class 0 and `Prediabetes or diabetes` for Class 1.
- **No "External Validation":** The test partition is derived from the same BRFSS dataset split. Use `independent internal holdout` or `held-out test set`.
- **No "Model Recalibration" Overclaim:** The calibration analysis measures calibration slope and intercept (`holdout calibration assessment`), without fitting a post-hoc calibrator to alter model probabilities.
- **No SHAP "Clinical Validation":** Frame SHAP analysis as `exploratory evidence alignment` or `model-level feature attribution`, NOT as clinical proof or statistical validation of SHAP.
