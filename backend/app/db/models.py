from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy import String, Integer, BigInteger, Numeric, Boolean, DateTime, ForeignKey, Table, Column, JSON, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.schema import Index

from backend.app.db.base import Base, CleanTimestampMixin, SoftDeleteMixin

# ==============================================================================
# Many-to-Many Association Tables
# ==============================================================================

role_permissions = Table(
    "auth_role_permissions",
    Base.metadata,
    Column("role_id", String(36), ForeignKey("auth_roles.id", ondelete="CASCADE"), primary_key=True),
    Column("permission_id", String(36), ForeignKey("auth_permissions.id", ondelete="CASCADE"), primary_key=True),
)


# ==============================================================================
# RBAC & User Management Module
# ==============================================================================

class PermissionModel(Base, CleanTimestampMixin, SoftDeleteMixin):
    __tablename__ = "auth_permissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    roles: Mapped[List["RoleModel"]] = relationship(
        "RoleModel",
        secondary=role_permissions,
        back_populates="permissions"
    )


class RoleModel(Base, CleanTimestampMixin, SoftDeleteMixin):
    __tablename__ = "auth_roles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Relationships
    permissions: Mapped[List[PermissionModel]] = relationship(
        "PermissionModel",
        secondary=role_permissions,
        back_populates="roles"
    )
    users: Mapped[List["UserModel"]] = relationship("UserModel", back_populates="role")


class UserModel(Base, CleanTimestampMixin, SoftDeleteMixin):
    __tablename__ = "auth_users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    role_id: Mapped[str] = mapped_column(String(36), ForeignKey("auth_roles.id", ondelete="RESTRICT"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    role: Mapped[RoleModel] = relationship("RoleModel", back_populates="users")
    dashboard_widgets: Mapped[List["DashboardWidgetModel"]] = relationship("DashboardWidgetModel", back_populates="user")
    reports_generated: Mapped[List["ReportModel"]] = relationship("ReportModel", back_populates="author")
    conversations: Mapped[List["ConversationModel"]] = relationship("ConversationModel", back_populates="user")
    resolved_safety_events: Mapped[List["SafetyEventModel"]] = relationship("SafetyEventModel", back_populates="resolved_by")
    acknowledged_alerts: Mapped[List["AlertModel"]] = relationship(
        "AlertModel",
        foreign_keys="AlertModel.acknowledged_by_id",
        back_populates="acknowledged_by"
    )
    resolved_alerts: Mapped[List["AlertModel"]] = relationship(
        "AlertModel",
        foreign_keys="AlertModel.resolved_by_id",
        back_populates="resolved_by"
    )


# ==============================================================================
# Core Industrial Layout & Topology
# ==============================================================================

class ZoneModel(Base, CleanTimestampMixin, SoftDeleteMixin):
    __tablename__ = "facility_zones"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    
    # Optional field capturing polygon vertex offsets e.g., JSON representation mapping the coordinate bounds
    polygon_coordinates: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Relationships
    cameras: Mapped[List["CameraModel"]] = relationship("CameraModel", back_populates="zone")
    equipment: Mapped[List["EquipmentModel"]] = relationship("EquipmentModel", back_populates="zone")
    safety_events: Mapped[List["SafetyEventModel"]] = relationship("SafetyEventModel", back_populates="zone")


