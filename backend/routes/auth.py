"""
统一认证路由：支持多种登录来源归一，以及手机号 OTP 登录。
"""
from typing import Optional
import os
import random
import re
import hashlib
import json
import hmac
import base64
import secrets
import datetime
import urllib.error
import urllib.parse
import urllib.request

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from starlette.requests import Request

from database import get_db
from cache import cache_client
from middleware.auth import (
    get_current_user_optional,
    issue_app_access_token,
    resolve_external_identity,
    resolve_user_from_token,
)
from attribution import record_user_attribution_event
from models.identity_account import IdentityAccount
from models.user import User, UserTier

router = APIRouter()
security = HTTPBearer(auto_error=False)

PHONE_OTP_TTL_SECONDS = int(os.getenv("PHONE_OTP_TTL_SECONDS", "300"))
PHONE_OTP_SEND_COOLDOWN_SECONDS = int(
    os.getenv("PHONE_OTP_SEND_COOLDOWN_SECONDS", "60"),
)
PHONE_OTP_DEBUG = os.getenv("PHONE_OTP_DEBUG", "true").strip().lower() == "true"
PHONE_OTP_HASH_SALT = os.getenv("PHONE_OTP_HASH_SALT", "phone_otp_salt").strip()
PASSWORD_SCRYPT_N = int(os.getenv("PASSWORD_SCRYPT_N", str(2**14)))
PASSWORD_SCRYPT_R = int(os.getenv("PASSWORD_SCRYPT_R", "8"))
PASSWORD_SCRYPT_P = int(os.getenv("PASSWORD_SCRYPT_P", "1"))
PASSWORD_MIN_LENGTH = int(os.getenv("PASSWORD_MIN_LENGTH", "8"))


class AuthExchangeRequest(BaseModel):
    token: Optional[str] = None
    attribution: Optional[dict] = None


class AuthLinkRequest(BaseModel):
    token: str


def _require_user(user: Optional[User]) -> User:
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


def _serialize_user(user: User) -> dict:
    return {
        "user_id": user.user_id,
        "email": user.email,
        "phone": user.phone,
        "display_name": user.display_name,
        "tier": user.tier.value if user.tier else "guest",
        "subscription_end": (
            user.subscription_end.isoformat()
            if user.subscription_end
            else None
        ),
    }


def _normalize_phone(phone: str) -> str:
    p = re.sub(r"\s+", "", phone or "")
    if not p:
        raise HTTPException(status_code=400, detail="invalid phone")

    # 默认国家码归一：如果用户未带 '+'，且形如国内手机号（11 位、以 1 开头），补 '+86'
    # 这样前端输入 `138xxxxxxx` 也能被阿里云正确接收。
    if not p.startswith("+") and re.match(r"^1\d{10}$", p):
        p = f"+86{p}"

    # 这里仅做简单清洗；生产环境建议补全国家码校验
    if not re.match(r"^\+?\d{6,16}$", p):
        raise HTTPException(status_code=400, detail="invalid phone format")
    return p


def _stable_phone_user_id(phone: str) -> str:
    # User.user_id <= 64，确保稳定且避免直接存长字符串
    digest = hashlib.sha256(phone.encode()).hexdigest()[:48]
    return f"phone_{digest}"


def _otp_cache_key(phone: str) -> str:
    return f"otp:code:{phone}"


def _otp_rate_key(phone: str) -> str:
    return f"otp:rate:{phone}"


def _hash_otp(otp: str) -> str:
    raw = f"{PHONE_OTP_HASH_SALT}:{otp}"
    return hashlib.sha256(raw.encode()).hexdigest()


def _validate_password(raw: str) -> str:
    password = (raw or "").strip()
    if len(password) < PASSWORD_MIN_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"password must be at least {PASSWORD_MIN_LENGTH} chars",
        )
    if len(password) > 128:
        raise HTTPException(status_code=400, detail="password too long")
    return password


def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    dk = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=PASSWORD_SCRYPT_N,
        r=PASSWORD_SCRYPT_R,
        p=PASSWORD_SCRYPT_P,
        dklen=32,
    )
    return (
        "scrypt$"
        f"{PASSWORD_SCRYPT_N}${PASSWORD_SCRYPT_R}${PASSWORD_SCRYPT_P}$"
        f"{base64.urlsafe_b64encode(salt).decode('utf-8')}$"
        f"{base64.urlsafe_b64encode(dk).decode('utf-8')}"
    )


