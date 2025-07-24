import openai
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
import json
from datetime import datetime, timedelta
import requests
import aiohttp

from app.core.config import settings
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.email_message import EmailMessage
from app.models.calendar_event import CalendarEvent
from app.models.user import User

class AIService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.OPENAI_MODEL
        self.max_tokens = settings.OPENAI_MAX_TOKENS
        self.agent_base_url = "http://localhost:8000/api/agent"  # Assumes backend runs locally
    
    async def process_message(
        self, 
        user_message: str, 
        user_id: str, 
        db: Session
    ) -> Dict[str, Any]:
        # LLM-powered intent extraction
        intent, action, entities = await self._extract_intent_entities(user_message)
        if intent:
            # Route to correct tool/feature
            if intent == "file" or intent == "app":
                # Use previous file/app logic
                file_query = entities.get("file_name") or entities.get("app_name") or user_message
                file_action = action
                search_resp = requests.post(f"{self.agent_base_url}/search_file", json={"query": file_query})
                if search_resp.ok:
                    matches = search_resp.json().get("matches", [])
                    if not matches:
                        return {"content": f"I couldn't find any file or app matching '{file_query}'."}
                    best = matches[0]
                    if file_action == "open":
                        open_resp = requests.post(f"{self.agent_base_url}/open", json={"query": best["name"]})
                        if open_resp.ok and open_resp.json().get("status") == "opened":
                            return {"content": f"I found and opened '{best['name']}' (last updated {best['last_modified']})."}
                        else:
                            return {"content": f"I found '{best['name']}', but couldn't open it. {open_resp.json().get('message', '')}"}
                    elif file_action == "last_updated":
                        return {"content": f"The file '{best['name']}' was last updated on {best['last_modified']}."}
                    else:
                        return {"content": f"I found '{best['name']}' at {best['path']} (last updated {best['last_modified']})."}
                else:
                    return {"content": "Sorry, I couldn't search for files right now."}
            if intent == "task":
                if action == "create":
                    resp = requests.post("http://localhost:8000/api/tasks", json=entities, headers={"Authorization": f"Bearer {settings.SECRET_KEY}"})
                    if resp.ok:
                        return {"content": f"Task created: {entities.get('title')}"}
                    else:
                        return {"content": "Sorry, I couldn't create the task."}
                elif action == "list":
                    resp = requests.get("http://localhost:8000/api/tasks", headers={"Authorization": f"Bearer {settings.SECRET_KEY}"})
                    if resp.ok:
                        tasks = resp.json()
                        if not tasks:
                            return {"content": "You have no tasks."}
                        summary = "\n".join([f"- {t['title']} (due {t['due_date']})" for t in tasks])
                        return {"content": f"Here are your tasks:\n{summary}"}
                    else:
                        return {"content": "Sorry, I couldn't fetch your tasks."}
            if intent == "calendar":
                if action == "create":
                    resp = requests.post("http://localhost:8000/api/calendar", json=entities, headers={"Authorization": f"Bearer {settings.SECRET_KEY}"})
                    if resp.ok:
                        return {"content": f"Event created: {entities.get('title')}"}
                    else:
                        return {"content": "Sorry, I couldn't create the event."}
                elif action == "list":
                    resp = requests.get("http://localhost:8000/api/calendar", headers={"Authorization": f"Bearer {settings.SECRET_KEY}"})
                    if resp.ok:
                        events = resp.json().get("events", [])
                        if not events:
                            return {"content": "You have no upcoming events."}
                        summary = "\n".join([f"- {e['title']} ({e['start_time']})" for e in events])
                        return {"content": f"Here are your upcoming events:\n{summary}"}
                    else:
                        return {"content": "Sorry, I couldn't fetch your events."}
            if intent == "email":
                if action == "list":
                    resp = requests.get("http://localhost:8000/api/email", headers={"Authorization": f"Bearer {settings.SECRET_KEY}"})
                    if resp.ok:
                        emails = resp.json().get("emails", [])
                        if not emails:
                            return {"content": "You have no recent emails."}
                        summary = "\n".join([f"- {e['subject']} from {e['sender']}" for e in emails])
                        return {"content": f"Here are your recent emails:\n{summary}"}
                    else:
                        return {"content": "Sorry, I couldn't fetch your emails."}
            if intent == "web":
                if action == "search":
                    resp = requests.get(f"http://localhost:8000/api/search?q={entities.get('query')}")
                    if resp.ok:
                        results = resp.json().get("results", [])
                        if not results:
                            return {"content": "No web results found."}
                        summary = "\n".join([f"- {r['title']}: {r['snippet']}" for r in results])
                        return {"content": f"Here are some web results:\n{summary}"}
                    else:
                        return {"content": "Sorry, I couldn't search the web right now."}
        # Fallback to classic LLM chat
        system_prompt = self._build_system_prompt(user, recent_tasks, recent_emails, upcoming_events)
        
        # Get AI response
        response = await self._get_ai_response(system_prompt, user_message)
        
        # Parse response for actions
        actions = self._parse_actions(response)
        
        # Execute actions
        result = await self._execute_actions(actions, user_id, db)
        
        return {
            "content": response,
            "tokens_used": 0,  # TODO: Track token usage
            "model_used": self.model,
            **result
        }
    
    def _build_system_prompt(
        self, 
        user: User, 
        tasks: List[Task], 
        emails: List[EmailMessage], 
        events: List[CalendarEvent]
    ) -> str:
        """Build system prompt with user context"""
        
        prompt = f"""You are an AI assistant for {user.name}. You help with tasks, emails, and calendar management.

Current Context:
- User: {user.name} ({user.email})
- Timezone: {user.timezone}

Recent Tasks ({len(tasks)}):
"""
        
        for task in tasks[:5]:  # Show last 5 tasks
            prompt += f"- {task.title} ({task.priority.value}, {task.status.value})\n"
        
        prompt += f"\nRecent Emails ({len(emails)}):\n"
        for email in emails[:3]:  # Show last 3 emails
            prompt += f"- {email.subject} from {email.sender}\n"
        
        prompt += f"\nUpcoming Events ({len(events)}):\n"
        for event in events[:3]:  # Show next 3 events
            prompt += f"- {event.title} at {event.start_time}\n"
        
        prompt += """

You can:
1. Create tasks with priority (low/medium/high/urgent)
2. Suggest email replies
3. Schedule calendar events
4. Provide helpful information and reminders

Respond naturally and suggest actions when appropriate. Use JSON format for actions:
{
  "actions": [
    {
      "type": "create_task",
      "title": "Task title",
      "priority": "medium",
      "description": "Task description"
    }
  ]
}
"""
        return prompt
    
    async def _get_ai_response(self, system_prompt: str, user_message: str) -> str:
        """Get response from OpenAI or Ollama based on config"""
        if getattr(settings, 'LLM_PROVIDER', 'openai') == 'ollama':
            return await self._get_ollama_response(system_prompt, user_message)
        else:
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message}
                    ],
                    max_tokens=self.max_tokens,
                    temperature=0.7
                )
                return response.choices[0].message.content
            except Exception as e:
                return f"I'm sorry, I encountered an error: {str(e)}"

    async def _get_ollama_response(self, system_prompt: str, user_message: str) -> str:
        """Call local Ollama API for a response"""
        prompt = f"{system_prompt}\nUser: {user_message}\nAssistant:"
        payload = {
            "model": "llama2",  # Change to your preferred Ollama model
            "prompt": prompt,
            "stream": False
        }
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post("http://localhost:11434/api/generate", json=payload) as resp:
                    data = await resp.json()
                    return data.get("response", "[No response from Ollama]")
        except Exception as e:
            return f"[Ollama error: {str(e)}]"
    
    def _parse_actions(self, response: str) -> List[Dict[str, Any]]:
        """Parse actions from AI response"""
        try:
            # Look for JSON in the response
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end != 0:
                json_str = response[start:end]
                data = json.loads(json_str)
                return data.get("actions", [])
        except:
            pass
        return []
    
    async def _execute_actions(
        self, 
        actions: List[Dict[str, Any]], 
        user_id: str, 
        db: Session
    ) -> Dict[str, Any]:
        """Execute parsed actions"""
        result = {}
        
        for action in actions:
            action_type = action.get("type")
            
            if action_type == "create_task":
                task = Task(
                    user_id=user_id,
                    title=action["title"],
                    description=action.get("description", ""),
                    priority=TaskPriority(action.get("priority", "medium")),
                    ai_suggested=True,
                    ai_confidence=80
                )
                db.add(task)
                db.commit()
                result["related_task_id"] = task.id
            
            elif action_type == "schedule_event":
                event = CalendarEvent(
                    user_id=user_id,
                    title=action["title"],
                    description=action.get("description", ""),
                    start_time=datetime.fromisoformat(action["start_time"]),
                    end_time=datetime.fromisoformat(action["end_time"]),
                    ai_suggested=True
                )
                db.add(event)
                db.commit()
                result["related_event_id"] = event.id
        
        return result
    
    def _get_recent_tasks(self, db: Session, user_id: str) -> List[Task]:
        """Get recent tasks for user"""
        return db.query(Task).filter(
            Task.user_id == user_id
        ).order_by(Task.created_at.desc()).limit(10).all()
    
    def _get_recent_emails(self, db: Session, user_id: str) -> List[EmailMessage]:
        """Get recent emails for user"""
        return db.query(EmailMessage).filter(
            EmailMessage.user_id == user_id
        ).order_by(EmailMessage.received_at.desc()).limit(10).all()
    
    def _get_upcoming_events(self, db: Session, user_id: str) -> List[CalendarEvent]:
        """Get upcoming calendar events for user"""
        now = datetime.utcnow()
        return db.query(CalendarEvent).filter(
            CalendarEvent.user_id == user_id,
            CalendarEvent.start_time >= now
        ).order_by(CalendarEvent.start_time).limit(10).all()
    
    async def suggest_email_reply(self, email_content: str) -> str:
        """Suggest a reply for an email"""
        prompt = f"""You are a helpful email assistant. Suggest a professional and concise reply to this email:

Email content:
{email_content}

Provide a suggested reply that is:
- Professional and courteous
- Concise but complete
- Appropriate for the context
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"I'm sorry, I couldn't generate a reply: {str(e)}"
    
    async def summarize_email(self, email_content: str) -> str:
        """Summarize email content"""
        prompt = f"""Summarize this email in 2-3 sentences, highlighting the key points and any required actions:

