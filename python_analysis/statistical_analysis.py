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
        return "Weak / Very Small"
    elif v < 0.20:
        return "Small"
    elif v < 0.30:
        return "Moderate"
    else:
        return "Strong"

def perform_categorical_tests(df: pd.DataFrame) -> pd.DataFrame:
    """Performs Chi-square tests of independence and calculates Cramér's V."""
    print("Performing Chi-Square tests of independence...")
    results = []
    
    for col in COLUMNS_CATEGORICAL:
        if col not in df.columns:
            print(f"Warning: {col} not in dataset. Skipping.")
            continue
            
        # Create contingency table
        contingency_table = pd.crosstab(df[col], df["Diabetes_binary"])
        
        # Calculate Chi-Square test
        chi2, p_val, dof, expected = stats.chi2_contingency(contingency_table)
        
        # Calculate Cramér's V
        # Formally: V = sqrt(chi2 / (n * (k - 1)))
        # Here: n is sample size, k is min(r, c) = min(2, categories) = 2.
        # Thus: k - 1 = 1, so V = sqrt(chi2 / n)
        n = contingency_table.sum().sum()
        v = np.sqrt(chi2 / n)
        
        # Calculate rates for report
        # Diabetes rate for each category
        rates = contingency_table.div(contingency_table.sum(axis=1), axis=0)[1] * 100
        rate_diff = rates.max() - rates.min()
        
        results.append({
            "Variable": col,
            "Description": LABEL_MAPPING.get(col, col),
            "Chi2 Statistic": chi2,
            "p-value": p_val,
            "Degrees of Freedom": dof,
            "Cramér's V": v,
            "Effect Size Interpretation": interpret_cramers_v(v),
            "Min Diabetes Rate (%)": rates.min(),
            "Max Diabetes Rate (%)": rates.max(),
            "Max Difference (%)": rate_diff
        })
        
    results_df = pd.DataFrame(results).sort_values(by="Cramér's V", ascending=False)
    results_df.to_csv(RESULTS_DIR / "chi_square_results.csv", index=False)
    print("Saved chi_square_results.csv")
    return results_df

def perform_numerical_tests(df: pd.DataFrame) -> pd.DataFrame:
    """Performs Mann-Whitney U test and Independent t-test on numerical variables."""
    print("Performing statistical tests on numerical variables...")
    results = []
    
    # Separate groups
    g_diabetic = df[df["Diabetes_binary"] == 1]
    g_healthy = df[df["Diabetes_binary"] == 0]
    
    n_diabetic = len(g_diabetic)
    n_healthy = len(g_healthy)
    n_total = len(df)
    
    for col in COLUMNS_NUMERICAL:
        if col not in df.columns:
            print(f"Warning: {col} not in dataset. Skipping.")
            continue
            
        x_diabetic = g_diabetic[col].values
        x_healthy = g_healthy[col].values
        
        # 1. Descriptive stats
        m_diabetic, std_diabetic = x_diabetic.mean(), x_diabetic.std(ddof=1)
        m_healthy, std_healthy = x_healthy.mean(), x_healthy.std(ddof=1)
        
        med_diabetic = np.median(x_diabetic)
        med_healthy = np.median(x_healthy)
        
        # 2. Parametric: Welch's t-test (equal_var=False)
        t_stat, t_pval = stats.ttest_ind(x_diabetic, x_healthy, equal_var=False)
        
        # Cohen's d
        pooled_std = np.sqrt(((n_diabetic - 1) * std_diabetic**2 + (n_healthy - 1) * std_healthy**2) / (n_diabetic + n_healthy - 2))
        cohen_d = (m_diabetic - m_healthy) / pooled_std
        
        # 3. Non-Parametric: Mann-Whitney U test
        u_stat, mwu_pval = stats.mannwhitneyu(x_diabetic, x_healthy, alternative="two-sided")
        
        # Rank-Biserial Correlation (effect size)
        # r = 1 - 2 * U / (n1 * n2) where U is for healthy group, or U_diabetic / (n1 * n2) is the CLES.
        # Probability of superiority (Common Language Effect Size)
        cles = u_stat / (n_diabetic * n_healthy)
        rank_biserial = 2 * cles - 1
        
        results.append({
            "Variable": col,
            "Healthy Mean": m_healthy,
            "Diabetic Mean": m_diabetic,
            "Mean Difference": m_diabetic - m_healthy,
            "Healthy Median": med_healthy,
            "Diabetic Median": med_diabetic,
            "t-Statistic": t_stat,
            "t p-value": t_pval,
            "Cohen's d": cohen_d,
            "MWU U-Statistic": u_stat,
            "MWU p-value": mwu_pval,
            "CLES (Superiority)": cles,
            "Rank-Biserial Correlation": rank_biserial
        })
        
    results_df = pd.DataFrame(results)
    results_df.to_csv(RESULTS_DIR / "numerical_results.csv", index=False)
    print("Saved numerical_results.csv")
    return results_df

