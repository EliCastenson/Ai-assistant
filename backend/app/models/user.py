from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base
import uuid
from datetime import datetime, timedelta

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    # Google OAuth tokens (encrypted)
    google_access_token = Column(Text, nullable=True)
    google_refresh_token = Column(Text, nullable=True)
    google_token_expires_at = Column(DateTime, nullable=True)
    # Outlook OAuth tokens (encrypted)
    outlook_access_token = Column(Text, nullable=True)
    outlook_refresh_token = Column(Text, nullable=True)
    outlook_token_expires_at = Column(DateTime, nullable=True)
    # Settings
    timezone = Column(String, default="UTC")
    language = Column(String, default="en")
    notifications_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    # Relationships
    tasks = relationship("Task", back_populates="user", cascade="all, delete-orphan")
    calendar_events = relationship("CalendarEvent", back_populates="user", cascade="all, delete-orphan")
    email_messages = relationship("EmailMessage", back_populates="user", cascade="all, delete-orphan")
    chat_messages = relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")

    def is_google_token_expired(self):
        return self.google_token_expires_at and self.google_token_expires_at < datetime.utcnow() + timedelta(minutes=2)

    def is_outlook_token_expired(self):
        return self.outlook_token_expires_at and self.outlook_token_expires_at < datetime.utcnow() + timedelta(minutes=2)

    def update_google_token(self, access_token, expires_in):
        self.google_access_token = access_token
        self.google_token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

    def update_outlook_token(self, access_token, expires_in):
        self.outlook_access_token = access_token
        self.outlook_token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)

    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, name={self.name})>" 