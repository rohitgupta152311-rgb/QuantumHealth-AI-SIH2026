"""
Longitudinal Incident Diabetes Dataset Loader & Provenance Configuration
Cohort: Chinese Health-Screening Cohort (211,833 adults, 15 screening sites, median 3.12-year follow-up)
Citation: Chen, Y., Zhang, X.P., Yuan, J., Cai, B., Wang, X.L., Wu, X.L., Zhang, Y.H., Luo, X.Y.,
          Guo, T., Gao, X., & Su, J. (2018). Association of body mass index and age with incident
          diabetes in Chinese adults: a population-based cohort study. BMJ Open, 8(9), e021768.
Repository: Dryad Digital Repository. DOI: 10.5061/dryad.ft8750v
License: CC0 1.0 Universal Public Domain Dedication
Scale: 211,833 authentic clinical observations | Incident Events: 4,174 (1.97%) | Centers: 15
"""
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Tuple, List, Dict, Any

ANALYTIC_DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "diabetes_chinese_cohort_analytic_211k.csv"
LEGACY_DATA_FILE = Path(__file__).resolve().parents[2] / "data" / "diabetes_cdc_brfss.csv"
MANIFEST_FILE = Path(__file__).resolve().parents[2] / "data" / "chinese_cohort_manifest.json"

# Target variables and post-baseline observations strictly excluded from input predictors
TARGET_LEAKAGE_COLUMNS = [
    "id",
    "FPG_of_final_visit_mmol_L",
    "diabetes_diagnosed_during_followup",
    "censor_diabetes_at_followup",
    "year_of_followup",
]

SITE_COLUMN = "site"
TARGET_COLUMN = "censor_diabetes_at_followup"

