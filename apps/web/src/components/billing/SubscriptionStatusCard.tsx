// apps/web/src/components/billing/SubscriptionStatusCard.tsx
'use client';

import type { SubscriptionInfo } from '@petspark/core/billing/billing-types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import { format } from 'date-fns';

export interface SubscriptionStatusCardProps {
    subscription: SubscriptionInfo | null;
    onManageBilling?: () => void;
    onUpgrade?: () => void;
    className?: string;
}

function formatDate(iso: string | null): string | null {
    if (!iso) return null;
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return format(date, 'PPP');
}

export function SubscriptionStatusCard({
    subscription,
    onManageBilling,
    onUpgrade,
    className,
}: SubscriptionStatusCardProps): React.JSX.Element {
    const tierLabel = subscription?.tier
        ? subscription.tier.toUpperCase()
        : 'FREE';

    const statusLabel = subscription?.status
        ? subscription.status.replace('_', ' ')
        : 'none';

    const renewLabel =
        subscription?.cancelAtPeriodEnd === true
            ? 'Cancels at end of period'
            : 'Renews automatically';

    const nextBillingDate = formatDate(
        subscription?.currentPeriodEnd ?? null,
    );

    const amount =
        subscription?.priceCents != null && subscription.currency
            ? `${(subscription.priceCents / 100).toFixed(2)} ${subscription.currency.toUpperCase()
            }`
            : null;

    return (
        <Card
            className={cn(
                'relative overflow-hidden rounded-2xl border border-border/60 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),transparent_55%),linear-gradient(135deg,_rgba(12,10,20,0.9),_rgba(10,16,32,0.96))]',
                'shadow-[0_18px_45px_rgba(0,0,0,0.45)]',
                className,
            )}
        >
            <div className="absolute inset-0 opacity-50 mix-blend-soft-light pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-4 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3
                            className={cn(
                                getTypographyClasses('h3'),
                                'flex items-center gap-2',
                            )}
                        >
                            Subscription
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary tracking-wide uppercase">
                                {tierLabel}
                            </span>
                        </h3>
                        <p
                            className={cn(
                                getTypographyClasses('bodyMuted'),
                                'mt-1 text-sm',
                            )}
                        >
                            Status: <span className="capitalize">{statusLabel}</span>
                        </p>
                    </div>
                    {amount ? (
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">
                                Current plan
                            </p>
                            <p className="text-base font-semibold text-foreground">
                                {amount}
                            </p>
                        </div>
                    ) : null}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <div>
                        {nextBillingDate ? (
                            <p>
                                Next billing:{' '}
                                <span className="font-medium text-foreground">
                                    {nextBillingDate}
                                </span>
                            </p>
                        ) : (
                            <p>No upcoming billing date.</p>
                        )}
                        <p>{renewLabel}</p>
                    </div>
                    <div className="flex gap-2">
                        {onManageBilling ? (
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={onManageBilling}
                            >
                                Manage billing
                            </Button>
                        ) : null}
                        {onUpgrade ? (
                            <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={onUpgrade}
                            >
                                View plans
                            </Button>
                        ) : null}
                    </div>
                </div>
            </div>
        </Card>
    );
}
