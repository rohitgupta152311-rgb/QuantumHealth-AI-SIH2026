import pandas as pd

columns = [
    "age", "sex", "cp", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak",
    "slope", "ca", "thal", "target"
]

df = pd.read_csv(
    "heart_hungarian_raw.data",
    header=None,
    names=columns,
    na_values=["?"]
)

print("Rows and columns:")
print(df.shape)

print("\nFirst 5 rows:")
print(df.head())

print("\nMissing values per column:")
print(df.isna().sum())

print("\nTarget counts:")
print(df["target"].value_counts(dropna=False))

print("\nDuplicate rows:")
print(df.duplicated().sum())