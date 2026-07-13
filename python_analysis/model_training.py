"""
Machine Learning Modeling Module (RQ2)
----------------------------------------
Author: Senior Data Analytics Engineer / Team Members
Methodology: CRISP-DM
Dataset: CDC Diabetes Health Indicators (Cleaned)

This script performs the machine learning modeling phase (Phase 4) to answer RQ2:
"Which machine learning model provides the most reliable prediction performance on the original imbalanced BRFSS dataset?"

It develops and compares:
- Logistic Regression
- Decision Tree
- Random Forest
- XGBoost

All outputs are saved in results/modeling/.
"""

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, average_precision_score, roc_curve, precision_recall_curve,
    classification_report, confusion_matrix
)

# Define directory paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "processed" / "diabetes_cleaned.csv"
RESULTS_DIR = BASE_DIR / "results" / "modeling"

# Ensure results directory exists
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

def load_data(file_path: Path) -> pd.DataFrame:
    """Loads the cleaned dataset."""
    print(f"Loading cleaned dataset from: {file_path}")
    if not file_path.exists():
        raise FileNotFoundError(f"Cleaned dataset not found at {file_path}. Run preprocessing first.")
    df = pd.read_csv(file_path)
    return df

def train_and_evaluate_models(X_train, X_test, y_train, y_test):
    """Trains the 4 models and returns their evaluation metrics."""
    print("\nTraining and evaluating models...")
    
    # Standardize features (highly recommended for Logistic Regression, works well for all)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Initialize models
    models = {
        "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
        "Decision Tree": DecisionTreeClassifier(max_depth=8, random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1),
        "XGBoost": XGBClassifier(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42,
            eval_metric="logloss",
            use_label_encoder=False,
            n_jobs=-1
        )
    }
    
    results = {}
    
    for name, model in models.items():
        print(f"Training {name}...")
        
        # Train model
        model.fit(X_train_scaled, y_train)
        
        # Predict on test set
        y_pred = model.predict(X_test_scaled)
        y_prob = model.predict_proba(X_test_scaled)[:, 1]
        
        # Calculate metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        roc_auc = roc_auc_score(y_test, y_prob)
        pr_auc = average_precision_score(y_test, y_prob)
        
        results[name] = {
            "Model": name,
            "Accuracy": acc,
            "Precision": prec,
            "Recall": rec,
            "F1-score": f1,
            "ROC-AUC": roc_auc,
            "PR-AUC": pr_auc,
            "y_pred": y_pred,
            "y_prob": y_prob,
            "model_object": model,
            "X_test_scaled": X_test_scaled
        }
        
        print(f"{name} Results - Acc: {acc:.4f}, Prec: {prec:.4f}, Rec: {rec:.4f}, F1: {f1:.4f}, ROC-AUC: {roc_auc:.4f}, PR-AUC: {pr_auc:.4f}")
        
    return results

