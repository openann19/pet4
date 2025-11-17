export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  size: number;
  type: string;
}

export class VideoMetadataExtractor {
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
}
