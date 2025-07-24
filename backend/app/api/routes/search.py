from fastapi import APIRouter, HTTPException, Query
from app.core.config import settings
import requests

router = APIRouter()

@router.get("/search")
async def web_search(q: str = Query(..., description="Search query"), num: int = 5):
    """Search the web using SerpAPI and return top results"""
    if not settings.SERPAPI_KEY:
        raise HTTPException(status_code=500, detail="SerpAPI key not configured")
    params = {
        "q": q,
        "api_key": settings.SERPAPI_KEY,
        "engine": "google",
        "num": num,
    }
    resp = requests.get("https://serpapi.com/search", params=params)
    if not resp.ok:
        raise HTTPException(status_code=500, detail="Web search failed")
    data = resp.json()
    results = []
    for item in data.get("organic_results", [])[:num]:
        results.append({
            "title": item.get("title"),
            "link": item.get("link"),
            "snippet": item.get("snippet"),
        })
    return {"results": results} 