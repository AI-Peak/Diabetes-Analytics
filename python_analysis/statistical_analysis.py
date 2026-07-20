"""
Statistical Hypothesis Testing Module (RQ1)
--------------------------------------------
Author: Senior Data Analytics Engineer / Team Members
Methodology: CRISP-DM
Dataset: CDC Diabetes Health Indicators (Cleaned)

This script performs the statistical analysis phase (Phase 2) to answer RQ1:
"Which demographic, lifestyle, and health-related factors are statistically
associated with diabetes in the CDC BRFSS 2015 dataset?"

It applies:
- Chi-Square Test of Independence and Cramér's V for categorical/binary/ordinal variables.
- Mann-Whitney U Test (non-parametric) and Two-Sample t-Test (parametric) with
  Cohen's d and Rank-Biserial Correlation for numerical variables.

All outputs are saved in results/statistical_analysis/ and docs/statistical_analysis.md.
"""

import os
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
import scipy.stats as stats
from statsmodels.stats.multitest import multipletests
from scipy import stats

# Define directory paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "processed" / "diabetes_cleaned.csv"
RESULTS_DIR = BASE_DIR / "results" / "statistical_analysis"
DOCS_DIR = BASE_DIR / "docs"

# Ensure directories exist
RESULTS_DIR.mkdir(parents=True, exist_ok=True)
DOCS_DIR.mkdir(parents=True, exist_ok=True)

# Define column categories
COLUMNS_CATEGORICAL = [
    "HighBP", "HighChol", "CholCheck", "Smoker", "Stroke", 
    "HeartDiseaseorAttack", "PhysActivity", "Fruits", "Veggies", 
    "HvyAlcoholConsump", "AnyHealthcare", "NoDocbcCost", "GenHlth", 
    "DiffWalk", "Sex", "Age", "Education", "Income"
]

COLUMNS_NUMERICAL = ["BMI", "MentHlth", "PhysHlth"]

# Labels for prettier reports
LABEL_MAPPING = {
    "HighBP": "High Blood Pressure",
    "HighChol": "High Cholesterol",
    "CholCheck": "Cholesterol Check (5 Years)",
    "Smoker": "Tobacco Smoker Status",
    "Stroke": "Stroke History",
    "HeartDiseaseorAttack": "Heart Disease or Attack History",
    "PhysActivity": "Physical Activity Indicator",
    "Fruits": "Fruit Consumption Daily",
    "Veggies": "Vegetable Consumption Daily",
    "HvyAlcoholConsump": "Heavy Alcohol Consumption",
    "AnyHealthcare": "Healthcare Coverage Access",
    "NoDocbcCost": "Doctor Cost Barrier",
    "GenHlth": "Self-Rated General Health",
    "DiffWalk": "Difficulty Walking or Climbing Stairs",
    "Sex": "Biological Sex",
    "Age": "Age Category (13 levels)",
    "Education": "Education Level (6 levels)",
    "Income": "Income Bracket (8 levels)"
}

def load_data(file_path: Path) -> pd.DataFrame:
    """Loads the cleaned dataset."""
    print(f"Loading cleaned dataset from: {file_path}")
    if not file_path.exists():
        raise FileNotFoundError(f"Cleaned dataset not found at {file_path}. Run preprocessing first.")
    df = pd.read_csv(file_path)
    return df
def interpret_cramers_v(v: float) -> str:
    """Provides standard interpretation of Cramér's V effect size."""
    if v < 0.05:
        return "Negligible"
    elif v < 0.10:
        return "Weak"
    elif v < 0.20:
        return "Small"
    elif v < 0.30:
        return "Moderate"
    else:
        return "Strong"

def interpret_rank_biserial(r: float) -> str:
    """Provides standard interpretation of absolute Rank-Biserial correlation effect size."""
    r_abs = abs(r)
    if r_abs < 0.10:
        return "Negligible"
    elif r_abs < 0.30:
        return "Small"
    elif r_abs < 0.50:
        return "Moderate"
    else:
        return "Large"

