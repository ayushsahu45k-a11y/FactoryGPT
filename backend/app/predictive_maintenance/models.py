# Console and domain mapping entities for FactoryGPT Predictive Maintenance.
# NOTE: All master SQLAlchemy models are centralized in '/backend/app/db/models.py'
# to preserve unified database migrations and relationship graphs.

from backend.app.db.models import EquipmentModel, SensorReadingModel, PredictionModel

__all__ = ["EquipmentModel", "SensorReadingModel", "PredictionModel"]
