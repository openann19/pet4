/**
 * VerificationScreen Component
 *
 * Mobile screen for KYC verification
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { colors } from '@mobile/theme/colors';
import { useEntryAnimation } from '@mobile/effects/reanimated/use-entry-animation';
import { DocumentUploadCard } from '@mobile/components/verification/DocumentUploadCard.native';
import { VerificationLevelSelector } from '@mobile/components/verification/VerificationLevelSelector.native';

type VerificationLevel = 'basic' | 'standard' | 'premium';
type DocumentType = 'id' | 'address' | 'pet_license' | 'vaccination';

interface VerificationDocument {
  id: string;
  type: DocumentType;
  fileUri: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export function VerificationScreen(): React.JSX.Element {
  const [selectedLevel, setSelectedLevel] = useState<VerificationLevel>('basic');
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLevelSelect = useCallback((level: VerificationLevel) => {
    setSelectedLevel(level);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleDocumentUpload = useCallback(
    async (type: DocumentType) => {
      try {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['image/*', 'application/pdf'],
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets[0]) {
          const newDoc: VerificationDocument = {
            id: `doc-${Date.now()}`,
            type,
            fileUri: result.assets[0].uri,
            uploadedAt: new Date().toISOString(),
            status: 'pending',
          };
          setDocuments((prev) => [...prev, newDoc]);
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to upload document');
      }
    },
    []
  );

  const handleDeleteDocument = useCallback((docId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    // Submit verification request
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    Alert.alert('Success', 'Verification request submitted!');
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const requiredDocs: DocumentType[] =
    selectedLevel === 'basic'
      ? ['id']
      : selectedLevel === 'standard'
        ? ['id', 'address']
        : ['id', 'address', 'pet_license', 'vaccination'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Verification</Text>
        <Text style={styles.subtitle}>
          Verify your identity and pet information to build trust
        </Text>

        <VerificationLevelSelector
          selectedLevel={selectedLevel}
          onLevelSelect={handleLevelSelect}
        />

        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>Required Documents</Text>
          {requiredDocs.map((docType) => (
            <DocumentUploadCard
              key={docType}
              documentType={docType}
              existingDocument={documents.find((d) => d.type === docType)}
              onUpload={() => handleDocumentUpload(docType)}
              onDelete={(docId) => handleDeleteDocument(docId)}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Verification'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
  },
  documentsSection: {
    marginTop: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

