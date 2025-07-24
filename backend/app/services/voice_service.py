import openai
import os
import tempfile
from typing import Optional, Tuple
import whisper
from gtts import gTTS
import io

from app.core.config import settings

class VoiceService:
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        self.whisper_model = whisper.load_model(settings.WHISPER_MODEL)
    
    async def speech_to_text(self, audio_file_path: str) -> str:
        """Convert speech to text using Whisper"""
        try:
            # Load and transcribe audio
            result = self.whisper_model.transcribe(audio_file_path)
            return result["text"].strip()
        except Exception as e:
            raise Exception(f"Speech-to-text failed: {str(e)}")
    
    async def text_to_speech(self, text: str, language: str = "en") -> bytes:
        """Convert text to speech using gTTS"""
        try:
            # Create temporary file for audio
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
                # Generate speech
                tts = gTTS(text=text, lang=language, slow=False)
                tts.save(temp_file.name)
                
                # Read the audio file
                with open(temp_file.name, "rb") as audio_file:
                    audio_data = audio_file.read()
                
                # Clean up temporary file
                os.unlink(temp_file.name)
                
                return audio_data
        except Exception as e:
            raise Exception(f"Text-to-speech failed: {str(e)}")
    
    async def transcribe_audio_file(self, audio_data: bytes) -> str:
        """Transcribe audio data from bytes"""
        try:
            # Save audio data to temporary file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
                temp_file.write(audio_data)
                temp_file_path = temp_file.name
            
            # Transcribe
            result = await self.speech_to_text(temp_file_path)
            
            # Clean up
            os.unlink(temp_file_path)
            
            return result
        except Exception as e:
            raise Exception(f"Audio transcription failed: {str(e)}")
    
    def get_supported_languages(self) -> list:
        """Get list of supported languages for TTS"""
        return [
            {"code": "en", "name": "English"},
            {"code": "es", "name": "Spanish"},
            {"code": "fr", "name": "French"},
            {"code": "de", "name": "German"},
            {"code": "it", "name": "Italian"},
            {"code": "pt", "name": "Portuguese"},
            {"code": "ru", "name": "Russian"},
            {"code": "ja", "name": "Japanese"},
            {"code": "ko", "name": "Korean"},
            {"code": "zh", "name": "Chinese"}
        ] 