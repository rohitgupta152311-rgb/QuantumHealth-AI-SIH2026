from pathlib import Path
import pandas as pd

input_file = Path("diabetes_raw.csv")
output_file = Path("diabetes_training_data.csv")

df = pd.read_csv(input_file)

print("Original rows:", len(df))
print("Original columns:", df.columns.tolist())

# Raw Pima/OpenML column names → your backend column names
column_mapping = {
    "preg": "Pregnancies",
    "plas": "Glucose",
    "pres": "BloodPressure",
    "skin": "SkinThickness",
    "insu": "Insulin",
    "mass": "BMI",
    "pedi": "DiabetesPedigreeFunction",
    "age": "Age",
}

df = df.rename(columns=column_mapping)

required_features = [
    "Pregnancies",
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
    "DiabetesPedigreeFunction",
    "Age",
]

required_columns = required_features + ["target"]

missing_columns = [
    column for column in required_columns
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        f"Required columns missing: {missing_columns}"
    )

df = df[required_columns].copy()

# Convert feature values to numeric
for column in required_features:
    df[column] = pd.to_numeric(df[column], errors="coerce")

# Remove duplicate rows
before_duplicates = len(df)
df = df.drop_duplicates()
print("Duplicate rows removed:", before_duplicates - len(df))

# In these five fields, 0 means unknown/missing for this dataset.
zero_as_missing = [
    "Glucose",
    "BloodPressure",
    "SkinThickness",
    "Insulin",
    "BMI",
]

for column in zero_as_missing:
    df.loc[df[column] == 0, column] = pd.NA

# Fill missing values with the median for each feature
for column in zero_as_missing:
    df[column] = df[column].fillna(df[column].median())

# Convert text target to binary label
target_text = df["target"].astype(str).str.strip().str.lower()

label_mapping = {
    "tested_negative": 0,
    "tested_positive": 1,
    "0": 0,
    "1": 1,
}

df["label"] = target_text.map(label_mapping)

if df["label"].isna().any():
    unknown_targets = df.loc[df["label"].isna(), "target"].unique()
    raise ValueError(
        f"Unknown target values found: {unknown_targets}"
    )

df["label"] = df["label"].astype(int)

# Remove original target column
df = df.drop(columns=["target"])

# Final safety validation
if df.isna().sum().sum() != 0:
    raise ValueError("Cleaning failed: missing values still exist.")

if not set(df["label"].unique()).issubset({0, 1}):
    raise ValueError("Label must contain only 0 and 1.")

df.to_csv(output_file, index=False, encoding="utf-8")

print("\nCleaning successful.")
print("Final rows:", len(df))
print("Label counts:")
print(df["label"].value_counts())
print("Saved file:", output_file.resolve())
print("\nFirst 5 rows:")
print(df.head())