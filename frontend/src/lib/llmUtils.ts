import { api } from './api'

export async function refineMessageWithLLM(message: string): Promise<string> {
  // Call backend LLM (Ollama/OpenAI) via chat API
  const res = await api.post('/chat/send', { message })
  return res.data.content || message
}

export async function decideIntegrations(refinedMessage: string): Promise<string[]> {
  // Placeholder: Decide integrations based on keywords
  const integrations = []
  if (/email/i.test(refinedMessage)) integrations.push('email')
  if (/calendar|meeting|event/i.test(refinedMessage)) integrations.push('calendar')
  return integrations
}

export async function draftResponse(refinedMessage: string, integrations?: string[]): Promise<string> {
  // Use backend LLM to draft a response
  const prompt = `Draft a response for the following action(s): ${integrations?.join(', ') || 'none'} for: "${refinedMessage}"`
  const res = await api.post('/chat/send', { message: prompt })
  return res.data.content || prompt
} 