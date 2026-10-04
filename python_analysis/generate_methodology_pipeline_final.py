#!/usr/bin/env python3
"""
generate_methodology_pipeline_final.py

Generates the authoritative 12-step publication-grade methodology pipeline diagram:
  - paper/images/methodology_pipeline_final.png
  - docs/figures/methodology_pipeline_final.png

Workflow Steps:
  1. CDC BRFSS 2015 Dataset (N = 253,680)
  2. Data Validation & Integrity Audit
  3. RQ1 Statistical Association Analysis
  4. Primary Stratified Partitioning (80/20)
  5. RQ2 Multi-Paradigm Model Comparison (5-Fold CV)
  6. Development OOF Decision Threshold Selection (t* = 0.13)
  7. Independent Holdout Evaluation
  8. Cox Calibration Assessment & Bootstrap CIs
  9. TreeExplainer SHAP Explanation
 10. RQ3 Adjusted LR Chi2 vs SHAP Evidence Alignment
 11. Repeated Predictor-Profile Audit
 12. RQ4 Profile-Grouped Redevelopment Sensitivity
"""

import json
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import pandas as pd

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DOCS_FIG_DIR = PROJECT_ROOT / "docs" / "figures"
PAPER_IMG_DIR = PROJECT_ROOT / "paper" / "images"

DOCS_FIG_DIR.mkdir(parents=True, exist_ok=True)
PAPER_IMG_DIR.mkdir(parents=True, exist_ok=True)


