from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Server settings
    HOST: str = "localhost"
    PORT: int = 8000
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./ai_assistant.db"
    ENCRYPTION_KEY: str = "your-secret-encryption-key-change-this"
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    OPENAI_MODEL: str = "gpt-4"
    OPENAI_MAX_TOKENS: int = 2000
    
    # Google APIs
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/auth/google/callback"
    
    # Voice settings
    WHISPER_MODEL: str = "base"
    TTS_ENABLED: bool = True
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-this"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Search API (optional)
    SERPAPI_KEY: Optional[str] = None
    
    # File storage
    UPLOAD_DIR: str = "./uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # Email notifications
    EMAIL_NOTIFICATIONS_ENABLED: bool = False
    EMAIL_FROM: str = "no-reply@ai-assistant.local"
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 25
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    
    # LLM Provider
    LLM_PROVIDER: str = "openai"  # Options: 'openai', 'ollama'
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create settings instance
settings = Settings()

# Ensure upload directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True) 