# Scientific Manuscript Revision Log

**Project:** Predicting Diabetes Risk Using CDC Health Indicators (`AI-Peak/Diabetes-Analytics`)  
**Revision Phase:** Post-Phase 1 (Data & Evaluation Integrity) and Post-Phase 2 (Profile-Grouped Sensitivity Analysis)  
**Primary Manuscript Files:**
- Revised Authoritative Manuscript: [`paper/main.tex`](paper/main.tex) (mirrored to root [`manuscript.tex`](manuscript.tex))
- Pre-Revision Baseline Draft: [`paper/manuscript_before_phase2_revision.tex`](paper/manuscript_before_phase2_revision.tex) (mirrored to root [`manuscript_before_phase2_revision.tex`](manuscript_before_phase2_revision.tex))

---

## 1. Terminology Corrections Made

| Location | Prior Language / Ambiguity | Revised Scientific Phrasing | Rationale & Artifact Verification |
| :--- | :--- | :--- | :--- |
| **Section 3 (Data & Preprocessing)** | "24,206 repeated feature profiles were identified in the dataset..." | Distinguishes 24,206 surplus exact duplicate rows across all 22 columns (35,575 rows in 11,369 clusters) from 25,772 surplus repeated predictor observations across the 21 predictors (38,000 rows in 12,228 profiles; 227,908 unique profiles). Notes 1,566 conflicting profiles (5,218 rows). | Corrects conflation between full-row duplicate records and identical feature vectors. Verified via `results/phase1_integrity/dataset_integrity_summary.csv` and `predictor_profile_statistics.csv`. |
| **Throughout Manuscript** | Implicit assumption that identical survey rows reflect repeated individuals. | Clarifies that respondent identifiers are absent in the public BRFSS release; identical combinations of discrete survey responses cannot be assumed to represent duplicate individuals. Observations are retained to avoid sample distortion. | Prevents scientifically unfounded claims of "duplicate patients" or "repeated respondents". |
| **Section 4 (Methodology)** | No mention of evaluation partition profile sharing. | Added quantitative audit: 6,836 holdout observations (13.4737%) share predictor profiles with development set; 6,375 (12.5650%) are exact duplicates. Formulates this as motivation for sensitivity analysis, not definitive proof of contamination. | Verified via `results/phase1_integrity/split_integrity_summary.csv`. Cautious framing prevents speculative leakage claims. |

---

## 2. Phase 2 Additions

### Methods Additions:
- Added `\subsection{Profile-Grouped Sensitivity Analysis}` in Section 4.
  - Group Definition: Factorization of all 21 predictor variables only; target strictly excluded.
  - Outer Grouped Split: `StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)` Fold 2 selected ($n_{\text{dev}} = 202,944$; $n_{\text{holdout}} = 50,736$; 0 shared predictor profiles; 13.9329% holdout prevalence).
  - Inner Grouped CV: 5-fold `StratifiedGroupKFold` enforced within development partition for model selection, OOF prediction, and threshold tuning.
  - Experimental Control: Controlled experiment where partitioning strategy is the sole manipulated factor; models, hyperparameters, and preprocessing remain identical.

### Results Additions:
- Added `\subsection{Profile-Grouped Sensitivity Analysis Results}` in Section 5.
  - Reports grouped cross-validation: XGBoost remained selected (Mean CV PR-AUC $0.4322 \pm 0.0061$, ROC-AUC $0.8294 \pm 0.0030$).
  - Reports grouped threshold optimization: selected threshold is identical at $t^* = 0.13$ (OOF Recall 80.62%, Precision 30.07%, F1 0.4380).
  - Reports zero-overlap holdout metrics: PR-AUC 0.4372 [0.4256, 0.4478] ($\Delta = +0.0133$), ROC-AUC 0.8310 [0.8262, 0.8353] ($\Delta = +0.0037$), Recall 81.54\% [80.65\%, 82.43\%] ($\Delta = +0.0055$), Precision 29.93\% [29.55\%, 30.30\%] ($\Delta = +0.0002$), Specificity 69.10\% ($\Delta = -0.0018$), F1 0.4379 ($\Delta = +0.0010$), Accuracy 70.83\% ($\Delta = -0.0008$).
  - Reports calibration under grouped holdout: Brier score 0.0964 ($\Delta = -0.0010$), slope 0.9876 ($\Delta = +0.0286$), intercept $-0.0159$ ($\Delta = +0.0355$).

### Tables & Figures Added:
- **Table 10:** `tables/table10_primary_vs_grouped_comparison.tex` added to present side-by-side metric comparison, bootstrap 95% CIs, and absolute deltas ($\Delta = \text{Grouped} - \text{Primary}$). Subjective stability labels were removed.
- **Figure 2:** `images/figure2_calibration_curves.png` embedded to visually display calibration curves for primary stratified and profile-grouped evaluations against the 45-degree ideal calibration line.

---

