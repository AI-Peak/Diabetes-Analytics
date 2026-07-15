#!/usr/bin/env python
"""
Combined Model Curves Generator (Figure 4)
------------------------------------------
Author: Advanced Data Analytics Agent
Description:
    Combines the existing ROC curves and Precision-Recall curves images 
    side-by-side into a single publication-ready figure.
    
    The figure is labeled with:
        - "(a) ROC curves" on the left
        - "(b) Precision–Recall curves" on the right
        
    Outputs:
        - docs/figures/model_performance_curves.svg (Vector Wrapper)
        - docs/figures/model_performance_curves.png (300 DPI Raster)
        
    This script runs standalone, does not modify any raw models or predictions, 
    and handles missing source files gracefully.
"""

import os
from pathlib import Path
import matplotlib.pyplot as plt
import matplotlib.image as mpimg

# Resolve paths relative to this script
BASE_DIR = Path(__file__).resolve().parent.parent
RESULTS_DIR = BASE_DIR / "results" / "modeling"
OUTPUT_DIR = BASE_DIR / "docs" / "figures"

def check_source_files():
    """Checks if the required source images exist."""
    roc_path = RESULTS_DIR / "roc_curves.png"
    pr_path = RESULTS_DIR / "pr_curves.png"
    
    missing = []
    if not roc_path.exists():
        missing.append(str(roc_path))
    if not pr_path.exists():
        missing.append(str(pr_path))
        
    if missing:
        raise FileNotFoundError(
            f"Required source image(s) not found:\n" + 
            "\n".join(f"  - {m}" for m in missing) + 
            "\nPlease run model training/evaluation first."
        )
    return roc_path, pr_path

def combine_curves():
    """Combines the two curves side-by-side and saves the result."""
    # 1. Verify files exist
    try:
        roc_path, pr_path = check_source_files()
    except FileNotFoundError as e:
        print(f"Error: {e}")
        return
        
    # 2. Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Verified output directory: {OUTPUT_DIR}")
    
    # 3. Load Images
    print("Loading source images...")
    img_roc = mpimg.imread(str(roc_path))
    img_pr = mpimg.imread(str(pr_path))
    
    # 4. Set up Matplotlib Canvas for horizontal alignment
    # Widescreen 14" x 6.5" fits two square-ish 4:3 subplots side-by-side nicely
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 6.5))
    
    # Render ROC curves
    ax1.imshow(img_roc)
    ax1.axis('off') # Hide axes boundaries and ticks of the outer container
    
    # Render PR curves
    ax2.imshow(img_pr)
    ax2.axis('off')
    
    # 5. Add Subfigure Labels below the plots
    # va='top' and negative transform offset places the text in the bottom whitespace margin
    ax1.text(
        0.5, -0.02, "(a) ROC curves", 
        transform=ax1.transAxes, ha='center', va='top',
        fontsize=12, fontweight='bold', color='#1A202C',
        family='sans-serif'
    )
    
    ax2.text(
        0.5, -0.02, "(b) Precision–Recall curves", 
        transform=ax2.transAxes, ha='center', va='top',
        fontsize=12, fontweight='bold', color='#1A202C',
        family='sans-serif'
    )
    
    # 6. Adjust Subplot Spacing (minimal spacing between subfigures, uniform margins)
    plt.subplots_adjust(wspace=0.04, bottom=0.08, top=0.98, left=0.01, right=0.99)
    
    # Define save paths
    svg_path = OUTPUT_DIR / "model_performance_curves.svg"
    png_path = OUTPUT_DIR / "model_performance_curves.png"
    
    # 7. Save Combined Images
    print("Saving combined figures...")
    # Save as high-res PNG (300 DPI for publication standard)
    plt.savefig(png_path, format='png', dpi=300, bbox_inches='tight', facecolor='white')
    # Save as SVG (wraps the subplots in a vector structure)
    plt.savefig(svg_path, format='svg', bbox_inches='tight', transparent=True)
    
    plt.close()
    
    print(f"\nModel performance curves successfully combined:")
    print(f"  - SVG: {svg_path}")
    print(f"  - PNG: {png_path} (300 DPI)")

if __name__ == "__main__":
    combine_curves()
