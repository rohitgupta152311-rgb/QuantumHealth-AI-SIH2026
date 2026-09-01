import kagglehub
from kagglehub import KaggleDatasetAdapter

df = kagglehub.dataset_load(
    KaggleDatasetAdapter.PANDAS,
    "johnsmith88/heart-disease-dataset",
    "heart.csv",
)

print("Rows and columns:", df.shape)
print("Columns:", df.columns.tolist())
print("First 5 records:")
print(df.head())
print("\nDuplicate rows:", df.duplicated().sum())