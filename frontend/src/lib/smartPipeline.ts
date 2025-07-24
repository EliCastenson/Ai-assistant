// smartPipeline.ts
import { refineMessageWithLLM, decideIntegrations, draftResponse } from './llmUtils'
import { showConfirmationModal } from '../components/ConfirmActionModal'
import { executeIntegration } from './integrations'
import { logAction } from './actionLogger'

export interface PipelineContext {
  userMessage: string
  refinedMessage?: string
  integrations?: string[]
  draft?: string
  confirmationResult?: 'approved' | 'edited' | 'cancelled'
  actionResult?: any
  logId?: string
}

export async function runSmartPipeline(userMessage: string): Promise<PipelineContext> {
  const context: PipelineContext = { userMessage }
  // Step 1: Refine message
  context.refinedMessage = await refineMessageWithLLM(userMessage)
  // Step 2: Decide integrations
  context.integrations = await decideIntegrations(context.refinedMessage)
  // Step 3: Draft response
  context.draft = await draftResponse(context.refinedMessage, context.integrations)
  // Step 4: Show confirmation UI
  context.confirmationResult = await showConfirmationModal(context.draft)
  // Step 5: If approved, execute action
  if (context.confirmationResult === 'approved') {
    context.actionResult = await executeIntegration(context.draft, context.integrations)
  }
  // Step 6: Log everything
  context.logId = await logAction(context)
  return context
} 