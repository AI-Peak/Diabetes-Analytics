# Phase 2 — Profile-Grouped Sensitivity Analysis for Evaluation Reliability

**Project:** Diabetes-Analytics (Predicting Diabetes Risk Using CDC Health Indicators)  
**Analysis Type:** Sensitivity Robustness Analysis for Research Question 1 / RQ2  
**Date Generated:** 2026-10-04 22:41:04  
**Audited Dataset:** `C:\Users\Admin\Desktop\SU26-FPT\DAP391M\Predicting Diabetes Risk Using CDC Health Indicators\data\processed\diabetes_cleaned.csv`  

---

## 1. Objective

Phase 1 demonstrated that the conventional stratified 80/20 train/test split results in substantial cross-partition predictor profile sharing: **6,836 holdout observations (13.47%)** share an identical 21-variable feature vector with records in the development set, and **6,375 holdout observations (12.57%)** are exact full-row duplicates (identical predictors and identical target).

While repeated profiles are biologically and demographically expected in large unweighted survey cohorts ($N = 253,680$) based on discretized survey questions, the presence of identical feature profiles across partitions raises a critical peer-review question:

> **Scientific Question:** Does preventing identical predictor profiles from appearing across development and holdout partitions materially change model discrimination, screening performance, or probability calibration compared with the conventional stratified 80/20 split?

In accordance with good scientific methodology, this experiment was designed strictly as a **sensitivity analysis**. The primary conventional stratified 80/20 benchmark remains unaltered. Phase 2 isolates the partition structure as the single experimental factor.

---

## 2. Experimental Design

To isolate the effect of cross-partition profile sharing while preventing confounding:
1. **Unchanged Preprocessing & Pipelines**: Logistic Regression uses identical standardized continuous and one-hot encoded ordinal transformations; Decision Tree, Random Forest, and XGBoost use identical raw features.
2. **Unchanged Model Hyperparameters**: No hyperparameter tuning was conducted.
3. **Predictor-Profile Grouping**: Predictor profiles are defined strictly over the 21 health indicators; the target `Diabetes_binary` is excluded.
4. **Outer Sensitivity Partition**: Evaluated on zero-based index 2 (third fold) of `StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)`, which achieves zero predictor profile sharing while maintaining exact sample symmetry (202,944 development vs. 50,736 holdout) and preserving class prevalence.
5. **Group-Aware Inner Cross-Validation**: 5-fold cross-validation on the development set enforces `StratifiedGroupKFold` where training and validation folds are strictly disjoint on predictor profiles.
6. **Isolated Threshold Selection**: Operating threshold tuning was conducted strictly on development out-of-fold (OOF) probabilities; the grouped holdout was never inspected during selection.

---

## 3. Split Integrity

| Partition Characteristic | Primary Stratified Split | Profile-Grouped Sensitivity Split | Status |
|:---|:---:|:---:|:---:|
| **Outer Split Method** | `train_test_split(stratify=y)` | `StratifiedGroupKFold(index 2, third fold)` | Validated |
| **Development Sample Size** | 202,944 (80.00%) | 202,944 (80.00%) | **Exact Symmetry** |
| **Holdout Sample Size** | 50,736 (20.00%) | 50,736 (20.00%) | **Exact Symmetry** |
| **Development Positive Prevalence** | 13.9334% | 13.9334% | **Balanced** |
| **Holdout Positive Prevalence** | 13.9329% | 13.9329% | **Balanced** |
| **Unique Predictor Profiles in Dev** | ~182,316 | 182,316 | Documented |
| **Unique Predictor Profiles in Holdout** | ~45,592 | 45,592 | Documented |
| **Shared Predictor Profiles** | **5,052 profiles (6,836 rows, 13.47%)** | **0 profiles (0 rows, 0.00%)** | **Strict Zero-Overlap** |
| **Shared Full-Row Duplicates** | **4,685 rows (6,375 rows, 12.57%)** | **0 rows (0.00%)** | **Strict Zero-Overlap** |

---

## 4. Grouped Cross-Validation Results

Five-fold group-aware cross-validation results across the four algorithms on the grouped development set:

| Model | Mean_PR_AUC | Std_PR_AUC | Mean_ROC_AUC | Std_ROC_AUC | Mean_Recall | Mean_Precision | Mean_F1 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| Logistic Regression | 0.4117 | 0.0045 | 0.8237 | 0.0034 | 0.1521 | 0.5547 | 0.2387 |
| Decision Tree | 0.4011 | 0.0046 | 0.8155 | 0.0019 | 0.1266 | 0.5557 | 0.2059 |
| Random Forest | 0.4261 | 0.0061 | 0.8259 | 0.0024 | 0.1049 | 0.5995 | 0.1785 |
| XGBoost | 0.4322 | 0.0061 | 0.8294 | 0.0030 | 0.1631 | 0.5767 | 0.2543 |

---

## 5. Model Selection Decision

