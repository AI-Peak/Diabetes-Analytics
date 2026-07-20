# Statistical Hypothesis Testing & Adjusted Association Report
## CDC Diabetes Health Indicators (Cleaned Dataset)

### Methodology: CRISP-DM (Exploratory & Statistical Analysis)
**Author:** Senior Data Analytics Engineer & Team Members  
**Date:** 2026-07-21  
**Project:** Diabetes-Analytics  
**Objective:** Answer RQ1: *Which demographic, lifestyle, and health-related factors are statistically associated with diabetes status in the CDC BRFSS 2015 sample?*

---

## 1. Introduction
This report presents the quantitative statistical evaluation of the relationships between 21 health indicators and diabetes status (`Diabetes_binary`). The analysis is conducted on the full dataset of **253,680** survey respondents (retaining repeated feature profiles to preserve natural sample distribution).

To ensure statistical rigor, we apply:
1. **Chi-Square Test of Independence** for categorical, binary, and ordinal variables.
2. **Cramér's V** to measure effect size for categorical associations.
3. **Independent Two-Sample Welch t-Test** (parametric mean comparison) and **Mann-Whitney U Test** (non-parametric median/distribution comparison) for continuous numerical variables.
4. **Absolute Rank-Biserial Correlation** (primary) and **Cohen's d** (secondary) to measure numerical effect sizes.
5. **Holm–Bonferroni Multiple Testing Correction**: Holm adjustment was applied across the prespecified primary association tests: Chi-square tests for categorical features and Mann–Whitney U tests for numerical features. Welch’s t-tests were retained as complementary sensitivity analyses.
6. **Multivariable Adjusted Association Analysis**: Multivariable Logistic Regression to evaluate adjusted Odds Ratios (ORs), 95% Confidence Intervals, and Variance Inflation Factors (VIF) to assess conditional feature contributions while controlling for co-occurring indicators.

> **Methodological Note on Large Sample Size:**  
> With *N* = 253,680, statistical tests possess near-infinite power, causing p-values for almost all predictors to drop below $p < 0.05$. Therefore, p-values are reported alongside Holm-adjusted values for formal hypothesis testing, but **practical feature importance is evaluated by Effect Size within each feature family**.

---

## 2. Categorical Variable Analysis (Chi-Square & Cramér's V)

### Contingency Table & Chi-Square Summary (with Holm-Bonferroni Correction)
| Variable Name | Attribute Description | Chi-Square ($\chi^2$) | Raw p-value | Holm-Adjusted p | Reject $H_0$ | df | Cramér's V | Effect Size Interpretation | Max Prevalence Diff |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: |
| `GenHlth` | Self-Rated General Health | 22728.07 | `< 1.00e-300` | `< 1.00e-300` | Yes | 4 | 0.2993 | **Moderate** | 35.38% |
| `HighBP` | High Blood Pressure | 17562.45 | `< 1.00e-300` | `< 1.00e-300` | Yes | 1 | 0.2631 | **Moderate** | 18.41% |
| `DiffWalk` | Difficulty Walking or Climbing Stairs | 12092.32 | `< 1.00e-300` | `< 1.00e-300` | Yes | 1 | 0.2183 | **Moderate** | 20.21% |
| `HighChol` | High Cholesterol | 10174.07 | `< 1.00e-300` | `< 1.00e-300` | Yes | 1 | 0.2003 | **Moderate** | 14.03% |
| `Age` | Age Category (13 levels) | 8795.05 | `< 1.00e-300` | `< 1.00e-300` | Yes | 12 | 0.1862 | **Small** | 20.48% |
| `HeartDiseaseorAttack` | Heart Disease or Attack History | 7971.16 | `< 1.00e-300` | `< 1.00e-300` | Yes | 1 | 0.1773 | **Small** | 21.02% |
| `Income` | Income Bracket (8 levels) | 7003.72 | `< 1.00e-300` | `< 1.00e-300` | Yes | 7 | 0.1662 | **Small** | 18.23% |
| `Education` | Education Level (6 levels) | 4027.11 | `< 1.00e-300` | `< 1.00e-300` | Yes | 5 | 0.1260 | **Small** | 19.57% |
| `PhysActivity` | Physical Activity Indicator | 3539.42 | `< 1.00e-300` | `< 1.00e-300` | Yes | 1 | 0.1181 | **Small** | 9.53% |
| `Stroke` | Stroke History | 2838.92 | `< 1.00e-300` | `< 1.00e-300` | Yes | 1 | 0.1058 | **Small** | 18.57% |
| `CholCheck` | Cholesterol Check (5 Years) | 1062.94 | `3.75e-233` | `3.38e-232` | Yes | 1 | 0.0647 | **Weak** | 11.83% |
| `Smoker` | Tobacco Smoker Status | 937.06 | `8.64e-206` | `6.91e-205` | Yes | 1 | 0.0608 | **Weak** | 4.24% |
| `HvyAlcoholConsump` | Heavy Alcohol Consumption | 825.12 | `1.87e-181` | `1.31e-180` | Yes | 1 | 0.0570 | **Weak** | 8.58% |
| `Veggies` | Vegetable Consumption Daily | 811.81 | `1.46e-178` | `8.78e-178` | Yes | 1 | 0.0566 | **Weak** | 5.01% |
| `Fruits` | Fruit Consumption Daily | 421.61 | `1.09e-93` | `5.44e-93` | Yes | 1 | 0.0408 | **Negligible** | 2.93% |
| `Sex` | Biological Sex | 250.41 | `2.11e-56` | `6.33e-56` | Yes | 1 | 0.0314 | **Negligible** | 2.19% |
| `NoDocbcCost` | Doctor Cost Barrier | 250.31 | `2.22e-56` | `6.33e-56` | Yes | 1 | 0.0314 | **Negligible** | 3.92% |
| `AnyHealthcare` | Healthcare Coverage Access | 66.81 | `2.99e-16` | `2.99e-16` | Yes | 1 | 0.0162 | **Negligible** | 2.61% |

