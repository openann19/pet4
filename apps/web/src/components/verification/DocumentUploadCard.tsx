import { useRef, useState } from 'react';
import { _motion, MotionView } from '@petspark/motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UploadSimple, CheckCircle, XCircle, File, Trash, Clock } from '@phosphor-icons/react';
import type { VerificationDocument, DocumentType } from '@/lib/verification-types';
import { cn } from '@/lib/utils';

interface DocumentUploadCardProps {
  documentType: DocumentType;
  label: string;
  description: string;
  existingDocument?: VerificationDocument;
  onUpload: (file: File) => void;
  onDelete: (documentId: string) => void;
  optional?: boolean;
  disabled?: boolean;
}

export function DocumentUploadCard({
  label,
  description,
  existingDocument,
  onUpload,
  onDelete,
  optional,
  disabled,
}: DocumentUploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleBrowse = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const statusIcons = {
    pending: { icon: Clock, color: 'text-secondary' },
    verified: { icon: CheckCircle, color: 'text-primary' },
    rejected: { icon: XCircle, color: 'text-destructive' },
    expired: { icon: Clock, color: 'text-muted-foreground' },
    unverified: { icon: Clock, color: 'text-muted-foreground' },
  };

  return (
    <MotionView
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative rounded-xl border transition-all',
        existingDocument
          ? 'bg-card border-border'
          : isDragging
            ? 'bg-primary/5 border-primary border-dashed'
            : 'bg-card/50 border-border border-dashed',
        disabled && 'opacity-60'
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
        onChange={() => void handleFileSelect()}
        className="hidden"
        disabled={disabled}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="p-4"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">{label}</h4>
              {optional && (
                <Badge variant="secondary" className="text-xs">
                  Optional
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>

        {existingDocument ? (
          <MotionView
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <File size={20} weight="duotone" className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{existingDocument.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(existingDocument.fileSize)} • Uploaded{' '}
                {new Date(existingDocument.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {existingDocument.status && (
                <MotionView
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {(() => {
                    const StatusIcon = statusIcons[existingDocument.status].icon;
                    return (
                      <StatusIcon
                        size={20}
                        weight="fill"
                        className={statusIcons[existingDocument.status].color}
                      />
                    );
                  })()}
                </MotionView>
              )}
              {!disabled && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => { onDelete(existingDocument.id); }}
                >
                  <Trash size={16} weight="bold" />
                </Button>
              )}
            </div>
          </MotionView>
        ) : (
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleBrowse()}
              disabled={disabled}
              className="w-full gap-2"
            >
              <UploadSimple size={16} weight="bold" />
              {isDragging ? 'Drop file here' : 'Browse or drag file'}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              JPG, PNG, WEBP, or PDF (max 10MB)
            </p>
          </div>
        )}
      </div>
    </MotionView>
  );
}
