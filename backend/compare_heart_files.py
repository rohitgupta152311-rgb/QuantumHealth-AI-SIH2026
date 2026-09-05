from pathlib import Path
import pandas as pd

# File paths
FILES = {
    "New downloaded file": Path(r"C:\Users\kumar\Downloads\heart_disease_uci_cdc.csv"),
    "Heart training data": Path("heart_training_data.csv"),
    "Heart additional data": Path("heart_additional_unique.csv"),
}

EXPECTED_COLUMNS = [
    "age", "sex", "cp", "trestbps", "chol", "fbs",
    "restecg", "thalach", "exang", "oldpeak",
    "slope", "ca", "thal", "label"
]


def load_and_prepare(path):
    df = pd.read_csv(path)

    # New dataset may use target instead of label
    if "target" in df.columns and "label" not in df.columns:
        df = df.rename(columns={"target": "label"})

    return df


def show_summary(name, df):
    print("\n" + "=" * 70)
    print(name)
    print("=" * 70)

    print("Rows, Columns:", df.shape)
    print("Columns:", df.columns.tolist())
    print("Missing values:", df.isna().sum().sum())
    print("Duplicate full rows:", df.duplicated().sum())

    if "label" in df.columns:
        print("\nLabel counts:")
        print(df["label"].value_counts().sort_index())

        print("\nPositive label rate:")
        print(round(df["label"].mean() * 100, 2), "%")

    numeric_columns = [
        "age", "trestbps", "chol", "thalach", "oldpeak"
    ]

    available_columns = [
        column for column in numeric_columns
        if column in df.columns
    ]

    if available_columns:
        print("\nImportant feature ranges:")
        print(df[available_columns].agg(["min", "median", "max"]))

    if "thal" in df.columns:
        print("\nThal values:")
        print(sorted(df["thal"].dropna().unique()))


# Load every CSV
data = {}

for name, path in FILES.items():
    if not path.exists():
        print(f"\nERROR: File not found: {path.resolve()}")
        continue

    data[name] = load_and_prepare(path)
    show_summary(name, data[name])


# Compare schemas and exact overlapping rows
pairs = [
    ("New downloaded file", "Heart training data"),
    ("New downloaded file", "Heart additional data"),
    ("Heart training data", "Heart additional data"),
]

for first_name, second_name in pairs:
    if first_name not in data or second_name not in data:
        continue

    first_df = data[first_name]
    second_df = data[second_name]

    print("\n" + "#" * 70)
    print(f"COMPARE: {first_name}  VS  {second_name}")
    print("#" * 70)

    first_columns = first_df.columns.tolist()
    second_columns = second_df.columns.tolist()

    print("Same column order:", first_columns == second_columns)

    missing_in_first = set(second_columns) - set(first_columns)
    missing_in_second = set(first_columns) - set(second_columns)

    print("Missing in first file:", sorted(missing_in_first))
    print("Missing in second file:", sorted(missing_in_second))

    # Compare exact duplicate patient rows only if schemas match
    if set(EXPECTED_COLUMNS).issubset(first_df.columns) and set(EXPECTED_COLUMNS).issubset(second_df.columns):
        first_rows = first_df[EXPECTED_COLUMNS].drop_duplicates()
        second_rows = second_df[EXPECTED_COLUMNS].drop_duplicates()

        overlap = first_rows.merge(
            second_rows,
            on=EXPECTED_COLUMNS,
            how="inner"
        )

        print("Exact matching rows:", len(overlap))

print("\nComparison complete.")