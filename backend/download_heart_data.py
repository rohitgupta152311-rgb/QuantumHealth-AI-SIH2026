from pathlib import Path
import pandas as pd
from ucimlrepo import fetch_ucirepo

# UCI Heart Disease dataset download
heart_disease = fetch_ucirepo(id=45)

# Features and original target
X = heart_disease.data.features.copy()
y = heart_disease.data.targets.copy()

# Target column ko simple name "target" do
target_column = y.columns[0]
y = y.rename(columns={target_column: "target"})

# Features + target ek CSV mein combine karo
df = pd.concat([X, y], axis=1)

# Original raw data save karo — is file ko manually edit mat karna
output_file = Path("heart_raw.csv")
df.to_csv(output_file, index=False, encoding="utf-8")

print("Heart dataset downloaded successfully.")
print("Rows and columns:", df.shape)
print("Columns:", df.columns.tolist())
print("Saved file:", output_file.resolve())
print("\nFirst 5 rows:")
print(df.head())