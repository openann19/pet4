/**
 * Verification Dialog
 *
 * KYC verification interface
 */

'use client';

import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PremiumCard } from '@/components/enhanced/PremiumCard';
import { VerificationLevelSelector } from './VerificationLevelSelector';
import { DocumentUploadCard } from './DocumentUploadCard';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import { createLogger } from '@/lib/logger';

const logger = createLogger('VerificationDialog');

export type VerificationLevel = 'basic' | 'premium' | 'vip';

export interface VerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onVerify: (level: VerificationLevel, documents: File[]) => void;
}

export function VerificationDialog({
  open,
  onOpenChange,
  onVerify,
}: VerificationDialogProps): React.JSX.Element {
  const [selectedLevel, setSelectedLevel] = useState<VerificationLevel>('basic');
  const [documents, setDocuments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleVerify = useCallback(async () => {
    if (documents.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onVerify(selectedLevel, documents);
      onOpenChange(false);
      setDocuments([]);
      setSelectedLevel('basic');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Verification failed', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedLevel, documents, onVerify, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className={cn(getTypographyClasses('h2'))}>
            Identity Verification
          </DialogTitle>
        </DialogHeader>

        <PremiumCard variant="glass" className="p-6 space-y-6">
          <div>
            <p className={cn(getTypographyClasses('bodyMuted'), 'text-sm')}>
              Verify your identity to unlock premium features and build trust with other users.
            </p>
          </div>

          <VerificationLevelSelector
            selectedLevel={selectedLevel}
            onLevelChange={setSelectedLevel}
          />

          <DocumentUploadCard
            documents={documents}
            onDocumentsChange={setDocuments}
            requiredCount={selectedLevel === 'basic' ? 1 : selectedLevel === 'premium' ? 2 : 3}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleVerify()}
              disabled={documents.length === 0 || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Verification'}
            </Button>
          </div>
        </PremiumCard>
      </DialogContent>
    </Dialog>
  );
}

