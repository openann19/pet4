// apps/web/src/components/billing/BillingIssueBanner.tsx
'use client';

import type { SubscriptionStatus } from '@petspark/core/billing/billing-types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';

export interface BillingIssueBannerProps {
    status: SubscriptionStatus;
    className?: string;
    onOpenBillingPortal?: () => void;
}

export function BillingIssueBanner({
    status,
    className,
    onOpenBillingPortal,
}: BillingIssueBannerProps): React.JSX.Element | null {
    if (status !== 'past_due') {
        return null;
    }

    return (
        <Alert
            variant="destructive"
            className={cn(
                'flex items-start gap-3 rounded-2xl border-[1.5px] border-destructive/40 bg-destructive/10',
                className,
            )}
        >
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="space-y-1">
                <AlertTitle>Billing issue detected</AlertTitle>
                <AlertDescription>
                    Your last payment failed. Please update your billing details to avoid
                    interruption of premium features.
                </AlertDescription>
                {onOpenBillingPortal ? (
                    <button
                        type="button"
                        onClick={onOpenBillingPortal}
                        className="mt-1 inline-flex text-xs font-medium text-destructive underline underline-offset-4"
                    >
                        Open billing portal
                    </button>
                ) : null}
            </div>
        </Alert>
    );
}
