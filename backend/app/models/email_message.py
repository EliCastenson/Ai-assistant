from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class EmailMessage(Base):
    __tablename__ = "email_messages"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Gmail ID
    gmail_id = Column(String, nullable=True, unique=True)
    thread_id = Column(String, nullable=True)
    
    # Email details
    subject = Column(String, nullable=False)
    sender = Column(String, nullable=False)
    recipients = Column(JSON, nullable=True)  # List of email addresses
    body = Column(Text, nullable=True)
    body_plain = Column(Text, nullable=True)
    
    # Status
    is_read = Column(Boolean, default=False)
    is_important = Column(Boolean, default=False)
    is_starred = Column(Boolean, default=False)
    
    # AI processing
    ai_summary = Column(Text, nullable=True)
    ai_suggested_reply = Column(Text, nullable=True)
    ai_priority_score = Column(Integer, default=0)  # 0-100
    ai_action_required = Column(Boolean, default=False)
    
    # Timestamps
    received_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="email_messages")
    
    def __repr__(self):
        return f"<EmailMessage(id={self.id}, subject={self.subject}, sender={self.sender})>" 