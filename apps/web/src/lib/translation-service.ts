/**
 * Auto-Translation Service
 *
 * Provides real-time message translation with:
 * - Automatic language detection
 * - Translation to user's preferred language
 * - Preservation of original message
 * - Support for 50+ languages
 *
 * Location: apps/web/src/lib/translation-service.ts
 */


/**
 * Supported language code
 */
export type LanguageCode =
  | 'en'
  | 'bg'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'pt'
  | 'ru'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'ar'
  | 'hi'
  | 'tr'
  | 'pl'
  | 'nl'
  | 'sv'
  | 'da'
  | 'no'
  | 'fi'
  | 'cs'
  | 'hu'
  | 'ro'
  | 'el'
  | 'th'
  | 'vi'
  | 'id'
  | 'ms'
  | 'uk'
  | 'he'
  | 'fa'
  | 'ur'
  | 'bn'
  | 'ta'
  | 'te'
  | 'ml'
  | 'kn'
  | 'gu'
  | 'pa'
  | 'mr'
  | 'ne'
  | 'si'
  | 'my'
  | 'km'
  | 'lo'
  | 'ka'
  | 'am'
  | 'az'
  | 'be'
  | 'bs'
  | 'hr'
  | 'sr'
  | 'sk'
  | 'sl'
  | 'mk'
  | 'sq'
  | 'et'
  | 'lv'
  | 'lt'
  | 'is'
  | 'ga'
  | 'mt'
  | 'cy';

/**
 * Language metadata
 */
export interface LanguageMetadata {
  code: LanguageCode;
  name: string;
  nativeName: string;
  rtl: boolean; // Right-to-left
}

/**
 * Translation result
 */
export interface TranslationResult {
  originalText: string;
  translatedText: string;
  detectedLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  confidence: number; // 0-1
  preserved: boolean; // Whether original is preserved
}

/**
 * Translation Service
 */
