"""
统一认证中间件（Clerk + 国内 Auth 平台 + 可选 app token）。
"""
import os
import time
import json as _json
import hashlib
import threading
import urllib.request
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from database import get_db
from models.identity_account import IdentityAccount
from models.user import User, UserTier

security = HTTPBearer(auto_error=False)

# 默认 false：未设置环境变量时按真实鉴权处理，避免线上漏配导致「未登录却等同管理员」。
# SKIP_CLERK 只表示本地/国内登录流程不依赖 Clerk；不要把它等同于管理员登录。
SKIP_CLERK = os.getenv("SKIP_CLERK", "false").strip().lower() == "true"
ALLOW_FAKE_ADMIN = os.getenv("ALLOW_FAKE_ADMIN", "false").strip().lower() == "true"

CLERK_ISSUER = os.getenv("CLERK_ISSUER", "").rstrip("/")
CLERK_JWKS_URL = os.getenv(
    "CLERK_JWKS_URL",
    f"{CLERK_ISSUER}/.well-known/jwks.json" if CLERK_ISSUER else "",
)
CLERK_PEM_PUBLIC_KEY = os.getenv("CLERK_PEM_PUBLIC_KEY", "")

# 国内 Auth（可接入支持 OIDC/JWT 的平台）
CN_AUTH_ISSUER = os.getenv("CN_AUTH_ISSUER", "").rstrip("/")
CN_AUTH_JWKS_URL = os.getenv(
    "CN_AUTH_JWKS_URL",
    f"{CN_AUTH_ISSUER}/.well-known/jwks.json" if CN_AUTH_ISSUER else "",
)
CN_AUTH_PEM_PUBLIC_KEY = os.getenv("CN_AUTH_PEM_PUBLIC_KEY", "")
CN_AUTH_AUDIENCE = os.getenv("CN_AUTH_AUDIENCE", "").strip()

# 可选：业务侧统一 token（用于把外部身份统一成内部会话）
APP_AUTH_SECRET = os.getenv("APP_AUTH_SECRET", "").strip()
APP_AUTH_ISSUER = os.getenv("APP_AUTH_ISSUER", "mentat-vision-api").strip()
APP_AUTH_AUDIENCE = os.getenv(
    "APP_AUTH_AUDIENCE",
    "mentat-vision-client",
).strip()
APP_AUTH_EXPIRES_SECONDS = int(os.getenv("APP_AUTH_EXPIRES_SECONDS", "86400"))

_ADMIN_CLERK_IDS = frozenset(
    x.strip() for x in os.getenv("ADMIN_CLERK_IDS", "").split(",") if x.strip()
)

_jwks_cache: dict[str, dict] = {}
_jwks_fetched_at: dict[str, float] = {}
_jwks_ttl: float = 3600
_jwks_lock = threading.Lock()

_identity_table_disabled = False


def _fetch_jwks(url: str) -> dict:
    with urllib.request.urlopen(url, timeout=10) as resp:
        return _json.loads(resp.read().decode())


def _get_jwks(url: str) -> Optional[dict]:
    if not url:
        return None
    now = time.monotonic()
    cache_key = url
    cached = _jwks_cache.get(cache_key)
    fetched_at = _jwks_fetched_at.get(cache_key, 0)
    if cached and (now - fetched_at) < _jwks_ttl:
        return cached
    with _jwks_lock:
        cached = _jwks_cache.get(cache_key)
        fetched_at = _jwks_fetched_at.get(cache_key, 0)
        if cached and (now - fetched_at) < _jwks_ttl:
            return cached
        try:
            jwks = _fetch_jwks(url)
            _jwks_cache[cache_key] = jwks
            _jwks_fetched_at[cache_key] = time.monotonic()
            return jwks
        except Exception:
            # 返回旧缓存，避免短暂网络问题导致整体鉴权失败
            return _jwks_cache.get(cache_key)


def _decode_provider_token(
    token: str,
    *,
    issuer: str,
    jwks_url: str,
    pem_public_key: str,
    audience: Optional[str] = None,
) -> Optional[dict]:
    options = {"verify_aud": bool(audience)}

    if jwks_url:
        jwks = _get_jwks(jwks_url)
        if jwks:
            try:
                return jwt.decode(
                    token,
                    jwks,
                    algorithms=["RS256"],
                    issuer=issuer or None,
                    audience=audience or None,
                    options=options,
                )
            except JWTError:
                return None

    if pem_public_key:
        try:
            return jwt.decode(
                token,
                pem_public_key,
                algorithms=["RS256"],
                issuer=issuer or None,
                audience=audience or None,
                options=options,
            )
        except JWTError:
            return None

    return None


def _decode_app_token(token: str) -> Optional[dict]:
    if not APP_AUTH_SECRET:
        return None
    try:
        return jwt.decode(
            token,
            APP_AUTH_SECRET,
            algorithms=["HS256"],
            issuer=APP_AUTH_ISSUER,
            audience=APP_AUTH_AUDIENCE,
        )
    except JWTError:
        return None