def _verify_password(password: str, encoded: str) -> bool:
    try:
        algo, n_raw, r_raw, p_raw, salt_b64, hash_b64 = encoded.split("$", 5)
        if algo != "scrypt":
            return False
        salt = base64.urlsafe_b64decode(salt_b64.encode("utf-8"))
        target = base64.urlsafe_b64decode(hash_b64.encode("utf-8"))
        derived = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=int(n_raw),
            r=int(r_raw),
            p=int(p_raw),
            dklen=len(target),
        )
        return secrets.compare_digest(derived, target)
    except Exception:
        return False


def _send_sms_code(phone: str, otp: str) -> None:
    """
    发送短信验证码。
    当前实现先提供可跑通的 Debug 模式：
    - PHONE_OTP_DEBUG=true：不真正调用短信服务（前端会拿到 debug_otp）
    - PHONE_OTP_DEBUG=false：需要接入短信平台并在此实现发送
    """
    if PHONE_OTP_DEBUG:
        return

    access_key_id = os.getenv("ALIYUN_SMS_ACCESS_KEY_ID", "").strip()
    access_key_secret = os.getenv("ALIYUN_SMS_ACCESS_KEY_SECRET", "").strip()
    sign_name = os.getenv("ALIYUN_SMS_SIGN_NAME", "").strip()
    template_code = os.getenv("ALIYUN_SMS_TEMPLATE_CODE", "").strip()
    # 短信接口多数情况下不强制要求 RegionId，但保留环境变量以便你替换场景
    region_id = os.getenv("ALIYUN_SMS_REGION_ID", "").strip() or "cn-hangzhou"
    endpoint = os.getenv("ALIYUN_SMS_ENDPOINT", "").strip() or "dysmsapi.aliyuncs.com"
    template_param_key = os.getenv("PHONE_OTP_TEMPLATE_PARAM_KEY", "code").strip() or "code"

    if not access_key_id or not access_key_secret or not sign_name or not template_code:
        raise HTTPException(
            status_code=503,
            detail=(
                "Aliyun SMS config missing: "
                "ALIYUN_SMS_ACCESS_KEY_ID / ALIYUN_SMS_ACCESS_KEY_SECRET / "
                "ALIYUN_SMS_SIGN_NAME / ALIYUN_SMS_TEMPLATE_CODE"
            ),
        )

    template_param = {template_param_key: otp}
    template_param_str = json.dumps(template_param, ensure_ascii=False)

    # RPC signature (HMAC-SHA1) for OpenAPI Query API
    # See: https://help.aliyun.com/
    utc_now = datetime.datetime.utcnow()
    timestamp = utc_now.strftime("%Y-%m-%dT%H:%M:%SZ")
    nonce = str(random.randint(10**8, 10**9 - 1))

    public_params = {
        "Action": "SendSms",
        "SignName": sign_name,
        "TemplateCode": template_code,
        "TemplateParam": template_param_str,
        "PhoneNumbers": phone,
        "Version": "2017-05-25",
        "AccessKeyId": access_key_id,
        "SignatureMethod": "HMAC-SHA1",
        "SignatureVersion": "1.0",
        "SignatureNonce": nonce,
        "Timestamp": timestamp,
        "Format": "JSON",
    }

    def _rfc3986_encode(s: str) -> str:
        return urllib.parse.quote(str(s), safe="-_.~")

    sorted_items = sorted(public_params.items(), key=lambda kv: kv[0])
    canonical_query_string = "&".join(
        f"{_rfc3986_encode(k)}={_rfc3986_encode(v)}" for k, v in sorted_items
    )
    string_to_sign = (
        "GET&" + _rfc3986_encode("/") + "&" + _rfc3986_encode(canonical_query_string)
    )
    signing_key = (access_key_secret + "&").encode("utf-8")
    signature = base64.b64encode(
        hmac.new(signing_key, string_to_sign.encode("utf-8"), hashlib.sha1).digest()
    ).decode("utf-8")

    public_params["Signature"] = signature

    final_query_string = "&".join(
        f"{_rfc3986_encode(k)}={_rfc3986_encode(v)}"
        for k, v in sorted(public_params.items(), key=lambda kv: kv[0])
    )

    url = f"https://{endpoint}/?{final_query_string}"
    try:
        with urllib.request.urlopen(url, timeout=10) as resp:
            body = resp.read().decode("utf-8")
    except urllib.error.HTTPError as exc:
        # 403/400 时响应体里常有 SignatureDoesNotMatch、权限说明等，便于排查
        try:
            err_body = exc.read().decode("utf-8")
        except Exception:
            err_body = ""
        snippet = (err_body or str(exc.reason))[:800]
        raise HTTPException(
            status_code=503,
            detail=f"Aliyun SMS HTTP {exc.code}: {snippet}",
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=503, detail=f"Aliyun SMS request failed: {exc}") from exc

    try:
        data = json.loads(body)
    except Exception:
        raise HTTPException(status_code=503, detail=f"Aliyun SMS invalid response: {body[:200]}")

    # Expected shape: {"Code":"OK","Message":"...","RequestId":...} or error with non-OK Code
    code = data.get("Code")
    if code != "OK":
        raise HTTPException(status_code=503, detail=f"Aliyun SMS error: {data.get('Message') or data}")


