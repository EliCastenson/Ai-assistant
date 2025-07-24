from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
import io

from app.core.database import get_db
from app.models.user import User
from app.api.dependencies import get_current_user
from app.services.voice_service import VoiceService

router = APIRouter()

class VoiceTranscriptionResponse(BaseModel):
    text: str
    confidence: float

@router.post("/transcribe", response_model=VoiceTranscriptionResponse)
async def transcribe_audio(
    audio_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Transcribe uploaded audio file to text"""
    try:
        # Validate file type
        if not audio_file.content_type.startswith("audio/"):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Read audio data
        audio_data = await audio_file.read()
        
        # Transcribe
        voice_service = VoiceService()
        text = await voice_service.transcribe_audio_file(audio_data)
        
        return VoiceTranscriptionResponse(
            text=text,
            confidence=0.95  # TODO: Get actual confidence from Whisper
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

@router.post("/synthesize")
async def synthesize_speech(
    text: str,
    language: str = "en",
    current_user: User = Depends(get_current_user)
):
    """Convert text to speech"""
    try:
        voice_service = VoiceService()
        audio_data = await voice_service.text_to_speech(text, language)
        
        return StreamingResponse(
            io.BytesIO(audio_data),
            media_type="audio/mpeg",
            headers={"Content-Disposition": "attachment; filename=speech.mp3"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis failed: {str(e)}")

@router.get("/languages")
async def get_supported_languages():
    """Get list of supported languages for TTS"""
    voice_service = VoiceService()
    return voice_service.get_supported_languages() 