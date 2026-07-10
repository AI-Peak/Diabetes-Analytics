# Python Analysis Module: Statistical Hypothesis Testing (RQ1)

This directory contains the Python implementation for answering **Research Question 1 (RQ1)**:
> *"Which demographic, lifestyle, and health-related factors are statistically associated with diabetes in the CDC BRFSS 2015 dataset?"*

This phase follows the CRISP-DM methodology, integrating statistical inference and exploratory analysis before machine learning modeling.

---

## 1. Mathematical and Statistical Background

To understand the relationships between health indicators and diabetes risk, we utilize several statistical hypothesis tests depending on the variable data types.

### 1.1 Chi-Square Test of Independence (Categorical Variables)
For binary and ordinal variables, we evaluate their association with `Diabetes_binary` using a contingency table. Let $O_{ij}$ be the observed frequency in row $i$ and column $j$, and $E_{ij}$ be the expected frequency under the null hypothesis of independence:

$$E_{ij} = \frac{\sum_{k} O_{ik} \cdot \sum_{k} O_{kj}}{N}$$

The Chi-Square statistic is calculated as:

$$\chi^2 = \sum_{i} \sum_{j} \frac{(O_{ij} - E_{ij})^2}{E_{ij}}$$

*   **Null Hypothesis ($H_0$)**: The indicator (e.g., `HighBP`) and diabetes status are independent.
*   **Alternative Hypothesis ($H_1$)**: The indicator and diabetes status are associated (not independent).

### 1.2 Cramér's V (Categorical Effect Size)
Because large sample sizes (*N* = 229,474) inflate the $\chi^2$ statistic and yield extremely small p-values (often $p < 0.05$ even for negligible associations), we compute **Cramér's V** to measure the practical strength of association:

$$V = \sqrt{\frac{\chi^2}{N \cdot (k - 1)}}$$

Where $N$ is the sample size, and $k = \min(r, c)$. In our case, the target `Diabetes_binary` has 2 classes ($r=2$), so $k - 1 = 1$, simplifying the formula to:

$$V = \sqrt{\frac{\chi^2}{N}}$$

**Cramér's V Interpretation Scale (for $df = 1$):**
*   $V < 0.05$: Negligible
*   $0.05 \le V < 0.10$: Weak / Very Small
*   $0.10 \le V < 0.20$: Small
*   $0.20 \le V < 0.30$: Moderate
*   $V \ge 0.30$: Strong

---

### 1.3 Independent Two-Sample t-Test (Welch's t-Test)
For continuous/numerical variables (`BMI`, `MentHlth`, `PhysHlth`), we compare the means of the healthy ($X_1$) and diabetic ($X_2$) groups. Since the group variances and sample sizes differ, we use Welch's t-test:

$$t = \frac{\bar{X}_1 - \bar{X}_2}{\sqrt{\frac{s_1^2}{n_1} + \frac{s_2^2}{n_2}}}$$

Where $\bar{X}_i$ is the sample mean, $s_i$ is the sample standard deviation, and $n_i$ is the group sample size.

### 1.4 Cohen's d (Parametric Effect Size)
Cohen's d measures the standardized difference between two means:

$$d = \frac{\bar{X}_1 - \bar{X}_2}{s_p}$$

Where the pooled standard deviation $s_p$ is defined as:

$$s_p = \sqrt{\frac{(n_1 - 1)s_1^2 + (n_2 - 1)s_2^2}{n_1 + n_2 - 2}}$$

**Cohen's d Interpretation Scale:**
*   $|d| < 0.2$: Negligible
*   $0.2 \le |d| < 0.5$: Small
*   $0.5 \le |d| < 0.8$: Medium
*   $|d| \ge 0.8$: Large

---

### 1.5 Mann-Whitney U Test (Non-Parametric Comparison)
Because `BMI`, `MentHlth`, and `PhysHlth` exhibit significant skewness and zero-inflation, parametric t-test assumptions are violated. The **Mann-Whitney U Test** is used as our primary test because it compares the distributions/ranks rather than means.

For sample 1 and sample 2, observations are combined and ranked. The U statistic for sample 1 is:

$$U_1 = R_1 - \frac{n_1(n_1 + 1)}{2}$$

Where $R_1$ is the sum of ranks for sample 1. 

### 1.6 Effect Sizes for Mann-Whitney U
1.  **Common Language Effect Size (CLES)**: The probability that a randomly selected individual from the diabetic group will have a higher value than a randomly selected individual from the healthy group:
    
    $$\text{CLES} = \frac{U_1}{n_1 \cdot n_2}$$
    
2.  **Rank-Biserial Correlation ($r_{rb}$)**: Quantifies the magnitude of the rank difference between $-1$ and $+1$:
    
    $$r_{rb} = 2 \cdot \text{CLES} - 1$$

---

## 2. File and Output Structure

Running the analysis script creates the following folder structure:

```text
Diabetes-Analytics/
│
├── python_analysis/
│   ├── statistical_analysis.py    <- Execution script
│   └── README.md                  <- This guide
│
├── results/
│   └── statistical_analysis/      <- Generated CSVs & PNGs
│       ├── chi_square_results.csv
│       ├── numerical_results.csv
│       ├── cramers_v_ranking.png
│       ├── top_categorical_prevalence.png
│       ├── bmi_boxplot.png
│       └── health_days_comparison.png
│
└── docs/
    └── statistical_analysis.md    <- Generated Academic Report
```

---

## 3. How to Run the Analysis

### 3.1 Prerequisites
Ensure that Python 3.10+ and the required packages are installed. You can install dependencies using:
```bash
pip install pandas numpy scipy matplotlib seaborn
```

Ensure the preprocessing has been run first, generating the cleaned file at `data/processed/diabetes_cleaned.csv`.

### 3.2 Execution
Run the statistical analysis script from the project root directory:
```powershell
python python_analysis/statistical_analysis.py
```

The script will automatically perform all tests, save results to the `results/` folder, plot the diagnostic graphs, and generate the formal academic report in `docs/statistical_analysis.md`.
