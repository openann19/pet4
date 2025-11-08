import { useState, useCallback } from 'react';
import { haptics } from '@/lib/haptics';

interface UsePhotoCarouselOptions {
  photos: string[];
  initialIndex?: number;
}

export function usePhotoCarousel({ photos, initialIndex = 0 }: UsePhotoCarouselOptions) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const nextPhoto = useCallback(() => {
    haptics.trigger('light');
    setCurrentIndex((prev) => (prev + 1) % photos.length);
  }, [photos.length]);

  const prevPhoto = useCallback(() => {
    haptics.trigger('light');
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
  }, [photos.length]);

  const goToPhoto = useCallback((index: number) => {
    haptics.trigger('selection');
    setCurrentIndex(index);
  }, []);

  const currentPhoto = photos[currentIndex] || '';
  const hasMultiplePhotos = photos.length > 1;

  return {
    currentIndex,
    currentPhoto,
    hasMultiplePhotos,
    totalPhotos: photos.length,
    nextPhoto,
    prevPhoto,
    goToPhoto,
  };
}