class CameraModel(Base, CleanTimestampMixin, SoftDeleteMixin):
    __tablename__ = "facility_cameras"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    zone_id: Mapped[str] = mapped_column(String(36), ForeignKey("facility_zones.id", ondelete="RESTRICT"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    ip_stream_url: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    zone: Mapped[ZoneModel] = relationship("ZoneModel", back_populates="cameras")
    safety_events: Mapped[List["SafetyEventModel"]] = relationship("SafetyEventModel", back_populates="camera")


class EquipmentModel(Base, CleanTimestampMixin, SoftDeleteMixin):
    __tablename__ = "facility_equipment"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    zone_id: Mapped[str] = mapped_column(String(36), ForeignKey("facility_zones.id", ondelete="RESTRICT"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    serial_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="nominal", nullable=False) # nominal, warning, critical, maintenance
    model_type: Mapped[str] = mapped_column(String(50), nullable=False)                # e.g., "Turbine", "Pump"
    install_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Relationships
    zone: Mapped[ZoneModel] = relationship("ZoneModel", back_populates="equipment")
    sensor_readings: Mapped[List["SensorReadingModel"]] = relationship("SensorReadingModel", back_populates="equipment", cascade="all, delete-orphan")
    predictions: Mapped[List["PredictionModel"]] = relationship("PredictionModel", back_populates="equipment", cascade="all, delete-orphan")
    alerts: Mapped[List["AlertModel"]] = relationship("AlertModel", back_populates="equipment", cascade="all, delete-orphan")


# ==============================================================================
# High-Frequency Streams & AI Inference
# ==============================================================================

class SensorReadingModel(Base):
    __tablename__ = "iot_sensor_readings"

    # BigInteger is vital for time-series streams where record lists escalate fast
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    equipment_id: Mapped[str] = mapped_column(String(36), ForeignKey("facility_equipment.id", ondelete="CASCADE"), nullable=False, index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, index=True, nullable=False)
    temperature: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    vibration: Mapped[float] = mapped_column(Numeric(8, 4), nullable=False)
    pressure: Mapped[float] = mapped_column(Numeric(6, 2), nullable=False)
    voltage: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True) # Volts
    current: Mapped[Optional[float]] = mapped_column(Numeric(6, 2), nullable=True) # Amperes

    # Relationships
    equipment: Mapped[EquipmentModel] = relationship("EquipmentModel", back_populates="sensor_readings")


class PredictionModel(Base, CleanTimestampMixin):
    __tablename__ = "inference_predictions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    equipment_id: Mapped[str] = mapped_column(String(36), ForeignKey("facility_equipment.id", ondelete="CASCADE"), nullable=False, index=True)
    prediction_timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, index=True, nullable=False)
    failure_probability: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False) # 0.000 to 1.000
    predicted_remaining_useful_life_hours: Mapped[float] = mapped_column(Numeric(8, 2), nullable=False)
    feature_importance_snapshot: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    model_version: Mapped[str] = mapped_column(String(50), nullable=False)

    # Relationships
    equipment: Mapped[EquipmentModel] = relationship("EquipmentModel", back_populates="predictions")


class SafetyEventModel(Base, CleanTimestampMixin, SoftDeleteMixin):
    __tablename__ = "safety_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    camera_id: Mapped[str] = mapped_column(String(36), ForeignKey("facility_cameras.id", ondelete="RESTRICT"), nullable=False, index=True)
    zone_id: Mapped[str] = mapped_column(String(36), ForeignKey("facility_zones.id", ondelete="RESTRICT"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False) # e.g., "no_helmet", "no_vest"
    confidence: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False) # e.g. 0.942
    snapshot_path: Mapped[str] = mapped_column(String(255), nullable=False) # URL / cloud store directory location
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, index=True, nullable=False)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("auth_users.id", ondelete="RESTRICT"), nullable=True)
    resolution_notes: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Relationships
    camera: Mapped[CameraModel] = relationship("CameraModel", back_populates="safety_events")
    zone: Mapped[ZoneModel] = relationship("ZoneModel", back_populates="safety_events")
    resolved_by: Mapped[Optional[UserModel]] = relationship("UserModel", back_populates="resolved_safety_events")
    associated_alerts: Mapped[List["AlertModel"]] = relationship("AlertModel", back_populates="safety_event")


# ==============================================================================
# Alerts & Triggers
# ==============================================================================

class AlertRuleModel(Base, CleanTimestampMixin, SoftDeleteMixin):
    __tablename__ = "alert_rules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    equipment_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # General threshold or specific
    metric: Mapped[str] = mapped_column(String(50), nullable=False) # e.g., "temperature" | "vibration"
    operator: Mapped[str] = mapped_column(String(10), nullable=False) # e.g., ">" | "<"
    threshold_value: Mapped[float] = mapped_column(Numeric(10, 4), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="warning", nullable=False) # warning, critical, emergency
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    triggered_alerts: Mapped[List["AlertModel"]] = relationship("AlertModel", back_populates="rule")


