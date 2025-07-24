from sqlalchemy import Column, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class Suggestion(Base):
    __tablename__ = "suggestions"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # e.g., 'task', 'email', 'calendar', 'reminder'
    message = Column(Text, nullable=False)
    related_task_id = Column(String, ForeignKey("tasks.id"), nullable=True)
    related_email_id = Column(String, ForeignKey("email_messages.id"), nullable=True)
    related_event_id = Column(String, ForeignKey("calendar_events.id"), nullable=True)
    is_read = Column(Boolean, default=False)
    is_notified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    user = relationship("User", backref="suggestions")

    def __repr__(self):
        return f"<Suggestion(id={self.id}, type={self.type}, message={self.message[:30]})>" 