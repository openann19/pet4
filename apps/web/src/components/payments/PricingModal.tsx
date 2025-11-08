import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkle, Crown, Lightning } from '@phosphor-icons/react';
import type { PlanDefinition } from '@/lib/payments-types';
import { PRODUCT_CATALOG } from '@/lib/payments-catalog';
import { PaymentsService } from '@/lib/payments-service';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PricingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function PricingModal({ open, onOpenChange, onSuccess }: PricingModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: PlanDefinition) => {
    if (plan.tier === 'free') {
      return;
    }

    setLoading(true);
    setSelectedPlan(plan.id);

    try {
      const user = await spark.user();

      await PaymentsService.createSubscription(user.id, plan.id, 'web', { billingCycle });

      toast.success(
        plan.trialDays ? `${plan.trialDays}-day trial started!` : 'Subscription activated!',
        {
          description: `Welcome to ${plan.name}! Your features are now unlocked.`,
        }
      );

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast.error('Subscription failed', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const getPrice = (plan: PlanDefinition) => {
    const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
    const perMonth = billingCycle === 'yearly' ? (price / 12).toFixed(2) : price.toFixed(2);
    return { price, perMonth };
  };

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Sparkle size={24} weight="fill" className="text-primary" />;
      case 'elite':
        return <Crown size={24} weight="fill" className="text-accent" />;
      default:
        return <Lightning size={24} weight="regular" className="text-muted-foreground" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center">Choose Your Plan</DialogTitle>
          <DialogDescription className="text-center text-lg">
            Unlock premium features and find your perfect match faster
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center items-center gap-4 my-6">
          <Button
            variant={billingCycle === 'monthly' ? 'default' : 'outline'}
            onClick={() => setBillingCycle('monthly')}
            className="min-w-[120px]"
          >
            Monthly
          </Button>
          <Button
            variant={billingCycle === 'yearly' ? 'default' : 'outline'}
            onClick={() => setBillingCycle('yearly')}
            className="min-w-[120px]"
          >
            Yearly
            <Badge variant="secondary" className="ml-2">
              Save 17%
            </Badge>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PRODUCT_CATALOG.plans.map((plan) => {
            const { price, perMonth } = getPrice(plan);
            const isPopular = plan.popular;
            const isLoading = loading && selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={cn(
                  'relative rounded-2xl border-2 p-6 transition-all duration-200',
                  isPopular
                    ? 'border-primary shadow-lg shadow-primary/20 scale-105'
                    : 'border-border hover:border-primary/50'
                )}
              >
                {isPopular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                    Most Popular
                  </Badge>
                )}

                <div className="flex flex-col items-center gap-4 mb-6">
                  {getPlanIcon(plan.tier)}
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground text-center">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  {plan.tier === 'free' ? (
                    <div className="text-4xl font-bold">Free</div>
                  ) : (
                    <>
                      <div className="text-4xl font-bold">
                        ${perMonth}
                        <span className="text-lg font-normal text-muted-foreground">/mo</span>
                      </div>
                      {billingCycle === 'yearly' && (
                        <div className="text-sm text-muted-foreground mt-1">
                          ${price} billed annually
                        </div>
                      )}
                      {plan.trialDays && (
                        <Badge variant="secondary" className="mt-2">
                          {plan.trialDays}-day free trial
                        </Badge>
                      )}
                    </>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.entitlements.length === 0 ? (
                    <li className="flex items-start gap-2 text-sm">
                      <Check
                        size={20}
                        weight="bold"
                        className="text-muted-foreground shrink-0 mt-0.5"
                      />
                      <span>Basic matching features</span>
                    </li>
                  ) : (
                    plan.entitlements.slice(0, 5).map((entitlement) => (
                      <li key={entitlement} className="flex items-start gap-2 text-sm">
                        <Check size={20} weight="bold" className="text-primary shrink-0 mt-0.5" />
                        <span className="capitalize">{entitlement.replace(/_/g, ' ')}</span>
                      </li>
                    ))
                  )}
                  {plan.entitlements.length > 5 && (
                    <li className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check size={20} weight="bold" className="shrink-0 mt-0.5" />
                      <span>And {plan.entitlements.length - 5} more...</span>
                    </li>
                  )}
                </ul>

                <Button
                  className="w-full"
                  variant={isPopular ? 'default' : 'outline'}
                  onClick={() => handleSubscribe(plan)}
                  disabled={loading || plan.tier === 'free'}
                  size="lg"
                >
                  {isLoading
                    ? 'Processing...'
                    : plan.tier === 'free'
                      ? 'Current Plan'
                      : 'Get Started'}
                </Button>

                {plan.tier !== 'free' && (
                  <p className="text-xs text-center text-muted-foreground mt-4">
                    Cancel anytime • Auto-renews{' '}
                    {billingCycle === 'monthly' ? 'monthly' : 'annually'}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>All plans include secure payments and instant activation</p>
          <p className="mt-1">
            Questions? <button className="text-primary hover:underline">Contact Support</button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