class AlertModel(Base, CleanTimestampMixin):
    __tablename__ = "system_alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    rule_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("alert_rules.id", ondelete="SET NULL"), nullable=True, index=True)
    equipment_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("facility_equipment.id", ondelete="CASCADE"), nullable=True, index=True)
    safety_event_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("safety_events.id", ondelete="CASCADE"), nullable=True, index=True)
    
    severity: Mapped[str] = mapped_column(String(20), default="warning", nullable=False) # warning, critical, emergency
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False) # active, acknowledged, resolved
    message: Mapped[str] = mapped_column(String(255), nullable=False)
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, index=True, nullable=False)
    
    acknowledged_by_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("auth_users.id", ondelete="RESTRICT"), nullable=True)
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    resolved_by_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("auth_users.id", ondelete="RESTRICT"), nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    rule: Mapped[Optional[AlertRuleModel]] = relationship("AlertRuleModel", back_populates="triggered_alerts")
    equipment: Mapped[Optional[EquipmentModel]] = relationship("EquipmentModel", back_populates="alerts")
    safety_event: Mapped[Optional[SafetyEventModel]] = relationship("SafetyEventModel", back_populates="associated_alerts")
    acknowledged_by: Mapped[Optional[UserModel]] = relationship(
        "UserModel",
        foreign_keys=[acknowledged_by_id],
        back_populates="acknowledged_alerts"
    )
    resolved_by: Mapped[Optional[UserModel]] = relationship(
        "UserModel",
        foreign_keys=[resolved_by_id],
        back_populates="resolved_alerts"
    )


# ==============================================================================
# Reports & Dashboard Operations
# ==============================================================================

class ReportModel(Base, CleanTimestampMixin, SoftDeleteMixin):
    __tablename__ = "regulatory_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    generated_by_id: Mapped[str] = mapped_column(String(36), ForeignKey("auth_users.id", ondelete="RESTRICT"), nullable=False, index=True)
    report_type: Mapped[str] = mapped_column(String(50), nullable=False) # safety, maintenance, compliance
    s3_path: Mapped[str] = mapped_column(String(255), nullable=False) # Secure binary document link
    start_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Relationships
    author: Mapped[UserModel] = relationship("UserModel", back_populates="reports_generated")


class DashboardWidgetModel(Base, CleanTimestampMixin):
    __tablename__ = "dashboard_widgets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    widget_type: Mapped[str] = mapped_column(String(50), nullable=False) # telemetry_timeseries, safety_gauge, alert_ticker
    config: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    grid_layout: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)

    # Relationships
    user: Mapped[UserModel] = relationship("UserModel", back_populates="dashboard_widgets")


# ==============================================================================
# AI Copilot Module
# ==============================================================================

class ConversationModel(Base, CleanTimestampMixin, SoftDeleteMixin):
    __tablename__ = "conversational_copilot_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False)

    # Relationships
    user: Mapped[UserModel] = relationship("UserModel", back_populates="conversations")
    messages: Mapped[List["MessageModel"]] = relationship("MessageModel", back_populates="conversation", cascade="all, delete-orphan")


class MessageModel(Base, CleanTimestampMixin):
    __tablename__ = "copilot_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    conversation_id: Mapped[str] = mapped_column(String(36), ForeignKey("conversational_copilot_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_type: Mapped[str] = mapped_column(String(20), nullable=False) # user, assistant
    content: Mapped[str] = mapped_column(String(5000), nullable=False) # Extended feedback
    
    # Metadata parameters capturing automated suggestions or control system action indicators
    metadata_actions: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    # Relationships
    conversation: Mapped[ConversationModel] = relationship("ConversationModel", back_populates="messages")


# ==============================================================================
# Indexes & Optimizations
# ==============================================================================

# Highly performant composite indices for temporal queries typically run by developers
Index("idx_sensor_iot_time_equip", SensorReadingModel.timestamp.desc(), SensorReadingModel.equipment_id)
Index("idx_inference_predictions_time_equip", PredictionModel.prediction_timestamp.desc(), PredictionModel.equipment_id)
Index("idx_safety_events_date_camera", SafetyEventModel.detected_at.desc(), SafetyEventModel.camera_id)