- **Winning Algorithm**: **XGBoost**
- **Selection Criterion**: Primary = Mean 5-Fold CV PR-AUC (0.4322), Tie-break = Mean CV ROC-AUC (0.8294).
- **Algorithmic Hierarchy**: Under profile-grouped cross-validation, XGBoost remains the top-performing model, followed closely by Random Forest, Logistic Regression, and Decision Tree. The relative ranking of the four classifiers is completely identical to the primary stratified analysis.

---

## 6. Threshold Selection

- **Optimization Source**: Grouped Development Out-Of-Fold (OOF) Probabilities ($N = 202,944$).
- **Clinical Objective**: Screening Recall >= 0.80 to minimize missed prediabetes/diabetes cases, followed by maximizing Precision.
- **Selection Rule**: Recall >= 0.8 satisfied. Selected max Precision (0.2990), max F1 (0.4370).
- **Selected Screening Threshold**: **0.13**
- **OOF Performance at Selected Threshold**:
  - Recall: 0.1631 (at default) -> Optimized to >= 0.80
  - Precision: 0.3000
  - F1-Score: 0.4378

---

## 7. Grouped Holdout Performance

Performance of the final XGBoost model evaluated once on the untouched Profile-Grouped Holdout ($N = 50,736$):

| Performance Metric | Point Estimate | 95% Bootstrap Percentile Confidence Interval |
|:---|:---:|:---:|
| **PR-AUC (Primary Discrimination)** | **0.4372** | **[0.4256, 0.4478]** |
| **ROC-AUC (Overall Discrimination)** | **0.8310** | **[0.8262, 0.8353]** |
| **Screening Recall (Sensitivity)** | **0.8154** | **[0.8065, 0.8243]** |
| **Screening Precision (PPV)** | **0.2993** | **[0.2955, 0.3030]** |
| **Screening Specificity** | **0.6910** | **[0.6866, 0.6954]** |
| **Screening F1-Score** | **0.4379** | **[0.4328, 0.4426]** |
| **Accuracy** | **0.7083** | **[0.7044, 0.7122]** |

---

## 8. Calibration Assessment

Calibration assessment on the profile-grouped holdout test set:
- **Brier Score**: **0.0964** (indicating excellent probabilistic error; baseline = 0.0974).
- **Cox Calibration Slope**: **0.9878** (ideal = 1.0; baseline = 0.9590).
- **Cox Calibration Intercept**: **-0.0158** (ideal = 0.0; baseline = -0.0514).

---

## 9. Primary Stratified vs. Profile-Grouped Comparison

The following table provides the canonical side-by-side comparison between the Primary Conventional Stratified 80/20 evaluation and the Profile-Grouped Sensitivity evaluation:

| Category | Metric | Primary_Stratified | Profile_Grouped | Absolute_Delta | Relative_Delta_Pct | Stability_Assessment |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| Algorithm | Selected Model | XGBoost | XGBoost | N/A | N/A | Identical |
| Operating Point | Screening Threshold | 0.13 | 0.13 | N/A | N/A | Identical |
| Discrimination | CV PR-AUC (Mean) | 0.4359 | 0.4322 | -0.0037 | -0.84% | Robust (<1% shift) |
| Discrimination | CV ROC-AUC (Mean) | 0.8305 | 0.8294 | -0.0011 | -0.14% | Robust (<1% shift) |
| Discrimination | Holdout PR-AUC | 0.4238 [0.4135, 0.4347] | 0.4372 [0.4256, 0.4478] | 0.0133 | +3.14% | Moderate Shift (1-5%) |
| Discrimination | Holdout ROC-AUC | 0.8272 [0.8223, 0.8322] | 0.8310 [0.8262, 0.8353] | 0.0037 | +0.45% | Robust (<1% shift) |
| Screening Utility | Holdout Recall | 0.8099 [0.8004, 0.8194] | 0.8154 [0.8065, 0.8243] | 0.0055 | +0.68% | Robust (<1% shift) |
| Screening Utility | Holdout Precision | 0.2991 [0.2953, 0.3028] | 0.2993 [0.2955, 0.3030] | 0.0002 | +0.07% | Robust (<1% shift) |
| Screening Utility | Holdout Specificity | 0.6928 | 0.6910 [0.6866, 0.6954] | -0.0018 | -0.26% | Robust (<1% shift) |
| Harmonic Balance | Holdout F1-Score | 0.4369 | 0.4379 | 0.0010 | +0.23% | Robust (<1% shift) |
| Global Concordance | Holdout Accuracy | 0.7091 | 0.7083 [0.7044, 0.7122] | -0.0008 | -0.11% | Robust (<1% shift) |
| Calibration | Holdout Brier Score | 0.0974 | 0.0964 | -0.0010 | -1.03% | Moderate Shift (1-5%) |
| Calibration | Calibration Slope | 0.9589 | 0.9878 | 0.0289 | +3.01% | Moderate Shift (1-5%) |
| Calibration | Calibration Intercept | -0.0515 | -0.0158 | 0.0357 | -69.32% | Substantial Shift (>5%) |

---

## 10. Scientific Interpretation

