import hashlib
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import redis.asyncio as aioredis
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.app.predictive_maintenance.predictor import PredictiveMaintenancePredictor
from backend.app.predictive_maintenance.schemas import SensorLogCreateSchema, BatchPredictiveInferenceRequestSchema
from backend.app.predictive_maintenance.celery_tasks import alert_response_cascade
from backend.app.db.models import SensorReadingModel, PredictionModel, EquipmentModel
from backend.app.exceptions.custom_exceptions import EntityNotFoundException, ActionForbiddenException

logger = logging.getLogger("factory_gpt.predictive_maintenance.services")

class PredictiveMaintenanceService:
    """
    Orchestrates ingestion, caching, and evaluation pipelines for FactoryGPT machinery.
    """

    def __init__(self) -> None:
        self.predictor = PredictiveMaintenancePredictor()

    def _generate_cache_key(self, raw_data: Dict[str, float]) -> str:
        """
        Calculates a unique, deterministic hash key based on raw telemetry values
        to act as a lookup coordinate inside Redis cache pools.
        """
        # Sort keys to ensure ordering invariance
        serialized = json.dumps(raw_data, sort_keys=True)
        token_hash = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
        return f"factorygpt:inference_cache:{token_hash}"

    async def evaluate_single_telemetry(
        self,
        session: AsyncSession,
        payload: SensorLogCreateSchema,
        redis_client: Optional[aioredis.Redis] = None
    ) -> Dict[str, Any]:
        """
        Evaluates a single incoming machine telemetry log.
        Matches the request parameters against Redis caches before invoking XGBoost.
        Saves telemetry and predictive indicators to Postgres, updates hardware status,
        and triggers Celery handlers for critical warnings.
        """
        # 1. Verify equipment exist inside physical facility inventories
        eq_stmt = select(EquipmentModel).where(
            EquipmentModel.id == payload.equipment_id,
            EquipmentModel.deleted_at.is_(None)
        )
        eq_res = await session.execute(eq_stmt)
        equipment = eq_res.scalar_one_or_none()
        if not equipment:
            raise EntityNotFoundException(f"Factory machinery with id {payload.equipment_id} not found.")

        raw_features = {
            "temperature": payload.temperature,
            "vibration": payload.vibration,
            "pressure": payload.pressure,
            "voltage": payload.voltage or 0.0,
            "current": payload.current or 0.0
        }

        # 2. Redis In-Memory Predictive Caching Step
        cache_key = self._generate_cache_key(raw_features)
        cached_result = None

        if redis_client:
            try:
                cached_data = await redis_client.get(cache_key)
                if cached_data:
                    logger.info(f"[+] Prediction hit found in Redis cache: {cache_key}")
                    cached_result = json.loads(cached_data)
            except Exception as e:
                logger.warning(f"Failed to query Redis cache during evaluation: {e}")

        # 3. Model Inference execution (If missing in cache)
        if cached_result:
            evaluation = cached_result
        else:
            evaluation = self.predictor.predict_single(raw_features, model_type=equipment.model_type)
            # Store back to cache with high-efficiency 5-minute expiry limits
            if redis_client:
                try:
                    await redis_client.setex(
                        cache_key,
                        300,  # 5 minutes
                        json.dumps(evaluation)
                    )
                    logger.info(f"[*] Cached new prediction record in Redis under key: {cache_key}")
                except Exception as e:
                    logger.warning(f"Failed to set prediction key inside Redis cache pool: {e}")

        # 4. Persistence workflow
        # A. Store raw telemetry log
        new_reading = SensorReadingModel(
            equipment_id=payload.equipment_id,
            timestamp=datetime.now(timezone.utc),
            temperature=payload.temperature,
            vibration=payload.vibration,
            pressure=payload.pressure,
            voltage=payload.voltage,
            current=payload.current
        )
        session.add(new_reading)

        # B. Store structured prediction result
        new_prediction = PredictionModel(
            id=str(uuid.uuid4()),
            equipment_id=payload.equipment_id,
            prediction_timestamp=datetime.now(timezone.utc),
            failure_probability=evaluation["failure_probability"],
            predicted_remaining_useful_life_hours=evaluation["predicted_remaining_useful_life_hours"],
            feature_importance_snapshot=evaluation["shap_explanation"],
            model_version=self.predictor.model_loader.model_version
        )
        session.add(new_prediction)

        # C. Update machinery operational status based on predicted risk metrics
        equipment.status = evaluation["risk_level"]
        await session.commit()

        # 5. Celery alert cascade trigger
        if evaluation["failure_probability"] >= 0.75:
            logger.warning(f"[🚨] CRITICAL RISK DETECTED for {payload.equipment_id}. Sending Alert to Celery cascade.")
            try:
                alert_response_cascade.delay(
                    equipment_id=payload.equipment_id,
                    risk_score=evaluation["failure_probability"],
                    risk_level=evaluation["risk_level"]
                )
            except Exception as e:
                logger.error(f"Failed to post alert payload to Celery rabbit/redis broker: {e}")

        return {
            **evaluation,
            "reading_id": new_reading.id if hasattr(new_reading, "id") else None,
            "prediction_id": new_prediction.id,
            "equipment_id": payload.equipment_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    async def evaluate_batch_telemetry(
        self,
        session: AsyncSession,
        payload: BatchPredictiveInferenceRequestSchema,
        redis_client: Optional[aioredis.Redis] = None
    ) -> List[Dict[str, Any]]:
        """
        Evaluates and runs predictions in batch blocks across facility sensors.
        Optimized to batch persist and run inference cascades.
        """
        results = []
        for item in payload.items:
            # Map item fields cleanly into a SensorLogCreateSchema payload
            item_payload = SensorLogCreateSchema(
                equipment_id=item.equipment_id,
                temperature=item.temperature,
                vibration=item.vibration,
                pressure=item.pressure,
                voltage=item.voltage,
                current=item.current
            )
            res = await self.evaluate_single_telemetry(session, item_payload, redis_client)
            results.append(res)
        return results
