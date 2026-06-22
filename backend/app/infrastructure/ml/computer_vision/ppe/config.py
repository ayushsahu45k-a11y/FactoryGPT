from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Dict, List, Optional
import torch

class PPEModelSettings(BaseSettings):
    # Model parameters
    WEIGHTS_PATH: str = Field("yolov8n-ppe.pt", description="Path to the YOLOv8 weights file.")
    IMAGE_SIZE: int = Field(640, description="Inference input dimensions.")
    CONF_THRESHOLD: float = Field(0.25, description="Detection confidence threshold.")
    IOU_THRESHOLD: float = Field(0.45, description="Non-maximum suppression IOU threshold.")
    
    # Class configuration mapping (Assuming standard dataset layout)
    # 0: Person, 1: Helmet, 2: Safety Vest
    CLASS_MAPPINGS: Dict[int, str] = {
        0: "Person",
        1: "Helmet",
        2: "Safety Vest"
    }
    
    # Device management
    FORCE_CPU: bool = Field(False)
    
    @property
    def device(self) -> str:
        if self.FORCE_CPU:
            return "cpu"
        if torch.cuda.is_available():
            return "cuda"
        if torch.backends.mps.is_available():
            return "mps"
        return "cpu"

    class Config:
        env_prefix = "PPE_"
        case_sensitive = True

ppe_settings = PPEModelSettings()
