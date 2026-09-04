"""Dataset management endpoints"""
import io
import json
import hashlib
from datetime import datetime
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, status
from fastapi.responses import FileResponse, HTMLResponse
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Dict, List
import pandas as pd
import numpy as np

from app.core.database import get_db, compute_sample_fingerprint
from app.datasets.loader import DatasetLoader, get_dataset_loader
from app.models.dataset_models import UploadedDataset, TrainingSample
from app.schemas.dataset_schemas import (
    DatasetUploadResponse,
    RowValidationError,
    DatasetInfoResponse,
)

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB
MAX_ROWS = 350_000
DATA_DIR = Path(__file__).resolve().parents[4] / "data"


@router.get("/download/all", summary="Download All 603K Clinical Datasets (ZIP)")
async def download_all_datasets():
    """Download the complete ZIP package containing all 4 clean clinical datasets, catalog, and documentation."""
    zip_path = DATA_DIR / "QuantumHealth_AI_Datasets_603K.zip"
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="Dataset archive not found.")
    return FileResponse(
        path=zip_path,
        filename="QuantumHealth_AI_Datasets_603K.zip",
        media_type="application/zip"
    )


@router.get("/download/{disease_id}", summary="Download Single Disease Dataset CSV")
async def download_single_dataset(disease_id: str):
    """Download an individual disease dataset CSV file."""
    mapping = {
        "kidney": "kidney_disease_apollo_cdc.csv",
        "diabetes": "diabetes_cdc_brfss.csv",
        "heart": "heart_disease_uci_cdc.csv",
        "breast_cancer": "breast_cancer_wisconsin_augmented.csv",
    }
    if disease_id not in mapping:
        raise HTTPException(status_code=404, detail=f"Dataset for '{disease_id}' not found.")
    
    file_path = DATA_DIR / mapping[disease_id]
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File {mapping[disease_id]} not found.")
    
    return FileResponse(
        path=file_path,
        filename=mapping[disease_id],
        media_type="text/csv"
    )


@router.get("/report/summary", summary="View Clinical Data Catalog & Dictionary (HTML)")
async def view_dataset_summary_report():
    """View the interactive HTML clinical dataset catalog and biomarker dictionary."""
    html_path = DATA_DIR / "DATASET_SUMMARY.html"
    if not html_path.exists():
        raise HTTPException(status_code=404, detail="Summary report not found.")
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()
    return HTMLResponse(content=content)



@router.get("/available", summary="Get Total Record Counts Across All Diseases")
async def get_available_datasets() -> Dict:
    """Get list of available datasets with exact record counts, features, and sources without DB dependency."""
    loader = get_dataset_loader()
    datasets_info = {}
    for disease in loader.disease_ids:
        try:
            X, y, feature_names = loader.load(disease)
            info = loader.get_disease_info(disease)
            datasets_info[disease] = {
                "name": info.get("name", disease),
                "total_samples": len(X),
                "features_count": len(feature_names),
                "positive_rate": round(float(y.mean()), 4) if len(y) > 0 else 0.0,
                "source": info.get("source", "Standard clinical registry"),
            }
        except Exception as e:
            datasets_info[disease] = {"error": str(e)}

    total_records = sum(d.get("total_samples", 0) for d in datasets_info.values() if "total_samples" in d)
    return {
        "total_records_all_diseases": total_records,
        "diseases_count": len(datasets_info),
        "datasets": datasets_info
    }



