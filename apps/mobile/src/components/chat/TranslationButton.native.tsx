/**
 * TranslationButton.native Component
 *
 * Mobile translation button for chat messages
 */

import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '@mobile/theme/colors';
import { useBounceOnTap } from '@mobile/effects/reanimated/use-bounce-on-tap';

interface TranslationButtonProps {
  messageId: string;
  originalText: string;
  originalLanguage?: string;
  targetLanguage?: string;
  onTranslate: (translatedText: string) => void;
  disabled?: boolean;
}

export function TranslationButton({
  messageId: _messageId,
  originalText,
  originalLanguage: _originalLanguage,
  targetLanguage: _targetLanguage = 'en',
  onTranslate,
  disabled = false,
}: TranslationButtonProps): React.JSX.Element {
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(true);
  const bounce = useBounceOnTap({ scale: 0.95 });

  const handlePress = useCallback(async () => {
    if (disabled || isTranslating) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bounce.handlePress();

    if (translatedText) {
      // Toggle between original and translated
      setShowOriginal(!showOriginal);
      return;
    }

    try {
      setIsTranslating(true);

      // In a real implementation, this would call a translation API
      // For now, simulate translation
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const mockTranslated = `[Translated] ${originalText}`;
      setTranslatedText(mockTranslated);
      setShowOriginal(false);
      onTranslate(mockTranslated);

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  }, [
    disabled,
    isTranslating,
    translatedText,
    showOriginal,
    originalText,
    onTranslate,
    bounce,
  ]);

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled]}
      onPress={handlePress}
      disabled={disabled || isTranslating}
      activeOpacity={0.7}
    >
      {isTranslating ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Text style={styles.icon}>
          {translatedText && !showOriginal ? '🔄' : '🌐'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 16,
  },
});
