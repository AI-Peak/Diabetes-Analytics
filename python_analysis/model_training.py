"""
Machine Learning Modeling & Model Selection Module (RQ2)
-----------------------------------------------------------
Author: Senior Data Analytics Engineer / Team Members
Methodology: CRISP-DM
Dataset: CDC Diabetes Health Indicators (Cleaned)

This script performs the machine learning modeling phase (Phase 4) to answer RQ2:
"Which machine learning model provides the most reliable prediction performance on the original imbalanced BRFSS dataset?"

Rigorously adheres to:
1. Strict 80/20 Stratified Split into Development set and untouched Holdout Test set.
2. 5-fold Stratified Cross-Validation on Development set ONLY for Model Selection.
3. Out-Of-Fold (OOF) probability evaluation on Development set ONLY for Threshold Selection.
4. Model-specific pipelines (Logistic Regression uses ColumnTransformer with StandardScaler for continuous,
   OneHotEncoder for ordinal; Tree-based models use raw features without scaling).
5. Final Evaluation performed EXACTLY ONCE on untouched Holdout Test set after locking model and threshold.

All outputs are saved in results/modeling/.
"""

import json
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.model_selection import train_test_split, StratifiedKFold
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, roc_curve, precision_recall_curve,
    confusion_matrix, classification_report
)

# Define directory paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "processed" / "diabetes_cleaned.csv"
RESULTS_DIR = BASE_DIR / "results" / "modeling"
DOCS_FIG_DIR = BASE_DIR / "docs" / "figures"

# Ensure directories exist
RESULTS_DIR.mkdir(parents=True, exist_ok=True)
DOCS_FIG_DIR.mkdir(parents=True, exist_ok=True)

# Feature Grouping based on CDC Codebook
BINARY_FEATURES = [
    "HighBP", "HighChol", "CholCheck", "Smoker", "Stroke",
    "HeartDiseaseorAttack", "PhysActivity", "Fruits", "Veggies",
    "HvyAlcoholConsump", "AnyHealthcare", "NoDocbcCost", "DiffWalk", "Sex"
]

ORDINAL_FEATURES = [
    "GenHlth", "Age", "Education", "Income"
]

NUMERIC_FEATURES = [
    "BMI", "MentHlth", "PhysHlth"
]

def load_data(file_path: Path) -> pd.DataFrame:
    """Loads the cleaned dataset."""
    print(f"Loading cleaned dataset from: {file_path}")
    if not file_path.exists():
        raise FileNotFoundError(f"Cleaned dataset not found at {file_path}. Run preprocessing first.")
    df = pd.read_csv(file_path)
    return df

def build_model_pipelines():
    """Builds model-specific scikit-learn Pipelines to avoid data leakage during CV."""
    # Preprocessor for Logistic Regression: Scale numeric, One-Hot Encode ordinal, Passthrough binary
    lr_preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERIC_FEATURES),
            ("bin", "passthrough", BINARY_FEATURES),
            ("ord", OneHotEncoder(handle_unknown="ignore", drop="first"), ORDINAL_FEATURES)
        ]
    )
    
    pipelines = {
        "Logistic Regression": Pipeline([
            ("preprocessor", lr_preprocessor),
            ("classifier", LogisticRegression(max_iter=1000, random_state=42))
        ]),
        "Decision Tree": Pipeline([
            ("classifier", DecisionTreeClassifier(max_depth=8, random_state=42))
        ]),
        "Random Forest": Pipeline([
            ("classifier", RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1))
        ]),
        "XGBoost": Pipeline([
            ("classifier", XGBClassifier(
                n_estimators=100,
                max_depth=6,
                learning_rate=0.1,
                random_state=42,
                eval_metric="logloss",
                n_jobs=-1
            ))
        ])
    }
    return pipelines

