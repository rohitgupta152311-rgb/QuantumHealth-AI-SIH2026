from pathlib import Path
import pandas as pd

kaggle_file = Path(
    r"C:\Users\kumar\.cache\kagglehub\datasets\johnsmith88"
    r"\heart-disease-dataset\versions\2\heart.csv"
)

features = [
    "age", "sex", "cp", "trestbps", "chol", "fbs", "restecg",
    "thalach", "exang", "oldpeak", "slope", "ca", "thal"
]

raw = pd.read_csv(kaggle_file).drop_duplicates().copy()
current = pd.read_csv("heart_training_data.csv").copy()

# Kaggle category codes -> current UCI-cleaned category codes.
raw = raw[raw["thal"] != 0].copy()
raw["cp"] = raw["cp"].map({0: 3, 1: 1, 2: 2, 3: 0})
raw["slope"] = raw["slope"].map({0: 2, 1: 1, 2: 0})
raw["thal"] = raw["thal"].map({1: 1, 2: 0, 3: 2})

# Kaggle target is opposite to our label convention.
raw["label"] = 1 - raw["target"].astype(int)

converted = raw[features + ["label"]].dropna().drop_duplicates()

all_columns = features + ["label"]

overlap = converted.merge(current, on=all_columns, how="inner")
only_kaggle = converted.merge(
    current, on=all_columns, how="left", indicator=True
)
only_kaggle = only_kaggle[only_kaggle["_merge"] == "left_only"]

print("Converted Kaggle rows:", len(converted))
print("Rows already present in current file:", len(overlap))
print("Possible new rows:", len(only_kaggle))

if len(only_kaggle) > 0:
    print("\nPossible new rows:")
    print(only_kaggle[all_columns].to_string(index=False))