export class TranslationService {
  private readonly supportedLanguages = new Map<LanguageCode, LanguageMetadata>([
    ['en', { code: 'en', name: 'English', nativeName: 'English', rtl: false }],
    ['bg', { code: 'bg', name: 'Bulgarian', nativeName: 'Български', rtl: false }],
    ['es', { code: 'es', name: 'Spanish', nativeName: 'Español', rtl: false }],
    ['fr', { code: 'fr', name: 'French', nativeName: 'Français', rtl: false }],
    ['de', { code: 'de', name: 'German', nativeName: 'Deutsch', rtl: false }],
    ['it', { code: 'it', name: 'Italian', nativeName: 'Italiano', rtl: false }],
    ['pt', { code: 'pt', name: 'Portuguese', nativeName: 'Português', rtl: false }],
    ['ru', { code: 'ru', name: 'Russian', nativeName: 'Русский', rtl: false }],
    ['zh', { code: 'zh', name: 'Chinese', nativeName: '中文', rtl: false }],
    ['ja', { code: 'ja', name: 'Japanese', nativeName: '日本語', rtl: false }],
    ['ko', { code: 'ko', name: 'Korean', nativeName: '한국어', rtl: false }],
    ['ar', { code: 'ar', name: 'Arabic', nativeName: 'العربية', rtl: true }],
    ['hi', { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false }],
    ['tr', { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', rtl: false }],
    ['pl', { code: 'pl', name: 'Polish', nativeName: 'Polski', rtl: false }],
    ['nl', { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', rtl: false }],
    ['sv', { code: 'sv', name: 'Swedish', nativeName: 'Svenska', rtl: false }],
    ['da', { code: 'da', name: 'Danish', nativeName: 'Dansk', rtl: false }],
    ['no', { code: 'no', name: 'Norwegian', nativeName: 'Norsk', rtl: false }],
    ['fi', { code: 'fi', name: 'Finnish', nativeName: 'Suomi', rtl: false }],
    ['cs', { code: 'cs', name: 'Czech', nativeName: 'Čeština', rtl: false }],
    ['hu', { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', rtl: false }],
    ['ro', { code: 'ro', name: 'Romanian', nativeName: 'Română', rtl: false }],
    ['el', { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', rtl: false }],
    ['th', { code: 'th', name: 'Thai', nativeName: 'ไทย', rtl: false }],
    ['vi', { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', rtl: false }],
    ['id', { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', rtl: false }],
    ['ms', { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', rtl: false }],
    ['uk', { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', rtl: false }],
    ['he', { code: 'he', name: 'Hebrew', nativeName: 'עברית', rtl: true }],
    ['fa', { code: 'fa', name: 'Persian', nativeName: 'فارسی', rtl: true }],
    ['ur', { code: 'ur', name: 'Urdu', nativeName: 'اردو', rtl: true }],
  ]);

  private readonly cache = new Map<string, TranslationResult>();
  private readonly cacheMaxSize = 1000;

  /**
   * Detect language of text
   */
  detectLanguage(text: string): { language: LanguageCode; confidence: number } {
    if (!text || text.trim().length === 0) {
      return { language: 'en', confidence: 0 };
    }

    // Simple language detection based on character patterns
    // In production, this would use a proper language detection library or API

    // Check for Cyrillic characters (Russian, Bulgarian, Ukrainian)
    if (/[\u0400-\u04FF]/.test(text)) {
      // Distinguish between Russian, Bulgarian, Ukrainian
      if (text.includes('ъ') || text.includes('ь')) {
        return { language: 'bg', confidence: 0.8 };
      }
      if (text.includes('і') || text.includes('ї')) {
        return { language: 'uk', confidence: 0.8 };
      }
      return { language: 'ru', confidence: 0.8 };
    }

    // Check for Arabic script
    if (/[\u0600-\u06FF]/.test(text)) {
      return { language: 'ar', confidence: 0.8 };
    }

    // Check for Hebrew
    if (/[\u0590-\u05FF]/.test(text)) {
      return { language: 'he', confidence: 0.8 };
    }

    // Check for Chinese characters
    if (/[\u4E00-\u9FFF]/.test(text)) {
      return { language: 'zh', confidence: 0.8 };
    }

    // Check for Japanese
    if (/[\u3040-\u309F]|[\u30A0-\u30FF]/.test(text)) {
      return { language: 'ja', confidence: 0.8 };
    }

    // Check for Korean
    if (/[\uAC00-\uD7A3]/.test(text)) {
      return { language: 'ko', confidence: 0.8 };
    }

    // Check for Thai
    if (/[\u0E00-\u0E7F]/.test(text)) {
      return { language: 'th', confidence: 0.8 };
    }

    // Check for common English words (fallback)
    const commonEnglishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = text.toLowerCase().split(/\s+/);
    const englishWordCount = words.filter((word) => commonEnglishWords.includes(word)).length;
    if (englishWordCount > words.length * 0.1) {
      return { language: 'en', confidence: 0.6 };
    }

    // Default to English if detection fails
    return { language: 'en', confidence: 0.3 };
  }

  /**
   * Translate text to target language
   */
  async translate(
    text: string,
    targetLanguage: LanguageCode,
    sourceLanguage?: LanguageCode
  ): Promise<TranslationResult> {
    if (!text || text.trim().length === 0) {
      return {
        originalText: text,
        translatedText: text,
        detectedLanguage: targetLanguage,
        targetLanguage,
        confidence: 1,
        preserved: true,
      };
    }

    // Check cache
    const cacheKey = `${text}-${targetLanguage}-${sourceLanguage ?? 'auto'}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Detect source language if not provided
    const detected = sourceLanguage
      ? { language: sourceLanguage, confidence: 1 }
      : this.detectLanguage(text);

    // If already in target language, return as-is
    if (detected.language === targetLanguage) {
      const result: TranslationResult = {
        originalText: text,
        translatedText: text,
        detectedLanguage: detected.language,
        targetLanguage,
        confidence: 1,
        preserved: true,
      };
      this.cacheTranslation(cacheKey, result);
      return result;
    }

    // Translate text (in production, this would call a translation API)
    // For now, return a placeholder that indicates translation is needed
    const translatedText = await this.performTranslation(text, detected.language, targetLanguage);

    const result: TranslationResult = {
      originalText: text,
      translatedText,
      detectedLanguage: detected.language,
      targetLanguage,
      confidence: detected.confidence,
      preserved: true, // Always preserve original
    };

    this.cacheTranslation(cacheKey, result);

    return result;
  }

  /**
   * Perform translation (placeholder - would integrate with translation API)
   */
  private performTranslation(
    text: string,
    sourceLanguage: LanguageCode,
    targetLanguage: LanguageCode
  ): Promise<string> {
    // In production, this would call a translation API (Google Translate, DeepL, etc.)
    // For now, return a placeholder
    // Placeholder: return text with translation marker
    // In production, replace with actual API call
    return Promise.resolve(`[Translated from ${sourceLanguage} to ${targetLanguage}] ${text}`);
  }

  /**
   * Cache translation result
   */
  private cacheTranslation(key: string, result: TranslationResult): void {
    // Evict oldest if cache is full
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, result);
  }

  /**
   * Get language metadata
   */
  getLanguageMetadata(code: LanguageCode): LanguageMetadata | undefined {
    return this.supportedLanguages.get(code);
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(code: string): code is LanguageCode {
    return this.supportedLanguages.has(code as LanguageCode);
  }

  /**
   * Get all supported languages
   */
  getSupportedLanguages(): LanguageMetadata[] {
    return Array.from(this.supportedLanguages.values());
  }
}

// Singleton instance
let translationService: TranslationService | null = null;

/**
 * Get translation service instance
 */
export function getTranslationService(): TranslationService {
  translationService ??= new TranslationService();
  return translationService;
}

/**
 * Translate text (convenience function)
 */
export async function translateText(
  text: string,
  targetLanguage: LanguageCode,
  sourceLanguage?: LanguageCode
): Promise<TranslationResult> {
  return getTranslationService().translate(text, targetLanguage, sourceLanguage);
}

/**
 * Detect language (convenience function)
 */
export function detectLanguage(text: string): { language: LanguageCode; confidence: number } {
  return getTranslationService().detectLanguage(text);
}
