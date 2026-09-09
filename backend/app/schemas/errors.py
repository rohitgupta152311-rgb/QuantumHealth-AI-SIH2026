from pydantic import BaseModel
from typing import Optional, Any

class ErrorResponse(BaseModel):
    error_code: str
    message: str
    details: Optional[dict[str, Any]] = None
    
class ClinicalValidationWarning(BaseModel):
    feature: str
    value: float
    expected_range: tuple[float, float]
    severity: str  # 'info', 'warning', 'critical'
    message: str
