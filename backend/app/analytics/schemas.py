from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class AnalyticsTimelineRequestSchema(BaseModel):
    equipment_ids: List[str] = Field(..., min_items=1)
    resolution_seconds: int = Field(default=60, ge=1)
    start_time: datetime
    end_time: datetime

class TelemetryDataPointSchema(BaseModel):
    timestamp: datetime
    average_temperature: float
    average_vibration: float
    average_pressure: float
    max_failure_risk: float

class EquipmentAnalyticalGroupSchema(BaseModel):
    equipment_id: str
    timeline: List[TelemetryDataPointSchema]
    regression_slope_vibration: float
    regression_slope_temp: float
