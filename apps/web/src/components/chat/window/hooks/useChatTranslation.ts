import { toast } from 'sonner';
import { buildLLMPrompt } from '@/lib/llm-prompt';
import { llmService } from '@/lib/llm-service';
import { parseLLMError } from '@/lib/llm-utils';
import { createLogger } from '@/lib/logger';
import type { ChatMessage } from '@/lib/chat-types';

const logger = createLogger('useChatTranslation');

interface UseChatTranslationProps {
  messages: ChatMessage[] | undefined;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

/**
 * Hook for managing message translation
 */
export function useChatTranslation({ messages, setMessages }: UseChatTranslationProps) {
  const translateMessage = async (messageId: string): Promise<void> => {
    const m = (messages ?? []).find((x) => x.id === messageId);
    if (!m) {
      return;
    }

    try {
      const prompt = buildLLMPrompt`Translate to English, return text only: "${m.content}"`;
      const translated = await llmService.llm(prompt, 'gpt-4o-mini');

      void setMessages((cur) =>
        (cur ?? []).map((x) =>
          x.id === messageId
            ? {
                ...x,
                metadata: {
                  ...x.metadata,
                  translation: {
                    originalLang: 'auto',
                    targetLang: 'en',
                    translatedText: translated,
                  },
                },
              }
            : x
        )
      );

      void toast.success('Message translated!');
    } catch (e) {
      const info = parseLLMError(e);
      const err = e instanceof Error ? e : new Error(String(e));
      logger.error('Translation failed', err, { technicalMessage: info.technicalMessage });
      void toast.error('Translation failed', { description: info.userMessage, duration: 5000 });
    }
  };

  return { translateMessage };
}

