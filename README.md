# Predicting Diabetes Risk Using CDC Health Indicators

An end-to-end Machine Learning, Statistical Analysis, and Explainable AI (XAI) study using the **CDC BRFSS 2015** dataset.

## Target Terminology Rules & Class Definitions

- **Class 0**: `0 = no reported diabetes` (`Without reported diabetes`, `no reported diabetes`).
- **Class 1**: `1 = prediabetes or diabetes` (`Combined prediabetes/diabetes positive class`, `prediabetes or diabetes`).
- Do NOT use standalone terms like "Healthy" or "Diabetic" for target classes.

## Study Questions & Objectives

1. **RQ1 (Statistical Association)**: Which demographic, lifestyle, and health-related factors are statistically associated with diabetes status in the BRFSS 2015 sample?
2. **RQ2 (Predictive Modeling & Screening)**: Which machine learning algorithm provides the highest cross-validated PR-AUC under class imbalance, and how does threshold tuning optimize recall for non-invasive screening?
3. **RQ3 (Explainability & Alignment)**: To what extent do global SHAP feature rankings align with univariate and adjusted statistical association rankings?

## Environment Setup & Recommended Python Version

- **Recommended Python Version:** Python 3.10 or 3.11
- **Installation:**
  ```bash
  pip install -r requirements.txt
  ```

## Reproducible Pipeline Execution

To execute the full end-to-end scientific pipeline (data validation, statistical analysis, model training, holdout calibration assessment, SHAP analysis, figure generation, and automated validation), run:

```bash
python run_pipeline.py
```

Sequential pipeline steps executed by `run_pipeline.py`:
1. `notebooks/data_preprocessing.py`
2. `python_analysis/generate_class_distribution_figure.py`
3. `python_analysis/statistical_analysis.py`
4. `python_analysis/generate_effect_size_figure.py`
5. `python_analysis/model_training.py`
6. `python_analysis/shap_analysis.py`
7. `python_analysis/generate_shap_global_importance.py`
8. `python_analysis/generate_shap_local_waterfall.py`
9. `python_analysis/generate_methodology_pipeline.py`
10. `python_analysis/generate_final_results_summary.py`
11. `python_analysis/validate_outputs.py`

## BRFSS Data Protocol & Methodological Limitations

- **Self-Reported & Cross-Sectional Data**: The CDC Behavioral Risk Factor Surveillance System (BRFSS) relies on self-reported survey responses rather than direct clinical diagnostic tests (e.g., HbA1c or fasting plasma glucose). The cross-sectional design precludes causal inferences.
- **Unweighted Sample Analysis**: Results reflect the unweighted analyzed BRFSS sample ($N = 253,680$) and do not represent weighted national population estimates.
- **Repeated Profiles**: 24,206 repeated feature profiles exist in the cleaned dataset. Because BRFSS is an anonymous survey lacking individual respondent IDs, these identical feature combinations represent distinct survey respondents sharing the same discretized profile and are strictly retained to preserve natural sample prevalence.
- **Holdout Partition Usage**: Holdout data were not used for model, hyperparameter, feature, or threshold selection. They were reserved strictly for final performance evaluation, post-hoc holdout calibration assessment, uncertainty estimation (bootstrap 95% CIs), and SHAP explanation analyses.
- **Screening Objective & Clinical Validation**: The selected screening threshold ($\text{Recall} \ge 0.80$) represents a research-oriented design objective for early screening trade-offs, not a clinical diagnostic guideline. The predictive model has not undergone clinical trial validation.

## Paper-Ready Output References

See [docs/paper_ready_outputs.md](docs/paper_ready_outputs.md) for a map of canonical CSV tables, figures, and methodology descriptions for research manuscript writing.

## Web Research Dashboard (`app/`)

A Next.js research dashboard displaying precomputed analysis outputs and including a grounded study assistant is maintained in `app/`. (Note: `app/` is maintained separately and is not part of the scientific Python pipeline execution).
