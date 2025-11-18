// apps/web/src/components/billing/PremiumFeatureGate.tsx
'use client';

import type { ReactNode } from 'react';
import type { SubscriptionTier } from '@petspark/core/billing/billing-types';
import { useSubscription } from './SubscriptionProvider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';

export interface PremiumFeatureGateProps {
    children: ReactNode;
    /**
     * Minimum tier required to access the feature.
     * Defaults to "plus".
     */
    requiredTier?: Exclude<SubscriptionTier, 'free'>;
    className?: string;
    /**
     * Optional custom fallback UI.
     */
    fallback?: ReactNode;
    /**
     * Called when user clicks "Upgrade".
     */
    onUpgradeClick?: () => void;
}

const tierOrder: SubscriptionTier[] = ['free', 'plus', 'pro', 'business'];

function isTierAtLeast(
    current: SubscriptionTier,
    required: SubscriptionTier,
): boolean {
    return tierOrder.indexOf(current) >= tierOrder.indexOf(required);
}

export function PremiumFeatureGate({
    children,
    requiredTier = 'plus',
    className,
    fallback,
    onUpgradeClick,
}: PremiumFeatureGateProps): React.JSX.Element {
    const { tier, status, hasActiveSubscription } = useSubscription();

    const allowed =
        hasActiveSubscription && isTierAtLeast(tier, requiredTier);

    if (allowed) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    const heading = `Upgrade to unlock this feature`;
    const description =
        requiredTier === 'plus'
            ? 'This feature is available to PETSPARK Plus members and above.'
            : `This feature requires a ${requiredTier.toUpperCase()} subscription or higher.`;

    const currentLabel =
        status === 'none'
            ? 'You are currently on the free plan.'
            : `Current tier: ${tier.toUpperCase()} (${status.replace('_', ' ')})`;

    return (
        <div
            className={cn(
                'rounded-2xl border border-border/60 bg-gradient-to-r from-background/80 via-background/60 to-background/80 p-4 sm:p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]',
                'flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4',
                className,
            )}
        >
            <div className="flex-1 space-y-1">
                <h3
                    className={cn(
                        getTypographyClasses('h3'),
                        'bg-clip-text text-transparent bg-[linear-gradient(90deg,var(--primary),var(--primary-foreground))]',
                    )}
                >
                    {heading}
                </h3>
                <p
                    className={cn(
                        getTypographyClasses('bodyMuted'),
                        'text-sm sm:text-base',
                    )}
                >
                    {description}
                </p>
                <p className="text-xs text-muted-foreground/80">
                    {currentLabel}
                </p>
            </div>
            <div className="flex flex-row items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="min-w-[120px]"
                    onClick={() => void onUpgradeClick()}
                >
                    View plans
                </Button>
            </div>
        </div>
    );
}
