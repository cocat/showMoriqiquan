"""
Clerk JWT 认证中间件
"""
import os
from datetime import datetime
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserTier

security = HTTPBearer(auto_error=False)

# 默认完全开放：不校验 JWT，直接视为 admin。设为 "false" 可恢复 Clerk 校验
SKIP_CLERK = os.getenv("SKIP_CLERK", "true").strip().lower() == "true"

CLERK_PEM_PUBLIC_KEY = os.getenv("CLERK_PEM_PUBLIC_KEY", "")
CLERK_ISSUER = os.getenv("CLERK_ISSUER", "")

# 拥有「最全权限」的 Clerk User ID 列表（逗号分隔），可看全部历史报告与完整页面
_ADMIN_CLERK_IDS = frozenset(
    x.strip() for x in os.getenv("ADMIN_CLERK_IDS", "").split(",") if x.strip()
)


def get_effective_tier(user: Optional[User]) -> Optional[UserTier]:
    """返回当前用户生效的 tier；订阅过期则降为 guest。"""
    if not user:
        return None
    if getattr(user, "tier", None) == UserTier.ADMIN:
        return UserTier.ADMIN
    if user.clerk_user_id and user.clerk_user_id in _ADMIN_CLERK_IDS:
        return UserTier.ADMIN
    # observer/tracker 需订阅有效：无 subscription_end 或已过期则按 guest 处理
    sub_end = getattr(user, "subscription_end", None)
    if user.tier in (UserTier.OBSERVER, UserTier.TRACKER):
        if not sub_end or datetime.utcnow() > sub_end:
            return UserTier.GUEST
    return user.tier


class _FakeAdminUser:
    """禁用 Clerk 时使用的虚拟 admin 用户，用于直接暴露最高权限。"""
    user_id = "skip_clerk"
    clerk_user_id = None
    tier = UserTier.ADMIN
    email = None
    display_name = "本地用户"
    subscription_end = None
    is_active = True
    daily_query_count = 0


_FAKE_ADMIN_USER = _FakeAdminUser()


def verify_clerk_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token,
            CLERK_PEM_PUBLIC_KEY,
            algorithms=["RS256"],
            issuer=CLERK_ISSUER,
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if SKIP_CLERK:
        return _FAKE_ADMIN_USER  # type: ignore[return-value]
    if not credentials or not CLERK_PEM_PUBLIC_KEY or not CLERK_ISSUER:
        return None

    try:
        payload = verify_clerk_token(credentials.credentials)
        clerk_user_id = payload.get("sub")
        if not clerk_user_id:
            return None

        user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
        if not user:
            email = payload.get("email")
            if email:
                user = db.query(User).filter(
                    User.email == email,
                    User.clerk_user_id.is_(None),
                ).first()
                if user:
                    user.clerk_user_id = clerk_user_id
                    user.phone = payload.get("phone_number") or user.phone
                    db.commit()
                    db.refresh(user)

        if not user:
            user = User(
                user_id=clerk_user_id,
                clerk_user_id=clerk_user_id,
                email=payload.get("email"),
                phone=payload.get("phone_number"),
                tier=UserTier.OBSERVER,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        return user
    except Exception:
        return None
