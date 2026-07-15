#!/usr/bin/env python
"""
Cramér's V Effect Size Ranking Figure Generator (Figure 3)
----------------------------------------------------------
Author: Advanced Data Analytics Agent
Description:
    Generates an enhanced horizontal lollipop chart illustrating the top 10 
    health indicators associated with diabetes/prediabetes ranked by Cramér's V.
    
    Includes:
        - Delineated vertical background shading for effect size classes
          (Negligible, Weak, Small, Moderate).
        - Color-coded top-ranked variables to emphasize strong associations.
        - Text value labels next to the markers.
        - Clickable file references and high-quality vector export.
        
    The diagram is saved as:
        - docs/figures/effect_size_ranking.svg (Vector)
        - docs/figures/effect_size_ranking.png (300 DPI Raster)
"""

import os
from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt

# Resolve paths relative to this script
BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "docs" / "figures"

def create_output_directory():
    """Ensures that the output directory for figures exists."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Verified output directory: {OUTPUT_DIR}")

def generate_effect_size_chart():
    """Generates the Cramér's V ranking lollipop chart."""
    create_output_directory()
    
    # Academic typography setup
    plt.rcParams['font.family'] = 'sans-serif'
    plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']
    
    # 1. Dataset definition (Top 10 features sorted in descending order)
    features_raw = [
        "GenHlth", "HighBP", "DiffWalk", "HighChol", "Age",
        "HeartDiseaseorAttack", "Income", "Education", "PhysActivity", "Stroke"
    ]
    
    features_descriptive = [
        "GenHlth (General Health)",
        "HighBP (High Blood Pressure)",
        "DiffWalk (Difficulty Walking)",
        "HighChol (High Cholesterol)",
        "Age (Age Category)",
        "HeartDiseaseorAttack (Heart Disease/Attack)",
        "Income (Income Level)",
        "Education (Education Level)",
        "PhysActivity (Physical Activity)",
        "Stroke (Stroke History)"
    ]
    
    values = [0.2816, 0.2543, 0.2053, 0.1949, 0.1891, 0.1682, 0.1422, 0.1046, 0.1004, 0.0992]
    
    # Map index to y-coordinates (largest at y=9, smallest at y=0)
    y_pos = np.arange(len(values))[::-1]
    
    # 2. Figure Setup
    # 9.5" x 5.5" landscape offers a spacious horizontal scale and neat labels
    fig, ax = plt.subplots(figsize=(9.5, 5.5))
    
    # Set limits
    ax.set_xlim(0.00, 0.32)
    ax.set_ylim(-0.8, 10.5) # Extra space at the top (9.5 to 10.5) for effect size labels
    
    # 3. Draw Vertical Effect Size Threshold Bands (Background Shading)
    # Moderate Effect: 0.20 to 0.30 (Faint warm yellow)
    ax.axvspan(0.20, 0.30, facecolor='#FEF7E0', alpha=0.45, zorder=1)
    # Small Effect: 0.10 to 0.20 (Faint green)
    ax.axvspan(0.10, 0.20, facecolor='#E6F4EA', alpha=0.45, zorder=1)
    # Weak Effect: 0.05 to 0.10 (Faint slate/blue)
    ax.axvspan(0.05, 0.10, facecolor='#F0F4F8', alpha=0.45, zorder=1)
    # Negligible Effect: 0.00 to 0.05 (Plain white)
    ax.axvspan(0.00, 0.05, facecolor='#FFFFFF', alpha=1.0, zorder=1)
    
    # Draw vertical separator lines for the bands
    for border in [0.05, 0.10, 0.20, 0.30]:
        ax.axvline(border, color='#CBD5E1', linestyle='--', linewidth=0.8, zorder=2)
        
    # 4. Add Effect Size Labels in the Top Margin
    text_y = 9.8
    ax.text(0.025, text_y, "Negligible\n(< 0.05)", fontsize=8.0, color='#64748B', ha='center', va='bottom', fontweight='bold', family='sans-serif')
    ax.text(0.075, text_y, "Weak\n(0.05 - 0.10)", fontsize=8.0, color='#64748B', ha='center', va='bottom', fontweight='bold', family='sans-serif')
    ax.text(0.150, text_y, "Small\n(0.10 - 0.20)", fontsize=8.0, color='#64748B', ha='center', va='bottom', fontweight='bold', family='sans-serif')
    ax.text(0.250, text_y, "Moderate\n(0.20 - 0.30)", fontsize=8.0, color='#64748B', ha='center', va='bottom', fontweight='bold', family='sans-serif')
    
    # 5. Plot Lollipops (Horizontal Lines + End Markers)
    # Highlight color palette
    color_top = '#DD6B20'    # Accent warm orange for top-tier features (GenHlth, HighBP, DiffWalk)
    color_normal = '#3182CE' # Muted slate blue for lower-ranked features
    
    for i, (y, val) in enumerate(zip(y_pos, values)):
        # Rank identifier: top 3 are Moderately associated, next 2 are Small, etc.
        # We emphasize the top 3 features (GenHlth, HighBP, DiffWalk) which exceed 0.20
        is_top = (val >= 0.20)
        
        line_color = '#1A202C' if is_top else '#4A5568'
        marker_color = color_top if is_top else color_normal
        linewidth = 2.0 if is_top else 1.5
        marker_size = 110 if is_top else 80
        
        # Horizontal stem of lollipop
        ax.hlines(y, xmin=0.00, xmax=val, color=line_color, linewidth=linewidth, zorder=3)
        
        # Lollipop end node
        ax.scatter(
            val, y, 
            facecolor=marker_color, edgecolor='#1A202C', 
            s=marker_size, linewidths=1.2, zorder=4
        )
        
        # Value annotation text next to the node
        ax.text(
            val + 0.004, y, f'{val:.4f}',
            va='center', ha='left',
            fontsize=9.0, fontweight='bold' if is_top else 'medium',
            color='#1A202C' if is_top else '#4A5568',
            zorder=4
        )

    # 6. Formatting & Aesthetics
    # Y-Axis formatting (Right-aligned, numbered ranks + descriptive labels)
    yticklabels = [f"#{len(values)-y:02d}  {features_descriptive[len(values)-1-y]}" for y in y_pos]
    ax.set_yticks(y_pos)
    ax.set_yticklabels(yticklabels, fontsize=9.5, color='#2D3748', fontweight='medium')
    
    # X-Axis formatting
    ax.set_xticks([0.00, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30])
    ax.set_xticklabels(['0.00', '0.05', '0.10', '0.15', '0.20', '0.25', '0.30'], fontsize=9.5, color='#2D3748')
    ax.set_xlabel("Cramér's V (Strength of Association)", fontsize=10.5, fontweight='bold', color='#2D3748', labelpad=10)
    
    # Clean spines (Academic journal standard)
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_color('#718096')
    ax.spines['bottom'].set_color('#718096')
    ax.spines['left'].set_linewidth(0.8)
    ax.spines['bottom'].set_linewidth(0.8)
    
    # Adjust layout to guarantee labels fit perfectly without clipping
    plt.tight_layout()
    
    # File Paths
    svg_path = OUTPUT_DIR / "effect_size_ranking.svg"
    png_path = OUTPUT_DIR / "effect_size_ranking.png"
    
    # Save files
    plt.savefig(svg_path, format='svg', bbox_inches='tight', transparent=True)
    plt.savefig(png_path, format='png', dpi=300, bbox_inches='tight', facecolor='white')
    
    plt.close()
    
    print(f"\nEffect size ranking figures successfully generated:")
    print(f"  - SVG: {svg_path}")
    print(f"  - PNG: {png_path} (300 DPI)")

if __name__ == "__main__":
    generate_effect_size_chart()
