from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class NodeStatusMeshSchema(BaseModel):
    mesh_reference_id: str
    active_coordinates: List[float] = Field(..., max_items=3, min_items=3, description="XYZ coordinates")
    component_color_indicator: str  # Hex override, e.g. "#10B981"
    operational_load_percentage: float

class SpatialSystemStateSchema(BaseModel):
    equipment_id: str
    is_twin_synchronized: bool
    nodes: List[NodeStatusMeshSchema]
    active_telemetry_snapshot: Dict[str, Any]
