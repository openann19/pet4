/**
 * Image picker hook
 * Location: src/hooks/use-image-picker.ts
 */

import * as Haptics from 'expo-haptics'
import * as ImageManipulator from 'expo-image-manipulator'
import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import { createLogger } from '../utils/logger'

const logger = createLogger('useImagePicker')

export interface ImagePickerResult {
  uri: string
  width: number
  height: number
}

export interface UseImagePickerReturn {
  pickImage: (source: 'camera' | 'gallery') => Promise<ImagePickerResult | null>
  pickMultipleImages: (maxCount?: number) => Promise<ImagePickerResult[]>
  isProcessing: boolean
}

export function useImagePicker(): UseImagePickerReturn {
  const [isProcessing, setIsProcessing] = useState(false)

  const pickImage = async (
    source: 'camera' | 'gallery'
  ): Promise<ImagePickerResult | null> => {
    try {
      setIsProcessing(true)
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      let result: ImagePicker.ImagePickerResult

      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync()
        if (!permission.granted) {
          return null
        }

        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })
      } else {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
        if (!permission.granted) {
          return null
        }

        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.8,
        })
      }

      if (result.canceled || !result.assets[0]) {
        return null
      }

      const asset = result.assets[0]

      // Compress and resize
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1080 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      )

      return {
        uri: manipulated.uri,
        width: manipulated.width,
        height: manipulated.height,
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to pick image', err)
      return null
    } finally {
      setIsProcessing(false)
    }
  }

  const pickMultipleImages = async (
    maxCount: number = 5
  ): Promise<ImagePickerResult[]> => {
    try {
      setIsProcessing(true)
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (!permission.granted) {
        return []
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: maxCount,
        quality: 0.8,
      })

      if (result.canceled || !result.assets.length) {
        return []
      }

      const processedImages: ImagePickerResult[] = []

      for (const asset of result.assets.slice(0, maxCount)) {
        const manipulated = await ImageManipulator.manipulateAsync(
          asset.uri,
          [{ resize: { width: 1080 } }],
          {
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        )

        processedImages.push({
          uri: manipulated.uri,
          width: manipulated.width,
          height: manipulated.height,
        })
      }

      return processedImages
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to pick images', err)
      return []
    } finally {
      setIsProcessing(false)
    }
  }

  return {
    pickImage,
    pickMultipleImages,
    isProcessing,
  }
}

