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
| **Table 8: SHAP–Statistical Evidence Alignment** | `results/xai/explanation_consistency.csv` | 4 alignment groups, SHAP rank, effect size rank, adjusted OR rank. |
| **Table 9: Rank Alignment Sensitivity Analysis** | `results/xai/rank_sensitivity_analysis.csv` | Top-5, Top-10, Top-15 Jaccard similarity and overlap counts. |

---

## 4. Main Canonical Figures

| Paper Figure | Artifact Path | Format |
| :--- | :--- | :--- |
| **Figure 1: Methodology Pipeline** | `docs/figures/methodology_pipeline.png` | PNG (300 DPI) & SVG |
| **Figure 2: Class Distribution** | `docs/figures/class_distribution.png` | PNG (300 DPI) & SVG |
| **Figure 3: Effect Size Evidence by Feature Family** | `docs/figures/effect_size_ranking.png` | PNG (300 DPI) |
| **Figure 4: 5-Fold CV Model Comparison** | `docs/figures/cv_model_comparison.png` | PNG (300 DPI) |
| **Figure 5: Holdout ROC & PR Curves** | `docs/figures/holdout_roc_pr_curves.png` | PNG (300 DPI) |
| **Figure 6: Threshold Selection & Trade-off** | `docs/figures/threshold_tradeoff.png` | PNG (300 DPI) |
| **Figure 7: Holdout Calibration Curve** | `docs/figures/holdout_calibration_curve.png` | PNG (300 DPI) |
| **Figure 8: Global SHAP Feature Importance** | `docs/figures/shap_global_importance.png` | PNG (300 DPI) & SVG |
| **Figure 9: Global SHAP Summary Beeswarm** | `docs/figures/shap_summary_beeswarm.png` | PNG (300 DPI) & SVG |
| **Figure 10: Local SHAP Explanation (Class 1 Profile)** | `docs/figures/shap_local_high_risk.png` | PNG (300 DPI) & SVG |
| **Figure 11: Effect Size–SHAP Alignment Framework** | `docs/figures/effect_size_shap_alignment.png` | PNG (300 DPI) & SVG |

---

## 5. Scientific Wording Restrictions for Paper Authors

When writing the manuscript, strictly observe the following phrasing rules:
- **No Causal Language:** Do NOT use words like `cause`, `causal factor`, `determinant`, `independent predictor`, or `population risk factor`. Use `associated feature`, `marginal association`, `sample-level association`, `predictive feature contribution`.
- **No Population-Level Overclaims:** Do NOT claim results represent the overall US population, as survey weights are not incorporated. Specify: `within the unweighted analyzed BRFSS sample`.
- **Neutral Class Labels:** Do NOT refer to Class 0 as "healthy" or Class 1 as "diabetic". Always use `No reported diabetes` for Class 0 and `Prediabetes or diabetes` for Class 1.
- **No "External Validation":** The test partition is derived from the same BRFSS dataset split. Use `independent internal holdout` or `held-out test set`.
- **No "Model Recalibration" Overclaim:** The calibration analysis measures calibration slope and intercept (`holdout calibration assessment`), without fitting a post-hoc calibrator to alter model probabilities.
- **No SHAP "Clinical Validation":** Frame SHAP analysis as `exploratory evidence alignment` or `model-level feature attribution`, NOT as clinical proof or statistical validation of SHAP.
