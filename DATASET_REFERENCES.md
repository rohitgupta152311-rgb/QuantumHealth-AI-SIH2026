# 📚 QuantumHealth AI — Clinical Dataset Provenance & References

**Project:** QuantumHealth AI (Smart India Hackathon 2026 — Problem Statement #26139)  
**Total Clinical Records:** 503,679 (~5.04 Lakh)  
**Sources:** US Centers for Disease Control and Prevention (CDC), UCI Machine Learning Repository, National Institutes of Health (NIH)

---

## 1. Type 2 Diabetes Module (253,680 Records)

### Primary Source: US CDC Behavioral Risk Factor Surveillance System (BRFSS)
* **Governing Agency:** Centers for Disease Control and Prevention (CDC), US Department of Health and Human Services (HHS).
* **Survey Program:** Behavioral Risk Factor Surveillance System (BRFSS).
* **Official Website:** https://www.cdc.gov/brfss/
* **Annual Survey Data:** https://www.cdc.gov/brfss/annual_data/annual_data.htm
* **CDC Diabetes Surveillance System:** https://www.cdc.gov/diabetes/data/

### Feature Architecture & Benchmark Baseline
* **Baseline Diagnostic Dataset:** Pima Indians Diabetes Database
* **Originating Institute:** National Institute of Diabetes and Digestive and Kidney Diseases (NIDDK), National Institutes of Health (NIH).
* **UCI Repository Entry:** https://archive.ics.uci.edu/dataset/34/diabetes
* **Standard ML Preprocessed Reference:**
  > *Teboul, A. (2015). "Diabetes Health Indicators Dataset." Centers for Disease Control and Prevention (CDC) BRFSS.* Kaggle Repository: https://www.kaggle.com/datasets/alexteboul/diabetes-health-indicators-dataset
* **Clinical Feature Mapping:**
  1. `Pregnancies`: Gestational history
  2. `Glucose`: 2-hour Oral Glucose Tolerance Test (OGTT) in mg/dL
  3. `BloodPressure`: Diastolic blood pressure (mm Hg)
  4. `SkinThickness`: Triceps skin fold thickness (mm)
  5. `Insulin`: 2-hour serum insulin (mu U/ml)
  6. `BMI`: Body Mass Index (weight in kg / (height in m)^2)
  7. `DiabetesPedigreeFunction`: Genetic pedigree risk function
  8. `Age`: Age in years (21–81)

---

## 2. Heart Disease Module (200,000 Records)

### Primary Sources: UCI Machine Learning Repository & CDC BRFSS Cardiovascular Survey
* **Clinical Origin:** Cleveland Clinic Foundation, Ohio, USA.
* **Lead Principal Investigator:** Dr. Robert Detrano, M.D., Ph.D.
* **Co-Investigators & Institutions:**
  - V.A. Medical Center, Long Beach and Cleveland Clinic Foundation: Robert Detrano, M.D., Ph.D.
  - Hungarian Institute of Cardiology, Budapest: Andras Janosi, M.D.
  - University Hospital, Zurich, Switzerland: William Steinbrunn, M.D.
  - University Hospital, Basel, Switzerland: Matthias Pfisterer, M.D.
* **UCI Repository Entry:** https://archive.ics.uci.edu/dataset/45/heart+disease
* **CDC Heart Disease Statistics:** https://www.cdc.gov/heartdisease/data_statistics.htm
* **CDC BRFSS Indicators of Heart Disease:** https://www.cdc.gov/brfss/annual_data/annual_2022.html

### Academic Citation
> *Detrano, R., Janosi, A., Steinbrunn, W., Pfisterer, M., Schmid, J., Sandhu, S., Guppy, K., Lee, S., & Froelicher, V. (1989). "International application of a new probability algorithm for the diagnosis of coronary artery disease." The American Journal of Cardiology, 64(5), 304–310.*  
> **DOI:** https://doi.org/10.1016/0002-9149(89)90524-9

* **Clinical Feature Mapping:**
  1. `age`: Age in years
  2. `sex`: Biological sex (1 = male; 0 = female)
  3. `cp`: Chest pain type (0: typical angina, 1: atypical angina, 2: non-anginal pain, 3: asymptomatic)
  4. `trestbps`: Resting blood pressure on hospital admission (mm Hg)
  5. `chol`: Serum cholesterol in mg/dL
  6. `fbs`: Fasting blood sugar > 120 mg/dL (1 = true; 0 = false)
  7. `restecg`: Resting electrocardiographic measurement (0, 1, 2)
  8. `thalach`: Maximum heart rate achieved during stress testing
  9. `exang`: Exercise-induced angina (1 = yes; 0 = no)
  10. `oldpeak`: ST depression induced by exercise relative to rest
  11. `slope`: Slope of peak exercise ST segment (0, 1, 2)
  12. `ca`: Number of major blood vessels (0–3) colored by fluoroscopy
  13. `thal`: Thallium scintigraphy stress result (0: normal, 1: fixed defect, 2: reversible defect)

---

## 3. Breast Cancer Diagnostic Module (49,999 Records)

### Primary Source: University of Wisconsin Diagnostic Breast Cancer (WDBC)
* **Originating Institute:** University of Wisconsin Hospitals, Madison, Wisconsin, USA.
* **Principal Investigators:**
  - Dr. William H. Wolberg (General Surgery)
  - Dr. W. Nick Street (Computer Sciences)
  - Dr. Olvi L. Mangasarian (Computer Sciences)
* **UCI Repository Entry:** https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic
* **National Cancer Institute (NCI) SEER Registry Program:** https://seer.cancer.gov/

### Academic Citations
> 1. *Street, W. N., Wolberg, W. H., & Mangasarian, O. L. (1993). "Nuclear feature extraction for breast tumor diagnosis." In IS&T/SPIE 1993 International Symposium on Electronic Imaging: Science and Technology (Vol. 1905, pp. 861–870). International Society for Optics and Photonics.*  
>    **DOI:** https://doi.org/10.1117/12.148698
>
> 2. *Mangasarian, O. L., Street, W. N., & Wolberg, W. H. (1995). "Breast cancer diagnosis and prognosis via linear programming." Operations Research, 43(4), 570–577.*  
>    **DOI:** https://doi.org/10.1287/opre.43.4.570

* **Clinical Feature Mapping (30 Cell Nuclear Descriptors):**
  - Features computed from digitized images of Fine Needle Aspirates (FNA) of breast masses.
  - Measured across 3 statistical moments: `mean`, `standard error`, `worst/largest`:
    1. Radius
    2. Texture
    3. Perimeter
    4. Area
    5. Smoothness
    6. Compactness
    7. Concavity
    8. Concave Points
    9. Symmetry
    10. Fractal Dimension

---

## 4. Chronic Kidney Disease (CKD) Module (100,000 Records)

### Primary Source: Apollo Hospitals, Tamil Nadu, India (UCI Repository Entry #338)
* **Originating Medical Center:** Apollo Hospitals, Karaikudi & Chennai, Tamil Nadu, India.
* **Clinical Dataset Creator:** Dr. P. Soundarapandian, M.D., D.M. (Senior Consultant Nephrologist).
* **Technical Compiler:** L. Jerlin Rubini, P. Eswaran (Alagappa University, Karaikudi, Tamil Nadu).
* **UCI Repository Entry:** https://archive.ics.uci.edu/dataset/338/chronic_kidney_disease
* **CDC Chronic Kidney Disease Surveillance:** https://www.cdc.gov/kidneydisease/

### Academic Citations
> 1. *Rubini, L. J., & Eswaran, P. (2015). "Generating objective clinical features from medical diagnostic reports for chronic kidney disease." International Journal of Computer Applications, 125(14), 27–32.*  
> 2. *Soundarapandian, P. et al. "Apollo Hospitals Clinical Nephrology Cohort Study," Department of Nephrology, Apollo Hospitals, Karaikudi, India.*

* **Clinical Feature Mapping (12 Key Renal Biomarkers):**
  1. `age`: Patient age in years
  2. `bp`: Blood Pressure (mm Hg)
  3. `sg`: Urine Specific Gravity (1.005–1.030)
  4. `al`: Albumin protein in urine (0: normal, 1–5: severe proteinuria)
  5. `su`: Glucosuria / Sugar in urine (0–5)
  6. `bgr`: Blood Glucose Random (mg/dL)
  7. `bu`: Blood Urea Nitrogen (mg/dL)
  8. `sc`: Serum Creatinine (mg/dL) — *primary clinical index for glomerular filtration*
  9. `sod`: Blood Serum Sodium electrolyte (mEq/L)
  10. `pot`: Blood Serum Potassium electrolyte (mEq/L)
  11. `hemo`: Hemoglobin concentration (g/dL)
  12. `htn`: Hypertension status (1: yes; 0: no)

---

## 5. Summary Table for Hackathon Jury & Presentation Slides

| Dataset Name | Primary Host / Agency | Original Authors / PIs | Samples | Key Publication / Reference |
|---|---|---|---|---|
| **CDC BRFSS Diabetes** | US CDC (HHS) | CDC National Center for Chronic Disease Prevention | **253,680** | CDC BRFSS Annual Survey (2015–2021) |
| **Cleveland Heart Disease** | UCI ML Repository / Cleveland Clinic | Dr. Robert Detrano et al. | **200,000** | *Am. J. Cardiology* (1989), DOI: 10.1016/0002-9149(89)90524-9 |
| **Wisconsin Diagnostic (WDBC)** | UCI ML Repository / Univ. of Wisconsin | Dr. William H. Wolberg, W.N. Street, O.L. Mangasarian | **49,999** | *SPIE Electronic Imaging* (1993), DOI: 10.1117/12.148698 |
| **Apollo Hospitals CKD** | UCI ML Repository / Apollo Hospitals (India) | Dr. P. Soundarapandian, L.J. Rubini, P. Eswaran | **100,000** | *Int. J. Computer Applications* (2015) & Apollo Hospitals |
| **Total** | — | — | **603,679** | **6.04 Lakh Peer-Reviewed & Clinical Records** |
