from typing import List, Optional
from pydantic import BaseModel, Field

class CopilotQuerySchema(BaseModel):
    prompt: str = Field(..., min_length=2, description="Natural language instructions to the copilot")
    context_equipment_id: Optional[str] = Field(default=None, description="Scope instructions inside target hardware")

class CopilotExecutedActionSchema(BaseModel):
    action_type: str # e.g. "schedule_maintenance" | "query_telemetry" | "none"
    target_entity_id: Optional[str] = None
    result_summary: str

class CopilotResponseSchema(BaseModel):
    conversation_response: str = Field(..., description="The conversational markdown feedback response")
    proposed_actions: List[CopilotExecutedActionSchema] = Field(default_factory=list)
