'use client';

const isWeb = typeof window !== 'undefined';

/**
 * Generates video thumbnails at evenly spaced intervals
 * @param uri - Video URI (blob URL on web, file URI on native)
 * @param count - Number of thumbnails to generate (default: 8)
 * @returns Array of thumbnail URIs (data URLs on web, file URIs on native)
 */
export async function getVideoThumbnails(uri: string, count = 8): Promise<string[]> {
  if (isWeb) {
    return generateWebThumbnails(uri, count);
  }

  return generateNativeThumbnails(uri, count);
}

async function generateWebThumbnails(uri: string, count: number): Promise<string[]> {
  return new Promise<string[]>((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = uri;
    video.preload = 'auto';

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      resolve([]);
      return;
    }

    const frames: string[] = [];

    video.onloadedmetadata = async () => {
      const maxWidth = 320;
      const aspectRatio = video.videoWidth / video.videoHeight;
      canvas.width = Math.min(maxWidth, video.videoWidth);
      canvas.height = Math.round(canvas.width / aspectRatio);

      const duration = video.duration;
      const step = duration / (count + 1);

      let index = 1;

      const capture = (): void => {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        frames.push(dataUrl);

        index++;
        if (index > count) {
          resolve(frames);
        } else {
          seekTo(index * step);
        }
      };

      const seekTo = (time: number): void => {
        video.currentTime = Math.min(duration - 0.05, Math.max(0, time));
      };

      video.onseeked = capture;
      video.onerror = () => {
        resolve(frames);
      };

      seekTo(step);
    };

    video.onerror = () => {
      resolve([]);
    };
  });
}

async function generateNativeThumbnails(uri: string, count: number): Promise<string[]> {
  try {
    // Dynamic import to avoid bundling if not available
    const FFmpegKitModule = await import('ffmpeg-kit-react-native');
    const FFmpegKit =
      FFmpegKitModule.default ??
      (FFmpegKitModule as { FFmpegKit?: typeof FFmpegKitModule.default }).FFmpegKit;
    if (!FFmpegKit) {
      return [];
    }

    const FileSystemModule = await import('expo-file-system');
    const FileSystem = FileSystemModule.default ?? FileSystemModule;

    // Type assertion for expo-file-system API
    const fileSystem = FileSystem as {
      cacheDirectory?: string;
      makeDirectoryAsync?: (path: string, options?: { intermediates?: boolean }) => Promise<void>;
      getInfoAsync?: (path: string) => Promise<{ exists: boolean; [key: string]: unknown }>;
    };

    // Type guard to ensure FileSystem has the required methods
    if (
      !fileSystem ||
      typeof fileSystem.makeDirectoryAsync !== 'function' ||
      typeof fileSystem.getInfoAsync !== 'function'
    ) {
      return [];
    }

    const cacheDir = fileSystem.cacheDirectory;
    if (!cacheDir) {
      return [];
    }

    const outDir = `${cacheDir}thumbs_${Date.now()}/`;
    await fileSystem.makeDirectoryAsync(outDir, { intermediates: true });

    const thumbnails: string[] = [];
    const stepSec = 1.0;
    const targets = Array.from({ length: count }, (_, i) => (i + 1) * stepSec);

    for (let i = 0; i < targets.length; i++) {
      const outputPath = `${outDir}t${i}.jpg`;
      const args = `-y -ss ${targets[i]} -i "${uri}" -frames:v 1 -q:v 5 "${outputPath}"`;

      try {
        await FFmpegKit.execute(args);
        const info = await fileSystem.getInfoAsync(outputPath);
        if (info.exists) {
          thumbnails.push(outputPath);
        }
      } catch {
        // Continue to next thumbnail if this one fails
      }
    }

    return thumbnails;
  } catch {
    // FFmpeg not available or failed to import
    return [];
  }
}
