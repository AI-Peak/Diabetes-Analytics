# Phase 1 — Data & Evaluation Integrity Audit Report

**Project:** Diabetes-Analytics (Predicting Diabetes Risk Using CDC Health Indicators)  
**Audit Phase:** Phase 1 — Data & Evaluation Integrity Audit  
**Date Generated:** 2026-10-04 21:03:23  
**Audited File:** `data/processed/diabetes_cleaned.csv`  

---

## Executive Summary

This audit rigorously evaluates the data integrity, duplication structure, and evaluation partitioning of the CDC BRFSS 2015 dataset used in this study. 

Key high-level conclusions:
1. **Resolution of Terminology Ambiguity**: The previously reported figure of **24,206** represents **exact duplicate rows beyond the first occurrence across all 22 variables** (21 predictors + `Diabetes_binary`), not repeated feature profiles. When evaluated strictly across the 21 predictor features, there are **25,772 repeated predictor observations beyond the first occurrence** (belonging to 12,228 multi-observation profiles; 227,908 unique profiles in total).
2. **Conflicting-Label Profiles**: A total of **1,566 predictor profiles** (comprising **5,218 observations**, or **2.06%** of the dataset) exhibit conflicting outcomes—identical responses on all 21 survey health indicators appear with both `Diabetes_binary = 0` and `Diabetes_binary = 1`.
3. **Cross-Partition Overlap**: Under the primary 80/20 stratified split (`random_state=42`), **6,836 holdout observations (13.47%)** share an identical predictor profile with at least one record in the development set; **6,375 holdout observations (12.57%)** are exact full-row duplicates of records in the development set.
4. **Feasibility of Sensitivity Split**: A deterministic candidate profile-grouped sensitivity partition was constructed via `StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)`. **The third fold (zero-based index 2)** achieves exact partition symmetry (**50,736 holdout rows [20.00%]** vs. **202,944 development rows [80.00%]**), holds holdout prevalence at **13.9329%** (deviation of only 0.0004 percentage points from the full sample), and enforces **strictly zero cross-partition predictor profile overlap**.
5. **Phase Scope Confirmation**: In accordance with the study protocol, Phase 1 only audits and documents these structural properties. The empirical question of whether cross-partition profile overlap inflates discrimination or calibration performance belongs strictly to Phase 2 / RQ1.

---

## 1. Dataset Source

- **Audited Dataset Path:** `data/processed/diabetes_cleaned.csv`
- **Repository Relative Path:** `data/processed/diabetes_cleaned.csv`
- **File Format:** Comma-Separated Values (CSV)
- **Role in Pipeline:** Primary cleaned and validated dataset consumed by machine learning modeling (`python_analysis/model_training.py`), statistical testing (`python_analysis/statistical_analysis.py`), and SHAP explainability (`python_analysis/shap_analysis.py`).

---

## 2. Dataset Integrity

The basic structural parameters of the audited dataset were verified against the CDC BRFSS 2015 codebook and the current baseline manuscript:

| Parameter | Observed Value | Expected Paper Value | Status |
|:---|:---:|:---:|:---:|
| **Total Observations ($N$)** | 253,680 | 253,680 | **MATCH** |
| **Total Columns** | 22 | 22 | **MATCH** |
| **Predictor Variables ($p$)** | 21 | 21 | **MATCH** |
| **Target Variable** | `Diabetes_binary` | `Diabetes_binary` | **MATCH** |
| **Missing Values** | 0 | 0 | **MATCH** |
| **Duplicated Column Names** | 0 | 0 | **MATCH** |
| **Class 0 Count (No reported diabetes)** | 218,334 | 218,334 | **MATCH** |
| **Class 1 Count (Prediabetes/diabetes)** | 35,346 | 35,346 | **MATCH** |
| **Class 0 Prevalence** | 86.0667% | 86.07% | **MATCH** |
| **Class 1 Prevalence** | 13.9333% | 13.93% | **MATCH** |

No missing values, corrupted types, or structural deviations from the baseline manuscript were detected.

---

## 3. Exact Duplicate Row Audit

An **exact duplicate row** represents an instance where all 21 predictor indicators and the binary target outcome are completely identical:

```
predictors_i == predictors_j  and  target_i == target_j
```

### Quantitative Findings
- **Surplus exact duplicate rows beyond first occurrence (`df.duplicated().sum()`):** **24,206** (representing **9.54%** of the sample).
- **Total observations belonging to exact duplicate clusters (`df.duplicated(keep=False).sum()`):** **35,575** (**14.02%** of the dataset).
- **Number of distinct exact duplicate groups:** **11,369**.
- **Maximum exact duplicate group size:** **59** identical observations.

### Group Size Distribution (for clusters with size >= 2)
- **Mean cluster size:** 3.129
- **Standard deviation:** 3.221
- **25th percentile:** 2.0
- **Median (50th percentile):** 2.0
- **75th percentile:** 3.0
- **90th percentile:** 5.0
- **95th percentile:** 7.0
- **99th percentile:** 17.3
- **Maximum:** 59

