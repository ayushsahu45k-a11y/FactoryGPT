from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class ReportRequestSchema(BaseModel):
    title: str = Field(..., max_length=150)
    report_type: str = Field(..., description="Target criteria: 'safety' | 'maintenance' | 'compliance'")
    start_date: datetime
    end_date: datetime

class ReportResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    title: str
    generated_by: str
    report_type: str
    s3_snapshot_path: str
    created_at: datetime
