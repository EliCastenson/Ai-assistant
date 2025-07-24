from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
import enum

class TaskPriority(enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskStatus(enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    CANCELLED = "cancelled"

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Task details
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM)
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO)
    
    # Dates
    due_date = Column(DateTime(timezone=True), nullable=True)
    reminder_date = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Email linking
    linked_email_id = Column(String, ForeignKey("email_messages.id"), nullable=True)
    
    # AI suggestions
    ai_suggested = Column(Boolean, default=False)
    ai_confidence = Column(Integer, default=0)  # 0-100
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="tasks")
    linked_email = relationship("EmailMessage", backref="linked_tasks")
    
    def __repr__(self):
        return f"<Task(id={self.id}, title={self.title}, priority={self.priority})>"
    
    @property
    def is_overdue(self):
        """Check if task is overdue"""
        if self.due_date and self.status != TaskStatus.DONE:
            from datetime import datetime
            return datetime.utcnow() > self.due_date
        return False
    
    @property
    def is_due_soon(self):
        """Check if task is due within 24 hours"""
        if self.due_date and self.status != TaskStatus.DONE:
            from datetime import datetime, timedelta
            return datetime.utcnow() + timedelta(days=1) > self.due_date
        return False 