def perform_categorical_tests(df: pd.DataFrame) -> pd.DataFrame:
    """Performs Chi-square tests of independence and calculates Cramér's V."""
    print("Performing Chi-Square tests of independence...")
    results = []
    
    for col in COLUMNS_CATEGORICAL:
        if col not in df.columns:
            print(f"Warning: {col} not in dataset. Skipping.")
            continue
            
        contingency_table = pd.crosstab(df[col], df["Diabetes_binary"])
        chi2, p_val, dof, expected = stats.chi2_contingency(contingency_table)
        
        n = contingency_table.sum().sum()
        v = np.sqrt(chi2 / n)
        
        rates = contingency_table.div(contingency_table.sum(axis=1), axis=0)[1] * 100
        rate_diff = rates.max() - rates.min()
        
        results.append({
            "Variable": col,
            "Description": LABEL_MAPPING.get(col, col),
            "Chi2 Statistic": chi2,
            "p-value": p_val,
            "Degrees of Freedom": dof,
            "Cramér's V": v,
            "Effect_Size": v,
            "Effect_Size_Type": "Cramér's V",
            "Effect Size Interpretation": interpret_cramers_v(v),
            "Min Diabetes Rate (%)": rates.min(),
            "Max Diabetes Rate (%)": rates.max(),
            "Max Difference (%)": rate_diff
        })
        
    results_df = pd.DataFrame(results).sort_values(by="Cramér's V", ascending=False)
    return results_df

def perform_numerical_tests(df: pd.DataFrame) -> pd.DataFrame:
    """Performs Mann-Whitney U test and Independent t-test on numerical variables."""
    print("Performing statistical tests on numerical variables...")
    results = []
    
    g_diabetic = df[df["Diabetes_binary"] == 1]
    g_healthy = df[df["Diabetes_binary"] == 0]
    
    n_diabetic = len(g_diabetic)
    n_healthy = len(g_healthy)
    
    for col in COLUMNS_NUMERICAL:
        if col not in df.columns:
            print(f"Warning: {col} not in dataset. Skipping.")
            continue
            
        x_diabetic = g_diabetic[col].values
        x_healthy = g_healthy[col].values
        
        m_diabetic, std_diabetic = x_diabetic.mean(), x_diabetic.std(ddof=1)
        m_healthy, std_healthy = x_healthy.mean(), x_healthy.std(ddof=1)
        
        med_diabetic = np.median(x_diabetic)
        med_healthy = np.median(x_healthy)
        
        t_stat, t_pval = stats.ttest_ind(x_diabetic, x_healthy, equal_var=False)
        
        pooled_std = np.sqrt(((n_diabetic - 1) * std_diabetic**2 + (n_healthy - 1) * std_healthy**2) / (n_diabetic + n_healthy - 2))
        cohen_d = (m_diabetic - m_healthy) / pooled_std
        
        u_stat, mwu_pval = stats.mannwhitneyu(x_diabetic, x_healthy, alternative="two-sided")
        
        cles = u_stat / (n_diabetic * n_healthy)
        rank_biserial = 2 * cles - 1
        abs_rb = abs(rank_biserial)
        
        results.append({
            "Variable": col,
            "No Reported Diabetes Mean": m_healthy,
            "Prediabetes/Diabetes Positive Mean": m_diabetic,
            "Mean Difference": m_diabetic - m_healthy,
            "No Reported Diabetes Median": med_healthy,
            "Prediabetes/Diabetes Positive Median": med_diabetic,
            "t-Statistic": t_stat,
            "t p-value": t_pval,
            "Cohen's d": cohen_d,
            "MWU U-Statistic": u_stat,
            "MWU p-value": mwu_pval,
            "CLES (Superiority)": cles,
            "Rank-Biserial Correlation": rank_biserial,
            "Effect_Size": abs_rb,
            "Effect_Size_Type": "Abs Rank-Biserial",
            "Effect Size Interpretation": interpret_rank_biserial(abs_rb)
        })
        
    results_df = pd.DataFrame(results)
    return results_df