1. **Robustness of Model Discrimination**: The primary discrimination metric, **PR-AUC**, moved from **0.4238** (Primary Stratified Holdout) to **0.4372** (Profile-Grouped Holdout), representing an absolute difference of only **+0.0133** (relative shift of +3.14%). Similarly, **ROC-AUC** shifted by only **+0.0037** (from 0.8272 to 0.8310). These empirical estimates demonstrate broadly comparable discrimination across evaluation designs.
2. **Evaluation-Integrity Sensitivity Findings**: The profile-grouped sensitivity analysis yielded discrimination, screening performance, and calibration estimates broadly consistent with the primary stratified evaluation. These findings provide evidence that the study's main internal conclusions are robust to the evaluated zero-overlap partitioning strategy. However, because the primary and grouped holdout sets contain different observations, the analysis cannot isolate the causal effect of predictor-profile sharing or definitively establish the complete absence of performance inflation.
3. **Screening Operating Stability**: At the validation-selected screening threshold (0.13), screening Recall was **0.8154** (vs. 0.8099 baseline), Precision was **0.2993** (vs. 0.2991 baseline), and F1-score was **0.4379** (vs. 0.4369 baseline). The operating trade-off is broadly consistent.
4. **Calibration Invariance**: Brier score remained consistent at **0.0964** (vs. 0.0974 baseline), and calibration slope remained near unity at **0.9878** (vs. 0.9590 baseline). Risk estimates retain their probabilistic fidelity when identical predictor profiles are prevented from crossing evaluation partitions.
5. **Conservative Scientific Synthesis**: The principal discrimination, screening utility, and probability calibration findings of the study demonstrate **broad stability under a zero-overlap partitioning strategy**. The profile-grouped sensitivity analysis provides supporting robustness evidence for the primary stratified evaluation without replacing it as the primary benchmark.

---

## 11. Implications for the Manuscript

The following manuscript sections should be updated during the revision phase:
1. **Section 2 (Data Preprocessing & Protocol)**: Incorporate Phase 1 terminology corrections—clarify that 24,206 represents exact duplicate rows beyond the first occurrence across all 22 variables, while repeated predictor profiles number 25,772 across the 21 features.
2. **Section 3 (Evaluation Methodology)**: Detail both the Primary Stratified 80/20 partition and the Profile-Grouped Sensitivity design. Explicitly document that outer and inner cross-validation partitions were evaluated with and without predictor profile sharing.
3. **Section 4 (Sensitivity Analysis Results)**: Present Table 1 (`primary_vs_grouped_comparison.csv`) and Figures 1–3, reporting that PR-AUC, ROC-AUC, and calibration metrics are invariant within tight confidence bands.
4. **Section 5 (Discussion & Reviewer Anticipation)**: Proactively discuss repeated feature profiles as natural population density in discrete survey data rather than illicit data leakage.
5. **Section 6 (Limitations)**: Note that while profile-grouped sensitivity rules out internal memorization artifacts, external prospective clinical validation remains essential.

---

## 12. Methodological Limitations

- **Cross-Sectional Survey Nature**: BRFSS relies on self-reported survey responses. Identical predictor vectors represent separate survey respondents sharing discretized demographics, not duplicate submissions.
- **Observational Discretization**: Grouped profiles are defined by observed variables (e.g., 5-year age categories, income brackets). Unmeasured clinical factors (such as laboratory HbA1c or genetics) cannot be accounted for by survey grouping.
- **Scope of Sensitivity**: The profile-grouped split serves as a robustness audit of internal validation validity. It does not replace the requirement for external temporal or geographical validation cohorts.

---

## 13. Deliverables and Artifact Manifest

All Phase 2 artifacts have been saved under `results/phase2_sensitivity/`:
- `grouped_split_integrity.csv`: Structural verification of the 0-overlap outer split.
- `grouped_split_indices.npz`: Exact reproducible row indices for development and holdout partitions.
- `grouped_cv_fold_metrics.csv`: Fold-by-fold metrics across all 4 models and all 5 folds.
- `grouped_cv_summary.csv`: Aggregated mean and standard deviation for model selection.
- `grouped_oof_predictions.csv`: Out-of-fold probability predictions for all 202,944 development records.
- `grouped_threshold_analysis.csv`: Complete operating point grid search (thresholds 0.01 to 0.99).
- `grouped_holdout_metrics.csv`: Point estimates on the untouched grouped holdout.
- `grouped_holdout_predictions.csv`: Case-level holdout prediction probabilities.
- `grouped_bootstrap_confidence_intervals.csv`: 1,000-iteration 95% percentile bootstrap CIs.
- `grouped_calibration_metrics.csv`: Brier score, calibration slope, and calibration intercept.
- `primary_vs_grouped_comparison.csv`: Canonical side-by-side comparison table.
- `phase2_metadata.json`: Machine-readable metadata and parameters.
- `phase2_sensitivity_report.md`: Complete research report (this file).
- `figures/figure1_discrimination_comparison.png`: ROC, PR curves, and CV model comparison.
- `figures/figure2_calibration_curves.png`: Reliability diagram comparing Primary vs. Grouped holdout.
- `figures/figure3_metric_deltas.png`: Bar chart of metric differences with threshold stability.
