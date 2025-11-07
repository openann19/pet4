/**
 * Utility functions for handling LLM operations and errors
 */

import { createLogger } from './logger'

export interface LLMErrorInfo {
  isBudgetLimit: boolean
  isRateLimit: boolean
  isNetworkError: boolean
  userMessage: string
  technicalMessage: string
}

/**
 * Parse LLM error and provide user-friendly messaging
 */
export function parseLLMError(error: unknown): LLMErrorInfo {
  const errorMessage = (error instanceof Error ? error.message : (typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : String(error)))
  const errorString = errorMessage.toLowerCase()

  // Check for budget limit errors
  if (errorString.includes('budget limit') || errorString.includes('quota exceeded')) {
    return {
      isBudgetLimit: true,
      isRateLimit: false,
      isNetworkError: false,
      userMessage: 'AI features are temporarily unavailable due to usage limits. Using fallback data instead.',
      technicalMessage: 'LLM budget limit reached: ' + errorMessage
    }
  }

  // Check for rate limit errors
  if (errorString.includes('rate limit') || errorString.includes('429')) {
    return {
      isBudgetLimit: false,
      isRateLimit: true,
      isNetworkError: false,
      userMessage: 'AI service is temporarily busy. Please try again in a moment.',
      technicalMessage: 'LLM rate limit hit: ' + errorMessage
    }
  }

  // Check for network errors
  if (errorString.includes('network') || errorString.includes('fetch') || errorString.includes('timeout')) {
    return {
      isBudgetLimit: false,
      isRateLimit: false,
      isNetworkError: true,
      userMessage: 'Unable to connect to AI service. Using fallback data instead.',
      technicalMessage: 'LLM network error: ' + errorMessage
    }
  }

  // Generic error
  return {
    isBudgetLimit: false,
    isRateLimit: false,
    isNetworkError: false,
    userMessage: 'AI service temporarily unavailable. Using fallback data instead.',
    technicalMessage: 'LLM error: ' + errorMessage
  }
}

/**
 * Wrapper for LLM calls with consistent error handling
 */
export async function callLLM(
  prompt: string,
  modelName: string = 'gpt-4o',
  jsonMode: boolean = false
): Promise<{ success: boolean; data?: string; error?: LLMErrorInfo }> {
  try {
    const { llmService } = await import('./llm-service')
    const result = await llmService.llm(prompt, modelName, jsonMode)
    return { success: true, data: result }
  } catch (error) {
    const errorInfo = parseLLMError(error)
    const logger = createLogger('llm-utils')
    logger.error('LLM call failed', error instanceof Error ? error : new Error(String(error)), { technicalMessage: errorInfo.technicalMessage })
    return { success: false, error: errorInfo }
  }
}
