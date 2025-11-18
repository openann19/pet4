import type {
  EditOptions,
  EditedMedia,
  FilterName,
  ImageOperation,
  MediaInput,
} from '@/core/types/media-types';
import { ImageOpsSchema } from '@/core/types/media-types';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ImageEngine');

function isWeb(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Filter color matrices mapped to filter names
 */
const FILTERS: Record<FilterName, (intensity: number) => number[]> = {
  none: () => [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0],
  mono: (t: number) => {
    const r = 0.299 * (1 - t) + t * 0.299;
    const g = 0.587 * (1 - t) + t * 0.587;
    const b = 0.114 * (1 - t) + t * 0.114;
    return [r, g, b, 0, 0, r, g, b, 0, 0, r, g, b, 0, 0, 0, 0, 0, 1, 0];
  },
  sepia: (t: number) => {
    return [
      0.393 * (1 - t) + 0.393 * t,
      0.769 * (1 - t) + 0.769 * t,
      0.189 * (1 - t) + 0.189 * t,
      0,
      0,
      0.349 * (1 - t) + 0.349 * t,
      0.686 * (1 - t) + 0.686 * t,
      0.168 * (1 - t) + 0.168 * t,
      0,
      0,
      0.272 * (1 - t) + 0.272 * t,
      0.534 * (1 - t) + 0.534 * t,
      0.131 * (1 - t) + 0.131 * t,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
    ];
  },
  cool: (t: number) => {
    const amount = t * 0.15;
    return [1 - amount, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1 + amount, 0, 0, 0, 0, 0, 1, 0];
  },
  warm: (t: number) => {
    const amount = t * 0.15;
    return [1 + amount, 0, 0, 0, 0, 0, 1 - amount, 0, 0, 0, 0, 0, 1 - amount, 0, 0, 0, 0, 0, 1, 0];
  },
  vivid: (t: number) => {
    const saturation = 1 + t * 0.35;
    return [
      0.299 * saturation,
      0.587 * saturation,
      0.114 * saturation,
      0,
      0,
      0.299 * (1 - saturation),
      0.587 * (1 - saturation) + saturation,
      0.114 * (1 - saturation),
      0,
      0,
      0.299 * (1 - saturation),
      0.587 * (1 - saturation),
      0.114 * (1 - saturation) + saturation,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
    ];
  },
  cinematic: (t: number) => {
    const contrast = 1 + t * 0.15;
    const saturation = 1 + t * 0.25;
    const brightness = 1 + t * 0.05;
    const temp = 1 + t * 0.08;
    return [
      contrast * temp * brightness,
      0,
      0,
      0,
      0,
      0,
      contrast * saturation * brightness,
      0,
      0,
      0,
      0,
      0,
      contrast * brightness,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
    ];
  },
};

/**
 * Load encoded image data from URI (works on web + native)
 */
async function loadEncoded(uri: string): Promise<Uint8Array> {
  if (uri.startsWith('http') || uri.startsWith('https')) {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

  if (isWeb()) {
    if (uri.startsWith('data:')) {
      const base64Data = uri.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid data URI format');
      }
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
  }

  if (!isWeb()) {
    const FileSystem = await import('expo-file-system');
    const readAsStringAsync = FileSystem.default.readAsStringAsync ?? FileSystem.readAsStringAsync;
    if (!readAsStringAsync) {
      throw new Error('readAsStringAsync not available in FileSystem module');
    }
    const base64 = await readAsStringAsync(uri, {
      encoding: 'base64' as const,
    });
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  throw new Error(`Unsupported URI scheme: ${uri}`);
}

/**
 * Apply image processing pipeline using Skia
 */
export async function applyImagePipeline(
  input: MediaInput,
  ops: ImageOperation[],
  opts: EditOptions = {}
): Promise<EditedMedia> {
  try {
    ImageOpsSchema.parse(ops);

    // Dynamic import for React Native Skia (only available in native environments)
    const { Skia } = await import('@shopify/react-native-skia');

    const encoded = await loadEncoded(input.uri);
    const skData = Skia.Data.fromBytes(encoded);
    const baseImage = Skia.Image.MakeImageFromEncoded(skData);

    if (!baseImage) {
      throw new Error('Unable to decode image from provided URI');
    }

    let w = input.width ?? baseImage.width();
    let h = input.height ?? baseImage.height();
    let current = baseImage;

    interface SkiaPaint {
      setColorFilter: (filter: unknown) => void;
      setImageFilter: (filter: unknown) => void;
      setAlphaf: (alpha: number) => void;
    }

    // Type guard for Skia.Paint instances
    function isSkiaPaint(paint: unknown): paint is SkiaPaint {
      return (
        typeof paint === 'object' &&
        paint !== null &&
        'setColorFilter' in paint &&
        'setImageFilter' in paint &&
        'setAlphaf' in paint
      );
    }

    // Helper to create and type-check Skia Paint
    function createSkiaPaint(): SkiaPaint {
      const paint = new Skia.Paint();
      if (!isSkiaPaint(paint)) {
        throw new Error('Skia.Paint() did not return expected interface');
      }
      return paint;
    }

    interface SkiaCanvas {
      clear: (color: ReturnType<typeof Skia.Color>) => void;
      drawImageRect: (...args: unknown[]) => void;
      drawImage: (image: unknown, x: number, y: number, paint?: unknown) => void;
      drawRect: (...args: unknown[]) => void;
      translate: (x: number, y: number) => void;
      rotate: (radians: number) => void;
      save: () => void;
      restore: () => void;
      scale: (sx: number, sy: number) => void;
    }

    function isSkiaCanvas(value: unknown): value is SkiaCanvas {
      if (typeof value !== 'object' || value === null) {
        return false;
      }
      const canvas = value as Record<string, unknown>;
      return (
        'clear' in canvas &&
        'drawImageRect' in canvas &&
        'drawImage' in canvas &&
        'translate' in canvas &&
        'rotate' in canvas &&
        'save' in canvas &&
        'restore' in canvas &&
        'scale' in canvas &&
        typeof canvas.clear === 'function' &&
        typeof canvas.drawImageRect === 'function' &&
        typeof canvas.drawImage === 'function'
      );
    }

    const run = (draw: (canvas: SkiaCanvas) => void, nextW = w, nextH = h): void => {
      const surface = Skia.Surface.MakeOffscreen(nextW, nextH);
      if (!surface) {
        throw new Error('Failed to create offscreen surface');
      }
      const canvas = surface.getCanvas();
      if (!canvas || !isSkiaCanvas(canvas)) {
        throw new Error('Failed to get canvas from surface');
      }
      draw(canvas);
      const snapshot = surface.makeImageSnapshot();
      if (!snapshot) {
        throw new Error('Failed to create image snapshot');
      }
      w = nextW;
      h = nextH;
      current = snapshot;
    };

    for (const op of ops) {
      switch (op.type) {
        case 'resize': {
          const nextW = Math.max(1, Math.round(op.width));
          const nextH = Math.max(1, Math.round(op.height));
          run(
            (canvas) => {
              const blackColor = Skia.Color('black');
              canvas.clear(blackColor);
              const paint = new Skia.Paint();
              canvas.drawImageRect(
                current,
                {
                  x: 0,
                  y: 0,
                  width: current.width(),
                  height: current.height(),
                },
                { x: 0, y: 0, width: nextW, height: nextH },
                paint
              );
            },
            nextW,
            nextH
          );
          break;
        }

        case 'crop': {
          const sx = Math.max(0, Math.min(op.x, w - 1));
          const sy = Math.max(0, Math.min(op.y, h - 1));
          const sw = Math.min(op.width, w - sx);
          const sh = Math.min(op.height, h - sy);
          run(
            (canvas) => {
              const paint = new Skia.Paint();
              canvas.drawImageRect(
                current,
                { x: sx, y: sy, width: sw, height: sh },
                { x: 0, y: 0, width: sw, height: sh },
                paint
              );
            },
            sw,
            sh
          );
          break;
        }

        case 'rotate': {
          const angle = ((op.degrees % 360) + 360) % 360;
          const radians = (angle * Math.PI) / 180;
          const cos = Math.abs(Math.cos(radians));
          const sin = Math.abs(Math.sin(radians));
          const nextW = Math.round(w * cos + h * sin);
          const nextH = Math.round(w * sin + h * cos);
          run(
            (canvas) => {
              const blackColor = Skia.Color('black');
              canvas.clear(blackColor);
              canvas.translate(nextW / 2, nextH / 2);
              canvas.rotate(radians);
              canvas.translate(-w / 2, -h / 2);
              const paint = new Skia.Paint();
              canvas.drawImage(current, 0, 0, paint);
            },
            nextW,
            nextH
          );
          break;
        }

        case 'flip': {
          run((canvas) => {
            canvas.save();
            const sx = op.axis === 'horizontal' ? -1 : 1;
            const sy = op.axis === 'vertical' ? -1 : 1;
            canvas.scale(sx, sy);
            const ox = op.axis === 'horizontal' ? -w : 0;
            const oy = op.axis === 'vertical' ? -h : 0;
            canvas.drawImage(current, ox, oy);
            canvas.restore();
          });
          break;
        }

        case 'adjust': {
          const b = op.brightness ?? 0;
          const c = op.contrast ?? 0;
          const s = op.saturation ?? 0;
          const t = op.temperature ?? 0;
          const e = op.exposure ?? 0;

          const matrix = [
            1 + c + b + e,
            0,
            0,
            0,
            0,
            0,
            1 + c + s + b + e,
            0,
            0,
            0,
            0,
            0,
            1 + c + b + e,
            0,
            0,
            0,
            0,
            0,
            1,
            0,
          ];

          if (t !== 0) {
            const val0 = matrix[0] ?? 0;
            const val10 = matrix[10] ?? 0;
            matrix[0] = val0 + t * 0.1;
            matrix[10] = val10 - t * 0.1;
          }

          run((canvas) => {
            const paint = createSkiaPaint();
            const colorFilter = Skia.ColorFilter.MakeMatrix(matrix);
            paint.setColorFilter(colorFilter);
            canvas.drawImage(current, 0, 0, paint);
          });
          break;
        }

        case 'blur': {
          const r = Math.max(0, op.radius);
          run((canvas) => {
            const paint = createSkiaPaint();
            const imageFilter = Skia.ImageFilter.MakeBlur(r, r, 'clamp' as never);
            paint.setImageFilter(imageFilter);
            canvas.drawImage(current, 0, 0, paint);
          });
          break;
        }

        case 'filter': {
          const intensity = op.intensity ?? 1;
          const m = FILTERS[op.name](intensity);
          run((canvas) => {
            const paint = createSkiaPaint();
            const colorFilter = Skia.ColorFilter.MakeMatrix(m);
            paint.setColorFilter(colorFilter);
            canvas.drawImage(current, 0, 0, paint);
          });
          break;
        }

        case 'watermark': {
          const wmData = await loadEncoded(op.uri);
          const wmSkData = Skia.Data.fromBytes(wmData);
          const wmImg = Skia.Image.MakeImageFromEncoded(wmSkData);
          if (!wmImg) {
            throw new Error('Failed to decode watermark image');
          }
          const wmScale = op.scale ?? 1;
          const tw = Math.round(wmImg.width() * wmScale);
          const th = Math.round(wmImg.height() * wmScale);
          run((canvas) => {
            const paint = createSkiaPaint();
            if (op.opacity !== undefined) {
              paint.setAlphaf(op.opacity);
            }
            canvas.drawImageRect(
              wmImg,
              {
                x: 0,
                y: 0,
                width: wmImg.width(),
                height: wmImg.height(),
              },
              { x: op.x, y: op.y, width: tw, height: th },
              paint
            );
            canvas.drawImage(current, 0, 0);
          });
          break;
        }
      }
    }

    const isPng = (opts.imageFormat ?? 'jpeg') === 'png';
    const q = Math.round((opts.quality ?? 0.9) * 100);
    const formatCode: 0 | 1 = isPng ? 1 : 0;
    const outB64 = current.encodeToBase64(formatCode as never, q);

    if (!outB64) {
      throw new Error('Failed to encode output image');
    }

    if (isWeb()) {
      const mimeType = isPng ? 'image/png' : 'image/jpeg';
      const uri = `data:${mimeType};base64,${outB64}`;
      return { type: 'image', uri, width: w, height: h };
    }

    const FileSystemModule = await import('expo-file-system');
    const FileSystem = FileSystemModule.default ?? FileSystemModule.FileSystem ?? FileSystemModule;
    const ext = isPng ? 'png' : 'jpg';

    // Type guard for FileSystem object
    if (typeof FileSystem !== 'object' || FileSystem === null) {
      throw new Error('FileSystem module is not available');
    }

    // Type guard for FileSystem object properties
    function isFileSystemRecord(obj: unknown): obj is Record<string, unknown> {
      return typeof obj === 'object' && obj !== null;
    }

    const fs = isFileSystemRecord(FileSystem) ? FileSystem : null;
    if (!fs) {
      throw new Error('FileSystem module is not available');
    }
    const cacheDir =
      'cacheDirectory' in fs && typeof fs.cacheDirectory === 'string'
        ? fs.cacheDirectory
        : null;
    if (!cacheDir) {
      throw new Error('File system cache directory not available');
    }
    const outPath = `${cacheDir}edit-${Date.now()}.${ext}`;

    // Type guard for writeAsStringAsync function
    type WriteAsStringAsync = (path: string, content: string, options: { encoding: 'base64' }) => Promise<void>;

    let writeFn: WriteAsStringAsync | undefined;
    if ('writeAsStringAsync' in fs && typeof fs.writeAsStringAsync === 'function') {
      writeFn = fs.writeAsStringAsync as WriteAsStringAsync;
    } else if (
      'default' in fs &&
      fs.default !== null &&
      typeof fs.default === 'object' &&
      'writeAsStringAsync' in fs.default &&
      typeof (fs.default as Record<string, unknown>).writeAsStringAsync === 'function'
    ) {
      writeFn = (fs.default as Record<string, unknown>).writeAsStringAsync as WriteAsStringAsync;
    } else if (
      'writeAsStringAsync' in FileSystemModule &&
      typeof FileSystemModule.writeAsStringAsync === 'function'
    ) {
      writeFn = FileSystemModule.writeAsStringAsync as WriteAsStringAsync;
    }

    if (!writeFn) {
      throw new Error('writeAsStringAsync not available in FileSystem module');
    }

    await writeFn(outPath, outB64, {
      encoding: 'base64' as const,
    });

    // Type guard for getInfoAsync function
    type GetInfoAsync = (path: string) => Promise<{ exists: boolean; uri: string; size?: number }>;

    let getInfoFn: GetInfoAsync | undefined;
    if ('getInfoAsync' in fs && typeof fs.getInfoAsync === 'function') {
      getInfoFn = fs.getInfoAsync as GetInfoAsync;
    } else if (
      'default' in fs &&
      fs.default !== null &&
      typeof fs.default === 'object' &&
      'getInfoAsync' in fs.default &&
      typeof (fs.default as Record<string, unknown>).getInfoAsync === 'function'
    ) {
      getInfoFn = (fs.default as Record<string, unknown>).getInfoAsync as GetInfoAsync;
    } else if (
      'getInfoAsync' in FileSystemModule &&
      typeof FileSystemModule.getInfoAsync === 'function'
    ) {
      getInfoFn = FileSystemModule.getInfoAsync as GetInfoAsync;
    }

    if (!getInfoFn) {
      throw new Error('getInfoAsync not available in FileSystem module');
    }

    const info = await getInfoFn(outPath);
    return {
      type: 'image',
      uri: outPath,
      width: w,
      height: h,
      ...(info.size !== undefined && { bytes: info.size }),
    };
  } catch (_error) {
    const err = _error instanceof Error ? _error : new Error(String(_error));
    logger.error('Image pipeline failed', err, {
      inputUri: input.uri,
      operationCount: ops.length,
    });
    throw err;
  }
}
