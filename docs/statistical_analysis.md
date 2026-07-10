# Statistical Hypothesis Testing Report
## CDC Diabetes Health Indicators (Cleaned Dataset)

### Methodology: CRISP-DM (Exploratory & Statistical Analysis)
**Author:** Senior Data Analytics Engineer & Team Members  
**Date:** 2026-07-10  
**Project:** Diabetes-Analytics
**Objective:** Answer RQ1: *Which demographic, lifestyle, and health-related factors are statistically associated with diabetes in the CDC BRFSS 2015 dataset?*

---

## 1. Introduction
This report presents the quantitative statistical evaluation of the relationships between 21 health indicators and diabetes status (`Diabetes_binary`). The analysis is conducted on the cleaned dataset of **229,474** individuals (after removing duplicated records to ensure model validity). 

To ensure statistical rigor, we apply:
1. **Chi-Square Test of Independence** for categorical, binary, and ordinal variables.
2. **Cramér's V** to measure the effect size of categorical associations.
3. **Independent Two-Sample Welch t-Test** (parametric mean comparison) and **Mann-Whitney U Test** (non-parametric median/distribution comparison) for continuous numerical variables.
4. **Cohen's d** and **Rank-Biserial Correlation (with Common Language Effect Size)** to measure the effect sizes for numerical variables.

---

## 2. Categorical Variable Analysis (Chi-Square & Cramér's V)
Due to the large sample size (*N* = 229,474), all variables are expected to yield p-values approaching zero ($p < 0.05$). Therefore, we prioritize **Cramér's V** to determine the practical strength of association.

### Contingency Table & Chi-Square Summary
| Variable Name | Attribute Description | Chi-Square ($\chi^2$) | p-value | df | Cramér's V | Association Strength | Max Prevalence Diff |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :---: |
| `GenHlth` | Self-Rated General Health | 18193.70 | `< 1.00e-300` | 4 | 0.2816 | **Moderate** | 34.64% |
| `HighBP` | High Blood Pressure | 14840.42 | `< 1.00e-300` | 1 | 0.2543 | **Moderate** | 18.38% |
| `DiffWalk` | Difficulty Walking or Climbing Stairs | 9670.63 | `< 1.00e-300` | 1 | 0.2053 | **Moderate** | 19.00% |
| `HighChol` | High Cholesterol | 8719.66 | `< 1.00e-300` | 1 | 0.1949 | **Small** | 14.13% |
| `Age` | Age Category (13 levels) | 8207.83 | `< 1.00e-300` | 12 | 0.1891 | **Small** | 21.73% |
| `HeartDiseaseorAttack` | Heart Disease or Attack History | 6491.59 | `< 1.00e-300` | 1 | 0.1682 | **Small** | 19.89% |
| `Income` | Income Bracket (8 levels) | 4637.20 | `< 1.00e-300` | 7 | 0.1422 | **Small** | 16.42% |
| `Education` | Education Level (6 levels) | 2508.41 | `< 1.00e-300` | 5 | 0.1046 | **Small** | 17.69% |
| `PhysActivity` | Physical Activity Indicator | 2312.70 | `< 1.00e-300` | 1 | 0.1004 | **Small** | 8.17% |
| `Stroke` | Stroke History | 2256.53 | `< 1.00e-300` | 1 | 0.0992 | **Weak / Very Small** | 17.26% |
| `CholCheck` | Cholesterol Check (5 Years) | 1205.93 | `3.14e-264` | 1 | 0.0725 | **Weak / Very Small** | 13.24% |
| `HvyAlcoholConsump` | Heavy Alcohol Consumption | 997.31 | `6.91e-219` | 1 | 0.0659 | **Weak / Very Small** | 9.93% |
| `Smoker` | Tobacco Smoker Status | 474.90 | `2.75e-105` | 1 | 0.0455 | **Negligible** | 3.28% |
| `Veggies` | Vegetable Consumption Daily | 399.39 | `7.48e-89` | 1 | 0.0417 | **Negligible** | 3.72% |
| `Sex` | Biological Sex | 245.55 | `2.42e-55` | 1 | 0.0327 | **Negligible** | 2.37% |
| `AnyHealthcare` | Healthcare Coverage Access | 146.94 | `8.10e-34` | 1 | 0.0253 | **Negligible** | 4.03% |
| `Fruits` | Fruit Consumption Daily | 141.05 | `1.57e-32` | 1 | 0.0248 | **Negligible** | 1.83% |
| `NoDocbcCost` | Doctor Cost Barrier | 92.04 | `8.49e-22` | 1 | 0.0200 | **Negligible** | 2.49% |

