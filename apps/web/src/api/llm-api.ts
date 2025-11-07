/**
 * LLM API Service
 * 
 * Handles LLM calls through backend API.
 */

import { APIClient } from '@/lib/api-client'
import { createLogger } from '@/lib/logger'

const logger = createLogger('LLMAPI')

export interface LLMCallRequest {
  prompt: string | Record<string, unknown>
  model?: string
  jsonMode?: boolean
}

export interface LLMCallResponse {
  response: string
  model: string
  tokensUsed?: number
}

class LLMApiImpl {
  /**
   * POST /llm/chat
   * Call LLM with prompt
   */
  async call(
    prompt: string | Record<string, unknown>,
    model?: string,
    jsonMode?: boolean
  ): Promise<string> {
    try {
      const request: LLMCallRequest = {
        prompt,
        ...(model !== undefined && { model }),
        ...(jsonMode !== undefined && { jsonMode })
      }

      const response = await APIClient.post<LLMCallResponse>(
        '/llm/chat',
        request
      )
      return response.data.response
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to call LLM', err, {
        prompt: typeof prompt === 'string' ? prompt.substring(0, 100) : 'object',
        model
      })
      throw err
    }
  }
}

export const llmApi = new LLMApiImpl()

