export interface AdvancedImageOptions {
  src: string;
  placeholder?: string;
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export interface ImageState {
  isLoading: boolean;
  isError: boolean;
  src: string | null;
  naturalWidth: number;
  naturalHeight: number;
}

export class AdvancedImageLoader {
  private static cache = new Map<string, Promise<string>>();
  private static loadedImages = new Set<string>();

  static async preloadImage(src: string): Promise<string> {
    if (this.loadedImages.has(src)) {
      return src;
    }

    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    const promise = new Promise<string>((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        this.loadedImages.add(src);
        resolve(src);
      };

      img.onerror = () => {
        this.cache.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };

      img.src = src;
    });

    this.cache.set(src, promise);
    return promise;
  }

  static generatePlaceholder(width: number, height: number): string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return '';

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f0f0f0');
    gradient.addColorStop(1, '#e0e0e0');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    return canvas.toDataURL('image/jpeg', 0.1);
  }

  static generateBlurDataURL(imageSrc: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        canvas.width = 10;
        canvas.height = 10;

        ctx.filter = 'blur(10px)';
        ctx.drawImage(img, 0, 0, 10, 10);

        resolve(canvas.toDataURL('image/jpeg', 0.1));
      };

      img.onerror = reject;
      img.src = imageSrc;
    });
  }

  static getOptimizedSrcSet(
    src: string,
    widths: number[] = [320, 640, 768, 1024, 1280, 1920]
  ): string {
    return widths.map((width) => `${this.getOptimizedSrc(src, width)} ${width}w`).join(', ');
  }

  static getOptimizedSrc(src: string, width?: number, quality = 80): string {
    if (!width) return src;

    const url = new URL(src, window.location.origin);
    url.searchParams.set('w', width.toString());
    url.searchParams.set('q', quality.toString());

    return url.toString();
  }

  static async prefetchImages(srcs: string[]): Promise<void> {
    const promises = srcs.map((src) => this.preloadImage(src));
    await Promise.allSettled(promises);
  }

  static clearCache(): void {
    this.cache.clear();
    this.loadedImages.clear();
  }

  static isImageCached(src: string): boolean {
    return this.loadedImages.has(src);
  }

  static getCacheSize(): number {
    return this.loadedImages.size;
  }
}

export function useProgressiveImage(src: string, placeholderSrc?: string) {
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc ?? '');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!src) return;

    setIsLoading(true);
    setError(null);

    AdvancedImageLoader.preloadImage(src)
      .then(() => {
        setCurrentSrc(src);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err : new Error(String(err)));
        setIsLoading(false);
      });
  }, [src]);

  return { src: currentSrc, isLoading, error };
}

import { useState, useEffect } from 'react';

export function useImageState(src: string): ImageState {
  const [state, setState] = useState<ImageState>({
    isLoading: true,
    isError: false,
    src: null,
    naturalWidth: 0,
    naturalHeight: 0,
  });

  useEffect(() => {
    if (!src) {
      setState({
        isLoading: false,
        isError: true,
        src: null,
        naturalWidth: 0,
        naturalHeight: 0,
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, isError: false }));

    const img = new Image();

    img.onload = () => {
      setState({
        isLoading: false,
        isError: false,
        src,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
    };

    img.onerror = () => {
      setState({
        isLoading: false,
        isError: true,
        src: null,
        naturalWidth: 0,
        naturalHeight: 0,
      });
    };

    img.src = src;
  }, [src]);

  return state;
}
