from pydantic import BaseModel, Field
from typing import List, Optional, Tuple
from enum import Enum

class ComplianceStatus(str, Enum):
    FULLY_COMPLIANT = "FULLY_COMPLIANT"
    PARTIAL = "PARTIAL"
    NON_COMPLIANT = "NON_COMPLIANT"
    NO_PERSON = "NO_PERSON"

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float

class DetectionItem(BaseModel):
    class_id: int = Field(..., description="Class identifier matching global weights config.")
    name: str = Field(..., description="Target entity identifier (e.g., Person, Helmet, Safety Vest).")
    confidence: float = Field(..., ge=0.0, le=1.0)
    box: BoundingBox

class PersonAnalysis(BaseModel):
    person_id: int
    box: BoundingBox
    has_helmet: bool
    has_vest: bool
    helmet_confidence: Optional[float] = None
    vest_confidence: Optional[float] = None
    status: ComplianceStatus

class BatchFrameResult(BaseModel):
    frame_index: int
    compliance_status: ComplianceStatus
    total_persons_detected: int
    compliant_persons_count: int
    detections: List[DetectionItem]
    person_analytics: List[PersonAnalysis]

class PPEDetectionResponse(BaseModel):
    status: str = "success"
    summary: BatchFrameResult