---

## 4. Repeated Predictor Profile Audit

A **predictor profile** is defined strictly by the 21 predictor feature values (excluding the outcome `Diabetes_binary`). Repeated predictor profiles reflect individuals who provided identical survey answers to the 21 health indicators regardless of whether their diabetes status is concordant or discordant.

### Quantitative Findings
- **Total unique predictor profiles:** **227,908** (out of 253,680 total respondents).
- **Surplus repeated observations beyond first occurrence (`df.duplicated(subset=X).sum()`):** **25,772** (**10.16%**).
- **Total observations belonging to repeated predictor profile clusters:** **38,000** (**14.98%**).
- **Number of distinct multi-observation predictor profiles (size >= 2):** **12,228**.
- **Maximum predictor profile group size:** **59** observations.

### Multi-Observation Profile Size Distribution (size >= 2)
- **Mean profile size:** 3.108
- **Standard deviation:** 3.152
- **25th percentile:** 2.0
- **Median (50th percentile):** 2.0
- **75th percentile:** 3.0
- **90th percentile:** 5.0
- **95th percentile:** 7.0
- **99th percentile:** 17.0
- **Maximum:** 59

### Crucial Distinction
```
Total Rows = 253,680
Unique Predictor Profiles = 227,908
Difference = 25,772 surplus observations across predictor profiles

Exact Duplicate Rows (surplus) = 24,206
Surplus Predictor Profile Observations = 25,772
Difference (25,772 - 24,206) = 1,566
```
The discrepancy of **1,566** corresponds precisely to the number of predictor profiles that exhibit conflicting labels between class 0 and class 1.

---

## 5. Conflicting-Label Predictor Profiles

A **conflicting-label predictor profile** occurs when an identical 21-feature response vector appears in the dataset with both `Diabetes_binary = 0` (no diabetes) and `Diabetes_binary = 1` (prediabetes/diabetes).

### Quantitative Findings
- **Number of conflicting predictor profiles:** **1,566** (representing **0.69%** of all unique profiles, or **12.81%** of multi-observation profiles).
- **Total observations belonging to conflicting profiles:** **5,218** (**2.0569%** of the entire dataset).
- **Largest conflicting profile size:** **44** observations.

### Distribution of Within-Profile Positive Rate (pos_rate = n_positives / profile_size)
- **Mean positive rate:** 41.4449%
- **Standard deviation:** 13.6534%
- **Minimum:** 2.2727%
- **25th percentile:** 33.3333%
- **Median (50th percentile):** 50.0000%
- **75th percentile:** 50.0000%
- **90th percentile:** 50.0000%
- **95th percentile:** 50.0000%
- **Maximum:** 75.0000%

*Note: In an unweighted public health survey with coarse ordinal categories, conflicting profiles are biologically expected (e.g., genetic, metabolic, or temporal factors not captured in the 21 survey items). Full profile-level details are exported to `predictor_profile_statistics.csv`.*

---

## 6. Current Primary Split Integrity & Overlap

The current baseline machine learning pipeline uses an 80/20 stratified random split:
```python
train_test_split(X, y, test_size=0.20, stratify=y, random_state=42)
```

### Partition Sizes and Stratification
- **Development set:** 202,944 observations (80.00%)
  - Class 0: 174,667 | Class 1: 28,277
  - Development prevalence: **13.9334%**
- **Holdout test set:** 50,736 observations (20.00%)
  - Class 0: 43,667 | Class 1: 7,069
  - Holdout prevalence: **13.9329%**
- **Prevalence difference:** -0.000004 (exact stratification preserved).

### Exact-Row Cross-Partition Overlap (all 22 variables)
- **Shared exact-row signatures:** **4,685**
- **Holdout rows with exact match in development:** **6,375** (**12.5650%** of holdout)
- **Development rows with exact match in holdout:** **13,023** (**6.4170%** of development)

### Predictor-Profile Cross-Partition Overlap (21 predictors)
- **Shared predictor-profile signatures:** **5,052**
- **Holdout rows whose predictor profile appears in development:** **6,836** (**13.4737%** of holdout)
- **Development rows whose predictor profile appears in holdout:** **13,811** (**6.8053%** of development)

---

## 7. Profile-Grouped Candidate Sensitivity Split

To evaluate the potential impact of cross-partition predictor profile sharing in Phase 2 / RQ1, a candidate sensitivity split was created using:
```python
StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
```
where `groups` is the unique predictor profile identifier for each row.

### Evaluation of Candidate Folds
All 5 folds were evaluated against sample symmetry and prevalence preservation:

