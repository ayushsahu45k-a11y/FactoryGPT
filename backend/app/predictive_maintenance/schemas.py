from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

class EquipmentCreateSchema(BaseModel):
    name: str = Field(..., max_length=100)
    serial_number: str = Field(..., max_length=100)
    model_type: str = Field(..., max_length=50, description="e.g., Turbine, Pump, Compressor, Generator")
    install_date: datetime = Field(..., description="Date of hardware deployment")

class EquipmentResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    name: str
    serial_number: str
    status: str
    model_type: str
    install_date: datetime
    created_at: datetime

class SensorLogCreateSchema(BaseModel):
    equipment_id: str = Field(..., max_length=36)
    temperature: float = Field(..., description="Operating thermal level (Celsius)")
    vibration: float = Field(..., description="Vibration amplitude (mm/s)")
    pressure: float = Field(..., description="System fluid/pneumatic pressure (bar)")
    voltage: Optional[float] = Field(None, description="Operating electrical Potential (Volts)")
    current: Optional[float] = Field(None, description="Operating current draw (Amperes)")

class SensorLogResponseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    equipment_id: str
    timestamp: datetime
    temperature: float
    vibration: float
    pressure: float
    voltage: Optional[float] = None
    current: Optional[float] = None
    failure_risk: float = Field(..., description="XGBoost failure risk probability scaled 0.0 to 100.0")

class PredictiveInferenceResponseSchema(BaseModel):
    failure_probability: float = Field(..., description="Probability score between 0.000 and 1.000")
    risk_level: str = Field(..., description="Nominal, Warning, Critical, Emergency")
    predicted_remaining_useful_life_hours: float = Field(..., description="Remaining Useful Life estimate in hours")
    shap_explanation: Dict[str, float] = Field(..., description="Decomposed SHAP contribution coordinates")
    engineered_features_snapshot: Dict[str, float] = Field(..., description="Extracted mathematical transforms")

class BatchPredictionItemSchema(BaseModel):
    equipment_id: str
    temperature: float
    vibration: float
    pressure: float
    voltage: Optional[float] = None
    current: Optional[float] = None

class BatchPredictiveInferenceRequestSchema(BaseModel):
    items: List[BatchPredictionItemSchema]

class BatchPredictiveInferenceResponseSchema(BaseModel):
    status: str = "success"
    batch_size: int
    predictions: List[PredictiveInferenceResponseSchema]

class FrameworkVersionsSchema(BaseModel):
    xgboost: str
    shap: str
    scikit_learn: str = Field(..., alias="scikit-learn")

class AccuracyMetricsSchema(BaseModel):
    auc_roc: float
    f1_score: float
    precision: float
    recall: float
    mean_absolute_error_rul_hours: float

class ModelMetadataResponseSchema(BaseModel):
    model_name: str
    modelVersion: str
    frameworks: FrameworkVersionsSchema
    parameters: Dict[str, Any]
    features_signature: List[str]
    metrics: AccuracyMetricsSchema
    last_train_timestamp: str
