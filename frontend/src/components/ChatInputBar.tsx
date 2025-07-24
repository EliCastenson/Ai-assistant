import React, { useState, useRef, useEffect } from 'react'
import { useChat } from '../hooks/useChat'

const ChatInputBar = () => {
  const { sendMessage, loading } = useChat()
  const [input, setInput] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [interimText, setInterimText] = useState('')
  const [recognitionError, setRecognitionError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Initialize speech recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setRecognitionError('Speech recognition not supported in this browser')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognition()
    
    const recognition = recognitionRef.current
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsRecording(true)
      setRecognitionError(null)
    }

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (finalTranscript) {
        setInput(prev => prev + finalTranscript)
        setInterimText('')
      }
      if (interimTranscript) {
        setInterimText(interimTranscript)
      }
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      setRecognitionError(`Speech recognition error: ${event.error}`)
      setIsRecording(false)
    }

    recognition.onend = () => {
      setIsRecording(false)
      setInterimText('')
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const handleSend = async () => {
    if (input.trim() && !loading) {
      await sendMessage(input)
      setInput('')
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleVoiceInput = () => {
    if (recognitionError) {
      alert(recognitionError)
      return
    }

    if (isRecording) {
      recognitionRef.current?.stop()
    } else {
      recognitionRef.current?.start()
    }
  }

  return (
    <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-end gap-3">
        {/* Voice input button */}
        <button
          className={`
            flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg
            ${isRecording 
              ? 'bg-gradient-to-r from-error-500 to-error-600 text-white animate-pulse shadow-error-500/50' 
              : 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white hover:from-secondary-600 hover:to-secondary-700 hover:scale-105'
            }
            ${loading || !!recognitionError ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-xl'}
          `}
          onClick={handleVoiceInput}
          title={isRecording ? 'Stop recording' : 'Voice input'}
          disabled={loading || !!recognitionError}
        >
          <span className="text-xl" role="img" aria-label={isRecording ? 'stop' : 'mic'}>
            {isRecording ? '⏹️' : '🎤'}
          </span>
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              className={`
                w-full px-4 py-3 pr-12 rounded-2xl border-2 transition-all duration-300 shadow-sm
                ${isRecording 
                  ? 'border-error-300 bg-error-50 focus:border-error-500' 
                  : 'border-gray-200 bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20'
                }
                ${loading || isRecording ? 'opacity-75 cursor-not-allowed' : ''}
              `}
              placeholder={isRecording ? "Listening..." : "Type a message or ask me anything..."}
              value={input + (interimText ? ` ${interimText}` : '')}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || isRecording}
            />
            
            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-gradient-to-r from-error-500 to-error-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg animate-pulse">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <span>Recording...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error indicator */}
            {recognitionError && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-error-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">⚠️</span>
              </div>
            )}
          </div>
          
          {/* Input suggestions */}
          {!input && !isRecording && (
            <div className="absolute -top-12 left-0 right-0 flex space-x-2">
              <button className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                "Schedule a meeting"
              </button>
              <button className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                "Create a task"
              </button>
              <button className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-50 transition-colors">
                "Search files"
              </button>
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          className={`
            flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg
            ${input.trim() && !loading && !isRecording
              ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 hover:scale-105 hover:shadow-xl'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }
          `}
          onClick={handleSend}
          disabled={!input.trim() || loading || isRecording}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Status messages */}
      {recognitionError && (
        <div className="mt-3 text-sm text-error-600 bg-error-50 border border-error-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span>⚠️</span>
            <span>{recognitionError}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatInputBar 