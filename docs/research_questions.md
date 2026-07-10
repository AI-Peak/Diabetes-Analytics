# Research Questions

The primary objective of this project is to investigate the relationships between health indicators and diabetes risk using interpretable machine learning techniques. To achieve this objective, the study is guided by the following research questions.

---

## Research Question 1

**Which demographic, lifestyle, and health-related factors are significantly associated with diabetes risk?**

This question aims to identify the relationships between individual health indicators and diabetes status. Exploratory Data Analysis (EDA) and statistical analysis are conducted to examine distributions, compare groups, and determine which variables show significant associations with diabetes. The findings provide evidence for understanding potential risk factors before predictive modeling.

---

## Research Question 2

**How accurately can machine learning models predict diabetes risk using the available health indicators?**

This question evaluates the predictive capability of several supervised machine learning algorithms. Different classification models are trained and compared using the same dataset and evaluation strategy. Their performance is assessed using multiple classification metrics to determine which model provides the most reliable predictions while maintaining generalization ability on unseen data.

---

## Research Question 3

**How can Explainable Artificial Intelligence help interpret the predictions of the best-performing machine learning model?**

While predictive performance is important, understanding the reasoning behind model predictions is equally essential in healthcare applications. This question investigates how Explainable Artificial Intelligence (XAI), specifically SHAP (SHapley Additive exPlanations), can be used to explain both global feature importance and individual prediction behavior. The resulting explanations improve model transparency and provide insights into how different health indicators contribute to diabetes risk.


---

## Mapping Between Research Questions and Project Stages

The following table summarizes how each research question is addressed throughout the analytical workflow.

| Research Question | Addressed By                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------ |
| **RQ1**           | Data Understanding → SQL Analysis → Exploratory Data Analysis (EDA) → Statistical Analysis |
| **RQ2**           | Feature Engineering → Machine Learning Modeling → Model Evaluation                         |
| **RQ3**           | SHAP Analysis → Explainable Artificial Intelligence (XAI) → Discussion and Interpretation  |
