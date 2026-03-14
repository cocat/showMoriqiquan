"""
支付相关路由 - PingPong 收银台
"""
import os
import hmac
import hashlib
import json
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from middleware.auth import get_current_user_optional
from models.user import User, UserTier

router = APIRouter()

# PingPong 配置
PINGPONG_SANDBOX = os.getenv("PINGPONG_SANDBOX", "true").strip().lower() == "true"
PINGPONG_BASE_URL = (
    "https://sandbox-acquirer-payment.pingpongx.com"
    if PINGPONG_SANDBOX
    else "https://acquirer-payment.pingpongx.com"
)
PINGPONG_MERCHANT_ID = os.getenv("PINGPONG_MERCHANT_ID", "")
PINGPONG_SECRET_KEY = os.getenv("PINGPONG_SECRET_KEY", "")
PINGPONG_NOTIFICATION_URL = os.getenv("PINGPONG_NOTIFICATION_URL", "")
OBSERVER_PRICE_USD = 29.9


class CheckoutRequest(BaseModel):
    plan: str = "observer"  # 目前仅 observer


class CheckoutResponse(BaseModel):
    checkout_url: str
    order_id: str


def _create_pingpong_order(user_id: str, email: str | None, plan: str) -> dict:
    """
    调用 PingPong 下单接口，返回包含 checkout_url 的响应。
    具体 API 格式以 PingPong 文档为准，此处为占位实现。
    """
    if not PINGPONG_MERCHANT_ID or not PINGPONG_SECRET_KEY:
        raise HTTPException(
            status_code=503,
            detail="PingPong 未配置，请联系管理员配置 PINGPONG_MERCHANT_ID 和 PINGPONG_SECRET_KEY",
        )
    if plan != "observer":
        raise HTTPException(status_code=400, detail="当前仅开放 observer 套餐")
    # TODO: 按 PingPong 文档实现真实下单请求
    # 参考：Hosted-Redirect 模式，调用下单 API，获取 paymentUrl
    order_id = f"mv_{user_id}_{int(datetime.utcnow().timestamp())}"
    # 占位：返回沙箱测试 URL，实际应替换为 PingPong API 返回的 paymentUrl
    checkout_url = f"{PINGPONG_BASE_URL}/checkout?order={order_id}"
    return {"checkout_url": checkout_url, "order_id": order_id}


@router.post("/checkout", response_model=CheckoutResponse)
async def create_checkout(
    body: CheckoutRequest,
    user: User = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """创建 PingPong 支付订单，返回收银台 URL（需登录）"""
    if not user:
        raise HTTPException(status_code=401, detail="请先登录")
    result = _create_pingpong_order(
        user_id=user.user_id,
        email=user.email,
        plan=body.plan,
    )
    return CheckoutResponse(**result)


def _verify_pingpong_signature(body: bytes, signature: str) -> bool:
    """验证 PingPong 异步通知签名（具体算法以文档为准）"""
    if not PINGPONG_SECRET_KEY:
        return False
    expected = hmac.new(
        PINGPONG_SECRET_KEY.encode(),
        body,
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/webhook")
async def pingpong_webhook(request: Request, db: Session = Depends(get_db)):
    """
    接收 PingPong 支付异步通知。
    需在 PingPong 商户后台配置 notificationUrl 指向此接口。
    注意：不能做登录态校验。
    """
    body = await request.body()
    sig = request.headers.get("X-PingPong-Signature", "")
    # 实际签名头名以 PingPong 文档为准

    if PINGPONG_SECRET_KEY and not _verify_pingpong_signature(body, sig):
        return {"code": "FAIL", "message": "invalid signature"}

    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return {"code": "FAIL", "message": "invalid json"}

    # 解析交易结果（字段名以 PingPong 文档为准）
    status = data.get("status") or data.get("tradeStatus") or data.get("payStatus")
    order_id = data.get("orderId") or data.get("order_id") or data.get("merchantTradeNo")
    if not order_id:
        return {"code": "FAIL", "message": "missing orderId"}

    if status not in ("SUCCESS", "PAID", "success", "paid"):
        return {"code": "OK"}  # 非成功状态也返回 200 避免重试

    # 从 order_id 解析 user_id（格式：mv_{user_id}_{ts}）
    parts = str(order_id).split("_")
    if len(parts) >= 3 and parts[0] == "mv":
        user_id = parts[1]
    else:
        return {"code": "FAIL", "message": "invalid order_id format"}

    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        return {"code": "FAIL", "message": "user not found"}
    now = datetime.utcnow()
    user.subscription_start = user.subscription_start or now
    user.subscription_end = now + timedelta(days=30)
    user.tier = UserTier.OBSERVER
    db.commit()

    return {"code": "OK"}