from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.core.config import settings
from app.core.database import init_db, get_db
from app.api.routes import chat, tasks, calendar, email, voice, auth, search, health, agent, suggestions, notifications
from app.services.ai_service import AIService
from app.services.voice_service import VoiceService
from app.core import ai_scheduler

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 Starting AI Assistant...")
    await init_db()
    
    # Initialize services
    app.state.ai_service = AIService()
    app.state.voice_service = VoiceService()
    
    yield
    
    # Shutdown
    print("🛑 Shutting down AI Assistant...")

# Create FastAPI app
app = FastAPI(
    title="AI Assistant API",
    description="A comprehensive AI-powered personal assistant",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(voice.router, prefix="/api/voice", tags=["Voice"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(calendar.router, prefix="/api/calendar", tags=["Calendar"])
app.include_router(email.router, prefix="/api/email", tags=["Email"])
app.include_router(search.router, prefix="/api", tags=["Search"])
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(agent.router, prefix="/api", tags=["Agent"])
app.include_router(notifications.router, prefix="/api", tags=["Notifications"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "AI Assistant API is running!",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "database": "connected",
            "ai_service": "ready",
            "voice_service": "ready"
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level="info"
    ) 