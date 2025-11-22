// apps/web/src/components/calls/CallButton.tsx
'use client';

import { Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCall } from '@/contexts/CallContext';
import { createLogger } from '@/lib/logger';

export interface CallButtonProps {
  readonly remoteUserId: string;
  readonly remoteDisplayName: string;
  readonly remoteAvatarUrl?: string | null;
  readonly className?: string;
}

const logger = createLogger('CallButton');

export function CallButton({
  remoteUserId,
  remoteDisplayName,
  remoteAvatarUrl,
  className,
}: CallButtonProps): React.JSX.Element {
  const { startCall } = useCall();

  const handleClick = () => {
    void startCall({
      remoteUserId,
      remoteDisplayName,
      remoteAvatarUrl,
    }).catch((error) => {
      logger.error('Failed to start call', error, { remoteUserId });
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      isIconOnly
      aria-label={`Call ${remoteDisplayName}`}
      onClick={handleClick}
      className={cn('rounded-full w-10 h-10 p-0', className)}
    >
      <Phone className="h-4 w-4" />
    </Button>
  );
}
