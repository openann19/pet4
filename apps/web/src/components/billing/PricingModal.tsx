// apps/web/src/components/billing/PricingModal.tsx
'use client';

import {
    useEffect,
    useMemo,
    useState,
    type ReactNode,
    useCallback,
} from 'react';
import { billingClient } from '@petspark/core/billing/billing-client';
import type { BillingPlan } from '@petspark/core/billing/billing-types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getTypographyClasses } from '@/lib/typography';
import { createLogger } from '@/lib/logger';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

const logger = createLogger('PricingModal');

export interface PricingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCheckoutStarted?: (planId: string) => void;
    onCheckoutFailed?: (error: Error) => void;
    footerSlot?: ReactNode;
}

type BillingIntervalFilter = 'month' | 'year';

export function PricingModal({
    open,
    onOpenChange,
    onCheckoutStarted,
    onCheckoutFailed,
    footerSlot,
}: PricingModalProps): React.JSX.Element {
    const [plans, setPlans] = useState<BillingPlan[]>([]);
    const [intervalFilter, setIntervalFilter] =
        useState<BillingIntervalFilter>('month');
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckoutLoading, setIsCheckoutLoading] = useState<string | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open) return;

        const abortController = new AbortController();

        async function loadPlans() {
            try {
                setIsLoading(true);
                setError(null);
                const data = await billingClient.getPlans(
                    abortController.signal,
                );
                setPlans(data);
            } catch (err) {
                const e = err as Error;
                logger.error('Failed to load billing plans', e);
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        }

        void loadPlans();

        return () => {
            abortController.abort();
        };
    }, [open]);

    const filteredPlans = useMemo(
        () =>
            plans.filter((plan) => plan.interval === intervalFilter),
        [plans, intervalFilter],
    );

    const mostPopularPlanId = useMemo(
        () =>
            filteredPlans.find((p) => p.isMostPopular)?.id ?? null,
        [filteredPlans],
    );

    const handleCheckout = useCallback(
        async (planId: string) => {
            try {
                setIsCheckoutLoading(planId);
                setError(null);
                onCheckoutStarted?.(planId);
                const { checkoutUrl } = await billingClient.createCheckoutSession(
                    planId,
                    window.location.href,
                );
                window.location.assign(checkoutUrl);
            } catch (err) {
                const e = err as Error;
                logger.error('Failed to start checkout', e);
                setError(e.message);
                onCheckoutFailed?.(e);
            } finally {
                setIsCheckoutLoading(null);
            }
        },
        [onCheckoutFailed, onCheckoutStarted],
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl rounded-3xl border border-border/60 bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle
                        className={cn(
                            getTypographyClasses('h2'),
                            'bg-clip-text text-transparent bg-[linear-gradient(90deg,var(--primary),var(--primary-foreground))]',
                        )}
                    >
                        Choose your PETSPARK plan
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        Unlock premium features like advanced matching, live streaming, and
                        enhanced analytics for you and your pets.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 flex items-center justify-between gap-3">
                    <ToggleGroup
                        type="single"
                        value={intervalFilter}
                        onValueChange={(value) => {
                            if (!value) return;
                            setIntervalFilter(value as BillingIntervalFilter);
                        }}
                        className="inline-flex items-center justify-center rounded-full bg-muted/70 p-1 text-xs"
                    >
                        <ToggleGroupItem
                            value="month"
                            className="rounded-full px-3 py-1 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                        >
                            Monthly
                        </ToggleGroupItem>
                        <ToggleGroupItem
                            value="year"
                            className="rounded-full px-3 py-1 data-[state=on]:bg-background data-[state=on]:shadow-sm"
                        >
                            Yearly
                        </ToggleGroupItem>
                    </ToggleGroup>

                    {footerSlot ? (
                        <div className="text-xs text-muted-foreground">
                            {footerSlot}
                        </div>
                    ) : null}
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                    {isLoading ? (
                        Array.from({ length: 3 }, (_, idx) => (
                            <div
                                key={`pricing-skeleton-${idx}`}
                                className="animate-pulse rounded-2xl border border-border/50 bg-muted/40 p-4"
                            >
                                <div className="h-5 w-24 rounded bg-muted-foreground/20" />
                                <div className="mt-2 h-4 w-32 rounded bg-muted-foreground/15" />
                                <div className="mt-4 space-y-2">
                                    <div className="h-3 w-full rounded bg-muted-foreground/10" />
                                    <div className="h-3 w-3/4 rounded bg-muted-foreground/10" />
                                    <div className="h-3 w-2/3 rounded bg-muted-foreground/10" />
                                </div>
                            </div>
                        ))
                    ) : filteredPlans.length === 0 ? (
                        <p className="col-span-3 text-sm text-muted-foreground">
                            No plans available for the selected interval.
                        </p>
                    ) : (
                        filteredPlans.map((plan) => {
                            const price = (plan.priceCents / 100).toFixed(2);
                            const isPopular = plan.id === mostPopularPlanId;

                            return (
                                <div
                                    key={plan.id}
                                    className={cn(
                                        'relative flex flex-col rounded-2xl border border-border/60 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),transparent_55%),linear-gradient(145deg,_rgba(15,15,30,0.96),_rgba(5,10,25,0.98))] p-4 shadow-[0_20px_40px_rgba(0,0,0,0.55)]',
                                        isPopular &&
                                        'border-primary/70 shadow-[0_24px_55px_rgba(37,99,235,0.4)]',
                                    )}
                                >
                                    {isPopular ? (
                                        <div className="absolute right-3 top-3 rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-foreground backdrop-blur">
                                            Most popular
                                        </div>
                                    ) : null}
                                    <div className="space-y-1">
                                        <h3
                                            className={cn(
                                                getTypographyClasses('h3'),
                                                'text-sm sm:text-base',
                                            )}
                                        >
                                            {plan.name}
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            {plan.description}
                                        </p>
                                    </div>

                                    <div className="mt-3 flex items-baseline gap-1">
                                        <span className="text-2xl font-semibold text-foreground">
                                            {price}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {plan.currency.toUpperCase()}/{plan.interval}
                                        </span>
                                    </div>

                                    <ul className="mt-3 flex-1 space-y-1 text-xs text-muted-foreground">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start gap-1.5">
                                                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        type="button"
                                        className="mt-4 w-full"
                                        disabled={isCheckoutLoading === plan.id}
                                        onClick={() => {
                                            void handleCheckout(plan.id);
                                        }}
                                    >
                                        {isCheckoutLoading === plan.id
                                            ? 'Redirecting...'
                                            : 'Continue'}
                                    </Button>
                                </div>
                            );
                        })
                    )}
                </div>

                {error ? (
                    <p className="mt-3 text-xs text-destructive">
                        {error}
                    </p>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
