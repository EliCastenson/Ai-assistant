from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from app.core.database import get_db
from app.models.suggestion import Suggestion
from app.models.user import User
from app.api.dependencies import get_current_user
from datetime import datetime

router = APIRouter()

class SuggestionResponse(BaseModel):
    id: str
    type: str
    message: str
    is_read: bool
    created_at: datetime
    related_task_id: str = None
    related_email_id: str = None
    related_event_id: str = None

@router.get("/suggestions", response_model=List[SuggestionResponse])
async def get_suggestions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    suggestions = db.query(Suggestion).filter(Suggestion.user_id == current_user.id).order_by(Suggestion.created_at.desc()).all()
    return [
        SuggestionResponse(
            id=s.id,
            type=s.type,
            message=s.message,
            is_read=s.is_read,
            created_at=s.created_at,
            related_task_id=s.related_task_id,
            related_email_id=s.related_email_id,
            related_event_id=s.related_event_id
        ) for s in suggestions
    ]

@router.post("/suggestions/{suggestion_id}/read")
async def mark_suggestion_read(suggestion_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    suggestion = db.query(Suggestion).filter(Suggestion.id == suggestion_id, Suggestion.user_id == current_user.id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    suggestion.is_read = True
    db.commit()
    return {"message": "Suggestion marked as read"}

@router.delete("/suggestions/clear")
async def clear_suggestions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Suggestion).filter(Suggestion.user_id == current_user.id).delete()
    db.commit()
    return {"message": "All suggestions cleared"} 