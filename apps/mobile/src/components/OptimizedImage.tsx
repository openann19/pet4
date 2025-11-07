/**
 * Optimized image component with caching
 * Location: src/components/OptimizedImage.tsx
 */

import { Image as ExpoImage, type ImageContentFit } from 'expo-image'
import React from 'react'
import type { ImageStyle } from 'react-native'

export interface OptimizedImageProps {
  uri: string
  width?: number
  height?: number
  style?: ImageStyle
  resizeMode?: ImageContentFit
  placeholder?: string
  priority?: 'low' | 'normal' | 'high'
}

export function OptimizedImage({
  uri,
  width,
  height,
  style,
  resizeMode = 'cover',
  placeholder,
  priority = 'normal',
}: OptimizedImageProps): React.JSX.Element {
  const imageStyle: ImageStyle[] = [
    width && { width },
    height && { height },
    style,
  ].filter(Boolean) as ImageStyle[]

  return (
    <ExpoImage
      source={{ uri }}
      style={imageStyle}
      contentFit={resizeMode}
      {...(placeholder !== undefined ? { placeholder } : {})}
      transition={200}
      cachePolicy="memory-disk"
      priority={priority}
      recyclingKey={uri}
    />
  )
}

