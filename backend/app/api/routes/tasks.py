from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from enum import Enum

from app.core.database import get_db
from app.models.task import Task, TaskPriority, TaskStatus
from app.models.user import User
from app.api.dependencies import get_current_user

router = APIRouter()

class TaskPriorityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"

class TaskStatusEnum(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    CANCELLED = "cancelled"

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TaskPriorityEnum = TaskPriorityEnum.MEDIUM
    due_date: Optional[datetime] = None
    reminder_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[TaskPriorityEnum] = None
    status: Optional[TaskStatusEnum] = None
    due_date: Optional[datetime] = None
    reminder_date: Optional[datetime] = None

class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    priority: TaskPriorityEnum
    status: TaskStatusEnum
    due_date: Optional[datetime]
    reminder_date: Optional[datetime]
    completed_at: Optional[datetime]
    linked_email_id: Optional[str]
    ai_suggested: bool
    ai_confidence: int
    created_at: datetime
    updated_at: Optional[datetime]

@router.post("/", response_model=TaskResponse)
async def create_task(
    task_data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new task"""
    try:
        task = Task(
            user_id=current_user.id,
            title=task_data.title,
            description=task_data.description,
            priority=TaskPriority(task_data.priority.value),
            due_date=task_data.due_date,
            reminder_date=task_data.reminder_date
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        
        return TaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            priority=TaskPriorityEnum(task.priority.value),
            status=TaskStatusEnum(task.status.value),
            due_date=task.due_date,
            reminder_date=task.reminder_date,
            completed_at=task.completed_at,
            linked_email_id=task.linked_email_id,
            ai_suggested=task.ai_suggested,
            ai_confidence=task.ai_confidence,
            created_at=task.created_at,
            updated_at=task.updated_at
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating task: {str(e)}")

@router.get("/", response_model=List[TaskResponse])
async def get_tasks(
    status: Optional[TaskStatusEnum] = Query(None),
    priority: Optional[TaskPriorityEnum] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get tasks with optional filtering"""
    query = db.query(Task).filter(Task.user_id == current_user.id)
    
    if status:
        query = query.filter(Task.status == TaskStatus(status.value))
    if priority:
        query = query.filter(Task.priority == TaskPriority(priority.value))
    
    tasks = query.order_by(Task.created_at.desc()).offset(offset).limit(limit).all()
    
    return [
        TaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            priority=TaskPriorityEnum(task.priority.value),
            status=TaskStatusEnum(task.status.value),
            due_date=task.due_date,
            reminder_date=task.reminder_date,
            completed_at=task.completed_at,
            linked_email_id=task.linked_email_id,
            ai_suggested=task.ai_suggested,
            ai_confidence=task.ai_confidence,
            created_at=task.created_at,
            updated_at=task.updated_at
        ) for task in tasks
    ]

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific task"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return TaskResponse(
        id=task.id,
        title=task.title,
        description=task.description,
        priority=TaskPriorityEnum(task.priority.value),
        status=TaskStatusEnum(task.status.value),
        due_date=task.due_date,
        reminder_date=task.reminder_date,
        completed_at=task.completed_at,
        linked_email_id=task.linked_email_id,
        ai_suggested=task.ai_suggested,
        ai_confidence=task.ai_confidence,
        created_at=task.created_at,
        updated_at=task.updated_at
    )

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    task_data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a task"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    try:
        # Update fields
        if task_data.title is not None:
            task.title = task_data.title
        if task_data.description is not None:
            task.description = task_data.description
        if task_data.priority is not None:
            task.priority = TaskPriority(task_data.priority.value)
        if task_data.status is not None:
            task.status = TaskStatus(task_data.status.value)
            if task_data.status == TaskStatusEnum.DONE and not task.completed_at:
                task.completed_at = datetime.utcnow()
        if task_data.due_date is not None:
            task.due_date = task_data.due_date
        if task_data.reminder_date is not None:
            task.reminder_date = task_data.reminder_date
        
        db.commit()
        db.refresh(task)
        
        return TaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            priority=TaskPriorityEnum(task.priority.value),
            status=TaskStatusEnum(task.status.value),
            due_date=task.due_date,
            reminder_date=task.reminder_date,
            completed_at=task.completed_at,
            linked_email_id=task.linked_email_id,
            ai_suggested=task.ai_suggested,
            ai_confidence=task.ai_confidence,
            created_at=task.created_at,
            updated_at=task.updated_at
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating task: {str(e)}")

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a task"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    try:
        db.delete(task)
        db.commit()
        return {"message": "Task deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error deleting task: {str(e)}")

@router.post("/{task_id}/complete")
async def complete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a task as completed"""
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id
    ).first()
    
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    try:
        task.status = TaskStatus.DONE
        task.completed_at = datetime.utcnow()
        db.commit()
        return {"message": "Task marked as completed"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error completing task: {str(e)}") 