def create_methodology_pipeline_diagram():
    # Dynamically load authoritative artifacts
    with open(PROJECT_ROOT / "results" / "final_results_summary.json", "r", encoding="utf-8") as f:
        summary_data = json.load(f)

    with open(PROJECT_ROOT / "results" / "modeling" / "model_selection.json", "r", encoding="utf-8") as f:
        model_sel = json.load(f)

    calib_df = pd.read_csv(PROJECT_ROOT / "results" / "modeling" / "calibration_metrics.csv")
    calib_slope = float(calib_df["Calibration_Slope"].iloc[0])
    brier_score = float(calib_df["Brier_Score"].iloc[0])

    with open(PROJECT_ROOT / "results" / "phase2_sensitivity" / "phase2_metadata.json", "r", encoding="utf-8") as f:
        p2_meta = json.load(f)
    p2_calib_df = pd.read_csv(PROJECT_ROOT / "results" / "phase2_sensitivity" / "grouped_calibration_metrics.csv")
    p2_calib_slope = float(p2_calib_df["Calibration_Slope"].iloc[0])
    p2_holdout_prauc = float(p2_meta["holdout_evaluation"]["metrics_at_selected_threshold"]["PR-AUC"])

    n_records = summary_data["dataset"]["n_records"]
    n_features = summary_data["dataset"]["n_features"]
    c0_pct = summary_data["dataset"]["target_distribution"]["no_diabetes_pct"]
    c1_pct = summary_data["dataset"]["target_distribution"]["prediabetes_or_diabetes_pct"]

    surplus_rows = summary_data["dataset"]["exact_duplicate_surplus_rows"]
    surplus_profiles = summary_data["dataset"]["repeated_predictor_profile_surplus_rows"]
    conflicting_profiles = summary_data["dataset"]["conflicting_label_profiles"]

    dev_size = summary_data["dataset"]["split"]["development_size"]
    holdout_size = summary_data["dataset"]["split"]["holdout_test_size"]

    xgb_cv_prauc = model_sel["cross_validation_metrics"]["XGBoost"]["Mean_PR_AUC"]
    selected_thresh = model_sel["selected_threshold"]

    fn_default = model_sel["final_holdout_test_metrics"]["default_0.50"]["FN"]
    fn_selected = model_sel["final_holdout_test_metrics"]["selected_threshold"]["FN"]
    fn_reduction_pct = ((fn_default - fn_selected) / fn_default) * 100

    h_rec = model_sel["final_holdout_test_metrics"]["selected_threshold"]["Recall"] * 100
    h_prec = model_sel["final_holdout_test_metrics"]["selected_threshold"]["Precision"] * 100
    h_spec = model_sel["final_holdout_test_metrics"]["selected_threshold"]["Specificity"] * 100
    h_f1 = model_sel["final_holdout_test_metrics"]["selected_threshold"]["F1-score"]
    h_prauc = model_sel["final_holdout_test_metrics"]["selected_threshold"]["PR-AUC"]
    h_rocauc = model_sel["final_holdout_test_metrics"]["selected_threshold"]["ROC-AUC"]

    fig, ax = plt.subplots(figsize=(18, 14), dpi=300)
    ax.set_xlim(0, 18)
    ax.set_ylim(0, 14)
    ax.axis("off")

    # Background color
    fig.patch.set_facecolor("#FFFFFF")
    ax.set_facecolor("#FFFFFF")

    # Header Title Banner
    ax.text(
        9.0, 13.5,
        "End-to-End Scientific Methodology & Evaluation Architecture",
        ha="center", va="center", fontsize=20, fontweight="bold", color="#1E293B",
        family="DejaVu Sans"
    )
    ax.text(
        9.0, 13.05,
        "CDC BRFSS 2015 | Statistical Inference, Screening-Oriented ML, Cox Calibration, SHAP Alignment, and Evaluation Integrity",
        ha="center", va="center", fontsize=11, fontstyle="italic", color="#475569",
        family="DejaVu Sans"
    )

    # 12 Steps organized in a 4-row x 3-column snake / sequential grid:
    # Row 1 (y=11.2): Step 1 (col 1) -> Step 2 (col 2) -> Step 3 (col 3)
    # Row 2 (y=8.2):  Step 6 (col 1) <- Step 5 (col 2) <- Step 4 (col 3)
    # Row 3 (y=5.2):  Step 7 (col 1) -> Step 8 (col 2) -> Step 9 (col 3)
    # Row 4 (y=2.2):  Step 12 (col 1) <- Step 11 (col 2) <- Step 10 (col 3)

    col_x = [0.8, 6.6, 12.4]  # left corners of boxes
    row_y = [10.3, 7.3, 4.3, 1.3]  # bottom corners of boxes
    box_w = 4.8
    box_h = 2.1

    steps = [
        # Step 1
        {
            "num": "1",
            "title": "CDC BRFSS 2015 Cohort",
            "tag": "Data Ingestion",
            "bullets": [
                f"N = {n_records:,} survey respondents",
                f"{n_features} discrete behavioral/clinical indicators",
                f"Class 0 (No reported diabetes): {c0_pct:.2f}%",
                f"Class 1 (Prediabetes/Diabetes): {c1_pct:.2f}%"
            ],
            "col": 0, "row": 0,
            "theme": "#0284C7", "bg": "#F0F9FF", "border": "#38BDF8"
        },
        # Step 2
        {
            "num": "2",
            "title": "Data Integrity Audit",
            "tag": "Verification",
            "bullets": [
                "0 missing values across all 22 columns",
                f"{surplus_rows:,} surplus exact duplicate rows",
                f"{surplus_profiles:,} surplus predictor profiles",
                f"{conflicting_profiles:,} conflicting-label profiles (2.06%)"
            ],
            "col": 1, "row": 0,
            "theme": "#0284C7", "bg": "#F0F9FF", "border": "#38BDF8"
        },
        # Step 3
        {
            "num": "3",
            "title": "RQ1 Statistical Associations",
            "tag": "Sample Inference",
            "bullets": [
                "Univariate Chi-Square & Mann-Whitney U",
                "Holm–Bonferroni correction (alpha = 0.05)",
                "Multivariable logistic regression (Wald Chi2)",
                "Categorical dummy blocks (no linearity assumption)"
            ],
            "col": 2, "row": 0,
            "theme": "#4F46E5", "bg": "#EEF2FF", "border": "#818CF8"
        },
        # Step 4
        {
            "num": "4",
            "title": "Primary Stratified Split",
            "tag": "Partitioning",
            "bullets": [
                "Stratified 80/20 train/holdout split",
                f"Development set: n = {dev_size:,} (80.00%)",
                f"Holdout set: n = {holdout_size:,} (20.00%)",
                f"Prevalence strictly preserved at {c1_pct:.2f}%"
            ],
            "col": 2, "row": 1,
            "theme": "#0284C7", "bg": "#F0F9FF", "border": "#38BDF8"
        },
        # Step 5
        {
            "num": "5",
            "title": "RQ2 Model Benchmarking",
            "tag": "Development",
            "bullets": [
                "5-fold stratified cross-validation",
                "Classifiers: LR, Decision Tree, RF, XGBoost",
                "Metric priority: PR-AUC under imbalance",
                f"Selected: XGBoost (Mean CV PR-AUC: {xgb_cv_prauc:.4f})"
            ],
            "col": 1, "row": 1,
            "theme": "#0D9488", "bg": "#F0FDF4", "border": "#34D399"
        },
        # Step 6
        {
            "num": "6",
            "title": "Decision Threshold Selection",
            "tag": "Development OOF",
            "bullets": [
                "Tuned strictly on development OOF probs",
                "Prespecified screening objective: Recall >= 80%",
                f"Optimal threshold identified: t* = {selected_thresh:.2f}",
                f"Missed positive cases reduced by {fn_reduction_pct:.2f}%"
            ],
            "col": 0, "row": 1,
            "theme": "#0D9488", "bg": "#F0FDF4", "border": "#34D399"
        },
        # Step 7
        {
            "num": "7",
            "title": "Holdout Screening Evaluation",
            "tag": "Internal Holdout",
            "bullets": [
                f"Independent internal holdout (n = {holdout_size:,})",
                f"Discrimination: PR-AUC {h_prauc:.4f}, ROC-AUC {h_rocauc:.4f}",
                f"Screening at t*={selected_thresh:.2f}: Recall {h_rec:.2f}%, Prec {h_prec:.2f}%",
                f"Specificity {h_spec:.2f}%, F1-score {h_f1:.4f}"
            ],
            "col": 0, "row": 2,
            "theme": "#0D9488", "bg": "#F0FDF4", "border": "#34D399"
        },
        # Step 8
        {
            "num": "8",
            "title": "Cox Calibration Assessment",
            "tag": "Probability Utility",
            "bullets": [
                "Unpenalized GLM: logit(Y) = beta0 + beta1*logit(p)",
                f"Brier score: {brier_score:.4f} vs null 0.1199",
                f"Cox slope: {calib_slope:.4f} [0.9342, 0.9854]",
                "1,000 stratified bootstrap 95% CIs"
            ],
            "col": 1, "row": 2,
            "theme": "#D97706", "bg": "#FFFBEB", "border": "#FBBF24"
        },
        # Step 9
        {
            "num": "9",
            "title": "SHAP Explainability",
            "tag": "XAI Attribution",
            "bullets": [
                "TreeExplainer applied to XGBoost on holdout",
                "Background reference distribution",
                "Global mean |SHAP| feature ranking",
                "Local waterfall explanations for high-risk cases"
            ],
            "col": 2, "row": 2,
            "theme": "#4F46E5", "bg": "#EEF2FF", "border": "#818CF8"
        },
        # Step 10
        {
            "num": "10",
            "title": "RQ3 Evidence Alignment",
            "tag": "Likelihood vs SHAP",
            "bullets": [
                "Multivariable LR Chi2 vs Mean |SHAP|",
                "Top-5 & Top-10 Consensus: 100% (Jaccard = 1.0)",
                "Global Spearman rho = 0.9338 (p = 6.38e-10)",
                "Degree-of-freedom sensitivity: (Chi2 - df) stable"
            ],
            "col": 2, "row": 3,
            "theme": "#4F46E5", "bg": "#EEF2FF", "border": "#818CF8"
        },
        # Step 11
        {
            "num": "11",
            "title": "Repeated Profile Audit",
            "tag": "Integrity Concern",
            "bullets": [
                "Identified discrete profile sharing across splits",
                "6,836 holdout rows (13.47%) share dev profiles",
                "6,375 holdout rows (12.57%) exact row duplicates",
                "Motivates zero-overlap sensitivity re-evaluation"
            ],
            "col": 1, "row": 3,
            "theme": "#0284C7", "bg": "#F0F9FF", "border": "#38BDF8"
        },
        # Step 12
        {
            "num": "12",
            "title": "RQ4 Grouped Sensitivity",
            "tag": "Zero Overlap",
            "bullets": [
                "StratifiedGroupKFold on 21-variable profiles",
                "Zero shared predictor profiles across partitions",
                f"Full pipeline redeveloped: XGBoost & t* = {selected_thresh:.2f}",
                f"Broadly similar PR-AUC ({p2_holdout_prauc:.4f}) & Slope ({p2_calib_slope:.4f})"
            ],
            "col": 0, "row": 3,
            "theme": "#D97706", "bg": "#FFFBEB", "border": "#FBBF24"
        }
    ]

    # Draw boxes and content
    for step in steps:
        bx = col_x[step["col"]]
        by = row_y[step["row"]]

        # Outer rounded box
        rect = patches.FancyBboxPatch(
            (bx, by), box_w, box_h,
            boxstyle="round,pad=0.08,rounding_size=0.15",
            linewidth=1.8,
            edgecolor=step["border"],
            facecolor=step["bg"],
            zorder=2
        )
        ax.add_patch(rect)

        # Header badge / Step number
        badge = patches.FancyBboxPatch(
            (bx + 0.12, by + box_h - 0.48), 0.55, 0.36,
            boxstyle="round,pad=0.04,rounding_size=0.08",
            linewidth=0,
            facecolor=step["theme"],
            zorder=3
        )
        ax.add_patch(badge)
        ax.text(
            bx + 0.395, by + box_h - 0.30,
            step["num"],
            ha="center", va="center", fontsize=11, fontweight="bold", color="#FFFFFF",
            family="DejaVu Sans", zorder=4
        )

        # Title
        ax.text(
            bx + 0.78, by + box_h - 0.30,
            step["title"],
            ha="left", va="center", fontsize=10.5, fontweight="bold", color="#0F172A",
            family="DejaVu Sans", zorder=4
        )

        # Tag
        ax.text(
            bx + box_w - 0.18, by + box_h - 0.30,
            step["tag"],
            ha="right", va="center", fontsize=7.8, fontweight="bold", color=step["theme"],
            family="DejaVu Sans", zorder=4
        )

        # Separator line
        ax.plot(
            [bx + 0.15, bx + box_w - 0.15],
            [by + box_h - 0.55, by + box_h - 0.55],
            color=step["border"], linewidth=0.8, zorder=3
        )

        # Bullets
        bullet_start_y = by + box_h - 0.82
        for i, text in enumerate(step["bullets"]):
            item_y = bullet_start_y - i * 0.34
            ax.text(
                bx + 0.22, item_y,
                "•",
                ha="left", va="center", fontsize=10, fontweight="bold", color=step["theme"],
                family="DejaVu Sans", zorder=4
            )
            ax.text(
                bx + 0.42, item_y,
                text,
                ha="left", va="center", fontsize=8.8, color="#334155",
                family="DejaVu Sans", zorder=4
            )

    # Connections / Sequential Arrows
    arrow_props = dict(
        arrowstyle="-|>,head_width=0.45,head_length=0.7",
        linewidth=2.2,
        color="#64748B",
        zorder=5
    )

    # Row 1: 1 -> 2 -> 3
    ax.annotate("", xy=(col_x[1], row_y[0] + box_h / 2), xytext=(col_x[0] + box_w, row_y[0] + box_h / 2), arrowprops=arrow_props)
    ax.annotate("", xy=(col_x[2], row_y[0] + box_h / 2), xytext=(col_x[1] + box_w, row_y[0] + box_h / 2), arrowprops=arrow_props)

    # Bend 3 -> 4 (downwards on right)
    ax.annotate(
        "",
        xy=(col_x[2] + box_w / 2, row_y[1] + box_h),
        xytext=(col_x[2] + box_w / 2, row_y[0]),
        arrowprops=arrow_props
    )

    # Row 2: 4 -> 5 -> 6 (leftwards)
    ax.annotate("", xy=(col_x[1] + box_w, row_y[1] + box_h / 2), xytext=(col_x[2], row_y[1] + box_h / 2), arrowprops=arrow_props)
    ax.annotate("", xy=(col_x[0] + box_w, row_y[1] + box_h / 2), xytext=(col_x[1], row_y[1] + box_h / 2), arrowprops=arrow_props)

    # Bend 6 -> 7 (downwards on left)
    ax.annotate(
        "",
        xy=(col_x[0] + box_w / 2, row_y[2] + box_h),
        xytext=(col_x[0] + box_w / 2, row_y[1]),
        arrowprops=arrow_props
    )

    # Row 3: 7 -> 8 -> 9 (rightwards)
    ax.annotate("", xy=(col_x[1], row_y[2] + box_h / 2), xytext=(col_x[0] + box_w, row_y[2] + box_h / 2), arrowprops=arrow_props)
    ax.annotate("", xy=(col_x[2], row_y[2] + box_h / 2), xytext=(col_x[1] + box_w, row_y[2] + box_h / 2), arrowprops=arrow_props)

    # Bend 9 -> 10 (downwards on right)
    ax.annotate(
        "",
        xy=(col_x[2] + box_w / 2, row_y[3] + box_h),
        xytext=(col_x[2] + box_w / 2, row_y[2]),
        arrowprops=arrow_props
    )

    # Row 4: 10 -> 11 -> 12 (leftwards)
    ax.annotate("", xy=(col_x[1] + box_w, row_y[3] + box_h / 2), xytext=(col_x[2], row_y[3] + box_h / 2), arrowprops=arrow_props)
    ax.annotate("", xy=(col_x[0] + box_w, row_y[3] + box_h / 2), xytext=(col_x[1], row_y[3] + box_h / 2), arrowprops=arrow_props)

    # Legend / Phase Category Keys at bottom
    leg_y = 0.55
    categories = [
        ("Data Ingestion & Integrity", "#0284C7", "#F0F9FF", "#38BDF8"),
        ("Statistical Inference & Explainability (RQ1, RQ3)", "#4F46E5", "#EEF2FF", "#818CF8"),
        ("Screening Modeling & Operating Point (RQ2)", "#0D9488", "#F0FDF4", "#34D399"),
        ("Calibration Assessment & Sensitivity Robustness (RQ4)", "#D97706", "#FFFBEB", "#FBBF24")
    ]
    leg_x_starts = [0.8, 4.8, 9.6, 13.8]
    leg_widths = [3.7, 4.5, 3.9, 3.4]

    for (label, theme, bg, border), lx, lw in zip(categories, leg_x_starts, leg_widths):
        lrect = patches.FancyBboxPatch(
            (lx, leg_y - 0.18), lw, 0.36,
            boxstyle="round,pad=0.02,rounding_size=0.06",
            linewidth=1.2,
            edgecolor=border,
            facecolor=bg,
            zorder=3
        )
        ax.add_patch(lrect)
        dot = patches.Circle((lx + 0.22, leg_y), 0.08, facecolor=theme, linewidth=0, zorder=4)
        ax.add_patch(dot)
        ax.text(
            lx + 0.40, leg_y,
            label,
            ha="left", va="center", fontsize=8.0, fontweight="bold", color="#1E293B",
            family="DejaVu Sans", zorder=4
        )

    plt.tight_layout()

    # Save to both paths
    dest1 = DOCS_FIG_DIR / "methodology_pipeline_final.png"
    dest2 = PAPER_IMG_DIR / "methodology_pipeline_final.png"
    plt.savefig(dest1, dpi=300, bbox_inches="tight", facecolor="white")
    plt.savefig(dest2, dpi=300, bbox_inches="tight", facecolor="white")
    plt.close()

    print(f"[OK] Generated: {dest1}")
    print(f"[OK] Generated: {dest2}")


if __name__ == "__main__":
    create_methodology_pipeline_diagram()