def perform_cross_validation(X_dev, y_dev):
    """Executes 5-Fold Stratified Cross-Validation on Development Set only."""
    print("\n--- Phase 4.1: 5-Fold Stratified CV on Development Set ---")
    print(f"Development Set Size: {len(X_dev):,} samples")
    
    skf = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    pipelines = build_model_pipelines()
    
    cv_results = {}
    oof_predictions = {}
    
    for name, pipeline in pipelines.items():
        print(f"Evaluating {name} with 5-fold CV...")
        fold_metrics = []
        oof_probs = np.zeros(len(X_dev))
        
        for fold, (train_idx, val_idx) in enumerate(skf.split(X_dev, y_dev), 1):
            X_tr, y_tr = X_dev.iloc[train_idx], y_dev.iloc[train_idx]
            X_val, y_val = X_dev.iloc[val_idx], y_dev.iloc[val_idx]
            
            # Fit pipeline on fold train
            pipeline.fit(X_tr, y_tr)
            
            # Predict on fold val
            y_pred_val = pipeline.predict(X_val)
            y_prob_val = pipeline.predict_proba(X_val)[:, 1]
            
            oof_probs[val_idx] = y_prob_val
            
            acc = accuracy_score(y_val, y_pred_val)
            prec = precision_score(y_val, y_pred_val, zero_division=0)
            rec = recall_score(y_val, y_pred_val, zero_division=0)
            f1 = f1_score(y_val, y_pred_val, zero_division=0)
            roc_auc = roc_auc_score(y_val, y_prob_val)
            pr_auc = average_precision_score(y_val, y_prob_val)
            
            fold_metrics.append({
                "Fold": fold,
                "Accuracy": acc,
                "Precision": prec,
                "Recall": rec,
                "F1-score": f1,
                "ROC-AUC": roc_auc,
                "PR-AUC": pr_auc
            })
            
        df_folds = pd.DataFrame(fold_metrics)
        oof_predictions[name] = oof_probs
        
        # Calculate pooled OOF metrics
        pooled_roc_auc = roc_auc_score(y_dev, oof_probs)
        pooled_pr_auc = average_precision_score(y_dev, oof_probs)
        
        cv_results[name] = {
            "Model": name,
            "Mean_Accuracy": df_folds["Accuracy"].mean(),
            "Std_Accuracy": df_folds["Accuracy"].std(),
            "Mean_Precision": df_folds["Precision"].mean(),
            "Std_Precision": df_folds["Precision"].std(),
            "Mean_Recall": df_folds["Recall"].mean(),
            "Std_Recall": df_folds["Recall"].std(),
            "Mean_F1": df_folds["F1-score"].mean(),
            "Std_F1": df_folds["F1-score"].std(),
            "Mean_ROC_AUC": df_folds["ROC-AUC"].mean(),
            "Std_ROC_AUC": df_folds["ROC-AUC"].std(),
            "Mean_PR_AUC": df_folds["PR-AUC"].mean(),
            "Std_PR_AUC": df_folds["PR-AUC"].std(),
            "Pooled_ROC_AUC": pooled_roc_auc,
            "Pooled_PR_AUC": pooled_pr_auc,
            "Fold_Details": df_folds
        }
        
        print(f"  -> {name}: Mean PR-AUC = {cv_results[name]['Mean_PR_AUC']:.4f} (±{cv_results[name]['Std_PR_AUC']:.4f}), Mean ROC-AUC = {cv_results[name]['Mean_ROC_AUC']:.4f}")
        
    return cv_results, oof_predictions

def select_best_model(cv_results):
    """Selects the best model based on primary criterion: mean cross-validated PR-AUC."""
    sorted_models = sorted(
        cv_results.values(),
        key=lambda x: (x["Mean_PR_AUC"], x["Mean_ROC_AUC"], -x["Std_PR_AUC"]),
        reverse=True
    )
    best_model_name = sorted_models[0]["Model"]
    
    print("\n--- Model Selection Decision ---")
    print(f"Model selection source: 5-fold stratified cross-validation on development set")
    print(f"Holdout test used for selection: No")
    print(f"Selected Best Model: {best_model_name}")
    print(f"Selection Rule: Primary = Mean CV PR-AUC ({sorted_models[0]['Mean_PR_AUC']:.4f}), Tie-break = Mean CV ROC-AUC ({sorted_models[0]['Mean_ROC_AUC']:.4f})")
    
    return best_model_name

