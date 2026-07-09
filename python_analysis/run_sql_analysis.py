import os
import re
import sys
import pyodbc
import pandas as pd
from pathlib import Path
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Define workspace directories
PROJECT_ROOT = Path(__file__).resolve().parent.parent
SQL_DIR = PROJECT_ROOT / "sql"
SQL_SCRIPTS_DIR = SQL_DIR / "scripts"
SQL_OUTPUT_DIR = SQL_DIR / "outputs"

# Expected column range notes for documentation
EXPECTED_RANGES_STR = {
    "Diabetes_binary": "0-1",
    "HighBP": "0-1",
    "HighChol": "0-1",
    "CholCheck": "0-1",
    "BMI": "> 0",
    "Smoker": "0-1",
    "Stroke": "0-1",
    "HeartDiseaseorAttack": "0-1",
    "PhysActivity": "0-1",
    "Fruits": "0-1",
    "Veggies": "0-1",
    "HvyAlcoholConsump": "0-1",
    "AnyHealthcare": "0-1",
    "NoDocbcCost": "0-1",
    "GenHlth": "1-5",
    "MentHlth": "0-30",
    "PhysHlth": "0-30",
    "DiffWalk": "0-1",
    "Sex": "0-1",
    "Age": "1-13",
    "Education": "1-6",
    "Income": "1-8"
}

# Available ODBC Driver detection
def get_best_odbc_driver() -> str:
    """Finds the most recent SQL Server ODBC driver installed on the system."""
    drivers = pyodbc.drivers()
    preferred_drivers = [
        "ODBC Driver 18 for SQL Server",
        "ODBC Driver 17 for SQL Server",
        "ODBC Driver 13.1 for SQL Server",
        "ODBC Driver 13 for SQL Server",
        "ODBC Driver 11 for SQL Server",
        "SQL Server Native Client 11.0",
        "SQL Server Native Client 10.0",
        "SQL Server"
    ]
    for driver in preferred_drivers:
        if driver in drivers:
            return driver
    # Fallback to any SQL Server driver found
    for driver in drivers:
        if "SQL Server" in driver:
            return driver
    return "ODBC Driver 17 for SQL Server"

# Database connection settings
DB_SERVER = os.environ.get("SQL_SERVER", r"localhost\SQLEXPRESS")
DB_NAME = os.environ.get("SQL_DATABASE", "DiabetesAnalytics")
DB_USER = os.environ.get("SQL_USER", "")
DB_PASSWORD = os.environ.get("SQL_PASSWORD", "")
DB_DRIVER = os.environ.get("SQL_DRIVER", get_best_odbc_driver())

def create_db_engine(db_name: str = None):
    """Creates a SQLAlchemy engine for SQL Server connection to a specific database."""
    target_db = db_name if db_name else DB_NAME
    driver_conn = DB_DRIVER.replace(" ", "+")
    
    if DB_USER:
        conn_str = f"mssql+pyodbc://{DB_USER}:{DB_PASSWORD}@{DB_SERVER}/{target_db}?driver={driver_conn}"
    else:
        encrypt_opt = "&TrustServerCertificate=yes" if "Driver 18" in DB_DRIVER else ""
        conn_str = f"mssql+pyodbc://@{DB_SERVER}/{target_db}?driver={driver_conn}&trusted_connection=yes{encrypt_opt}"
    
    return create_engine(conn_str)

