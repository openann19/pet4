/**
 * DocumentUploadCard.native Component
 *
 * Mobile document upload card with camera integration
 */

import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Image, Alert } from 'react-native';
import Animated from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { colors } from '@mobile/theme/colors';
import { useEntryAnimation } from '@mobile/effects/reanimated/use-entry-animation';
import { useBounceOnTap } from '@mobile/effects/reanimated/use-bounce-on-tap';

type DocumentType = 'id' | 'address' | 'pet_license' | 'vaccination';

interface VerificationDocument {
  id: string;
  type: DocumentType;
  fileUri: string;
  uploadedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface DocumentUploadCardProps {
  documentType: DocumentType;
  existingDocument?: VerificationDocument;
  onUpload: (fileUri: string) => void;
  onDelete?: (documentId: string) => void;
  optional?: boolean;
  disabled?: boolean;
}

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  id: 'Government ID',
  address: 'Proof of Address',
  pet_license: 'Pet License',
  vaccination: 'Vaccination Records',
};

export function DocumentUploadCard({
  documentType,
  existingDocument,
  onUpload,
  onDelete,
  optional = false,
  disabled = false,
}: DocumentUploadCardProps): React.JSX.Element {
  const entry = useEntryAnimation({ delay: 0 });
  const bounce = useBounceOnTap({ scale: 0.98 });

  const handlePress = async (): Promise<void> => {
    if (disabled) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    bounce.handlePress();

    Alert.alert(
      'Upload Document',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permission Denied', 'Camera permission is required');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              onUpload(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              quality: 0.8,
            });
            if (!result.canceled && result.assets[0]) {
              onUpload(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Choose File',
          onPress: async () => {
            const result = await DocumentPicker.getDocumentAsync({
              type: ['image/*', 'application/pdf'],
            });
            if (!result.canceled && result.assets && result.assets[0]) {
              onUpload(result.assets[0].uri);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleDelete = (): void => {
    if (existingDocument && onDelete) {
      Alert.alert('Delete Document', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(existingDocument.id);
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          },
        },
      ]);
    }
  };

  return (
    <Animated.View style={[styles.card, entry.animatedStyle]}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {DOCUMENT_LABELS[documentType]}
          {optional && <Text style={styles.optional}> (Optional)</Text>}
        </Text>
        {existingDocument && (
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{existingDocument.status}</Text>
          </View>
        )}
      </View>

      {existingDocument ? (
        <View style={styles.documentPreview}>
          <Image source={{ uri: existingDocument.fileUri }} style={styles.previewImage} />
          {onDelete && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.uploadButton, disabled && styles.uploadButtonDisabled]}
          onPress={handlePress}
          disabled={disabled}
        >
          <Text style={styles.uploadButtonText}>Upload Document</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  optional: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: 'normal',
  },
  statusBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    textTransform: 'capitalize',
  },
  documentPreview: {
    marginTop: 8,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: colors.error,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  uploadButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

