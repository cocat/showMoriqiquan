"""
Clerk JWT 认证中间件（支持 JWKS 自动拉取公钥）
"""
import os
import time
import threading
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from database import get_db
from models.user import User, UserTier

security = HTTPBearer(auto_error=False)

SKIP_CLERK = os.getenv("SKIP_CLERK", "true").strip().lower() == "true"

CLERK_ISSUER = os.getenv("CLERK_ISSUER", "").rstrip("/")
CLERK_JWKS_URL = os.getenv(
    "CLERK_JWKS_URL",
    f"{CLERK_ISSUER}/.well-known/jwks.json" if CLERK_ISSUER else "",
)
# 兼容旧的静态 PEM 配置
CLERK_PEM_PUBLIC_KEY = os.getenv("CLERK_PEM_PUBLIC_KEY", "")

_ADMIN_CLERK_IDS = frozenset(
    x.strip() for x in os.getenv("ADMIN_CLERK_IDS", "").split(",") if x.strip()
)

# ---------- JWKS 缓存（TTL 1 小时） ----------
_jwks_cache: Optional[dict] = None
_jwks_fetched_at: float = 0
_jwks_ttl: float = 3600
_jwks_lock = threading.Lock()


def _fetch_jwks() -> dict:
    import urllib.request
    import json as _json

    with urllib.request.urlopen(CLERK_JWKS_URL, timeout=10) as resp:
        return _json.loads(resp.read().decode())


def get_jwks() -> Optional[dict]:
    global _jwks_cache, _jwks_fetched_at
    if not CLERK_JWKS_URL:
        return None
    now = time.monotonic()
    if _jwks_cache and (now - _jwks_fetched_at) < _jwks_ttl:
        return _jwks_cache
    with _jwks_lock:
        if _jwks_cache and (now - _jwks_fetched_at) < _jwks_ttl:
            return _jwks_cache
        try:
            _jwks_cache = _fetch_jwks()
            _jwks_fetched_at = time.monotonic()
        except Exception as exc:
            if _jwks_cache:
                return _jwks_cache  # 返回旧缓存，避免因网络问题导致所有请求失败
            raise RuntimeError(f"无法拉取 Clerk JWKS: {exc}") from exc
    return _jwks_cache


# ---------- 工具函数 ----------

def get_effective_tier(user: Optional[User]) -> Optional[UserTier]:
    """返回当前用户生效的 tier；订阅过期则降为 guest。"""
    if not user:
        return None
    if getattr(user, "tier", None) == UserTier.ADMIN:
        return UserTier.ADMIN
    if user.clerk_user_id and user.clerk_user_id in _ADMIN_CLERK_IDS:
        return UserTier.ADMIN
    sub_end = getattr(user, "subscription_end", None)
    if user.tier in (UserTier.OBSERVER, UserTier.TRACKER):
        if not sub_end or datetime.utcnow() > sub_end:
            return UserTier.GUEST
    return user.tier


class _FakeAdminUser:
    """禁用 Clerk 时使用的虚拟 admin 用户。"""
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
    """验证 Clerk JWT，优先使用 JWKS，回退到静态 PEM。"""
    options = {"verify_aud": False}

    # 优先 JWKS
    if CLERK_JWKS_URL:
        try:
            jwks = get_jwks()
            payload = jwt.decode(
                token,
                jwks,
                algorithms=["RS256"],
                issuer=CLERK_ISSUER or None,
                options=options,
            )
            return payload
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    # 回退静态 PEM
    if CLERK_PEM_PUBLIC_KEY:
        try:
            payload = jwt.decode(
                token,
                CLERK_PEM_PUBLIC_KEY,
                algorithms=["RS256"],
                issuer=CLERK_ISSUER or None,
                options=options,
            )
            return payload
        except JWTError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )

    raise HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Clerk 公钥未配置，无法验证 token",
    )


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if SKIP_CLERK:
        return _FAKE_ADMIN_USER  # type: ignore[return-value]
    if not credentials:
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

        # 已有用户但从未设置过试用期：补发 7 天试用
        if user and user.tier in (UserTier.OBSERVER, UserTier.TRACKER) and user.subscription_end is None:
            now = datetime.utcnow()
            user.subscription_start = now
            user.subscription_end = now + timedelta(days=7)
            db.commit()
            db.refresh(user)

        if not user:
            now = datetime.utcnow()
            user = User(
                user_id=clerk_user_id,
                clerk_user_id=clerk_user_id,
                email=payload.get("email"),
                phone=payload.get("phone_number"),
                tier=UserTier.OBSERVER,
                subscription_start=now,
                subscription_end=now + timedelta(days=7),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        return user
    except HTTPException:
        raise
    except Exception:
        return None
