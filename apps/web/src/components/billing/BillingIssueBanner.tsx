// apps/web/src/components/billing/BillingIssueBanner.tsx
'use client';

import type { SubscriptionStatus } from '@petspark/core/billing/billing-types';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { getTypographyClasses, getSpacingClassesFromConfig } from '@/lib/typography';

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
            <svg
                className="mt-0.5 h-5 w-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
            </svg>
            <div className={getSpacingClassesFromConfig({ spaceY: 'xs' })}>
                <AlertTitle className={getTypographyClasses('h3')}>
                    Billing issue detected
                </AlertTitle>
                <AlertDescription className={getTypographyClasses('body')}>
                    Your last payment failed. Please update your billing details to avoid
                    interruption of premium features.
                </AlertDescription>
                {onOpenBillingPortal ? (
                    <button
                        type="button"
                        onClick={onOpenBillingPortal}
                        className={cn(
                            getTypographyClasses('caption'),
                            'inline-flex font-medium text-destructive underline underline-offset-4',
                            getSpacingClassesFromConfig({ marginY: 'xs' }),
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                        )}
                        aria-label="Open billing portal to update payment method"
                    >
                        Open billing portal
                    </button>
                ) : null}
            </div>
        </Alert>
    );
}