### Key Findings from Categorical Analysis:
1. **Strongest Marginal Associated Feature**: **`GenHlth`** (Self-Rated General Health) exhibits the strongest univariate association within the analyzed BRFSS sample with diabetes status (*V* = **0.2993**), showing a **35.38%** difference in prevalence across health levels.
2. **Survey-based Health Indicators**: General Health (`GenHlth`, *V* = 0.2993), High Blood Pressure (`HighBP`, *V* = 0.2631), High Cholesterol (`HighChol`, *V* = 0.2003), and Difficulty Walking (`DiffWalk`, *V* = 0.2183) represent the most salient marginal indicators.
3. **Behavioral Features**: Physical activity (`PhysActivity`, *V* = 0.1181) and fruit/vegetable intake show weak direct correlations (*V* < 0.10).
4. **Demographics**: Biological sex (`Sex`, *V* = 0.0314) exhibits minimal marginal association with diabetes prevalence.

---

## 3. Numerical Variable Analysis (t-Test & Mann-Whitney U)

### Numerical Tests Summary
| Variable | No Reported Diabetes Mean | Prediabetes/Diabetes Positive Mean | Mean Diff | No Reported Diabetes Median | Prediabetes/Diabetes Median | t-Stat | Raw t p-val | MWU p-val | Holm MWU p | Reject $H_0$ | Cohen's d | Abs Rank-Biserial | Effect Size Interpretation |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `BMI` | 27.81 | 31.94 | 4.14 | 27.0 | 31.0 | 99.92 | `< 1.00e-300` | `< 1.00e-300` | `< 1.00e-300` | Yes | 0.6414 | 0.3766 | **Moderate** |
| `MentHlth` | 2.98 | 4.46 | 1.48 | 0.0 | 0.0 | 29.69 | `7.93e-192` | `1.75e-90` | `7.00e-90` | Yes | 0.2006 | 0.0546 | **Negligible** |
| `PhysHlth` | 3.64 | 7.95 | 4.31 | 0.0 | 1.0 | 68.97 | `< 1.00e-300` | `< 1.00e-300` | `< 1.00e-300` | Yes | 0.5022 | 0.2260 | **Small** |

