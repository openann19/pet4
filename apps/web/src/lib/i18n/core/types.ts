/**
 * i18n Core Types
 */

export type Language = 'en' | 'bg';

export type TranslationKey = string;

export interface TranslationModule {
  readonly [key: string]: string | TranslationModule;
}

export type Translations = Record<string, TranslationModule>;
