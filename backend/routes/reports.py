"""
报告相关路由 - 含按日期、日历、完整报告等新端点
"""
from datetime import datetime, timedelta
from typing import Optional, List
import os
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, selectinload
from sqlalchemy import desc
from database import get_db
from middleware.auth import get_current_user_optional, get_effective_tier
from cache import cache_client
from models.user import User, UserTier
from models.report import (
    Report,
    ReportItem,
    ReportAlert,
    ReportNewsBrief,
    ReportOptions,
)

router = APIRouter()


LATEST_SUMMARY_TTL_SECONDS = int(os.getenv("CACHE_TTL_LATEST_SUMMARY", "30"))
CALENDAR_TTL_SECONDS = int(os.getenv("CACHE_TTL_CALENDAR", "300"))
REPORT_LIST_TTL_SECONDS = int(os.getenv("CACHE_TTL_REPORT_LIST", "60"))
REPORT_DETAIL_TTL_SECONDS = int(os.getenv("CACHE_TTL_REPORT_DETAIL", "180"))


def _overview_teaser(content: Optional[str], max_len: int = 220) -> str:
    if not content:
        return ""
    text = content.strip()
    if len(text) <= max_len:
        return text
    return text[:max_len].rstrip() + "..."


def _full_report_load_options():
    return [
        selectinload(Report.sentiment),
        selectinload(Report.market_snapshots),
        selectinload(Report.overview),
        selectinload(Report.alerts),
        selectinload(Report.news_briefs),
        selectinload(Report.options).selectinload(ReportOptions.candidates),
        selectinload(Report.topic_comparisons),
    ]


def _require_archive_access(user: Optional[User]) -> UserTier:
    """归档模块强鉴权：未登录拒绝；已登录即可访问（含到期降为 guest 的账号）。"""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    tier = get_effective_tier(user)
    if not tier:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Archive access requires active subscription",
        )
    return tier


def _observer_cutoff_utc() -> datetime:
    return datetime.utcnow() - timedelta(days=7)


def _within_observer_window(report: Report) -> bool:
    cutoff = _observer_cutoff_utc()
    if report.generated_at:
        return report.generated_at >= cutoff
    if report.report_date:
        try:
            report_day = datetime.strptime(report.report_date, "%Y-%m-%d")
            return report_day >= cutoff
        except ValueError:
            return False
    return False


def _assert_archive_report_access(report: Report, tier: UserTier) -> None:
    if tier in (UserTier.OBSERVER, UserTier.GUEST) and not _within_observer_window(report):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Report is outside observer 7-day archive window",
        )


def _serialize_sentiment(s):
    if not s:
        return None
    return {
        "score": s.score,
        "level": s.level,
        "label": s.label,
        "description": s.description,
        "signal_count": s.signal_count,
        "red_count": s.red_count,
        "yellow_count": s.yellow_count,
        "confirmed_count": s.confirmed_count,
        "topic_count": s.topic_count,
    }


def _serialize_market(m):
    if not m:
        return []
    return [
        {
            "symbol": x.symbol,
            "name": x.name,
            "group_label": x.group_label,
            "price": x.price,
            "pct_change": x.pct_change,
            "change": x.change,
            "range_high": x.range_high,
            "range_low": x.range_low,
            "volume": x.volume,
            "avg_volume": x.avg_volume,
            "volume_ratio": x.volume_ratio,
            "direction": x.direction,
            "has_alert": x.has_alert,
            "link": x.link,
        }
        for x in m
    ]


def _serialize_overview(o):
    if not o:
        return None
    return {"content": o.content}


def _serialize_briefs(briefs):
    if not briefs:
        return []
    return [
        {
            "topic_id": b.topic_id,
            "topic_name": b.topic_name,
            "source_count": b.source_count,
            "body": b.body,
            "impact": b.impact,
            "sources": b.sources,
        }
        for b in briefs
    ]


