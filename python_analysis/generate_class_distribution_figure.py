#!/usr/bin/env python
"""
Class Distribution Pie Chart Generator (Figure 2)
-------------------------------------------------
Author: Advanced Data Analytics Agent
Description:
    Generates a minimalist, publication-quality solid pie chart 
    representing the class distribution of the processed CDC BRFSS dataset.
    
    The diagram is saved as:
        - docs/figures/class_distribution.svg (Vector)
        - docs/figures/class_distribution.png (300 DPI Raster)
        
    Values:
        - Healthy: 84.71%
        - Diabetes/Prediabetes: 15.29%
"""

import os
from pathlib import Path
import matplotlib.pyplot as plt

# Resolve paths relative to this script
BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUT_DIR = BASE_DIR / "docs" / "figures"

def create_output_directory():
    """Ensures that the output directory for figures exists."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Verified output directory: {OUTPUT_DIR}")

def generate_pie_chart():
    """Generates the class distribution solid pie chart."""
    create_output_directory()
    
    # Set style parameters for academic look
    plt.rcParams['font.family'] = 'sans-serif'
    plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']
    
    # Data values
    classes = ['Healthy', 'Diabetes/Prediabetes']
    percentages = [84.71, 15.29]
    colors = ['#3182CE', '#E53E3E']  # Academic muted blue (Healthy) and red (Diabetes/Prediabetes)
    
    # Create figure (widescreen square box)
    fig, ax = plt.subplots(figsize=(6, 5))
    
    # Draw solid pie chart (pie without a center cut-out)
    wedges, texts, autotexts = ax.pie(
        percentages,
        labels=classes,
        autopct='%1.2f%%',
        startangle=140,
        colors=colors,
        textprops=dict(color='#2D3748', fontsize=11, fontweight='bold'),
        wedgeprops=dict(edgecolor='#2D3748', linewidth=1.2), # Solid slice borders
        pctdistance=0.65
    )
    
    # Style percentage texts inside slices to be white for contrast
    for autotext in autotexts:
        autotext.set_color('#FFFFFF')
        autotext.set_fontsize(10.5)
        
    # Style label texts (outside slices)
    for text in texts:
        text.set_fontsize(11)
        text.set_color('#2D3748')
        
    # Ensure pie chart is drawn as a circle
    ax.axis('equal')  
    
    # Adjust layout to prevent cutting text
    plt.tight_layout()
    
    # File Paths
    svg_path = OUTPUT_DIR / "class_distribution.svg"
    png_path = OUTPUT_DIR / "class_distribution.png"
    
    # Save files
    plt.savefig(svg_path, format='svg', bbox_inches='tight', transparent=True)
    plt.savefig(png_path, format='png', dpi=300, bbox_inches='tight', facecolor='white')
    
    plt.close()
    
    print(f"\nClass distribution pie chart successfully generated:")
    print(f"  - SVG: {svg_path}")
    print(f"  - PNG: {png_path} (300 DPI)")

if __name__ == "__main__":
    generate_pie_chart()
