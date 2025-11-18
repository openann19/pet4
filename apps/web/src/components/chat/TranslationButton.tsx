/**
 * Translation Button
 *
 * Per-message translation action
 */

'use client';

import { useState, useCallback } from 'react';
import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { createLogger } from '@/lib/logger';

const logger = createLogger('TranslationButton');

export interface TranslationButtonProps {
  messageId: string;
  originalText: string;
  originalLanguage?: string;
  targetLanguage?: string;
  onTranslate?: (translatedText: string) => void;
  className?: string;
}

export function TranslationButton({
  messageId: _messageId,
  originalText,
  originalLanguage,
  targetLanguage = 'en',
  onTranslate,
  className,
}: TranslationButtonProps): React.JSX.Element {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(true);

  const handleTranslate = useCallback(async () => {
    if (translatedText) {
      setShowOriginal(!showOriginal);
      return;
    }

    setIsTranslating(true);
    try {
      // In a real implementation, this would call a translation API
      // For now, we'll use a mock translation
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: originalText,
          from: originalLanguage,
          to: targetLanguage,
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as { translatedText: string };
        setTranslatedText(data.translatedText);
        setShowOriginal(false);
        onTranslate?.(data.translatedText);
      } else {
        logger.error('Translation failed', new Error(`HTTP ${response.status}`));
        // Fallback: show original text with a note
        setTranslatedText(originalText);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Translation error', err);
      setTranslatedText(originalText);
    } finally {
      setIsTranslating(false);
    }
  }, [originalText, originalLanguage, targetLanguage, translatedText, showOriginal, onTranslate]);

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      onClick={() => void handleTranslate()}
      disabled={isTranslating}
      className={cn('rounded-full', className)}
      aria-label={translatedText ? 'Toggle translation' : 'Translate message'}
    >
      <Languages className="size-4" aria-hidden="true" />
      {isTranslating && <span className="ml-1 text-xs">Translating...</span>}
    </Button>
  );
}

