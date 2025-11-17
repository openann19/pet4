import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomBytes } from 'crypto';

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'us-east-1',
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      }
    : undefined,
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'petspark-media';
const CDN_BASE_URL = process.env.CDN_BASE_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const PRESIGNED_URL_EXPIRY = 3600; // 1 hour

export interface UploadMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadType: 'pet-photo' | 'profile-avatar' | 'document' | 'video' | 'community-post';
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  expiresAt: string;
  fields?: Record<string, string>;
}

export interface CompleteUploadRequest {
  key: string;
  size: number;
  type: string;
  uploadType: string;
  petId?: string;
  userId?: string;
}

/**
 * Generate a unique S3 key for the file
 */
function generateS3Key(metadata: UploadMetadata): string {
  const timestamp = Date.now();
  const random = randomBytes(8).toString('hex');
  const extension = metadata.fileName.split('.').pop() || 'bin';
  
  let prefix = 'uploads';
  switch (metadata.uploadType) {
    case 'pet-photo':
      prefix = 'pets/photos';
      break;
    case 'profile-avatar':
      prefix = 'users/avatars';
      break;
    case 'document':
      prefix = 'documents';
      break;
    case 'video':
      prefix = 'videos';
      break;
    case 'community-post':
      prefix = 'community';
      break;
  }
  
  return `${prefix}/${timestamp}-${random}.${extension}`;
}

/**
 * Validate file metadata
 */
export function validateUploadMetadata(metadata: UploadMetadata): { valid: boolean; error?: string } {
  // Check file size
  if (metadata.fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check file type based on upload type
  if (metadata.uploadType === 'pet-photo' || metadata.uploadType === 'profile-avatar' || metadata.uploadType === 'community-post') {
    if (!ALLOWED_IMAGE_TYPES.includes(metadata.fileType)) {
      return {
        valid: false,
        error: `Invalid image type. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`,
      };
    }
  }

  if (metadata.uploadType === 'video') {
    if (!ALLOWED_VIDEO_TYPES.includes(metadata.fileType)) {
      return {
        valid: false,
        error: `Invalid video type. Allowed types: ${ALLOWED_VIDEO_TYPES.join(', ')}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Generate presigned URL for S3 upload
 */
export async function generatePresignedUrl(metadata: UploadMetadata): Promise<PresignedUrlResponse> {
  const validation = validateUploadMetadata(metadata);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid upload metadata');
  }

  const key = generateS3Key(metadata);
  const expiresAt = new Date(Date.now() + PRESIGNED_URL_EXPIRY * 1000);

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: metadata.fileType,
    ContentLength: metadata.fileSize,
    Metadata: {
      'original-name': metadata.fileName,
      'upload-type': metadata.uploadType,
      'uploaded-at': new Date().toISOString(),
    },
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: PRESIGNED_URL_EXPIRY });

  return {
    uploadUrl,
    key,
    expiresAt: expiresAt.toISOString(),
  };
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(key: string): string {
  return `${CDN_BASE_URL}/${key}`;
}

/**
 * Delete file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Generate presigned URL for downloading a file
 */
export async function generateDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Check if file exists in S3
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

