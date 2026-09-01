from pathlib import Path
import pandas as pd

columns = [
    "age", "sex", "cp", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak",
    "slope", "ca", "thal", "label"
]

# Your old verified 297-row dataset
old_file = Path("heart_training_data.csv")

# New downloaded dataset
new_file = Path(r"C:\Users\kumar\Downloads\heart (1).csv")

# Final merged dataset
output_file = Path("heart_training_merged.csv")

old_df = pd.read_csv(old_file)

new_df = pd.read_csv(new_file)

# New file uses target; backend needs label
new_df = new_df.rename(columns={"target": "label"})

# Keep only backend-required columns
old_df = old_df[columns].copy()
new_df = new_df[columns].copy()

print("Old clean rows:", len(old_df))
print("New rows before duplicate removal:", len(new_df))

# Remove duplicates inside the new dataset
new_df = new_df.drop_duplicates()

print("New unique rows:", len(new_df))

# Combine both datasets
combined_df = pd.concat([old_df, new_df], ignore_index=True)

# If any duplicate exists across both files, keep only the first copy
combined_df = combined_df.drop_duplicates()

# Final checks
print("Final combined unique rows:", len(combined_df))
print("\nLabel counts:")
print(combined_df["label"].value_counts())

print("\nMissing values:")
print(combined_df.isna().sum().sum())

combined_df.to_csv(output_file, index=False, encoding="utf-8")

print("\nSaved final file:", output_file.resolve())