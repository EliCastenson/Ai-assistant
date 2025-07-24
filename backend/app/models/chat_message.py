from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
import enum

class MessageRole(enum.Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class MessageType(enum.Enum):
    TEXT = "text"
    VOICE = "voice"
    TASK_CREATED = "task_created"
    EMAIL_SUMMARY = "email_summary"
    CALENDAR_EVENT = "calendar_event"

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Message details
    role = Column(Enum(MessageRole), nullable=False)
    message_type = Column(Enum(MessageType), default=MessageType.TEXT)
    content = Column(Text, nullable=False)
    
    # Voice processing
    audio_file_path = Column(String, nullable=True)
    transcription = Column(Text, nullable=True)
    
    # AI processing
    tokens_used = Column(Integer, default=0)
    model_used = Column(String, nullable=True)
    
    # Context and actions
    related_task_id = Column(String, ForeignKey("tasks.id"), nullable=True)
    related_email_id = Column(String, ForeignKey("email_messages.id"), nullable=True)
    related_event_id = Column(String, ForeignKey("calendar_events.id"), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="chat_messages")
    related_task = relationship("Task")
    related_email = relationship("EmailMessage")
    related_event = relationship("CalendarEvent")
    
    def __repr__(self):
        return f"<ChatMessage(id={self.id}, role={self.role}, type={self.message_type})>" 