def issue_app_access_token(user_id: str, provider: str) -> Optional[str]:
    """若配置了 APP_AUTH_SECRET，签发内部 access token。"""
    if not APP_AUTH_SECRET:
        return None
    now = int(time.time())
    payload = {
        "sub": user_id,
        "provider": provider,
        "iat": now,
        "exp": now + APP_AUTH_EXPIRES_SECONDS,
        "iss": APP_AUTH_ISSUER,
        "aud": APP_AUTH_AUDIENCE,
        "typ": "access",
    }
    return jwt.encode(payload, APP_AUTH_SECRET, algorithm="HS256")


def _get_unverified_issuer(token: str) -> Optional[str]:
    try:
        claims = jwt.get_unverified_claims(token)
        iss = claims.get("iss")
        return str(iss).rstrip("/") if iss else None
    except Exception:
        return None


def _normalize_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return None
    p = str(phone).strip()
    return p or None


def _stable_user_id(provider: str, provider_user_id: str) -> str:
    base = f"{provider}_{provider_user_id}"
    if len(base) <= 64:
        return base
    digest = hashlib.sha256(provider_user_id.encode()).hexdigest()[:48]
    return f"{provider}_{digest}"


def _disable_identity_mapping():
    global _identity_table_disabled
    _identity_table_disabled = True


def _find_identity_account(
    db: Session,
    provider: str,
    provider_user_id: str,
) -> Optional[IdentityAccount]:
    if _identity_table_disabled:
        return None
    try:
        return db.query(IdentityAccount).filter(
            IdentityAccount.provider == provider,
            IdentityAccount.provider_user_id == provider_user_id,
        ).first()
    except SQLAlchemyError:
        # 查询失败后当前事务可能已进入 failed 状态，需显式回滚
        # 否则同一 Session 的后续 SELECT 会触发 InFailedSqlTransaction。
        try:
            db.rollback()
        except Exception:
            pass
        _disable_identity_mapping()
        return None


def _upsert_identity_account(
    db: Session,
    *,
    user_id: str,
    provider: str,
    provider_user_id: str,
    email: Optional[str],
    phone: Optional[str],
) -> None:
    if _identity_table_disabled:
        return
    try:
        row = _find_identity_account(db, provider, provider_user_id)
        if not row:
            row = IdentityAccount(
                user_id=user_id,
                provider=provider,
                provider_user_id=provider_user_id,
                email=email,
                phone=phone,
            )
            db.add(row)
        else:
            row.user_id = user_id
            row.email = email or row.email
            row.phone = phone or row.phone
        db.commit()
    except IntegrityError:
        db.rollback()
    except SQLAlchemyError:
        db.rollback()
        _disable_identity_mapping()


def _grant_default_trial_if_needed(db: Session, user: User) -> User:
    if (
        user.tier in (UserTier.OBSERVER, UserTier.TRACKER)
        and user.subscription_end is None
    ):
        now = datetime.utcnow()
        user.subscription_start = now
        user.subscription_end = now + timedelta(days=7)
        db.commit()
        db.refresh(user)
    return user


def _find_or_create_user_by_external_identity(
    db: Session,
    *,
    provider: str,
    provider_user_id: str,
    email: Optional[str],
    phone: Optional[str],
) -> User:
    # 1) 先走 identity_accounts 精确匹配
    identity = _find_identity_account(db, provider, provider_user_id)
    if identity:
        user = db.query(User).filter(User.user_id == identity.user_id).first()
        if user:
            if email and not user.email:
                user.email = email
            if phone and not user.phone:
                user.phone = phone
            db.commit()
            db.refresh(user)
            return _grant_default_trial_if_needed(db, user)

    # 2) 按 email / phone 兜底复用已有用户
    user = None
    if email:
        user = db.query(User).filter(User.email == email).first()
    if not user and phone:
        user = db.query(User).filter(User.phone == phone).first()
    if user:
        _upsert_identity_account(
            db,
            user_id=user.user_id,
            provider=provider,
            provider_user_id=provider_user_id,
            email=email,
            phone=phone,
        )
        return _grant_default_trial_if_needed(db, user)

    # 2.5) Clerk 场景兜底：若 identity_accounts 缺失或历史数据不一致，
    # 先按 clerk_user_id 复用，避免后续插入触发唯一键冲突。
    if provider == "clerk":
        user = db.query(User).filter(
            User.clerk_user_id == provider_user_id
        ).first()
        if user:
            if email and not user.email:
                user.email = email
            if phone and not user.phone:
                user.phone = phone
            db.commit()
            db.refresh(user)
            _upsert_identity_account(
                db,
                user_id=user.user_id,
                provider=provider,
                provider_user_id=provider_user_id,
                email=email,
                phone=phone,
            )
            return _grant_default_trial_if_needed(db, user)

    # 3) 新建用户 + 映射关系
    now = datetime.utcnow()
    user = User(
        user_id=_stable_user_id(provider, provider_user_id),
        clerk_user_id=provider_user_id if provider == "clerk" else None,
        email=email,
        phone=phone,
        tier=UserTier.OBSERVER,
        subscription_start=now,
        subscription_end=now + timedelta(days=7),
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        # 并发或历史脏数据下，可能已有同 clerk_user_id 记录，回查复用。
        if provider == "clerk":
            existing = db.query(User).filter(
                User.clerk_user_id == provider_user_id
            ).first()
            if existing:
                _upsert_identity_account(
                    db,
                    user_id=existing.user_id,
                    provider=provider,
                    provider_user_id=provider_user_id,
                    email=email,
                    phone=phone,
                )
                return _grant_default_trial_if_needed(db, existing)
        raise
    _upsert_identity_account(
        db,
        user_id=user.user_id,
        provider=provider,
        provider_user_id=provider_user_id,
        email=email,
        phone=phone,
    )
    return user


def verify_clerk_token(token: str) -> dict:
    """保留原有接口：验证 Clerk token，失败抛 401。"""
    payload = _decode_provider_token(
        token,
        issuer=CLERK_ISSUER,
        jwks_url=CLERK_JWKS_URL,
        pem_public_key=CLERK_PEM_PUBLIC_KEY,
    )
    if payload:
        return payload
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token",
        headers={"WWW-Authenticate": "Bearer"},
    )


