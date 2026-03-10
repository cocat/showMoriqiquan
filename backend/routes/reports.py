"""
报告相关路由 - 含按日期、日历、完整报告等新端点
"""
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from middleware.auth import get_current_user_optional, get_effective_tier
from models.user import User, UserTier
from models.report import (
    Report, ReportItem, ReportAlert, ReportSentiment, ReportMarketSnapshot,
    ReportOverview, ReportNewsBrief, ReportOptions, ReportOptionCandidate,
    ReportTopicComparison,
)

router = APIRouter()


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
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    query = db.query(Report).order_by(desc(Report.generated_at))

    tier = get_effective_tier(user)
    if not user or tier == UserTier.GUEST:
        query = query.limit(1)
        reports = query.all()
        return {
            "reports": [r.to_preview() for r in reports],
            "total": len(reports),
            "page": 1,
            "page_size": 1,
            "message": "注册后查看更多历史报告",
        }

    if tier == UserTier.OBSERVER:
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        query = query.filter(Report.generated_at >= seven_days_ago)

    total = query.count()
    reports = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "reports": [r.to_dict() for r in reports],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/calendar")
async def get_calendar(
    year: int = Query(..., ge=2020, le=2030),
    month: int = Query(..., ge=1, le=12),
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """返回指定年月中有报告的日期列表（供月历高亮）"""
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
    rows = subq.all()
    dates: List[str] = sorted({r.report_date for r in rows if r.report_date})

    return {"year": year, "month": month, "dates": dates}


@router.get("/date/{date}")
async def get_by_date(
    date: str,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """按日期获取该日的报告（优先 preview）"""
    # date 格式: 2026-03-08 或 20260308
    norm = date.replace("-", "") if "-" in date else date
    if len(norm) != 8:
        raise HTTPException(status_code=400, detail="Invalid date format")

    report = (
        db.query(Report)
        .filter(Report.report_date == f"{norm[:4]}-{norm[4:6]}-{norm[6:]}")
        .order_by(desc(Report.generated_at))
        .first()
    )

    if not report:
        raise HTTPException(status_code=404, detail="No report for this date")

    return await _get_full_or_preview(report, user, db)


@router.get("/latest/summary")
async def get_latest_summary(
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    report = db.query(Report).order_by(desc(Report.generated_at)).first()
    if not report:
        return {"message": "No reports available"}
    if not user or get_effective_tier(user) == UserTier.GUEST:
        return {"report": report.to_preview()}
    return {"report": report.to_dict()}


@router.get("/{report_id}/full")
async def get_full_report(
    report_id: str,
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """完整报告（含 sentiment, market, overview, alerts, briefs, options, topics）"""
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return await _get_full_or_preview(report, user, db)


async def _get_full_or_preview(
    report: Report, user: Optional[User], db: Session
):
    guest = not user or get_effective_tier(user) == UserTier.GUEST

    if guest:
        base = report.to_preview()
        alerts_q = (
            db.query(ReportAlert)
            .filter(ReportAlert.report_id == report.report_id)
            .order_by(desc(ReportAlert.score))
            .limit(5)
        )
        alerts = [a.to_dict() for a in alerts_q.all()]
        return {
            "report": base,
            "sentiment": None,
            "market_snapshots": [],
            "overview": None,
            "alerts": alerts,
            "news_briefs": [],
            "options": None,
            "topic_comparisons": [],
            "message": "注册后查看完整内容",
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
    report = db.query(Report).filter(Report.report_id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if not user or get_effective_tier(user) == UserTier.GUEST:
        items = (
            db.query(ReportItem)
            .filter(ReportItem.report_id == report_id)
            .order_by(desc(ReportItem.score))
            .limit(5)
            .all()
        )
        return {
            "report": report.to_preview(),
            "items": [i.to_preview() for i in items],
            "message": "注册后查看完整内容",
        }

    items = (
        db.query(ReportItem)
        .filter(ReportItem.report_id == report_id)
        .order_by(desc(ReportItem.score))
        .all()
    )
    return {
        "report": report.to_dict(),
        "items": [i.to_dict() for i in items],
    }