@router.post("/exchange")
async def exchange_auth_token(
    request: Request,
    body: AuthExchangeRequest,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
):
    """
    接收外部 token（请求体 token 或 Authorization Bearer），
    验证并映射到内部用户，返回可选的业务 app_token。
    """
    token = (body.token or "").strip() if body else ""
    if not token and credentials:
        token = credentials.credentials
    if not token:
        raise HTTPException(status_code=400, detail="missing token")

    try:
        user, provider = resolve_user_from_token(token, db)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=503, detail="database temporarily unavailable") from exc
    app_token = issue_app_access_token(user.user_id, provider=provider)
    record_user_attribution_event(
        db,
        user_id=user.user_id,
        event_type="auth_exchange",
        request=request,
        payload=(body.attribution if body else None),
    )

    return {
        "provider": provider,
        "app_token": app_token,
        "user": _serialize_user(user),
    }


@router.get("/identities")
async def list_identities(
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    current_user = _require_user(user)
    try:
        rows = db.query(IdentityAccount).filter(
            IdentityAccount.user_id == current_user.user_id
        ).all()
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"identity table unavailable: {exc}",
        ) from exc

    identities = [
        {
            "provider": row.provider,
            "provider_user_id": row.provider_user_id,
            "email": row.email,
            "phone": row.phone,
            "created_at": row.created_at.isoformat(),
        }
        for row in rows
    ]
    return {
        "user": _serialize_user(current_user),
        "identities": identities,
    }


