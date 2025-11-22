import type { RootStackParamList } from '@mobile/navigation/AppNavigator'
import { colors } from '@mobile/theme/colors'
import { createLogger } from '@mobile/utils/logger'
import type { RouteProp } from '@react-navigation/native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import * as ImagePicker from 'expo-image-picker'
import React, { useCallback, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { isTruthy } from '@petspark/shared';

const logger = createLogger('UploadAndEditScreen')

export function UploadAndEditScreen(): React.ReactElement {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const route = useRoute<RouteProp<RootStackParamList, 'UploadAndEdit'>>()
  const { onDone, onCancel } = route.params
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePickImage = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        logger.warn('Media library permission denied')
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.92,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to pick image', err)
    }
  }, [])

  const handleCamera = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        logger.warn('Camera permission denied')
        return
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.92,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri)
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to take photo', err)
    }
  }, [])

  const handleDone = useCallback(async () => {
    if (isTruthy(selectedImage)) {
      setIsProcessing(true)
      try {
        // Process and compress image if needed
        let processedUri = selectedImage

        // Try to use expo-image-manipulator for compression
        try {
          // Dynamic import to avoid bundling if not available
          const ImageManipulator = await import('expo-image-manipulator').catch(() => null)
          if (isTruthy(ImageManipulator)) {
            const manipulatedImage = await ImageManipulator.manipulateAsync(
              selectedImage,
              [{ resize: { width: 1920 } }], // Resize to max width of 1920px
              {
                compress: 0.92,
                format: ImageManipulator.SaveFormat.JPEG,
              }
            )
            processedUri = manipulatedImage.uri
          }
        } catch (compressError) {
          // If compression fails, use original image
          logger.warn('Image compression not available, using original', { error: compressError })
        }

        onDone(processedUri)
        navigation.goBack()
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error('Failed to process image', err)
        // Still pass the original image if processing fails
        onDone(selectedImage)
        navigation.goBack()
      } finally {
        setIsProcessing(false)
      }
    }
  }, [selectedImage, onDone, navigation])

  const handleCancel = useCallback(() => {
    if (isTruthy(onCancel)) {
      onCancel()
    }
    navigation.goBack()
  }, [onCancel, navigation])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Upload & Edit</Text>
        <TouchableOpacity
          onPress={() => {
            void handleDone()
          }}
          disabled={!selectedImage || isProcessing}
          style={[styles.doneButton, (!selectedImage || isProcessing) && styles.doneButtonDisabled]}
        >
          <Text
            style={[styles.doneText, (!selectedImage || isProcessing) && styles.doneTextDisabled]}
          >
            {isProcessing ? 'Processing...' : 'Done'}
          </Text>
        </TouchableOpacity>
      </View>

      {!selectedImage ? (
        <View style={styles.pickerContainer}>
          <TouchableOpacity
            onPress={() => {
              void handleCamera()
            }}
            style={styles.pickerButton}
          >
            <Text style={styles.pickerButtonText}>📷 Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              void handlePickImage()
            }}
            style={styles.pickerButton}
          >
            <Text style={styles.pickerButtonText}>🖼️ Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <Text style={styles.previewText}>Media selected: {selectedImage}</Text>
          <TouchableOpacity onPress={() => setSelectedImage(null)} style={styles.replaceButton}>
            <Text style={styles.replaceButtonText}>Replace</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelButton: {
    padding: 8,
  },
  cancelText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  doneButton: {
    padding: 8,
  },
  doneButtonDisabled: {
    opacity: 0.5,
  },
  doneText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
  },
  doneTextDisabled: {
    color: colors.textSecondary,
  },
  pickerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  pickerButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  previewText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  replaceButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  replaceButtonText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
})
