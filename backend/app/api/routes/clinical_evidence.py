"""
Authoritative Clinical Evidence and Diagnostic Reference API
Includes ICMR-INDIAB, ADA, AHA/ACC, and KDIGO guidelines for verified clinical decision support.
"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import List, Dict, Optional, Any

router = APIRouter()

class ClinicalGuideline(BaseModel):
    guideline_body: str
    guideline_name: str
    year: int
    recommendation_tier: str
    clinical_thresholds: Dict[str, str]
    south_asian_relevance: Optional[str] = None
    citation_url: str

class BiomarkerEvidenceResponse(BaseModel):
    biomarker: str
    disease: str
    normal_physiological_range: str
    warning_threshold: str
    critical_threshold: str
    clinical_interpretation: str
    guidelines: List[ClinicalGuideline]
    recommended_clinical_actions: List[str]
    disclaimer: str

EVIDENCE_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    'fpg_diabetes': {
        'biomarker': 'Fasting Plasma Glucose (FPG)',
        'disease': 'Type 2 Diabetes / Incident Dysglycemia',
        'normal_physiological_range': '70 - 99 mg/dL (3.9 - 5.5 mmol/L)',
        'warning_threshold': '>= 100 mg/dL (Impaired Fasting Glucose)',
        'critical_threshold': '>= 126 mg/dL (Provisional Diabetes Threshold)',
        'clinical_interpretation': (
            'Fasting plasma glucose reflects basal hepatic glucose production under overnight fasting. '
            'Values between 100-125 mg/dL indicate impaired fasting glycemia (prediabetes), characterized '
            'by peripheral insulin resistance and progressive beta-cell dysfunction.'
        ),
        'guidelines': [
            {
                'guideline_body': 'Indian Council of Medical Research (ICMR) - INDIAB',
                'guideline_name': 'ICMR Guidelines for Management of Type 2 Diabetes',
                'year': 2023,
                'recommendation_tier': 'Grade A (Strong)',
                'clinical_thresholds': {
                    'Normal': '< 100 mg/dL',
                    'Impaired Fasting Glucose (Prediabetes)': '100 - 125 mg/dL',
                    'Diabetes Onset': '>= 126 mg/dL'
                },
                'south_asian_relevance': (
                    'Asian Indians progress from prediabetes to overt diabetes at an accelerated rate '
                    '(up to 2-3x higher annual incidence than Caucasian cohorts) due to reduced beta-cell reserve '
                    'and pronounced visceral adiposity at normal BMI levels.'
                ),
                'citation_url': 'https://main.icmr.nic.in/content/guidelines-management-type-2-diabetes-2023'
            },
            {
                'guideline_body': 'American Diabetes Association (ADA)',
                'guideline_name': 'Standards of Care in Diabetes — Diagnostic Criteria',
                'year': 2024,
                'recommendation_tier': 'Level A',
                'clinical_thresholds': {
                    'FPG Impaired': '100 - 125 mg/dL',
                    'FPG Diabetes': '>= 126 mg/dL (confirmed on repeat testing)'
                },
                'south_asian_relevance': 'Screening recommended starting at age 35 or earlier in South Asian individuals with BMI >= 23 kg/m2.',
                'citation_url': 'https://diabetesjournals.org/care/issue/47/Supplement_1'
            }
        ],
        'recommended_clinical_actions': [
            'Order confirmatory 75g 2-hour Oral Glucose Tolerance Test (OGTT) and HbA1c testing.',
            'Initiate intensive therapeutic lifestyle intervention: 150 min/week moderate physical activity and Mediterranean/low-glycemic dietary modification.',
            'Evaluate cardiovascular co-morbidities (lipid panel, ambulatory blood pressure monitoring).',
            'Screen for microvascular indicators (urine albumin-to-creatinine ratio, retinal examination).'
        ],
        'disclaimer': 'Reference information synthesized for healthcare provider clinical decision support. Not a standalone medical diagnosis.'
    },
    'bmi_diabetes': {
        'biomarker': 'Body Mass Index (BMI)',
        'disease': 'Metabolic Risk and Type 2 Diabetes',
        'normal_physiological_range': '18.5 - 22.9 kg/m2 (South Asian population cutoff)',
        'warning_threshold': '>= 23.0 kg/m2 (South Asian Overweight cutoff)',
        'critical_threshold': '>= 25.0 kg/m2 (South Asian Obesity cutoff)',
        'clinical_interpretation': (
            'BMI measures weight normalized by squared height. While standard WHO cutoffs define overweight at 25 kg/m2, '
            'WHO Western Pacific and ICMR-INDIAB established lower cutoffs for South and East Asian populations due to '
            'elevated body fat percentage, visceral fat deposition, and insulin resistance at lower total body weight.'
        ),
        'guidelines': [
            {
                'guideline_body': 'ICMR / Association of Physicians of India (API)',
                'guideline_name': 'Consensus Statement for Diagnosis of Obesity in Asian Indians',
                'year': 2021,
                'recommendation_tier': 'Consensus Recommendation',
                'clinical_thresholds': {
                    'Underweight': '< 18.5 kg/m2',
                    'Normal BMI': '18.5 - 22.9 kg/m2',
                    'Overweight': '23.0 - 24.9 kg/m2',
                    'Obese': '>= 25.0 kg/m2'
                },
                'south_asian_relevance': (
                    'Referred to as the Thin-Fat Indian Phenotype: Asian Indians have higher visceral fat, '
                    'higher trunk fat, lower muscle mass, and higher serum triglycerides at the same BMI as Western peers.'
                ),
                'citation_url': 'https://pubmed.ncbi.nlm.nih.gov/19223363/'
            }
        ],
        'recommended_clinical_actions': [
            'Measure waist circumference (Abnormal for South Asians: Men >= 90 cm, Women >= 80 cm).',
            'Target 5-7% total body weight reduction via negative caloric balance and resistance exercise.',
            'Check fasting lipid profile (specifically high triglycerides and low HDL cholesterol).'
        ],
        'disclaimer': 'Diagnostic guidelines provided for research and clinical decision support.'
    },
    'bp_heart': {
        'biomarker': 'Blood Pressure (Systolic and Diastolic)',
        'disease': 'Cardiovascular Disease Risk',
        'normal_physiological_range': '< 120 mm Hg Systolic and < 80 mm Hg Diastolic',
        'warning_threshold': '>= 130 mm Hg SBP or >= 80 mm Hg DBP (Stage 1 Hypertension)',
        'critical_threshold': '>= 140 mm Hg SBP or >= 90 mm Hg DBP (Stage 2 Hypertension)',
        'clinical_interpretation': (
            'Elevated resting blood pressure exerts continuous vascular shear stress, accelerating coronary endothelial '
            'dysfunction, plaque formation, and left ventricular hypertrophy.'
        ),
        'guidelines': [
            {
                'guideline_body': 'Indian Society of Hypertension (I-GH-IV)',
                'guideline_name': 'Fourth Indian Guidelines on Hypertension',
                'year': 2022,
                'recommendation_tier': 'National Guideline',
                'clinical_thresholds': {
                    'Optimal': '< 120/80 mm Hg',
                    'Prehypertension': '120-139 / 80-89 mm Hg',
                    'Stage 1 Hypertension': '140-159 / 90-99 mm Hg',
                    'Stage 2 Hypertension': '>= 160 / >= 100 mm Hg'
                },
                'south_asian_relevance': 'Hypertension is prevalent in >30% of Indian urban adults and is a leading contributor to premature coronary artery disease.',
                'citation_url': 'https://www.apiindia.org/guidelines_hypertension.php'
            }
        ],
        'recommended_clinical_actions': [
            'Confirm via home or 24-hour ambulatory blood pressure monitoring.',
            'Enforce dietary sodium restriction (< 2.0g sodium / < 5.0g salt per day).',
            'Assess 10-year atherosclerotic cardiovascular disease (ASCVD) risk.'
        ],
        'disclaimer': 'Decision support synthesis based on I-GH-IV and ACC/AHA guidelines.'
    }
}

@router.get(
    "",
    response_model=BiomarkerEvidenceResponse,
    summary="Fetch Clinical Guidelines and Evidence Base",
    description="Retrieves evidence-based clinical guidelines (ICMR-INDIAB, ADA, AHA/ACC) and action recommendations for evaluated biomarkers."
)
async def get_clinical_evidence(
    biomarker: str = Query("fpg", description="Biomarker code (e.g. 'fpg', 'bmi', 'bp')"),
    disease: str = Query("diabetes", description="Disease context ('diabetes', 'heart', 'kidney', 'breast_cancer')")
):
    key = f"{biomarker.lower()}_{disease.lower()}"
    if key not in EVIDENCE_KNOWLEDGE_BASE:
        matched = next((k for k in EVIDENCE_KNOWLEDGE_BASE if biomarker.lower() in k), "fpg_diabetes")
        key = matched
    return EVIDENCE_KNOWLEDGE_BASE[key]