def apply_holm_bonferroni_corrections(cat_df: pd.DataFrame, num_df: pd.DataFrame):
    """Applies Holm-Bonferroni p-value adjustment across all statistical hypothesis tests."""
    all_pvals = list(cat_df["p-value"].values) + list(num_df["MWU p-value"].values)
    reject, pvals_corrected, _, _ = multipletests(all_pvals, alpha=0.05, method="holm")
    
    n_cat = len(cat_df)
    cat_df["Holm_p_value"] = pvals_corrected[:n_cat]
    cat_df["Reject_Holm"] = reject[:n_cat]
    
    num_df["Holm_p_value"] = pvals_corrected[n_cat:]
    num_df["Reject_Holm"] = reject[n_cat:]
    
    cat_df.to_csv(RESULTS_DIR / "chi_square_results.csv", index=False)
    num_df.to_csv(RESULTS_DIR / "numerical_results.csv", index=False)
    print("Saved chi_square_results.csv and numerical_results.csv with Holm-adjusted p-values.")

def generate_visualizations(df: pd.DataFrame, cat_results: pd.DataFrame, num_results: pd.DataFrame):
    """Generates and saves professional, scientific visualizations of statistical findings."""
    print("Generating statistical visualizations...")
    sns.set_theme(style="whitegrid")
    
    # 1. Generate Two-Panel Effect Size Figure via generate_effect_size_figure module
    from generate_effect_size_figure import generate_effect_size_figure
    generate_effect_size_figure()

    # 2. Top Categorical Prevalence Bar Chart
    top_factors = cat_results.head(4)["Variable"].tolist()
    fig, axes = plt.subplots(2, 2, figsize=(13, 9))
    axes = axes.flatten()
    
    for i, col in enumerate(top_factors):
        contingency = pd.crosstab(df[col], df["Diabetes_binary"])
        rates = contingency.div(contingency.sum(axis=1), axis=0)[1] * 100
        ax = axes[i]
        
        x_labels = [str(int(x)) for x in rates.index]
        if col == "HighBP":
            x_labels = ["No High BP (0)", "High BP (1)"]
        elif col == "HighChol":
            x_labels = ["No High Chol (0)", "High Chol (1)"]
        elif col == "DiffWalk":
            x_labels = ["No Difficulty (0)", "Has Difficulty (1)"]
        elif col == "GenHlth":
            x_labels = ["1: Excellent", "2: Very Good", "3: Good", "4: Fair", "5: Poor"]
            
        bars = ax.bar(x_labels, rates.values, color="#1D4ED8", alpha=0.85, width=0.45)
        ax.set_title(f"Diabetes Prevalence (%) by {LABEL_MAPPING.get(col, col)}", fontsize=11, fontweight="bold", pad=10)
        ax.set_ylabel("Prevalence (%)", fontsize=10)
        ax.set_ylim(0, max(rates.values) * 1.18)
        ax.grid(axis="y", linestyle="--", alpha=0.5)
        
        for bar in bars:
            h = bar.get_height()
            ax.text(bar.get_x() + bar.get_width()/2.0, h + 0.8, f"{h:.1f}%", ha="center", va="bottom", fontsize=9, fontweight="bold", color="#1E293B")
            
    plt.suptitle("Diabetes Prevalence Across Key Risk Indicator Subgroups", fontsize=13, fontweight="bold", y=0.98)
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "top_categorical_prevalence.png", dpi=300)
    plt.close()
    
    # 3. BMI Boxplot
    plt.figure(figsize=(8, 5))
    plot_df = df[df["BMI"] <= 60].copy()
    sns.boxplot(
        data=plot_df,
        x="Diabetes_binary",
        y="BMI",
        palette=["#3B82F6", "#EF4444"],
        hue="Diabetes_binary",
        legend=False,
        width=0.35
    )
    plt.title("Body Mass Index (BMI) Distribution vs Diabetes Status", fontsize=12, fontweight="bold", pad=15)
    plt.xticks([0, 1], ["0: No reported diabetes", "1: Prediabetes/diabetes positive class"])
    plt.xlabel("")
    plt.ylabel("Body Mass Index (BMI)", fontsize=11)
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "bmi_boxplot.png", dpi=300)
    plt.close()
    
    # 4. Poor Health Days Plot
    plt.figure(figsize=(9, 5))
    num_vars_long = pd.melt(df, id_vars=["Diabetes_binary"], value_vars=["MentHlth", "PhysHlth"],
                            var_name="Indicator", value_name="Days")
    sns.barplot(
        data=num_vars_long,
        x="Indicator",
        y="Days",
        hue="Diabetes_binary",
        palette=["#3B82F6", "#EF4444"],
        errorbar="ci",
        alpha=0.85
    )
    plt.title("Comparison of Unhealthy Days (Past 30 Days)", fontsize=12, fontweight="bold", pad=15)
    plt.xlabel("")
    plt.ylabel("Average Days Reported", fontsize=11)
    plt.xticks([0, 1], ["Mental Health (MentHlth)", "Physical Health (PhysHlth)"])
    plt.legend(labels=["0: Healthy", "1: Diabetic"])
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "health_days_comparison.png", dpi=300)
    plt.close()
    print("Saved all diagnostic statistical plots successfully.")

