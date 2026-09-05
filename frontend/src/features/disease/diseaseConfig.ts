export interface FeatureGroupConfig {
  groupName: string;
  description: string;
  featureKeys: string[];
}

export interface DemoPreset {
  id: 'lower' | 'intermediate' | 'higher';
  label: string;
  description: string;
  values: Record<string, number>;
}

export interface DiseaseConfig {
  id: string;
  name: string;
  specialty: string;
  cohort: string;
  datasetName: string;
  description: string;
  clinicalFocus: string;
  featureGroups: FeatureGroupConfig[];
  presets: DemoPreset[];
}

export const diseaseConfigs: Record<string, DiseaseConfig> = {
  heart: {
    id: 'heart',
    name: 'Cardiovascular Risk Assessment',
    specialty: 'Cardiology',
    cohort: '303 Patients',
    datasetName: 'Cleveland Clinic Heart Disease Cohort',
    description: 'Coronary artery disease risk estimation using clinical vitals, resting ECG, and exercise stress hemodynamics.',
    clinicalFocus: 'Detection of ischemic heart disease patterns across 13 clinical biomarkers mapped to a 6-qubit register.',
    featureGroups: [
      {
        groupName: 'Demographics & Baseline Vitals',
        description: 'Age, biological sex, resting systolic blood pressure, and serum cholesterol.',
        featureKeys: ['age', 'sex', 'trestbps', 'chol'],
      },
      {
        groupName: 'Symptoms & Electrocardiogram',
        description: 'Reported chest pain classification, fasting glycemic indicator, and resting ECG presentation.',
        featureKeys: ['cp', 'fbs', 'restecg'],
      },
      {
        groupName: 'Exercise Stress Hemodynamics & Fluoroscopy',
        description: 'Peak heart rate, exercise-induced angina, ST depression (oldpeak), ST slope, fluoroscopy vessels, and thallium defect status.',
        featureKeys: ['thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'],
      },
    ],
    presets: [
      {
        id: 'lower',
        label: 'Demo — Lower Risk Profile',
        description: 'Baseline hemodynamic profile with normal resting ECG and no exercise angina.',
        values: {
          age: 42, sex: 1, cp: 0, trestbps: 118, chol: 195,
          fbs: 0, restecg: 0, thalach: 168, exang: 0, oldpeak: 0.2,
          slope: 2, ca: 0, thal: 2
        },
      },
      {
        id: 'intermediate',
        label: 'Demo — Intermediate Profile',
        description: 'Borderline blood pressure and mild ST segment depression.',
        values: {
          age: 56, sex: 1, cp: 1, trestbps: 135, chol: 245,
          fbs: 0, restecg: 1, thalach: 145, exang: 0, oldpeak: 1.2,
          slope: 1, ca: 1, thal: 2
        },
      },
      {
        id: 'higher',
        label: 'Demo — Higher Risk Profile',
        description: 'Marked ST segment depression, elevated resting BP, and exercise-induced angina.',
        values: {
          age: 64, sex: 1, cp: 3, trestbps: 160, chol: 295,
          fbs: 1, restecg: 2, thalach: 122, exang: 1, oldpeak: 2.8,
          slope: 0, ca: 2, thal: 3
        },
      },
    ],
  },

  breast_cancer: {
    id: 'breast_cancer',
    name: 'Breast Cancer Cytopathology Screening',
    specialty: 'Oncology',
    cohort: '569 Biopsies',
    datasetName: 'Wisconsin Diagnostic Breast Cancer (WDBC)',
    description: 'Fine Needle Aspirate (FNA) digitized cytological features describing cell nuclear characteristics.',
    clinicalFocus: 'Morphometric evaluation of cell nucleus boundary regularity, area, and texture variability.',
    featureGroups: [
      {
        groupName: 'Nuclear Morphometry & Dimensionality',
        description: 'Mean cell radius, perimeter boundary, and nuclear area.',
        featureKeys: ['mean radius', 'mean perimeter', 'mean area'],
      },
      {
        groupName: 'Membrane Regularity & Cytological Texture',
        description: 'Gray-scale variations, nuclear membrane smoothness, and compactness (perimeter² / area - 1.0).',
        featureKeys: ['mean texture', 'mean smoothness', 'mean compactness'],
      },
    ],
    presets: [
      {
        id: 'lower',
        label: 'Demo — Lower Risk Profile',
        description: 'Uniform, small nuclear dimensions with regular boundary contours.',
        values: {
          'mean radius': 11.2,
          'mean texture': 14.5,
          'mean perimeter': 72.0,
          'mean area': 385.0,
          'mean smoothness': 0.082,
          'mean compactness': 0.048,
        },
      },
      {
        id: 'intermediate',
        label: 'Demo — Intermediate Profile',
        description: 'Moderate nuclear enlargement with minor texture irregularity.',
        values: {
          'mean radius': 14.8,
          'mean texture': 19.2,
          'mean perimeter': 96.5,
          'mean area': 680.0,
          'mean smoothness': 0.102,
          'mean compactness': 0.115,
        },
      },
      {
        id: 'higher',
        label: 'Demo — Higher Risk Profile',
        description: 'Pronounced nuclear pleomorphism, marked contour irregularity, and increased area.',
        values: {
          'mean radius': 20.5,
          'mean texture': 25.8,
          'mean perimeter': 138.0,
          'mean area': 1320.0,
          'mean smoothness': 0.125,
          'mean compactness': 0.245,
        },
      },
    ],
  },

  diabetes: {
    id: 'diabetes',
    name: 'Type 2 Diabetes Mellitus Risk',
    specialty: 'Endocrinology',
    cohort: '768 Patients',
    datasetName: 'Pima Indians Diabetes Database (PIDD)',
    description: 'Metabolic markers and demographic factors predicting onset of Type 2 Diabetes Mellitus.',
    clinicalFocus: 'Evaluation of glycemic control, pancreatic beta-cell response, and body composition indices.',
    featureGroups: [
      {
        groupName: 'Glycemic & Metabolic Biomarkers',
        description: 'Plasma glucose concentration (2h OGTT), serum insulin, and diabetes pedigree function.',
        featureKeys: ['Glucose', 'Insulin', 'DiabetesPedigreeFunction'],
      },
      {
        groupName: 'Physical Vitals & Patient History',
        description: 'Diastolic blood pressure, body mass index (BMI), triceps skinfold thickness, age, and pregnancies.',
        featureKeys: ['BloodPressure', 'BMI', 'Age', 'Pregnancies', 'SkinThickness'],
      },
    ],
    presets: [
      {
        id: 'lower',
        label: 'Demo — Lower Risk Profile',
        description: 'Fasting glucose and BMI within baseline normative range.',
        values: {
          Pregnancies: 1, Glucose: 88, BloodPressure: 66,
          SkinThickness: 20, Insulin: 70, BMI: 22.4,
          DiabetesPedigreeFunction: 0.25, Age: 28
        },
      },
      {
        id: 'intermediate',
        label: 'Demo — Intermediate Profile',
        description: 'Mildly elevated post-load glucose and borderline elevated BMI.',
        values: {
          Pregnancies: 3, Glucose: 128, BloodPressure: 76,
          SkinThickness: 28, Insulin: 115, BMI: 28.5,
          DiabetesPedigreeFunction: 0.48, Age: 42
        },
      },
      {
        id: 'higher',
        label: 'Demo — Higher Risk Profile',
        description: 'Significantly elevated glucose, high BMI, and elevated genetic pedigree index.',
        values: {
          Pregnancies: 6, Glucose: 178, BloodPressure: 88,
          SkinThickness: 38, Insulin: 180, BMI: 36.8,
          DiabetesPedigreeFunction: 0.85, Age: 54
        },
      },
    ],
  },
};

export const getDiseaseConfig = (diseaseId: string): DiseaseConfig | undefined => {
  return diseaseConfigs[diseaseId];
};
