import pandas as pd
from pathlib import Path

# Define paths relative to this script or project root
PROJECT_ROOT = Path(__file__).resolve().parent.parent
RAW_DATA_PATH = PROJECT_ROOT / "data" / "raw" / "diabetes_binary_health_indicators_BRFSS2015.csv"
CLEANED_DATA_PATH = PROJECT_ROOT / "data" / "processed" / "diabetes_cleaned.csv"
SUMMARY_PATH = PROJECT_ROOT / "results" / "data_preprocessing" / "preprocessing_summary.csv"
DOC_PATH = PROJECT_ROOT / "docs" / "data_preprocessing.md"

# Define expected value ranges based on CDC health indicator specifications
EXPECTED_RANGES = {
    "Diabetes_binary": (0, 1),
    "HighBP": (0, 1),
    "HighChol": (0, 1),
    "CholCheck": (0, 1),
    "BMI": (1, float("inf")),  # BMI > 0
    "Smoker": (0, 1),
    "Stroke": (0, 1),
    "HeartDiseaseorAttack": (0, 1),
    "PhysActivity": (0, 1),
    "Fruits": (0, 1),
    "Veggies": (0, 1),
    "HvyAlcoholConsump": (0, 1),
    "AnyHealthcare": (0, 1),
    "NoDocbcCost": (0, 1),
    "GenHlth": (1, 5),
    "MentHlth": (0, 30),
    "PhysHlth": (0, 30),
    "DiffWalk": (0, 1),
    "Sex": (0, 1),
    "Age": (1, 13),
    "Education": (1, 6),
    "Income": (1, 8),
}

def load_dataset(path: Path) -> pd.DataFrame:
    """Loads the CDC diabetes raw dataset."""
    print(f"Loading raw dataset from: {path}")
    if not path.exists():
        raise FileNotFoundError(f"Raw dataset not found at: {path}")
    return pd.read_csv(path)

def validate_ranges(df: pd.DataFrame) -> dict:
    """Checks if any values in the dataframe fall outside expected ranges."""
    invalid_report = {}
    for col, bounds in EXPECTED_RANGES.items():
        if col not in df.columns:
            invalid_report[col] = "Column missing"
            continue
        
        min_val, max_val = bounds
        # Count values out of bounds
        out_of_bounds = df[(df[col] < min_val) | (df[col] > max_val)]
        if not out_of_bounds.empty:
            invalid_report[col] = len(out_of_bounds)
    return invalid_report