@router.post("/link")
async def link_identity(
    body: AuthLinkRequest,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    将外部身份（例如 cn_auth / clerk）绑定到当前登录用户。
    """
    current_user = _require_user(user)
    external_token = (body.token or "").strip()
    if not external_token:
        raise HTTPException(status_code=400, detail="missing token")

    identity = resolve_external_identity(external_token)
    if not identity:
        raise HTTPException(status_code=401, detail="invalid external token")

    provider = str(identity["provider"])
    provider_user_id = str(identity["provider_user_id"])
    email = identity.get("email")
    phone = identity.get("phone")

    try:
        existing = db.query(IdentityAccount).filter(
            IdentityAccount.provider == provider,
            IdentityAccount.provider_user_id == provider_user_id,
        ).first()
    except SQLAlchemyError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"identity table unavailable: {exc}",
        ) from exc

    if existing and existing.user_id != current_user.user_id:
        raise HTTPException(
            status_code=409,
            detail="identity already linked to another account",
        )

    if not existing:
        row = IdentityAccount(
            user_id=current_user.user_id,
            provider=provider,
            provider_user_id=provider_user_id,
            email=email,
            phone=phone,
        )
        db.add(row)
    else:
        existing.email = email or existing.email
        existing.phone = phone or existing.phone

    if provider == "clerk" and current_user.clerk_user_id != provider_user_id:
        current_user.clerk_user_id = provider_user_id

    if email and not current_user.email:
        current_user.email = email
    if phone and not current_user.phone:
        current_user.phone = phone

    db.commit()
    db.refresh(current_user)

    return {
        "status": "linked",
        "provider": provider,
        "user": _serialize_user(current_user),
    }


class PhoneSendRequest(BaseModel):
    phone: str


class PhoneSendResponse(BaseModel):
    ok: bool
    debug_otp: Optional[str] = None


@router.post("/phone/send", response_model=PhoneSendResponse)
async def phone_send_otp(body: PhoneSendRequest):
    phone = _normalize_phone(body.phone)

    # 简单限频：同一号码 PHONE_OTP_SEND_COOLDOWN_SECONDS 内不可重复发送
    if cache_client.get_json(_otp_rate_key(phone)) is not None:
        raise HTTPException(status_code=429, detail="too many requests, wait a bit")

    otp = f"{random.randint(0, 999999):06d}"
    cache_client.set_json(
        _otp_cache_key(phone),
        {"hash": _hash_otp(otp)},
        PHONE_OTP_TTL_SECONDS,
    )
    cache_client.set_json(
        _otp_rate_key(phone),
        {"sent_at": True},
        PHONE_OTP_SEND_COOLDOWN_SECONDS,
    )

    _send_sms_code(phone, otp)

    return PhoneSendResponse(ok=True, debug_otp=(otp if PHONE_OTP_DEBUG else None))


class PhoneVerifyRequest(BaseModel):
    phone: str
    otp: str
    attribution: Optional[dict] = None


class PhoneVerifyResponse(BaseModel):
    ok: bool
    app_token: Optional[str] = None
    user: Optional[dict] = None
    is_new_user: bool = False


@router.post("/phone/verify", response_model=PhoneVerifyResponse)
async def phone_verify_otp(
    request: Request,
    body: PhoneVerifyRequest,
    db: Session = Depends(get_db),
):
    phone = _normalize_phone(body.phone)
    otp = (body.otp or "").strip()
    if not re.match(r"^\d{6}$", otp):
        raise HTTPException(status_code=400, detail="otp must be 6 digits")

    record = cache_client.get_json(_otp_cache_key(phone))
    if not record or not record.get("hash"):
        raise HTTPException(status_code=401, detail="otp expired or not found")

    if record["hash"] != _hash_otp(otp):
        raise HTTPException(status_code=401, detail="invalid otp")

    # 查身份映射 -> 创建/复用用户
    identity = None
    try:
        identity = db.query(IdentityAccount).filter(
            IdentityAccount.provider == "phone",
            IdentityAccount.provider_user_id == phone,
        ).first()
    except SQLAlchemyError:
        identity = None

    user: Optional[User] = None
    if identity and identity.user_id:
        user = db.query(User).filter(User.user_id == identity.user_id).first()

    if not user:
        user = db.query(User).filter(User.phone == phone).first()

    is_new_user = False
    if not user:
        from datetime import datetime, timedelta

        now = datetime.utcnow()
        user = User(
            user_id=_stable_phone_user_id(phone),
            tier=UserTier.OBSERVER,
            phone=phone,
            subscription_start=now,
            subscription_end=now + timedelta(days=7),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new_user = True

    if not identity:
        try:
            db.add(
                IdentityAccount(
                    user_id=user.user_id,
                    provider="phone",
                    provider_user_id=phone,
                    phone=phone,
                )
            )
            db.commit()
        except SQLAlchemyError:
            db.rollback()

    # 签发统一 app token
    app_token = issue_app_access_token(user.user_id, provider="phone")
    if not app_token:
        raise HTTPException(status_code=503, detail="APP_AUTH_SECRET is not configured")

    # 清理 otp，防止重放
    cache_client.set_json(_otp_cache_key(phone), {"hash": ""}, 1)
    record_user_attribution_event(
        db,
        user_id=user.user_id,
        event_type="phone_verify",
        request=request,
        payload=body.attribution,
    )

    return PhoneVerifyResponse(
        ok=True,
        app_token=app_token,
        user=_serialize_user(user),
        is_new_user=is_new_user,
    )


class PhonePasswordRegisterRequest(BaseModel):
    phone: str
    otp: str
    password: str
    attribution: Optional[dict] = None


class PhonePasswordLoginRequest(BaseModel):
    phone: str
    password: str
    attribution: Optional[dict] = None


class PhonePasswordResetRequest(BaseModel):
    phone: str
    otp: str
    new_password: str


@router.post("/password/register", response_model=PhoneVerifyResponse)
async def phone_password_register(
    request: Request,
    body: PhonePasswordRegisterRequest,
    db: Session = Depends(get_db),
):
    phone = _normalize_phone(body.phone)
    otp = (body.otp or "").strip()
    password = _validate_password(body.password)
    if not re.match(r"^\d{6}$", otp):
        raise HTTPException(status_code=400, detail="otp must be 6 digits")

    record = cache_client.get_json(_otp_cache_key(phone))
    if not record or not record.get("hash"):
        raise HTTPException(status_code=401, detail="otp expired or not found")
    if record["hash"] != _hash_otp(otp):
        raise HTTPException(status_code=401, detail="invalid otp")

    user = db.query(User).filter(User.phone == phone).first()
    is_new_user = False
    if not user:
        now = datetime.datetime.utcnow()
        user = User(
            user_id=_stable_phone_user_id(phone),
            tier=UserTier.OBSERVER,
            phone=phone,
            subscription_start=now,
            subscription_end=now + datetime.timedelta(days=7),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        is_new_user = True

    user.password_hash = _hash_password(password)
    user.password_updated_at = datetime.datetime.utcnow()

    identity = db.query(IdentityAccount).filter(
        IdentityAccount.provider == "phone",
        IdentityAccount.provider_user_id == phone,
    ).first()
    if not identity:
        db.add(
            IdentityAccount(
                user_id=user.user_id,
                provider="phone",
                provider_user_id=phone,
                phone=phone,
            )
        )
    db.commit()
    db.refresh(user)

    app_token = issue_app_access_token(user.user_id, provider="phone")
    if not app_token:
        raise HTTPException(status_code=503, detail="APP_AUTH_SECRET is not configured")

    cache_client.set_json(_otp_cache_key(phone), {"hash": ""}, 1)
    record_user_attribution_event(
        db,
        user_id=user.user_id,
        event_type="password_register",
        request=request,
        payload=body.attribution,
    )
    return PhoneVerifyResponse(
        ok=True,
        app_token=app_token,
        user=_serialize_user(user),
        is_new_user=is_new_user,
    )


@router.post("/password/login", response_model=PhoneVerifyResponse)
async def phone_password_login(
    request: Request,
    body: PhonePasswordLoginRequest,
    db: Session = Depends(get_db),
):
    phone = _normalize_phone(body.phone)
    password = _validate_password(body.password)
    user = db.query(User).filter(User.phone == phone).first()
    if not user or not user.password_hash:
        raise HTTPException(status_code=401, detail="phone or password invalid")

    if not _verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="phone or password invalid")

    app_token = issue_app_access_token(user.user_id, provider="phone")
    if not app_token:
        raise HTTPException(status_code=503, detail="APP_AUTH_SECRET is not configured")
    record_user_attribution_event(
        db,
        user_id=user.user_id,
        event_type="password_login",
        request=request,
        payload=body.attribution,
    )
    return PhoneVerifyResponse(
        ok=True,
        app_token=app_token,
        user=_serialize_user(user),
        is_new_user=False,
    )


@router.post("/password/reset", response_model=PhoneVerifyResponse)
async def phone_password_reset(
    body: PhonePasswordResetRequest,
    db: Session = Depends(get_db),
):
    phone = _normalize_phone(body.phone)
    otp = (body.otp or "").strip()
    new_password = _validate_password(body.new_password)
    if not re.match(r"^\d{6}$", otp):
        raise HTTPException(status_code=400, detail="otp must be 6 digits")

    record = cache_client.get_json(_otp_cache_key(phone))
    if not record or not record.get("hash"):
        raise HTTPException(status_code=401, detail="otp expired or not found")
    if record["hash"] != _hash_otp(otp):
        raise HTTPException(status_code=401, detail="invalid otp")

    user = db.query(User).filter(User.phone == phone).first()
    if not user:
        raise HTTPException(status_code=404, detail="account not found")

    user.password_hash = _hash_password(new_password)
    user.password_updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(user)
    cache_client.set_json(_otp_cache_key(phone), {"hash": ""}, 1)

    app_token = issue_app_access_token(user.user_id, provider="phone")
    if not app_token:
        raise HTTPException(status_code=503, detail="APP_AUTH_SECRET is not configured")
    return PhoneVerifyResponse(
        ok=True,
        app_token=app_token,
        user=_serialize_user(user),
        is_new_user=False,
    )
