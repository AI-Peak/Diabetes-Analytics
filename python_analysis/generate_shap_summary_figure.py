#!/usr/bin/env python
"""
SHAP Summary Beeswarm Plot Generator (Figure 7)
-----------------------------------------------
Author: Advanced Data Analytics Agent
Description:
    Generates a publication-quality SHAP beeswarm summary plot for the 
    best-performing XGBoost model on the CDC BRFSS dataset.
    
    Includes:
        - Exact replication of the XGBoost model training and SHAP explainer 
          setup used in the project's analytical modules.
        - Descriptive mapping of health indicators on the y-axis for reader-friendly papers.
        - Clear color bar indicating feature values (Low to High).
        - Saving of SVG (vector) and PNG (300 DPI raster) formats.
        
    Outputs:
        - docs/figures/shap_summary_beeswarm.svg
        - docs/figures/shap_summary_beeswarm.png
"""

import os
from pathlib import Path
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier
import shap

# Resolve paths relative to this script
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "processed" / "diabetes_cleaned.csv"
OUTPUT_DIR = BASE_DIR / "docs" / "figures"

# ---------------------------------------------------------
# Descriptive Health Indicators Mapping
# ---------------------------------------------------------
FEATURE_MAPPING = {
    "GenHlth": "General Health",
    "HighBP": "High Blood Pressure",
    "Age": "Age Category",
    "BMI": "Body Mass Index (BMI)",
    "HighChol": "High Cholesterol",
    "DiffWalk": "Difficulty Walking",
    "Income": "Income Level",
    "PhysHlth": "Physical Illness Days",
    "HeartDiseaseorAttack": "Heart Disease/Attack",
    "PhysActivity": "Physical Activity",
    "Education": "Education Level",
    "MentHlth": "Mental Illness Days",
    "CholCheck": "Cholesterol Check",
    "Smoker": "Smoker Status",
    "Stroke": "Stroke History",
    "Sex": "Sex (Male/Female)",
    "Fruits": "Fruit Consumption",
    "Veggies": "Vegetable Consumption",
    "HvyAlcoholConsump": "Heavy Alcohol Consumption",
    "AnyHealthcare": "Healthcare Coverage",
    "NoDocbcCost": "Doctor Cost Barrier"
}

def load_data(file_path: Path) -> pd.DataFrame:
    """Loads the cleaned dataset."""
    if not file_path.exists():
        raise FileNotFoundError(f"Cleaned dataset not found at {file_path}. Run preprocessing first.")
    return pd.read_csv(file_path)

def train_xgboost_model(X_train, y_train):
    """Trains the best-performing XGBoost model identified in modeling phase."""
    print("Training XGBoost model...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    
    # Train using DataFrame to retain feature names
    X_train_scaled_df = pd.DataFrame(X_train_scaled, columns=X_train.columns, index=X_train.index)
    
    model = XGBClassifier(
        n_estimators=100,
        max_depth=6,
        learning_rate=0.1,
        random_state=42,
        eval_metric="logloss",
        n_jobs=-1
    )
    model.fit(X_train_scaled_df, y_train)
    return model, scaler

def generate_shap_beeswarm():
    """Computes SHAP values and saves a beeswarm summary plot."""
    # 1. Verify directories and load dataset
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    print("Loading cleaned dataset...")
    df = load_data(DATA_PATH)
    X = df.drop(columns=["Diabetes_binary"])
    y = df["Diabetes_binary"]
    
    # 2. Replicate train-test split and scale features
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=42
    )
    
    model, scaler = train_xgboost_model(X_train, y_train)
    
    # 3. Scale test dataset and draw sample
    print("Preparing test sample for SHAP...")
    X_test_scaled = scaler.transform(X_test)
    X_test_scaled_df = pd.DataFrame(X_test_scaled, columns=X_test.columns, index=X_test.index)
    
    # Replicate the exact 10,000 cases sample to ensure consistency
    X_test_sample = X_test_scaled_df.sample(n=10000, random_state=42)
    
    # 4. Compute SHAP Values
    print("Computing SHAP values (10,000 samples)...")
    explainer = shap.TreeExplainer(model)
    shap_values = explainer(X_test_sample)
    
    # Take positive class predictions if output contains multiple classes
    if len(shap_values.values.shape) == 3:
        shap_values_to_plot = shap_values[:, :, 1]
    else:
        shap_values_to_plot = shap_values
        
    # 5. Rename columns inside the SHAP Explanation and test sample DataFrame
    # This enables reader-friendly descriptive labels on the y-axis
    print("Applying descriptive feature mapping...")
    
    # Rename features in the Explanation object
    shap_values_to_plot.feature_names = [
        FEATURE_MAPPING.get(name, name) for name in shap_values_to_plot.feature_names
    ]
    
    # Rename columns in the test sample DataFrame
    X_test_sample_renamed = X_test_sample.rename(columns=FEATURE_MAPPING)
    
    # 6. Generate Beeswarm Plot
    print("Rendering SHAP beeswarm plot...")
    plt.rcParams['font.family'] = 'sans-serif'
    plt.rcParams['font.sans-serif'] = ['DejaVu Sans', 'Arial', 'Helvetica']
    
    # Set figure canvas
    plt.figure(figsize=(10.5, 6.2))
    
    # Draw summary plot (plot_type="dot" creates a beeswarm plot)
    # Display the top 12 features for a balanced vertical layout
    shap.summary_plot(
        shap_values_to_plot, 
        X_test_sample_renamed, 
        max_display=12, 
        show=False
    )
    
    # Fine-tune plot cosmetics for academic standard
    plt.xlabel("SHAP Value (Impact on Diabetes/Prediabetes Risk)", fontsize=11, fontweight='bold', labelpad=10, color='#2D3748')
    plt.gca().tick_params(axis='both', which='major', labelsize=10.0, colors='#2D3748')
    
    # Add vertical line at SHAP = 0
    plt.axvline(0, color='#4A5568', linestyle='-', linewidth=0.8, alpha=0.7, zorder=2)
    
    # Adjust layout
    plt.gcf().tight_layout()
    
    # File Paths
    svg_path = OUTPUT_DIR / "shap_summary_beeswarm.svg"
    png_path = OUTPUT_DIR / "shap_summary_beeswarm.png"
    
    # Save files
    plt.savefig(svg_path, format='svg', bbox_inches='tight', transparent=True)
    plt.savefig(png_path, format='png', dpi=300, bbox_inches='tight', facecolor='white')
    
    plt.close()
    
    print(f"\nSHAP summary beeswarm figures successfully generated:")
    print(f"  - SVG: {svg_path}")
    print(f"  - PNG: {png_path} (300 DPI)")

if __name__ == "__main__":
    generate_shap_beeswarm()
