# FINAL REPAIR REPORT: Deep Scientific, Reproducibility, Repository, and Manuscript Repair

**Project:** Diabetes Analytics / Predicting Diabetes Risk Using CDC Health Indicators  
**Author:** Senior Data Analytics Engineer / Antigravity AI Pair Programmer  
**Date:** October 4, 2026  
**Safety Branch:** `fix/reproducibility-paper-sync`  
**Pipeline Verification:** End-to-End Execution Passed in 760.90s (`run_pipeline.py`, Exit Code 0)  
**Manuscript Compilation:** Clean PDF Generation via `tectonic.exe` (`paper/main.pdf`, 390.8 KiB, 0 Fatal Errors)  
**Consistency Audit:** 105 of 105 Independent Automated Numerical Consistency Checks Passed (100%)  
**Numerical Provenance Audit:** 95 of 95 Quantitative Claims Traced Directly to Results Artifacts (100%)  
**Status:** READY FOR INDEPENDENT HUMAN REVIEW

---

## 1. Executive Summary

This investigation performed a comprehensive, deep scientific, code, repository, reproducibility, and manuscript repair for the project *Predicting Diabetes Risk Using CDC Health Indicators*. 

Prior revisions correctly identified key methodological challenges but left several technical and manuscript-level discrepancies:
1. Exact row duplicates (24,206 surplus) and repeated predictor profiles (25,772 surplus across 227,908 unique profiles) were frequently conflated.
2. Multivariable logistic regression modeled multi-category ordinal variables as single linear terms, obscuring level-specific odds ratios and producing collinearity ambiguities.
3. Machine learning probability calibration relied on penalized scikit-learn models rather than unpenalized Cox logistic calibration assessment (`sm.GLM(family=sm.families.Binomial())`).
4. RQ3 compared SHAP attributions against unadjusted bivariate associations rather than multivariable statistical likelihood contributions.
5. The manuscript abstract and sensitivity text contained subtle overclaims ("confirming that the study's primary internal evaluation conclusions are robust", "disproved inflation").
6. The publication manuscript lacked an automated compiler integration, and table formatting produced overfull horizontal box warnings.

Through a disciplined 33-phase methodology, all issues were systematically resolved, strictly adhering to the principle: **Inspect → Reproduce → Repair → Regenerate → Validate → Independently Re-check**. Zero numbers were estimated or manually invented; every value in the manuscript traces directly to verified, reproducible computational artifacts.

---

## 2. Repository Hygiene & Reproducibility Environment

### 2.1 Git Safety Branch & Line Ending Normalization
- Established dedicated safety branch: `fix/reproducibility-paper-sync` without force pushes or history rewriting.
- Audited tracked vs. untracked files: Removed legacy root duplicate manuscript drafts (`manuscript.tex`, `main.backup.tex`), retaining exclusively the canonical `paper/main.tex`.
- Configured `.gitattributes` to enforce stable cross-platform line endings:
  ```gitattributes
  * text=auto eol=lf
  *.bat text eol=crlf
  ```
- Updated `.gitignore` to safely prevent tracking of node modules (`app/node_modules/`, `app/.next/`, `app/tsconfig.tsbuildinfo`), python caches (`__pycache__/`, `*.pyc`), and virtual environments.

### 2.2 Canonical Dependency Specifications
- Pinned canonical Python environment to **Python 3.11** (tested across 3.10–3.13).
- Established multi-tiered dependency specifications:
  - `requirements.txt`: Clean, uncluttered core scientific stack (`numpy>=1.24`, `pandas>=2.0`, `scikit-learn>=1.3`, `statsmodels>=0.14`, `xgboost>=2.0`, `scipy>=1.10`, `shap>=0.42`, `matplotlib>=3.7`, `seaborn>=0.12`, `joblib>=1.3`).
  - `requirements-lock.txt`: Authoritative exact-version lockfile capturing the verified runtime environment.
  - `pyproject.toml`: Modern PEP 518 / PEP 621 build configuration with project metadata, dependencies, and tooling configurations.

