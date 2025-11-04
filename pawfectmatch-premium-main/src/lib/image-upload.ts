/**
 * Image Upload Service
 * 
 * Handles image uploads with compression, EXIF stripping, and storage.
 */

import imageCompression from 'browser-image-compression'
import { generateULID } from './utils'
import { createLogger } from './logger'

const logger = createLogger('ImageUpload')

export interface ImageUploadOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  fileType?: string
  initialQuality?: number
}

export interface ImageUploadResult {
  url: string
  key: string
  originalSize: number
  compressedSize: number
  width: number
  height: number
}

const DEFAULT_OPTIONS: ImageUploadOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  initialQuality: 0.85
}

/**
 * Strip EXIF data from image by re-encoding
 * This removes all metadata including location data
 */
async function stripExif(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result
      if (!arrayBuffer || !(arrayBuffer instanceof ArrayBuffer)) {
        reject(new Error('Failed to read file'))
        return
      }

      const blob = new Blob([arrayBuffer], { type: file.type })
      const strippedFile = new File([blob], file.name, {
        type: file.type,
        lastModified: Date.now()
      })

      resolve(strippedFile)
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file for EXIF stripping'))
    }

    reader.readAsArrayBuffer(file)
  })
}

/**
 * Get image dimensions from file
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Validate image file
 */
function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!validTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: ${validTypes.join(', ')}`
    }
  }

  // Check file size (50MB limit before compression)
  const maxSizeBytes = 50 * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 50MB`
    }
  }

  return { valid: true }
}

/**
 * Upload image to storage with compression and EXIF stripping
 */
export async function uploadImage(
  file: File,
  options: ImageUploadOptions = {}
): Promise<ImageUploadResult> {
  try {
    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      throw new Error(validation.error || 'Invalid image file')
    }

    // Get original dimensions
    const dimensions = await getImageDimensions(file)
    const originalSize = file.size

    // Compress image
    logger.debug('Compressing image', {
      originalSize,
      options: { ...DEFAULT_OPTIONS, ...options }
    })

    const compressedFile = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB ?? DEFAULT_OPTIONS.maxSizeMB ?? 1,
      maxWidthOrHeight: options.maxWidthOrHeight ?? DEFAULT_OPTIONS.maxWidthOrHeight ?? 1920,
      useWebWorker: options.useWebWorker ?? DEFAULT_OPTIONS.useWebWorker ?? true,
      fileType: options.fileType || file.type,
      initialQuality: options.initialQuality ?? DEFAULT_OPTIONS.initialQuality ?? 0.85
    })

    // Strip EXIF data
    logger.debug('Stripping EXIF data')
    const strippedFile = await stripExif(compressedFile)

    // Generate storage key
    const key = `images/${generateULID()}.${strippedFile.type.split('/')[1] || 'jpg'}`

    // Convert to ArrayBuffer for storage
    const arrayBuffer = await strippedFile.arrayBuffer()

    // Store in Spark KV
    await spark.kv.set(key, arrayBuffer)

    logger.info('Image uploaded successfully', {
      key,
      originalSize,
      compressedSize: strippedFile.size,
      compressionRatio: ((1 - strippedFile.size / originalSize) * 100).toFixed(2) + '%',
      dimensions
    })

    // Generate URL
    // In production, this would be a CDN URL
    // For now, we'll use a data URL or return the key for the API to serve
    const url = `/api/images/${key}`

    return {
      url,
      key,
      originalSize,
      compressedSize: strippedFile.size,
      width: dimensions.width,
      height: dimensions.height
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to upload image', err, {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })
    throw new Error(`Failed to upload image: ${err.message}`)
  }
}

/**
 * Upload multiple images
 */
export async function uploadImages(
  files: File[],
  options: ImageUploadOptions = {}
): Promise<ImageUploadResult[]> {
  const results = await Promise.all(
    files.map(file => uploadImage(file, options))
  )
  return results
}

/**
 * Create a placeholder image URL
 * For use when image is not yet uploaded or is loading
 */
export function createPlaceholderUrl(width: number, height: number): string {
  // Return a data URL with a simple gradient placeholder
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#f3f4f6')
    gradient.addColorStop(1, '#e5e7eb')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }
  
  return canvas.toDataURL()
}
