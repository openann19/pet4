import { isTruthy, isDefined } from '@petspark/shared';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface OptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

export async function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export async function optimizeImage(file: File, options: OptimizationOptions = {}): Promise<Blob> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.85, format = 'jpeg' } = options;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      let { width, height } = img;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        },
        `image/${String(format ?? '')}`,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export function createThumbnail(file: File, size = 200): Promise<Blob> {
  return optimizeImage(file, {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    format: 'jpeg',
  });
}

export function getAspectRatio(dimensions: ImageDimensions): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(dimensions.width, dimensions.height);
  return `${dimensions.width / divisor}:${dimensions.height / divisor}`;
}

export function calculateResponsiveSizes(originalWidth: number, _viewportWidth: number): string {
  const breakpoints = [320, 640, 768, 1024, 1280, 1536];
  return (
    breakpoints
      .filter((bp) => bp <= originalWidth)
      .map((bp) => `(max-width: ${bp}px) ${bp}px`)
      .join(', ') + `, ${originalWidth}px`
  );
}

export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private images = new Map<HTMLImageElement, string>();

  constructor(options: IntersectionObserverInit = {}) {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = this.images.get(img);

            if (src) {
              this.loadImage(img, src);
            }
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
        ...options,
      }
    );
  }

  observe(img: HTMLImageElement, src: string) {
    if (!this.observer) {
      img.src = src;
      return;
    }

    this.images.set(img, src);
    this.observer.observe(img);
  }

  private loadImage(img: HTMLImageElement, src: string) {
    const tempImg = new Image();
    tempImg.onload = () => {
      img.src = src;
      img.classList.add('loaded');
      this.unobserve(img);
    };
    tempImg.onerror = () => {
      img.classList.add('error');
      this.unobserve(img);
    };
    tempImg.src = src;
  }

  unobserve(img: HTMLImageElement) {
    if (this.observer) {
      this.observer.unobserve(img);
      this.images.delete(img);
    }
  }

  disconnect() {
    if (this.observer) {
      this.observer.disconnect();
      this.images.clear();
    }
  }
}

export const lazyImageLoader = new LazyImageLoader();

export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(
    urls.map(
      (url) =>
        new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = url;
        })
    )
  );
}

export function isImageCached(url: string): boolean {
  const img = new Image();
  img.src = url;
  return img.complete;
}

export function generatePlaceholderDataUrl(
  width: number,
  height: number,
  color = '#f0f0f0'
): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${String(width ?? '')}" height="${String(height ?? '')}">
      <rect width="100%" height="100%" fill="${String(color ?? '')}"/>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export async function convertImageToWebP(file: File): Promise<Blob> {
  return optimizeImage(file, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85,
    format: 'webp',
  });
}