### Key Findings from Numerical Analysis:
1. **Body Mass Index (BMI)**: Mean BMI for the group without reported diabetes is **27.81** vs **31.94** for the prediabetes/diabetes positive group. Absolute Rank-Biserial correlation is **0.3766** (Cohen's d = **0.6414**), confirming a moderate practical effect size within the sample.
2. **Physical Unhealthy Days (`PhysHlth`)**: Respondents in the prediabetes/diabetes positive class report an average of **7.95** unhealthy physical days in the past 30 days compared to **3.64** days for respondents without reported diabetes.

---

## 4. Multivariable Adjusted Association Analysis (Logistic Regression)

To complement univariate marginal testing, a multivariable logistic regression model was estimated to quantify adjusted Odds Ratios (ORs) while controlling for all 21 health indicators simultaneously.

### Adjusted Odds Ratio & Multicollinearity Summary
| Variable Name | Description | Coef ($eta$) | Std Error | z-stat | Adjusted p-val | Holm-Adjusted p | Adjusted Odds Ratio (95% CI) | VIF |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `CholCheck` | Cholesterol Check (5 Years) | 1.2440 | 0.0686 | 18.14 | `1.58e-73` | `2.21e-72` | **3.47** (3.03–3.97) | 1.03 |
| `HighBP` | High Blood Pressure | 0.7576 | 0.0148 | 51.33 | `< 1.00e-300` | `< 1.00e-300` | **2.13** (2.07–2.20) | 1.33 |
| `HighChol` | High Cholesterol | 0.5785 | 0.0136 | 42.56 | `< 1.00e-300` | `< 1.00e-300` | **1.78** (1.74–1.83) | 1.17 |
| `GenHlth` | Self-Rated General Health | 0.5359 | 0.0081 | 65.86 | `< 1.00e-300` | `< 1.00e-300` | **1.71** (1.68–1.74) | 1.80 |
| `Sex` | Biological Sex | 0.2581 | 0.0135 | 19.18 | `5.28e-82` | `7.92e-81` | **1.29** (1.26–1.33) | 1.08 |
| `HeartDiseaseorAttack` | Heart Disease or Attack History | 0.2204 | 0.0178 | 12.38 | `3.25e-35` | `3.90e-34` | **1.25** (1.20–1.29) | 1.17 |
| `Stroke` | Stroke History | 0.1342 | 0.0251 | 5.35 | `9.01e-08` | `8.11e-07` | **1.14** (1.09–1.20) | 1.08 |
| `Age` | Age Category (13 levels) | 0.1236 | 0.0028 | 44.20 | `< 1.00e-300` | `< 1.00e-300` | **1.13** (1.13–1.14) | 1.35 |
| `DiffWalk` | Difficulty Walking or Climbing Stairs | 0.1232 | 0.0170 | 7.26 | `4.01e-13` | `4.01e-12` | **1.13** (1.09–1.17) | 1.53 |
| `AnyHealthcare` | Healthcare Coverage Access | 0.0827 | 0.0335 | 2.47 | `1.35e-02` | `5.41e-02` | **1.09** (1.02–1.16) | 1.11 |
| `BMI` | BMI | 0.0609 | 0.0009 | 67.60 | `< 1.00e-300` | `< 1.00e-300` | **1.06** (1.06–1.06) | 1.14 |
| `NoDocbcCost` | Doctor Cost Barrier | 0.0180 | 0.0230 | 0.78 | `4.36e-01` | `8.63e-01` | **1.02** (0.97–1.07) | 1.14 |
| `MentHlth` | MentHlth | -0.0036 | 0.0009 | -4.25 | `2.11e-05` | `1.48e-04` | **1.00** (0.99–1.00) | 1.24 |
| `PhysHlth` | PhysHlth | -0.0074 | 0.0008 | -9.45 | `3.26e-21` | `3.59e-20` | **0.99** (0.99–0.99) | 1.62 |
| `Smoker` | Tobacco Smoker Status | -0.0104 | 0.0132 | -0.79 | `4.31e-01` | `8.63e-01` | **0.99** (0.96–1.02) | 1.09 |
| `Education` | Education Level (6 levels) | -0.0308 | 0.0070 | -4.42 | `9.77e-06` | `7.82e-05` | **0.97** (0.96–0.98) | 1.33 |
| `Veggies` | Vegetable Consumption Daily | -0.0332 | 0.0159 | -2.08 | `3.72e-02` | `1.12e-01` | **0.97** (0.94–1.00) | 1.11 |
| `Fruits` | Fruit Consumption Daily | -0.0499 | 0.0137 | -3.65 | `2.65e-04` | `1.59e-03` | **0.95** (0.93–0.98) | 1.11 |
| `Income` | Income Bracket (8 levels) | -0.0515 | 0.0036 | -14.42 | `3.73e-47` | `4.86e-46` | **0.95** (0.94–0.96) | 1.50 |
| `PhysActivity` | Physical Activity Indicator | -0.0518 | 0.0144 | -3.59 | `3.35e-04` | `1.68e-03` | **0.95** (0.92–0.98) | 1.16 |
| `HvyAlcoholConsump` | Heavy Alcohol Consumption | -0.7692 | 0.0385 | -19.96 | `1.16e-88` | `1.86e-87` | **0.46** (0.43–0.50) | 1.02 |

### Key Findings from Multivariable Analysis:
1. **Highest Adjusted Odds Ratios**: `GenHlth` (OR = 1.71), `HighBP` (OR = 2.13), `HighChol` (OR = 1.78), and `CholCheck` (OR = 3.47) maintain strong positive adjusted associations with diabetes status.
2. **Multicollinearity Diagnostic**: All Variance Inflation Factor (VIF) values remain low (VIF < 3.0), indicating that severe multicollinearity is not present and multivariable parameter estimates are stable.

---

## 5. Visualizations and Diagnostics
Saved under `results/statistical_analysis/` and `docs/figures/`:
* **Effect Size Ranking**: [effect_size_ranking.png](figures/effect_size_ranking.png) — Two-panel figure displaying separate effect-size rankings: Cramér's V for categorical features (Panel A) and Absolute Rank-Biserial correlation for numerical features (Panel B).
* **Subgroup Prevalence**: [top_categorical_prevalence.png](figures/top_categorical_prevalence.png) — Prediabetes/diabetes positive rate by key risk factors.
* **BMI Distribution Boxplot**: [bmi_boxplot.png](figures/bmi_boxplot.png) — BMI range comparison across target classes.
* **Unhealthy Days Comparison**: [health_days_comparison.png](figures/health_days_comparison.png) — Mental and physical unhealthy day comparisons.

---

## 6. Conclusions for Research Question 1 (RQ1)
1. **Primary Associated Features**: General Health (`GenHlth`), High Blood Pressure (`HighBP`), High Cholesterol (`HighChol`), Difficulty Walking (`DiffWalk`), and Body Mass Index (`BMI`) demonstrate the highest sample-level effect sizes and adjusted odds ratios in the analyzed sample.
2. **Multiple Testing Control**: All key relationships remain statistically significant after Holm–Bonferroni correction, but feature prioritization is governed by effect size and adjusted odds ratio rather than p-value magnitudes.
