from datetime import datetime
from sqlalchemy import String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase

class Base(DeclarativeBase):
    pass

class OperationalAlertModel(Base):
    __tablename__ = "system_alerts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    source_module: Mapped[str] = mapped_column(String(50), nullable=False) # e.g. "safety_monitoring" | "predictive_maintenance"
    severity: Mapped[str] = mapped_column(String(20), default="warning", nullable=False) # warning, critical, emergency
    target_entity_id: Mapped[str] = mapped_column(String(36), nullable=False) # UUID of target camera or equipment
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    triggered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, nullable=False)
    acknowledged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    acknowledged_by: Mapped[str] = mapped_column(String(100), nullable=True)
