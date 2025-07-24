from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
import sqlcipher3
import os
from typing import Generator

from app.core.config import settings

# Create database engine with SQLCipher encryption
def create_database_engine():
    """Create SQLAlchemy engine with SQLCipher encryption"""
    if settings.DATABASE_URL.startswith("sqlite"):
        # For SQLite with SQLCipher
        engine = create_engine(
            settings.DATABASE_URL,
            connect_args={
                "check_same_thread": False,
                "key": settings.ENCRYPTION_KEY
            },
            poolclass=StaticPool,
            echo=settings.DEBUG
        )
    else:
        # For other databases
        engine = create_engine(
            settings.DATABASE_URL,
            echo=settings.DEBUG
        )
    return engine

# Create engine and session
engine = create_database_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Metadata for migrations
metadata = MetaData()

def get_db() -> Generator[Session, None, None]:
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def init_db():
    """Initialize database tables"""
    try:
        # Import all models to ensure they're registered
        from app.models import user, task, calendar_event, email_message, chat_message
        
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✅ Database initialized successfully")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        raise

def get_db_session() -> Session:
    """Get a database session (for non-async contexts)"""
    return SessionLocal() 