DIABETES_CONFIG = {
    "disease_id": "diabetes",
    "display_name": "Incident Diabetes Risk in Chinese Health-Screening Cohort (Median 3.1-Year Follow-up)",
    "cohort_name": "Chinese Health-Screening Cohort",
    "schema_version": "v2.0_chinese_cohort",
    "is_synthetic_demonstration": False,
    "source_citation": (
        "Chen et al. (2018). Association of body mass index and age with incident diabetes in Chinese adults: "
        "a population-based cohort study. BMJ Open 8(9): e021768. Dryad DOI: 10.5061/dryad.ft8750v."
    ),
    "source_url": "https://doi.org/10.5061/dryad.ft8750v",
    "dataset_license": "CC0 1.0 Universal Public Domain Dedication",
    "source_rows": 211833,
    "incident_events": 4174,
    "controls_censored": 207659,
    "event_prevalence_pct": 1.97,
    "followup_median_years": 2.99,
    "followup_iqr_years": [2.16, 3.95],
    "followup_range_years": [2.00, 7.56],
    "screening_sites_count": 15,
    "sha256_hash": "ef24cffc16a72ef022cc48353c88cf8b758fba8fe05357bbf9b4f48b008760ef",
    "population_limitation": (
        "Model developed on Chinese adults across 15 health screening centers. "
        "Not calibrated or validated for Indian or Western populations."
    ),
    "prediction_horizon": "Longitudinal Incident Diabetes Risk (Median 3.12-Year Follow-up)",
    "evaluation_protocol": (
        "Grouped multi-center split (GroupShuffleSplit on 'site') ensuring zero site overlap between "
        "training, validation, and held-out test centers. LinearSVC with Platt probability calibration "
        "fitted on unaugmented validation prevalence (1.97%). Quantum VQC trained on real case-control "
        "subset from training sites with zero SMOTE."
    ),
    "target_leakage_excluded_columns": TARGET_LEAKAGE_COLUMNS,
    "features": [
        {
            "name": "Age",
            "label": "Patient Age",
            "unit": "years",
            "model_input_range": [20.0, 95.0],
            "missing_sentinels": [],
            "required": True,
            "description": "Patient age in years (adult cohort >= 20)"
        },
        {
            "name": "Gender",
            "label": "Gender",
            "unit": "code",
            "model_input_range": [1.0, 2.0],
            "missing_sentinels": [],
            "required": True,
            "description": "Biological sex: 1 = Male, 2 = Female"
        },
        {
            "name": "BMI",
            "label": "Body Mass Index",
            "unit": "kg/m²",
            "model_input_range": [12.0, 50.0],
            "missing_sentinels": [0.0],
            "required": True,
            "description": "Weight in kg / (height in m)^2"
        },
        {
            "name": "SBP_mmHg",
            "label": "Systolic Blood Pressure",
            "unit": "mm Hg",
            "model_input_range": [70.0, 240.0],
            "missing_sentinels": [0.0],
            "required": True,
            "description": "Systolic blood pressure measured at baseline screening"
        },
        {
            "name": "DBP_mmHg",
            "label": "Diastolic Blood Pressure",
            "unit": "mm Hg",
            "model_input_range": [40.0, 140.0],
            "missing_sentinels": [0.0],
            "required": True,
            "description": "Diastolic blood pressure measured at baseline screening"
        },
        {
            "name": "FPG_mg_dL",
            "label": "Fasting Plasma Glucose (mg/dL)",
            "unit": "mg/dL",
            "model_input_range": [44.0, 250.0],
            "missing_sentinels": [0.0],
            "required": True,
            "description": "Baseline Fasting Plasma Glucose in mg/dL (converted via factor 18.0182)"
        },
        {
            "name": "Cholesterol_mmol_L",
            "label": "Total Cholesterol",
            "unit": "mmol/L",
            "model_input_range": [1.5, 16.0],
            "missing_sentinels": [0.0],
            "required": False,
            "description": "Serum total cholesterol concentration in mmol/L"
        },
        {
            "name": "Triglyceride_mmol_L",
            "label": "Triglycerides",
            "unit": "mmol/L",
            "model_input_range": [0.2, 20.0],
            "missing_sentinels": [0.0],
            "required": False,
            "description": "Serum triglyceride concentration in mmol/L"
        },
        {
            "name": "ALT_UL",
            "label": "Alanine Aminotransferase (ALT)",
            "unit": "U/L",
            "model_input_range": [3.0, 500.0],
            "missing_sentinels": [0.0],
            "required": False,
            "description": "Serum ALT liver transaminase enzyme activity"
        },
        {
            "name": "CCR_umol_L",
            "label": "CCR (Renal Biomarker)",
            "unit": "µmol/L",
            "model_input_range": [20.0, 500.0],
            "missing_sentinels": [0.0],
            "required": False,
            "description": "Serum CCR biomarker from hospital laboratory records in µmol/L"
        },
        {
            "name": "family_history_of_diabetes",
            "label": "Family History of Diabetes",
            "unit": "binary",
            "model_input_range": [0.0, 1.0],
            "missing_sentinels": [],
            "required": True,
            "description": "First-degree family history of diabetes: 1 = Yes, 0 = No"
        }
    ],
    "presets": {
        "healthy": {
            "is_synthetic": False,
            "demo_label": "Healthy Baseline Screening (Low Risk)",
            "description": "Normoglycemic Chinese adult with normal BMI, normal blood pressure, and no family history.",
            "data": {
                "Age": 35.0,
                "Gender": 2.0,
                "BMI": 20.5,
                "SBP_mmHg": 105.0,
                "DBP_mmHg": 68.0,
                "FPG_mg_dL": 88.0,
                "Cholesterol_mmol_L": 4.2,
                "Triglyceride_mmol_L": 0.95,
                "ALT_UL": 14.0,
                "CCR_umol_L": 52.0,
                "family_history_of_diabetes": 0.0
            }
        },
        "moderate": {
            "is_synthetic": False,
            "demo_label": "Borderline Metabolic Risk (Moderate Risk)",
            "description": "Impaired fasting glycemia with prehypertension and elevated triglycerides.",
            "data": {
                "Age": 52.0,
                "Gender": 1.0,
                "BMI": 26.2,
                "SBP_mmHg": 132.0,
                "DBP_mmHg": 84.0,
                "FPG_mg_dL": 112.0,
                "Cholesterol_mmol_L": 5.4,
                "Triglyceride_mmol_L": 2.2,
                "ALT_UL": 32.0,
                "CCR_umol_L": 74.0,
                "family_history_of_diabetes": 0.0
            }
        },
        "high_risk": {
            "is_synthetic": False,
            "demo_label": "High Incident Risk Profile",
            "description": "Impaired fasting glucose, hypertension, hypertriglyceridemia, and positive family history.",
            "data": {
                "Age": 62.0,
                "Gender": 1.0,
                "BMI": 29.8,
                "SBP_mmHg": 150.0,
                "DBP_mmHg": 92.0,
                "FPG_mg_dL": 124.0,
                "Cholesterol_mmol_L": 6.3,
                "Triglyceride_mmol_L": 3.6,
                "ALT_UL": 58.0,
                "CCR_umol_L": 88.0,
                "family_history_of_diabetes": 1.0
            }
        }
    }
}


