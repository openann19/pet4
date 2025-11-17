/**
 * LLM Service
 *
 * Handles LLM calls through backend API.
 */

import { llmApi } from '@/api/llm-api';
import { createLogger } from './logger';

const logger = createLogger('LLMService');

export interface LLMOptions {
  model?: string;
  jsonMode?: boolean;
}

export type LLMPrompt = string | Record<string, unknown>;

class LLMService {
  /**
   * Call LLM with prompt
   */
  async llm(prompt: LLMPrompt, model?: string, jsonMode?: boolean): Promise<string> {
    try {
      return await llmApi.call(prompt, model, jsonMode);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('LLM call failed', err, {
        prompt: typeof prompt === 'string' ? prompt.substring(0, 100) : 'object',
        model,
        jsonMode,
      });
      throw err;
    }
  }

  /**
   * Call LLM with options object
   */
  async call(prompt: LLMPrompt, options?: LLMOptions): Promise<string> {
    return this.llm(prompt, options?.model, options?.jsonMode);
  }
}

// Export singleton instance
export const llmService = new LLMService();
