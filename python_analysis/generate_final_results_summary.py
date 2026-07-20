"""
Generates results/final_results_summary.json automatically from canonical outputs.
Do NOT hardcode numbers; compute dynamically from dataset and modeling CSVs.
"""

import json
from pathlib import Path
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_PATH = PROJECT_ROOT / "data" / "processed" / "diabetes_cleaned.csv"
RESULTS_DIR = PROJECT_ROOT / "results"

def main():
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Cleaned dataset not found at {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    n_total = len(df)
    class_counts = df["Diabetes_binary"].astype(int).value_counts()
    no_diabetes_count = int(class_counts.get(0, 0))
    prediabetes_or_diabetes_count = int(class_counts.get(1, 0))
    repeated_profiles = int(df.duplicated().sum())

    model_sel_path = RESULTS_DIR / "modeling" / "model_selection.json"
    consistency_path = RESULTS_DIR / "xai" / "explanation_consistency.csv"
    calib_path = RESULTS_DIR / "modeling" / "calibration_metrics.csv"
    
    with open(model_sel_path, "r", encoding="utf-8") as f:
        model_sel = json.load(f)

    consistency_df = pd.read_csv(consistency_path) if consistency_path.exists() else None
    calib_df = pd.read_csv(calib_path) if calib_path.exists() else None
    
    summary = {
        "title": "Predicting Diabetes Risk Using CDC Health Indicators - Final Results Summary",
        "dataset": {
            "n_records": n_total,
            "n_features": len(df.columns) - 1,
            "repeated_profiles_count": repeated_profiles,
            "target_distribution": {
                "no_diabetes_count": no_diabetes_count,
                "no_diabetes_pct": round((no_diabetes_count / n_total) * 100, 2),
                "prediabetes_or_diabetes_count": prediabetes_or_diabetes_count,
                "prediabetes_or_diabetes_pct": round((prediabetes_or_diabetes_count / n_total) * 100, 2)
            },
            "split": {
                "development_size": model_sel["development_sample_size"],
                "holdout_test_size": model_sel["holdout_test_sample_size"],
                "cv_folds": model_sel["n_folds"]
            }
        },
        "model_selection": {
            "selected_model": model_sel["selected_model"],
            "selection_criterion": model_sel["selection_criterion"],
            "cross_validation_results": model_sel["cross_validation_metrics"]
        },
        "holdout_test_evaluation": {
            "selected_threshold": model_sel["selected_threshold"],
            "metrics_at_selected_threshold": model_sel["final_holdout_test_metrics"]["selected_threshold"],
            "metrics_at_default_0.50": model_sel["final_holdout_test_metrics"]["default_0.50"],
            "bootstrap_95_ci": model_sel["final_holdout_test_metrics"]["bootstrap_95_ci_selected_threshold"]
        }
    }

    if calib_df is not None:
        summary["holdout_test_evaluation"]["calibration"] = calib_df.to_dict(orient="records")[0]

    if consistency_df is not None:
        groups = {}
        for group_name, df_g in consistency_df.groupby("Consistency_Group"):
            groups[group_name] = df_g["Variable"].tolist()
        summary["xai_consistency"] = {
            "evidence_groups": groups,
            "total_features": len(consistency_df)
        }
        
    out_path = RESULTS_DIR / "final_results_summary.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)
        
    print(f"Successfully generated {out_path}")

if __name__ == "__main__":
    main()
