import React, { useEffect, useRef } from 'react'
import { useChat } from '../hooks/useChat'

const ChatThread = () => {
  const { messages, loading, error, streaming } = useChat()
  const endRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const userScrolledUp = useRef(false)

  // Detect if user scrolled up
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const handleScroll = () => {
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 40
      userScrolledUp.current = !atBottom
    }
    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-scroll to bottom on new message/stream unless user scrolled up
  useEffect(() => {
    if (!userScrolledUp.current && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, streaming])

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-6">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center mb-6">
            <span className="text-4xl">🤖</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome to AI Assistant</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            I'm here to help you with tasks, answer questions, and make your day more productive. 
            Start by asking me anything!
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
            <button className="card card-interactive p-4 text-left">
              <div className="text-2xl mb-2">📋</div>
              <h4 className="font-medium text-gray-900">Create a task</h4>
              <p className="text-sm text-gray-600">"Remind me to call John tomorrow"</p>
            </button>
            <button className="card card-interactive p-4 text-left">
              <div className="text-2xl mb-2">📅</div>
              <h4 className="font-medium text-gray-900">Schedule meeting</h4>
              <p className="text-sm text-gray-600">"Schedule team meeting for Friday"</p>
            </button>
            <button className="card card-interactive p-4 text-left">
              <div className="text-2xl mb-2">📧</div>
              <h4 className="font-medium text-gray-900">Draft email</h4>
              <p className="text-sm text-gray-600">"Write a follow-up email to client"</p>
            </button>
            <button className="card card-interactive p-4 text-left">
              <div className="text-2xl mb-2">🔍</div>
              <h4 className="font-medium text-gray-900">Search files</h4>
              <p className="text-sm text-gray-600">"Find the project proposal document"</p>
            </button>
          </div>
        </div>
      )}
      
      {messages.map((msg, index) => (
        <div 
          key={msg.id} 
          className={`flex animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {msg.role === 'assistant' && (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center mr-3 shadow-lg">
              <span className="text-white font-bold text-lg">🤖</span>
            </div>
          )}
          <div className={`max-w-[75%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
            <div className={`
              p-4 rounded-2xl shadow-sm relative overflow-hidden
              ${msg.role === 'user' 
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white' 
                : 'bg-white border border-gray-200 text-gray-900'
              }
            `}>
              {/* Message content */}
              <div className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</div>
              
              {/* Timestamp */}
              <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-primary-100' : 'text-gray-400'}`}>
                {new Date(msg.created_at).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200"></div>
            </div>
          </div>
          {msg.role === 'user' && (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-secondary-500 to-secondary-600 flex items-center justify-center ml-3 shadow-lg order-1">
              <span className="text-white font-bold text-lg">🧑</span>
            </div>
          )}
        </div>
      ))}
      
      {(loading || streaming) && (
        <div className="flex items-center space-x-3 animate-pulse">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">🤖</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
              <span className="text-sm text-gray-600">AI is thinking...</span>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-r from-error-500 to-error-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">⚠️</span>
          </div>
          <div className="bg-error-50 border border-error-200 rounded-2xl p-4 shadow-sm">
            <div className="text-sm text-error-700">{error}</div>
            <button className="text-xs text-error-600 hover:text-error-800 mt-2 font-medium">
              Try again
            </button>
          </div>
        </div>
      )}
      
      <div ref={endRef} />
    </div>
  )
}

export default ChatThread 