def select_threshold_from_oof(y_dev, oof_probs, best_model_name, target_recall=0.80):
    """Selects operating threshold using OOF Development predictions ONLY."""
    print("\n--- Phase 4.2: Development OOF Threshold Optimization ---")
    
    thresholds = np.arange(0.01, 1.00, 0.01)
    results = []
    
    for t in thresholds:
        y_pred_t = (oof_probs >= t).astype(int)
        acc = accuracy_score(y_dev, y_pred_t)
        prec = precision_score(y_dev, y_pred_t, zero_division=0)
        rec = recall_score(y_dev, y_pred_t, zero_division=0)
        f1 = f1_score(y_dev, y_pred_t, zero_division=0)
        tn, fp, fn, tp = confusion_matrix(y_dev, y_pred_t).ravel()
        
        results.append({
            "Threshold": round(t, 2),
            "Accuracy": acc,
            "Precision": prec,
            "Recall": rec,
            "F1-score": f1,
            "True Positives": tp,
            "False Negatives": fn,
            "False Positives": fp,
            "True Negatives": tn,
            "Evaluation_Split": "Development OOF"
        })
        
    df_thresh = pd.DataFrame(results)
    
    # Selection logic: Recall >= 0.80 -> Maximize Precision -> Tie-break Max F1 -> Higher Threshold
    valid_candidates = df_thresh[df_thresh["Recall"] >= target_recall]
    
    if not valid_candidates.empty:
        max_prec = valid_candidates["Precision"].max()
        prec_candidates = valid_candidates[valid_candidates["Precision"] == max_prec]
        max_f1 = prec_candidates["F1-score"].max()
        final_candidates = prec_candidates[prec_candidates["F1-score"] == max_f1]
        selected_row = final_candidates.iloc[-1]
        selection_rule = f"Recall >= {target_recall} satisfied. Selected max Precision ({selected_row['Precision']:.4f}), max F1 ({selected_row['F1-score']:.4f})."
    else:
        max_rec = df_thresh["Recall"].max()
        rec_candidates = df_thresh[df_thresh["Recall"] == max_rec]
        selected_row = rec_candidates.sort_values(by=["F1-score", "Precision", "Threshold"], ascending=False).iloc[0]
        selection_rule = f"No threshold reached Recall >= {target_recall}. Selected threshold with highest Recall ({selected_row['Recall']:.4f})."
        
    selected_threshold = float(selected_row["Threshold"])
    
    print(f"Selected Threshold: {selected_threshold:.2f}")
    print(f"OOF Metrics at selected threshold ({selected_threshold:.2f}):")
    print(f"  Recall: {selected_row['Recall']:.4f}, Precision: {selected_row['Precision']:.4f}, F1: {selected_row['F1-score']:.4f}, Accuracy: {selected_row['Accuracy']:.4f}")
    print(f"Selection Reason: {selection_rule}")
    
    df_thresh.to_csv(RESULTS_DIR / "threshold_analysis.csv", index=False)
    return selected_threshold, selection_rule, df_thresh