def write_academic_report(df: pd.DataFrame, cat_results: pd.DataFrame, num_results: pd.DataFrame):
    """Writes the statistical analysis findings directly to docs/statistical_analysis.md."""
    print("Writing academic documentation to docs/statistical_analysis.md...")
    n_total = len(df)
    
    top_cat = cat_results.iloc[0]["Variable"]
    top_cat_desc = cat_results.iloc[0]["Description"]
    top_cat_v = cat_results.iloc[0]["Cramér's V"]
    top_cat_diff = cat_results.iloc[0]["Max Difference (%)"]
    
    bmi_diabetic_mean = num_results.loc[num_results["Variable"] == "BMI", "Prediabetes/Diabetes Positive Mean"].values[0]
    bmi_healthy_mean = num_results.loc[num_results["Variable"] == "BMI", "No Reported Diabetes Mean"].values[0]
    bmi_cohen_d = num_results.loc[num_results["Variable"] == "BMI", "Cohen's d"].values[0]
    bmi_rb = num_results.loc[num_results["Variable"] == "BMI", "Rank-Biserial Correlation"].values[0]
    
    phys_diabetic_mean = num_results.loc[num_results["Variable"] == "PhysHlth", "Prediabetes/Diabetes Positive Mean"].values[0]
    phys_healthy_mean = num_results.loc[num_results["Variable"] == "PhysHlth", "No Reported Diabetes Mean"].values[0]
    
    markdown_content = f"""# Statistical Hypothesis Testing Report
## CDC Diabetes Health Indicators (Cleaned Dataset)

### Methodology: CRISP-DM (Exploratory & Statistical Analysis)
**Author:** Senior Data Analytics Engineer & Team Members  
**Date:** {pd.Timestamp.now().strftime("%Y-%m-%d")}  
**Project:** Diabetes-Analytics  
**Objective:** Answer RQ1: *Which demographic, lifestyle, and health-related factors are statistically associated with diabetes in the CDC BRFSS 2015 dataset?*

---

## 1. Introduction
This report presents the quantitative statistical evaluation of the relationships between 21 health indicators and diabetes status (`Diabetes_binary`). The analysis is conducted on the full dataset of **{n_total:,}** survey respondents (retaining repeated feature profiles to preserve natural sample distribution).

To ensure statistical rigor, we apply:
1. **Chi-Square Test of Independence** for categorical, binary, and ordinal variables.
2. **Cramér's V** to measure effect size for categorical associations.
3. **Independent Two-Sample Welch t-Test** (parametric mean comparison) and **Mann-Whitney U Test** (non-parametric median/distribution comparison) for continuous numerical variables.
4. **Absolute Rank-Biserial Correlation** (primary) and **Cohen's d** (secondary) to measure numerical effect sizes.
5. **Holm–Bonferroni Multiple Testing Correction** to control the family-wise error rate across all indicators.

> **Methodological Note on Large Sample Size:**  
> With *N* = {n_total:,}, statistical tests possess near-infinite power, causing p-values for almost all predictors to drop below $p < 0.05$. Therefore, p-values are reported alongside Holm-adjusted values for formal hypothesis testing, but **practical feature importance is ranked strictly by standardized Effect Size**.

---

## 2. Categorical Variable Analysis (Chi-Square & Cramér's V)

### Contingency Table & Chi-Square Summary (with Holm-Bonferroni Correction)
| Variable Name | Attribute Description | Chi-Square ($\chi^2$) | Raw p-value | Holm-Adjusted p | Reject $H_0$ | df | Cramér's V | Effect Size Interpretation | Max Prevalence Diff |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- | :---: |
"""
    for _, row in cat_results.iterrows():
        p_raw_str = f"{row['p-value']:.2e}" if row['p-value'] > 0 else "< 1.00e-300"
        p_holm_str = f"{row['Holm_p_value']:.2e}" if row['Holm_p_value'] > 0 else "< 1.00e-300"
        markdown_content += (
            f"| `{row['Variable']}` | {row['Description']} | {row['Chi2 Statistic']:.2f} | "
            f"`{p_raw_str}` | `{p_holm_str}` | {'Yes' if row['Reject_Holm'] else 'No'} | "
            f"{int(row['Degrees of Freedom'])} | {row['Cramér\'s V']:.4f} | "
            f"**{row['Effect Size Interpretation']}** | {row['Max Difference (%)']:.2f}% |\n"
        )
        
    markdown_content += f"""
### Key Findings from Categorical Analysis:
1. **Strongest Predictors**: **`{top_cat}`** ({top_cat_desc}) exhibits the strongest population-level association with diabetes status (*V* = **{top_cat_v:.4f}**), showing a **{top_cat_diff:.2f}%** difference in prevalence across health levels.
2. **Clinical Indicators**: General Health (`GenHlth`, *V* = {cat_results.loc[cat_results['Variable'] == 'GenHlth', "Cramér's V"].values[0]:.4f}), High Blood Pressure (`HighBP`, *V* = {cat_results.loc[cat_results['Variable'] == 'HighBP', "Cramér's V"].values[0]:.4f}), High Cholesterol (`HighChol`, *V* = {cat_results.loc[cat_results['Variable'] == 'HighChol', "Cramér's V"].values[0]:.4f}), and Difficulty Walking (`DiffWalk`, *V* = {cat_results.loc[cat_results['Variable'] == 'DiffWalk', "Cramér's V"].values[0]:.4f}) represent the most salient marginal indicators.
3. **Behavioral Features**: Physical activity (`PhysActivity`, *V* = {cat_results.loc[cat_results['Variable'] == 'PhysActivity', "Cramér's V"].values[0]:.4f}) and fruit/vegetable intake show weak direct correlations (*V* < 0.10).
4. **Demographics**: Biological sex (`Sex`, *V* = {cat_results.loc[cat_results['Variable'] == 'Sex', "Cramér's V"].values[0]:.4f}) exhibits minimal marginal association with diabetes prevalence.

---

## 3. Numerical Variable Analysis (t-Test & Mann-Whitney U)

### Numerical Tests Summary
| Variable | No Reported Diabetes Mean | Prediabetes/Diabetes Positive Mean | Mean Diff | No Reported Diabetes Median | Prediabetes/Diabetes Median | t-Stat | Raw t p-val | MWU p-val | Holm MWU p | Reject $H_0$ | Cohen's d | Abs Rank-Biserial | Effect Size Interpretation |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
"""
    for _, row in num_results.iterrows():
        t_p_str = f"{row['t p-value']:.2e}" if row['t p-value'] > 0 else "< 1.00e-300"
        mwu_p_str = f"{row['MWU p-value']:.2e}" if row['MWU p-value'] > 0 else "< 1.00e-300"
        holm_p_str = f"{row['Holm_p_value']:.2e}" if row['Holm_p_value'] > 0 else "< 1.00e-300"
        markdown_content += (
            f"| `{row['Variable']}` | {row['No Reported Diabetes Mean']:.2f} | {row['Prediabetes/Diabetes Positive Mean']:.2f} | "
            f"{row['Mean Difference']:.2f} | {row['No Reported Diabetes Median']:.1f} | {row['Prediabetes/Diabetes Positive Median']:.1f} | "
            f"{row['t-Statistic']:.2f} | `{t_p_str}` | `{mwu_p_str}` | `{holm_p_str}` | "
            f"{'Yes' if row['Reject_Holm'] else 'No'} | {row['Cohen\'s d']:.4f} | "
            f"{row['Effect_Size']:.4f} | **{row['Effect Size Interpretation']}** |\n"
        )
        
    markdown_content += f"""
### Key Findings from Numerical Analysis:
1. **Body Mass Index (BMI)**: Mean BMI for the group without reported diabetes is **{bmi_healthy_mean:.2f}** vs **{bmi_diabetic_mean:.2f}** for the prediabetes/diabetes positive group. Absolute Rank-Biserial correlation is **{abs(bmi_rb):.4f}** (Cohen's d = **{bmi_cohen_d:.4f}**), confirming a moderate practical effect size within the sample.
2. **Physical Unhealthy Days (`PhysHlth`)**: Respondents in the prediabetes/diabetes positive class report an average of **{phys_diabetic_mean:.2f}** unhealthy physical days in the past 30 days compared to **{phys_healthy_mean:.2f}** days for respondents without reported diabetes.

---

## 4. Visualizations and Diagnostics
Saved under `results/statistical_analysis/` and `docs/figures/`:
* **Effect Size Ranking**: [effect_size_ranking.png](figures/effect_size_ranking.png) — Two-panel lollipop ranking comparing Cramér's V (categorical) and Absolute Rank-Biserial correlation (numerical).
* **Subgroup Prevalence**: [top_categorical_prevalence.png](figures/top_categorical_prevalence.png) — Prediabetes/diabetes positive rate by key risk factors.
* **BMI Distribution Boxplot**: [bmi_boxplot.png](figures/bmi_boxplot.png) — BMI range comparison across target classes.
* **Unhealthy Days Comparison**: [health_days_comparison.png](figures/health_days_comparison.png) — Mental and physical unhealthy day comparisons.

---

## 5. Conclusions for Research Question 1 (RQ1)
1. **Primary Marginal Indicators**: General Health (`GenHlth`), High Blood Pressure (`HighBP`), High Cholesterol (`HighChol`), Difficulty Walking (`DiffWalk`), and Body Mass Index (`BMI`) demonstrate the highest effect sizes in the analyzed sample.
2. **Multiple Testing Control**: All key relationships remain statistically significant after Holm–Bonferroni correction, but their ranking is governed by standardized effect size.
"""
    
    output_path = DOCS_DIR / "statistical_analysis.md"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(markdown_content)
    print(f"Generated academic report at: {output_path}")

def main():
    print("=== Phase 2: Statistical Hypothesis Testing ===")
    
    try:
        df = load_data(DATA_PATH)
    except FileNotFoundError as e:
        print(e)
        return
        
    cat_results = perform_categorical_tests(df)
    num_results = perform_numerical_tests(df)
    
    apply_holm_bonferroni_corrections(cat_results, num_results)
    
    # Reload saved dataframes to get Holm-adjusted columns
    cat_results = pd.read_csv(RESULTS_DIR / "chi_square_results.csv")
    num_results = pd.read_csv(RESULTS_DIR / "numerical_results.csv")
    
    generate_visualizations(df, cat_results, num_results)
    write_academic_report(df, cat_results, num_results)
    print("=== Statistical Analysis Module Completed Successfully ===")

if __name__ == "__main__":
    main()