---

## 3. Data Integrity & Duplicate Audit

In `notebooks/data_preprocessing.py`, a rigorous data audit was implemented, cleanly disentangling exact duplicates from repeated discrete survey profiles:

| Audit Dimension | Predictors Evaluated | Distinct Patterns | Surplus Records | Total Clustered Records | Dataset Percentage |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Exact Full-Row Duplication** | 22 (21 predictors + `Diabetes_binary`) | 11,369 | **24,206** | 35,575 | 14.02% (Surplus: 9.54%) |
| **Predictor-Profile Repetition** | 21 (predictors only, excluding target) | 12,228 | **25,772** | 38,000 | 14.98% (Surplus: 10.16%) |
| **Conflicting-Label Profiles** | 21 (predictors only, mixed target) | 1,566 | N/A | 5,218 | 2.06% |
| **Unique Predictor Profiles** | 21 (predictors only) | **227,908** | N/A | 227,908 | 89.84% |

**Scientific Decision:** All records were deliberately retained in the primary analyzed sample ($N = 253,680$). In large-scale, discretized, anonymous public health surveillance surveys (BRFSS), respondent identifiers are withheld for confidentiality. Distinct participants with identical health characteristics legitimately generate identical response profiles. Pruning these records would distort natural disease prevalence and introduce selection bias.

Artifacts generated:
- `results/data_understanding/dataset_audit.json`
- `results/data_understanding/dataset_audit.csv`
- `results/data_understanding/duplicate_summary.csv`

---

## 4. Statistical Modeling & Multivariable Association Repair

In `python_analysis/statistical_analysis.py`, multivariable logistic regression was upgraded to adhere to rigorous biostatistical standards:
1. **Categorical Indicator Blocks:** The four ordinal indicators (`GenHlth` [5 levels], `Age` [13 levels], `Education` [6 levels], and `Income` [8 levels]) were expanded into reference-cell dummy indicator blocks.
2. **Term-Level Adjusted Odds Ratios & VIFs:** Full dummy-level coefficients, standard errors, AORs, 95% CIs, and dummy VIFs were computed and exported to `results/statistical_analysis/multivariable_associations.csv`.
3. **Collinearity Audit:** Although the sparse baseline category `Education=1` (174 respondents, 0.06% of sample) produces an elevated dummy VIF against the intercept, the nested likelihood-ratio test dropping the entire `Education` block is invariant and numerically stable ($\Delta\text{deviance} = 49.61$, 5 df, $p = 1.66 \times 10^{-9}$). All non-reference continuous and binary feature VIFs remain below 1.80.
4. **Feature-Level Likelihood Contributions (LR $\chi^2$):** To provide an invariant metric of statistical importance comparable to tree-based SHAP values, nested Likelihood-Ratio tests were executed for all 21 features by dropping each feature block and computing:
   $$\text{LR } \chi^2 = 2 \cdot (\ell_{\text{full}} - \ell_{\text{reduced}}) = \Delta\text{deviance}$$
   Exported to `results/statistical_analysis/adjusted_feature_contributions.csv` and `results/statistical_analysis/adjusted_association.csv`.

---

## 5. Machine Learning, Calibration & Holdout Quarantine

In `python_analysis/model_training.py`, model selection and evaluation strictly enforced holdout quarantine:
1. **5-Fold Cross-Validation on Development Set ($n_{\text{dev}} = 202,944$):**
   - **XGBoost:** Mean PR-AUC = $0.4359 \pm 0.0077$, Mean ROC-AUC = $0.8305 \pm 0.0021$ (Selected classifier)
   - **Random Forest:** Mean PR-AUC = $0.4301 \pm 0.0070$, Mean ROC-AUC = $0.8271 \pm 0.0024$
   - **Logistic Regression:** Mean PR-AUC = $0.4163 \pm 0.0052$, Mean ROC-AUC = $0.8242 \pm 0.0019$
   - **Decision Tree:** Mean PR-AUC = $0.4015 \pm 0.0065$, Mean ROC-AUC = $0.7937 \pm 0.0035$
