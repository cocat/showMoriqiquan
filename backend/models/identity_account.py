"""
外部身份映射表：将多登录来源统一映射到内部 user_id。
"""
from datetime import datetime
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Integer,
    UniqueConstraint,
    Index,
)
from database import Base


class IdentityAccount(Base):
    __tablename__ = "identity_accounts"
    __table_args__ = (
        UniqueConstraint(
            "provider",
            "provider_user_id",
            name="uq_identity_provider_user",
        ),
        Index("idx_identity_user_id", "user_id"),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String(64), nullable=False)
    provider = Column(String(32), nullable=False)
    provider_user_id = Column(String(191), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(32), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
