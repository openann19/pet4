/**
 * Message Sentiment Analysis
 *
 * Analyzes message sentiment in real-time and provides:
 * - Sentiment detection (positive, neutral, negative)
 * - Mood-based UI adaptations
 * - Appropriate response suggestions
 * - Flagging potentially problematic messages
 *
 * Location: apps/web/src/lib/sentiment-analysis.ts
 */


/**
 * Sentiment type
 */
export type Sentiment = 'positive' | 'neutral' | 'negative' | 'mixed';

/**
 * Sentiment analysis result
 */
export interface SentimentResult {
  sentiment: Sentiment;
  confidence: number; // 0-1
  emotions: Emotion[];
  severity?: 'low' | 'medium' | 'high'; // For negative sentiment
  suggestedActions?: string[];
}

/**
 * Emotion type
 */
export type Emotion =
  | 'happy'
  | 'excited'
  | 'calm'
  | 'neutral'
  | 'sad'
  | 'angry'
  | 'frustrated'
  | 'anxious'
  | 'love'
  | 'grateful';

/**
 * Sentiment Analysis Service
 */
export class SentimentAnalysisService {
  private readonly positiveKeywords = [
    'happy',
    'excited',
    'love',
    'great',
    'wonderful',
    'amazing',
    'perfect',
    'thanks',
    'thank you',
    'awesome',
    'fantastic',
    'brilliant',
    'joy',
    'pleased',
    'delighted',
    'glad',
    '😊',
    '😁',
    '❤️',
    '🎉',
    '👍',
    '👏',
  ];

  private readonly negativeKeywords = [
    'sad',
    'angry',
    'frustrated',
    'disappointed',
    'upset',
    'annoyed',
    'hate',
    'terrible',
    'awful',
    'bad',
    'worst',
    'horrible',
    '😢',
    '😠',
    '😡',
    '😞',
    '💔',
    '👎',
  ];

  private readonly neutralKeywords = [
    'ok',
    'okay',
    'fine',
    'sure',
    'alright',
    'maybe',
    'perhaps',
    'possibly',
  ];

  /**
   * Analyze sentiment of a message
   */
  analyze(text: string): SentimentResult {
    if (!text || text.trim().length === 0) {
      return {
        sentiment: 'neutral',
        confidence: 1,
        emotions: ['neutral'],
      };
    }

    const normalizedText = text.toLowerCase().trim();
    const words = normalizedText.split(/\s+/);
    const emoticons = this.extractEmoticons(text);

    // Count positive and negative indicators
    let positiveScore = 0;
    let negativeScore = 0;
    let neutralScore = 0;

    // Check keywords
    for (const word of words) {
      if (this.positiveKeywords.some((kw) => word.includes(kw))) {
        positiveScore += 1;
      }
      if (this.negativeKeywords.some((kw) => word.includes(kw))) {
        negativeScore += 1;
      }
      if (this.neutralKeywords.some((kw) => word.includes(kw))) {
        neutralScore += 1;
      }
    }

    // Check emoticons
    for (const emoticon of emoticons) {
      if (this.isPositiveEmoticon(emoticon)) {
        positiveScore += 2; // Emoticons are stronger indicators
      }
      if (this.isNegativeEmoticon(emoticon)) {
        negativeScore += 2;
      }
    }

    // Check for exclamation marks and question marks (intensity indicators)
    const exclamationCount = (text.match(/!/g) ?? []).length;
    const questionCount = (text.match(/\?/g) ?? []).length;

    if (exclamationCount > 0 && positiveScore > negativeScore) {
      positiveScore += exclamationCount * 0.5; // Exclamations boost positive sentiment
    }
    if (questionCount > 2) {
      neutralScore += questionCount * 0.3; // Many questions suggest neutral/uncertainty
    }

    // Calculate sentiment
    const totalScore = positiveScore + negativeScore + neutralScore;
    let sentiment: Sentiment;
    let confidence: number;

    if (totalScore === 0) {
      sentiment = 'neutral';
      confidence = 0.5;
    } else if (positiveScore > negativeScore * 1.5) {
      sentiment = 'positive';
      confidence = Math.min(1, positiveScore / (totalScore + 1));
    } else if (negativeScore > positiveScore * 1.5) {
      sentiment = 'negative';
      confidence = Math.min(1, negativeScore / (totalScore + 1));
    } else if (Math.abs(positiveScore - negativeScore) < totalScore * 0.2) {
      sentiment = 'mixed';
      confidence = 0.6;
    } else {
      sentiment = 'neutral';
      confidence = Math.min(1, neutralScore / (totalScore + 1));
    }

    // Detect emotions
    const emotions = this.detectEmotions(normalizedText, sentiment);

    // Determine severity for negative sentiment
    let severity: 'low' | 'medium' | 'high' | undefined;
    if (sentiment === 'negative') {
      if (negativeScore >= 5 || this.hasStrongNegativeIndicators(normalizedText)) {
        severity = 'high';
      } else if (negativeScore >= 2) {
        severity = 'medium';
      } else {
        severity = 'low';
      }
    }

    // Generate suggested actions
    const suggestedActions = this.generateSuggestedActions(sentiment, emotions, severity);

    return {
      sentiment,
      confidence,
      emotions,
      severity,
      suggestedActions,
    };
  }

