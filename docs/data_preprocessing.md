# Data Preprocessing Documentation

## Purpose of Preprocessing
This document outlines the data preprocessing step for the **Diabetes-Analytics** project. The primary goal is to ensure the quality and integrity of the CDC Diabetes Health Indicators dataset, remove redundant duplicate rows, validate values against the codebook, and prepare the dataset for analysis and modeling. Importantly, the real-world class imbalance of the dataset is preserved, meaning no balancing techniques (like SMOTE or random under/oversampling) are applied.

## Datasets Directory Info
* **Raw Dataset Path:** `data/raw/diabetes_binary_health_indicators_BRFSS2015.csv`
* **Cleaned Dataset Path:** `data/processed/diabetes_cleaned.csv`

## Preprocessing Statistics and Checks

### 1. Dataset Shapes
* **Raw Shape:** 253,680 rows, 22 columns
* **Cleaned Shape:** 229,474 rows, 22 columns

### 2. Missing Values
* **Status:** No missing values found
* **Notes:** All fields are fully populated in the original survey response file.

### 3. Duplicate Rows
* **Status:** Duplicates removed
* **Number of duplicates:** 24,206 rows (representing 9.54% of the raw dataset)
* **Rationale:** Exact duplicate responses are dropped to prevent bias during downstream modeling, while keeping unique individual records intact.

### 4. Invalid Values (Out of Expected Range)
* **Status:** No invalid values found
* **Checked ranges:**
  * `Diabetes_binary`: expected range `0-1` (actual min: 0.0, max: 1.0) - **OK**
  * `HighBP`: expected range `0-1` (actual min: 0.0, max: 1.0) - **OK**
  * `HighChol`: expected range `0-1` (actual min: 0.0, max: 1.0) - **OK**
  * `CholCheck`: expected range `0-1` (actual min: 0.0, max: 1.0) - **OK**
  * `BMI`: expected range `> 0` (actual min: 12.0, max: 98.0) - **OK**
  * `Smoker`: expected range `0-1` (actual min: 0.0, max: 1.0) - **OK**
  * `Stroke`: expected range `0-1` (actual min: 0.0, max: 1.0) - **OK**
  * `HeartDiseaseorAttack`: expected range `0-1` (actual min: 0.0, max: 1.0) - **OK**
  * `PhysActivity`: expected range `0-1` (actual min: 0.0, max: 1.0) - **OK**
  * `Fruits`: expected range `0-1` (actual min: 0.0, max: 1.0) - **OK**
  * `Veggies`: expected range `0-1` (actual min: 0.0, max: 1.0) - **OK**
  * `HvyAlcoholConsump`: expected range `0-1` (actual min: 0.0, max: 1.0) - **OK**
  * `AnyHealthcare`: expected range `0-1` (actual min: 0.0, max: 1.0) - **OK**
  * `NoDocbcCost`: expected range `0-1` (actual min: 0.0, max: 1.0) - **OK**
  * `GenHlth`: expected range `1-5` (actual min: 1.0, max: 5.0) - **OK**
  * `MentHlth`: expected range `0-30` (actual min: 0.0, max: 30.0) - **OK**
  * `PhysHlth`: expected range `0-30` (actual min: 0.0, max: 30.0) - **OK**
  * `DiffWalk`: expected range `0-1` (actual min: 0.0, max: 1.0) - **OK**
  * `Sex`: expected range `0-1` (actual min: 0.0, max: 1.0) - **OK**
  * `Age`: expected range `1-13` (actual min: 1.0, max: 13.0) - **OK**
  * `Education`: expected range `1-6` (actual min: 1.0, max: 6.0) - **OK**
  * `Income`: expected range `1-8` (actual min: 1.0, max: 8.0) - **OK**

### 5. Data Types and Casting
* **Initial data types:** All columns were loaded as `float64`.
* **Casting action:** Converted all columns to standard integers (`int`), as they represent binary indicators, categorical scales, or age categories with zero fractional parts.

### 6. Class Imbalance Preservation
* **SMOTE / Resampling:** **None applied (class imbalance is preserved)**
* **Diabetes Class Distribution Comparison:**

| Class (Diabetes_binary) | Raw Counts | Raw Pct | Cleaned Counts | Cleaned Pct |
|-------------------------|------------|---------|----------------|-------------|
| **0 (No Diabetes)**      | 218,334 | 86.07% | 194,377 | 84.71% |
| **1 (Diabetes)**         | 35,346 | 13.93% | 35,097 | 15.29% |

*Note: The proportion of positive cases shifted slightly from 13.93% to 15.29% because non-diabetic records contained slightly more duplicate rows.*

## Preprocessing Summary Table
Refer to the CSV summary at `results/data_preprocessing/preprocessing_summary.csv` for detailed steps.

| Step | Result | Notes |
|------|--------|-------|
| Load Raw Dataset | Shape: (253680, 22) | Successfully loaded dataset with 22 features and 253680 records. |
| Check Missing Values | 0 missing values | No missing value handling needed. |
| Remove Duplicate Rows | 24206 duplicates removed | Exact duplicate rows removed. Cleaned shape is (229474, 22). |
| Check Expected Ranges | 0 invalid values | All variables conform to CDC expected ranges. |
| Convert Data Types | float64 -> int | Converted categorical and binary float representations to integer types for clean formatting and memory efficiency. |
| Save Cleaned Dataset | Saved shape: (229474, 22) | Cleaned data successfully written to CSV file. |
| Preserve Class Imbalance | Preserved | Imbalance preserved without SMOTE/resampling. Raw: 13.93% positive, 86.07% negative. Cleaned: 15.29% positive, 84.71% negative. |