def evaluate_final_holdout(best_model_name, selected_threshold, X_dev, y_dev, X_test, y_test):
    """Fits final model on FULL development set and evaluates ONCE on untouched Holdout Test set."""
    print("\n--- Phase 4.3: Final Evaluation on Untouched Holdout Test Set ---")
    print("Holdout test used for model selection: No")
    print("Holdout test used for threshold selection: No")
    print("Final test evaluation performed after selection lock: Yes")
    
    pipelines = build_model_pipelines()
    final_pipeline = pipelines[best_model_name]
    
    # Fit on entire development set
    final_pipeline.fit(X_dev, y_dev)
    
    # Predict ONCE on untouched holdout test set
    y_test_pred_default = final_pipeline.predict(X_test)
    y_test_prob = final_pipeline.predict_proba(X_test)[:, 1]
    y_test_pred_selected = (y_test_prob >= selected_threshold).astype(int)
    
    def compute_metrics(y_true, y_pred, y_prob):
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
        spec = tn / (tn + fp) if (tn + fp) > 0 else 0.0
        return {
            "Accuracy": accuracy_score(y_true, y_pred),
            "Precision": precision_score(y_true, y_pred, zero_division=0),
            "Recall": recall_score(y_true, y_pred, zero_division=0),
            "Specificity": spec,
            "F1-score": f1_score(y_true, y_pred, zero_division=0),
            "ROC-AUC": roc_auc_score(y_true, y_prob),
            "PR-AUC": average_precision_score(y_true, y_prob),
            "TP": tp, "FP": fp, "TN": tn, "FN": fn
        }
        
    m_default = compute_metrics(y_test, y_test_pred_default, y_test_prob)
    m_selected = compute_metrics(y_test, y_test_pred_selected, y_test_prob)
    
    # Compute 95% Bootstrap Confidence Intervals for key test metrics
    print("\nCalculating 95% Stratified Bootstrap Confidence Intervals on Holdout Test...")
    np.random.seed(42)
    n_boot = 1000
    boot_records = []
    
    test_indices = np.arange(len(y_test))
    y_test_arr = y_test.values
    
    for b in range(n_boot):
        # Stratified resampling
        idx_0 = np.where(y_test_arr == 0)[0]
        idx_1 = np.where(y_test_arr == 1)[0]
        boot_idx_0 = np.random.choice(idx_0, size=len(idx_0), replace=True)
        boot_idx_1 = np.random.choice(idx_1, size=len(idx_1), replace=True)
        boot_idx = np.concatenate([boot_idx_0, boot_idx_1])
        
        y_b = y_test_arr[boot_idx]
        p_b = y_test_prob[boot_idx]
        pred_sel_b = (p_b >= selected_threshold).astype(int)
        
        boot_records.append({
            "ROC-AUC": roc_auc_score(y_b, p_b),
            "PR-AUC": average_precision_score(y_b, p_b),
            "Recall": recall_score(y_b, pred_sel_b, zero_division=0),
            "Precision": precision_score(y_b, pred_sel_b, zero_division=0),
            "F1-score": f1_score(y_b, pred_sel_b, zero_division=0)
        })
        
    df_boot = pd.DataFrame(boot_records)
    ci_results = {}
    for col in df_boot.columns:
        ci_lower = np.percentile(df_boot[col], 2.5)
        ci_upper = np.percentile(df_boot[col], 97.5)
        ci_results[col] = (round(ci_lower, 4), round(ci_upper, 4))
        print(f"  Final Test {col} (at threshold {selected_threshold:.2f}): {m_selected[col]:.4f} (95% CI: [{ci_lower:.4f}, {ci_upper:.4f}])")
        
    # Build final test metrics table
    test_metrics_df = pd.DataFrame([
        {
            "Operating_Threshold_Label": "Default Threshold (0.50)",
            "Threshold": 0.50,
            "Evaluation_Split": "Final Holdout Test",
            "Accuracy": m_default["Accuracy"],
            "Precision": m_default["Precision"],
            "Recall": m_default["Recall"],
            "Specificity": m_default["Specificity"],
            "F1-score": m_default["F1-score"],
            "ROC-AUC": m_default["ROC-AUC"],
            "PR-AUC": m_default["PR-AUC"],
            "TP": m_default["TP"], "FP": m_default["FP"], "TN": m_default["TN"], "FN": m_default["FN"]
        },
        {
            "Operating_Threshold_Label": f"Validation-Selected Threshold ({selected_threshold:.2f})",
            "Threshold": selected_threshold,
            "Evaluation_Split": "Final Holdout Test",
            "Accuracy": m_selected["Accuracy"],
            "Precision": m_selected["Precision"],
            "Recall": m_selected["Recall"],
            "Specificity": m_selected["Specificity"],
            "F1-score": m_selected["F1-score"],
            "ROC-AUC": m_selected["ROC-AUC"],
            "PR-AUC": m_selected["PR-AUC"],
            "TP": m_selected["TP"], "FP": m_selected["FP"], "TN": m_selected["TN"], "FN": m_selected["FN"]
        }
    ])
    
    test_metrics_df.to_csv(RESULTS_DIR / "final_test_metrics.csv", index=False)
    
    # Save fitted final pipeline artifact
    joblib.dump(final_pipeline, RESULTS_DIR / "final_model.joblib")
    print(f"Saved final pipeline model to {RESULTS_DIR / 'final_model.joblib'}")
    
    fn_reduced = m_default["FN"] - m_selected["FN"]
    fn_reduction_pct = (fn_reduced / m_default["FN"]) * 100 if m_default["FN"] > 0 else 0
    fp_added = m_selected["FP"] - m_default["FP"]
    
    print("\n--- Final Screening Operational Trade-off Summary ---")
    print(f"False Negatives at 0.50: {m_default['FN']:,} -> at {selected_threshold:.2f}: {m_selected['FN']:,} (Reduced by {fn_reduced:,} or {fn_reduction_pct:.2f}%)")
    print(f"False Positives at 0.50: {m_default['FP']:,} -> at {selected_threshold:.2f}: {m_selected['FP']:,} (Increased by {fp_added:,})")
    
    return final_pipeline, m_default, m_selected, ci_results, test_metrics_df

