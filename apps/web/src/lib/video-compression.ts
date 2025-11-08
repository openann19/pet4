interface HTMLVideoElementWithCaptureStream extends HTMLVideoElement {
  captureStream?: () => MediaStream;
}

export interface VideoCompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  maxDurationSeconds?: number;
  quality: number;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number;
  type: string;
}

export interface CompressionProgress {
  stage: 'analyzing' | 'extracting' | 'compressing' | 'finalizing' | 'complete';
  progress: number;
  message: string;
}

export class VideoCompressor {
  private static readonly DEFAULT_OPTIONS: VideoCompressionOptions = {
    maxSizeMB: 50,
    maxWidthOrHeight: 1280,
    maxDurationSeconds: 60,
    quality: 0.8,
  };

  static async getVideoMetadata(file: File): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve({
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size,
          type: file.type,
        });
      };

      video.onerror = (error) => {
        URL.revokeObjectURL(video.src);
        const message = error instanceof Error ? error.message : 'Failed to load video metadata';
        reject(new Error(message));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  static async extractThumbnail(file: File, timeSeconds = 0): Promise<string> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      video.preload = 'metadata';
      video.currentTime = timeSeconds;

      video.onseeked = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const thumbnail = canvas.toDataURL('image/jpeg', 0.8);
        URL.revokeObjectURL(video.src);
        resolve(thumbnail);
      };

      video.onerror = (error) => {
        URL.revokeObjectURL(video.src);
        const message = error instanceof Error ? error.message : 'Failed to extract thumbnail';
        reject(new Error(message));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  static async compressVideo(
    file: File,
    options: Partial<VideoCompressionOptions> = {},
    onProgress?: (progress: CompressionProgress) => void
  ): Promise<Blob> {
    const opts: VideoCompressionOptions = {
      maxSizeMB: options.maxSizeMB ?? this.DEFAULT_OPTIONS.maxSizeMB,
      maxWidthOrHeight: options.maxWidthOrHeight ?? this.DEFAULT_OPTIONS.maxWidthOrHeight,
      maxDurationSeconds:
        options.maxDurationSeconds ?? this.DEFAULT_OPTIONS.maxDurationSeconds ?? 60,
      quality: options.quality ?? this.DEFAULT_OPTIONS.quality,
    };

    onProgress?.({
      stage: 'analyzing',
      progress: 0,
      message: 'Analyzing video...',
    });

    const metadata = await this.getVideoMetadata(file);
    const maxDurationSeconds =
      opts.maxDurationSeconds ?? this.DEFAULT_OPTIONS.maxDurationSeconds ?? 60;

    if (metadata.duration > maxDurationSeconds) {
      throw new Error(`Video duration must be less than ${maxDurationSeconds} seconds`);
    }

    const sizeMB = metadata.size / (1024 * 1024);
    const needsResize =
      metadata.width > opts.maxWidthOrHeight || metadata.height > opts.maxWidthOrHeight;
    const needsCompression = sizeMB > opts.maxSizeMB;

    if (!needsResize && !needsCompression) {
      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Video already optimized',
      });
      return file;
    }

    onProgress?.({
      stage: 'extracting',
      progress: 25,
      message: 'Processing frames...',
    });

    const { width, height } = this.calculateDimensions(
      metadata.width,
      metadata.height,
      opts.maxWidthOrHeight
    );

    onProgress?.({
      stage: 'compressing',
      progress: 50,
      message: 'Compressing video...',
    });

    const compressedBlob = await this.processVideo(file, width, height, opts.quality, onProgress);

    onProgress?.({
      stage: 'finalizing',
      progress: 90,
      message: 'Finalizing...',
    });

    const finalSizeMB = compressedBlob.size / (1024 * 1024);

    if (finalSizeMB > opts.maxSizeMB) {
      const compressionRatio = opts.maxSizeMB / finalSizeMB;
      const adjustedQuality = Math.max(Math.min(opts.quality * compressionRatio, 1), 0.1);
      return await this.processVideo(file, width, height, adjustedQuality, onProgress);
    }

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Compression complete',
    });

    return compressedBlob;
  }

  private static calculateDimensions(
    width: number,
    height: number,
    maxDimension: number
  ): { width: number; height: number } {
    if (width <= maxDimension && height <= maxDimension) {
      return { width, height };
    }

    const aspectRatio = width / height;

    if (width > height) {
      return {
        width: maxDimension,
        height: Math.round(maxDimension / aspectRatio),
      };
    } else {
      return {
        width: Math.round(maxDimension * aspectRatio),
        height: maxDimension,
      };
    }
  }

  private static async processVideo(
    file: File,
    width: number,
    height: number,
    quality: number,
    onProgress?: (progress: CompressionProgress) => void
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      canvas.width = width;
      canvas.height = height;

      video.preload = 'auto';
      video.muted = true;

      const chunks: Blob[] = [];
      let frameCount = 0;

      video.onloadeddata = () => {
        try {
          const stream = canvas.captureStream(30);
          const videoWithCapture = video as HTMLVideoElementWithCaptureStream;
          const audioStream = videoWithCapture.captureStream?.() ?? null;

          if (audioStream) {
            const audioTracks = audioStream.getAudioTracks();
            audioTracks.forEach((track: MediaStreamTrack) => stream.addTrack(track));
          }

          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 2500000 * quality,
          });

          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunks.push(e.data);
            }
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            URL.revokeObjectURL(video.src);
            resolve(blob);
          };

          mediaRecorder.onerror = (error) => {
            URL.revokeObjectURL(video.src);
            const message = error instanceof Error ? error.message : 'MediaRecorder error';
            reject(new Error(message));
          };

          mediaRecorder.start();
          video.play().catch((playError) => {
            URL.revokeObjectURL(video.src);
            const message = playError instanceof Error ? playError.message : 'Failed to play video';
            reject(new Error(message));
          });

          const captureFrame = () => {
            if (video.ended) {
              mediaRecorder.stop();
              return;
            }

            ctx.drawImage(video, 0, 0, width, height);
            frameCount++;

            const progress = Math.min(90, 50 + (video.currentTime / video.duration) * 40);
            onProgress?.({
              stage: 'compressing',
              progress,
              message: `Processing frame ${frameCount}...`,
            });

            requestAnimationFrame(captureFrame);
          };

          captureFrame();
        } catch (error) {
          URL.revokeObjectURL(video.src);
          const message = error instanceof Error ? error.message : 'Failed to process video';
          reject(new Error(message));
        }
      };

      video.onerror = (error) => {
        URL.revokeObjectURL(video.src);
        const message = error instanceof Error ? error.message : 'Failed to process video';
        reject(new Error(message));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