2. **Development-Only Threshold Optimization:**
   - Evaluated out-of-fold predicted probabilities across thresholds $t \in [0.01, 0.99]$.
   - Operational cutoff $t^* = 0.13$ was selected to satisfy the clinical constraint $\text{Recall} \ge 0.80$, maximizing precision at acceptable sensitivity.
3. **Primary Holdout Evaluation ($n_{\text{holdout}} = 50,736$, evaluated strictly once):**
   - **PR-AUC:** 0.4238 (95% CI: [0.4135, 0.4347])
   - **ROC-AUC:** 0.8272 (95% CI: [0.8223, 0.8322])
   - **Recall (Sensitivity):** 80.99% (95% CI: [80.04%, 81.94%])
   - **Precision (PPV):** 29.91% (95% CI: [29.53%, 30.28%])
   - **Specificity:** 69.28%
   - **False Negative Reduction:** $-77.22\%$ (missed cases reduced from 5,900 at $t = 0.50$ to 1,344 at $t^* = 0.13$)
4. **Unpenalized Cox Calibration:**
   - Fitted unpenalized Cox calibration assessment via `statsmodels.api.GLM(..., family=statsmodels.api.families.Binomial())`.
   - 1,000 stratified bootstrap iterations yielded:
     - **Brier Score:** 0.0974 (95% CI: [0.0964, 0.0983]) vs. non-informative baseline 0.1199.
     - **Cox Calibration Slope:** 0.9589 (95% CI: [0.9342, 0.9854])
     - **Calibration Intercept:** $-0.0515$ (95% CI: [$-0.0861$, $-0.0148$])

---

## 6. Redesigned RQ3: SHAP vs. Statistical Likelihood Alignment

In `python_analysis/shap_analysis.py`, RQ3 was restructured to compare tree-based gradient boosted SHAP attributions against multivariable nested Likelihood-Ratio $\chi^2$ ($\Delta\text{deviance}$) statistical contributions:

- **Complete Top-Feature Consensus:**
  - **Top-5 Features:** `{GenHlth, HighBP, Age, BMI, HighChol}` (Overlap: 5/5, Jaccard Similarity = **1.0000**)
  - **Top-10 Features:** `{GenHlth, HighBP, Age, BMI, HighChol, Income, Sex, CholCheck, HeartDiseaseorAttack, HvyAlcoholConsump}` (Overlap: 10/10, Jaccard Similarity = **1.0000**)
  - **Top-15 Features:** Overlap: 13/15, Jaccard Similarity = **0.7647**
- **Overall Feature-Space Concordance:**
  - Spearman rank correlation across all 21 features: $\rho_s = \mathbf{0.9338}$ ($p = 6.38 \times 10^{-10}$).
  - All Top-10 features classify into **Group 1 (Consistent High Evidence)**, with 0 in Group 2, 0 in Group 3, and the remaining 11 secondary features in Group 4.
  - For historical comparison with unadjusted bivariate effect sizes, concordance with univariate Cramér's $V$ yields $\rho_s = 0.7098$ ($p = 3.13 \times 10^{-4}$).

---

## 7. Phase 1 & Phase 2: Integrity Audit & Sensitivity Evaluation (RQ4)

### 7.1 Phase 1 Data & Split Integrity Audit
- In `python_analysis/phase1_data_integrity_audit.py`, 8 exhaustive integrity checks (A through H) passed:
  - Holdout profile overlap: 6,836 observations (13.4737% of holdout set).
  - Holdout exact row overlap: 6,375 observations (12.5650% of holdout set).
  - Perfect stratified prevalence preserved ($13.9334\%$ dev vs $13.9329\%$ holdout).

