# Predicting Diabetes Risk Using CDC Health Indicators

An end-to-end Machine Learning, Statistical Analysis, and Explainable AI (XAI) study using the **CDC BRFSS 2015** dataset, paired with an explicit data-integrity audit, unpenalized Cox probability calibration, evidence alignment, and a profile-grouped sensitivity analysis.

## Target Terminology Rules & Class Definitions

- **Class 0**: `0 = no reported diabetes` (`Without reported diabetes`, `no reported diabetes`).
- **Class 1**: `1 = prediabetes or diabetes` (`Combined prediabetes/diabetes positive class`, `prediabetes or diabetes`).
- Do NOT use standalone terms like "Healthy" or "Diabetic" for target classes.

## Study Questions & Objectives

1. **RQ1 (Statistical Associations)**: Which demographic, lifestyle, and clinical factors are statistically associated with reported diabetes status in the BRFSS 2015 sample ($N = 253,680$)?
2. **RQ2 (Predictive Modeling & Screening)**: Which machine learning algorithm provides the highest cross-validated PR-AUC under class imbalance, and how does threshold tuning optimize recall for non-invasive community screening?
3. **RQ3 (Evidence Alignment)**: Do tree-based gradient boosted SHAP attributions concord with multivariable statistical likelihood contributions (nested Likelihood-Ratio $\chi^2$ / $\Delta$deviance) and non-parametric effect sizes?
4. **RQ4 (Evaluation Robustness & Sensitivity)**: To what extent are the study's discrimination, screening utility, and probability calibration findings stable when identical predictor profiles are prevented from crossing evaluation partitions?

## Canonical Environment & Reproduction

- **Python Version:** Python 3.11 (compatible with 3.10–3.13)
- **Dependency Specifications:**
  - `requirements.txt`: Standard core dependencies.
  - `requirements-lock.txt`: Exact pinned dependency versions for strict reproduction.
  - `pyproject.toml`: Modern PEP 518/621 project configuration.
- **Installation:**
  ```bash
  pip install -r requirements.txt
  ```

## Reproducible Pipeline Execution

To execute the entire 15-step scientific pipeline end-to-end (data integrity audit, non-parametric statistical hypothesis testing, categorical dummy multivariable logistic regression, screening-oriented machine learning evaluation, development-selected decision threshold, unpenalized Cox calibration assessment with 1,000 bootstrap CIs, SHAP evidence alignment, profile-grouped sensitivity evaluation, artifact generation, LaTeX publication compilation, and automated manuscript consistency validation):

```bash
python run_pipeline.py
```

### Sequential Pipeline Steps:
1. `notebooks/data_preprocessing.py`: Data ingestion, validation, and formal duplicate/profile audit.
2. `python_analysis/generate_class_distribution_figure.py`: Class balance visualization.
3. `python_analysis/statistical_analysis.py`: Non-parametric hypothesis testing (Chi-square, Mann-Whitney U) and multivariable logistic regression with categorical indicator dummy blocks.
4. `python_analysis/generate_effect_size_figure.py`: Univariate effect size visualization.
5. `python_analysis/model_training.py`: Multi-paradigm 5-fold CV, model selection, decision threshold selection ($t^* = 0.13$), holdout evaluation, and unpenalized Cox calibration assessment.
6. `python_analysis/shap_analysis.py`: SHAP TreeExplainer attributions, LR $\chi^2$ statistical alignment, and rank sensitivity.
7. `python_analysis/generate_shap_global_importance.py`: Global SHAP feature importance plot.
8. `python_analysis/generate_shap_local_waterfall.py`: Local high-risk waterfall plot.
9. `python_analysis/generate_methodology_pipeline_final.py`: Authoritative 12-step publication methodology workflow diagram.
10. `python_analysis/phase1_data_integrity_audit.py`: Formal Phase 1 data and split integrity audit.
11. `python_analysis/phase2_profile_grouped_sensitivity.py`: Phase 2 zero-overlap profile-grouped sensitivity experiment.
12. `python_analysis/generate_final_results_summary.py`: Structured JSON/Markdown summary aggregation.
13. `python_analysis/generate_paper_artifacts.py`: Synchronization of all 10 canonical LaTeX tables (`table1`–`table10`), macros (`generated_metrics.tex`), and figures.
14. **Manuscript LaTeX Compilation**: Automatic compilation of `paper/main.tex` to `paper/main.pdf` via `tectonic`.
15. `python_analysis/validate_outputs.py`: Automated output validation and independent manuscript numerical consistency audit (105 checks passed).

## Publication Manuscript (`paper/`)

The Springer Nature publication manuscript is located in `paper/`:
- Source file: [paper/main.tex](paper/main.tex)
- Tables: [paper/tables/](paper/tables/) (Tables 1 through 10)
- Macros: [paper/generated_metrics.tex](paper/generated_metrics.tex)
- Compiled PDF: [paper/main.pdf](paper/main.pdf)

To compile independently using `tectonic`:
```bash
cd paper
tectonic main.tex
```

## BRFSS Data Protocol & Methodological Limitations

- **Self-Reported & Cross-Sectional Data**: The CDC BRFSS relies on self-reported survey responses without biochemical confirmation (e.g., fasting plasma glucose or HbA1c). Cross-sectional survey data preclude causal interpretations.
- **Unweighted Sample Analysis**: Results reflect the unweighted analyzed sample ($N = 253,680$) and do not represent national population prevalence estimates.
- **Data Integrity Audit (Exact Duplicates vs. Repeated Profiles)**:
  - Considering all 22 columns, there are 24,206 surplus exact duplicate rows clustered across 11,369 distinct response patterns (35,575 total rows).
  - Considering only the 21 predictor variables, there are 227,908 unique profiles and 25,772 surplus repeated profiles (38,000 total rows).
  - 1,566 profiles exhibit conflicting target labels (5,218 observations, 2.06% of the dataset).
  - All records were retained because respondent IDs are unavailable in public BRFSS releases, and identical responses cannot be assumed to represent duplicate individuals.
- **Holdout Partition Usage**: Final holdout data ($n = 50,736$) were strictly quarantined during development and used exclusively for final evaluation, post-hoc calibration, and SHAP analyses.
- **Screening Objective**: The operational threshold ($t^* = 0.13$) targets early community screening ($\text{Recall} \ge 0.80$) and does not constitute a clinical diagnostic guideline.

## Web Research Dashboard (`app/`)

A Next.js research dashboard displaying analysis outputs and a grounded assistant is located in `app/`. (Maintained independently from the core Python pipeline).
