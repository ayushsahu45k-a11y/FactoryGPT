from datetime import datetime
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, DeclarativeBase

class Base(DeclarativeBase):
    pass

class CompiledReportModel(Base):
    __tablename__ = "factory_reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(150), nullable=False) # e.g. "Weekly Safe Operating Analysis Q2"
    generated_by: Mapped[str] = mapped_column(String(100), nullable=False) # UUID identifier reference
    report_type: Mapped[str] = mapped_column(String(50), nullable=False) # safety, maintenance, compliance, custom
    s3_snapshot_path: Mapped[str] = mapped_column(String(255), nullable=False) # Static document link
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.now, nullable=False)
