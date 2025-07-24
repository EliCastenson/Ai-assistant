from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import requests
from app.core.database import get_db
from app.models.calendar_event import CalendarEvent
from app.models.user import User
from app.api.dependencies import get_current_user
from app.core.config import settings
import logging

router = APIRouter()

class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: datetime
    end_time: datetime
    all_day: bool = False

class CalendarEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = None

class CalendarEventResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    location: Optional[str]
    start_time: datetime
    end_time: datetime
    all_day: bool
    google_event_id: Optional[str]
    calendar_id: Optional[str]
    attendees: Optional[str]
    ai_suggested: bool
    ai_notes: Optional[str]
    created_at: datetime
    updated_at: Optional[datetime]

class CalendarEventsResponse(BaseModel):
    events: List[CalendarEventResponse]
    total: int
    limit: int
    offset: int
    has_more: bool

@router.get("/", response_model=CalendarEventsResponse)
async def get_calendar_events(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get calendar events with pagination and optional date filtering"""
    query = db.query(CalendarEvent).filter(CalendarEvent.user_id == current_user.id)
    
    if start_date:
        query = query.filter(CalendarEvent.start_time >= start_date)
    if end_date:
        query = query.filter(CalendarEvent.end_time <= end_date)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    events = query.order_by(CalendarEvent.start_time).offset(offset).limit(limit).all()
    
    return CalendarEventsResponse(
        events=[
            CalendarEventResponse(
                id=event.id,
                title=event.title,
                description=event.description,
                location=event.location,
                start_time=event.start_time,
                end_time=event.end_time,
                all_day=event.all_day,
                google_event_id=event.google_event_id,
                calendar_id=event.calendar_id,
                attendees=event.attendees,
                ai_suggested=event.ai_suggested,
                ai_notes=event.ai_notes,
                created_at=event.created_at,
                updated_at=event.updated_at
            ) for event in events
        ],
        total=total,
        limit=limit,
        offset=offset,
        has_more=offset + limit < total
    )

@router.post("/", response_model=CalendarEventResponse)
async def create_calendar_event(
    event_data: CalendarEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new calendar event"""
    try:
        event = CalendarEvent(
            user_id=current_user.id,
            title=event_data.title,
            description=event_data.description,
            location=event_data.location,
            start_time=event_data.start_time,
            end_time=event_data.end_time,
            all_day=event_data.all_day
        )
        db.add(event)
        db.commit()
        db.refresh(event)
        
        return CalendarEventResponse(
            id=event.id,
            title=event.title,
            description=event.description,
            location=event.location,
            start_time=event.start_time,
            end_time=event.end_time,
            all_day=event.all_day,
            google_event_id=event.google_event_id,
            calendar_id=event.calendar_id,
            attendees=event.attendees,
            ai_suggested=event.ai_suggested,
            ai_notes=event.ai_notes,
            created_at=event.created_at,
            updated_at=event.updated_at
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating event: {str(e)}")

def refresh_google_token(user: User, db):
    if not user.google_refresh_token:
        return False
    data = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "client_secret": settings.GOOGLE_CLIENT_SECRET,
        "refresh_token": user.google_refresh_token,
        "grant_type": "refresh_token",
    }
    resp = requests.post("https://oauth2.googleapis.com/token", data=data)
    if resp.ok:
        tokens = resp.json()
        user.update_google_token(tokens["access_token"], tokens["expires_in"])
        db.commit()
        return True
    logging.error(f"Failed to refresh Google token: {resp.text}")
    return False

def refresh_outlook_token(user: User, db):
    if not user.outlook_refresh_token:
        return False
    data = {
        "client_id": settings.OUTLOOK_CLIENT_ID,
        "client_secret": settings.OUTLOOK_CLIENT_SECRET,
        "refresh_token": user.outlook_refresh_token,
        "grant_type": "refresh_token",
        "scope": "https://graph.microsoft.com/.default offline_access",
    }
    resp = requests.post("https://login.microsoftonline.com/common/oauth2/v2.0/token", data=data)
    if resp.ok:
        tokens = resp.json()
        user.update_outlook_token(tokens["access_token"], tokens["expires_in"])
        db.commit()
        return True
    logging.error(f"Failed to refresh Outlook token: {resp.text}")
    return False

@router.get("/sync")
async def sync_calendar(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    results = {}
    # Google Calendar
    if current_user.google_access_token:
        if current_user.is_google_token_expired():
            refresh_google_token(current_user, db)
        try:
            headers = {"Authorization": f"Bearer {current_user.google_access_token}"}
            resp = requests.get("https://www.googleapis.com/calendar/v3/calendars/primary/events", headers=headers)
            if resp.status_code == 401:
                if refresh_google_token(current_user, db):
                    headers = {"Authorization": f"Bearer {current_user.google_access_token}"}
                    resp = requests.get("https://www.googleapis.com/calendar/v3/calendars/primary/events", headers=headers)
            if resp.ok:
                events = resp.json().get("items", [])
                for event in events:
                    start = event.get("start", {}).get("dateTime") or event.get("start", {}).get("date")
                    end = event.get("end", {}).get("dateTime") or event.get("end", {}).get("date")
                    if not start or not end:
                        continue
                    ce = db.query(CalendarEvent).filter_by(google_event_id=event["id"]).first()
                    if not ce:
                        ce = CalendarEvent(user_id=current_user.id, google_event_id=event["id"])
                        db.add(ce)
                    ce.title = event.get("summary", "(No Title)")
                    ce.description = event.get("description")
                    ce.location = event.get("location")
                    ce.start_time = start
                    ce.end_time = end
                    ce.all_day = "date" in event.get("start", {})
                    ce.calendar_id = event.get("organizer", {}).get("email")
                    ce.attendees = str(event.get("attendees"))
                    ce.updated_at = datetime.utcnow()
                db.commit()
                results["google"] = len(events)
            else:
                results["google_error"] = resp.text
        except Exception as e:
            db.rollback()
            logging.error(f"Google Calendar sync error: {e}")
            results["google_error"] = str(e)
    # Outlook Calendar
    if current_user.outlook_access_token:
        if current_user.is_outlook_token_expired():
            refresh_outlook_token(current_user, db)
        try:
            headers = {"Authorization": f"Bearer {current_user.outlook_access_token}"}
            resp = requests.get("https://graph.microsoft.com/v1.0/me/events", headers=headers)
            if resp.status_code == 401:
                if refresh_outlook_token(current_user, db):
                    headers = {"Authorization": f"Bearer {current_user.outlook_access_token}"}
                    resp = requests.get("https://graph.microsoft.com/v1.0/me/events", headers=headers)
            if resp.ok:
                events = resp.json().get("value", [])
                for event in events:
                    start = event.get("start", {}).get("dateTime")
                    end = event.get("end", {}).get("dateTime")
                    if not start or not end:
                        continue
                    ce = db.query(CalendarEvent).filter_by(google_event_id=event["id"]).first()
                    if not ce:
                        ce = CalendarEvent(user_id=current_user.id, google_event_id=event["id"])
                        db.add(ce)
                    ce.title = event.get("subject", "(No Title)")
                    ce.description = event.get("bodyPreview")
                    ce.location = event.get("location", {}).get("displayName")
                    ce.start_time = start
                    ce.end_time = end
                    ce.all_day = event.get("isAllDay")
                    ce.calendar_id = event.get("organizer", {}).get("emailAddress", {}).get("address")
                    ce.attendees = str(event.get("attendees"))
                    ce.updated_at = datetime.utcnow()
                db.commit()
                results["outlook"] = len(events)
            else:
                results["outlook_error"] = resp.text
        except Exception as e:
            db.rollback()
            logging.error(f"Outlook Calendar sync error: {e}")
            results["outlook_error"] = str(e)
    return results 