| Fold | Dev Rows | Holdout Rows | Holdout Pct | Dev Prev | Holdout Prev | Size Dev (Rows) | Prev Dev | Profile Overlap | Status |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 0 | 202,943 | 50,737 | 20.0004% | 13.9330% | 13.9346% | 1 | 0.000013 | 0 | Candidate |
| 1 | 202,945 | 50,735 | 19.9996% | 13.9333% | 13.9332% | 1 | 0.000001 | 0 | Candidate |
| **2** | **202,944** | **50,736** | **20.0000%** | **13.9334%** | **13.9329%** | **0** | **0.000004** | **0** | **SELECTED** |
| 3 | 202,944 | 50,736 | 20.0000% | 13.9334% | 13.9329% | 0 | 0.000004 | 0 | Tied (Fold > 2) |
| 4 | 202,944 | 50,736 | 20.0000% | 13.9334% | 13.9329% | 0 | 0.000004 | 0 | Tied (Fold > 2) |

### Selected Candidate Fold Properties (Third Fold, Zero-Based Index 2)
- **Holdout partition size:** **50,736** (**20.0000%**, exactly matching the standard 50,736 holdout benchmark).
- **Development partition size:** **202,944** (**80.0000%**, exactly 202,944 rows).
- **Holdout prevalence:** **13.9329%** (deviation from full population prevalence: 0.000004).
- **Shared predictor profile signatures:** **0** (strictly zero overlap).
- **Shared exact-row signatures:** **0** (strictly zero overlap).

*Status: Deterministically selected as the candidate sensitivity split for Phase 2 / RQ1.*

---

## 8. Scientific Interpretation

1. **Measurement vs. Profile Representation**: `df.duplicated()` across all columns measures exact duplicate rows across both features and target. In contrast, evaluating repeated predictor profiles requires excluding the target (`subset=feature_columns`). Conflating these two concepts obscured the existence of 1,566 conflicting-label profiles.
2. **Survey Nature of Duplicates**: In an unweighted cross-sectional survey of 253,680 respondents based on 21 discrete categorical or ordinal variables, repeated records naturally arise from demographic and lifestyle clustering (e.g., non-smoking, insured individuals in specific age and income brackets). These records represent separate respondents, not duplicate survey submissions.
3. **No Automatic Leakage Claim**: The existence of cross-partition profile overlap (13.47% of the holdout set) establishes a legitimate methodological motivation for sensitivity testing. However, the presence of overlap does **NOT** by itself prove that model performance is inflated. Because tabular models evaluate discretized feature space, identical profiles in train and test may represent natural population density rather than illicit information leakage.
4. **Role of Profile-Grouped Split**: The candidate grouped split must be utilized strictly as a sensitivity analysis in RQ1. It is not intended to displace the primary stratified split, which preserves the authentic empirical sample density.
5. **No Model Degradation Inferred**: Whether tree-based or linear models suffer performance drop under the grouped split must be tested empirically in Phase 2 / RQ1.

---

## 9. Recommended Terminology for the Manuscript

The terminology audit (`results/phase1_integrity/terminology_audit.csv`) identified 15 locations across repository documents, scripts, and logs where terms like "repeated feature profiles" were used to describe exact 22-column duplicate rows. 

The following standardized scientific vocabulary is recommended for the revised journal manuscript:

| Current Inaccurate / Ambiguous Term | Recommended Scientific Term | Scope / Operational Definition |
|:---|:---|:---|
| `24,206 repeated feature profiles` | **24,206 exact duplicate rows beyond the first occurrence** | Across all 22 columns (all 21 predictors and target identical; 35,575 total rows in duplicate clusters). |
| `Duplicate profiles` | **Repeated predictor profiles** | Across the 21 predictor features only (all 21 predictors identical regardless of target; 25,772 surplus observations; 38,000 cluster rows). |
| `Duplicate rows were dropped` (in SQL log) | **Exact duplicate records retained** | Retained per BRFSS unweighted sample protocol without respondent identifiers. |
| `Leakage` / `Data Leakage` | **Cross-partition predictor profile sharing** | Neutral descriptive term; performance impact to be evaluated under sensitivity analysis. |
| `Grouped Split as Primary` | **Candidate Profile-Grouped Sensitivity Split** | Used strictly for comparative robustness evaluation in RQ1. |

---

## 10. Audit Artifacts Summary

All Phase 1 audit deliverables have been generated in `results/phase1_integrity/`:
- `dataset_integrity_summary.csv`: Comprehensive structural and frequency statistics.
- `predictor_profile_statistics.csv`: Complete profile-level table (227,908 unique profiles).
- `split_integrity_summary.csv`: Side-by-side comparison of primary vs. grouped candidate splits.
- `profile_grouped_fold_candidates.csv`: Full metrics across all 5 candidate StratifiedGroupKFold folds.
- `terminology_audit.csv`: Catalog of 15 terminology corrections across repository files.
- `phase1_integrity_metadata.json`: Machine-readable metadata and parameters.
- `phase1_integrity_report.md`: Canonical markdown audit documentation (this document).
