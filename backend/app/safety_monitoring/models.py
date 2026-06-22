from datetime import datetime
from sqlalchemy import String, DateTime, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase

class Base(DeclarativeBase):
    pass

class SafetyCameraModel(Base):
    __tablename__ = "factory_cameras"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    location_name: Mapped[str] = mapped_column(String(150), nullable=False) # e.g. "Staging Bay Beta East"
    ip_stream_url: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, nullable=False)


class SafetyViolationModel(Base):
    __tablename__ = "safety_violations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    camera_id: Mapped[str] = mapped_column(String(36), ForeignKey("factory_cameras.id"), nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, index=True, nullable=False)
    violation_type: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., "no_helmet", "no_vest"
    confidence: Mapped[float] = mapped_column(Numeric(4, 3), nullable=False)  # YOLOv8 confidence ratio e.g., 0.942
    snapshot_url: Mapped[str] = mapped_column(String(255), nullable=False)     # Object storage file ref
    resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    resolved_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    resolved_by: Mapped[str] = mapped_column(String(100), nullable=True)     # UUID reference
