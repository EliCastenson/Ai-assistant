from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
import requests
import time
from typing import Dict, Any

router = APIRouter()

@router.get("/health")
async def health_check(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Comprehensive health check for all services"""
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "1.0.0",
        "services": {}
    }
    
    # Database health check
    try:
        db.execute("SELECT 1")
        health_status["services"]["database"] = {
            "status": "healthy",
            "response_time": 0
        }
    except Exception as e:
        health_status["services"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
        health_status["status"] = "unhealthy"
    
    # Google API health check
    if settings.GOOGLE_CLIENT_ID:
        try:
            resp = requests.get("https://www.googleapis.com/discovery/v1/apis", timeout=5)
            health_status["services"]["google_api"] = {
                "status": "healthy" if resp.ok else "unhealthy",
                "response_time": resp.elapsed.total_seconds(),
                "status_code": resp.status_code
            }
        except Exception as e:
            health_status["services"]["google_api"] = {
                "status": "unhealthy",
                "error": str(e)
            }
    else:
        health_status["services"]["google_api"] = {
            "status": "not_configured"
        }
    
    # Microsoft Graph API health check
    if settings.OUTLOOK_CLIENT_ID:
        try:
            resp = requests.get("https://graph.microsoft.com/v1.0/", timeout=5)
            health_status["services"]["outlook_api"] = {
                "status": "healthy" if resp.ok else "unhealthy",
                "response_time": resp.elapsed.total_seconds(),
                "status_code": resp.status_code
            }
        except Exception as e:
            health_status["services"]["outlook_api"] = {
                "status": "unhealthy",
                "error": str(e)
            }
    else:
        health_status["services"]["outlook_api"] = {
            "status": "not_configured"
        }
    
    # SerpAPI health check
    if settings.SERPAPI_KEY:
        try:
            resp = requests.get("https://serpapi.com/search?q=test&api_key=" + settings.SERPAPI_KEY, timeout=5)
            health_status["services"]["serpapi"] = {
                "status": "healthy" if resp.ok else "unhealthy",
                "response_time": resp.elapsed.total_seconds(),
                "status_code": resp.status_code
            }
        except Exception as e:
            health_status["services"]["serpapi"] = {
                "status": "unhealthy",
                "error": str(e)
            }
    else:
        health_status["services"]["serpapi"] = {
            "status": "not_configured"
        }
    
    # OpenAI API health check
    if settings.OPENAI_API_KEY:
        try:
            resp = requests.get("https://api.openai.com/v1/models", 
                              headers={"Authorization": f"Bearer {settings.OPENAI_API_KEY}"}, 
                              timeout=5)
            health_status["services"]["openai"] = {
                "status": "healthy" if resp.ok else "unhealthy",
                "response_time": resp.elapsed.total_seconds(),
                "status_code": resp.status_code
            }
        except Exception as e:
            health_status["services"]["openai"] = {
                "status": "unhealthy",
                "error": str(e)
            }
    else:
        health_status["services"]["openai"] = {
            "status": "not_configured"
        }
    
    return health_status

@router.get("/health/simple")
async def simple_health_check() -> Dict[str, str]:
    """Simple health check for load balancers"""
    return {"status": "ok", "version": "1.0.0"} 