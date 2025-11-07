'use client'

import type { MediaInput } from '@/core/types/media-types'
import { useCallback } from 'react'
import { isTruthy, isDefined } from '@/core/guards';

type PickAny = () => Promise<MediaInput | null>
type PickImage = () => Promise<MediaInput | null>
type PickVideo = () => Promise<MediaInput | null>

interface UseUploadPickerReturn {
  pickAny: PickAny
  pickImage: PickImage
  pickVideo: PickVideo
}

const isWeb = typeof window !== 'undefined'

async function toObjectURLWeb(file: File): Promise<string> {
  return URL.createObjectURL(file)
}

async function pickWebFile(accept: string): Promise<File | null> {
  return new Promise<File | null>((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = () => {
      const file = input.files?.[0] ?? null
      resolve(file)
    }
    input.oncancel = () => {
      resolve(null)
    }
    input.click()
  })
}

async function extractImageDimensionsWeb(url: string): Promise<{ width: number; height: number }> {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

async function extractVideoMetadataWeb(url: string): Promise<{ durationSec: number }> {
  return new Promise<{ durationSec: number }>((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      resolve({ durationSec: video.duration })
    }
    video.onerror = () => {
      reject(new Error('Failed to load video'))
    }
    video.src = url
  })
}

export function useUploadPicker(): UseUploadPickerReturn {
  const pickAny: PickAny = useCallback(async (): Promise<MediaInput | null> => {
    if (isTruthy(isWeb)) {
      const file = await pickWebFile('image/*,video/*')
      if (!file) {
        return null
      }

      const url = await toObjectURLWeb(file)

      if (file.type.startsWith('image/')) {
        try {
          const { width, height } = await extractImageDimensionsWeb(url)
          return {
            type: 'image',
            uri: url,
            width,
            height,
          }
        } catch {
          return {
            type: 'image',
            uri: url,
          }
        }
      } else if (file.type.startsWith('video/')) {
        try {
          const { durationSec } = await extractVideoMetadataWeb(url)
          return {
            type: 'video',
            uri: url,
            durationSec,
          }
        } catch {
          return {
            type: 'video',
            uri: url,
          }
        }
      }

      return null
    }

    // Native: try expo-image-picker; fallback to DocumentPicker if not installed
    try {
      // Dynamic import to avoid bundling if not available
      const ImagePickerModule = await import('expo-image-picker')
      const ImagePicker = ImagePickerModule.default ?? ImagePickerModule

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
        exif: false,
        allowsMultipleSelection: false,
      })

      if (result.cancelled || !result.assets?.length) {
        return null
      }

      const asset = result.assets[0]
      if (!asset) {
        return null
      }

      if (asset.type === 'video') {
        const videoAsset = asset as { uri: string; duration?: number }
        return {
          type: 'video',
          uri: videoAsset.uri,
          ...(videoAsset.duration !== undefined ? { durationSec: videoAsset.duration } : {}),
        }
      }

      return {
        type: 'image',
        uri: asset.uri,
        ...(asset.width !== undefined ? { width: asset.width } : {}),
        ...(asset.height !== undefined ? { height: asset.height } : {}),
      }
    } catch {
      try {
        // Fallback to DocumentPicker
        const DocPickerModule = await import('expo-document-picker')
        const DocPicker = DocPickerModule.default ?? DocPickerModule

        const result = await DocPicker.getDocumentAsync({
          type: ['image/*', 'video/*'],
          multiple: false,
          copyToCacheDirectory: true,
        })

        if (result.type !== 'success' || !result.name || !result.uri) {
          return null
        }

        const isVideo = /\.(mp4|mov|m4v|webm)$/i.test(result.name)

        if (isTruthy(isVideo)) {
          return {
            type: 'video',
            uri: result.uri,
          }
        }

        return {
          type: 'image',
          uri: result.uri,
        }
      } catch {
        return null
      }
    }
  }, [])

  const pickImage: PickImage = useCallback(async (): Promise<MediaInput | null> => {
    if (isTruthy(isWeb)) {
      const file = await pickWebFile('image/*')
      if (!file) {
        return null
      }

      const url = await toObjectURLWeb(file)

      try {
        const { width, height } = await extractImageDimensionsWeb(url)
        return {
          type: 'image',
          uri: url,
          width,
          height,
        }
      } catch {
        return {
          type: 'image',
          uri: url,
        }
      }
    }

    try {
      const ImagePickerModule = await import('expo-image-picker')
      const ImagePicker = ImagePickerModule.default ?? ImagePickerModule

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        exif: false,
        allowsMultipleSelection: false,
      })

      if (result.cancelled || !result.assets?.length) {
        return null
      }

      const asset = result.assets[0]
      if (!asset) {
        return null
      }

      return {
        type: 'image',
        uri: asset.uri,
        ...(asset.width !== undefined ? { width: asset.width } : {}),
        ...(asset.height !== undefined ? { height: asset.height } : {}),
      }
    } catch {
      return null
    }
  }, [])

  const pickVideo: PickVideo = useCallback(async (): Promise<MediaInput | null> => {
    if (isTruthy(isWeb)) {
      const file = await pickWebFile('video/*')
      if (!file) {
        return null
      }

      const url = await toObjectURLWeb(file)

      try {
        const { durationSec } = await extractVideoMetadataWeb(url)
        return {
          type: 'video',
          uri: url,
          durationSec,
        }
      } catch {
        return {
          type: 'video',
          uri: url,
        }
      }
    }

    try {
      const ImagePickerModule = await import('expo-image-picker')
      const ImagePicker = ImagePickerModule.default ?? ImagePickerModule

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 1,
        exif: false,
        allowsMultipleSelection: false,
      })

      if (result.cancelled || !result.assets?.length) {
        return null
      }

      const asset = result.assets[0]
      if (!asset) {
        return null
      }

      const videoAsset = asset as { uri: string; duration?: number }
      return {
        type: 'video',
        uri: videoAsset.uri,
        ...(videoAsset.duration !== undefined ? { durationSec: videoAsset.duration } : {}),
      }
    } catch {
      return null
    }
  }, [])

  return {
    pickAny,
    pickImage,
    pickVideo,
  }
}

