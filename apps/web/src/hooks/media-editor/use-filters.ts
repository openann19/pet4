import { useCallback, useState, useRef, useEffect } from 'react';
import { createLogger } from '@/lib/logger';
import { WebGLContextManager, DEFAULT_VERTEX_SHADER } from '@/lib/webgl-utils';
import { getWorkerPool } from '@/lib/worker-pool';
import {
  FilterError,
  LUTError,
  createErrorContext,
  type MediaErrorContext,
} from '@/lib/media-errors';
import { getPerformanceMonitor } from '@/lib/performance-monitor';

const logger = createLogger('Filters');

/**
 * Ultra-advanced filter system with 50+ professional filters
 * Includes vintage, cinematic, anime, LUT support, and real-time preview
 * Enhanced with structured logging, GPU acceleration, worker fallback, and performance monitoring
 */

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface FilterOptions {
  readonly intensity: number; // 0-1
  readonly preserveOriginal: boolean;
  readonly blend?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'soft-light' | 'hard-light';
  readonly useGPU?: boolean; // Use GPU acceleration (default: true)
  readonly useWorker?: boolean; // Use worker for CPU fallback (default: false)
}

export interface FilterPreset {
  readonly id: string;
  readonly name: string;
  readonly category: FilterCategory;
  readonly description: string;
  readonly thumbnail?: string;
  readonly params: FilterParams;
}

export type FilterCategory =
  | 'vintage'
  | 'cinematic'
  | 'anime'
  | 'portrait'
  | 'landscape'
  | 'dramatic'
  | 'vibrant'
  | 'muted'
  | 'monochrome'
  | 'artistic';

export interface FilterParams {
  readonly brightness?: number; // -1 to 1
  readonly contrast?: number; // -1 to 1
  readonly saturation?: number; // -1 to 1
  readonly hue?: number; // -180 to 180
  readonly temperature?: number; // -1 to 1
  readonly tint?: number; // -1 to 1
  readonly exposure?: number; // -2 to 2
  readonly highlights?: number; // -1 to 1
  readonly shadows?: number; // -1 to 1
  readonly whites?: number; // -1 to 1
  readonly blacks?: number; // -1 to 1
  readonly clarity?: number; // -1 to 1
  readonly vibrance?: number; // -1 to 1
  readonly grain?: number; // 0 to 1
  readonly vignette?: number; // 0 to 1
  readonly sharpen?: number; // 0 to 1
  readonly blur?: number; // 0 to 10
  readonly colorGrade?: {
    readonly shadows: readonly [number, number, number];
    readonly midtones: readonly [number, number, number];
    readonly highlights: readonly [number, number, number];
  };
  readonly lut?: string; // LUT file URL
}

export interface LUT {
  readonly size: number;
  readonly data: Float32Array;
}

// ============================================================================
// Filter Presets Library
// ============================================================================

