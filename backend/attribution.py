"""
用户来源归因：建表与事件写入。
"""
import json
import os
from typing import Optional

from sqlalchemy import text
from sqlalchemy.engine import Engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from starlette.requests import Request


ATTRIBUTION_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS user_attribution_events (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64),
    event_type VARCHAR(32) NOT NULL,
    platform VARCHAR(64),
    source VARCHAR(128),
    medium VARCHAR(128),
    campaign VARCHAR(128),
    content VARCHAR(255),
    term VARCHAR(255),
    domain VARCHAR(255),
    landing_url TEXT,
    referrer TEXT,
    referrer_host VARCHAR(255),
    user_agent TEXT,
    client_ip VARCHAR(64),
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

ATTRIBUTION_INDEX_SQL = (
    "CREATE INDEX IF NOT EXISTS idx_user_attr_events_user_id "
    "ON user_attribution_events (user_id);",
    "CREATE INDEX IF NOT EXISTS idx_user_attr_events_platform "
    "ON user_attribution_events (platform);",
    "CREATE INDEX IF NOT EXISTS idx_user_attr_events_created_at "
    "ON user_attribution_events (created_at DESC);",
)

def _load_source_alias_map() -> dict[str, str]:
    raw = os.getenv("ATTR_SOURCE_ALIASES", "").strip()
    if not raw:
        return {}
    try:
        data = json.loads(raw)
        if isinstance(data, dict):
            return {
                str(k).lower(): str(v).lower()
                for k, v in data.items()
                if k is not None and v is not None
            }
    except Exception:
        return {}
    return {}


SOURCE_ALIAS_MAP = _load_source_alias_map()


def ensure_attribution_tables(engine: Engine) -> None:
    """启动时确保来源归因表存在。"""
    try:
        with engine.begin() as conn:
            conn.execute(text(ATTRIBUTION_TABLE_SQL))
            for sql in ATTRIBUTION_INDEX_SQL:
                conn.execute(text(sql))
    except Exception:
        # 不阻塞服务启动；写入失败由调用方兜底处理
        pass


def _pick_value(payload: dict, *keys: str) -> Optional[str]:
    for key in keys:
        value = payload.get(key)
        if value is None:
            continue
        text_value = str(value).strip()
        if text_value:
            return text_value
    return None


def _normalize_platform(payload: dict) -> str:
    platform = _pick_value(payload, "platform", "from_platform", "source")
    if not platform:
        return "unknown"
    key = platform.lower()
    return SOURCE_ALIAS_MAP.get(key, key)


def record_user_attribution_event(
    db: Session,
    *,
    user_id: Optional[str],
    event_type: str,
    request: Request,
    payload: Optional[dict],
) -> None:
    """记录来源事件；失败时静默，不影响主业务。"""
    data = payload or {}
    headers = request.headers
    host = headers.get("host")
    user_agent = headers.get("user-agent")
    request_referrer = headers.get("referer")

    source = _pick_value(data, "source", "utm_source")
    medium = _pick_value(data, "medium", "utm_medium")
    campaign = _pick_value(data, "campaign", "utm_campaign")
    content = _pick_value(data, "content", "utm_content")
    term = _pick_value(data, "term", "utm_term")
    landing_url = _pick_value(data, "landing_url")
    referrer = _pick_value(data, "referrer") or request_referrer
    referrer_host = _pick_value(data, "referrer_host")
    domain = _pick_value(data, "domain") or host
    platform = _normalize_platform(data)
    client_ip = request.client.host if request.client else None

    try:
        db.execute(
            text(
                """
                INSERT INTO user_attribution_events (
                    user_id, event_type, platform, source, medium,
                    campaign, content, term, domain, landing_url,
                    referrer, referrer_host, user_agent, client_ip,
                    raw_payload
                ) VALUES (
                    :user_id, :event_type, :platform, :source, :medium,
                    :campaign, :content, :term, :domain, :landing_url,
                    :referrer, :referrer_host, :user_agent, :client_ip,
                    CAST(:raw_payload AS JSONB)
                )
                """
            ),
            {
                "user_id": user_id,
                "event_type": event_type,
                "platform": platform,
                "source": source,
                "medium": medium,
                "campaign": campaign,
                "content": content,
                "term": term,
                "domain": domain,
                "landing_url": landing_url,
                "referrer": referrer,
                "referrer_host": referrer_host,
                "user_agent": user_agent,
                "client_ip": client_ip,
                "raw_payload": json.dumps(data, ensure_ascii=False),
            },
        )
        db.commit()
    except SQLAlchemyError:
        try:
            db.rollback()
        except Exception:
            pass