def _serialize_options(opts):
    if not opts:
        return None
    return {
        "recommendation": opts.recommendation,
        "body_text": opts.body_text,
        "underlying": opts.underlying,
        "direction": opts.direction,
        "candidates": [
            {
                "rank": c.rank,
                "contract_code": c.contract_code,
                "strike": c.strike,
                "expiry": c.expiry,
                "days_to_expiry": c.days_to_expiry,
                "bid": c.bid,
                "ask": c.ask,
                "iv": c.iv,
                "otm_pct": c.otm_pct,
                "delta": c.delta,
                "leverage": c.leverage,
                "max_loss": c.max_loss,
                "target_5x": c.target_5x,
                "breakeven": c.breakeven,
                "volume": c.volume,
                "open_interest": c.open_interest,
                "reason": c.reason,
            }
            for c in opts.candidates or []
        ],
    }


def _serialize_topics(topic_comparisons):
    if not topic_comparisons:
        return []
    return [
        {
            "topic_id": t.topic_id,
            "topic_name": t.topic_name,
            "score": t.score,
            "today_count": t.today_count,
            "yesterday_count": t.yesterday_count,
            "delta": t.delta,
            "level": t.level,
        }
        for t in topic_comparisons
    ]


@router.get("/")
async def list_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    scope: str = Query("archive"),
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    if scope not in {"archive", "all"}:
        raise HTTPException(status_code=400, detail="Invalid scope")
    tier = _require_archive_access(user)
    tier_name = tier.value
    cache_key = f"reports:list:{scope}:{tier_name}:{page}:{page_size}"
    cached = cache_client.get_json(cache_key)
    if cached is not None:
        return cached

    query = db.query(Report).order_by(desc(Report.generated_at))
    if scope == "archive":
        latest_report_id = (
            db.query(Report.report_id)
            .order_by(desc(Report.generated_at))
            .limit(1)
            .scalar()
        )
        if latest_report_id:
            query = query.filter(Report.report_id != latest_report_id)

    if tier in (UserTier.OBSERVER, UserTier.GUEST):
        seven_days_ago = _observer_cutoff_utc()
        query = query.filter(Report.generated_at >= seven_days_ago)

    total = query.count()
    reports = query.offset((page - 1) * page_size).limit(page_size).all()
    result = {
        "reports": [r.to_dict() for r in reports],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
    cache_client.set_json(cache_key, result, REPORT_LIST_TTL_SECONDS)
    return result


@router.get("/calendar")
async def get_calendar(
    year: int = Query(..., ge=2020, le=2030),
    month: int = Query(..., ge=1, le=12),
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """返回指定年月中有报告的日期列表（供月历高亮）"""
    tier = _require_archive_access(user)
    tier_name = tier.value
    cache_key = f"reports:calendar:{tier_name}:{year}:{month}"
    cached = cache_client.get_json(cache_key)
    if cached is not None:
        return cached

    start = datetime(year, month, 1)
    if month == 12:
        end = datetime(year + 1, 1, 1) - timedelta(days=1)
    else:
        end = datetime(year, month + 1, 1) - timedelta(days=1)

    start_str = start.strftime("%Y-%m-%d")
    end_str = end.strftime("%Y-%m-%d")

    subq = (
        db.query(Report.report_date)
        .filter(Report.report_date >= start_str, Report.report_date <= end_str)
        .distinct()
    )
    if tier in (UserTier.OBSERVER, UserTier.GUEST):
        subq = subq.filter(Report.generated_at >= _observer_cutoff_utc())
    rows = subq.all()
    dates: List[str] = sorted({r.report_date for r in rows if r.report_date})

    result = {"year": year, "month": month, "dates": dates}
    cache_client.set_json(cache_key, result, CALENDAR_TTL_SECONDS)
    return result


@router.get("/date/{date}")
async def get_by_date(
    date: str,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """按日期获取该日的报告（优先 preview）"""
    tier = _require_archive_access(user)
    tier_name = tier.value
    cache_key = f"reports:by-date:{tier_name}:{date}"
    cached = cache_client.get_json(cache_key)
    if cached is not None:
        return cached

    # date 格式: 2026-03-08 或 20260308
    norm = date.replace("-", "") if "-" in date else date
    if len(norm) != 8:
        raise HTTPException(status_code=400, detail="Invalid date format")

    query = db.query(Report).options(*_full_report_load_options())

    report_date = f"{norm[:4]}-{norm[4:6]}-{norm[6:]}"
    report = (
        query.filter(Report.report_date == report_date)
        .order_by(desc(Report.generated_at))
        .first()
    )

    if not report:
        raise HTTPException(status_code=404, detail="No report for this date")

    _assert_archive_report_access(report, tier)
    result = await _get_full_or_preview(report, user, db)
    cache_client.set_json(cache_key, result, REPORT_DETAIL_TTL_SECONDS)
    return result


@router.get("/latest/summary")
async def get_latest_summary(
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    tier = get_effective_tier(user)
    tier_name = tier.value if tier else "guest"
    cache_key = f"reports:latest-summary:{tier_name}"
    cached = cache_client.get_json(cache_key)
    if cached is not None:
        return cached

    report = (
        db.query(Report)
        .options(selectinload(Report.overview))
        .order_by(desc(Report.generated_at))
        .first()
    )
    if not report:
        result = {"message": "No reports available"}
        cache_client.set_json(cache_key, result, LATEST_SUMMARY_TTL_SECONDS)
        return result
    overview_content = report.overview.content if report.overview else None
    teaser = _overview_teaser(overview_content)
    if not user or tier == UserTier.GUEST:
        result = {"report": report.to_preview(), "overview_teaser": teaser}
        cache_client.set_json(cache_key, result, LATEST_SUMMARY_TTL_SECONDS)
        return result

    result = {"report": report.to_dict(), "overview_teaser": teaser}
    cache_client.set_json(cache_key, result, LATEST_SUMMARY_TTL_SECONDS)
    return result


@router.get("/{report_id}/full")
async def get_full_report(
    report_id: str,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """完整报告（含 sentiment, market, overview, alerts, briefs, options, topics）"""
    tier = _require_archive_access(user)
    tier_name = tier.value
    cache_key = f"reports:full:{tier_name}:{report_id}"
    cached = cache_client.get_json(cache_key)
    if cached is not None:
        return cached

    query = db.query(Report).options(*_full_report_load_options())
    report = query.filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    _assert_archive_report_access(report, tier)
    result = await _get_full_or_preview(report, user, db)
    cache_client.set_json(cache_key, result, REPORT_DETAIL_TTL_SECONDS)
    return result


async def _get_full_or_preview(
    report: Report, user: Optional[User], db: Session
):
    # 已携带用户且已通过归档鉴权时返回完整报告；预览仅用于未登录场景（本路由通常不会走到）
    guest = not user

    if guest:
        base = report.to_preview()
        alerts_q = (
            db.query(ReportAlert)
            .filter(ReportAlert.report_id == report.report_id)
            .order_by(desc(ReportAlert.score))
            .limit(5)
        )
        alerts = [a.to_dict() for a in alerts_q.all()]
        briefs_q = (
            db.query(ReportNewsBrief)
            .filter(ReportNewsBrief.report_id == report.report_id)
            .order_by(desc(ReportNewsBrief.source_count))
            .limit(1)
        )
        briefs = briefs_q.all()
        return {
            "report": base,
            "sentiment": None,
            "market_snapshots": [],
            "overview": None,
            "alerts": alerts,
            "news_briefs": _serialize_briefs(briefs),
            "options": None,
            "topic_comparisons": [],
            "message": "登录并开通 observer 后查看完整内容",
        }

    base = report.to_dict()
    return {
        "report": base,
        "sentiment": _serialize_sentiment(report.sentiment),
        "market_snapshots": _serialize_market(report.market_snapshots),
        "overview": _serialize_overview(report.overview),
        "alerts": [a.to_dict() for a in (report.alerts or [])],
        "news_briefs": _serialize_briefs(report.news_briefs),
        "options": _serialize_options(report.options),
        "topic_comparisons": _serialize_topics(report.topic_comparisons),
    }


@router.get("/{report_id}")
async def get_report_detail(
    report_id: str,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    tier = _require_archive_access(user)
    tier_name = tier.value
    cache_key = f"reports:detail:{tier_name}:{report_id}"
    cached = cache_client.get_json(cache_key)
    if cached is not None:
        return cached

    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    _assert_archive_report_access(report, tier)

    items = (
        db.query(ReportItem)
        .filter(ReportItem.report_id == report_id)
        .order_by(desc(ReportItem.score))
        .all()
    )
    result = {
        "report": report.to_dict(),
        "items": [i.to_dict() for i in items],
    }
    cache_client.set_json(cache_key, result, REPORT_DETAIL_TTL_SECONDS)
    return result