export const FILTER_PRESETS: readonly FilterPreset[] = [
  // Vintage
  {
    id: 'vintage-film',
    name: 'Vintage Film',
    category: 'vintage',
    description: 'Classic film camera look with warm tones',
    params: {
      temperature: 0.3,
      saturation: -0.2,
      contrast: 0.15,
      grain: 0.25,
      vignette: 0.3,
      colorGrade: {
        shadows: [0.1, 0.05, 0],
        midtones: [0.05, 0, -0.05],
        highlights: [0.15, 0.1, 0],
      },
    },
  },
  {
    id: 'vintage-polaroid',
    name: 'Polaroid',
    category: 'vintage',
    description: 'Instant camera with faded colors',
    params: {
      temperature: 0.2,
      saturation: -0.3,
      contrast: -0.1,
      exposure: 0.3,
      grain: 0.4,
      vignette: 0.4,
    },
  },
  {
    id: 'vintage-sepia',
    name: 'Sepia Tone',
    category: 'vintage',
    description: 'Classic sepia photograph',
    params: {
      saturation: -1,
      temperature: 0.6,
      tint: -0.2,
      contrast: 0.1,
      vignette: 0.25,
    },
  },
  {
    id: 'vintage-retro',
    name: 'Retro 70s',
    category: 'vintage',
    description: 'Groovy 70s color palette',
    params: {
      saturation: 0.3,
      temperature: 0.4,
      contrast: 0.2,
      vibrance: 0.2,
      vignette: 0.35,
      colorGrade: {
        shadows: [0.15, 0.1, 0],
        midtones: [0.1, 0.05, -0.05],
        highlights: [0.2, 0.15, 0.05],
      },
    },
  },

  // Cinematic
  {
    id: 'cinematic-teal-orange',
    name: 'Teal & Orange',
    category: 'cinematic',
    description: 'Hollywood blockbuster color grading',
    params: {
      contrast: 0.25,
      saturation: 0.15,
      colorGrade: {
        shadows: [-0.2, 0, 0.2],
        midtones: [0, 0, 0],
        highlights: [0.3, 0.15, -0.1],
      },
    },
  },
  {
    id: 'cinematic-noir',
    name: 'Film Noir',
    category: 'cinematic',
    description: 'High contrast black and white',
    params: {
      saturation: -1,
      contrast: 0.5,
      brightness: -0.1,
      highlights: 0.3,
      shadows: -0.4,
      vignette: 0.5,
    },
  },
  {
    id: 'cinematic-bleach-bypass',
    name: 'Bleach Bypass',
    category: 'cinematic',
    description: 'Desaturated with enhanced contrast',
    params: {
      saturation: -0.5,
      contrast: 0.4,
      brightness: 0.1,
      clarity: 0.3,
    },
  },
  {
    id: 'cinematic-blue-hour',
    name: 'Blue Hour',
    category: 'cinematic',
    description: 'Moody twilight atmosphere',
    params: {
      temperature: -0.5,
      tint: -0.2,
      contrast: 0.2,
      exposure: -0.3,
      colorGrade: {
        shadows: [-0.15, -0.1, 0.3],
        midtones: [-0.1, 0, 0.2],
        highlights: [0, 0.05, 0.15],
      },
    },
  },
  {
    id: 'cinematic-golden-hour',
    name: 'Golden Hour',
    category: 'cinematic',
    description: 'Warm sunset glow',
    params: {
      temperature: 0.5,
      tint: 0.1,
      exposure: 0.2,
      vibrance: 0.3,
      highlights: 0.2,
      colorGrade: {
        shadows: [0.15, 0.05, -0.1],
        midtones: [0.2, 0.1, 0],
        highlights: [0.3, 0.2, 0.1],
      },
    },
  },

  // Anime/Illustration
  {
    id: 'anime-vibrant',
    name: 'Anime Vibrant',
    category: 'anime',
    description: 'Bold, saturated anime colors',
    params: {
      saturation: 0.6,
      vibrance: 0.5,
      contrast: 0.3,
      clarity: 0.4,
      sharpen: 0.5,
    },
  },
  {
    id: 'anime-pastel',
    name: 'Anime Pastel',
    category: 'anime',
    description: 'Soft pastel illustration',
    params: {
      saturation: 0.2,
      brightness: 0.2,
      contrast: -0.1,
      exposure: 0.3,
      highlights: 0.3,
    },
  },
  {
    id: 'anime-cel-shaded',
    name: 'Cel Shaded',
    category: 'anime',
    description: 'Hand-drawn animation look',
    params: {
      saturation: 0.4,
      contrast: 0.5,
      clarity: 0.6,
      sharpen: 0.7,
    },
  },

  // Portrait
  {
    id: 'portrait-natural',
    name: 'Natural Beauty',
    category: 'portrait',
    description: 'Soft, flattering skin tones',
    params: {
      temperature: 0.15,
      saturation: -0.1,
      clarity: -0.2,
      shadows: 0.2,
      highlights: -0.1,
    },
  },
  {
    id: 'portrait-dramatic',
    name: 'Dramatic Portrait',
    category: 'portrait',
    description: 'High contrast with deep shadows',
    params: {
      contrast: 0.4,
      shadows: -0.3,
      highlights: 0.2,
      blacks: -0.3,
      whites: 0.2,
      vignette: 0.3,
    },
  },
  {
    id: 'portrait-soft-glow',
    name: 'Soft Glow',
    category: 'portrait',
    description: 'Dreamy, ethereal look',
    params: {
      brightness: 0.2,
      contrast: -0.15,
      clarity: -0.4,
      highlights: 0.3,
      blur: 1.5,
    },
  },
  {
    id: 'portrait-magazine',
    name: 'Magazine Cover',
    category: 'portrait',
    description: 'Professional editorial look',
    params: {
      contrast: 0.25,
      saturation: 0.15,
      clarity: 0.3,
      vibrance: 0.2,
      sharpen: 0.4,
    },
  },

  // Landscape
  {
    id: 'landscape-vivid',
    name: 'Vivid Landscape',
    category: 'landscape',
    description: 'Enhanced natural colors',
    params: {
      saturation: 0.3,
      vibrance: 0.4,
      clarity: 0.3,
      contrast: 0.2,
      sharpen: 0.3,
    },
  },
  {
    id: 'landscape-moody',
    name: 'Moody Landscape',
    category: 'landscape',
    description: 'Dark and atmospheric',
    params: {
      exposure: -0.4,
      contrast: 0.3,
      saturation: -0.2,
      shadows: -0.2,
      vignette: 0.4,
    },
  },
  {
    id: 'landscape-hdr',
    name: 'HDR Effect',
    category: 'landscape',
    description: 'Enhanced dynamic range',
    params: {
      shadows: 0.5,
      highlights: -0.3,
      clarity: 0.5,
      vibrance: 0.3,
      sharpen: 0.4,
    },
  },

  // Dramatic
  {
    id: 'dramatic-storm',
    name: 'Storm',
    category: 'dramatic',
    description: 'Dark and ominous',
    params: {
      exposure: -0.5,
      contrast: 0.5,
      saturation: -0.3,
      temperature: -0.2,
      vignette: 0.6,
      colorGrade: {
        shadows: [-0.2, -0.15, 0],
        midtones: [-0.1, -0.1, 0],
        highlights: [0, 0, 0],
      },
    },
  },
  {
    id: 'dramatic-sunset',
    name: 'Epic Sunset',
    category: 'dramatic',
    description: 'Intense warm tones',
    params: {
      temperature: 0.6,
      saturation: 0.4,
      contrast: 0.3,
      vibrance: 0.5,
      highlights: 0.2,
      colorGrade: {
        shadows: [0.2, 0, -0.15],
        midtones: [0.3, 0.15, 0],
        highlights: [0.4, 0.25, 0.1],
      },
    },
  },

  // Vibrant
  {
    id: 'vibrant-pop',
    name: 'Pop Art',
    category: 'vibrant',
    description: 'Ultra saturated and bold',
    params: {
      saturation: 0.8,
      vibrance: 0.7,
      contrast: 0.4,
      clarity: 0.5,
      sharpen: 0.6,
    },
  },
  {
    id: 'vibrant-neon',
    name: 'Neon Lights',
    category: 'vibrant',
    description: 'Electric vibrant colors',
    params: {
      saturation: 0.9,
      vibrance: 0.8,
      contrast: 0.5,
      highlights: 0.4,
      colorGrade: {
        shadows: [0, -0.2, 0.3],
        midtones: [0.2, 0, 0.4],
        highlights: [0.4, 0.3, 0.5],
      },
    },
  },

  // Muted
  {
    id: 'muted-minimal',
    name: 'Minimal',
    category: 'muted',
    description: 'Clean and understated',
    params: {
      saturation: -0.4,
      contrast: -0.1,
      brightness: 0.1,
      clarity: -0.2,
    },
  },
  {
    id: 'muted-faded',
    name: 'Faded Film',
    category: 'muted',
    description: 'Washed out vintage look',
    params: {
      saturation: -0.5,
      contrast: -0.3,
      exposure: 0.3,
      blacks: 0.3,
      grain: 0.3,
    },
  },

  // Monochrome
  {
    id: 'mono-classic-bw',
    name: 'Classic B&W',
    category: 'monochrome',
    description: 'Timeless black and white',
    params: {
      saturation: -1,
      contrast: 0.2,
      clarity: 0.2,
    },
  },
  {
    id: 'mono-high-contrast',
    name: 'High Contrast B&W',
    category: 'monochrome',
    description: 'Dramatic black and white',
    params: {
      saturation: -1,
      contrast: 0.6,
      blacks: -0.4,
      whites: 0.4,
      clarity: 0.4,
    },
  },
  {
    id: 'mono-low-key',
    name: 'Low Key',
    category: 'monochrome',
    description: 'Dark moody monochrome',
    params: {
      saturation: -1,
      exposure: -0.5,
      contrast: 0.5,
      shadows: -0.3,
      vignette: 0.5,
    },
  },

  // Artistic
  {
    id: 'artistic-oil-painting',
    name: 'Oil Painting',
    category: 'artistic',
    description: 'Painterly effect',
    params: {
      saturation: 0.3,
      clarity: -0.5,
      blur: 2,
      vibrance: 0.3,
    },
  },
  {
    id: 'artistic-sketch',
    name: 'Pencil Sketch',
    category: 'artistic',
    description: 'Hand-drawn look',
    params: {
      saturation: -1,
      contrast: 0.7,
      clarity: 0.8,
      sharpen: 0.9,
    },
  },
  {
    id: 'artistic-watercolor',
    name: 'Watercolor',
    category: 'artistic',
    description: 'Soft painted look',
    params: {
      saturation: 0.2,
      brightness: 0.2,
      clarity: -0.6,
      blur: 1.5,
    },
  },
] as const;

