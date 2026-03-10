"""
moriqiquanHtml 后端入口 - FastAPI
"""
import os
import re
from pathlib import Path

from dotenv import load_dotenv
_backend_dir = Path(__file__).resolve().parent
load_dotenv(_backend_dir.parent / ".env")   # 项目根 .env
load_dotenv(_backend_dir / ".env")          # backend/.env 可覆盖

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from routes import reports, health, users

app = FastAPI(
    title="moriqiquanHtml API",
    description="市场情报日报展示 API",
    version="1.0.0",
)

origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000,http://127.0.0.1:3001")
origins = [o.strip() for o in origins_str.split(",") if o.strip()]

# 开发环境：用正则允许本地/内网 Origin（如 Next 的 Network 地址 http://10.x.x.x:3000），避免 CORS 预检 400
allow_origin_regex = None
_origin_regex = re.compile(
    r"^https?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?$"
)
if os.getenv("ENV") != "production":
    allow_origin_regex = _origin_regex.pattern


def _allowed_origin(origin: str | None) -> str | None:
    """若 origin 在白名单或匹配内网正则则返回该 origin，否则返回 None。"""
    if not origin:
        return None
    if origin in origins:
        return origin
    if _origin_regex.match(origin):
        return origin
    return None


# 先添加的中间件后执行；为保证 CORS 预检成功，先处理 OPTIONS 再走 CORSMiddleware
class OptionsPreflightMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method != "OPTIONS":
            return await call_next(request)
        origin = request.headers.get("origin")
        allow_origin = _allowed_origin(origin) or (origin if os.getenv("ENV") != "production" else None)
        headers = {
            "Access-Control-Max-Age": "86400",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
        if allow_origin:
            headers["Access-Control-Allow-Origin"] = allow_origin
        return Response(status_code=200, headers=headers)


app.add_middleware(OptionsPreflightMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(users.router, prefix="/api/users", tags=["users"])


@app.get("/")
async def root():
    return {
        "service": "moriqiquanHtml API",
        "version": "1.0.0",
        "status": "running",
    }
