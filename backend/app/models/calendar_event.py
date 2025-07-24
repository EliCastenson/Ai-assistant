from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid

class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    
    # Google Calendar ID
    google_event_id = Column(String, nullable=True, unique=True)
    
    # Event details
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    location = Column(String, nullable=True)
    
    # Time
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    all_day = Column(Boolean, default=False)
    
    # Calendar info
    calendar_id = Column(String, nullable=True)  # Google Calendar ID
    attendees = Column(Text, nullable=True)  # JSON string of attendees
    
    # AI suggestions
    ai_suggested = Column(Boolean, default=False)
    ai_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="calendar_events")
    
    def __repr__(self):
        return f"<CalendarEvent(id={self.id}, title={self.title}, start={self.start_time})>" 