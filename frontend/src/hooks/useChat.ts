import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  message_type: string
  content: string
  created_at: string
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streaming, setStreaming] = useState(false)

  // Fetch chat history on mount
  useEffect(() => {
    api.get('/api/chat/history')
      .then(res => setMessages(res.data.messages))
      .catch(() => setError('Failed to load chat history.'))
  }, [])

  // Simulate streaming AI response
  const streamAIResponse = async (fullMsg: ChatMessage) => {
    setStreaming(true)
    const words = fullMsg.content.split(' ')
    let streamed = ''
    for (let i = 0; i < words.length; i++) {
      streamed += (i === 0 ? '' : ' ') + words[i]
      setMessages(msgs => [
        ...msgs.slice(0, -1),
        { ...fullMsg, content: streamed }
      ])
      await sleep(30 + Math.random() * 40)
    }
    setStreaming(false)
  }

  // Send a message
  const sendMessage = useCallback(async (message: string) => {
    setLoading(true)
    setError(null)
    try {
      // Optimistically add user message
      const userMsg: ChatMessage = {
        id: Math.random().toString(36).slice(2),
        role: 'user',
        message_type: 'text',
        content: message,
        created_at: new Date().toISOString(),
      }
      setMessages(msgs => [...msgs, userMsg])
      // Send to backend
      const res = await api.post('/api/chat/send', { message })
      const aiMsg: ChatMessage = { ...res.data, role: 'assistant' }
      setMessages(msgs => [...msgs, { ...aiMsg, content: '' }])
      await streamAIResponse(aiMsg)
    } catch (e) {
      setError('Failed to send message.')
    } finally {
      setLoading(false)
    }
  }, [])

  return { messages, loading, error, sendMessage, streaming }
} 