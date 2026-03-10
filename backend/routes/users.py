"""用户相关路由（供前端 dashboard 用）"""
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from middleware.auth import get_current_user_optional, get_effective_tier
from models.user import User

router = APIRouter()


@router.get("/me")
async def get_current_user_stats(
    user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """获取当前用户基本信息（供 dashboard 展示）"""
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    tier = get_effective_tier(user)
    return {
        "user_id": user.user_id,
        "tier": tier.value if tier else "guest",
        "email": user.email,
        "display_name": user.display_name,
        "subscription_end": user.subscription_end.isoformat() if user.subscription_end else None,
        "is_active": user.is_active,
        "daily_query_count": user.daily_query_count,
    }
