'use client';

export interface ImagePrefetchOptions {
  priority?: 'low' | 'high';
  timeout?: number;
}

export interface PrefetchResult {
  success: boolean;
  url: string;
  error?: Error;
}

class ImagePrefetcher {
  private prefetchCache = new Set<string>();
  private loadingPromises = new Map<string, Promise<PrefetchResult>>();

  async prefetch(url: string, options: ImagePrefetchOptions = {}): Promise<PrefetchResult> {
    if (this.prefetchCache.has(url)) {
      return { success: true, url };
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const promise = this.loadImage(url, options);
    this.loadingPromises.set(url, promise);

    try {
      const result = await promise;
      if (result.success) {
        this.prefetchCache.add(url);
      }
      return result;
    } finally {
      this.loadingPromises.delete(url);
    }
  }

  async prefetchBatch(
    urls: string[],
    options: ImagePrefetchOptions = {}
  ): Promise<PrefetchResult[]> {
    return Promise.all(urls.map((url) => this.prefetch(url, options)));
  }

  private loadImage(url: string, options: ImagePrefetchOptions): Promise<PrefetchResult> {
    return new Promise((resolve) => {
      const timeout = options.timeout ?? 10000;
      const timeoutId = setTimeout(() => {
        resolve({
          success: false,
          url,
          error: new Error('Image prefetch timeout'),
        });
      }, timeout);

      const img = new Image();

      img.onload = () => {
        clearTimeout(timeoutId);
        resolve({ success: true, url });
      };

      img.onerror = (error) => {
        clearTimeout(timeoutId);
        resolve({
          success: false,
          url,
          error: _error instanceof Error ? _error : new Error('Image load failed'),
        });
      };

      if (options.priority === 'high') {
        img.fetchPriority = 'high';
      }

      img.src = url;
    });
  }

  isPrefetched(url: string): boolean {
    return this.prefetchCache.has(url);
  }

  clearCache(): void {
    this.prefetchCache.clear();
    this.loadingPromises.clear();
  }
}

export const imagePrefetcher = new ImagePrefetcher();