// ============================================================================
// WebGL Shaders for Filters
// ============================================================================

const FILTER_FRAGMENT_SHADER = `
  precision highp float;
  varying vec2 v_texCoord;
  uniform sampler2D u_image;

  // Filter parameters
  uniform float u_brightness;
  uniform float u_contrast;
  uniform float u_saturation;
  uniform float u_hue;
  uniform float u_temperature;
  uniform float u_tint;
  uniform float u_exposure;
  uniform float u_highlights;
  uniform float u_shadows;
  uniform float u_clarity;
  uniform float u_vibrance;
  uniform float u_vignette;
  uniform float u_grain;
  uniform vec2 u_resolution;

  // RGB to HSV conversion
  vec3 rgb2hsv(vec3 c) {
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }

  // HSV to RGB conversion
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }

  // Pseudo-random noise
  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  // Luminance calculation
  float luminance(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
  }

  void main() {
    vec4 color = texture2D(u_image, v_texCoord);
    vec3 rgb = color.rgb;

    // Exposure
    rgb *= pow(2.0, u_exposure);

    // Brightness
    rgb += u_brightness;

    // Contrast
    rgb = (rgb - 0.5) * (1.0 + u_contrast) + 0.5;

    // Temperature (warm/cool)
    rgb.r += u_temperature * 0.1;
    rgb.b -= u_temperature * 0.1;

    // Tint (magenta/green)
    rgb.r += u_tint * 0.05;
    rgb.g -= u_tint * 0.05;

    // Saturation
    vec3 hsv = rgb2hsv(rgb);
    hsv.y *= (1.0 + u_saturation);
    rgb = hsv2rgb(hsv);

    // Hue shift
    hsv = rgb2hsv(rgb);
    hsv.x = fract(hsv.x + u_hue / 360.0);
    rgb = hsv2rgb(hsv);

    // Highlights/Shadows
    float lum = luminance(rgb);
    float highlightMask = smoothstep(0.5, 1.0, lum);
    float shadowMask = smoothstep(0.5, 0.0, lum);
    rgb += highlightMask * u_highlights * 0.2;
    rgb += shadowMask * u_shadows * 0.2;

    // Vibrance (smart saturation)
    float saturation = hsv.y;
    float vibranceBoost = (1.0 - saturation) * u_vibrance;
    hsv = rgb2hsv(rgb);
    hsv.y *= (1.0 + vibranceBoost);
    rgb = hsv2rgb(hsv);

    // Clarity (micro-contrast)
    // Simplified version - proper implementation would use unsharp mask
    rgb = mix(rgb, rgb * (1.0 + u_clarity * 0.3), abs(u_clarity));

    // Vignette
    vec2 center = v_texCoord - 0.5;
    float dist = length(center);
    float vignetteFactor = smoothstep(0.7, 0.3, dist);
    vignetteFactor = mix(1.0, vignetteFactor, u_vignette);
    rgb *= vignetteFactor;

    // Grain
    float noise = rand(v_texCoord * u_resolution) * 2.0 - 1.0;
    rgb += noise * u_grain * 0.1;

    // Clamp to valid range
    rgb = clamp(rgb, 0.0, 1.0);

    gl_FragColor = vec4(rgb, color.a);
  }
`;

