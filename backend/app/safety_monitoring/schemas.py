from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict, HttpUrl

class CameraCreateSchema(BaseModel):
    location_name: str = Field(..., max_length=150)
    ip_stream_url: str = Field(..., max_length=255)

class CameraResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    location_name: str
    ip_stream_url: str
    is_active: bool
    created_at: datetime

class IngestViolationSchema(BaseModel):
    camera_id: str = Field(..., max_length=36)
    violation_type: str = Field(..., description="YOLO classification labels: 'no_helmet' | 'no_vest'")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model calculation confidence")
    snapshot_url: str = Field(..., description="Annotated capture image pathway link")

class ViolationResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    camera_id: str
    timestamp: datetime
    violation_type: str
    confidence: float
    snapshot_url: str
    resolved: bool
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
