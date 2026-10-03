"""
Dataset Authenticity Audit for ArogyaDristi
============================================
Checks whether each dataset is real clinical data or synthetic/augmented.
Tests: statistical distributions, correlations, duplicates, value patterns.
"""
import pandas as pd
import numpy as np
from pathlib import Path
from collections import Counter

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

def audit_dataset(name, filepath, target_col='target', expected_source=""):
    print(f"\n{'='*70}")
    print(f"AUDIT: {name}")
    print(f"File: {filepath.name}")
    print(f"Expected Source: {expected_source}")
    print(f"{'='*70}")
    
    if not filepath.exists():
        print("  [MISSING] File does not exist!")
        return
    
    df = pd.read_csv(filepath)
    n_rows, n_cols = df.shape
    print(f"\n  Shape: {n_rows:,} rows x {n_cols} columns")
    print(f"  Columns: {list(df.columns)}")
    
    # 1. Check for exact duplicates
    n_dupes = df.duplicated().sum()
    dupe_pct = n_dupes / n_rows * 100
    print(f"\n  [DUPLICATES]")
    print(f"    Exact duplicate rows: {n_dupes:,} ({dupe_pct:.1f}%)")
    if dupe_pct > 30:
        print(f"    ** WARNING: >30% duplicates suggests augmentation/repetition **")
    
    # 2. Check unique value counts per column
    print(f"\n  [UNIQUE VALUES PER COLUMN]")
    suspicious_cols = []
    for col in df.columns:
        if col == target_col:
            continue
        nuniq = df[col].nunique()
        ratio = nuniq / n_rows
        flag = ""
        if df[col].dtype in ['float64', 'float32'] and nuniq < 20 and n_rows > 1000:
            flag = " ** SUSPICIOUS: continuous col with <20 unique values **"
            suspicious_cols.append(col)
        elif df[col].dtype in ['float64', 'float32'] and ratio < 0.001 and n_rows > 10000:
            flag = " ** SUSPICIOUS: very low cardinality for continuous data **"
            suspicious_cols.append(col)
        print(f"    {col}: {nuniq:,} unique ({ratio:.4f} ratio){flag}")
    
    # 3. Check target distribution
    if target_col in df.columns:
        tgt = df[target_col]
        print(f"\n  [TARGET DISTRIBUTION]")
        vc = tgt.value_counts()
        for val, cnt in vc.items():
            print(f"    {val}: {cnt:,} ({cnt/n_rows*100:.1f}%)")
        # Check if perfectly balanced (suspicious for real data)
        if len(vc) == 2:
            balance = min(vc.values) / max(vc.values)
            if balance > 0.95 and n_rows > 5000:
                print(f"    ** WARNING: Near-perfect class balance ({balance:.3f}) is unusual for real clinical data **")
    
    # 4. Check for rounded/binned values (sign of synthetic data)
    print(f"\n  [VALUE PATTERNS]")
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if target_col in numeric_cols:
        numeric_cols.remove(target_col)
    
    for col in numeric_cols[:6]:  # Check first 6 numeric columns
        vals = df[col].dropna()
        if len(vals) == 0:
            continue
        # Check if all values are integers (suspicious for continuous measurements)
        is_integer = (vals == vals.astype(int)).all()
        # Check decimal precision
        if not is_integer:
            decimals = vals.apply(lambda x: len(str(x).split('.')[-1]) if '.' in str(x) else 0)
            avg_decimals = decimals.mean()
            max_decimals = decimals.max()
        else:
            avg_decimals = 0
            max_decimals = 0
        
        # Check for suspicious uniform distributions
        hist, _ = np.histogram(vals, bins=20)
        hist_cv = np.std(hist) / (np.mean(hist) + 1e-10)  # coefficient of variation
        
        flag = ""
        if hist_cv < 0.15 and n_rows > 5000:
            flag = " ** SUSPICIOUS: too uniform (CV={:.3f}) **".format(hist_cv)
        
        print(f"    {col}: min={vals.min():.2f}, max={vals.max():.2f}, "
              f"mean={vals.mean():.2f}, std={vals.std():.2f}, "
              f"int_only={is_integer}, avg_decimals={avg_decimals:.1f}{flag}")
    
    # 5. Check correlation matrix for suspicious patterns
    print(f"\n  [CORRELATION CHECK]")
    if len(numeric_cols) >= 3:
        corr = df[numeric_cols[:10]].corr()
        # Check for unrealistically high correlations between unrelated features
        high_corrs = []
        for i in range(len(corr.columns)):
            for j in range(i+1, len(corr.columns)):
                r = abs(corr.iloc[i, j])
                if r > 0.95:
                    high_corrs.append((corr.columns[i], corr.columns[j], r))
        if high_corrs:
            print(f"    ** WARNING: {len(high_corrs)} pairs with |r| > 0.95 (may indicate derived/synthetic features) **")
            for c1, c2, r in high_corrs[:5]:
                print(f"      {c1} <-> {c2}: r={r:.4f}")
        else:
            print(f"    No unrealistically high correlations found (good sign)")
    
    # 6. Check missing values
    print(f"\n  [MISSING VALUES]")
    miss = df.isnull().sum()
    total_miss = miss.sum()
    if total_miss == 0:
        if n_rows > 10000:
            print(f"    ** NOTE: ZERO missing values in {n_rows:,} rows - unusual for real clinical data **")
        else:
            print(f"    No missing values")
    else:
        for col in miss[miss > 0].index:
            print(f"    {col}: {miss[col]:,} missing ({miss[col]/n_rows*100:.1f}%)")
    
    # 7. Check if values match known clinical ranges
    print(f"\n  [CLINICAL RANGE CHECK]")
    clinical_ranges = {
        'age': (0, 120), 'Age': (0, 120), 'AGE_AT_DIAGNOSIS': (0, 120),
        'trestbps': (50, 250), 'bp': (30, 250), 'SBP_mmHg': (60, 250),
        'chol': (80, 600), 'bgr': (40, 600),
        'thalach': (50, 230),
        'BMI': (10, 70), 'bmi': (10, 70),
        'hemo': (3, 20), 'sc': (0.1, 20),
    }
    for col, (low, high) in clinical_ranges.items():
        if col in df.columns:
            vals = df[col].dropna()
            out_of_range = ((vals < low) | (vals > high)).sum()
            pct = out_of_range / len(vals) * 100
            status = "OK" if pct < 2 else f"** {pct:.1f}% out of range **"
            print(f"    {col}: range [{vals.min():.1f}, {vals.max():.1f}] expected [{low}, {high}] - {status}")
    
    # 8. Final verdict
    print(f"\n  [VERDICT]")
    issues = []
    if dupe_pct > 30:
        issues.append("High duplicate rate")
    if suspicious_cols:
        issues.append(f"Suspicious columns: {suspicious_cols}")
    if total_miss == 0 and n_rows > 10000:
        issues.append("Zero missing values (unusual for large clinical data)")
    
    if not issues:
        print(f"    LIKELY AUTHENTIC - No major red flags detected")
    else:
        print(f"    CONCERNS FOUND:")
        for issue in issues:
            print(f"      - {issue}")