def generate_modeling_plots(cv_results, best_model_name, selected_threshold, X_dev, y_dev, X_test, y_test, final_pipeline):
    """Generates rigorous scientific figures for model selection, ROC/PR curves, and threshold analysis."""
    print("\n--- Phase 4.4: Generating Modeling Visualizations ---")
    sns.set_theme(style="whitegrid")
    
    # Figure 1: Cross-Validation Model Comparison (Point-Range Plot)
    cv_rows = []
    for name, res in cv_results.items():
        cv_rows.append({
            "Model": name,
            "Mean_PR_AUC": res["Mean_PR_AUC"],
            "Std_PR_AUC": res["Std_PR_AUC"],
            "Mean_ROC_AUC": res["Mean_ROC_AUC"],
            "Std_ROC_AUC": res["Std_ROC_AUC"]
        })
    df_cv = pd.DataFrame(cv_rows).sort_values(by="Mean_PR_AUC", ascending=True)
    
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))
    y_pos = np.arange(len(df_cv))
    
    # Panel A: Mean CV PR-AUC
    ax = axes[0]
    for i, (y, (_, row)) in enumerate(zip(y_pos, df_cv.iterrows())):
        is_best = (row["Model"] == best_model_name)
        color = "#2563EB" if is_best else "#64748B"
        ax.errorbar(row["Mean_PR_AUC"], y, xerr=row["Std_PR_AUC"]*1.96, fmt="o", color=color, ecolor=color, elinewidth=2, capsize=4, markersize=8)
        ax.text(row["Mean_PR_AUC"] + 0.005, y, f"{row['Mean_PR_AUC']:.4f}", va="center", ha="left", fontsize=9, fontweight="bold" if is_best else "normal", color=color)
    ax.set_yticks(y_pos)
    ax.set_yticklabels(df_cv["Model"], fontsize=10, fontweight="bold")
    ax.set_xlabel("Mean 5-Fold CV PR-AUC (Primary Criterion)", fontsize=10, fontweight="bold")
    ax.set_title("Panel A: Cross-Validated PR-AUC (95% Fold Variability)", fontsize=11, fontweight="bold")
    
    # Panel B: Mean CV ROC-AUC
    ax = axes[1]
    for i, (y, (_, row)) in enumerate(zip(y_pos, df_cv.iterrows())):
        is_best = (row["Model"] == best_model_name)
        color = "#2563EB" if is_best else "#64748B"
        ax.errorbar(row["Mean_ROC_AUC"], y, xerr=row["Std_ROC_AUC"]*1.96, fmt="o", color=color, ecolor=color, elinewidth=2, capsize=4, markersize=8)
        ax.text(row["Mean_ROC_AUC"] + 0.002, y, f"{row['Mean_ROC_AUC']:.4f}", va="center", ha="left", fontsize=9, fontweight="bold" if is_best else "normal", color=color)
    ax.set_yticks(y_pos)
    ax.set_yticklabels([""]*len(df_cv))
    ax.set_xlabel("Mean 5-Fold CV ROC-AUC", fontsize=10, fontweight="bold")
    ax.set_title("Panel B: Cross-Validated ROC-AUC", fontsize=11, fontweight="bold")
    
    plt.suptitle("Model Selection Evaluation (5-Fold Stratified CV on Development Set, N = 202,944)", fontsize=13, fontweight="bold", y=1.02)
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "metrics_comparison.png", dpi=300, bbox_inches="tight")
    plt.savefig(DOCS_FIG_DIR / "model_performance_curves.png", dpi=300, bbox_inches="tight")
    plt.savefig(DOCS_FIG_DIR / "model_performance_curves.svg", format="svg", bbox_inches="tight")
    plt.close()
    
    # Also save model_comparison.csv for backward compatibility
    df_cv_export = pd.DataFrame([
        {
            "Model": k,
            "Accuracy": v["Mean_Accuracy"],
            "Precision": v["Mean_Precision"],
            "Recall": v["Mean_Recall"],
            "F1-score": v["Mean_F1"],
            "ROC-AUC": v["Mean_ROC_AUC"],
            "PR-AUC": v["Mean_PR_AUC"],
            "Evaluation_Split": "5-Fold CV Development"
        } for k, v in cv_results.items()
    ])
    df_cv_export.to_csv(RESULTS_DIR / "model_comparison.csv", index=False)
    df_cv_export.to_csv(RESULTS_DIR / "cv_model_comparison.csv", index=False)
    
    # Figure 2: ROC and Precision-Recall Curves on Untouched Holdout Test Set
    y_test_prob = final_pipeline.predict_proba(X_test)[:, 1]
    fpr, tpr, _ = roc_curve(y_test, y_test_prob)
    precision, recall, _ = precision_recall_curve(y_test, y_test_prob)
    roc_auc_val = roc_auc_score(y_test, y_test_prob)
    pr_auc_val = average_precision_score(y_test, y_test_prob)
    
    fig, axes = plt.subplots(1, 2, figsize=(13, 5.5))
    
    # Panel A: ROC Curve
    ax = axes[0]
    ax.plot(fpr, tpr, color="#2563EB", linewidth=2.2, label=f"{best_model_name} (ROC-AUC = {roc_auc_val:.4f})")
    ax.plot([0, 1], [0, 1], "k--", label="Random Baseline", linewidth=1.2)
    ax.set_xlabel("False Positive Rate (1 - Specificity)", fontsize=10, fontweight="bold")
    ax.set_ylabel("True Positive Rate (Recall)", fontsize=10, fontweight="bold")
    ax.set_title(f"Panel A: ROC Curve on Independent Holdout Test (N = {len(y_test):,})", fontsize=11, fontweight="bold")
    ax.legend(loc="lower right", frameon=True, facecolor="white", framealpha=0.9)
    
    # Panel B: PR Curve
    ax = axes[1]
    ax.plot(recall, precision, color="#D97706", linewidth=2.2, label=f"{best_model_name} (PR-AUC = {pr_auc_val:.4f})")
    prevalence = y_test.mean()
    ax.axhline(y=prevalence, color="k", linestyle="--", label=f"Class Prevalence ({prevalence:.2%})", linewidth=1.2)
    
    # Mark operating points
    rec_05 = recall_score(y_test, (y_test_prob >= 0.50).astype(int), zero_division=0)
    prec_05 = precision_score(y_test, (y_test_prob >= 0.50).astype(int), zero_division=0)
    rec_sel = recall_score(y_test, (y_test_prob >= selected_threshold).astype(int), zero_division=0)
    prec_sel = precision_score(y_test, (y_test_prob >= selected_threshold).astype(int), zero_division=0)
    
    ax.scatter(rec_05, prec_05, color="#DC2626", s=90, zorder=5, marker="o", label=f"Default Threshold (0.50)")
    ax.scatter(rec_sel, prec_sel, color="#059669", s=100, zorder=5, marker="^", label=f"Selected Threshold ({selected_threshold:.2f})")
    
    ax.annotate(f"0.50\n(Rec={rec_05:.2f})", (rec_05, prec_05), textcoords="offset points", xytext=(10, -15), fontsize=8.5, fontweight="bold", color="#DC2626")
    ax.annotate(f"Selected ({selected_threshold:.2f})\n(Rec={rec_sel:.2f})", (rec_sel, prec_sel), textcoords="offset points", xytext=(-85, 10), fontsize=8.5, fontweight="bold", color="#059669")
    
    ax.set_xlabel("Recall (Sensitivity)", fontsize=10, fontweight="bold")
    ax.set_ylabel("Precision (PPV)", fontsize=10, fontweight="bold")
    ax.set_title(f"Panel B: Precision-Recall Curve on Independent Holdout Test (N = {len(y_test):,})", fontsize=11, fontweight="bold")
    ax.legend(loc="upper right", frameon=True, facecolor="white", framealpha=0.9)
    
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "roc_curves.png", dpi=300, bbox_inches="tight")
    plt.savefig(RESULTS_DIR / "pr_curves.png", dpi=300, bbox_inches="tight")
    plt.close()
    
    # Figure 3: Threshold Analysis & Side-by-Side Confusion Matrices
    df_thresh = pd.read_csv(RESULTS_DIR / "threshold_analysis.csv")
    fig, axes = plt.subplots(1, 2, figsize=(14, 5.5))
    
    # Panel A: OOF Threshold Curves
    ax = axes[0]
    ax.plot(df_thresh["Threshold"], df_thresh["Precision"], label="Precision", color="#2563EB", linewidth=2.0)
    ax.plot(df_thresh["Threshold"], df_thresh["Recall"], label="Recall", color="#DC2626", linewidth=2.0)
    ax.plot(df_thresh["Threshold"], df_thresh["F1-score"], label="F1-score", color="#059669", linewidth=2.0)
    ax.axvline(x=0.50, color="#64748B", linestyle="--", label="Default 0.50", linewidth=1.2)
    ax.axvline(x=selected_threshold, color="#7C3AED", linestyle="-.", label=f"Selected {selected_threshold:.2f}", linewidth=1.8)
    ax.axhspan(0.80, 1.00, color="#DC2626", alpha=0.08, label="Target Recall >= 0.80")
    ax.set_xlabel("Probability Decision Threshold", fontsize=10, fontweight="bold")
    ax.set_ylabel("Metric Score", fontsize=10, fontweight="bold")
    ax.set_title("Panel A: OOF Threshold Optimization Trade-off (Development Set)", fontsize=11, fontweight="bold")
    ax.legend(loc="center right", fontsize=8.5, frameon=True, facecolor="white")
    
    # Panel B: Side-by-Side Confusion Matrices on Test Set
    ax = axes[1]
    cm_default = confusion_matrix(y_test, (y_test_prob >= 0.50).astype(int))
    cm_selected = confusion_matrix(y_test, (y_test_prob >= selected_threshold).astype(int))
    
    # Format labels
    cm_text = (
        f"Default Threshold (0.50):\n"
        f"  TN={cm_default[0,0]:,}\tFP={cm_default[0,1]:,}\n"
        f"  FN={cm_default[1,0]:,}\tTP={cm_default[1,1]:,}\n\n"
        f"Validation-Selected Threshold ({selected_threshold:.2f}):\n"
        f"  TN={cm_selected[0,0]:,}\tFP={cm_selected[0,1]:,}\n"
        f"  FN={cm_selected[1,0]:,}\tTP={cm_selected[1,1]:,}\n\n"
        f"Operating Outcome:\n"
        f"  False Negatives Reduced: {cm_default[1,0] - cm_selected[1,0]:,} ({((cm_default[1,0]-cm_selected[1,0])/cm_default[1,0])*100:.1f}%)\n"
        f"  False Positives Added: {cm_selected[0,1] - cm_default[0,1]:,}"
    )
    ax.axis("off")
    ax.text(0.05, 0.50, cm_text, fontsize=10, va="center", ha="left", fontfamily="monospace", bbox=dict(boxstyle="round,pad=1", facecolor="#F8FAFC", edgecolor="#CBD5E1"))
    ax.set_title(f"Panel B: Confusion Matrix Comparison on Final Holdout Test", fontsize=11, fontweight="bold")
    
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "threshold_analysis.png", dpi=300, bbox_inches="tight")
    plt.close()
    
    print("Saved all modeling plots successfully.")

