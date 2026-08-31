import pandas as pd

df = pd.read_csv("diabetes_training_data.csv")

print("Total rows and columns:")
print(df.shape)

print("\nColumn names:")
print(df.columns.tolist())

print("\nFirst 5 rows:")
print(df.head())

print("\nLabel counts:")
print(df["label"].value_counts())

print("\nTotal missing values:")
print(df.isna().sum().sum())

print("\nDuplicate rows:")
print(df.duplicated().sum())

print("\nUnique label values:")
print(sorted(df["label"].unique()))
