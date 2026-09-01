from pathlib import Path
import pandas as pd
from sklearn.datasets import fetch_openml

# OpenML dataset ID 37 = Pima Indians Diabetes dataset
diabetes = fetch_openml(data_id=37, as_frame=True)

X = diabetes.data.copy()
y = diabetes.target.copy()

df = X.copy()
df["target"] = y

output_file = Path("diabetes_raw.csv")
df.to_csv(output_file, index=False, encoding="utf-8")

print("Diabetes dataset downloaded successfully.")
print("Rows and columns:", df.shape)
print("Columns:", df.columns.tolist())
print("Target counts:")
print(df["target"].value_counts())
print("Saved file:", output_file.resolve())
print("\nFirst 5 rows:")
print(df.head())