# Run audits
if __name__ == "__main__":
    print("=" * 70)
    print("AROGYADRISTI DATASET AUTHENTICITY AUDIT")
    print("=" * 70)
    
    audit_dataset(
        "Heart Disease (200K)",
        DATA_DIR / "heart_disease_uci_cdc.csv",
        target_col='target',
        expected_source="UCI Multi-center + CDC BRFSS augmented"
    )
    
    audit_dataset(
        "Heart Disease - REAL 4-center UCI (863)",
        DATA_DIR / "heart_disease_brfss_253k.csv",
        target_col='target',
        expected_source="UCI Cleveland + Hungarian + Switzerland + VA Long Beach (863 real clinical records)"
    )
    
    audit_dataset(
        "Heart Disease - Original Cleveland (303)",
        DATA_DIR / "heart_disease_cleveland_authentic_303.csv",
        target_col='target',
        expected_source="UCI Cleveland Clinic Foundation (Janosi et al., 1989)"
    )
    
    audit_dataset(
        "Kidney Disease (100K)",
        DATA_DIR / "kidney_disease_apollo_cdc.csv",
        target_col='target',
        expected_source="Apollo Hospitals + CDC augmented"
    )
    
    audit_dataset(
        "Kidney Disease - Original UCI (400)",
        DATA_DIR / "kidney_disease_apollo_authentic_400.csv",
        target_col='target',
        expected_source="UCI/Apollo Hospitals (Rubini et al., 2015)"
    )
    
    audit_dataset(
        "Breast Cancer (50K augmented)",
        DATA_DIR / "breast_cancer_wisconsin_augmented.csv",
        target_col='target',
        expected_source="UCI WDBC (Street et al., 1993) SMOTE-augmented"
    )
    
    audit_dataset(
        "Breast Cancer METABRIC (2,509 real)",
        DATA_DIR / "breast_cancer_metabric_clinical.csv",
        target_col='VITAL_STATUS',
        expected_source="cBioPortal METABRIC (Curtis et al., 2012)"
    )
    
    audit_dataset(
        "Diabetes (211K)",
        DATA_DIR / "diabetes_chinese_cohort_analytic_211k.csv",
        target_col='incident_diabetes',
        expected_source="Dryad/BMJ Open Chinese Cohort (Chen et al., 2019)"
    )
    
    audit_dataset(
        "Diabetes CDC BRFSS (253K)",
        DATA_DIR / "diabetes_cdc_brfss.csv",
        target_col='Outcome',
        expected_source="CDC BRFSS / Pima Indians Diabetes"
    )