class DiabetesDataset:
    """Loader for the authentic 211,833-patient Chinese Longitudinal Incident Diabetes Cohort."""

    def __init__(self, data_file: Path | None = None):
        self.data_file = data_file or ANALYTIC_DATA_FILE
        self._df = None

    def _get_df(self) -> pd.DataFrame:
        if self._df is None:
            if not self.data_file.exists():
                raise FileNotFoundError(f"Analytic dataset not found at {self.data_file}")
            self._df = pd.read_csv(self.data_file)
        return self._df

    def get_feature_names(self) -> list[str]:
        return [f["name"] for f in DIABETES_CONFIG["features"]]

    def load_grouped(self) -> Tuple[np.ndarray, np.ndarray, np.ndarray, list[str]]:
        """
        Load dataset with site groupings for multi-center external validation.
        
        Returns:
            X: Feature matrix of shape (n_samples, n_features) strictly from baseline biomarkers.
            y: Binary target vector of incident diabetes (0=censored/diabetes-free, 1=incident diabetes).
            groups: Screening center identifier array ('site') for GroupShuffleSplit.
            feature_names: List of predictor feature names.
        """
        df = self._get_df()
        feature_names = self.get_feature_names()

        # Strict target leakage assertion
        for leak_col in TARGET_LEAKAGE_COLUMNS:
            assert leak_col not in feature_names, f"Target leakage detected! {leak_col} in feature_names"

        # Handle missing values cleanly with median
        X_df = df[feature_names].copy()
        for col in feature_names:
            if X_df[col].isnull().any():
                med = X_df[col].median()
                X_df[col] = X_df[col].fillna(med)

        X = X_df.values.astype(np.float64)
        y = df[TARGET_COLUMN].values.astype(int)
        groups = df[SITE_COLUMN].values.astype(int)

        return X, y, groups, feature_names

    def load(self) -> Tuple[np.ndarray, np.ndarray, list[str]]:
        """Standard load interface: (X, y, feature_names)."""
        X, y, _, feature_names = self.load_grouped()
        return X, y, feature_names

    def get_feature_info(self) -> list[dict]:
        return [
            {
                "name": f["name"],
                "label": f["label"],
                "unit": f["unit"],
                "min_val": f["model_input_range"][0],
                "max_val": f["model_input_range"][1],
                "missing_sentinels": f["missing_sentinels"],
                "required": f["required"],
                "description": f["description"]
            }
            for f in DIABETES_CONFIG["features"]
        ]

    def get_disease_info(self) -> dict:
        info = dict(DIABETES_CONFIG)
        info["id"] = "diabetes"
        info["name"] = DIABETES_CONFIG["display_name"]
        info["description"] = (
            f"Longitudinal incident diabetes risk prediction in {DIABETES_CONFIG['source_rows']:,} Chinese adults "
            f"followed across {DIABETES_CONFIG['screening_sites_count']} medical examination centers (median {DIABETES_CONFIG['followup_median_years']} years). "
            f"Evaluates incident onset with zero target leakage."
        )
        info["features"] = self.get_feature_info()
        info["dataset_size"] = DIABETES_CONFIG["source_rows"]
        info["status"] = "ready"
        return info
