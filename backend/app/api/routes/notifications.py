from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.models.push_subscription import PushSubscription
from app.models.user import User
from app.api.dependencies import get_current_user

router = APIRouter()

class PushSubscriptionRequest(BaseModel):
    endpoint: str
    p256dh: str
    auth: str

@router.post("/notifications/subscribe")
async def subscribe_push(
    sub: PushSubscriptionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Avoid duplicate subscriptions
    exists = db.query(PushSubscription).filter(
        PushSubscription.user_id == current_user.id,
        PushSubscription.endpoint == sub.endpoint
    ).first()
    if not exists:
        db.add(PushSubscription(
            user_id=current_user.id,
            endpoint=sub.endpoint,
            p256dh=sub.p256dh,
            auth=sub.auth
        ))
        db.commit()
    return {"message": "Push subscription registered"} 