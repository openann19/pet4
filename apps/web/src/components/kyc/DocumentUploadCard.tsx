/**
 * Document Upload Card
 *
 * File upload with progress for KYC documents
 */

'use client';

import { useState, useCallback } from 'react';
import { Upload, X, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import { createLogger } from '@/lib/logger';

const logger = createLogger('DocumentUploadCard');

export interface DocumentUploadCardProps {
  documents: File[];
  onDocumentsChange: (documents: File[]) => void;
  requiredCount?: number;
  maxSize?: number;
  acceptedTypes?: string[];
  className?: string;
}

export function DocumentUploadCard({
  documents,
  onDocumentsChange,
  requiredCount = 1,
  maxSize = 10 * 1024 * 1024,
  acceptedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
  className,
}: DocumentUploadCardProps): React.JSX.Element {
  const [_uploading, setUploading] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      const validFiles: File[] = [];

      for (const file of files) {
        if (file.size > maxSize) {
          logger.warn('File too large', { fileName: file.name, size: file.size });
          continue;
        }

        if (!acceptedTypes.includes(file.type)) {
          logger.warn('Invalid file type', { fileName: file.name, type: file.type });
          continue;
        }

        validFiles.push(file);
      }

      if (validFiles.length > 0) {
        onDocumentsChange([...documents, ...validFiles]);
      }

      event.target.value = '';
    },
    [documents, onDocumentsChange, maxSize, acceptedTypes]
  );

  const handleRemove = useCallback(
    (index: number) => {
      const newDocuments = documents.filter((_, i) => i !== index);
      onDocumentsChange(newDocuments);
    },
    [documents, onDocumentsChange]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <PremiumCard variant="glass" className={cn('p-4 space-y-4', className)}>
      <div>
        <h3 className={cn(getTypographyClasses('h3'), 'mb-1')}>Upload Documents</h3>
        <p className={cn(getTypographyClasses('bodyMuted'), 'text-sm')}>
          Upload {requiredCount} document{requiredCount !== 1 ? 's' : ''} for verification
        </p>
      </div>

      <div className="space-y-3">
        {documents.map((file, index) => (
          <div
            key={`${file.name}-${index}`}
            className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
          >
            <FileText className="size-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={cn(getTypographyClasses('body'), 'font-medium truncate')}>
                {file.name}
              </p>
              <p className={cn(getTypographyClasses('caption'), 'text-muted-foreground')}>
                {formatFileSize(file.size)}
              </p>
              {uploadProgress[file.name] !== undefined && (
                <Progress value={uploadProgress[file.name]} className="mt-2" />
              )}
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => handleRemove(index)}
              className="shrink-0"
            >
              <X className="size-4" />
            </Button>
          </div>
        ))}

        {documents.length < requiredCount && (
          <label className="block">
            <input
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={() => void handleFileSelect()}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors cursor-pointer">
              <Upload className="size-8 text-muted-foreground" />
              <div className="text-center">
                <p className={cn(getTypographyClasses('body'), 'font-medium')}>
                  Click to upload documents
                </p>
                <p className={cn(getTypographyClasses('caption'), 'text-muted-foreground text-xs')}>
                  {acceptedTypes.join(', ')} up to {formatFileSize(maxSize)}
                </p>
              </div>
            </div>
          </label>
        )}

        {documents.length >= requiredCount && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <Check className="size-5 text-emerald-500 shrink-0" />
            <p className={cn(getTypographyClasses('body'), 'text-emerald-500 text-sm')}>
              {documents.length} document{documents.length !== 1 ? 's' : ''} ready
            </p>
          </div>
        )}
      </div>
    </PremiumCard>
  );
}