## 3. Discussion Changes & Overclaim Removal

- **Evaluation Robustness Integration:** Integrated dedicated discussion section explaining that preventing cross-partition predictor profile sharing did not result in a material deterioration of discrimination, screening performance, or calibration.
- **Mandatory Caveat Included:** Explicitly added: *"Because the primary and profile-grouped holdout sets contain different subsets of respondents, this analysis cannot isolate the pure causal effect of profile overlap or definitively establish that overlap has no influence on performance."*
- **Overclaims Removed:**
  - Removed any statements claiming "performance inflation was disproven" or "leakage did not occur".
  - Replaced speculative assertions with neutral, evidence-based descriptions: "estimates remained broadly similar", "no material deterioration was observed", "conclusions are robust to the evaluated partitioning strategy".
  - Clarified that calibration slope/intercept improvements are descriptive shifts rather than statistically proven superiority.
- **Expanded Research Contribution:** Updated research contribution from 7 to 10 points, explicitly incorporating the data integrity audit of repeated profiles and profile-grouped sensitivity analysis.

---

## 4. Limitations Changes

- **Repeated Profiles Limitation Updated:** Replaced the speculative remark about potential profile overlap with the completed Phase 1/Phase 2 findings. Emphasized that while grouped sensitivity analysis produced consistent estimates, the holdout samples consist of different individuals, requiring external/temporal validation to isolate dataset-level effects.
- **Retained Core Limitations:** Preserved acknowledged boundaries: cross-sectional self-report design, combined prediabetes/diabetes target, unweighted sample analysis, absence of laboratory biomarkers, and lack of external temporal validation.

---

## 5. Future Work & Conclusion Changes

- **Removed Completed Item:** Deleted "profile-grouped sensitivity analysis" from Future Work since it is now completed.
- **Updated Future Directions:** Focused future work on external validation across newer BRFSS survey waves (2017–2023), complex survey-weighted machine learning loss functions, subgroup fairness and calibration, and multi-class clinical staging.
- **Conclusion Update:** Added a dedicated synthesis paragraph summarizing the evaluation integrity and grouped sensitivity analysis findings. Reaffirmed that while the primary internal conclusions are robust, external validation remains necessary before clinical translation.
- **Abstract Update:** Added one concise sentence highlighting that the profile-grouped sensitivity analysis yielded broadly consistent discrimination and calibration estimates.

---

## 6. Machine-Readable Artifacts Verified (Anti-Fabrication Audit)

Every numerical value inserted into the manuscript was cross-checked against authoritative project artifacts:
1. `results/phase1_integrity/phase1_integrity_metadata.json`
2. `results/phase1_integrity/dataset_integrity_summary.csv`
3. `results/phase1_integrity/predictor_profile_statistics.csv`
4. `results/phase1_integrity/split_integrity_summary.csv`
5. `results/phase2_sensitivity/primary_vs_grouped_comparison.csv`
6. `results/phase2_sensitivity/grouped_cv_summary.csv`
7. `results/phase2_sensitivity/grouped_holdout_metrics.csv`
8. `results/phase2_sensitivity/grouped_calibration_metrics.csv`
9. `results/phase2_sensitivity/grouped_threshold_analysis.csv`
10. `results/phase2_sensitivity/grouped_bootstrap_confidence_intervals.csv`
11. `results/modeling/cv_model_comparison.csv`
12. `results/modeling/threshold_analysis.csv`
13. `results/modeling/final_test_metrics.csv`
14. `results/modeling/calibration_metrics.csv`
15. `results/modeling/bootstrap_confidence_intervals.csv`
16. `results/statistical_analysis/chi_square_results.csv`
17. `results/statistical_analysis/numerical_results.csv`
18. `results/statistical_analysis/adjusted_association.csv`
19. `results/xai/explanation_consistency.csv`
20. `results/xai/rank_sensitivity_analysis.csv`

---

## 7. Compiler Availability & Resolution

- **Resolution of Local Compiler:** Configured and deployed the standalone, zero-dependency `tectonic` TeX engine (v0.17.0) to compile the Springer Nature `sn-jnl.cls` manuscript directly to PDF locally. Full compilation succeeded cleanly, eliminating reliance on static AST checks alone.
  - 100% matched environments (Begins: 37, Ends: 37).
  - 100% resolved internal references (21 defined labels, 0 dangling references).
  - 100% resolved citations (23 defined BibTeX keys, 0 missing citations, 0 `[?]`).
  - Image rendering verified on disk and inside compiled PDF (`images/figure2_calibration_curves.png` rendered on Page 14).
  - 100% of verified numerical values confirmed present and consistent.
  - Table 10 formatted with `\footnotesize` and `\setlength{\tabcolsep}{3pt}` to fit Springer single-column width with zero overfull hbox warnings.

---

## 8. Final QA Pass