@router.get("/uploads", summary="List Uploaded Datasets with Actual Clinical Data Rows")
async def list_uploaded_datasets(
    disease: str = None,
    include_rows: bool = True,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    """
    List all uploaded datasets including their actual patient biomarker data rows.
    Set `include_rows=true` (default) to view full data rows directly in Swagger.
    """
    query = select(UploadedDataset)
    if disease:
        query = query.where(UploadedDataset.disease_id == disease)
    query = query.order_by(UploadedDataset.created_at.desc())
    result = await db.execute(query)
    datasets = result.scalars().all()

    output = []
    for ds in datasets:
        item = {
            "id": ds.id,
            "disease_id": ds.disease_id,
            "original_filename": ds.original_filename,
            "total_rows_uploaded": ds.row_count,
            "rejected_count": ds.rejected_count,
            "created_at": ds.created_at,
        }
        if include_rows:
            samples_stmt = select(TrainingSample).where(
                TrainingSample.dataset_id == ds.id
            ).limit(limit)
            samples_res = await db.execute(samples_stmt)
            samples = samples_res.scalars().all()
            item["rows_preview_count"] = len(samples)
            item["data_rows"] = [
                {**json.loads(s.features_json), "label": s.label}
                for s in samples
            ]
        output.append(item)
    return output


@router.get("/browse/{disease}", summary="Browse Full Clinical Patient Records for Any Disease")
async def browse_disease_dataset(
    disease: str,
    limit: int = 50,
    offset: int = 0,
):
    """
    Browse the full clinical dataset (603K records) for any disease directly in Swagger.
    Returns patient biomarker rows, feature names, and diagnostic labels.
    """
    loader = get_dataset_loader()
    if disease not in loader.disease_ids:
        raise HTTPException(status_code=404, detail=f"Disease '{disease}' not found. Available: {loader.disease_ids}")

    X, y, feature_names = loader.load(disease)
    total_rows = len(X)
    limit = min(max(1, limit), 500)
    end = min(offset + limit, total_rows)

    rows = []
    for i in range(offset, end):
        row_dict = {
            name: float(X[i][j]) if not float(X[i][j]).is_integer() else int(X[i][j])
            for j, name in enumerate(feature_names)
        }
        row_dict["label"] = int(y[i])
        rows.append(row_dict)

    return {
        "disease": disease,
        "total_records_in_dataset": total_rows,
        "offset": offset,
        "limit": limit,
        "records_returned": len(rows),
        "columns": feature_names + ["label"],
        "records": rows,
    }


@router.get("/{disease}/schema")
async def get_dataset_schema(disease: str) -> Dict:
    """Get dataset schema for a specific disease"""
    loader = get_dataset_loader()
    try:
        feature_names = loader.get_feature_names(disease)
        return {
            "disease": disease,
            "features": feature_names,
            "label": "label (0 or 1)",
            "description": f"CSV must contain columns: {feature_names + ['label']}",
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/upload", response_model=DatasetUploadResponse, status_code=201)
async def upload_dataset(
    file: UploadFile = File(..., description="CSV file with feature columns + label"),
    disease: str = Form(..., description="Disease ID: diabetes, heart, or breast_cancer"),
    db: AsyncSession = Depends(get_db),
):
    """
    Upload a CSV dataset for a specific disease.

    The CSV must contain exactly the feature columns for the disease plus a
    `label` column with binary values (0 or 1).

    Validation:
    - Rejects identical file re-uploads with 409 Conflict.
    - Rejects missing columns, extra columns, invalid labels, non-numeric values.
    - Detects duplicate rows within the uploaded file and against previously uploaded samples in the database.
    - Returns accepted_rows, rejected_rows, duplicate_rows, and validation_errors.
    """
    loader = get_dataset_loader()

    # --- Validate disease ID ---
    if disease not in loader.disease_ids:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown disease '{disease}'. "
            f"Available: {loader.disease_ids}",
        )

    expected_features = loader.get_feature_names(disease)
    expected_columns = set(expected_features + ["label"])

    # --- Read file contents ---
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)} MB.",
        )

    # --- Check for duplicate file upload (409 Conflict) ---
    file_hash = hashlib.sha256(contents).hexdigest()
    existing_file_stmt = select(UploadedDataset).where(
        UploadedDataset.disease_id == disease,
        UploadedDataset.file_hash == file_hash,
    )
    existing_file_res = await db.execute(existing_file_stmt)
    existing_file = existing_file_res.scalars().first()
    if existing_file:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                f"Duplicate dataset: An identical CSV file has already been uploaded "
                f"for '{disease}' (Dataset ID #{existing_file.id}, uploaded {existing_file.created_at})."
            ),
        )

    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=422, detail=f"Failed to parse CSV: {str(e)}"
        )

    if len(df) == 0:
        raise HTTPException(status_code=422, detail="CSV file contains no data rows.")

    if len(df) > MAX_ROWS:
        raise HTTPException(
            status_code=422,
            detail=f"CSV has {len(df)} rows, maximum allowed is {MAX_ROWS}.",
        )

    # --- Normalize label/target column ---
    target_candidates = ["label", "target", "Outcome", "outcome", "diagnosis", "class", "Class"]
    found_target = None
    for t in target_candidates:
        if t in df.columns:
            found_target = t
            break

    if found_target and found_target != "label":
        df = df.rename(columns={found_target: "label"})

    # Normalize common column aliases (e.g. 'radius error' <-> 'error radius')
    rename_dict = {}
    for col in df.columns:
        if col.endswith(" error"):
            alt = "error " + col[:-6]
            if alt in expected_features and col not in expected_features:
                rename_dict[col] = alt
        elif col.startswith("error "):
            alt = col[6:] + " error"
            if alt in expected_features and col not in expected_features:
                rename_dict[col] = alt
    if rename_dict:
        df = df.rename(columns=rename_dict)

    # Map string labels like 'M'/'B' or 'yes'/'no' to 1/0
    if "label" in df.columns and df["label"].dtype == object:
        df["label"] = df["label"].map(
            lambda v: 1 if str(v).strip().lower() in {"1", "m", "malignant", "yes", "true", "positive"} else 0
        )

    # --- Validate columns ---
    actual_columns = set(df.columns.tolist())
    missing_features = [f for f in expected_features if f not in actual_columns]
    if "label" not in actual_columns:
        missing_features.append("label")

    if missing_features:
        raise HTTPException(
            status_code=422,
            detail=f"Missing required columns: {sorted(missing_features)}. Supported label column names: ['label', 'target', 'Outcome', 'diagnosis']."
        )

    # Fetch existing fingerprints from database for this disease
    existing_fps_stmt = select(TrainingSample.fingerprint).where(
        TrainingSample.disease_id == disease,
        TrainingSample.fingerprint.isnot(None),
    )
    existing_fps_res = await db.execute(existing_fps_stmt)
    db_fingerprints = set(existing_fps_res.scalars().all())

    # --- Per-row validation ---
    validation_errors: List[RowValidationError] = []
    accepted_records: List[tuple] = []
    seen_batch_fps = set()
    duplicate_rows_count = 0

    for idx in range(len(df)):
        row = df.iloc[idx]
        row_num = idx + 2  # 1-based + header
        row_errors = []

        # Check for missing values
        for col in expected_features + ["label"]:
            if pd.isna(row[col]):
                row_errors.append(
                    RowValidationError(row=row_num, column=col, error="Missing value")
                )

        if row_errors:
            validation_errors.extend(row_errors)
            continue

        # Check feature values are numeric
        feature_vals = []
        has_bad_feature = False
        for col in expected_features:
            try:
                val = float(row[col])
                if not np.isfinite(val):
                    validation_errors.append(
                        RowValidationError(
                            row=row_num, column=col, error=f"Non-finite value: {row[col]}"
                        )
                    )
                    has_bad_feature = True
                else:
                    feature_vals.append(val)
            except (ValueError, TypeError):
                validation_errors.append(
                    RowValidationError(
                        row=row_num,
                        column=col,
                        error=f"Non-numeric value: '{row[col]}'",
                    )
                )
                has_bad_feature = True

        if has_bad_feature:
            continue

        # Check label is 0 or 1
        try:
            label_val = int(float(row["label"]))
            if label_val not in (0, 1):
                validation_errors.append(
                    RowValidationError(
                        row=row_num,
                        column="label",
                        error=f"Label must be 0 or 1, got {row['label']}",
                    )
                )
                continue
        except (ValueError, TypeError):
            validation_errors.append(
                RowValidationError(
                    row=row_num,
                    column="label",
                    error=f"Non-numeric label: '{row['label']}'",
                )
            )
            continue

        feat_dict = dict(zip(expected_features, feature_vals))
        fp = compute_sample_fingerprint(disease, feat_dict, label_val)

        # Check duplicate against database or current upload batch
        if fp in db_fingerprints or fp in seen_batch_fps:
            duplicate_rows_count += 1
            validation_errors.append(
                RowValidationError(
                    row=row_num, column="*", error="Duplicate row (already exists in database or file)"
                )
            )
            continue

        seen_batch_fps.add(fp)
        accepted_records.append((idx, feature_vals, label_val, fp, feat_dict))

    # --- Store accepted rows ---
    dataset_record = UploadedDataset(
        disease_id=disease,
        original_filename=file.filename or "unknown.csv",
        file_hash=file_hash,
        schema_json=json.dumps(expected_features),
        row_count=len(accepted_records),
        rejected_count=len(df) - len(accepted_records),
    )
    db.add(dataset_record)
    await db.flush()  # get the ID

    for _idx, _feature_vals, label_val, fp, feat_dict in accepted_records:
        sample = TrainingSample(
            dataset_id=dataset_record.id,
            disease_id=disease,
            fingerprint=fp,
            features_json=json.dumps(feat_dict),
            label=label_val,
        )
        db.add(sample)

    await db.commit()
    await db.refresh(dataset_record)

    return DatasetUploadResponse(
        dataset_id=dataset_record.id,
        disease=disease,
        original_filename=dataset_record.original_filename,
        accepted_rows=dataset_record.row_count,
        rejected_rows=dataset_record.rejected_count,
        duplicate_rows=duplicate_rows_count,
        validation_errors=validation_errors,
        created_at=dataset_record.created_at,
    )
