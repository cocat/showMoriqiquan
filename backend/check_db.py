#!/usr/bin/env python3
"""
独立脚本：检查 DATABASE_URL 是否可连接（不启动 FastAPI）。
用法：在 backend 目录下执行
  python check_db.py
或先加载 .env：
  export $(grep -v '^#' .env | xargs) && python check_db.py
"""
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

def main():
    backend_dir = Path(__file__).resolve().parent
    load_dotenv(backend_dir.parent / ".env", override=True)
    load_dotenv(backend_dir / ".env", override=True)

    database_url = os.getenv("DATABASE_URL", "sqlite:///./test.db")
    # 隐藏密码，只显示用于提示的 URL
    if "@" in database_url and "://" in database_url:
        scheme = database_url.split("://")[0]
        rest = database_url.split("@", 1)[-1]
        display_url = f"{scheme}://***@{rest}"
    else:
        display_url = database_url

    print(f"正在检查数据库连接…")
    print(f"DATABASE_URL: {display_url}")
    print()

    try:
        from sqlalchemy import create_engine, text
        if database_url.startswith("sqlite"):
            engine = create_engine(database_url, connect_args={"check_same_thread": False})
        else:
            engine = create_engine(database_url, pool_pre_ping=True)
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("结果: 数据库连接正常")
        return 0
    except Exception as e:
        print(f"结果: 连接失败 - {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