### A. Actual Compilation Details
- **Compilation Command:** `tectonic main.tex` (executed in working directory `paper/`)
- **Compilation Result:** Exit code 0 (Build Successful)
- **Output PDF Path:** [`paper/main.pdf`](paper/main.pdf)
- **Document Properties:** 19 pages, 379,588 bytes, complete bibliography rendering (all 23 references compiled), full mathematical typesetting, and embedded high-resolution graphics.

### B. Scientific Corrections & Refinements
1. **Abstract Overclaim Removal:**
   - Prior: `"...confirming that the study's primary internal evaluation conclusions are robust to partitioning strategy."`
   - Revised: `"...providing additional evidence that the study's primary internal conclusions are robust to the evaluated partitioning strategy."`
   - Rationale: Removed decisive verb `confirming` in favor of cautious sensitivity phrasing, acknowledging that primary and grouped holdout partitions contain different observations.
2. **RQ4 Decision & Phrasing Audit:**
   - Context: The manuscript explicitly maintains RQ1 (associations), RQ2 (screening modeling), and RQ3 (evidence alignment) across Introduction, Methods, and Results.
   - Decision: Retained RQ4 to maintain explicit parallel structure, but strictly formulated as a non-causal sensitivity/robustness question.
   - Revised RQ4: *"RQ4 (Evaluation Robustness and Sensitivity): To what extent are the study's discrimination and calibration findings stable when identical predictor profiles are prevented from crossing evaluation partitions?"*
3. **"Data Leakage" Terminology Qualification:**
   - Section 2.4 heading revised to *"Data Integrity, Evaluation Robustness, and Repeated Profiles in Survey Data"*.
   - Qualified theoretical discussion: clarified that classical data leakage involves direct information transfer from test to training sets, whereas discretized survey data present an evaluation-integrity concern regarding recurring predictor profiles.
   - Section 4.1 revised to clarify procedural leakage prevention (strict quarantine of the holdout partition during preprocessing and tuning).
   - Section 4.2 revised to explicitly reaffirm that predictor-profile sharing does not automatically indicate leakage or inflation.
   - Section 6.2 revised from *"calibration slope improved slightly"* to descriptive *"calibration slope shifted"*.
4. **Research Contribution Consolidation:**
   - Prior: A 9-item workflow list in Section 6.4.
   - Revised: Consolidated into 5 conceptual, higher-level scientific pillars:
     1. *Reliability-Oriented Screening Evaluation:* Benchmarking multi-paradigm classifiers prioritized by PR-AUC under severe imbalance.
     2. *Development-Only Operating-Point Selection and Calibration:* Pre-specified sensitivity targeting ($\ge 80\%$) on development OOF probabilities with Brier/Cox calibration diagnostics.
     3. *Interpretable Statistical--SHAP Evidence Alignment:* Tripartite cross-referencing between non-parametric univariate effect sizes, multivariable odds ratios, and TreeExplainer attributions.
     4. *Explicit Data-Integrity Audit of Repeated Profiles:* Methodological distinction between full-row duplicate records and identical discrete predictor profiles.
     5. *Profile-Grouped Robustness Sensitivity Analysis:* Controlled experimental evaluation enforcing zero cross-partition predictor profile sharing.
   - Novelty claims audited: No unsupported claims of "the first framework" exist.
5. **Table 10 Verification:**
   - File: [`paper/tables/table10_primary_vs_grouped_comparison.tex`](paper/tables/table10_primary_vs_grouped_comparison.tex)
   - Header and footnote explicitly define $\Delta = \text{Profile-Grouped} - \text{Primary Stratified}$.
   - No subjective stability labels present.
   - Primary and grouped bootstrap 95% CIs correctly placed.
   - Proportions used consistently across all discrimination, screening, and calibration rows.
   - Formatting optimized (`\footnotesize`, `\setlength{\tabcolsep}{3pt}`, multi-line headers); overfull hbox reduced to 0 pt (fits Springer page width perfectly).
6. **Calibration Figure Verification:**
   - File: [`paper/images/figure2_calibration_curves.png`](paper/images/figure2_calibration_curves.png)
   - Accurately renders primary stratified holdout curve (blue square), profile-grouped holdout curve (red circle), and 45-degree ideal calibration line (dotted black).
   - Caption in Section 5.5 and accompanying text neutrally describe alignment with the ideal line without claiming either curve is statistically superior.
7. **Numerical Consistency Audit:**
   - All 18 audited Phase 1/Phase 2 figures verified to exact precision against machine-readable project artifacts.
8. **Remaining Warnings:**
   - Zero fatal errors.
   - Zero undefined references (`??`) or missing citations (`[?]`).
   - Zero missing image warnings.
   - Benign typography warnings: minor overfull hboxes on baseline tables (Tables 2, 3, 4, 5, 6, 7, 8, 9) inherent to Springer Nature's narrow single-column geometry, and standard natbib hyphenation notices. Table 10 has zero overfull warnings.