  /**
   * Extract emoticons from text
   */
  private extractEmoticons(text: string): string[] {
    // Simple emoticon detection (can be enhanced with regex for more patterns)
    const emoticonPattern =
      /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
    const matches = text.match(emoticonPattern);
    return matches ?? [];
  }

  /**
   * Check if emoticon is positive
   */
  private isPositiveEmoticon(emoticon: string): boolean {
    const positiveEmoticons = ['😊', '😁', '😂', '😃', '😄', '😅', '😆', '❤️', '💙', '💚', '💛', '💜', '🧡', '🤍', '💕', '💖', '💗', '💞', '💓', '💝', '🎉', '🎊', '👍', '👏', '🙌', '✨', '🌟', '⭐'];
    return positiveEmoticons.includes(emoticon);
  }

  /**
   * Check if emoticon is negative
   */
  private isNegativeEmoticon(emoticon: string): boolean {
    const negativeEmoticons = ['😢', '😠', '😡', '😞', '😟', '😤', '😭', '😰', '😨', '😱', '💔', '👎', '😒', '🙁', '☹️'];
    return negativeEmoticons.includes(emoticon);
  }

  /**
   * Detect emotions from text
   */
  private detectEmotions(text: string, sentiment: Sentiment): Emotion[] {
    const emotions: Emotion[] = [];

    if (sentiment === 'positive') {
      if (text.includes('excited') || text.includes('excitement')) {
        emotions.push('excited');
      }
      if (text.includes('love') || text.includes('❤️')) {
        emotions.push('love');
      }
      if (text.includes('thank') || text.includes('grateful')) {
        emotions.push('grateful');
      }
      if (emotions.length === 0) {
        emotions.push('happy');
      }
    } else if (sentiment === 'negative') {
      if (text.includes('angry') || text.includes('mad')) {
        emotions.push('angry');
      }
      if (text.includes('frustrated') || text.includes('frustration')) {
        emotions.push('frustrated');
      }
      if (text.includes('sad') || text.includes('upset')) {
        emotions.push('sad');
      }
      if (text.includes('anxious') || text.includes('worried')) {
        emotions.push('anxious');
      }
      if (emotions.length === 0) {
        emotions.push('sad');
      }
    } else {
      emotions.push('neutral');
      if (text.includes('calm') || text.includes('peaceful')) {
        emotions.push('calm');
      }
    }

    return emotions.length > 0 ? emotions : ['neutral'];
  }

  /**
   * Check for strong negative indicators
   */
  private hasStrongNegativeIndicators(text: string): boolean {
    const strongIndicators = ['hate', 'horrible', 'worst', 'terrible', 'awful', 'disgusting'];
    return strongIndicators.some((indicator) => text.includes(indicator));
  }

  /**
   * Generate suggested actions based on sentiment
   */
  private generateSuggestedActions(
    sentiment: Sentiment,
    emotions: Emotion[],
    severity?: 'low' | 'medium' | 'high'
  ): string[] {
    const actions: string[] = [];

    if (sentiment === 'positive') {
      actions.push('Respond enthusiastically');
      if (emotions.includes('grateful')) {
        actions.push('Acknowledge gratitude');
      }
      if (emotions.includes('excited')) {
        actions.push('Share excitement');
      }
    } else if (sentiment === 'negative') {
      if (severity === 'high') {
        actions.push('Offer support');
        actions.push('Ask if they need help');
        actions.push('Suggest taking a break');
      } else if (severity === 'medium') {
        actions.push('Show empathy');
        actions.push('Ask what happened');
      } else {
        actions.push('Acknowledge feelings');
      }
    } else {
      actions.push('Continue conversation');
    }

    return actions;
  }

  /**
   * Check if message should be flagged
   */
  shouldFlag(result: SentimentResult): boolean {
    // Flag if negative sentiment with high severity
    if (result.sentiment === 'negative' && result.severity === 'high') {
      return true;
    }

    // Flag if confidence is very low (might be problematic)
    if (result.confidence < 0.3) {
      return true;
    }

    return false;
  }

  /**
   * Get UI adaptation based on sentiment
   */
  getUIAdaptation(result: SentimentResult): {
    color?: string;
    emoji?: string;
    tone?: 'light' | 'medium' | 'strong';
  } {
    if (result.sentiment === 'positive') {
      return {
        color: '#10B981', // green
        emoji: '😊',
        tone: 'light',
      };
    } else if (result.sentiment === 'negative') {
      if (result.severity === 'high') {
        return {
          color: '#EF4444', // red
          emoji: '😟',
          tone: 'strong',
        };
      } else {
        return {
          color: '#F59E0B', // amber
          emoji: '😐',
          tone: 'medium',
        };
      }
    } else {
      return {
        color: '#6B7280', // gray
        emoji: '😐',
        tone: 'light',
      };
    }
  }
}

// Singleton instance
let sentimentService: SentimentAnalysisService | null = null;

/**
 * Get sentiment analysis service instance
 */
export function getSentimentAnalysisService(): SentimentAnalysisService {
  sentimentService ??= new SentimentAnalysisService();
  return sentimentService;
}

/**
 * Analyze message sentiment (convenience function)
 */
export function analyzeSentiment(text: string): SentimentResult {
  return getSentimentAnalysisService().analyze(text);
}
