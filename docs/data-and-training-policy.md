# Data and Training Policy

QuantumHealth AI is a research and educational prototype. It must not be used for clinical diagnosis or treatment decisions.

## Approved training data in this repository

- `backend/heart_training_data.csv`: 297 cleaned Cleveland heart-disease records with 13 features and a binary `label`.
- `backend/diabetes_training_data.csv`: 768 cleaned Pima diabetes records with 8 features and a binary `label`.
- Breast cancer data is loaded from scikit-learn for demonstration.

## Upload rules

The upload API accepts only an exact feature schema plus binary `label` values. It rejects malformed rows, duplicate files, and rows already stored in the database.

Before uploading a new dataset, verify its source, licence, feature definitions, category encodings, target meaning, missing-value policy, and duplicate rate. Do not upload copies, resampled rows, synthetic clinical records, or data with undocumented label/category meanings.

## Training rules

1. Upload each approved dataset once.
2. Verify the returned accepted/rejected/duplicate counts.
3. Force retrain once through `POST /api/v1/models/train` with `{ "disease": "heart", "force_retrain": true }` (or another supported disease).
4. Record the final held-out metrics and the cross-validation mean/standard deviation from `training_config.cross_validation`.
5. Never describe a simulated quantum result as quantum advantage or clinical accuracy.

## Large datasets

The current simulator intentionally uses a capped, stratified quantum-training subset. It is not designed for a claim that a VQC was trained on every row of a very large clinical database. Real large health datasets require documented de-identification, lawful access, data-use approval, patient-level splitting, and a separately designed feature/label extraction pipeline.
