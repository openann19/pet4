/**
 * GoLiveScreen Component
 *
 * Mobile screen for setting up and starting a live stream
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '@mobile/theme/colors';
import { useEntryAnimation } from '@mobile/effects/reanimated/use-entry-animation';
import { useBounceOnTap } from '@mobile/effects/reanimated/use-bounce-on-tap';

interface GoLiveScreenProps {
  onGoLive: (config: { title: string; description?: string; category?: string }) => void;
  onCancel: () => void;
}

export function GoLiveScreen({ onGoLive, onCancel }: GoLiveScreenProps): React.JSX.Element {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const entry = useEntryAnimation({ delay: 0 });
  const bounce = useBounceOnTap({ scale: 0.98 });

  const handleGoLive = useCallback(() => {
    if (!title.trim()) {
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const trimmedDescription = description.trim();
    onGoLive({
      title: title.trim(),
      ...(trimmedDescription && { description: trimmedDescription }),
      ...(category && { category }),
    });
  }, [title, description, category, onGoLive]);

  const animatedStyle = useEntryAnimation({ delay: 0 }).animatedStyle;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>Go Live</Text>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter stream title"
                placeholderTextColor={colors.textSecondary}
                maxLength={100}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="What's your stream about?"
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder="e.g., Pet Care, Training"
                placeholderTextColor={colors.textSecondary}
                maxLength={50}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.goLiveButton, !title.trim() && styles.goLiveButtonDisabled]}
            onPress={handleGoLive}
            disabled={!title.trim()}
          >
            <Text style={styles.goLiveButtonText}>Start Streaming</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  form: {
    gap: 20,
    marginBottom: 32,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  goLiveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  goLiveButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  goLiveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

