from pathlib import Path
import pandas as pd

# Original raw dataset
input_file = Path("heart_raw.csv")

# Final clean file for model training
output_file = Path("heart_training_data.csv")

# Load data
df = pd.read_csv(
    input_file,
    na_values=["?", "", "NA", "null", "None"]
)

print("Original rows:", len(df))
print("Original columns:", df.columns.tolist())

# Backend ko exactly ye columns chahiye
feature_columns = [
    "age", "sex", "cp", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak",
    "slope", "ca", "thal"
]

required_columns = feature_columns + ["target"]

# Check required columns
missing_columns = [
    column for column in required_columns
    if column not in df.columns
]

if missing_columns:
    raise ValueError(
        f"Dataset mein required columns missing hain: {missing_columns}"
    )

# Sirf required columns rakho
df = df[required_columns].copy()

# Text/question-mark values ko numeric banane ki koshish
for column in required_columns:
    df[column] = pd.to_numeric(df[column], errors="coerce")

# Duplicate rows remove karo
before_duplicates = len(df)
df = df.drop_duplicates()
print("Duplicate rows removed:", before_duplicates - len(df))

# Missing/invalid values wali rows remove karo
before_missing = len(df)
df = df.dropna()
print("Rows removed due to missing values:", before_missing - len(df))

# UCI values ko backend format mein convert karo
df["cp"] = df["cp"] - 1
df["slope"] = df["slope"] - 1
df["thal"] = df["thal"].map({
    3: 0,   # normal
    6: 1,   # fixed defect
    7: 2    # reversible defect
})

# Invalid thal mapping wali rows remove karo
df = df.dropna(subset=["thal"])

# Target ko binary label mein convert karo
# 0 = no disease, 1/2/3/4 = disease present
df["label"] = (df["target"] > 0).astype(int)

# Original target hata do; model ke liye label use hoga
df = df.drop(columns=["target"])

# Final validation
if not set(df["label"].unique()).issubset({0, 1}):
    raise ValueError("Label column mein sirf 0 ya 1 hona chahiye.")

# Save clean UTF-8 training file
df.to_csv(output_file, index=False, encoding="utf-8")

print("\nCleaning successful.")
print("Final rows:", len(df))
print("Label counts:")
print(df["label"].value_counts())
print("\nSaved clean training file:", output_file.resolve())
print("\nFirst 5 rows:")
print(df.head())