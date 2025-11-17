import { APIClient } from '@/lib/api-client';
import { ENDPOINTS } from '@/lib/endpoints';
import { createLogger } from '@/lib/logger';

const logger = createLogger('UploadService');

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  key: string;
  metadata: {
    size: number;
    type: string;
    width?: number;
    height?: number;
  };
}

export interface SignedUploadResponse {
  uploadUrl: string;
  key: string;
  fields?: Record<string, string>;
}

class UploadServiceImpl {
  async uploadFile(
    file: File,
    options: {
      type: 'pet-photo' | 'profile-avatar' | 'document' | 'video';
      onProgress?: (progress: UploadProgress) => void;
    }
  ): Promise<UploadResult> {
    const { type, onProgress } = options;

    try {
      // Step 1: Get signed URL
      const signedResponse = await APIClient.post<SignedUploadResponse>(
        ENDPOINTS.UPLOADS.SIGN_URL,
        {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadType: type,
        }
      );

      const { uploadUrl, key, fields } = signedResponse.data;

      // Step 2: Upload to cloud storage
      await this.performUpload(file, uploadUrl, fields, onProgress);

      // Step 3: Complete upload on backend
      const result = await APIClient.post<UploadResult>(ENDPOINTS.UPLOADS.COMPLETE, {
        key,
        size: file.size,
        type: file.type,
        uploadType: type,
      });

      logger.info('File uploaded successfully', {
        key,
        size: file.size,
        type: file.type,
      });

      return result.data;
    } catch (error) {
      logger.error('File upload failed', error, {
        fileName: file.name,
        size: file.size,
      });
      throw error;
    }
  }

  private async performUpload(
    file: File,
    uploadUrl: string,
    fields: Record<string, string> = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const formData = new FormData();

      // Add any required fields (S3 policy, etc.)
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Add the file last
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // Progress tracking
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          onProgress({
            loaded: event.loaded,
            total: event.total,
            percentage: Math.round((event.loaded / event.total) * 100),
          });
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed due to network error'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload was cancelled'));
      });

      xhr.open('POST', uploadUrl);
      xhr.send(formData);
    });
  }

  async uploadMultipleFiles(
    files: File[],
    options: {
      type: 'pet-photo' | 'profile-avatar' | 'document' | 'video';
      onProgress?: (progress: UploadProgress) => void;
      onFileComplete?: (result: UploadResult, index: number) => void;
    }
  ): Promise<UploadResult[]> {
    const { type, onProgress, onFileComplete } = options;
    const results: UploadResult[] = [];
    let totalLoaded = 0;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      const result = await this.uploadFile(file, {
        type,
        onProgress: (fileProgress) => {
          const overallProgress = {
            loaded: totalLoaded + fileProgress.loaded,
            total: totalSize,
            percentage: Math.round(((totalLoaded + fileProgress.loaded) / totalSize) * 100),
          };
          onProgress?.(overallProgress);
        },
      });

      totalLoaded += file.size;
      results.push(result);
      onFileComplete?.(result, i);
    }

    return results;
  }

  // Utility methods
  validateFile(file: File, type: 'image' | 'video' | 'document'): void {
    const limits = {
      image: { maxSize: 10 * 1024 * 1024, types: ['image/jpeg', 'image/png', 'image/webp'] },
      video: { maxSize: 100 * 1024 * 1024, types: ['video/mp4', 'video/webm'] },
      document: { maxSize: 5 * 1024 * 1024, types: ['application/pdf', 'image/jpeg', 'image/png'] },
    };

    const limit = limits[type];

    if (file.size > limit.maxSize) {
      throw new Error(
        `File size ${Math.round(file.size / 1024 / 1024)}MB exceeds limit of ${Math.round(limit.maxSize / 1024 / 1024)}MB`
      );
    }

    if (!limit.types.includes(file.type)) {
      throw new Error(
        `File type ${file.type} is not supported. Allowed: ${limit.types.join(', ')}`
      );
    }
  }

  async compressImage(file: File, maxWidth = 1920, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            } else {
              reject(new Error('Image compression failed'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}

export const uploadService = new UploadServiceImpl();
