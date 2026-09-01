from pathlib import Path
import pandas as pd

kaggle_file = Path(
    r"C:\Users\kumar\.cache\kagglehub\datasets\johnsmith88"
    r"\heart-disease-dataset\versions\2\heart.csv"
)

raw = pd.read_csv(kaggle_file).drop_duplicates().copy()
current = pd.read_csv("heart_training_data.csv").copy()

# Only stable clinical numeric columns.
# cp, slope, thal, target/label intentionally excluded.
match_columns = [
    "age", "sex", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak"
]

matches = raw.merge(
    current,
    on=match_columns,
    how="inner",
    suffixes=("_kaggle", "_current"),
)

print("Kaggle unique rows:", len(raw))
print("Current rows:", len(current))
print("Matches using stable columns:", len(matches))

if len(matches) > 0:
    print("\ncp mapping evidence:")
    print(matches.groupby(["cp_kaggle", "cp_current"]).size())

    print("\nslope mapping evidence:")
    print(matches.groupby(["slope_kaggle", "slope_current"]).size())

    print("\nthal mapping evidence:")
    print(matches.groupby(["thal_kaggle", "thal_current"]).size())

    print("\ntarget-to-label evidence:")
    print(matches.groupby(["target", "label"]).size())
    