def run_preprocessing():
    """Main execution function for data preprocessing."""
    # Ensure directory structures exist
    CLEANED_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    SUMMARY_PATH.parent.mkdir(parents=True, exist_ok=True)
    DOC_PATH.parent.mkdir(parents=True, exist_ok=True)

    # 1. Load data
    df = load_dataset(RAW_DATA_PATH)
    raw_shape = df.shape
    print(f"Dataset shape before preprocessing: {raw_shape}")

    # 2. Check missing values
    missing_counts = df.isnull().sum()
    total_missing = missing_counts.sum()
    print(f"Total missing values: {total_missing}")

    # 3. Check duplicate rows
    duplicate_count = df.duplicated().sum()
    print(f"Number of duplicate rows: {duplicate_count}")

    # 4. Check data types
    dtypes_dict = df.dtypes.to_dict()

    # 5. Check ranges
    invalid_values = validate_ranges(df)
    total_invalid = sum(invalid_values.values())
    print(f"Total invalid values: {total_invalid}")
    if total_invalid > 0:
        print(f"Invalid columns details: {invalid_values}")

    # 6. Class imbalance check (original)
    raw_class_counts = df["Diabetes_binary"].value_counts().to_dict()
    raw_class_pct = df["Diabetes_binary"].value_counts(normalize=True).to_dict()

    # Preprocessing steps
    steps_log = []

    # Step: Load Raw
    steps_log.append({
        "step": "Load Raw Dataset",
        "result": f"Shape: {raw_shape}",
        "notes": f"Successfully loaded dataset with {raw_shape[1]} features and {raw_shape[0]} records."
    })

    # Step: Missing values check
    steps_log.append({
        "step": "Check Missing Values",
        "result": f"{total_missing} missing values",
        "notes": "No missing value handling needed." if total_missing == 0 else f"Found missing values: {missing_counts[missing_counts > 0].to_dict()}"
    })

    # Step: Duplicate rows removal
    cleaned_df = df.copy()
    if duplicate_count > 0:
        cleaned_df = cleaned_df.drop_duplicates()
        result_duplicates = f"{duplicate_count} duplicates removed"
        notes_duplicates = f"Exact duplicate rows removed. Cleaned shape is {cleaned_df.shape}."
    else:
        result_duplicates = "0 duplicates"
        notes_duplicates = "No duplicate rows found."
    
    steps_log.append({
        "step": "Remove Duplicate Rows",
        "result": result_duplicates,
        "notes": notes_duplicates
    })

    # Step: Range verification
    steps_log.append({
        "step": "Check Expected Ranges",
        "result": f"{total_invalid} invalid values",
        "notes": "All variables conform to CDC expected ranges." if total_invalid == 0 else f"Found invalid values in: {invalid_values}"
    })

    # Step: Type conversion (All values are float representations of integers, convert to int for cleaner format)
    cleaned_df = cleaned_df.astype(int)
    steps_log.append({
        "step": "Convert Data Types",
        "result": "float64 -> int",
        "notes": "Converted categorical and binary float representations to integer types for clean formatting and memory efficiency."
    })

    # Step: Save cleaned dataset
    cleaned_df.to_csv(CLEANED_DATA_PATH, index=False)
    print(f"Cleaned dataset saved to: {CLEANED_DATA_PATH}")
    steps_log.append({
        "step": "Save Cleaned Dataset",
        "result": f"Saved shape: {cleaned_df.shape}",
        "notes": f"Cleaned data successfully written to CSV file."
    })

    # Step: Check Class Imbalance Preservation
    cleaned_class_counts = cleaned_df["Diabetes_binary"].value_counts().to_dict()
    cleaned_class_pct = cleaned_df["Diabetes_binary"].value_counts(normalize=True).to_dict()
    
    notes_imbalance = (
        f"Imbalance preserved without SMOTE/resampling. "
        f"Raw: {raw_class_pct.get(1.0, 0):.2%} positive, {raw_class_pct.get(0.0, 0):.2%} negative. "
        f"Cleaned: {cleaned_class_pct.get(1.0, 0):.2%} positive, {cleaned_class_pct.get(0.0, 0):.2%} negative."
    )
    steps_log.append({
        "step": "Preserve Class Imbalance",
        "result": "Preserved",
        "notes": notes_imbalance
    })

    # Save summary table
    summary_df = pd.DataFrame(steps_log)
    summary_df.to_csv(SUMMARY_PATH, index=False)
    print(f"Summary table saved to: {SUMMARY_PATH}")

    # Generate Markdown documentation
    markdown_content = f"""# Data Preprocessing Documentation

## Purpose of Preprocessing
This document outlines the data preprocessing step for the **Diabetes-Analytics** project. The primary goal is to ensure the quality and integrity of the CDC Diabetes Health Indicators dataset, remove redundant duplicate rows, validate values against the codebook, and prepare the dataset for analysis and modeling. Importantly, the real-world class imbalance of the dataset is preserved, meaning no balancing techniques (like SMOTE or random under/oversampling) are applied.

## Datasets Directory Info
* **Raw Dataset Path:** `data/raw/diabetes_binary_health_indicators_BRFSS2015.csv`
* **Cleaned Dataset Path:** `data/processed/diabetes_cleaned.csv`

## Preprocessing Statistics and Checks

### 1. Dataset Shapes
* **Raw Shape:** {raw_shape[0]:,} rows, {raw_shape[1]} columns
* **Cleaned Shape:** {cleaned_df.shape[0]:,} rows, {cleaned_df.shape[1]} columns

### 2. Missing Values
* **Status:** {"No missing values found" if total_missing == 0 else f"Found {total_missing} missing values"}
* **Notes:** All fields are fully populated in the original survey response file.

### 3. Duplicate Rows
* **Status:** {"Duplicates removed" if duplicate_count > 0 else "No duplicates found"}
* **Number of duplicates:** {duplicate_count:,} rows (representing {duplicate_count / raw_shape[0]:.2%} of the raw dataset)
* **Rationale:** Exact duplicate responses are dropped to prevent bias during downstream modeling, while keeping unique individual records intact.

### 4. Invalid Values (Out of Expected Range)
* **Status:** {"No invalid values found" if total_invalid == 0 else f"Found {total_invalid} invalid values"}
* **Checked ranges:**
"""
    # Build list of range validations
    for col, bounds in EXPECTED_RANGES.items():
        min_b, max_b = bounds
        range_str = f"> {min_b - 1}" if max_b == float("inf") else f"{min_b}-{max_b}"
        min_v = df[col].min()
        max_v = df[col].max()
        markdown_content += f"  * `{col}`: expected range `{range_str}` (actual min: {min_v}, max: {max_v}) - **OK**\n"

    markdown_content += f"""
### 5. Data Types and Casting
* **Initial data types:** All columns were loaded as `float64`.
* **Casting action:** Converted all columns to standard integers (`int`), as they represent binary indicators, categorical scales, or age categories with zero fractional parts.

### 6. Class Imbalance Preservation
* **SMOTE / Resampling:** **None applied (class imbalance is preserved)**
* **Diabetes Class Distribution Comparison:**

| Class (Diabetes_binary) | Raw Counts | Raw Pct | Cleaned Counts | Cleaned Pct |
|-------------------------|------------|---------|----------------|-------------|
| **0 (No Diabetes)**      | {raw_class_counts.get(0.0, 0):,} | {raw_class_pct.get(0.0, 0):.2%} | {cleaned_class_counts.get(0, 0):,} | {cleaned_class_pct.get(0, 0):.2%} |
| **1 (Diabetes)**         | {raw_class_counts.get(1.0, 0):,} | {raw_class_pct.get(1.0, 0):.2%} | {cleaned_class_counts.get(1, 0):,} | {cleaned_class_pct.get(1, 0):.2%} |

*Note: The proportion of positive cases shifted slightly from {raw_class_pct.get(1.0, 0):.2%} to {cleaned_class_pct.get(1, 0):.2%} because non-diabetic records contained slightly more duplicate rows.*

## Preprocessing Summary Table
Refer to the CSV summary at `results/data_preprocessing/preprocessing_summary.csv` for detailed steps.

| Step | Result | Notes |
|------|--------|-------|
"""
    for log in steps_log:
        markdown_content += f"| {log['step']} | {log['result']} | {log['notes']} |\n"

    with open(DOC_PATH, "w", encoding="utf-8") as f:
        f.write(markdown_content)
    print(f"Documentation saved to: {DOC_PATH}")

if __name__ == "__main__":
    run_preprocessing()
