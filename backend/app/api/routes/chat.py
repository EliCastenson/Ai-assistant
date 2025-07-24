from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models.chat_message import ChatMessage, MessageRole, MessageType
from app.models.user import User
from app.services.ai_service import AIService
from app.api.dependencies import get_current_user

router = APIRouter()

class ChatMessageRequest(BaseModel):
    message: str
    message_type: MessageType = MessageType.TEXT
    audio_file_path: Optional[str] = None

class ChatMessageResponse(BaseModel):
    id: str
    role: MessageRole
    message_type: MessageType
    content: str
    created_at: datetime
    related_task_id: Optional[str] = None
    related_email_id: Optional[str] = None
    related_event_id: Optional[str] = None

class ChatHistoryResponse(BaseModel):
    messages: List[ChatMessageResponse]
    total: int

@router.post("/send", response_model=ChatMessageResponse)
async def send_message(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    ai_service: AIService = Depends(lambda: AIService())
):
    """Send a message to the AI assistant"""
    try:
        # Save user message
        user_message = ChatMessage(
            user_id=current_user.id,
            role=MessageRole.USER,
            message_type=request.message_type,
            content=request.message,
            audio_file_path=request.audio_file_path
        )
        db.add(user_message)
        db.commit()
        db.refresh(user_message)
        
        # Get AI response
        ai_response = await ai_service.process_message(
            user_message=request.message,
            user_id=current_user.id,
            db=db
        )
        
        # Save AI response
        assistant_message = ChatMessage(
            user_id=current_user.id,
            role=MessageRole.ASSISTANT,
            message_type=MessageType.TEXT,
            content=ai_response["content"],
            tokens_used=ai_response.get("tokens_used", 0),
            model_used=ai_response.get("model_used"),
            related_task_id=ai_response.get("related_task_id"),
            related_email_id=ai_response.get("related_email_id"),
            related_event_id=ai_response.get("related_event_id")
        )
        db.add(assistant_message)
        db.commit()
        db.refresh(assistant_message)
        
        return ChatMessageResponse(
            id=assistant_message.id,
            role=assistant_message.role,
            message_type=assistant_message.message_type,
            content=assistant_message.content,
            created_at=assistant_message.created_at,
            related_task_id=assistant_message.related_task_id,
            related_email_id=assistant_message.related_email_id,
            related_event_id=assistant_message.related_event_id
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error processing message: {str(e)}")

@router.get("/history", response_model=ChatHistoryResponse)
async def get_chat_history(
    limit: int = 50,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chat history for the current user"""
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(
        ChatMessage.created_at.desc()
    ).offset(offset).limit(limit).all()
    
    total = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).count()
    
    return ChatHistoryResponse(
        messages=[
            ChatMessageResponse(
                id=msg.id,
                role=msg.role,
                message_type=msg.message_type,
                content=msg.content,
                created_at=msg.created_at,
                related_task_id=msg.related_task_id,
                related_email_id=msg.related_email_id,
                related_event_id=msg.related_event_id
            ) for msg in messages
        ],
        total=total
    )

@router.delete("/clear")
async def clear_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear chat history for the current user"""
    try:
        db.query(ChatMessage).filter(
            ChatMessage.user_id == current_user.id
        ).delete()
        db.commit()
        return {"message": "Chat history cleared successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error clearing chat history: {str(e)}") 