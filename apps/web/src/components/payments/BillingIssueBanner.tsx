import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Warning, CreditCard, X } from '@phosphor-icons/react';
import { PaymentsService } from '@/lib/payments-service';
import type { BillingIssue } from '@/lib/payments-types';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export function BillingIssueBanner() {
  const [issue, setIssue] = useState<BillingIssue | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    checkBillingIssues();
  }, []);

  const checkBillingIssues = async () => {
    try {
      const user = await spark?.user();
      const billingIssue = await PaymentsService.getUserBillingIssue(user.id);
      if (billingIssue && !billingIssue.resolved) {
        setIssue(billingIssue);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to check billing issues', err, { action: 'checkBillingIssues' });
    }
  };

  const handleRetry = async () => {
    if (!issue) return;

    setRetrying(true);
    try {
      await PaymentsService.resolveBillingIssue(issue.id);
      toast.success('Payment updated successfully');
      setIssue(null);
    } catch {
      toast.error('Failed to update payment method');
    } finally {
      setRetrying(false);
    }
  };

  if (!issue || dismissed) {
    return null;
  }

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(issue.gracePeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const getIssueMessage = () => {
    switch (issue.type) {
      case 'payment_failed':
        return 'Your last payment failed. Please update your payment method.';
      case 'card_expired':
        return 'Your payment card has expired. Please add a new card.';
      case 'insufficient_funds':
        return 'Payment could not be processed due to insufficient funds.';
      default:
        return 'There is an issue with your subscription payment.';
    }
  };

  return (
    <div className="sticky top-16 z-30 px-4 sm:px-6 lg:px-8 py-4">
      <Alert variant="destructive" className="relative">
        <Warning className="h-5 w-5" />
        <button
          onClick={() => { setDismissed(true); }}
          className="absolute right-4 top-4 opacity-70 hover:opacity-100 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
        <AlertTitle>Payment Issue</AlertTitle>
        <AlertDescription className="mt-2 flex flex-col gap-3">
          <p>
            {getIssueMessage()} You have {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left in your
            grace period before your subscription is canceled.
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-background"
              onClick={handleRetry}
              disabled={retrying}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {retrying ? 'Processing...' : 'Update Payment Method'}
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