### Key Findings from Categorical Analysis:
1. **Strongest Predictors**: **`GenHlth`** (Self-Rated General Health) shows the highest association with diabetes status, with a Cramér's V of **0.2816** (indicating a moderate-to-strong practical association). There is a **34.64%** difference in diabetes prevalence between categories.
2. **Clinical Flags**: General Health (`GenHlth`, *V* = 0.2816) and High Blood Pressure (`HighBP`, *V* = 0.2543) represent the most critical risk indicators.
3. **Lifestyle & Behavior**: Physical activity (`PhysActivity`, *V* = 0.1004) and diet (fruits/veggies) are statistically significant, but show relatively weak direct associations (*V* < 0.1). Heavy alcohol consumption (`HvyAlcoholConsump`) has a negligible direct correlation (*V* = 0.0659).
4. **Demographics**: Biological sex (`Sex`) has a very small statistical relationship with diabetes status (*V* = 0.0327), indicating that diabetes prevalence rates between males and females in the CDC dataset are highly similar.

---

## 3. Numerical Variable Analysis (t-Test & Mann-Whitney U)
Since `BMI`, `MentHlth`, and `PhysHlth` are highly skewed and non-normally distributed, the non-parametric **Mann-Whitney U** test is the primary statistical tool for testing median differences. Welch's t-test and Cohen's d are provided as a secondary parametric reference.

### Numerical Tests Summary
| Variable | Healthy Mean | Diabetic Mean | Mean Diff | Healthy Median | Diabetic Median | t-Statistic | t p-value | Cohen's d | MWU p-value | CLES | Rank-Biserial |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `BMI` | 28.10 | 31.96 | 3.87 | 27.0 | 31.0 | 91.96 | `< 1.00e-300` | 0.5822 | `< 1.00e-300` | 0.6745 | 0.3490 |
| `MentHlth` | 3.33 | 4.49 | 1.16 | 0.0 | 0.0 | 22.86 | `5.03e-115` | 0.1507 | `1.10e-19` | 0.5128 | 0.0256 |
| `PhysHlth` | 4.08 | 8.01 | 3.93 | 0.0 | 1.0 | 61.97 | `< 1.00e-300` | 0.4394 | `< 1.00e-300` | 0.5976 | 0.1951 |

### Key Findings from Numerical Analysis:
1. **Body Mass Index (BMI)**: The mean BMI for the healthy group is **28.10** (overweight baseline) compared to **31.96** for the diabetic group (obese category). The differences are highly significant under both parametric Welch t-test ($t = 91.96, p < 0.05$) and Mann-Whitney U tests ($p < 0.05$). Cohen's d of **0.5822** indicates a small-to-medium effect size.
2. **Physical Health Days (`PhysHlth`)**: Diabetics experience an average of **8.01** days of poor physical health in the past 30 days, compared to only **4.08** days for non-diabetics. This difference is clinically and statistically significant.
3. **Common Language Effect Size (CLES)**: The CLES for `BMI` is **0.6745**, meaning there is a **67.5%** probability that a randomly chosen diabetic individual has a higher BMI than a randomly chosen non-diabetic individual.

---

## 4. Visualizations and Diagnostics
The generated plots have been saved under `results/statistical_analysis/`:
* **Association Strengths**: [cramers_v_ranking.png](file:///D:/My document/DAP391m/Diabetes/Diabetes-Analytics/results/statistical_analysis/cramers_v_ranking.png) - Shows the hierarchical ranking of categorical predictors.
* **Prevalence Bar Plots**: [top_categorical_prevalence.png](file:///D:/My document/DAP391m/Diabetes/Diabetes-Analytics/results/statistical_analysis/top_categorical_prevalence.png) - Highlights diabetes rates across subcategories of key risk factors (BP, cholesterol, self-reported health).
* **BMI Distribution Boxplot**: [bmi_boxplot.png](file:///D:/My document/DAP391m/Diabetes/Diabetes-Analytics/results/statistical_analysis/bmi_boxplot.png) - Demonstrates shift in BMI ranges between classes.
* **Poor Health Comparison**: [health_days_comparison.png](file:///D:/My document/DAP391m/Diabetes/Diabetes-Analytics/results/statistical_analysis/health_days_comparison.png) - Standard error bar plots comparing mental and physical health days.

---

## 5. Conclusions for Research Question 1 (RQ1)
The statistical analyses provide conclusive evidence to answer **RQ1**:

* **Highly Associated Factors**: High Blood Pressure (`HighBP`), General Health Status (`GenHlth`), High Cholesterol (`HighChol`), and Body Mass Index (`BMI`) are the most clinically and statistically significant factors associated with diabetes risk in this population.
* **Socioeconomic Indicators**: Both Income (`Income`) and Age category (`Age`) are moderately associated, with older age brackets and lower income levels demonstrating significantly higher rates of diabetes.
* **Lifestyle Factors**: Daily fruit/vegetable intake and smoking are statistically significant, but exhibit very low direct correlation effect sizes, indicating they are likely secondary contributors or have indirect interactions through variables like BMI.
* **Biological Sex**: Shows minimal direct relationship to diabetes prevalence.

These statistical associations will serve as the baseline comparison layer for the **Explanation Consistency Analysis** in Phase 5, where we will check if the best-performing machine learning model's SHAP values align with these findings.
