from pydantic import BaseModel
from typing import List
from datetime import datetime

class RowValidationError(BaseModel):
    row: int
    column: str
    error: str

class DatasetUploadResponse(BaseModel):
    dataset_id: int
    disease: str
    original_filename: str
    accepted_rows: int
    rejected_rows: int
    validation_errors: List[RowValidationError]
    created_at: datetime

class DatasetInfoResponse(BaseModel):
    id: int
    disease_id: str
    original_filename: str
    row_count: int
    rejected_count: int
    created_at: datetime