def plot_performance_curves(results, y_test):
    """Plots and saves ROC and Precision-Recall curves."""
    print("\nGenerating performance curve plots...")
    sns.set_theme(style="whitegrid")
    
    # 1. ROC Curves
    plt.figure(figsize=(8, 6))
    for name, metrics in results.items():
        fpr, tpr, _ = roc_curve(y_test, metrics["y_prob"])
        plt.plot(fpr, tpr, label=f"{name} (AUC = {metrics['ROC-AUC']:.4f})")
    
    plt.plot([0, 1], [0, 1], "k--", label="Random Classifier")
    plt.xlabel("False Positive Rate", fontsize=11)
    plt.ylabel("True Positive Rate", fontsize=11)
    plt.title("ROC Curves Comparison", fontsize=13, fontweight="bold", pad=15)
    plt.legend(loc="lower right")
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "roc_curves.png", dpi=300)
    plt.close()
    
    # 2. Precision-Recall Curves
    plt.figure(figsize=(8, 6))
    for name, metrics in results.items():
        precision, recall, _ = precision_recall_curve(y_test, metrics["y_prob"])
        plt.plot(recall, precision, label=f"{name} (PR-AUC = {metrics['PR-AUC']:.4f})")
        
    # Plot baseline diabetes rate in test set
    baseline = y_test.mean()
    plt.axhline(y=baseline, color="k", linestyle="--", label=f"Baseline (Prevalence = {baseline:.4f})")
    
    plt.xlabel("Recall", fontsize=11)
    plt.ylabel("Precision", fontsize=11)
    plt.title("Precision-Recall Curves Comparison", fontsize=13, fontweight="bold", pad=15)
    plt.legend(loc="upper right")
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "pr_curves.png", dpi=300)
    plt.close()
    
    # 3. Bar Chart Comparison
    metrics_list = []
    for name, metrics in results.items():
        metrics_list.append({
            "Model": name,
            "Accuracy": metrics["Accuracy"],
            "Precision": metrics["Precision"],
            "Recall": metrics["Recall"],
            "F1-score": metrics["F1-score"],
            "ROC-AUC": metrics["ROC-AUC"],
            "PR-AUC": metrics["PR-AUC"]
        })
    df_metrics = pd.DataFrame(metrics_list)
    df_metrics.to_csv(RESULTS_DIR / "model_comparison.csv", index=False)
    
    # Reshape for seaborn
    df_melted = df_metrics.melt(id_vars="Model", var_name="Metric", value_name="Score")
    
    plt.figure(figsize=(12, 7))
    sns.barplot(data=df_melted, x="Metric", y="Score", hue="Model", palette="muted")
    plt.ylim(0, 1.05)
    plt.title("Machine Learning Models Metrics Comparison", fontsize=14, fontweight="bold", pad=15)
    plt.xlabel("Performance Metric", fontsize=11)
    plt.ylabel("Score", fontsize=11)
    plt.legend(loc="lower left")
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "metrics_comparison.png", dpi=300)
    plt.close()
    print("Saved all comparison plots and csv successfully.")

