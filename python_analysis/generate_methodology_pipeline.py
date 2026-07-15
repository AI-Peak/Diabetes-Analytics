#!/usr/bin/env python
"""
Methodology Pipeline Generator (Academic/Scientific Style)
-----------------------------------------------------------
Author: Advanced Data Analytics Agent
Description:
    Generates a minimalist, publication-quality methodology pipeline diagram 
    for the Diabetes Analytics project without icons for a clean, academic look.
    The diagram is saved as:
        - docs/figures/methodology_pipeline.svg (Vector)
        - docs/figures/methodology_pipeline.png (300 DPI Raster)
    
    The layout uses a two-row serpentine structure representing the research flow:
    Row 1 (Left to Right): Stage I: Data & Evidence Foundation (Blocks 1-4)
    Row 2 (Left to Right): Stage II (Blocks 5-6) & Stage III (Blocks 7-8)
"""

import os
from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches

# Resolve paths relative to this script
BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "docs" / "figures"

def create_output_directory():
    """Ensures that the output directory for figures exists."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Verified output directory: {OUTPUT_DIR}")

# ---------------------------------------------------------
# Core Drawing Functions
# ---------------------------------------------------------

def draw_card(ax, x, y, w, h, title, items, colors):
    """
    Draws a single box card representing a process step.
    
    Parameters:
        ax: matplotlib axes
        x, y: bottom-left coordinate
        w, h: width and height
        title: card title (centered)
        items: list of bullet points (max 4, left-aligned)
        colors: dictionary with 'bg', 'border', 'text' keys
    """
    bg_color = colors['bg']
    border_color = colors['border']
    text_color = colors['text']
    
    # Draw card body with rounded corners
    box = patches.FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0.0,rounding_size=0.12",
        linewidth=1.6, edgecolor=border_color, facecolor=bg_color,
        zorder=3
    )
    ax.add_patch(box)
    
    # Draw horizontal separator line under title
    ax.plot([x + 0.15, x + w - 0.15], [y + h - 0.55, y + h - 0.55], color=border_color, linewidth=0.8, alpha=0.5, zorder=3)
    
    # Draw Title text (centered horizontally)
    ax.text(
        x + w/2, y + h - 0.38, title, 
        fontsize=10.5, fontweight='bold', color=text_color, 
        family='sans-serif', ha='center', zorder=4
    )
        
    # Draw Bullet Points (left-aligned)
    y_start = y + h - 0.90
    y_spacing = 0.38
    for i, item in enumerate(items[:4]):
        ax.text(
            x + 0.20, y_start - (i * y_spacing), item,
            fontsize=9.0, color=text_color, fontweight='medium',
            family='sans-serif', zorder=4
        )

def generate_pipeline():
    """Generates and saves the methodology pipeline figure."""
    create_output_directory()
    
    # Canvas setup - widescreen landscape for papers (16.5" x 8.5")
    fig, ax = plt.subplots(figsize=(16.5, 8.5))
    ax.axis('off')
    ax.set_xlim(0, 16.5)
    ax.set_ylim(0, 8.5)
    
    # Define Color Schemes (Academic/Soft Palette)
    colors_scheme = {
        'blue':   {'bg': '#F0F6FF', 'border': '#1A73E8', 'text': '#1557B0'}, # Data Source & Prep
        'green':  {'bg': '#E6F4EA', 'border': '#137333', 'text': '#0C662C'}, # Statistical Evidence
        'orange': {'bg': '#FEF7E0', 'border': '#E37400', 'text': '#B06000'}, # Predictive Model & Eval
        'purple': {'bg': '#F3E8FD', 'border': '#7627CD', 'text': '#5A129E'}  # SHAP & Insights
    }
    
    # ---------------------------------------------------------
    # 1. Draw Visual Stage Background Zones
    # ---------------------------------------------------------
    # Stage I: Data & Evidence Foundation (Row 1)
    zone_1 = patches.FancyBboxPatch(
        (0.2, 4.45), 16.1, 3.65,
        boxstyle="round,pad=0.0,rounding_size=0.15",
        facecolor='#F8FAFC', edgecolor='#CBD5E1', linewidth=1.0, linestyle='--', zorder=1
    )
    ax.add_patch(zone_1)
    ax.text(
        0.4, 7.80, "STAGE I: DATA & EVIDENCE FOUNDATION", 
        fontsize=12, fontweight='bold', color='#475569', family='sans-serif', zorder=2
    )
    
    # Stage II: Predictive Analysis & Optimization (Row 2, Left Half)
    zone_2 = patches.FancyBboxPatch(
        (0.2, 0.35), 7.9, 3.75,
        boxstyle="round,pad=0.0,rounding_size=0.15",
        facecolor='#FDFBF7', edgecolor='#CBD5E1', linewidth=1.0, linestyle='--', zorder=1
    )
    ax.add_patch(zone_2)
    ax.text(
        0.4, 3.78, "STAGE II: PREDICTIVE ANALYSIS & OPTIMIZATION", 
        fontsize=12, fontweight='bold', color='#475569', family='sans-serif', zorder=2
    )
    
    # Stage III: Explainability & Insights (Row 2, Right Half)
    zone_3 = patches.FancyBboxPatch(
        (8.4, 0.35), 7.9, 3.75,
        boxstyle="round,pad=0.0,rounding_size=0.15",
        facecolor='#FAF8FE', edgecolor='#CBD5E1', linewidth=1.0, linestyle='--', zorder=1
    )
    ax.add_patch(zone_3)
    ax.text(
        8.6, 3.78, "STAGE III: EXPLAINABILITY & EVIDENCE INTEGRATION", 
        fontsize=12, fontweight='bold', color='#475569', family='sans-serif', zorder=2
    )
    
    # ---------------------------------------------------------
    # 2. Draw Process Step Cards (Blocks 1-8)
    # ---------------------------------------------------------
    card_w, card_h = 3.2, 2.1
    y_row1, y_row2 = 5.20, 1.10
    x_centers = [2.2, 6.2, 10.2, 14.2] # 4 cards per row
    
    # Card Definitions
    cards_data = [
        # Block 1
        {
            'x': x_centers[0] - card_w/2, 'y': y_row1,
            'title': "1. Public Health Data Source",
            'items': [
                "• CDC BRFSS 2015 dataset",
                "• 253,680 survey responses",
                "• 21 health indicator features",
                "• Imbalanced target variable"
            ],
            'colors': colors_scheme['blue']
        },
        # Block 2
        {
            'x': x_centers[1] - card_w/2, 'y': y_row1,
            'title': "2. Data Quality Assessment",
            'items': [
                "• Schema & data-type validation",
                "• Missing-value & range checks",
                "• Duplicate-profile assessment",
                "• SQL-based verification queries"
            ],
            'colors': colors_scheme['blue']
        },
        # Block 3
        {
            'x': x_centers[2] - card_w/2, 'y': y_row1,
            'title': "3. Data Preparation",
            'items': [
                "• Feature & target definition",
                "• Categorical & numerical prep",
                "• Stratified train/test partition",
                "• Feature scaling where required"
            ],
            'colors': colors_scheme['blue']
        },
        # Block 4
        {
            'x': x_centers[3] - card_w/2, 'y': y_row1,
            'title': "4. Statistical Evidence",
            'items': [
                "• Association testing & ranking",
                "• Chi-Square & Cramér's V",
                "• Welch's t & Mann-Whitney U",
                "• Feature-target distributions"
            ],
            'colors': colors_scheme['green']
        },
        # Block 5
        {
            'x': x_centers[0] - card_w/2, 'y': y_row2,
            'title': "5. Predictive Modeling",
            'items': [
                "• Logistic Regression baseline",
                "• Decision Tree classifier",
                "• Random Forest ensemble",
                "• XGBoost gradient boosting"
            ],
            'colors': colors_scheme['orange']
        },
        # Block 6
        {
            'x': x_centers[1] - card_w/2, 'y': y_row2,
            'title': "6. Model Eval & Screening Opt",
            'items': [
                "• Recall-focused metrics",
                "• Default: Low Recall (High FN)",
                "• Adjusted: High Recall (Low FN)",
                "• Decision-threshold tuning"
            ],
            'colors': colors_scheme['orange']
        },
        # Block 7
        {
            'x': x_centers[2] - card_w/2, 'y': y_row2,
            'title': "7. Explainable Model Analysis",
            'items': [
                "• Global feature importances",
                "• Feature-effect directions",
                "• SHAP value explanations",
                "• Patient-level risk breakdowns"
            ],
            'colors': colors_scheme['purple']
        },
        # Block 8
        {
            'x': x_centers[3] - card_w/2, 'y': y_row2,
            'title': "8. Integration & Insights",
            'items': [
                "• Statistical vs. SHAP ranking",
                "• Agreement & discrepancy checks",
                "• Key risk-factor identification",
                "• Actionable screening insights"
            ],
            'colors': colors_scheme['purple']
        }
    ]
    
    # Draw all cards
    for c in cards_data:
        draw_card(ax, c['x'], c['y'], card_w, card_h, c['title'], c['items'], c['colors'])
        
    # ---------------------------------------------------------
    # 3. Draw Connecting Arrows
    # ---------------------------------------------------------
    arrow_style = dict(arrowstyle="-|>", mutation_scale=15, color='#475569', linewidth=2.0, zorder=2)
    
    # Row 1 Horizontal Arrows
    # Arrow 1 -> 2
    ax.annotate("", xy=(x_centers[1] - card_w/2, y_row1 + card_h/2), xytext=(x_centers[0] + card_w/2, y_row1 + card_h/2), arrowprops=arrow_style)
    # Arrow 2 -> 3
    ax.annotate("", xy=(x_centers[2] - card_w/2, y_row1 + card_h/2), xytext=(x_centers[1] + card_w/2, y_row1 + card_h/2), arrowprops=arrow_style)
    # Arrow 3 -> 4
    ax.annotate("", xy=(x_centers[3] - card_w/2, y_row1 + card_h/2), xytext=(x_centers[2] + card_w/2, y_row1 + card_h/2), arrowprops=arrow_style)
    
    # Row 2 Horizontal Arrows
    # Arrow 5 -> 6
    ax.annotate("", xy=(x_centers[1] - card_w/2, y_row2 + card_h/2), xytext=(x_centers[0] + card_w/2, y_row2 + card_h/2), arrowprops=arrow_style)
    # Arrow 6 -> 7
    ax.annotate("", xy=(x_centers[2] - card_w/2, y_row2 + card_h/2), xytext=(x_centers[1] + card_w/2, y_row2 + card_h/2), arrowprops=arrow_style)
    # Arrow 7 -> 8
    ax.annotate("", xy=(x_centers[3] - card_w/2, y_row2 + card_h/2), xytext=(x_centers[2] + card_w/2, y_row2 + card_h/2), arrowprops=arrow_style)
    
    # Row-to-Row Serpentine Connector (Arrow 4 -> 5)
    channel_y = 4.285
    connector_x = [x_centers[3], x_centers[3], x_centers[0], x_centers[0]]
    connector_y = [y_row1, channel_y, channel_y, y_row2 + card_h]
    
    # Draw path line (without arrow head first)
    ax.plot(connector_x[:3], connector_y[:3], color='#475569', linewidth=2.0, linestyle='-', zorder=2)
    # Draw final segment with arrowhead pointing down
    ax.annotate("", xy=(connector_x[3], connector_y[3]), xytext=(connector_x[2], connector_y[2]), arrowprops=arrow_style)
    
    # Save files
    svg_path = OUTPUT_DIR / "methodology_pipeline.svg"
    png_path = OUTPUT_DIR / "methodology_pipeline.png"
    
    # Save as Vector SVG (transparency preserved, scalable)
    plt.savefig(svg_path, format='svg', bbox_inches='tight', pad_inches=0.1, transparent=True)
    # Save as High-res PNG (300 DPI for paper printing)
    plt.savefig(png_path, format='png', dpi=300, bbox_inches='tight', pad_inches=0.1, facecolor='white')
    
    plt.close()
    
    print(f"\nPipeline figures successfully updated:")
    print(f"  - SVG: {svg_path}")
    print(f"  - PNG: {png_path} (300 DPI)")

if __name__ == "__main__":
    generate_pipeline()
