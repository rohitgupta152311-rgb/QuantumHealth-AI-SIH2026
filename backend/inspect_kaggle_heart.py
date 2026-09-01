from pathlib import Path
import pandas as pd

kaggle_file = Path(
    r"C:\Users\kumar\.cache\kagglehub\datasets\johnsmith88"
    r"\heart-disease-dataset\versions\2\heart.csv"
)

current_file = Path("heart_training_data.csv")

kaggle_df = pd.read_csv(kaggle_file)
current_df = pd.read_csv(current_file)

unique_kaggle = kaggle_df.drop_duplicates().copy()

print("Kaggle total rows:", len(kaggle_df))
print("Kaggle duplicate rows removed:", kaggle_df.duplicated().sum())
print("Kaggle unique rows:", len(unique_kaggle))

print("\nKaggle value counts:")
for column in ["cp", "slope", "thal", "target"]:
    print(f"\n{column}:")
    print(unique_kaggle[column].value_counts().sort_index())

print("\nCurrent training file value counts:")
for column in ["cp", "slope", "thal", "label"]:
    print(f"\n{column}:")
    print(current_df[column].value_counts().sort_index())