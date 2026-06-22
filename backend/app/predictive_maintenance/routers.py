from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
import redis.asyncio as aioredis
import uuid
from datetime import datetime, timezone

from backend.app.dependencies.db import get_async_session
from backend.app.dependencies.auth import verify_jwt_token, RoleChecker, CurrentUser
from backend.app.dependencies.redis_client import get_redis_client
from backend.app.predictive_maintenance.schemas import (
    EquipmentCreateSchema,
    EquipmentResponseSchema,
    SensorLogCreateSchema,
    SensorLogResponseSchema,
    PredictiveInferenceResponseSchema,
    BatchPredictiveInferenceRequestSchema,
    BatchPredictiveInferenceResponseSchema,
    ModelMetadataResponseSchema
)
from backend.app.predictive_maintenance.services import PredictiveMaintenanceService
from backend.app.db.models import EquipmentModel
from backend.app.exceptions.custom_exceptions import ActionForbiddenException, EntityNotFoundException
from sqlalchemy.future import select

maintenance_router = APIRouter(prefix="/maintenance", tags=["Hardware Registry & XGBoost Analytics"])
maintenance_service = PredictiveMaintenanceService()

@maintenance_router.get(
    "/metadata",
    response_model=ModelMetadataResponseSchema,
    summary="Fetch master XGBoost parameter and accuracy configurations"
)
async def get_model_metadata(
    current_user: CurrentUser = Depends(verify_jwt_token)
) -> ModelMetadataResponseSchema:
    """
    Returns high-level metadata of the active XGBoost and SHAP prediction runtimes,
    useful for system monitors, tracking drift, or displaying feature names.
    """
    metadata = maintenance_service.predictor.model_loader.get_metadata()
    return ModelMetadataResponseSchema(**metadata)


@maintenance_router.post(
    "/telemetry/record",
    response_model=PredictiveInferenceResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest high-frequency machine operating metrics and run real-time predictions"
)
async def record_sensor_telemetry(
    payload: SensorLogCreateSchema,
    session: AsyncSession = Depends(get_async_session),
    redis_client: aioredis.Redis = Depends(get_redis_client),
    current_user: CurrentUser = Depends(verify_jwt_token)
) -> PredictiveInferenceResponseSchema:
    """
    Processes high-frequency real-time physical sensor feeds, running prediction,
    updating database readings, updating device health statuses, and caching features.
    """
    prediction_result = await maintenance_service.evaluate_single_telemetry(
        session=session,
        payload=payload,
        redis_client=redis_client
    )
    return PredictiveInferenceResponseSchema(**prediction_result)


@maintenance_router.post(
    "/predict/batch",
    response_model=BatchPredictiveInferenceResponseSchema,
    summary="Execute multi-asset prediction analysis arrays concurrently"
)
async def predict_telemetry_batch(
    payload: BatchPredictiveInferenceRequestSchema,
    session: AsyncSession = Depends(get_async_session),
    redis_client: aioredis.Redis = Depends(get_redis_client),
    current_user: CurrentUser = Depends(verify_jwt_token)
) -> BatchPredictiveInferenceResponseSchema:
    """
    Executes multiple inference loops simultaneously across several machinery units,
    ideal for scheduled shifts or batch checks.
    """
    predictions = await maintenance_service.evaluate_batch_telemetry(
        session=session,
        payload=payload,
        redis_client=redis_client
    )
    return BatchPredictiveInferenceResponseSchema(
        batch_size=len(payload.items),
        predictions=[PredictiveInferenceResponseSchema(**p) for p in predictions]
    )


@maintenance_router.get(
    "/equipment",
    response_model=List[EquipmentResponseSchema],
    summary="Fetch master inventory catalog of physical machinery"
)
async def list_factory_machinery(
    session: AsyncSession = Depends(get_async_session),
    current_user: CurrentUser = Depends(verify_jwt_token)
) -> List[EquipmentResponseSchema]:
    """
    Retrieves all asset cards deployed inside active facility databases.
    """
    stmt = select(EquipmentModel).where(EquipmentModel.deleted_at.is_(None))
    result = await session.execute(stmt)
    equipment_list = result.scalars().all()
    return [EquipmentResponseSchema.model_validate(eq) for eq in equipment_list]


@maintenance_router.post(
    "/equipment",
    response_model=EquipmentResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new mechanical physical device asset"
)
async def register_new_equipment(
    payload: EquipmentCreateSchema,
    session: AsyncSession = Depends(get_async_session),
    current_user: CurrentUser = Depends(RoleChecker(["Admin", "Manager"]))
) -> EquipmentResponseSchema:
    """
    Registers a new industrial asset mapping its specifications and serial keys
    under the secure inventory database registry. Accessible only by Administrators and Managers.
    """
    # 1. Check for serial duplicates
    dup_stmt = select(EquipmentModel).where(
        EquipmentModel.serial_number == payload.serial_number,
        EquipmentModel.deleted_at.is_(None)
    )
    dup_res = await session.execute(dup_stmt)
    if dup_res.scalar_one_or_none() is not None:
        raise ActionForbiddenException(
            f"An industrial asset with serial reference '{payload.serial_number}' is already registered."
        )

    # 2. Extract active facility zone index dynamically, or fallback to default
    # Looking up any existing zone inside facility_zones
    from backend.app.db.models import ZoneModel
    zone_stmt = select(ZoneModel)
    zone_res = await session.execute(zone_stmt)
    zone = zone_res.scalars().first()
    
    if not zone:
        # If no default zone exists, seed one to maintain foreign constraints
        zone = ZoneModel(
            id=str(uuid.uuid4()),
            name="Alpha Production Hall",
            description="Primary seed assembly area"
        )
        session.add(zone)
        await session.flush()

    new_eq = EquipmentModel(
        id=str(uuid.uuid4()),
        zone_id=zone.id,
        name=payload.name,
        serial_number=payload.serial_number,
        status="nominal",
        model_type=payload.model_type,
        install_date=payload.install_date
    )
    
    session.add(new_eq)
    await session.commit()
    await session.refresh(new_eq)
    return EquipmentResponseSchema.model_validate(new_eq)
