from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from app.core.database import get_db
from app.models.user import User
from app.api.dependencies import create_access_token, get_current_user
from app.core.config import settings
import os
import requests
from urllib.parse import urlencode
from datetime import datetime, timedelta

router = APIRouter()

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    email: str
    name: str

GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send"
]

OUTLOOK_AUTH_BASE = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize"
OUTLOOK_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
OUTLOOK_SCOPES = [
    "openid",
    "profile",
    "email",
    "offline_access",
    "https://graph.microsoft.com/Mail.Read",
    "https://graph.microsoft.com/Mail.Send",
    "https://graph.microsoft.com/Calendars.ReadWrite"
]

@router.get("/google/login")
async def google_login():
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(GOOGLE_SCOPES),
        "access_type": "offline",
        "prompt": "consent",
    }
    url = f"{GOOGLE_AUTH_BASE}?{urlencode(params)}"
    return {"auth_url": url}

@router.get("/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    data = {
        "code": code,
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    token_resp = requests.post(GOOGLE_TOKEN_URL, data=data)
    if not token_resp.ok:
        raise HTTPException(status_code=400, detail="Failed to get Google tokens")
    tokens = token_resp.json()
    id_token = tokens.get("id_token")
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    expires_in = tokens.get("expires_in")
    userinfo_resp = requests.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    if not userinfo_resp.ok:
        raise HTTPException(status_code=400, detail="Failed to get Google user info")
    userinfo = userinfo_resp.json()
    email = userinfo["email"]
    name = userinfo.get("name", email.split("@")[0])
    avatar_url = userinfo.get("picture")
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, name=name, avatar_url=avatar_url)
        db.add(user)
    user.google_access_token = access_token
    user.google_refresh_token = refresh_token
    user.google_token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
    user.avatar_url = avatar_url
    db.commit()
    db.refresh(user)
    app_token = create_access_token({"sub": user.id})
    return {"access_token": app_token, "user_id": user.id, "email": user.email, "name": user.name}

@router.get("/outlook/login")
async def outlook_login():
    params = {
        "client_id": settings.OUTLOOK_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": settings.OUTLOOK_REDIRECT_URI,
        "response_mode": "query",
        "scope": " ".join(OUTLOOK_SCOPES),
        "prompt": "consent",
    }
    url = f"{OUTLOOK_AUTH_BASE}?{urlencode(params)}"
    return {"auth_url": url}

@router.get("/outlook/callback")
async def outlook_callback(code: str, db: Session = Depends(get_db)):
    data = {
        "client_id": settings.OUTLOOK_CLIENT_ID,
        "client_secret": settings.OUTLOOK_CLIENT_SECRET,
        "code": code,
        "redirect_uri": settings.OUTLOOK_REDIRECT_URI,
        "grant_type": "authorization_code",
        "scope": " ".join(OUTLOOK_SCOPES),
    }
    token_resp = requests.post(OUTLOOK_TOKEN_URL, data=data)
    if not token_resp.ok:
        raise HTTPException(status_code=400, detail="Failed to get Outlook tokens")
    tokens = token_resp.json()
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")
    expires_in = tokens.get("expires_in")
    # Get user info
    userinfo_resp = requests.get(
        "https://graph.microsoft.com/v1.0/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    if not userinfo_resp.ok:
        raise HTTPException(status_code=400, detail="Failed to get Outlook user info")
    userinfo = userinfo_resp.json()
    email = userinfo["userPrincipalName"]
    name = userinfo.get("displayName", email.split("@")[0])
    # Upsert user
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(email=email, name=name)
        db.add(user)
    user.outlook_access_token = access_token
    user.outlook_refresh_token = refresh_token
    user.outlook_token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
    db.commit()
    db.refresh(user)
    app_token = create_access_token({"sub": user.id})
    return {"access_token": app_token, "user_id": user.id, "email": user.email, "name": user.name}

@router.post("/login", response_model=TokenResponse)
async def login(email: str, db: Session = Depends(get_db)):
    """Simple login for development (create user if doesn't exist)"""
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(
                email=email,
                name=email.split("@")[0]
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        access_token = create_access_token(data={"sub": user.id})
        return TokenResponse(
            access_token=access_token,
            user_id=user.id,
            email=user.email,
            name=user.name
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "avatar_url": current_user.avatar_url,
        "timezone": current_user.timezone,
        "language": current_user.language
    } 