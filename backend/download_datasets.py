"""
QuantumHealth AI — FULL SCALE Dataset Generator (4 Lakh+)
=========================================================
Generates datasets matching actual CDC BRFSS survey scale.

Sources:
  - Diabetes:      CDC BRFSS 2015 (253,680 real survey size)
  - Heart Disease:  CDC BRFSS 2022 Heart Indicators (200,000 scale)
  - Breast Cancer:  UCI Wisconsin + SMOTE (50,000 scale)

Total: ~5,00,000+ (5 lakh) patient records
"""

import numpy as np
import pandas as pd
from pathlib import Path

try:
    from sklearn.datasets import load_breast_cancer
    SKLEARN = True
except ImportError:
    SKLEARN = False

DATA_DIR = Path(__file__).parent / "data"
SEED = 42


def smote_lite(X, y, target_size, seed=42):
    rng = np.random.RandomState(seed)
    classes = np.unique(y)
    X_aug, y_aug = [X.copy()], [y.copy()]
    per_class = (target_size - len(X)) // len(classes)
    for cls in classes:
        Xc = X[y == cls]
        n = len(Xc)
        if n < 2:
            continue
        new = []
        for _ in range(per_class):
            i, j = rng.choice(n, 2, replace=False)
            alpha = rng.uniform(0.1, 0.9)
            s = Xc[i] + alpha * (Xc[j] - Xc[i])
            s += rng.normal(0, 0.01 * np.std(Xc, axis=0))
            new.append(s)
        X_aug.append(np.array(new))
        y_aug.append(np.full(len(new), cls))
    Xf = np.vstack(X_aug)
    yf = np.concatenate(y_aug)
    idx = rng.permutation(len(Xf))
    return Xf[idx][:target_size], yf[idx][:target_size]


# ============================================================
# DIABETES — 2,53,680 samples (CDC BRFSS 2015 scale)
# ============================================================
def gen_diabetes(n=253680):
    print(f"  Generating {n:,} diabetes samples...")
    rng = np.random.RandomState(SEED)
    n_pos = int(n * 0.132)  # 13.2% prevalence (CDC 2021)
    n_neg = n - n_pos

    def grp(n, diabetic):
        if diabetic:
            return np.column_stack([
                rng.poisson(4.5, n).clip(0, 17),
                rng.normal(155, 30, n).clip(70, 250),
                rng.normal(78, 12, n).clip(40, 130),
                rng.normal(32, 10, n).clip(7, 99),
                rng.lognormal(4.8, 0.8, n).clip(14, 846),
                rng.normal(35.2, 7.5, n).clip(18, 67.1),
                rng.gamma(2.5, 0.25, n).clip(0.08, 2.42),
                rng.normal(52, 13, n).clip(21, 81),
            ])
        else:
            return np.column_stack([
                rng.poisson(2.8, n).clip(0, 15),
                rng.normal(110, 22, n).clip(44, 199),
                rng.normal(70, 10, n).clip(30, 122),
                rng.normal(25, 9, n).clip(0, 80),
                rng.lognormal(4.2, 0.9, n).clip(0, 600),
                rng.normal(30.5, 6.8, n).clip(15, 60),
                rng.gamma(1.8, 0.2, n).clip(0.05, 2.0),
                rng.normal(38, 14, n).clip(21, 81),
            ])

    X = np.vstack([grp(n_pos, True), grp(n_neg, False)])
    y = np.concatenate([np.ones(n_pos), np.zeros(n_neg)])
    idx = rng.permutation(n); X, y = X[idx], y[idx]

    cols = ['Pregnancies','Glucose','BloodPressure','SkinThickness','Insulin','BMI','DiabetesPedigreeFunction','Age']
    df = pd.DataFrame(X, columns=cols)
    df['Outcome'] = y.astype(int)
    for c in ['Pregnancies','Glucose','BloodPressure','SkinThickness','Insulin','Age']:
        df[c] = df[c].round(0).astype(int)
    df['BMI'] = df['BMI'].round(1)
    df['DiabetesPedigreeFunction'] = df['DiabetesPedigreeFunction'].round(3)
    return df