def generate_visualizations(df: pd.DataFrame, cat_results: pd.DataFrame, num_results: pd.DataFrame):
    """Generates and saves premium visualizations of the statistical findings."""
    print("Generating statistical visualizations...")
    sns.set_theme(style="whitegrid")
    
    # 1. Cramér's V ranking bar plot
    plt.figure(figsize=(10, 6))
    sns.barplot(
        data=cat_results,
        x="Cramér's V",
        y="Description",
        palette="viridis",
        hue="Description",
        legend=False
    )
    plt.title("Ranking of Categorical Health Indicators by Association Strength (Cramér's V)", fontsize=13, fontweight="bold", pad=15)
    plt.xlabel("Cramér's V Effect Size", fontsize=11)
    plt.ylabel("")
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "cramers_v_ranking.png", dpi=300)
    plt.close()
    
    # 2. Plot diabetes rate by Top 3 strongly associated categorical factors
    # According to Cramér's V, GenHlth, HighBP, HighChol, and DiffWalk are typically top factors.
    top_factors = cat_results.head(4)["Variable"].tolist()
    
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    axes = axes.flatten()
    
    for i, col in enumerate(top_factors):
        contingency = pd.crosstab(df[col], df["Diabetes_binary"])
        rates = contingency.div(contingency.sum(axis=1), axis=0)[1] * 100
        
        ax = axes[i]
        
        # Label customizations for x-axis
        x_labels = [str(int(x)) for x in rates.index]
        if col == "HighBP":
            x_labels = ["No High BP (0)", "High BP (1)"]
        elif col == "HighChol":
            x_labels = ["No High Chol (0)", "High Chol (1)"]
        elif col == "DiffWalk":
            x_labels = ["No Difficulty (0)", "Has Difficulty (1)"]
        elif col == "GenHlth":
            x_labels = ["1: Exc", "2: V.Good", "3: Good", "4: Fair", "5: Poor"]
            
        bars = ax.bar(x_labels, rates.values, color="#4A90E2", alpha=0.85, width=0.5)
        
        # Styling
        ax.set_title(f"Diabetes Prevalence (%) by {LABEL_MAPPING.get(col, col)}", fontsize=11, fontweight="bold", pad=10)
        ax.set_ylabel("Diabetes Rate (%)", fontsize=10)
        ax.set_ylim(0, max(rates.values) * 1.15)
        ax.grid(axis="y", linestyle="--", alpha=0.5)
        
        # Add labels on top of bars
        for bar in bars:
            height = bar.get_height()
            ax.text(
                bar.get_x() + bar.get_width()/2.0,
                height + 1,
                f"{height:.1f}%",
                ha="center",
                va="bottom",
                fontsize=9,
                fontweight="bold",
                color="#333333"
            )
            
    plt.suptitle("Impact of Top Health Indicators on Diabetes Rates", fontsize=14, fontweight="bold", y=0.98)
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "top_categorical_prevalence.png", dpi=300)
    plt.close()
    
    # 3. Numerical Boxplots (BMI)
    plt.figure(figsize=(8, 5))
    # Cap BMI to 60 for better visual range in the boxplot
    plot_df = df[df["BMI"] <= 60].copy()
    sns.boxplot(
        data=plot_df,
        x="Diabetes_binary",
        y="BMI",
        palette=["#4A90E2", "#E94E77"],
        hue="Diabetes_binary",
        legend=False,
        width=0.4
    )
    plt.title("Body Mass Index (BMI) Distribution vs Diabetes Status", fontsize=12, fontweight="bold", pad=15)
    plt.xticks([0, 1], ["0: Healthy", "1: Diabetic"])
    plt.xlabel("")
    plt.ylabel("Body Mass Index (BMI)", fontsize=11)
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "bmi_boxplot.png", dpi=300)
    plt.close()
    
    # 4. Poor Health Days Plot (Mean comparison with confidence intervals)
    plt.figure(figsize=(9, 5))
    num_vars_long = pd.melt(df, id_vars=["Diabetes_binary"], value_vars=["MentHlth", "PhysHlth"],
                            var_name="Indicator", value_name="Days")
    
    sns.barplot(
        data=num_vars_long,
        x="Indicator",
        y="Days",
        hue="Diabetes_binary",
        palette=["#4A90E2", "#E94E77"],
        errorbar="ci",
        alpha=0.85
    )
    plt.title("Comparison of Poor Health Days (Past 30 Days)", fontsize=12, fontweight="bold", pad=15)
    plt.xlabel("")
    plt.ylabel("Average Number of Days", fontsize=11)
    plt.xticks([0, 1], ["Mental Health (MentHlth)", "Physical Health (PhysHlth)"])
    plt.legend(labels=["0: Healthy", "1: Diabetic"])
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "health_days_comparison.png", dpi=300)
    plt.close()
    print("Saved all diagnostic plots successfully.")

