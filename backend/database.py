"""
数据库连接配置 - 连接与 moriqiquan 共享的 RDS
"""
import os
import re
import logging
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./test.db",
)


def _pg_url_apply_ssl_mode(url: str) -> str:
    """
    应用 SSL 模式。若环境变量 DATABASE_SSL_MODE 已设置（如 disable / prefer / require），
    则覆盖 URL 中的 sslmode，用于兼容「服务器不支持 SSL」等场景。
    """
    if not url.startswith(("postgresql://", "postgresql+psycopg2://")):
        return url
    ssl_mode = os.getenv("DATABASE_SSL_MODE", "").strip().lower()
    if not ssl_mode:
        return url
    if "sslmode=" in url:
        url = re.sub(r"sslmode=[^&]+", f"sslmode={ssl_mode}", url)
    else:
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}sslmode={ssl_mode}"
    return url


if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    url = _pg_url_apply_ssl_mode(DATABASE_URL)
    # pool_recycle：避免长时间空闲连接被 RDS 主动断开后仍被复用导致 OperationalError
    # connect_timeout：连接阶段超时，避免长时间挂起
    engine = create_engine(
        url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_recycle=300,
        connect_args={"connect_timeout": 10},
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
logger = logging.getLogger(__name__)


PERFORMANCE_INDEX_SQL = (
    # 最新报告列表、latest summary 走 generated_at 排序
    (
        "CREATE INDEX IF NOT EXISTS idx_reports_generated_at "
        "ON reports (generated_at DESC);"
    ),
    # 按日期取报告时同时按生成时间取最新一条
    (
        "CREATE INDEX IF NOT EXISTS idx_reports_report_date_generated_at "
        "ON reports (report_date, generated_at DESC);"
    ),
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_performance_indexes() -> None:
    """
    启动时确保性能索引存在。使用 IF NOT EXISTS 可重复执行，无副作用。
    """
    try:
        with engine.begin() as conn:
            for sql in PERFORMANCE_INDEX_SQL:
                conn.execute(text(sql))
        logger.info("Performance indexes ensured")
    except Exception as exc:
        # 索引创建失败不阻塞服务启动，但记录日志便于排查
        logger.warning("Failed to ensure performance indexes: %s", exc)


def ensure_auth_columns() -> None:
    """
    启动时确保 users 表含账号密码登录所需列。
    """
    try:
        inspector = inspect(engine)
        if not inspector.has_table("users"):
            return

        cols = {col["name"] for col in inspector.get_columns("users")}
        alter_sql = []
        if "password_hash" not in cols:
            alter_sql.append(
                "ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)"
            )
        if "password_updated_at" not in cols:
            alter_sql.append(
                "ALTER TABLE users ADD COLUMN password_updated_at TIMESTAMP"
            )

        if not alter_sql:
            return
        with engine.begin() as conn:
            for sql in alter_sql:
                conn.execute(text(sql))
        logger.info("Auth columns ensured")
    except Exception as exc:
        logger.warning("Failed to ensure auth columns: %s", exc)