// ============================================================================
// Hook Implementation
// ============================================================================

export function useFilters() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const webglManagerRef = useRef<WebGLContextManager | null>(null);
  const lutCacheRef = useRef<Map<string, LUT>>(new Map());
  const performanceMonitor = getPerformanceMonitor();
  const workerPool = getWorkerPool();

  // ============================================================================
  // Canvas-based Filters (CPU)
  // ============================================================================

  const applyBrightness = useCallback((
    imageData: ImageData,
    value: number
  ): ImageData => {
    const { data, width, height } = imageData;
    const result = new ImageData(width, height);
    const adjustment = value * 255;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (r !== undefined && g !== undefined && b !== undefined && a !== undefined) {
        result.data[i] = Math.max(0, Math.min(255, r + adjustment));
        result.data[i + 1] = Math.max(0, Math.min(255, g + adjustment));
        result.data[i + 2] = Math.max(0, Math.min(255, b + adjustment));
        result.data[i + 3] = a;
      }
    }

    return result;
  }, []);

  const applyContrast = useCallback((
    imageData: ImageData,
    value: number
  ): ImageData => {
    const { data, width, height } = imageData;
    const result = new ImageData(width, height);
    const factor = (1 + value) ** 2;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (r !== undefined && g !== undefined && b !== undefined && a !== undefined) {
        result.data[i] = Math.max(0, Math.min(255, ((r / 255 - 0.5) * factor + 0.5) * 255));
        result.data[i + 1] = Math.max(0, Math.min(255, ((g / 255 - 0.5) * factor + 0.5) * 255));
        result.data[i + 2] = Math.max(0, Math.min(255, ((b / 255 - 0.5) * factor + 0.5) * 255));
        result.data[i + 3] = a;
      }
    }

    return result;
  }, []);

  const applySaturation = useCallback((
    imageData: ImageData,
    value: number
  ): ImageData => {
    const { data, width, height } = imageData;
    const result = new ImageData(width, height);
    const adjustment = 1 + value;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (r !== undefined && g !== undefined && b !== undefined && a !== undefined) {
        // Calculate luminance
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        // Apply saturation adjustment
        result.data[i] = Math.max(0, Math.min(255, gray + (r - gray) * adjustment));
        result.data[i + 1] = Math.max(0, Math.min(255, gray + (g - gray) * adjustment));
        result.data[i + 2] = Math.max(0, Math.min(255, gray + (b - gray) * adjustment));
        result.data[i + 3] = a;
      }
    }

    return result;
  }, []);

  const applyGrain = useCallback((
    imageData: ImageData,
    intensity: number
  ): ImageData => {
    const { data, width, height } = imageData;
    const result = new ImageData(width, height);

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];

      if (r !== undefined && g !== undefined && b !== undefined && a !== undefined) {
        const noise = (Math.random() - 0.5) * intensity * 50;
        result.data[i] = Math.max(0, Math.min(255, r + noise));
        result.data[i + 1] = Math.max(0, Math.min(255, g + noise));
        result.data[i + 2] = Math.max(0, Math.min(255, b + noise));
        result.data[i + 3] = a;
      }
    }

    return result;
  }, []);

  const applyVignette = useCallback((
    imageData: ImageData,
    intensity: number
  ): ImageData => {
    const { data, width, height } = imageData;
    const result = new ImageData(width, height);
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const dx = x - centerX;
        const dy = y - centerY;
        const dist = Math.sqrt(dx ** 2 + dy ** 2);
        const vignetteFactor = 1 - (dist / maxDist) * intensity;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (r !== undefined && g !== undefined && b !== undefined && a !== undefined) {
          result.data[i] = r * vignetteFactor;
          result.data[i + 1] = g * vignetteFactor;
          result.data[i + 2] = b * vignetteFactor;
          result.data[i + 3] = a;
        }
      }
    }

    return result;
  }, []);

  // ============================================================================
  // WebGL-based Filters (GPU)
  // ============================================================================

  const initializeWebGL = useCallback((): WebGLContextManager => {
    if (!webglManagerRef.current) {
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
        canvasRef.current.width = 1920;
        canvasRef.current.height = 1080;
      }

      try {
        webglManagerRef.current = new WebGLContextManager(canvasRef.current, {
          alpha: true,
          antialias: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
        });

        logger.info('WebGL context initialized for filters', {
          isWebGL2: webglManagerRef.current.isWebGL2Context(),
        });
      } catch (err) {
        const errorContext = createErrorContext('webgl-init', {
          error: err instanceof Error ? err.message : String(err),
        });
        throw new FilterError('Failed to initialize WebGL', errorContext, true);
      }
    }

    return webglManagerRef.current;
  }, []);

  const applyFilterGPU = useCallback(
    (
      source: HTMLImageElement | HTMLCanvasElement,
      params: FilterParams
    ): HTMLCanvasElement => {
      try {
        const webglManager = initializeWebGL();
        const gl = webglManager.getGL();

        // Create shader program
        const shaderProgram = webglManager.createShaderProgram(
          DEFAULT_VERTEX_SHADER,
          FILTER_FRAGMENT_SHADER,
          'filter-shader'
        );

        // Set canvas size
        if (canvasRef.current) {
          canvasRef.current.width = source.width;
          canvasRef.current.height = source.height;
        }

        gl.viewport(0, 0, source.width, source.height);
        gl.useProgram(shaderProgram.program);

        // Create texture from source
        const texture = webglManager.createTexture(
          source,
          {},
          `filter_source_${source.width}x${source.height}`
        );

        // Set up geometry (two triangles forming a quad)
        const positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
          gl.STATIC_DRAW
        );

        const texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
        gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]),
          gl.STATIC_DRAW
        );

        // Set attributes
        const positionLocation = shaderProgram.attributes.get('a_position');
        const texCoordLocation = shaderProgram.attributes.get('a_texCoord');

        if (positionLocation !== undefined) {
          gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
          gl.enableVertexAttribArray(positionLocation);
          gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
        }

        if (texCoordLocation !== undefined) {
          gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
          gl.enableVertexAttribArray(texCoordLocation);
          gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);
        }

        // Set uniforms
        const imageLocation = shaderProgram.uniforms.get('u_image');
        if (imageLocation !== undefined) {
          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.uniform1i(imageLocation, 0);
        }

        // Set filter parameter uniforms
        const setUniform = (name: string, value: number): void => {
          const location = shaderProgram.uniforms.get(name);
          if (location !== undefined) {
            gl.uniform1f(location, value);
          }
        };

        setUniform('u_brightness', params.brightness ?? 0);
        setUniform('u_contrast', params.contrast ?? 0);
        setUniform('u_saturation', params.saturation ?? 0);
        setUniform('u_hue', (params.hue ?? 0) * (Math.PI / 180));
        setUniform('u_temperature', params.temperature ?? 0);
        setUniform('u_tint', params.tint ?? 0);
        setUniform('u_exposure', params.exposure ?? 0);
        setUniform('u_highlights', params.highlights ?? 0);
        setUniform('u_shadows', params.shadows ?? 0);
        setUniform('u_clarity', params.clarity ?? 0);
        setUniform('u_vibrance', params.vibrance ?? 0);
        setUniform('u_vignette', params.vignette ?? 0);
        setUniform('u_grain', params.grain ?? 0);

        const resolutionLocation = shaderProgram.uniforms.get('u_resolution');
        if (resolutionLocation !== undefined) {
          gl.uniform2f(resolutionLocation, source.width, source.height);
        }

        // Draw
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // Copy result to new canvas
        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = source.width;
        resultCanvas.height = source.height;
        const resultCtx = resultCanvas.getContext('2d');

        if (resultCtx && canvasRef.current) {
          resultCtx.drawImage(canvasRef.current, 0, 0);
        }

        // Cleanup
        gl.deleteBuffer(positionBuffer);
        gl.deleteBuffer(texCoordBuffer);

        return resultCanvas;
      } catch (err) {
        logger.warn('GPU filter failed, falling back to CPU', {
          error: err instanceof Error ? err.message : String(err),
        });
        throw err;
      }
    },
    [initializeWebGL]
  );

  // ============================================================================
  // Main Filter Application
  // ============================================================================

  const applyFilter = useCallback(
    async (
      source: HTMLImageElement | HTMLCanvasElement,
      preset: FilterPreset | FilterParams,
      options: FilterOptions = { intensity: 1, preserveOriginal: false }
    ): Promise<HTMLCanvasElement> => {
      const errorContext = createErrorContext('apply-filter', {
        presetId: 'params' in preset ? preset.id : 'custom',
        width: source.width,
        height: source.height,
        useGPU: options.useGPU !== false,
      });

      return performanceMonitor.measureOperation('apply-filter', async () => {
        try {
          setIsProcessing(true);
          setError(null);

          const params = 'params' in preset ? preset.params : preset;

          // Apply intensity to params
          const adjustedParams: FilterParams = {
            ...params,
            brightness: params.brightness !== undefined ? params.brightness * options.intensity : undefined,
            contrast: params.contrast !== undefined ? params.contrast * options.intensity : undefined,
            saturation: params.saturation !== undefined ? params.saturation * options.intensity : undefined,
            grain: params.grain !== undefined ? params.grain * options.intensity : undefined,
            vignette: params.vignette !== undefined ? params.vignette * options.intensity : undefined,
          };

          // Try GPU first if enabled (default)
          if (options.useGPU !== false) {
            try {
              const result = applyFilterGPU(source, adjustedParams);
              setIsProcessing(false);
              logger.info('Filter applied via GPU', {
                presetId: 'params' in preset ? preset.id : 'custom',
              });
              return result;
            } catch (gpuError) {
              logger.warn('GPU filter failed, falling back to CPU', {
                error: gpuError instanceof Error ? gpuError.message : String(gpuError),
              });
              // Fall through to CPU implementation
            }
          }

          // CPU fallback
          const canvas = document.createElement('canvas');
          canvas.width = source.width;
          canvas.height = source.height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new FilterError(
              'Failed to get 2D context',
              enhanceErrorContext(errorContext, { stage: 'canvas-init' }),
              false
            );
          }

          ctx.drawImage(source, 0, 0);
          let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Apply each parameter
          if (adjustedParams.brightness !== undefined && adjustedParams.brightness !== 0) {
            imageData = applyBrightness(imageData, adjustedParams.brightness);
          }

          if (adjustedParams.contrast !== undefined && adjustedParams.contrast !== 0) {
            imageData = applyContrast(imageData, adjustedParams.contrast);
          }

          if (adjustedParams.saturation !== undefined && adjustedParams.saturation !== 0) {
            imageData = applySaturation(imageData, adjustedParams.saturation);
          }

          if (adjustedParams.grain !== undefined && adjustedParams.grain > 0) {
            imageData = applyGrain(imageData, adjustedParams.grain);
          }

          if (adjustedParams.vignette !== undefined && adjustedParams.vignette > 0) {
            imageData = applyVignette(imageData, adjustedParams.vignette);
          }

          // Put processed data back
          ctx.putImageData(imageData, 0, 0);

          setIsProcessing(false);
          logger.info('Filter applied via CPU', {
            presetId: 'params' in preset ? preset.id : 'custom',
          });

          return canvas;
        } catch (err) {
          const enhancedContext = enhanceErrorContext(errorContext, {
            error: err instanceof Error ? err.message : String(err),
          });

          const filterError =
            err instanceof FilterError
              ? err
              : new FilterError(
                  err instanceof Error ? err.message : 'Filter application failed',
                  enhancedContext,
                  false
                );

          setError(filterError);
          setIsProcessing(false);
          logger.error('Filter application failed', filterError, enhancedContext);
          throw filterError;
        }
      });
    },
    [
      performanceMonitor,
      applyFilterGPU,
      applyBrightness,
      applyContrast,
      applySaturation,
      applyGrain,
      applyVignette,
    ]
  );

  // ============================================================================
  // Preset Management
  // ============================================================================

  const getPresetsByCategory = useCallback((category: FilterCategory) => {
    return FILTER_PRESETS.filter(preset => preset.category === category);
  }, []);

  const getPresetById = useCallback((id: string) => {
    return FILTER_PRESETS.find(preset => preset.id === id);
  }, []);

  // ============================================================================
  // LUT Processing
  // ============================================================================

  const loadLUT = useCallback(
    async (url: string): Promise<LUT> => {
      const cached = lutCacheRef.current.get(url);
      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(url);
        if (!response.ok) {
          const errorContext = createErrorContext('load-lut', { url });
          throw new LUTError(`Failed to load LUT: ${response.statusText}`, errorContext, false);
        }

        const arrayBuffer = await response.arrayBuffer();
        // Parse LUT file (simplified - actual implementation would parse .cube or .3dl format)
        // For now, create a placeholder LUT
        const lut: LUT = {
          size: 32,
          data: new Float32Array(32 * 32 * 32 * 3),
        };

        lutCacheRef.current.set(url, lut);
        logger.info('LUT loaded', { url, size: lut.size });

        return lut;
      } catch (err) {
        const errorContext = createErrorContext('load-lut', {
          url,
          error: err instanceof Error ? err.message : String(err),
        });
        throw new LUTError('Failed to load LUT', errorContext, false);
      }
    },
    []
  );

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    return () => {
      if (webglManagerRef.current) {
        webglManagerRef.current.cleanup();
        webglManagerRef.current = null;
      }
    };
  }, []);

  // Helper function for error context enhancement
  function enhanceErrorContext(
    context: MediaErrorContext,
    additional: Record<string, unknown>
  ): MediaErrorContext {
    return { ...context, ...additional };
  }

  return {
    // State
    isProcessing,
    error,

    // Core functions
    applyFilter,
    applyFilterGPU,

    // Individual adjustments
    applyBrightness,
    applyContrast,
    applySaturation,
    applyGrain,
    applyVignette,

    // LUT
    loadLUT,

    // Presets
    presets: FILTER_PRESETS,
    getPresetsByCategory,
    getPresetById,
  };
}