def conduct_threshold_analysis(best_model_name, best_model_metrics, y_test):
    """Analyzes model performance across different probability thresholds to optimize for screening."""
    print(f"\nPerforming threshold-sensitive analysis on the best model: {best_model_name}...")
    y_prob = best_model_metrics["y_prob"]
    
    thresholds = np.arange(0.05, 0.96, 0.05)
    threshold_results = []
    
    for t in thresholds:
        y_pred_t = (y_prob >= t).astype(int)
        acc = accuracy_score(y_test, y_pred_t)
        prec = precision_score(y_test, y_pred_t, zero_division=0)
        rec = recall_score(y_test, y_pred_t, zero_division=0)
        f1 = f1_score(y_test, y_pred_t, zero_division=0)
        
        # Calculate confusion matrix components
        tn, fp, fn, tp = confusion_matrix(y_test, y_pred_t).ravel()
        
        threshold_results.append({
            "Threshold": t,
            "Accuracy": acc,
            "Precision": prec,
            "Recall": rec,
            "F1-score": f1,
            "True Positives": tp,
            "False Negatives": fn,
            "False Positives": fp,
            "True Negatives": tn
        })
        
    df_threshold = pd.DataFrame(threshold_results)
    df_threshold.to_csv(RESULTS_DIR / "threshold_analysis.csv", index=False)
    
    # Plot Threshold Curves
    plt.figure(figsize=(10, 6))
    plt.plot(df_threshold["Threshold"], df_threshold["Precision"], label="Precision", color="#4A90E2", linewidth=2)
    plt.plot(df_threshold["Threshold"], df_threshold["Recall"], label="Recall (Sensitivity)", color="#E94E77", linewidth=2)
    plt.plot(df_threshold["Threshold"], df_threshold["F1-score"], label="F1-score", color="#2ECC71", linewidth=2)
    
    plt.xlabel("Probability Decision Threshold", fontsize=11)
    plt.ylabel("Metric Score", fontsize=11)
    plt.title(f"Threshold Optimization Analysis ({best_model_name})", fontsize=13, fontweight="bold", pad=15)
    plt.axvline(x=0.5, color="gray", linestyle="--", label="Default Threshold (0.50)")
    
    # Find optimized threshold where Recall is around 80% to 85% for early screening
    # We want a high Recall to capture diabetics while keeping F1-score/Precision reasonable
    target_recall = 0.80
    closest_idx = (df_threshold["Recall"] - target_recall).abs().idxmin()
    opt_t = df_threshold.loc[closest_idx, "Threshold"]
    opt_recall = df_threshold.loc[closest_idx, "Recall"]
    opt_precision = df_threshold.loc[closest_idx, "Precision"]
    
    plt.axvline(x=opt_t, color="purple", linestyle="-.", label=f"Optimized Threshold ({opt_t:.2f} for Recall~{opt_recall*100:.1f}%)")
    plt.legend(loc="lower center", bbox_to_anchor=(0.5, -0.2), ncol=5)
    plt.tight_layout()
    plt.savefig(RESULTS_DIR / "threshold_analysis.png", dpi=300)
    plt.close()
    
    # Detailed Reports comparison
    print(f"\n=== Classification Report at Default Threshold (0.50) ===")
    y_pred_default = (y_prob >= 0.5).astype(int)
    print(classification_report(y_test, y_pred_default, digits=4))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred_default))
    
    print(f"\n=== Classification Report at Optimized Threshold ({opt_t:.2f}) ===")
    y_pred_opt = (y_prob >= opt_t).astype(int)
    print(classification_report(y_test, y_pred_opt, digits=4))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred_opt))
    
    # Save the optimized model stats in a text report
    report_content = f"""Model Optimization Report ({best_model_name})
==================================================
Default Threshold (0.50):
- Accuracy: {accuracy_score(y_test, y_pred_default):.4f}
- Precision: {precision_score(y_test, y_pred_default):.4f}
- Recall: {recall_score(y_test, y_pred_default):.4f}
- F1-score: {f1_score(y_test, y_pred_default):.4f}

Confusion Matrix (Default):
{confusion_matrix(y_test, y_pred_default)}

--------------------------------------------------
Optimized Threshold ({opt_t:.2f}) for Screening:
- Target: Prioritize Early Detection (Reduce False Negatives / High Recall)
- Accuracy: {accuracy_score(y_test, y_pred_opt):.4f}
- Precision: {precision_score(y_test, y_pred_opt):.4f}
- Recall: {recall_score(y_test, y_pred_opt):.4f}
- F1-score: {f1_score(y_test, y_pred_opt):.4f}

Confusion Matrix (Optimized):
{confusion_matrix(y_test, y_pred_opt)}
"""
    with open(RESULTS_DIR / "optimization_report.txt", "w", encoding="utf-8") as f:
        f.write(report_content)
    print(f"Saved optimization_report.txt at {RESULTS_DIR}")

def main():
    print("=== Phase 4: Machine Learning Modeling ===")
    
    # Load data
    try:
        df = load_data(DATA_PATH)
    except FileNotFoundError as e:
        print(e)
        return
        
    # Split features and target
    X = df.drop(columns=["Diabetes_binary"])
    y = df["Diabetes_binary"]
    
    print(f"Dataset shape: {df.shape}")
    print(f"Class imbalance: {y.value_counts(normalize=True).to_dict()} (0: Healthy, 1: Diabetic)")
    
    # Stratified Train-Test Split (80% Train, 20% Test)
    # Stratified split is critical to preserve the class imbalance ratio in both splits.
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )
    
    print(f"Train size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")
    
    # Train and evaluate models
    results = train_and_evaluate_models(X_train, X_test, y_train, y_test)
    
    # Plot performance comparisons
    plot_performance_curves(results, y_test)
    
    # Find best model based on PR-AUC (best metric for imbalanced healthcare datasets)
    best_model_name = max(results, key=lambda k: results[k]["PR-AUC"])
    print(f"\nBest Model identified based on PR-AUC: {best_model_name} (PR-AUC = {results[best_model_name]['PR-AUC']:.4f})")
    
    # Conduct threshold-sensitive analysis on the best model
    conduct_threshold_analysis(best_model_name, results[best_model_name], y_test)
    
    print("\n=== Machine Learning Modeling Module Completed Successfully ===")

if __name__ == "__main__":
    main()