def resolve_external_identity(token: str) -> Optional[dict]:
    """
    解析并验证外部 token，返回统一身份信息：
    { provider, provider_user_id, email, phone, payload }
    """
    token_iss = _get_unverified_issuer(token)
    providers = [
        {
            "name": "clerk",
            "issuer": CLERK_ISSUER,
            "jwks_url": CLERK_JWKS_URL,
            "pem": CLERK_PEM_PUBLIC_KEY,
            "aud": None,
        },
        {
            "name": "cn_auth",
            "issuer": CN_AUTH_ISSUER,
            "jwks_url": CN_AUTH_JWKS_URL,
            "pem": CN_AUTH_PEM_PUBLIC_KEY,
            "aud": CN_AUTH_AUDIENCE or None,
        },
    ]

    # 若 token 带 issuer，优先匹配同 issuer 的 provider
    if token_iss:
        matched = [
            p
            for p in providers
            if p["issuer"] and p["issuer"] == token_iss
        ]
        if matched:
            providers = matched + [p for p in providers if p not in matched]

    for p in providers:
        payload = _decode_provider_token(
            token,
            issuer=p["issuer"],
            jwks_url=p["jwks_url"],
            pem_public_key=p["pem"],
            audience=p["aud"],
        )
        if not payload:
            continue
        provider_user_id = (
            payload.get("sub")
            or payload.get("uid")
            or payload.get("user_id")
        )
        if not provider_user_id:
            continue
        phone = _normalize_phone(
            payload.get("phone_number")
            or payload.get("phone")
            or payload.get("mobile")
        )
        return {
            "provider": p["name"],
            "provider_user_id": str(provider_user_id),
            "email": payload.get("email"),
            "phone": phone,
            "payload": payload,
        }

    return None


def resolve_user_from_token(token: str, db: Session) -> tuple[User, str]:
    """
    统一 token 入口：
    1) 内部 app token（可选）
    2) 外部 Clerk / 国内 Auth token
    """
    try:
        app_payload = _decode_app_token(token)
        if app_payload:
            user_id = app_payload.get("sub")
            if user_id:
                user = db.query(User).filter(User.user_id == user_id).first()
                if user:
                    return _grant_default_trial_if_needed(db, user), "app"

        identity = resolve_external_identity(token)
        if not identity:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        provider = str(identity["provider"])
        provider_user_id = str(identity["provider_user_id"])
        email = identity.get("email")
        phone = identity.get("phone")

        user = _find_or_create_user_by_external_identity(
            db,
            provider=provider,
            provider_user_id=provider_user_id,
            email=email,
            phone=phone,
        )

        # 兼容旧字段：clerk 登录时保证 clerk_user_id 回填
        if provider == "clerk" and user.clerk_user_id != provider_user_id:
            user.clerk_user_id = provider_user_id
            db.commit()
            db.refresh(user)

        return user, provider
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="database temporarily unavailable",
        ) from exc


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
    """禁用认证时使用的虚拟 admin 用户。"""
    user_id = "skip_clerk"
    clerk_user_id = None
    tier = UserTier.ADMIN
    email = None
    display_name = "本地用户"
    subscription_end = None
    is_active = True
    daily_query_count = 0


_FAKE_ADMIN_USER = _FakeAdminUser()


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> Optional[User]:
    if credentials:
        try:
            user, _ = resolve_user_from_token(credentials.credentials, db)
            return user
        except HTTPException:
            if not (SKIP_CLERK and ALLOW_FAKE_ADMIN):
                raise
        except Exception:
            if not (SKIP_CLERK and ALLOW_FAKE_ADMIN):
                return None

    if SKIP_CLERK and ALLOW_FAKE_ADMIN:
        return _FAKE_ADMIN_USER  # type: ignore[return-value]
    return None
