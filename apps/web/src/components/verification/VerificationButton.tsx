import { useState } from 'react';
import { motion } from '@petspark/motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, CheckCircle, Clock, XCircle } from '@phosphor-icons/react';
import { useStorage } from '@/hooks/use-storage';
import type { VerificationRequest } from '@/lib/verification-types';
import { VerificationDialog } from './VerificationDialog';
import { cn } from '@/lib/utils';

interface VerificationButtonProps {
  petId: string;
  userId: string;
  variant?: 'default' | 'card';
  className?: string;
}

export function VerificationButton({
  petId,
  userId,
  variant = 'default',
  className,
}: VerificationButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [verificationRequests] = useStorage<Record<string, VerificationRequest>>(
    'verification-requests',
    {}
  );

  const request = verificationRequests?.[petId];

  const statusConfig = {
    unverified: {
      icon: ShieldCheck,
      label: 'Get Verified',
      color: 'bg-primary text-primary-foreground hover:bg-primary/90',
      badgeColor: 'bg-muted text-muted-foreground',
    },
    pending: {
      icon: Clock,
      label: 'Verification Pending',
      color: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
      badgeColor: 'bg-secondary text-secondary-foreground',
    },
    verified: {
      icon: CheckCircle,
      label: 'Verified Owner',
      color: 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20',
      badgeColor: 'bg-primary/20 text-primary',
    },
    rejected: {
      icon: XCircle,
      label: 'Verification Issues',
      color: 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/20',
      badgeColor: 'bg-destructive/20 text-destructive',
    },
    expired: {
      icon: Clock,
      label: 'Verification Expired',
      color: 'bg-muted text-muted-foreground hover:bg-muted/80',
      badgeColor: 'bg-muted text-muted-foreground',
    },
  };

  const status = request?.status || 'unverified';
  const config = statusConfig[status];
  const Icon = config.icon;

  if (variant === 'card') {
    return (
      <>
        <MotionView
          as="button"
          onClick={() => setShowDialog(true)}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            'w-full p-4 rounded-xl border transition-all text-left',
            status === 'verified'
              ? 'bg-gradient-to-br from-primary/10 to-accent/5 border-primary/30'
              : 'bg-card border-border hover:border-primary/50',
            className
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'p-2.5 rounded-lg',
                  status === 'verified' ? 'bg-primary/20' : 'bg-muted'
                )}
              >
                <Icon
                  size={20}
                  weight={status === 'verified' ? 'fill' : 'regular'}
                  className={status === 'verified' ? 'text-primary' : 'text-muted-foreground'}
                />
              </div>
              <div>
                <h4 className="font-semibold text-sm">{config.label}</h4>
                <p className="text-xs text-muted-foreground">
                  {status === 'verified' &&
                    request?.trustScore &&
                    `Trust score: ${request.trustScore}/100`}
                  {status === 'pending' && 'Under review'}
                  {status === 'unverified' && 'Verify your pet ownership'}
                  {status === 'rejected' && 'Action required'}
                  {status === 'expired' && 'Needs renewal'}
                </p>
              </div>
            </div>
            <Badge className={cn('gap-1.5', config.badgeColor)}>
              {status === 'verified' && <CheckCircle size={12} weight="fill" />}
              {config.label}
            </Badge>
          </div>
        </MotionView>

        <VerificationDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          petId={petId}
          userId={userId}
        />
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant={status === 'verified' ? 'outline' : 'default'}
        size="sm"
        className={cn('gap-2', config.color, className)}
      >
        <Icon size={16} weight={status === 'verified' ? 'fill' : 'bold'} />
        {config.label}
        {status === 'verified' && request?.trustScore && (
          <Badge variant="secondary" className="ml-1 text-xs">
            {request.trustScore}
          </Badge>
        )}
      </Button>

      <VerificationDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        petId={petId}
        userId={userId}
      />
    </>
  );
}
