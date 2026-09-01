from pathlib import Path
import pandas as pd

columns = [
    "age", "sex", "cp", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak",
    "slope", "ca", "thal", "label"
]

input_file = Path(r"C:\Users\kumar\Downloads\heart (1).csv")
output_file = Path("heart_additional_unique.csv")

df = pd.read_csv(input_file)

# Backend needs label, not target
df = df.rename(columns={"target": "label"})

# Keep only required columns
df = df[columns].copy()

# Remove the 723 duplicate rows inside this new file
df = df.drop_duplicates()

# Safety checks
print("Final new rows:", len(df))
print("Missing values:", df.isna().sum().sum())
print("Duplicate rows:", df.duplicated().sum())
print("\nLabel counts:")
print(df["label"].value_counts())

df.to_csv(output_file, index=False, encoding="utf-8")

print("\nSaved:", output_file.resolve())