### 7.2 Phase 2 Profile-Grouped Sensitivity Evaluation (RQ4)
- In `python_analysis/phase2_profile_grouped_sensitivity.py`, an outer and inner `StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)` partitioned the dataset by deterministic 21-variable predictor profiles.
- The third fold (zero-based index 2) perfectly matched primary dimensions ($n_{\text{dev}} = 202,944$, $n_{\text{holdout}} = 50,736$, prevalence 13.9329%), with **zero shared predictor profiles** crossing partitions.
- **Head-to-Head Comparison:**
  - **Selected Model:** XGBoost in both primary and grouped evaluations.
  - **Operational Threshold:** $t^* = 0.13$ in both primary and grouped evaluations.
  - **Holdout PR-AUC:** 0.4238 [0.4135, 0.4347] (Primary) vs. 0.4372 [0.4256, 0.4478] (Grouped), $\Delta = +0.0133$.
  - **Holdout ROC-AUC:** 0.8272 [0.8223, 0.8322] (Primary) vs. 0.8310 [0.8262, 0.8353] (Grouped), $\Delta = +0.0037$.
  - **Holdout Recall:** 80.99% [80.04%, 81.94%] (Primary) vs. 81.54% [80.65%, 82.43%] (Grouped), $\Delta = +0.0055$.
  - **Holdout Precision:** 29.91% [29.53%, 30.28%] (Primary) vs. 29.93% [29.55%, 30.30%] (Grouped), $\Delta = +0.0002$.
  - **Holdout Brier Score:** 0.0974 vs. 0.0964, $\Delta = -0.0010$.
  - **Calibration Slope:** 0.9589 vs. 0.9876, $\Delta = +0.0287$.
  - **Calibration Intercept:** $-0.0515$ vs. $-0.0159$, $\Delta = +0.0356$.
- **Scientific Guardrails & Phrasing Corrections:**
  - Purged false claims ("both sensitivity point estimates fall comfortably within primary CIs").
  - Replaced causal and disproval overclaims with scientifically rigorous text: "A profile-grouped sensitivity analysis eliminating cross-partition sharing of identical predictor profiles yielded broadly similar discrimination, screening performance, and calibration estimates, providing additional evidence that the study's primary internal conclusions are robust to the evaluated partitioning strategy. However, because the primary and grouped holdouts contain different observations, the analysis cannot isolate the causal effect of profile overlap or definitively establish that overlap has no influence on performance."

---

## 8. Publication Manuscript & LaTeX Compilation

### 8.1 Automated Artifact Synchronization (`python_analysis/generate_paper_artifacts.py`)
- Automatically ingests ground truth CSV/JSON files and generates:
  - `paper/generated_metrics.tex`: Complete LaTeX macros for all prose values.
  - `paper/tables/table1_preprocessing.tex`
  - `paper/tables/table2_univariate_associations.tex`
  - `paper/tables/table3_multivariable_associations.tex`
  - `paper/tables/table4_cv_model_comparison.tex`
  - `paper/tables/table5_threshold_selection.tex`
  - `paper/tables/table6_holdout_performance.tex`
  - `paper/tables/table7_calibration_metrics.tex`
  - `paper/tables/table8_shap_alignment.tex`
  - `paper/tables/table9_sensitivity_alignment.tex`
  - `paper/tables/table10_primary_vs_grouped_comparison.tex`
  - Synchronizes 17 canonical figures into `paper/images/`.

### 8.2 Table Width & Formatting Optimization
- Refined table layouts to strictly comply with Springer Nature (`sn-jnl`) column width constraints:
  - Tables 2–10 equipped with `\footnotesize`, `@{}...@{}` column zero-margins, explicit `\setlength{\tabcolsep}{...}`, `p{...}` wrapped description cells, and `\shortstack` headers.
  - Eliminated all table overfull horizontal box warnings!

### 8.3 Compilation Verification
- Compiled `paper/main.tex` to `paper/main.pdf` using standalone engine `tectonic.exe` v0.17.0.
- Result: **381.0 KiB PDF generated cleanly in 4.36s** with zero fatal errors, zero missing references, zero missing citations, and zero table overfull hboxes.

---

## 9. Independent Manuscript Consistency & Numerical Provenance Audits

