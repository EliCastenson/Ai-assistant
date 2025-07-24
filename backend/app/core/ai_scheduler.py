from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.task import Task
from app.models.email_message import EmailMessage
from app.models.calendar_event import CalendarEvent
from app.models.suggestion import Suggestion
from app.services.ai_service import AIService
from datetime import datetime, timedelta
import logging
from app.core.config import settings
import smtplib
from email.mime.text import MIMEText

scheduler = BackgroundScheduler()

# This function will be run periodically
def ai_review_job():
    db: Session = SessionLocal()
    try:
        users = db.query(User).all()
        for user in users:
            # Gather user data
            tasks = db.query(Task).filter(Task.user_id == user.id).all()
            emails = db.query(EmailMessage).filter(EmailMessage.user_id == user.id).all()
            events = db.query(CalendarEvent).filter(CalendarEvent.user_id == user.id).all()
            # Use AI to generate suggestions
            ai = AIService()
            prompt = (
                f"You are a proactive assistant. Review the following data and suggest actionable reminders or nudges.\n"
                f"Tasks: {[t.title for t in tasks]}\n"
                f"Emails: {[e.subject for e in emails]}\n"
                f"Events: {[e.title for e in events]}\n"
                f"Now: {datetime.utcnow().isoformat()}\n"
                f"Output a JSON list of suggestions, each with type, message, and optionally related_task_id, related_email_id, or related_event_id."
            )
            try:
                response = ai.client.chat.completions.create(
                    model=ai.model,
                    messages=[{"role": "system", "content": prompt}],
                    max_tokens=500,
                    temperature=0.3
                )
                import json
                suggestions = json.loads(response.choices[0].message.content)
                for s in suggestions:
                    # Avoid duplicates (same message, unread)
                    exists = db.query(Suggestion).filter(
                        Suggestion.user_id == user.id,
                        Suggestion.message == s["message"],
                        Suggestion.is_read == False
                    ).first()
                    if not exists:
                        suggestion = Suggestion(
                            user_id=user.id,
                            type=s.get("type", "general"),
                            message=s["message"],
                            related_task_id=s.get("related_task_id"),
                            related_email_id=s.get("related_email_id"),
                            related_event_id=s.get("related_event_id")
                        )
                        db.add(suggestion)
                        db.commit()
                        send_notification(user, suggestion)
            except Exception as e:
                logging.error(f"AI suggestion generation failed for user {user.email}: {e}")
    finally:
        db.close()

# Schedule the job every 10 minutes
scheduler.add_job(ai_review_job, "interval", minutes=10)
scheduler.start()

def send_notification(user, suggestion):
    # In-app: just set is_notified (frontend will poll /api/suggestions)
    suggestion.is_notified = True
    # Email notification (optional)
    if getattr(settings, "EMAIL_NOTIFICATIONS_ENABLED", False) and user.email:
        try:
            msg = MIMEText(suggestion.message)
            msg['Subject'] = f"AI Assistant Suggestion: {suggestion.type}"
            msg['From'] = getattr(settings, "EMAIL_FROM", "no-reply@ai-assistant.local")
            msg['To'] = user.email
            with smtplib.SMTP(getattr(settings, "SMTP_HOST", "localhost"), getattr(settings, "SMTP_PORT", 25)) as s:
                if getattr(settings, "SMTP_USER", None) and getattr(settings, "SMTP_PASSWORD", None):
                    s.starttls()
                    s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                s.send_message(msg)
        except Exception as e:
            import logging
            logging.error(f"Failed to send email notification: {e}") 