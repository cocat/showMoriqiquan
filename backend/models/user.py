"""
用户数据模型 - 与 moriqiquan RDS 共享（仅 auth 用）
"""
from datetime import datetime
from enum import Enum
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Integer,
    Boolean,
    Enum as SQLEnum,
)
from database import Base


class UserTier(str, Enum):
    GUEST = "guest"
    OBSERVER = "observer"
    TRACKER = "tracker"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    user_id = Column(String(64), primary_key=True, index=True)
    tier = Column(SQLEnum(UserTier), default=UserTier.OBSERVER, nullable=False)
    clerk_user_id = Column(String(128), unique=True, nullable=True, index=True)
    email = Column(String(255), nullable=True, index=True)
    phone = Column(String(32), nullable=True)
    password_hash = Column(String(255), nullable=True)
    password_updated_at = Column(DateTime, nullable=True)
    display_name = Column(String(128), nullable=True)
    avatar_url = Column(String(512), nullable=True)
    subscription_start = Column(DateTime, nullable=True)
    subscription_end = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    daily_query_count = Column(Integer, default=0, nullable=False)
    daily_query_reset_at = Column(DateTime, nullable=True)
    last_access_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
