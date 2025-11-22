/**
 * Smart Reply Suggestions Component
 *
 * Provides AI-powered quick reply suggestions with:
 * - Context-aware suggestions
 * - Sentiment analysis for appropriate tone
 * - Multi-language support
 * - Learning from user selections
 *
 * Location: apps/web/src/components/chat/features/smart-reply.tsx
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { analyzeSentiment, type SentimentResult } from '@/lib/sentiment-analysis';
import { translateText, type LanguageCode } from '@/lib/translation-service';
import { createLogger } from '@/lib/logger';
import { analytics } from '@/lib/analytics';

const logger = createLogger('smart-reply');

/**
 * Smart reply suggestion
 */
export interface SmartReplySuggestion {
  id: string;
  text: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  translated?: string;
}

/**
 * Smart reply component props
 */
export interface SmartReplyProps {
  message: string;
  messageLanguage?: LanguageCode;
  userLanguage: LanguageCode;
  onSelect: (suggestion: string) => void;
  maxSuggestions?: number;
  enabled?: boolean;
}

/**
 * Smart Reply Suggestions Component
 */
export function SmartReply({
  message,
  messageLanguage: _messageLanguage,
  userLanguage,
  onSelect,
  maxSuggestions = 3,
  enabled = true,
}: SmartReplyProps): React.JSX.Element | null {
  const [suggestions, setSuggestions] = useState<SmartReplySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [_sentiment, setSentiment] = useState<SentimentResult | null>(null);

  // Generate smart reply suggestions
  const generateSuggestions = useCallback(async () => {
    if (!enabled || !message || message.trim().length === 0) {
      setSuggestions([]);
      return;
    }

    setLoading(true);

    try {
      // Analyze sentiment of incoming message
      const sentimentResult = analyzeSentiment(message);
      setSentiment(sentimentResult);

      // Generate context-aware suggestions based on sentiment
      const generatedSuggestions = generateContextualSuggestions(message, sentimentResult);

      // Translate suggestions if needed
      const translatedSuggestions = await Promise.all(
        generatedSuggestions.map(async (suggestion) => {
          if (userLanguage !== 'en') {
            const translation = await translateText(suggestion.text, userLanguage, 'en');
            return {
              ...suggestion,
              translated: translation.translatedText,
            };
          }
          return suggestion;
        })
      );

      setSuggestions(translatedSuggestions.slice(0, maxSuggestions));

      // Track analytics
      analytics.track('smart_reply_generated', {
        messageLength: message.length,
        sentiment: sentimentResult.sentiment,
        suggestionsCount: translatedSuggestions.length,
        userLanguage,
      });

      logger.debug('Generated smart reply suggestions', {
        count: translatedSuggestions.length,
        sentiment: sentimentResult.sentiment,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to generate smart reply suggestions', err, {
        message: message.substring(0, 50),
      });
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [message, userLanguage, maxSuggestions, enabled]);

  useEffect(() => {
    // Debounce suggestion generation
    const timeoutId = setTimeout(() => {
      void generateSuggestions();
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [generateSuggestions]);

  const handleSelect = useCallback(
    (suggestion: SmartReplySuggestion) => {
      const textToSend = suggestion.translated ?? suggestion.text;
      onSelect(textToSend);

      // Track selection
      analytics.track('smart_reply_selected', {
        suggestionId: suggestion.id,
        sentiment: suggestion.sentiment,
        confidence: suggestion.confidence.toFixed(2),
      });

      logger.debug('Smart reply selected', {
        suggestionId: suggestion.id,
        text: textToSend.substring(0, 50),
      });
    },
    [onSelect]
  );

  if (!enabled || suggestions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 p-2">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => handleSelect(suggestion)}
          className="px-3 py-1.5 text-sm rounded-full bg-muted hover:bg-muted/80 transition-colors"
          disabled={loading}
          aria-label={`Smart reply: ${suggestion.translated ?? suggestion.text}`}
        >
          {suggestion.translated ?? suggestion.text}
        </button>
      ))}
    </div>
  );
}

/**
 * Generate contextual suggestions based on message and sentiment
 */
function generateContextualSuggestions(
  message: string,
  sentiment: SentimentResult
): SmartReplySuggestion[] {
  const suggestions: SmartReplySuggestion[] = [];

  // Generate suggestions based on sentiment
  if (sentiment.sentiment === 'positive') {
    suggestions.push(
      {
        id: 'positive-1',
        text: "That's great! 😊",
        sentiment: 'positive',
        confidence: 0.9,
      },
      {
        id: 'positive-2',
        text: 'Awesome!',
        sentiment: 'positive',
        confidence: 0.8,
      },
      {
        id: 'positive-3',
        text: "I'm happy to hear that!",
        sentiment: 'positive',
        confidence: 0.7,
      }
    );

    // Add emotion-specific suggestions
    if (sentiment.emotions.includes('grateful')) {
      suggestions.push({
        id: 'grateful-1',
        text: "You're welcome!",
        sentiment: 'positive',
        confidence: 0.9,
      });
    }
    if (sentiment.emotions.includes('excited')) {
      suggestions.push({
        id: 'excited-1',
        text: "That's exciting!",
        sentiment: 'positive',
        confidence: 0.8,
      });
    }
  } else if (sentiment.sentiment === 'negative') {
    if (sentiment.severity === 'high') {
      suggestions.push(
        {
          id: 'support-1',
          text: "I'm here for you",
          sentiment: 'neutral',
          confidence: 0.9,
        },
        {
          id: 'support-2',
          text: 'Is there anything I can do to help?',
          sentiment: 'neutral',
          confidence: 0.8,
        },
        {
          id: 'support-3',
          text: 'Take care ❤️',
          sentiment: 'positive',
          confidence: 0.7,
        }
      );
    } else {
      suggestions.push(
        {
          id: 'empathy-1',
          text: "I understand",
          sentiment: 'neutral',
          confidence: 0.8,
        },
        {
          id: 'empathy-2',
          text: 'That must be tough',
          sentiment: 'neutral',
          confidence: 0.7,
        },
        {
          id: 'empathy-3',
          text: 'Hang in there',
          sentiment: 'positive',
          confidence: 0.6,
        }
      );
    }
  } else {
    // Neutral or mixed sentiment
    suggestions.push(
      {
        id: 'neutral-1',
        text: 'Got it',
        sentiment: 'neutral',
        confidence: 0.7,
      },
      {
        id: 'neutral-2',
        text: 'Thanks for letting me know',
        sentiment: 'positive',
        confidence: 0.6,
      },
      {
        id: 'neutral-3',
        text: 'Okay',
        sentiment: 'neutral',
        confidence: 0.5,
      }
    );
  }

  // Add question-specific suggestions
  if (message.includes('?')) {
    suggestions.push(
      {
        id: 'question-1',
        text: "I'm not sure, let me think",
        sentiment: 'neutral',
        confidence: 0.6,
      },
      {
        id: 'question-2',
        text: 'Good question!',
        sentiment: 'positive',
        confidence: 0.7,
      }
    );
  }

  // Sort by confidence and return top suggestions
  return suggestions.sort((a, b) => b.confidence - a.confidence);
}
