import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, AnimatePresence, animate, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supportsWebP, supportsAVIF } from '@/lib/image-loader';
import { useUIConfig } from "@/hooks/use-ui-config";

interface ProgressiveImageProps {
  src: string;
  alt: string;
  placeholderSrc?: string;
  className?: string;
  containerClassName?: string;
  blurAmount?: number;
  aspectRatio?: string;
  priority?: boolean;
  sizes?: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export function ProgressiveImage({
  src,
  alt,
  placeholderSrc,
  className,
  containerClassName,
  blurAmount = 20,
  aspectRatio,
  priority = false,
  sizes,
  width,
  height,
  quality = 85,
  format = 'auto',
  onLoad,
  onError,
}: ProgressiveImageProps) {
    const _uiConfig = useUIConfig();
    const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc ?? src);
  const [error, setError] = useState(false);
  const [bestFormat, setBestFormat] = useState<'webp' | 'avif' | 'original'>('original');
  const imgRef = useRef<HTMLImageElement>(null);

  // Detect best format support
  useEffect(() => {
    if (format === 'auto') {
      let isMounted = true;
      supportsAVIF()
        .then((avifSupported) => {
          if (!isMounted) return;
          if (avifSupported) {
            setBestFormat('avif');
          } else if (supportsWebP()) {
            setBestFormat('webp');
          } else {
            setBestFormat('original');
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setBestFormat('original');
        });
      return () => {
        isMounted = false;
      };
    } else {
      setBestFormat(format);
    }
  }, [format]);

  const getOptimizedSrc = useCallback(
    (originalSrc: string): string => {
      if (bestFormat === 'original') return originalSrc;

      try {
        const url = new URL(originalSrc, window.location.origin);
        const params = new URLSearchParams(url.search);

        if (width) params.set('w', width.toString());
        if (height) params.set('h', height.toString());
        if (quality) params.set('q', quality.toString());
        params.set('fm', bestFormat);

        return `${url.pathname}?${params.toString()}`;
      } catch {
        return originalSrc;
      }
    },
    [bestFormat, width, height, quality]
  );

  const loadImage = useCallback(() => {
    const img = new Image();
    const optimizedSrc = getOptimizedSrc(src);

    img.onload = () => {
      setCurrentSrc(optimizedSrc);
      setIsLoaded(true);
      onLoad?.();
    };

    img.onerror = () => {
      // Fallback to original if optimized fails
      if (optimizedSrc !== src) {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          setCurrentSrc(src);
          setIsLoaded(true);
          onLoad?.();
        };
        fallbackImg.onerror = () => {
          const err = new Error(`Failed to load image: ${src}`);
          setError(true);
          onError?.(err);
        };
        fallbackImg.src = src;
      } else {
        const err = new Error(`Failed to load image: ${src}`);
        setError(true);
        onError?.(err);
      }
    };

    img.src = optimizedSrc;
  }, [src, getOptimizedSrc, onLoad, onError]);

  useEffect(() => {
    if (priority) {
      loadImage();
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src, priority, loadImage]);

  const placeholderOpacity = useMotionValue(1);
  const imageOpacity = useMotionValue(0);

  useEffect(() => {
    if (isLoaded) {
      animate(placeholderOpacity, 0, {
        duration: 0.3,
        ease: 'easeInOut',
      });
      animate(imageOpacity, 1, {
        duration: 0.3,
        ease: 'easeInOut',
      });
    }
  }, [isLoaded, placeholderOpacity, imageOpacity]);

  const placeholderVariants: Variants = {
    visible: {
      opacity: 1,
    },
    hidden: {
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
  };

  const imageVariants: Variants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <div className={cn('relative overflow-hidden', containerClassName)} style={{ aspectRatio }}>
      <AnimatePresence>
        {!isLoaded && placeholderSrc && (
          <motion.div
            key="placeholder"
            variants={placeholderVariants}
            initial="visible"
            animate={isLoaded ? "hidden" : "visible"}
            exit="hidden"
            style={{ opacity: placeholderOpacity }}
            className={cn('absolute inset-0 w-full h-full', className)}
          >
            <img
              ref={imgRef}
              src={placeholderSrc}
              alt={alt}
              className={cn('w-full h-full object-cover', className)}
              style={{ filter: `blur(${String(blurAmount ?? '')}px)` }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        variants={imageVariants}
        initial="hidden"
        animate={isLoaded ? "visible" : "hidden"}
        style={{ opacity: imageOpacity }}
        className={cn('w-full h-full', className)}
      >
        <img
          src={currentSrc}
          alt={alt}
          className={cn('w-full h-full object-cover', className)}
          sizes={sizes}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      </motion.div>

      {!isLoaded && !placeholderSrc && <div className="absolute inset-0 bg-muted animate-pulse" />}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground text-sm">
          Failed to load image
        </div>
      )}
    </div>
  );
}