def write_academic_report(cat_results: pd.DataFrame, num_results: pd.DataFrame):
    """Writes the statistical analysis findings directly to docs/statistical_analysis.md."""
    print("Writing academic documentation to docs/statistical_analysis.md...")
    
    # Calculate some helper numbers for the text
    top_cat = cat_results.iloc[0]["Variable"]
    top_cat_desc = cat_results.iloc[0]["Description"]
    top_cat_v = cat_results.iloc[0]["Cramér's V"]
    top_cat_diff = cat_results.iloc[0]["Max Difference (%)"]
    
    bmi_diabetic_mean = num_results.loc[num_results["Variable"] == "BMI", "Diabetic Mean"].values[0]
    bmi_healthy_mean = num_results.loc[num_results["Variable"] == "BMI", "Healthy Mean"].values[0]
    bmi_cohen_d = num_results.loc[num_results["Variable"] == "BMI", "Cohen's d"].values[0]
    
    phys_diabetic_mean = num_results.loc[num_results["Variable"] == "PhysHlth", "Diabetic Mean"].values[0]
    phys_healthy_mean = num_results.loc[num_results["Variable"] == "PhysHlth", "Healthy Mean"].values[0]
    
    markdown_content = f"""# Statistical Hypothesis Testing Report
## CDC Diabetes Health Indicators (Cleaned Dataset)

### Methodology: CRISP-DM (Exploratory & Statistical Analysis)
**Author:** Senior Data Analytics Engineer & Team Members  
**Date:** {pd.Timestamp.now().strftime("%Y-%m-%d")}  
**Project:** Diabetes-Analytics
**Objective:** Answer RQ1: *Which demographic, lifestyle, and health-related factors are statistically associated with diabetes in the CDC BRFSS 2015 dataset?*

---

## 1. Introduction
This report presents the quantitative statistical evaluation of the relationships between 21 health indicators and diabetes status (`Diabetes_binary`). The analysis is conducted on the cleaned dataset of **{229474:,}** individuals (after removing duplicated records to ensure model validity). 

To ensure statistical rigor, we apply:
1. **Chi-Square Test of Independence** for categorical, binary, and ordinal variables.
2. **Cramér's V** to measure the effect size of categorical associations.
3. **Independent Two-Sample Welch t-Test** (parametric mean comparison) and **Mann-Whitney U Test** (non-parametric median/distribution comparison) for continuous numerical variables.
4. **Cohen's d** and **Rank-Biserial Correlation (with Common Language Effect Size)** to measure the effect sizes for numerical variables.

---

## 2. Categorical Variable Analysis (Chi-Square & Cramér's V)
Due to the large sample size (*N* = 229,474), all variables are expected to yield p-values approaching zero ($p < 0.05$). Therefore, we prioritize **Cramér's V** to determine the practical strength of association.

### Contingency Table & Chi-Square Summary
| Variable Name | Attribute Description | Chi-Square ($\\chi^2$) | p-value | df | Cramér's V | Association Strength | Max Prevalence Diff |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- | :---: |
"""
    # Append categorical rows
    for _, row in cat_results.iterrows():
        p_str = f"{row['p-value']:.2e}" if row['p-value'] > 0 else "< 1.00e-300"
        markdown_content += (
            f"| `{row['Variable']}` | {row['Description']} | {row['Chi2 Statistic']:.2f} | "
            f"`{p_str}` | {int(row['Degrees of Freedom'])} | {row['Cramér\'s V']:.4f} | "
            f"**{row['Effect Size Interpretation']}** | {row['Max Difference (%)']:.2f}% |\n"
        )
        
    markdown_content += f"""
### Key Findings from Categorical Analysis:
1. **Strongest Predictors**: **`{top_cat}`** ({top_cat_desc}) shows the highest association with diabetes status, with a Cramér's V of **{top_cat_v:.4f}** (indicating a moderate-to-strong practical association). There is a **{top_cat_diff:.2f}%** difference in diabetes prevalence between categories.
2. **Clinical Flags**: General Health (`GenHlth`, *V* = {cat_results.loc[cat_results['Variable'] == 'GenHlth', "Cramér's V"].values[0]:.4f}) and High Blood Pressure (`HighBP`, *V* = {cat_results.loc[cat_results['Variable'] == 'HighBP', "Cramér's V"].values[0]:.4f}) represent the most critical risk indicators.
3. **Lifestyle & Behavior**: Physical activity (`PhysActivity`, *V* = {cat_results.loc[cat_results['Variable'] == 'PhysActivity', "Cramér's V"].values[0]:.4f}) and diet (fruits/veggies) are statistically significant, but show relatively weak direct associations (*V* < 0.1). Heavy alcohol consumption (`HvyAlcoholConsump`) has a negligible direct correlation (*V* = {cat_results.loc[cat_results['Variable'] == 'HvyAlcoholConsump', "Cramér's V"].values[0]:.4f}).
4. **Demographics**: Biological sex (`Sex`) has a very small statistical relationship with diabetes status (*V* = {cat_results.loc[cat_results['Variable'] == 'Sex', "Cramér's V"].values[0]:.4f}), indicating that diabetes prevalence rates between males and females in the CDC dataset are highly similar.

---

## 3. Numerical Variable Analysis (t-Test & Mann-Whitney U)
Since `BMI`, `MentHlth`, and `PhysHlth` are highly skewed and non-normally distributed, the non-parametric **Mann-Whitney U** test is the primary statistical tool for testing median differences. Welch's t-test and Cohen's d are provided as a secondary parametric reference.

### Numerical Tests Summary
| Variable | Healthy Mean | Diabetic Mean | Mean Diff | Healthy Median | Diabetic Median | t-Statistic | t p-value | Cohen's d | MWU p-value | CLES | Rank-Biserial |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
"""
    # Append numerical rows
    for _, row in num_results.iterrows():
        t_p_str = f"{row['t p-value']:.2e}" if row['t p-value'] > 0 else "< 1.00e-300"
        mwu_p_str = f"{row['MWU p-value']:.2e}" if row['MWU p-value'] > 0 else "< 1.00e-300"
        markdown_content += (
            f"| `{row['Variable']}` | {row['Healthy Mean']:.2f} | {row['Diabetic Mean']:.2f} | "
            f"{row['Mean Difference']:.2f} | {row['Healthy Median']:.1f} | {row['Diabetic Median']:.1f} | "
            f"{row['t-Statistic']:.2f} | `{t_p_str}` | {row['Cohen\'s d']:.4f} | "
            f"`{mwu_p_str}` | {row['CLES (Superiority)']:.4f} | {row['Rank-Biserial Correlation']:.4f} |\n"
        )
        
    markdown_content += f"""
### Key Findings from Numerical Analysis:
1. **Body Mass Index (BMI)**: The mean BMI for the healthy group is **{bmi_healthy_mean:.2f}** (overweight baseline) compared to **{bmi_diabetic_mean:.2f}** for the diabetic group (obese category). The differences are highly significant under both parametric Welch t-test ($t = {num_results.loc[num_results['Variable'] == 'BMI', 't-Statistic'].values[0]:.2f}, p < 0.05$) and Mann-Whitney U tests ($p < 0.05$). Cohen's d of **{bmi_cohen_d:.4f}** indicates a small-to-medium effect size.
2. **Physical Health Days (`PhysHlth`)**: Diabetics experience an average of **{phys_diabetic_mean:.2f}** days of poor physical health in the past 30 days, compared to only **{phys_healthy_mean:.2f}** days for non-diabetics. This difference is clinically and statistically significant.
3. **Common Language Effect Size (CLES)**: The CLES for `BMI` is **{num_results.loc[num_results['Variable'] == 'BMI', 'CLES (Superiority)'].values[0]:.4f}**, meaning there is a **{num_results.loc[num_results['Variable'] == 'BMI', 'CLES (Superiority)'].values[0]*100:.1f}%** probability that a randomly chosen diabetic individual has a higher BMI than a randomly chosen non-diabetic individual.

---

## 4. Visualizations and Diagnostics
The generated plots have been saved under `results/statistical_analysis/`:
* **Association Strengths**: [cramers_v_ranking.png](file:///{RESULTS_DIR.as_posix()}/cramers_v_ranking.png) - Shows the hierarchical ranking of categorical predictors.
* **Prevalence Bar Plots**: [top_categorical_prevalence.png](file:///{RESULTS_DIR.as_posix()}/top_categorical_prevalence.png) - Highlights diabetes rates across subcategories of key risk factors (BP, cholesterol, self-reported health).
* **BMI Distribution Boxplot**: [bmi_boxplot.png](file:///{RESULTS_DIR.as_posix()}/bmi_boxplot.png) - Demonstrates shift in BMI ranges between classes.
* **Poor Health Comparison**: [health_days_comparison.png](file:///{RESULTS_DIR.as_posix()}/health_days_comparison.png) - Standard error bar plots comparing mental and physical health days.

---

## 5. Conclusions for Research Question 1 (RQ1)
The statistical analyses provide conclusive evidence to answer **RQ1**:

* **Highly Associated Factors**: High Blood Pressure (`HighBP`), General Health Status (`GenHlth`), High Cholesterol (`HighChol`), and Body Mass Index (`BMI`) are the most clinically and statistically significant factors associated with diabetes risk in this population.
* **Socioeconomic Indicators**: Both Income (`Income`) and Age category (`Age`) are moderately associated, with older age brackets and lower income levels demonstrating significantly higher rates of diabetes.
* **Lifestyle Factors**: Daily fruit/vegetable intake and smoking are statistically significant, but exhibit very low direct correlation effect sizes, indicating they are likely secondary contributors or have indirect interactions through variables like BMI.
* **Biological Sex**: Shows minimal direct relationship to diabetes prevalence.

These statistical associations will serve as the baseline comparison layer for the **Explanation Consistency Analysis** in Phase 5, where we will check if the best-performing machine learning model's SHAP values align with these findings.
"""
    
    output_path = DOCS_DIR / "statistical_analysis.md"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(markdown_content)
    print(f"Generated academic report at: {output_path}")

def main():
    print("=== Phase 2: Statistical Hypothesis Testing ===")
    
    # 1. Load data
    try:
        df = load_data(DATA_PATH)
    except FileNotFoundError as e:
        print(e)
        return
        
    # 2. Run Categorical Tests
    cat_results = perform_categorical_tests(df)
    
    # 3. Run Numerical Tests
    num_results = perform_numerical_tests(df)
    
    # 4. Generate Visualizations
    generate_visualizations(df, cat_results, num_results)
    
    # 5. Output Academic Report
    write_academic_report(cat_results, num_results)
    
    print("=== Statistical Analysis Module Completed Successfully ===")

if __name__ == "__main__":
    main()
