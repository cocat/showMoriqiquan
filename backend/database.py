"""
数据库连接配置 - 连接与 moriqiquan 共享的 RDS
"""
import os
import re
from sqlalchemy import create_engine
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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
