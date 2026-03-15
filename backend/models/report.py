"""
报告数据模型 - 与 moriqiquan RDS 表结构兼容（只读）
"""
from datetime import datetime
from sqlalchemy import (
    Column, String, DateTime, Integer, Float, Text, JSON,
    ForeignKey, Index, Boolean,
)
from sqlalchemy.orm import relationship
from database import Base


class Report(Base):
    __tablename__ = "reports"

    report_id = Column(String(64), primary_key=True, index=True)
    batch_id = Column(String(64), nullable=True, index=True)
    report_date = Column(String(10), nullable=False, index=True)
    generated_at = Column(DateTime, nullable=False)
    title = Column(String(255), nullable=False)
    push_type = Column(String(32), nullable=False)
    time_slot = Column(String(32), nullable=True)
    html_path = Column(String(512), nullable=True)

    item_count = Column(Integer, default=0, nullable=False)
    red_count = Column(Integer, default=0, nullable=False)
    yellow_count = Column(Integer, default=0, nullable=False)
    topic_count = Column(Integer, default=0, nullable=False)
    multi_source_count = Column(Integer, default=0, nullable=False)
    sentiment_score = Column(Float, nullable=True)
    sentiment_level = Column(String(16), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    sentiment = relationship(
        "ReportSentiment", back_populates="report",
        uselist=False, cascade="all, delete-orphan",
    )
    market_snapshots = relationship(
        "ReportMarketSnapshot", back_populates="report",
        cascade="all, delete-orphan",
    )
    overview = relationship(
        "ReportOverview", back_populates="report",
        uselist=False, cascade="all, delete-orphan",
    )
    news_briefs = relationship(
        "ReportNewsBrief", back_populates="report",
        cascade="all, delete-orphan",
    )
    options = relationship(
        "ReportOptions", back_populates="report",
        uselist=False, cascade="all, delete-orphan",
    )
    alerts = relationship(
        "ReportAlert", back_populates="report",
        cascade="all, delete-orphan",
        order_by="desc(ReportAlert.score)",
    )
    topic_comparisons = relationship(
        "ReportTopicComparison", back_populates="report",
        cascade="all, delete-orphan",
        order_by="desc(ReportTopicComparison.score)",
    )
    items = relationship(
        "ReportItem", back_populates="report",
        cascade="all, delete-orphan",
    )

    def to_dict(self, include_items=False):
        result = {
            "report_id": self.report_id,
            "report_date": self.report_date,
            "title": self.title,
            "push_type": self.push_type,
            "time_slot": self.time_slot,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
            "item_count": self.item_count,
            "red_count": self.red_count,
            "yellow_count": self.yellow_count,
            "topic_count": self.topic_count,
            "multi_source_count": self.multi_source_count,
            "sentiment_score": self.sentiment_score,
            "sentiment_level": self.sentiment_level,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_items:
            result["items"] = [item.to_dict() for item in self.items]
        return result

    def to_preview(self):
        return {
            "report_id": self.report_id,
            "report_date": self.report_date,
            "title": self.title,
            "generated_at": self.generated_at.isoformat() if self.generated_at else None,
            "item_count": self.item_count,
            "red_count": self.red_count,
            "yellow_count": self.yellow_count,
            "topic_count": self.topic_count,
            "multi_source_count": self.multi_source_count,
            "sentiment_score": self.sentiment_score,
            "sentiment_level": self.sentiment_level,
            "message": "注册后查看完整内容",
        }

    __table_args__ = (Index("idx_reports_date", "report_date"),)


class ReportSentiment(Base):
    __tablename__ = "report_sentiment"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(
        String(64), ForeignKey("reports.report_id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True,
    )
    score = Column(Float, nullable=False)
    level = Column(String(16), nullable=False)
    label = Column(String(32), nullable=True)
    description = Column(Text, nullable=True)
    signal_count = Column(Integer, default=0)
    red_count = Column(Integer, default=0)
    yellow_count = Column(Integer, default=0)
    confirmed_count = Column(Integer, default=0)
    topic_count = Column(Integer, default=0)
    report = relationship("Report", back_populates="sentiment")


class ReportMarketSnapshot(Base):
    __tablename__ = "report_market_snapshot"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(
        String(64), ForeignKey("reports.report_id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    symbol = Column(String(32), nullable=False, index=True)
    name = Column(String(128), nullable=True)
    group_label = Column(String(64), nullable=True)
    price = Column(Float, nullable=True)
    pct_change = Column(Float, nullable=True)
    change = Column(Float, nullable=True)
    range_high = Column(Float, nullable=True)
    range_low = Column(Float, nullable=True)
    volume = Column(Float, nullable=True)
    avg_volume = Column(Float, nullable=True)
    volume_ratio = Column(Float, nullable=True)
    direction = Column(String(8), nullable=True)
    has_alert = Column(Boolean, default=False)
    link = Column(Text, nullable=True)
    report = relationship("Report", back_populates="market_snapshots")

    __table_args__ = (
        Index("idx_snapshot_report_symbol", "report_id", "symbol"),
        Index("idx_snapshot_symbol", "symbol"),
    )


class ReportOverview(Base):
    __tablename__ = "report_overview"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(
        String(64), ForeignKey("reports.report_id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True,
    )
    content = Column(Text, nullable=False)
    report = relationship("Report", back_populates="overview")


class ReportNewsBrief(Base):
    __tablename__ = "report_news_briefs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(
        String(64), ForeignKey("reports.report_id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    topic_id = Column(String(64), nullable=True, index=True)
    topic_name = Column(String(128), nullable=True)
    source_count = Column(Integer, default=0)
    body = Column(Text, nullable=True)
    impact = Column(Text, nullable=True)
    sources = Column(JSON, nullable=True)
    report = relationship("Report", back_populates="news_briefs")

    __table_args__ = (Index("idx_brief_report_topic", "report_id", "topic_id"),)


class ReportOptions(Base):
    __tablename__ = "report_options"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(
        String(64), ForeignKey("reports.report_id", ondelete="CASCADE"),
        nullable=False, unique=True, index=True,
    )
    recommendation = Column(String(32), nullable=True)
    body_text = Column(Text, nullable=True)
    underlying = Column(String(32), nullable=True)
    direction = Column(String(8), nullable=True)
    report = relationship("Report", back_populates="options")
    candidates = relationship(
        "ReportOptionCandidate", back_populates="options_strategy",
        cascade="all, delete-orphan",
        order_by="ReportOptionCandidate.rank",
    )


class ReportOptionCandidate(Base):
    __tablename__ = "report_option_candidates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    options_id = Column(
        Integer, ForeignKey("report_options.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    rank = Column(Integer, nullable=True)
    contract_code = Column(String(64), nullable=True)
    strike = Column(Float, nullable=True)
    expiry = Column(String(16), nullable=True)
    days_to_expiry = Column(Integer, nullable=True)
    bid = Column(Float, nullable=True)
    ask = Column(Float, nullable=True)
    iv = Column(Float, nullable=True)
    otm_pct = Column(Float, nullable=True)
    delta = Column(Float, nullable=True)
    leverage = Column(Float, nullable=True)
    max_loss = Column(Float, nullable=True)
    target_5x = Column(Float, nullable=True)
    breakeven = Column(Float, nullable=True)
    volume = Column(Integer, nullable=True)
    open_interest = Column(Integer, nullable=True)
    reason = Column(Text, nullable=True)
    options_strategy = relationship("ReportOptions", back_populates="candidates")


class ReportAlert(Base):
    __tablename__ = "report_alerts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(
        String(64), ForeignKey("reports.report_id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    merged_id = Column(String(128), nullable=True, index=True)
    score = Column(Integer, nullable=False, index=True)
    level = Column(String(16), nullable=False, index=True)
    title = Column(Text, nullable=False)
    zh_title = Column(Text, nullable=True)
    source_name = Column(String(255), nullable=True)
    published_at = Column(DateTime, nullable=True, index=True)
    link = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_summary_en = Column(Text, nullable=True)
    direction = Column(String(16), nullable=True)
    direction_note = Column(Text, nullable=True)
    assets = Column(JSON, nullable=True)
    reason_tags = Column(JSON, nullable=True)
    topic_id = Column(String(64), nullable=True, index=True)
    topic_name = Column(String(128), nullable=True)
    is_emergency = Column(Boolean, default=False)
    multi_source_count = Column(Integer, default=1)
    report = relationship("Report", back_populates="alerts")

    def to_dict(self):
        return {
            "id": self.id,
            "report_id": self.report_id,
            "score": self.score,
            "level": self.level,
            "title": self.title,
            "zh_title": self.zh_title,
            "source_name": self.source_name,
            "published_at": self.published_at.isoformat() if self.published_at else None,
            "link": self.link,
            "ai_summary": self.ai_summary,
            "direction": self.direction,
            "direction_note": self.direction_note,
            "assets": self.assets,
            "topic_id": self.topic_id,
            "topic_name": self.topic_name,
            "is_emergency": self.is_emergency,
            "multi_source_count": self.multi_source_count,
        }

    __table_args__ = (
        Index("idx_alert_report_score", "report_id", "score"),
        Index("idx_alert_report_level", "report_id", "level"),
    )


class ReportTopicComparison(Base):
    __tablename__ = "report_topic_comparison"

    id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(
        String(64), ForeignKey("reports.report_id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    topic_id = Column(String(64), nullable=True, index=True)
    topic_name = Column(String(128), nullable=True)
    score = Column(Integer, nullable=True)
    today_count = Column(Integer, default=0)
    yesterday_count = Column(Integer, default=0)
    delta = Column(Integer, default=0)
    level = Column(String(16), nullable=True)
    report = relationship("Report", back_populates="topic_comparisons")


class ReportItem(Base):
    __tablename__ = "report_items"

    item_id = Column(Integer, primary_key=True, autoincrement=True)
    report_id = Column(
        String(64), ForeignKey("reports.report_id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    entry_id = Column(String(128), nullable=False, index=True)
    title = Column(Text, nullable=False)
    link = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    score = Column(Integer, nullable=False)
    level = Column(String(16), nullable=False)
    source_id = Column(String(64), nullable=True)
    source_name = Column(String(255), nullable=True)
    source_weight = Column(Integer, nullable=True)
    topic_id = Column(String(64), nullable=True, index=True)
    topic_name = Column(String(128), nullable=True)
    reasons = Column(JSON, nullable=True)
    published_at = Column(DateTime, nullable=True)
    collected_at = Column(DateTime, nullable=True)
    report = relationship("Report", back_populates="items")

    def to_dict(self):
        return {
            "item_id": self.item_id,
            "entry_id": self.entry_id,
            "title": self.title,
            "link": self.link,
            "summary": self.summary,
            "score": self.score,
            "level": self.level,
            "source_name": self.source_name,
            "topic_id": self.topic_id,
            "topic_name": self.topic_name,
            "reasons": self.reasons,
            "published_at": self.published_at.isoformat() if self.published_at else None,
        }

    def to_preview(self):
        return {
            "title": self.title,
            "summary": (
                self.summary[:50] + "..." if self.summary and len(self.summary) > 50 else self.summary
            ),
            "score": self.score,
            "level": self.level,
            "topic_name": self.topic_name,
        }