def save_metadata_and_reports(best_model_name, selected_threshold, selection_rule, cv_results, m_default, m_selected, ci_results, n_dev, n_test):
    """Saves model_selection.json and optimization_report.txt."""
    metadata = {
        "selected_model": best_model_name,
        "selection_criterion": "Primary = Mean 5-Fold CV PR-AUC on Development Set, Tie-break = Mean CV ROC-AUC",
        "random_state": 42,
        "n_folds": 5,
        "development_sample_size": n_dev,
        "holdout_test_sample_size": n_test,
        "holdout_test_used_for_selection": False,
        "selected_threshold": selected_threshold,
        "threshold_selection_rule": selection_rule,
        "threshold_selection_source": "Out-Of-Fold Development Probabilities",
        "cross_validation_metrics": {
            k: {
                "Mean_PR_AUC": round(v["Mean_PR_AUC"], 4),
                "Std_PR_AUC": round(v["Std_PR_AUC"], 4),
                "Mean_ROC_AUC": round(v["Mean_ROC_AUC"], 4),
                "Std_ROC_AUC": round(v["Std_ROC_AUC"], 4),
                "Mean_F1": round(v["Mean_F1"], 4),
                "Mean_Recall": round(v["Mean_Recall"], 4),
                "Mean_Precision": round(v["Mean_Precision"], 4)
            } for k, v in cv_results.items()
        },
        "final_holdout_test_metrics": {
            "default_0.50": {k: (round(v, 4) if isinstance(v, float) else int(v)) for k, v in m_default.items()},
            "selected_threshold": {k: (round(v, 4) if isinstance(v, float) else int(v)) for k, v in m_selected.items()},
            "bootstrap_95_ci_selected_threshold": {k: [v[0], v[1]] for k, v in ci_results.items()}
        }
    }
    
    with open(RESULTS_DIR / "model_selection.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=4)
    print(f"Saved model selection metadata to {RESULTS_DIR / 'model_selection.json'}")
    
    report_content = f"""Model Training and Selection Optimization Report
====================================================================
Model Selection Source: 5-Fold Stratified Cross-Validation on Development Set
Holdout Test Used for Selection: No
Selected Best Model: {best_model_name}
Selection Criterion: Primary = Mean CV PR-AUC ({cv_results[best_model_name]['Mean_PR_AUC']:.4f}), Tie-break = Mean CV ROC-AUC ({cv_results[best_model_name]['Mean_ROC_AUC']:.4f})

Development Set Size: {n_dev:,} respondents
Holdout Test Set Size: {n_test:,} respondents

--------------------------------------------------------------------
Development OOF Threshold Selection:
- Selected Threshold: {selected_threshold:.2f}
- Selection Rule: {selection_rule}

--------------------------------------------------------------------
Final Evaluation on Untouched Holdout Test Set (N = {n_test:,}):

1. Default Threshold (0.50):
   - Accuracy: {m_default['Accuracy']:.4f}
   - Precision: {m_default['Precision']:.4f}
   - Recall: {m_default['Recall']:.4f}
   - Specificity: {m_default['Specificity']:.4f}
   - F1-score: {m_default['F1-score']:.4f}
   - ROC-AUC: {m_default['ROC-AUC']:.4f}
   - PR-AUC: {m_default['PR-AUC']:.4f}
   - Confusion Matrix: [TN={m_default['TN']:,}, FP={m_default['FP']:,}, FN={m_default['FN']:,}, TP={m_default['TP']:,}]

2. Validation-Selected Screening Threshold ({selected_threshold:.2f}):
   - Accuracy: {m_selected['Accuracy']:.4f}
   - Precision: {m_selected['Precision']:.4f}
   - Recall: {m_selected['Recall']:.4f} (95% CI: [{ci_results['Recall'][0]:.4f}, {ci_results['Recall'][1]:.4f}])
   - Specificity: {m_selected['Specificity']:.4f}
   - F1-score: {m_selected['F1-score']:.4f} (95% CI: [{ci_results['F1-score'][0]:.4f}, {ci_results['F1-score'][1]:.4f}])
   - ROC-AUC: {m_selected['ROC-AUC']:.4f} (95% CI: [{ci_results['ROC-AUC'][0]:.4f}, {ci_results['ROC-AUC'][1]:.4f}])
   - PR-AUC: {m_selected['PR-AUC']:.4f} (95% CI: [{ci_results['PR-AUC'][0]:.4f}, {ci_results['PR-AUC'][1]:.4f}])
   - Confusion Matrix: [TN={m_selected['TN']:,}, FP={m_selected['FP']:,}, FN={m_selected['FN']:,}, TP={m_selected['TP']:,}]

3. Operational Trade-off Impact:
   - False Negatives Reduced: {m_default['FN'] - m_selected['FN']:,} ({((m_default['FN']-m_selected['FN'])/m_default['FN'])*100:.2f}%)
   - False Positives Added: {m_selected['FP'] - m_default['FP']:,}
"""
    with open(RESULTS_DIR / "optimization_report.txt", "w", encoding="utf-8") as f:
        f.write(report_content)
    print(f"Saved optimization_report.txt at {RESULTS_DIR}")

def main():
    print("=== Phase 4: Machine Learning Modeling & Model Selection ===")
    
    try:
        df = load_data(DATA_PATH)
    except FileNotFoundError as e:
        print(e)
        return
        
    X = df.drop(columns=["Diabetes_binary"])
    y = df["Diabetes_binary"]
    
    # Stratified 80/20 Train-Test Split (Dev Set vs Untouched Holdout Test Set)
    X_dev, X_test, y_dev, y_test = train_test_split(
        X, y, test_size=0.20, stratify=y, random_state=42
    )
    
    n_dev, n_test = len(X_dev), len(X_test)
    print(f"Total Dataset: {len(df):,} respondents | Dev Set: {n_dev:,} (80%) | Holdout Test: {n_test:,} (20%)")
    
    # 1. 5-Fold Stratified Cross-Validation on Development Set
    cv_results, oof_predictions = perform_cross_validation(X_dev, y_dev)
    
    # 2. Select Best Model
    best_model_name = select_best_model(cv_results)
    
    # 3. Select Operating Threshold from OOF Predictions of Best Model
    selected_threshold, selection_rule, df_thresh = select_threshold_from_oof(
        y_dev, oof_predictions[best_model_name], best_model_name, target_recall=0.80
    )
    
    # 4. Final Evaluation on Untouched Holdout Test Set
    final_pipeline, m_default, m_selected, ci_results, test_metrics_df = evaluate_final_holdout(
        best_model_name, selected_threshold, X_dev, y_dev, X_test, y_test
    )
    
    # 5. Generate Figures
    generate_modeling_plots(cv_results, best_model_name, selected_threshold, X_dev, y_dev, X_test, y_test, final_pipeline)
    
    # 6. Save Metadata & Optimization Reports
    save_metadata_and_reports(
        best_model_name, selected_threshold, selection_rule, cv_results, m_default, m_selected, ci_results, n_dev, n_test
    )
    
    print("\n=== Machine Learning Modeling Module Completed Successfully ===")

if __name__ == "__main__":
    main()
