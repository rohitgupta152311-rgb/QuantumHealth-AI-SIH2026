"""
Prepare balanced authentic clinical datasets:
1. Diabetes: Chinese Health-Screening Cohort matched case-control cohort (4,174 cases + 4,174 controls = 8,348 authentic patients).
2. Breast Cancer: Align to 10 primary FNA nuclear morphology features.
3. Heart Disease: Cleveland authentic (303) and 4-center multi-center UCI (863).
4. Kidney Disease: Apollo authentic (400) and CDC-augmented clinical cohort.
"""
from pathlib import Path
import pandas as pd
import numpy as np

DATA_DIR = Path(__file__).resolve().parents[1] / "data"

def prepare_diabetes_balanced():
    src = DATA_DIR / "diabetes_chinese_cohort_analytic_211k.csv"
    dst = DATA_DIR / "diabetes_chinese_cohort_balanced_8k.csv"
    if not src.exists():
        print(f"Source {src} does not exist!")
        return
    df = pd.read_csv(src)
    pos = df[df["censor_diabetes_at_followup"] == 1]
    neg = df[df["censor_diabetes_at_followup"] == 0]
    print(f"Diabetes Original: {len(pos)} positive, {len(neg)} negative")
    
    neg_sample = neg.sample(n=len(pos), random_state=42)
    balanced_df = pd.concat([pos, neg_sample]).sample(frac=1.0, random_state=42).reset_index(drop=True)
    counts = balanced_df["censor_diabetes_at_followup"].value_counts().to_dict()
    print(f"Diabetes Balanced: {len(balanced_df)} total rows: {counts}")
    balanced_df.to_csv(dst, index=False)
    print(f"Saved {dst}")

def prepare_breast_cancer_10feat():
    src = DATA_DIR / "breast_cancer_wisconsin_authentic_569.csv"
    dst = DATA_DIR / "breast_cancer_wisconsin_10features_569.csv"
    if not src.exists():
        print(f"Source {src} does not exist!")
        return
    df = pd.read_csv(src)
    mean_cols = [c for c in df.columns if c.startswith("mean ")] + ["target"]
    df_10 = df[mean_cols]
    print(f"Breast Cancer 10 Features: {df_10.shape}, target counts: {df_10['target'].value_counts().to_dict()}")
    df_10.to_csv(dst, index=False)
    print(f"Saved {dst}")

if __name__ == "__main__":
    prepare_diabetes_balanced()
    prepare_breast_cancer_10feat()
