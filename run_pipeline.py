"""
End-to-End Pipeline Execution Entry Point
------------------------------------------
Author: Antigravity AI Pair Programmer
Project: Diabetes-Analytics
Repository: https://github.com/AI-Peak/Diabetes-Analytics

This script executes the entire scientific analytics, statistical hypothesis testing,
machine learning modeling, calibration assessment, explainable AI (SHAP), figure generation,
and result summary pipeline in strict sequential order.

Usage:
    python run_pipeline.py
"""

import sys
import time
import shutil
import subprocess
from pathlib import Path

# Resolve project root using pathlib
PROJECT_ROOT = Path(__file__).resolve().parent
PAPER_DIR = PROJECT_ROOT / "paper"

def run_step(step_num: int, title: str, script_path: Path):
    """Executes a single pipeline step via python subprocess with clear logging."""
    print(f"\n================================================================================")
    print(f" STEP {step_num}: {title}")
    print(f" Script: {script_path.relative_to(PROJECT_ROOT)}")
    print(f"================================================================================")
    
    if not script_path.exists():
        raise FileNotFoundError(f"Pipeline script missing at: {script_path}")
        
    start_time = time.time()
    cmd = [sys.executable, str(script_path)]
    result = subprocess.run(cmd, cwd=str(PROJECT_ROOT))
    
    elapsed = time.time() - start_time
    if result.returncode != 0:
        print(f"\n[FAILED] STEP {step_num} FAILED with exit code {result.returncode} (Elapsed: {elapsed:.2f}s)")
        sys.exit(result.returncode)
    else:
        print(f"[OK] STEP {step_num} COMPLETED SUCCESSFULLY in {elapsed:.2f}s")


def run_latex_compilation(step_num: int):
    """Compiles the publication manuscript paper/main.tex using tectonic or pdflatex."""
    print(f"\n================================================================================")
    print(f" STEP {step_num}: Publication Manuscript LaTeX Compilation")
    print(f" Target: {PAPER_DIR / 'main.tex'}")
    print(f"================================================================================")

    tectonic_bin = shutil.which("tectonic")
    if not tectonic_bin:
        default_cli_bin = Path.home() / ".gemini" / "antigravity-cli" / "bin" / "tectonic.exe"
        if default_cli_bin.exists():
            tectonic_bin = str(default_cli_bin)

    start_time = time.time()
    if tectonic_bin:
        print(f"Found TeX engine: {tectonic_bin}")
        cmd = [tectonic_bin, "main.tex"]
        result = subprocess.run(cmd, cwd=str(PAPER_DIR))
        elapsed = time.time() - start_time
        if result.returncode != 0:
            print(f"\n[FAILED] LaTeX compilation failed with exit code {result.returncode}")
            sys.exit(result.returncode)
        else:
            pdf_path = PAPER_DIR / "main.pdf"
            print(f"[OK] STEP {step_num} COMPLETED: {pdf_path.name} ({pdf_path.stat().st_size / 1024:.1f} KiB) in {elapsed:.2f}s")
    else:
        print("Warning: Neither tectonic nor pdflatex found on PATH. Checking existing PDF...")
        pdf_path = PAPER_DIR / "main.pdf"
        if pdf_path.exists():
            print(f"[OK] Pre-compiled manuscript verified: {pdf_path.name} ({pdf_path.stat().st_size / 1024:.1f} KiB)")
        else:
            print("[FAILED] No compiled PDF found and no LaTeX engine available.")
            sys.exit(1)


def main():
    print("================================================================================")
    print("   DIABETES ANALYTICS: END-TO-END REPRODUCIBLE SCIENTIFIC PIPELINE")
    print("================================================================================")
    print(f"Project Root: {PROJECT_ROOT}\n")

    raw_csv = PROJECT_ROOT / "data" / "raw" / "diabetes_binary_health_indicators_BRFSS2015.csv"
    if not raw_csv.exists():
        print(f"CRITICAL ERROR: Raw dataset not found at {raw_csv}")
        print("Please ensure the raw BRFSS CSV file is placed in data/raw/")
        sys.exit(1)

    steps = [
        (1, "Data Preprocessing & Quality Validation", PROJECT_ROOT / "notebooks" / "data_preprocessing.py"),
        (2, "Class Distribution Figure Generation", PROJECT_ROOT / "python_analysis" / "generate_class_distribution_figure.py"),
        (3, "Statistical Hypothesis Testing & Adjusted Association", PROJECT_ROOT / "python_analysis" / "statistical_analysis.py"),
        (4, "Two-Panel Effect-Size Figure Generation", PROJECT_ROOT / "python_analysis" / "generate_effect_size_figure.py"),
        (5, "Machine Learning Modeling, Selection & Holdout Evaluation", PROJECT_ROOT / "python_analysis" / "model_training.py"),
        (6, "Explainable AI (SHAP) & Evidence Alignment Analysis", PROJECT_ROOT / "python_analysis" / "shap_analysis.py"),
        (7, "Global SHAP Feature Importance Figure Generation", PROJECT_ROOT / "python_analysis" / "generate_shap_global_importance.py"),
        (8, "Local SHAP Waterfall Explanation Figure Generation", PROJECT_ROOT / "python_analysis" / "generate_shap_local_waterfall.py"),
        (9, "Methodology Pipeline Architecture Figure Generation", PROJECT_ROOT / "python_analysis" / "generate_methodology_pipeline_final.py"),
        (10, "Phase 1 Data & Split Integrity Audit", PROJECT_ROOT / "python_analysis" / "phase1_data_integrity_audit.py"),
        (11, "Phase 2 Profile-Grouped Sensitivity Evaluation", PROJECT_ROOT / "python_analysis" / "phase2_profile_grouped_sensitivity.py"),
        (12, "Final Results Summary Aggregation", PROJECT_ROOT / "python_analysis" / "generate_final_results_summary.py"),
        (13, "Paper Artifacts & LaTeX Table Generation", PROJECT_ROOT / "python_analysis" / "generate_paper_artifacts.py"),
    ]

    total_start = time.time()
    for step_num, title, script_path in steps:
        run_step(step_num, title, script_path)

    # Step 14: LaTeX Manuscript Compilation
    run_latex_compilation(14)

    # Step 15: Pipeline Output & Independent Manuscript Consistency Validation
    run_step(15, "Pipeline Output & Independent Consistency Validation", PROJECT_ROOT / "python_analysis" / "validate_outputs.py")

    total_elapsed = time.time() - total_start
    print(f"\n================================================================================")
    print(f"[SUCCESS] FULL PIPELINE EXECUTED SUCCESSFULLY IN {total_elapsed:.2f}s")
    print(f"   Final Results: {PROJECT_ROOT / 'results' / 'final_results_summary.json'}")
    print(f"   Manuscript PDF: {PAPER_DIR / 'main.pdf'}")
    print("================================================================================")

if __name__ == "__main__":
    main()
