/**
 * Verification Button
 *
 * Profile verification button
 */

'use client';

import { useState } from 'react';
import { ShieldCheck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VerificationDialog } from './VerificationDialog';
import { cn } from '@/lib/utils';
import type { VerificationLevel } from './VerificationDialog';
import { createLogger } from '@/lib/logger';

const logger = createLogger('VerificationButton');

export interface VerificationButtonProps {
  currentLevel?: VerificationLevel | null;
  onVerify?: (level: VerificationLevel, documents: File[]) => Promise<void>;
  className?: string;
}

export function VerificationButton({
  currentLevel,
  onVerify,
  className,
}: VerificationButtonProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  const handleVerify = async (level: VerificationLevel, documents: File[]): Promise<void> => {
    if (onVerify) {
      await onVerify(level, documents);
    } else {
      logger.warn('No verification handler provided');
    }
  };

  if (currentLevel) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled
        className={cn('gap-2', className)}
      >
        <ShieldCheck className="size-4" />
        <span>Verified ({currentLevel.toUpperCase()})</span>
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn('gap-2', className)}
      >
        <Shield className="size-4" />
        <span>Verify Identity</span>
      </Button>

      <VerificationDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        onVerify={handleVerify}
      />
    </>
  );
}