Email content:
{email_content}
"""
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.3
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Unable to summarize: {str(e)}" 

    def _detect_file_intent(self, user_message: str):
        """Detect if the user wants to open/find/get info about a file/app."""
        msg = user_message.lower()
        # Simple rules, can be improved with LLM
        if any(x in msg for x in ["open", "launch", "start"]):
            # e.g., "open my resume", "launch notepad"
            for word in ["open", "launch", "start"]:
                if word in msg:
                    after = msg.split(word, 1)[1].strip()
                    return True, after, "open"
        if "last time" in msg and "update" in msg:
            # e.g., "when was the last time i updated my resume"
            after = msg.split("update", 1)[1].strip()
            return True, after, "last_updated"
        if any(x in msg for x in ["find", "locate", "where is"]):
            for word in ["find", "locate", "where is"]:
                if word in msg:
                    after = msg.split(word, 1)[1].strip()
                    return True, after, "find"
        return False, None, None 

    def _detect_task_intent(self, user_message: str):
        msg = user_message.lower()
        if any(x in msg for x in ["remind me", "create task", "add task"]):
            # Very basic extraction
            title = user_message
            due_date = None
            if "tomorrow" in msg:
                from datetime import datetime, timedelta
                due_date = (datetime.utcnow() + timedelta(days=1)).isoformat()
            return True, "create", {"title": title, "due_date": due_date}
        if any(x in msg for x in ["my tasks", "list tasks", "show tasks"]):
            return True, "list", None
        return False, None, None

    def _detect_calendar_intent(self, user_message: str):
        msg = user_message.lower()
        if any(x in msg for x in ["schedule", "add event", "create event"]):
            # Very basic extraction
            title = user_message
            start_time = None
            if "tomorrow" in msg:
                from datetime import datetime, timedelta
                start_time = (datetime.utcnow() + timedelta(days=1)).isoformat()
            return True, "create", {"title": title, "start_time": start_time, "end_time": start_time}
        if any(x in msg for x in ["my calendar", "list events", "show events"]):
            return True, "list", None
        return False, None, None

    def _detect_email_intent(self, user_message: str):
        msg = user_message.lower()
        if any(x in msg for x in ["my emails", "list emails", "show emails", "recent emails"]):
            return True, "list", None
        return False, None, None 

    async def _extract_intent_entities(self, user_message: str):
        """Use GPT-4 to extract intent, action, and entities from user message."""
        prompt = (
            "You are an AI assistant. For the following user message, extract the main intent (task, calendar, email, file, app, web, chat), "
            "the action (create, list, open, find, last_updated, search, summarize, etc.), and any relevant entities (title, date, file_name, app_name, query, etc.). "
            "Respond ONLY with a JSON object like: {\"intent\":..., \"action\":..., \"entities\":{...}}.\n"
            f"User: {user_message}"
        )
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "system", "content": prompt}],
                max_tokens=300,
                temperature=0.0
            )
            import json
            content = response.choices[0].message.content
            data = json.loads(content)
            return data.get("intent"), data.get("action"), data.get("entities", {})
        except Exception as e:
            return None, None, {} 