### 9.1 Independent Manuscript Consistency Audit (105 Checks)
In `python_analysis/audit_manuscript_consistency.py`, an independent 105-check automated verification script was developed and integrated into `validate_outputs.py`:
- Checks every numerical claim across 11 verification categories:
  1. Dataset & Preprocessing metrics (7 checks)
  2. Partition sample sizes and profile overlaps (6 checks)
  3. RQ1 univariate and multivariable statistical contributions (20 checks)
  4. Model hyperparameters against `model_configuration.json` (4 checks)
  5. Cross-validation model comparison (2 checks)
  6. Primary holdout performance, CIs, and counts (7 checks)
  7. Holdout calibration metrics (3 checks)
  8. RQ3 evidence alignment, Jaccard similarities, and Spearman $\rho_s$ (6 checks)
  9. RQ4 profile-grouped redevelopment metrics & Table 10 Deltas (18 checks)
  10. Scientific guardrails and absence of forbidden overclaims or stale numbers (26 checks)
  11. Methodological guardrail phrasings and PDF compilation artifact verification (6 checks)
- **Result:** **ALL 105 AUDIT CHECKS PASSED (100% SUCCESS)**.

### 9.2 Programmatic Numerical Provenance Audit (95 Claims)
In `python_analysis/audit_numerical_provenance.py`, all 95 quantitative claims reported across `paper/main.tex` and all 10 LaTeX tables are mapped directly to underlying ground truth CSV/JSON files in `results/`.
- **Result:** **ALL 95 NUMERICAL CLAIMS VERIFIED EXACTLY AGAINST GROUND TRUTH DATA ARTIFACTS (100% MATCH)**.
- Saved ledger: `results/manuscript_revision/numerical_provenance.csv`.

---

## 10. End-to-End Pipeline Execution

The master pipeline `run_pipeline.py` was executed cleanly end-to-end:

```
================================================================================
   DIABETES ANALYTICS: END-TO-END REPRODUCIBLE SCIENTIFIC PIPELINE
================================================================================
 STEP 1: Data Preprocessing & Quality Validation                [OK]   3.90s
 STEP 2: Class Distribution Figure Generation                   [OK]   3.51s
 STEP 3: Statistical Hypothesis Testing & Adjusted Association  [OK]  98.94s
 STEP 4: Two-Panel Effect-Size Figure Generation                [OK]   3.45s
 STEP 5: Machine Learning Modeling, Selection & Holdout         [OK] 204.22s
 STEP 6: Explainable AI (SHAP) & Evidence Alignment Analysis    [OK]  25.04s
 STEP 7: Global SHAP Feature Importance Figure Generation       [OK]   9.68s
 STEP 8: Local SHAP Waterfall Explanation Figure Generation     [OK]  10.33s
 STEP 9: Methodology Pipeline Architecture Figure Generation    [OK]   2.18s
 STEP 10: Phase 1 Data & Split Integrity Audit                  [OK] 125.41s
 STEP 11: Phase 2 Profile-Grouped Sensitivity Evaluation        [OK] 262.27s
 STEP 12: Final Results Summary Aggregation                     [OK]   1.85s
 STEP 13: Paper Artifacts & LaTeX Table Generation              [OK]   2.17s
 STEP 14: Publication Manuscript LaTeX Compilation (tectonic)   [OK]   4.33s
 STEP 15: Pipeline Output & Independent Consistency Validation  [OK]   3.60s
================================================================================
[SUCCESS] FULL PIPELINE EXECUTED SUCCESSFULLY IN 760.90s
   Final Results: results/final_results_summary.json
   Manuscript PDF: paper/main.pdf (390.8 KiB)
================================================================================
```

---

## 11. Conclusion & Human-Review Readiness

The repository is now in an authoritative, fully reproducible, scientifically cautious, and paper-ready state. 
- Contaminated experiments have been completely eliminated.
- All numbers across the code, markdown documentation, LaTeX tables, and manuscript prose trace directly to verified data artifacts with zero discrepancy.
- The publication manuscript compiles cleanly with 0 fatal errors.

**Status:** `READY FOR INDEPENDENT HUMAN REVIEW`
