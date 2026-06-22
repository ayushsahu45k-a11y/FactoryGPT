from typing import List, Dict, Any
from pydantic import BaseModel

class LiveStatusSummarySchema(BaseModel):
    total_equipment_monitored: int
    nominal_equipment_count: int
    warning_equipment_count: int
    critical_equipment_count: int
    active_alarms_pending: int
    unresolved_safety_incidents: int

class FloorActivityGapsSchema(BaseModel):
    hour: str
    vibe_coefficient: float
    detected_violations: int

class AdminKPIDashboardSchema(BaseModel):
    stats: LiveStatusSummarySchema
    recent_activity_trends: List[FloorActivityGapsSchema]
    unresolved_alert_descriptions: List[str]
