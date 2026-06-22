from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict

class AlertAcknowledgeSchema(BaseModel):
    acknowledged: bool = Field(default=True)

class AlertResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    source_module: str
    severity: str
    target_entity_id: str
    description: str
    is_active: bool
    triggered_at: datetime
    acknowledged_at: Optional[datetime] = None
    acknowledged_by: Optional[str] = None
