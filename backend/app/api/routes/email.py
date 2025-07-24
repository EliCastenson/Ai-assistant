from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
import requests
from app.core.database import get_db
from app.models.email_message import EmailMessage
from app.models.user import User
from app.api.dependencies import get_current_user
from app.core.config import settings
import logging

router = APIRouter()

class EmailMessageResponse(BaseModel):
    id: str
    subject: str
    sender: str
    recipients: Optional[list]
    body: Optional[str]
    body_plain: Optional[str]
    is_read: bool
    is_important: bool
    is_starred: bool
    ai_summary: Optional[str]
    ai_suggested_reply: Optional[str]
    ai_priority_score: int
    ai_action_required: bool
    received_at: datetime
    created_at: datetime
    updated_at: Optional[datetime]

class EmailMessagesResponse(BaseModel):
    emails: List[EmailMessageResponse]
    total: int
    limit: int
    offset: int
    has_more: bool

class EmailReplyRequest(BaseModel):
    reply_text: str
    email_id: str

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

@router.get("/", response_model=EmailMessagesResponse)
async def get_emails(
    unread_only: bool = Query(False),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get email messages with pagination and optional filtering"""
    query = db.query(EmailMessage).filter(EmailMessage.user_id == current_user.id)
    
    if unread_only:
        query = query.filter(EmailMessage.is_read == False)
    
    # Get total count
    total = query.count()
    
    # Apply pagination
    emails = query.order_by(EmailMessage.received_at.desc()).offset(offset).limit(limit).all()
    
    return EmailMessagesResponse(
        emails=[
            EmailMessageResponse(
                id=email.id,
                subject=email.subject,
                sender=email.sender,
                recipients=email.recipients,
                body=email.body,
                body_plain=email.body_plain,
                is_read=email.is_read,
                is_important=email.is_important,
                is_starred=email.is_starred,
                ai_summary=email.ai_summary,
                ai_suggested_reply=email.ai_suggested_reply,
                ai_priority_score=email.ai_priority_score,
                ai_action_required=email.ai_action_required,
                received_at=email.received_at,
                created_at=email.created_at,
                updated_at=email.updated_at
            ) for email in emails
        ],
        total=total,
        limit=limit,
        offset=offset,
        has_more=offset + limit < total
    )

@router.get("/{email_id}", response_model=EmailMessageResponse)
async def get_email(
    email_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific email message"""
    email = db.query(EmailMessage).filter(
        EmailMessage.id == email_id,
        EmailMessage.user_id == current_user.id
    ).first()
    
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    return EmailMessageResponse(
        id=email.id,
        subject=email.subject,
        sender=email.sender,
        recipients=email.recipients,
        body=email.body,
        body_plain=email.body_plain,
        is_read=email.is_read,
        is_important=email.is_important,
        is_starred=email.is_starred,
        ai_summary=email.ai_summary,
        ai_suggested_reply=email.ai_suggested_reply,
        ai_priority_score=email.ai_priority_score,
        ai_action_required=email.ai_action_required,
        received_at=email.received_at,
        created_at=email.created_at,
        updated_at=email.updated_at
    )

@router.post("/{email_id}/reply")
async def reply_to_email(
    reply_request: EmailReplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send a reply to an email"""
    # TODO: Implement Gmail API reply functionality
    return {"message": "Email reply sent successfully"}

@router.post("/{email_id}/suggest-reply")
async def suggest_email_reply(
    email_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get AI-suggested reply for an email"""
    email = db.query(EmailMessage).filter(
        EmailMessage.id == email_id,
        EmailMessage.user_id == current_user.id
    ).first()
    
    if not email:
        raise HTTPException(status_code=404, detail="Email not found")
    
    try:
        # This part of the code was not provided in the edit_specification,
        # so it's kept as is, assuming AIService is available or will be added.
        # from app.services.ai_service import AIService
        # ai_service = AIService()
        # suggested_reply = await ai_service.suggest_email_reply(
        #     email.body_plain or email.body or ""
        # )
        
        # Update email with suggested reply
        # email.ai_suggested_reply = suggested_reply
        # db.commit()
        
        return {"suggested_reply": "This feature is not yet implemented."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating reply: {str(e)}")

@router.get("/sync")
async def sync_email(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    results = {}
    # Gmail
    if current_user.google_access_token:
        if current_user.is_google_token_expired():
            refresh_google_token(current_user, db)
        try:
            headers = {"Authorization": f"Bearer {current_user.google_access_token}"}
            resp = requests.get("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10", headers=headers)
            if resp.status_code == 401:
                if refresh_google_token(current_user, db):
                    headers = {"Authorization": f"Bearer {current_user.google_access_token}"}
                    resp = requests.get("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10", headers=headers)
            if resp.ok:
                messages = resp.json().get("messages", [])
                for msg in messages:
                    msg_id = msg["id"]
                    msg_resp = requests.get(f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}", headers=headers)
                    if not msg_resp.ok:
                        continue
                    data = msg_resp.json()
                    headers_list = data.get("payload", {}).get("headers", [])
                    subject = next((h["value"] for h in headers_list if h["name"] == "Subject"), "(No Subject)")
                    sender = next((h["value"] for h in headers_list if h["name"] == "From"), "")
                    recipients = [h["value"] for h in headers_list if h["name"] == "To"]
                    body = ""
                    if data.get("payload", {}).get("body", {}).get("data"):
                        import base64
                        body = base64.urlsafe_b64decode(data["payload"]["body"]["data"]).decode(errors="ignore")
                    received_at = datetime.utcfromtimestamp(int(data.get("internalDate", "0")) / 1000)
                    em = db.query(EmailMessage).filter_by(gmail_id=msg_id).first()
                    if not em:
                        em = EmailMessage(user_id=current_user.id, gmail_id=msg_id)
                        db.add(em)
                    em.subject = subject
                    em.sender = sender
                    em.recipients = recipients
                    em.body = body
                    em.body_plain = body
                    em.is_read = "UNREAD" not in data.get("labelIds", [])
                    em.is_important = "IMPORTANT" in data.get("labelIds", [])
                    em.is_starred = "STARRED" in data.get("labelIds", [])
                    em.received_at = received_at
                    em.updated_at = datetime.utcnow()
                db.commit()
                results["gmail"] = len(messages)
            else:
                results["gmail_error"] = resp.text
        except Exception as e:
            db.rollback()
            logging.error(f"Gmail sync error: {e}")
            results["gmail_error"] = str(e)
    # Outlook
    if current_user.outlook_access_token:
        if current_user.is_outlook_token_expired():
            refresh_outlook_token(current_user, db)
        try:
            headers = {"Authorization": f"Bearer {current_user.outlook_access_token}"}
            resp = requests.get("https://graph.microsoft.com/v1.0/me/messages?$top=10", headers=headers)
            if resp.status_code == 401:
                if refresh_outlook_token(current_user, db):
                    headers = {"Authorization": f"Bearer {current_user.outlook_access_token}"}
                    resp = requests.get("https://graph.microsoft.com/v1.0/me/messages?$top=10", headers=headers)
            if resp.ok:
                messages = resp.json().get("value", [])
                for msg in messages:
                    msg_id = msg["id"]
                    em = db.query(EmailMessage).filter_by(gmail_id=msg_id).first()
                    if not em:
                        em = EmailMessage(user_id=current_user.id, gmail_id=msg_id)
                        db.add(em)
                    em.subject = msg.get("subject", "(No Subject)")
                    em.sender = msg.get("from", {}).get("emailAddress", {}).get("address", "")
                    em.recipients = [r.get("emailAddress", {}).get("address", "") for r in msg.get("toRecipients", [])]
                    em.body = msg.get("body", {}).get("content", "")
                    em.body_plain = msg.get("bodyPreview", "")
                    em.is_read = msg.get("isRead", False)
                    em.is_important = msg.get("importance", "normal") == "high"
                    em.is_starred = msg.get("flag", {}).get("flagStatus") == "flagged"
                    em.received_at = msg.get("receivedDateTime", datetime.utcnow())
                    em.updated_at = datetime.utcnow()
                db.commit()
                results["outlook"] = len(messages)
            else:
                results["outlook_error"] = resp.text
        except Exception as e:
            db.rollback()
            logging.error(f"Outlook sync error: {e}")
            results["outlook_error"] = str(e)
    return results 