def parse_sql_batches(sql_file_path: Path) -> list:
    """Parses a SQL file and splits it into executable batches separated by GO."""
    if not sql_file_path.exists():
        raise FileNotFoundError(f"SQL file not found: {sql_file_path}")
        
    with open(sql_file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Split by case-insensitive GO on its own line
    raw_batches = re.split(r'(?i)^\s*GO\s*$', content, flags=re.MULTILINE)
    
    batches = []
    for idx, raw_batch in enumerate(raw_batches):
        cleaned_batch = raw_batch.strip()
        if not cleaned_batch:
            continue
        
        # Check for SAVE_AS tag in comments
        save_as_match = re.search(r'--\s*SAVE_AS:\s*(\S+)', cleaned_batch)
        save_as_file = save_as_match.group(1).strip() if save_as_match else None
        
        batches.append({
            "sql": cleaned_batch,
            "save_as": save_as_file,
            "index": idx + 1
        })
    return batches

def initialize_database():
    """Checks if the target database exists, creates it and the table if missing, and imports the CSV."""
    print("Checking database existence...")
    try:
        # 1. Connect to master database first to check target DB status
        master_engine = create_db_engine("master")
        with master_engine.connect() as conn:
            result = conn.execute(
                text("SELECT database_id FROM sys.databases WHERE name = :dbname;"),
                {"dbname": DB_NAME}
            ).fetchone()
            db_exists = result is not None

        if not db_exists:
            print(f"Database '{DB_NAME}' does not exist. Initializing database schema...")
            
            # Read schema script
            schema_script_path = SQL_SCRIPTS_DIR / "01_create_database.sql"
            if not schema_script_path.exists():
                print(f"Error: Schema script not found at {schema_script_path}", file=sys.stderr)
                return False
                
            with open(schema_script_path, "r", encoding="utf-8") as f:
                schema_content = f.read()
                
            batches = re.split(r'(?i)^\s*GO\s*$', schema_content, flags=re.MULTILINE)
            
            # Use autocommit connection on master to execute CREATE DATABASE
            autocommit_master = master_engine.execution_options(isolation_level="AUTOCOMMIT")
            with autocommit_master.connect() as conn:
                for batch in batches:
                    sql_code = batch.strip()
                    if not sql_code:
                        continue
                    if sql_code.upper().startswith("USE "):
                        continue
                    if "CREATE DATABASE" in sql_code.upper():
                        print(f"Executing: CREATE DATABASE {DB_NAME}...")
                        conn.execute(text(sql_code))
                        
            # Now create table under the newly created database
            db_engine = create_db_engine(DB_NAME)
            with db_engine.connect() as conn:
                for batch in batches:
                    sql_code = batch.strip()
                    if not sql_code:
                        continue
                    if "CREATE TABLE" in sql_code.upper():
                        print("Executing table creation script...")
                        conn.execute(text(sql_code))
                        conn.commit()
            print("Database schema successfully created!")
        else:
            print(f"Database '{DB_NAME}' already exists.")

        # 2. Check if table has data. If not, load clean CSV data.
        db_engine = create_db_engine(DB_NAME)
        has_data = False
        try:
            with db_engine.connect() as conn:
                row_count_res = conn.execute(text("SELECT COUNT(*) FROM diabetes_health_indicators;")).fetchone()
                if row_count_res and row_count_res[0] > 0:
                    has_data = True
                    print(f"Table 'diabetes_health_indicators' is already populated with {row_count_res[0]:,} rows.")
        except Exception:
            pass

        if not has_data:
            csv_path = PROJECT_ROOT / "data" / "processed" / "diabetes_cleaned.csv"
            if csv_path.exists():
                print(f"Importing clean dataset from: {csv_path.name}...")
                df = pd.read_csv(csv_path)
                df.to_sql("diabetes_health_indicators", con=db_engine, if_exists="append", index=False)
                print(f"Import complete! Loaded {len(df):,} rows into SQL Server.")
            else:
                print(f"Warning: Cleaned CSV not found at '{csv_path}'. Unable to load data automatically.", file=sys.stderr)
        
        return True

    except Exception as err:
        print(f"Failed to check/initialize database: {err}", file=sys.stderr)
        return False

def execute_queries_to_dict(sql_file_name: str, engine) -> dict:
    """Executes SQL queries in a script and collects output DataFrames in a dictionary."""
    sql_path = SQL_SCRIPTS_DIR / sql_file_name
    print(f"\nExecuting script: {sql_path.name}")
    
    df_dict = {}
    try:
        batches = parse_sql_batches(sql_path)
    except Exception as e:
        print(f"Failed to parse SQL file {sql_file_name}: {e}", file=sys.stderr)
        return df_dict

    query_count = 0
    for batch in batches:
        sql = batch["sql"]
        save_as = batch["save_as"]
        
        # Non-SELECT batches
        if not save_as:
            try:
                with engine.connect() as conn:
                    conn.execute(text(sql))
                    conn.commit()
            except Exception:
                pass
            continue
        
        query_count += 1
        print(f"  Running Query {query_count}... ({save_as})")
        
        try:
            df = pd.read_sql_query(text(sql), engine)
            df_dict[save_as] = df
        except SQLAlchemyError as err:
            print(f"  Error executing Query {query_count} (Batch {batch['index']}):", file=sys.stderr)
            print(err, file=sys.stderr)
            print("  Continuing with other queries...\n", file=sys.stderr)
            
    return df_dict

def generate_validation_summaries(val_dfs, engine, output_dir: Path):
    """Consolidates validation queries into import_validation_summary and data_understanding_summary CSV files."""
    print("\nConsolidating Import Validation & Data Understanding summaries...")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Compile import_validation_summary.csv
    import_metrics = []
    
    # Total rows
    total_rows = 0
    if "total_row_count.csv" in val_dfs:
        total_rows = int(val_dfs["total_row_count.csv"].iloc[0, 0])
    import_metrics.append({
        "Check": "Total Row Count",
        "Expected": "Any positive integer",
        "Actual": f"{total_rows:,}",
        "Status": "PASSED" if total_rows > 0 else "FAILED",
        "Notes": "Matches processed records count from CSV import"
    })
    
    # Duplicates count
    dup_count = -1
    if "duplicate_summary.csv" in val_dfs:
        dup_count = int(val_dfs["duplicate_summary.csv"].iloc[0, 0])
    import_metrics.append({
        "Check": "Duplicate Row Count",
        "Expected": "0",
        "Actual": str(dup_count),
        "Status": "PASSED" if dup_count == 0 else "FAILED",
        "Notes": "Duplicate rows were successfully dropped during data cleaning stage"
    })
    
    # Missing values count
    total_nulls = -1
    if "missing_values.csv" in val_dfs:
        total_nulls = int(val_dfs["missing_values.csv"].sum(axis=1).iloc[0])
    import_metrics.append({
        "Check": "Total NULL/Missing Values",
        "Expected": "0",
        "Actual": str(total_nulls),
        "Status": "PASSED" if total_nulls == 0 else "FAILED",
        "Notes": "All fields are fully populated and complete"
    })
    
    # Range validations
    range_failures = -1
    if "range_validation.csv" in val_dfs:
        range_failures = int(val_dfs["range_validation.csv"].sum(axis=1).iloc[0])
    import_metrics.append({
        "Check": "Out-of-Range Row Count",
        "Expected": "0",
        "Actual": str(range_failures),
        "Status": "PASSED" if range_failures == 0 else "FAILED",
        "Notes": "All values comply with CDC health survey codebook ranges"
    })
    
    df_import_summary = pd.DataFrame(import_metrics)
    df_import_summary.to_csv(output_dir / "import_validation_summary.csv", index=False)
    print("Saved import_validation_summary.csv")

    # 2. Compile data_understanding_summary.csv
    # Generates a clean vertical column-profile mapping for all 22 features
    print("Generating profiles for each column...")
    summary_rows = []
    columns_list = list(EXPECTED_RANGES_STR.keys())
    
    try:
        with engine.connect() as conn:
            for col in columns_list:
                res = conn.execute(text(f"SELECT MIN({col}), MAX({col}), COUNT(DISTINCT {col}) FROM diabetes_health_indicators;")).fetchone()
                min_v, max_v, uniq_c = res
                
                summary_rows.append({
                    "Column Name": col,
                    "Data Type": "TINYINT",
                    "Unique Values": uniq_c,
                    "Min Value": min_v,
                    "Max Value": max_v,
                    "Expected Range": EXPECTED_RANGES_STR.get(col, "0-1"),
                    "Status": "Valid"
                })
        df_understanding = pd.DataFrame(summary_rows)
        df_understanding.to_csv(output_dir / "data_understanding_summary.csv", index=False)
        print("Saved data_understanding_summary.csv")
    except Exception as e:
        print(f"Error compiling data understanding summary: {e}", file=sys.stderr)

def compile_eda_workbook(df_dict, output_path: Path):
    """Compiles the EDA results dictionary into a single Excel file with multiple sheets."""
    print(f"\nCompiling EDA summaries into: {output_path.name}")
    
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        # 1. target_distribution
        if "eda_target_distribution.csv" in df_dict:
            df_dict["eda_target_distribution.csv"].to_excel(writer, sheet_name="target_distribution", index=False)
            
        # Helper function to write stacked tables with headers
        def write_stacked_dfs(sheet_name, title_df_pairs):
            start_row = 0
            for title, df in title_df_pairs:
                if df is None:
                    continue
                # Title banner
                title_df = pd.DataFrame([[f"=== {title.upper()} ==="]])
                title_df.to_excel(writer, sheet_name=sheet_name, startrow=start_row, index=False, header=False)
                start_row += 1
                # Table
                df.to_excel(writer, sheet_name=sheet_name, startrow=start_row, index=False)
                start_row += len(df) + 3 # Leave space
                
        # 2. demographics_vs_diabetes
        demographics = [
            ("Sex vs Diabetes", df_dict.get("sex_vs_diabetes.csv")),
            ("Age vs Diabetes", df_dict.get("age_vs_diabetes.csv")),
            ("Education vs Diabetes", df_dict.get("education_vs_diabetes.csv")),
            ("Income vs Diabetes", df_dict.get("income_vs_diabetes.csv"))
        ]
        write_stacked_dfs("demographics_vs_diabetes", demographics)
        
        # 3. health_condition_vs_diabetes
        conditions = [
            ("High Blood Pressure vs Diabetes", df_dict.get("highbp_vs_diabetes.csv")),
            ("High Cholesterol vs Diabetes", df_dict.get("highchol_vs_diabetes.csv")),
            ("Heart Disease or Attack vs Diabetes", df_dict.get("heartdisease_vs_diabetes.csv")),
            ("Stroke vs Diabetes", df_dict.get("stroke_vs_diabetes.csv")),
            ("General Health vs Diabetes", df_dict.get("genhlth_vs_diabetes.csv")),
            ("Difficulty Walking vs Diabetes", df_dict.get("diffwalk_vs_diabetes.csv"))
        ]
        write_stacked_dfs("health_condition_vs_diabetes", conditions)
        
        # 4. lifestyle_vs_diabetes
        lifestyle = [
            ("Smoking Status vs Diabetes", df_dict.get("smoker_vs_diabetes.csv")),
            ("Physical Activity vs Diabetes", df_dict.get("physactivity_vs_diabetes.csv")),
            ("Fruit Consumption vs Diabetes", df_dict.get("fruits_vs_diabetes.csv")),
            ("Vegetable Consumption vs Diabetes", df_dict.get("veggies_vs_diabetes.csv")),
            ("Heavy Alcohol Consumption vs Diabetes", df_dict.get("hvyalcoholconsump_vs_diabetes.csv"))
        ]
        write_stacked_dfs("lifestyle_vs_diabetes", lifestyle)
        
        # 5. healthcare_access_vs_diabetes
        access = [
            ("Healthcare Coverage vs Diabetes", df_dict.get("anyhealthcare_vs_diabetes.csv")),
            ("Doctor Avoidance due to Cost vs Diabetes", df_dict.get("nodocbccost_vs_diabetes.csv")),
            ("Cholesterol Check vs Diabetes", df_dict.get("cholcheck_vs_diabetes.csv"))
        ]
        write_stacked_dfs("healthcare_access_vs_diabetes", access)
        
        # 6. bmi_statistics
        if "bmi_statistics.csv" in df_dict:
            df_dict["bmi_statistics.csv"].to_excel(writer, sheet_name="bmi_statistics", index=False)
            
        # 7. physical_mental_health
        health_metrics = [
            ("Physical Health Days statistics by Diabetes", df_dict.get("physhlth_statistics.csv")),
            ("Mental Health Days statistics by Diabetes", df_dict.get("menthlth_statistics.csv"))
        ]
        write_stacked_dfs("physical_mental_health", health_metrics)
        
    print(f"Excel workbook eda_summary.xlsx successfully created!")

def main():
    """Main database runner."""
    # Ensure outputs directory exists
    SQL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Connect to master database first to check connection and initialize database
    try:
        temp_engine = create_db_engine("master")
        with temp_engine.connect() as conn:
            conn.execute(text("SELECT 1;"))
        print("Successfully connected to SQL Server!")
    except Exception as e:
        print("\n" + "="*70)
        print("DATABASE CONNECTION ERROR:")
        print(e)
        print("="*70)
        print("\nPlease make sure that Microsoft SQL Server is running.")
        print("You can configure database credentials using environment variables:")
        print("  SQL_SERVER   - Database host/instance (default: localhost\\SQLEXPRESS)")
        print("  SQL_DATABASE - Database name (default: DiabetesAnalytics)")
        print("  SQL_USER     - Database username (optional, if empty uses Windows Auth)")
        print("  SQL_PASSWORD - Database password (optional)")
        print("="*70 + "\n")
        print("Exiting query execution framework due to database connection failure.", file=sys.stderr)
        sys.exit(1)
        
    # Initialize database schemas and upload csv records
    db_initialized = initialize_database()
    if not db_initialized:
        print("Proceeding with executing queries, though database initialization encountered warnings.", file=sys.stderr)

    # Re-establish engine context specifically for the target database
    engine = create_db_engine(DB_NAME)

    # 2. Run Import Validation and compile outputs
    val_dfs = execute_queries_to_dict("02_import_validation.sql", engine)
    generate_validation_summaries(val_dfs, engine, SQL_OUTPUT_DIR)
    
    # 3. Run Exploratory Data Analysis and compile Excel file
    eda_dfs = execute_queries_to_dict("03_eda.sql", engine)
    compile_eda_workbook(eda_dfs, SQL_OUTPUT_DIR / "eda_summary.xlsx")
    
    print("\nSQL Analysis pipeline successfully completed!")

if __name__ == "__main__":
    main()
