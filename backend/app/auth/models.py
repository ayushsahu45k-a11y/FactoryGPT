from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.app.db.base import Base, CleanTimestampMixin

class UserRefreshTokenModel(Base, CleanTimestampMixin):
    __tablename__ = "auth_refresh_tokens"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("auth_users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_jti: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    parent_jti: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)  # Tracker for token rotation
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Relationship to users table
    user = relationship("UserModel", back_populates="refresh_tokens" if hasattr(Base, "refresh_tokens") else None)
