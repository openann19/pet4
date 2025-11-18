import { VideoMetadataExtractor } from './video-metadata';
import type { VideoMetadata } from './video-metadata';
import { formatFileSize, formatDuration } from './video-utils';
import { calculateDimensions } from './video-dimensions';

// Re-export VideoMetadata for consumers
export type { VideoMetadata };

interface HTMLVideoElementWithCaptureStream extends HTMLVideoElement {
  captureStream?: () => MediaStream;
}

interface VideoProcessingContext {
  readonly video: HTMLVideoElement;
  readonly canvas: HTMLCanvasElement;
  readonly ctx: CanvasRenderingContext2D;
}

export interface VideoCompressionOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  maxDurationSeconds?: number;
  quality: number;
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

  private static buildCompressionOptions(options: Partial<VideoCompressionOptions>): VideoCompressionOptions {
    return {
      maxSizeMB: options.maxSizeMB ?? this.DEFAULT_OPTIONS.maxSizeMB,
      maxWidthOrHeight: options.maxWidthOrHeight ?? this.DEFAULT_OPTIONS.maxWidthOrHeight,
      maxDurationSeconds: options.maxDurationSeconds ?? this.DEFAULT_OPTIONS.maxDurationSeconds ?? 60,
      quality: options.quality ?? this.DEFAULT_OPTIONS.quality,
    };
  }

  private static validateAndSetupCompression(
    metadata: VideoMetadata,
    opts: VideoCompressionOptions,
    onProgress?: (progress: CompressionProgress) => void
  ): { needsResize: boolean; needsCompression: boolean; width: number; height: number } {
    if (metadata.duration > (opts.maxDurationSeconds ?? this.DEFAULT_OPTIONS.maxDurationSeconds ?? 60)) {
      throw new Error(`Video duration must be less than ${opts.maxDurationSeconds ?? 60} seconds`);
    }

    const sizeMB = metadata.size / (1024 * 1024);
    const needsResize = metadata.width > opts.maxWidthOrHeight || metadata.height > opts.maxWidthOrHeight;
    const needsCompression = sizeMB > opts.maxSizeMB;

    onProgress?.({
      stage: 'analyzing',
      progress: 0,
      message: 'Analyzing video...',
    });

    if (!needsResize && !needsCompression) {
      onProgress?.({
        stage: 'complete',
        progress: 100,
        message: 'Video already optimized',
      });
      throw new Error('NO_COMPRESSION_NEEDED');
    }

    const { width, height } = calculateDimensions(
      metadata.width,
      metadata.height,
      opts.maxWidthOrHeight
    );

    return { needsResize, needsCompression, width, height };
  }

  private static async performCompression(
    file: File,
    width: number,
    height: number,
    opts: VideoCompressionOptions,
    onProgress?: (progress: CompressionProgress) => void
  ): Promise<Blob> {
    onProgress?.({
      stage: 'extracting',
      progress: 25,
      message: 'Processing frames...',
    });

    onProgress?.({
      stage: 'compressing',
      progress: 50,
      message: 'Compressing video...',
    });

    let compressedBlob = await this.processVideo(file, width, height, opts.quality, onProgress);

    onProgress?.({
      stage: 'finalizing',
      progress: 90,
      message: 'Finalizing...',
    });

    const finalSizeMB = compressedBlob.size / (1024 * 1024);

    if (finalSizeMB > opts.maxSizeMB) {
      const compressionRatio = opts.maxSizeMB / finalSizeMB;
      const adjustedQuality = Math.max(Math.min(opts.quality * compressionRatio, 1), 0.1);
      compressedBlob = await this.processVideo(file, width, height, adjustedQuality, onProgress);
    }

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Compression complete',
    });

    return compressedBlob;
  }

  static async compressVideo(
    file: File,
    options: Partial<VideoCompressionOptions> = {},
    onProgress?: (progress: CompressionProgress) => void
  ): Promise<Blob> {
    const opts = this.buildCompressionOptions(options);

    const metadata = await VideoMetadataExtractor.getVideoMetadata(file);

    try {
      const { needsResize, needsCompression, width, height } = this.validateAndSetupCompression(
        metadata,
        opts,
        onProgress
      );

      if (!needsResize && !needsCompression) {
        return file; // Already handled in validateAndSetupCompression
      }

      return await this.performCompression(file, width, height, opts, onProgress);
    } catch (_error) {
      if (_error instanceof Error && _error.message === 'NO_COMPRESSION_NEEDED') {
        return file;
      }
      throw _error;
    }
  }


  private static setupCanvasAndVideo(width: number, height: number): VideoProcessingContext {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    canvas.width = width;
    canvas.height = height;
    video.preload = 'auto';
    video.muted = true;

    return { video, canvas, ctx };
  }

  private static setupMediaRecorder(
    canvas: HTMLCanvasElement,
    video: HTMLVideoElementWithCaptureStream,
    quality: number,
    onDataAvailable: (e: BlobEvent) => void,
    onStop: () => void,
    onError: (error: Event) => void
  ): MediaRecorder {
    const stream = canvas.captureStream(30);
    const audioStream = video.captureStream?.() ?? null;

    if (audioStream) {
      const audioTracks = audioStream.getAudioTracks();
      audioTracks.forEach((track: MediaStreamTrack) => stream.addTrack(track));
    }

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000 * quality,
    });

    mediaRecorder.ondataavailable = onDataAvailable;
    mediaRecorder.onstop = onStop;
    mediaRecorder.onerror = onError;

    return mediaRecorder;
  }

  private static async processVideo(
    file: File,
    width: number,
    height: number,
    quality: number,
    onProgress?: (progress: CompressionProgress) => void
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const context = this.setupCanvasAndVideo(width, height);
      const chunks: Blob[] = [];
      const { handleDataAvailable, handleStop, handleRecorderError } = this.createRecorderCallbacks(
        context.video,
        chunks,
        resolve,
        reject
      );

      context.video.onloadeddata = () => {
        try {
          const mediaRecorder = this.setupMediaRecorder(
            context.canvas,
            context.video as HTMLVideoElementWithCaptureStream,
            quality,
            handleDataAvailable,
            handleStop,
            handleRecorderError
          );

          mediaRecorder.start();
          this.beginFrameCapture(context.video, context.ctx, width, height, mediaRecorder, onProgress);
          this.startVideoPlayback(context.video, reject);
        } catch (_error) {
          this.handleProcessingError(context.video, _error, reject, 'Failed to process video');
        }
      };

      context.video.onerror = (error) =>
        this.handleProcessingError(context.video, error, reject, 'Failed to process video');

      context.video.src = URL.createObjectURL(file);
    });
  }

  private static createRecorderCallbacks(
    video: HTMLVideoElement,
    chunks: Blob[],
    resolve: (blob: Blob) => void,
    reject: (error: Error) => void
  ): {
    handleDataAvailable: (event: BlobEvent) => void;
    handleStop: () => void;
    handleRecorderError: (error: Event) => void;
  } {
    return {
      handleDataAvailable: (event: BlobEvent) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      },
      handleStop: () => {
        URL.revokeObjectURL(video.src);
        const blob = new Blob(chunks, { type: 'video/webm' });
        resolve(blob);
      },
      handleRecorderError: (error: Event) => {
        this.handleProcessingError(video, error, reject, 'MediaRecorder error');
      },
    };
  }

  private static beginFrameCapture(
    video: HTMLVideoElement,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    mediaRecorder: MediaRecorder,
    onProgress?: (progress: CompressionProgress) => void
  ): void {
    let frameCount = 0;

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
  }

  private static startVideoPlayback(
    video: HTMLVideoElement,
    reject: (error: Error) => void
  ): void {
    video.play().catch((playError) => {
      this.handleProcessingError(video, playError, reject, 'Failed to play video');
    });
  }

  private static handleProcessingError(
    video: HTMLVideoElement,
    error: unknown,
    reject: (error: Error) => void,
    fallbackMessage: string
  ): void {
    URL.revokeObjectURL(video.src);
    const message = _error instanceof Error ? error.message : fallbackMessage;
    reject(new Error(message));
  }

  static async getVideoMetadata(file: File): Promise<VideoMetadata> {
    return VideoMetadataExtractor.getVideoMetadata(file);
  }

  static async extractThumbnail(file: File, timeSeconds = 0): Promise<string> {
    return VideoMetadataExtractor.extractThumbnail(file, timeSeconds);
  }

  static formatFileSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  static formatDuration(seconds: number): string {
    return formatDuration(seconds);
  }
}