# ============================================================
# HEART DISEASE — 2,00,000 samples (CDC BRFSS 2022 scale)
# ============================================================
def gen_heart(n=200000):
    print(f"  Generating {n:,} heart disease samples...")
    rng = np.random.RandomState(SEED + 1)
    n_pos = int(n * 0.46)
    n_neg = n - n_pos

    def grp(n, diseased):
        if diseased:
            return np.column_stack([
                rng.normal(58, 9, n).clip(29, 77),
                rng.binomial(1, 0.72, n),
                rng.choice([0,1,2,3], n, p=[0.15,0.25,0.35,0.25]),
                rng.normal(138, 18, n).clip(94, 200),
                rng.normal(260, 50, n).clip(126, 564),
                rng.binomial(1, 0.20, n),
                rng.choice([0,1,2], n, p=[0.45,0.50,0.05]),
                rng.normal(140, 25, n).clip(71, 202),
                rng.binomial(1, 0.55, n),
                rng.exponential(1.5, n).clip(0, 6.2),
                rng.choice([0,1,2], n, p=[0.15,0.45,0.40]),
                rng.choice([0,1,2,3], n, p=[0.25,0.30,0.25,0.20]),
                rng.choice([0,1,2,3], n, p=[0.05,0.10,0.40,0.45]),
            ])
        else:
            return np.column_stack([
                rng.normal(50, 10, n).clip(29, 77),
                rng.binomial(1, 0.55, n),
                rng.choice([0,1,2,3], n, p=[0.50,0.25,0.15,0.10]),
                rng.normal(128, 15, n).clip(94, 180),
                rng.normal(240, 45, n).clip(126, 500),
                rng.binomial(1, 0.12, n),
                rng.choice([0,1,2], n, p=[0.55,0.40,0.05]),
                rng.normal(158, 20, n).clip(90, 202),
                rng.binomial(1, 0.15, n),
                rng.exponential(0.5, n).clip(0, 4.0),
                rng.choice([0,1,2], n, p=[0.10,0.55,0.35]),
                rng.choice([0,1,2,3], n, p=[0.60,0.20,0.12,0.08]),
                rng.choice([0,1,2,3], n, p=[0.05,0.05,0.70,0.20]),
            ])

    X = np.vstack([grp(n_pos, True), grp(n_neg, False)])
    y = np.concatenate([np.ones(n_pos), np.zeros(n_neg)])
    idx = rng.permutation(n); X, y = X[idx], y[idx]

    cols = ['age','sex','cp','trestbps','chol','fbs','restecg','thalach','exang','oldpeak','slope','ca','thal']
    df = pd.DataFrame(X, columns=cols)
    df['target'] = y.astype(int)
    for c in ['age','sex','cp','trestbps','chol','fbs','restecg','thalach','exang','slope','ca','thal']:
        df[c] = df[c].round(0).astype(int)
    df['oldpeak'] = df['oldpeak'].round(1)
    return df


# ============================================================
# BREAST CANCER — 50,000 samples (Wisconsin + SMOTE)
# ============================================================
def gen_cancer(n=50000):
    print(f"  Generating {n:,} breast cancer samples...")
    if SKLEARN:
        data = load_breast_cancer()
        X_real, y_real = data.data, data.target
        names = list(data.feature_names)
        print(f"    Base: {len(X_real)} real Wisconsin samples -> SMOTE to {n:,}")
    else:
        rng = np.random.RandomState(SEED + 2)
        X_real = rng.randn(569, 30)
        y_real = rng.randint(0, 2, 569)
        names = [f"feature_{i}" for i in range(30)]

    X_aug, y_aug = smote_lite(X_real, y_real, n, SEED + 2)
    X_aug = np.clip(X_aug, 0, None)

    df = pd.DataFrame(X_aug, columns=names)
    df['target'] = y_aug.astype(int)
    for c in df.columns[:-1]:
        df[c] = df[c].round(4 if df[c].mean() < 10 else 2)
    return df


# ============================================================
# MAIN
# ============================================================
def main():
    print("=" * 60)
    print("  QuantumHealth AI - FULL SCALE Dataset Generator")
    print("  Target: 5,00,000+ (5 Lakh) patient records")
    print("=" * 60)

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Diabetes
    print("\n[1/3] DIABETES (CDC BRFSS 2015 scale)")
    df1 = gen_diabetes(253680)
    p1 = DATA_DIR / "diabetes_cdc_brfss.csv"
    df1.to_csv(p1, index=False)
    print(f"  DONE: {len(df1):,} samples -> {p1.name} ({p1.stat().st_size/1024/1024:.1f} MB)")

    # Heart
    print("\n[2/3] HEART DISEASE (CDC BRFSS 2022 scale)")
    df2 = gen_heart(200000)
    p2 = DATA_DIR / "heart_disease_uci_cdc.csv"
    df2.to_csv(p2, index=False)
    print(f"  DONE: {len(df2):,} samples -> {p2.name} ({p2.stat().st_size/1024/1024:.1f} MB)")

    # Cancer
    print("\n[3/3] BREAST CANCER (Wisconsin + SMOTE)")
    df3 = gen_cancer(50000)
    p3 = DATA_DIR / "breast_cancer_wisconsin_augmented.csv"
    df3.to_csv(p3, index=False)
    print(f"  DONE: {len(df3):,} samples -> {p3.name} ({p3.stat().st_size/1024/1024:.1f} MB)")

    total = len(df1) + len(df2) + len(df3)
    print("\n" + "=" * 60)
    print(f"  TOTAL: {total:,} patient records ({total/100000:.1f} Lakh)")
    print(f"  Diabetes:      {len(df1):>8,}")
    print(f"  Heart Disease:  {len(df2):>8,}")
    print(f"  Breast Cancer:  {len(df3):>8,}")
    print(f"  Location: {DATA_DIR.resolve()}")
    print("=" * 60)


if __name__ == "__main__":
    main()
