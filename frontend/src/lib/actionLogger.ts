// actionLogger.ts
import { PipelineContext } from './smartPipeline'

const LOG_KEY = 'assistant_action_logs'

export async function logAction(context: PipelineContext): Promise<string> {
  const logs = JSON.parse(localStorage.getItem(LOG_KEY) || '[]')
  const logId = Date.now().toString()
  logs.push({ id: logId, ...context })
  localStorage.setItem(LOG_KEY, JSON.stringify(logs))
  return logId
}

export function getLogs(): any[] {
  return JSON.parse(localStorage.getItem(LOG_KEY) || '[]')
} 