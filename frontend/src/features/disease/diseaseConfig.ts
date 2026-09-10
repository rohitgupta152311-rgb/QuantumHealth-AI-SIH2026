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

export interface CategoricalOptionConfig {
  label: string;
  value: number;
  description?: string;
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
  medians: Record<string, number>;
  continuousKeys: string[];
  categoricalOptions?: Record<string, CategoricalOptionConfig[]>;
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
    medians: {
      age: 55,
      sex: 1,
      cp: 1,
      trestbps: 130,
      chol: 240,
      fbs: 0,
      restecg: 1,
      thalach: 153,
      exang: 0,
      oldpeak: 0.8,
      slope: 1,
      ca: 0,
      thal: 2,
    },
    continuousKeys: ['age', 'trestbps', 'chol', 'thalach', 'oldpeak'],
    categoricalOptions: {
      sex: [
        { label: 'Female', value: 0 },
        { label: 'Male', value: 1 },
      ],
      cp: [
        { label: 'Typical angina', value: 0 },
        { label: 'Atypical angina', value: 1 },
        { label: 'Non-anginal pain', value: 2 },
        { label: 'Asymptomatic', value: 3 },
      ],
      fbs: [
        { label: 'No (≤ 120 mg/dL)', value: 0 },
        { label: 'Yes (> 120 mg/dL)', value: 1 },
      ],
      restecg: [
        { label: 'Normal', value: 0 },
        { label: 'ST-T abnormality', value: 1 },
        { label: 'Left ventricular hypertrophy', value: 2 },
      ],
      exang: [
        { label: 'No', value: 0 },
        { label: 'Yes', value: 1 },
      ],
      slope: [
        { label: 'Upsloping', value: 0 },
        { label: 'Flat', value: 1 },
        { label: 'Downsloping', value: 2 },
      ],
      ca: [
        { label: '0 vessels', value: 0 },
        { label: '1 vessel', value: 1 },
        { label: '2 vessels', value: 2 },
        { label: '3 vessels', value: 3 },
        { label: '4 vessels', value: 4 },
      ],
      thal: [
        { label: 'Normal', value: 0 },
        { label: 'Fixed defect', value: 1 },
        { label: 'Reversible defect', value: 2 },
      ],
    },
    featureGroups: [
      {
        groupName: 'Patient Profile',
        description: 'Demographics and biological characteristics.',
        featureKeys: ['age', 'sex'],
      },
      {
        groupName: 'Vitals and Laboratory Values',
        description: 'Resting hemodynamic measurements, lipid panel, glycemic indicator, and baseline electrocardiogram.',
        featureKeys: ['trestbps', 'chol', 'fbs', 'restecg'],
      },
      {
        groupName: 'Cardiac / Clinical Assessment',
        description: 'Reported symptoms, stress hemodynamics, fluoroscopy vessel score, and thallium perfusion findings.',
        featureKeys: ['cp', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal'],
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
          slope: 2, ca: 0, thal: 2,
        },
      },
      {
        id: 'intermediate',
        label: 'Demo — Intermediate Profile',
        description: 'Borderline blood pressure and mild ST segment depression.',
        values: {
          age: 56, sex: 1, cp: 1, trestbps: 135, chol: 245,
          fbs: 0, restecg: 1, thalach: 145, exang: 0, oldpeak: 1.2,
          slope: 1, ca: 1, thal: 2,
        },
      },
      {
        id: 'higher',
        label: 'Demo — Higher Risk Profile',
        description: 'Marked ST segment depression, elevated resting BP, and exercise-induced angina.',
        values: {
          age: 64, sex: 1, cp: 3, trestbps: 160, chol: 295,
          fbs: 1, restecg: 2, thalach: 122, exang: 1, oldpeak: 2.8,
          slope: 0, ca: 2, thal: 2,
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
    medians: {
      'mean radius': 13.37,
      'mean texture': 18.84,
      'mean perimeter': 86.24,
      'mean area': 551.1,
      'mean smoothness': 0.096,
      'mean compactness': 0.092,
    },
    continuousKeys: [
      'mean radius',
      'mean texture',
      'mean perimeter',
      'mean area',
      'mean smoothness',
      'mean compactness',
    ],
    featureGroups: [
      {
        groupName: 'Nuclear Morphometry & Dimensionality',
        description: 'Mean cell radius, perimeter boundary, and nuclear area.',
        featureKeys: ['mean radius', 'mean perimeter', 'mean area'],
      },
      {
        groupName: 'Membrane Regularity & Cytological Texture',
        description: 'Gray-scale variations, nuclear membrane smoothness, and compactness.',
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
    name: 'Incident Diabetes Risk (Chinese Health-Screening Cohort)',
    specialty: 'Endocrinology & Preventive Medicine',
    cohort: '211,833 Adults (Median 3.1-Year Follow-up)',
    datasetName: 'Chinese Health-Screening Cohort (Chen et al. / Dryad)',
    description: 'Longitudinal incident diabetes risk prediction across 15 medical examination centers (median 2.99 years) with zero target leakage.',
    clinicalFocus: 'Evaluation of Fasting Plasma Glucose (FPG), blood pressure, body mass index, lipid fractions, and liver/kidney transaminases.',
    medians: {
      Age: 48,
      Gender: 1,
      BMI: 24.2,
      SBP_mmHg: 120,
      DBP_mmHg: 76,
      FPG_mg_dL: 94,
      Cholesterol_mmol_L: 4.8,
      Triglyceride_mmol_L: 1.4,
      ALT_UL: 22,
      CCR_umol_L: 65,
      family_history_of_diabetes: 0,
    },
    continuousKeys: [
      'Age',
      'BMI',
      'SBP_mmHg',
      'DBP_mmHg',
      'FPG_mg_dL',
      'Cholesterol_mmol_L',
      'Triglyceride_mmol_L',
      'ALT_UL',
      'CCR_umol_L',
    ],
    categoricalOptions: {
      Gender: [
        { label: 'Male', value: 1, description: 'Biological Male' },
        { label: 'Female', value: 2, description: 'Biological Female' },
      ],
      family_history_of_diabetes: [
        { label: 'No Family History', value: 0, description: 'No 1st-degree relatives with diabetes' },
        { label: 'First-Degree Relative', value: 1, description: 'Parent or sibling diagnosed with diabetes' },
      ],
    },
    featureGroups: [
      {
        groupName: 'Glycemic & Lipid Biomarkers',
        description: 'Baseline fasting plasma glucose and serum lipid fractions.',
        featureKeys: ['FPG_mg_dL', 'Cholesterol_mmol_L', 'Triglyceride_mmol_L'],
      },
      {
        groupName: 'Hemodynamics & Anthropometrics',
        description: 'Age, biological sex, body mass index, systolic/diastolic blood pressure, and family history.',
        featureKeys: ['Age', 'Gender', 'BMI', 'SBP_mmHg', 'DBP_mmHg', 'family_history_of_diabetes'],
      },
      {
        groupName: 'Hepatic & Renal Markers',
        description: 'Serum alanine aminotransferase (ALT) and CCR renal biomarkers.',
        featureKeys: ['ALT_UL', 'CCR_umol_L'],
      },
    ],
    presets: [
      {
        id: 'lower',
        label: 'Demo — Healthy Baseline (Low Risk)',
        description: 'Normoglycemic adult with normal BMI, normal blood pressure, and no family history.',
        values: {
          Age: 35.0,
          Gender: 2.0,
          BMI: 20.5,
          SBP_mmHg: 105.0,
          DBP_mmHg: 68.0,
          FPG_mg_dL: 88.0,
          Cholesterol_mmol_L: 4.2,
          Triglyceride_mmol_L: 0.95,
          ALT_UL: 14.0,
          CCR_umol_L: 52.0,
          family_history_of_diabetes: 0.0,
        },
      },
      {
        id: 'intermediate',
        label: 'Demo — Borderline Metabolic Risk',
        description: 'Impaired fasting glycemia with prehypertension and elevated triglycerides.',
        values: {
          Age: 52.0,
          Gender: 1.0,
          BMI: 26.2,
          SBP_mmHg: 132.0,
          DBP_mmHg: 84.0,
          FPG_mg_dL: 112.0,
          Cholesterol_mmol_L: 5.4,
          Triglyceride_mmol_L: 2.2,
          ALT_UL: 32.0,
          CCR_umol_L: 74.0,
          family_history_of_diabetes: 0.0,
        },
      },
      {
        id: 'higher',
        label: 'Demo — High Incident Risk Profile',
        description: 'Impaired fasting glucose, hypertension, hypertriglyceridemia, and positive family history.',
        values: {
          Age: 62.0,
          Gender: 1.0,
          BMI: 29.8,
          SBP_mmHg: 150.0,
          DBP_mmHg: 92.0,
          FPG_mg_dL: 124.0,
          Cholesterol_mmol_L: 6.3,
          Triglyceride_mmol_L: 3.6,
          ALT_UL: 58.0,
          CCR_umol_L: 88.0,
          family_history_of_diabetes: 1.0,
        },
      },
    ],
  },
};

export const getDiseaseConfig = (diseaseId: string): DiseaseConfig | undefined => {
  return diseaseConfigs[diseaseId];
};
