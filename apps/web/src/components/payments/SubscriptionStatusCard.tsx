import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { logger } from '@/lib/logger';
import { getPlanById } from '@/lib/payments-catalog';
import { PaymentsService } from '@/lib/payments-service';
import type { Subscription, UserEntitlements } from '@/lib/payments-types';
import { userService } from '@/lib/user-service';
import { CreditCard, Crown, Lightning, Sparkle } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PricingModal } from './PricingModal';
import { isTruthy } from '@petspark/shared';

export function SubscriptionStatusCard() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(null);
  const [loading, setLoading] = useState(true);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    void loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      const user = await userService.user();
      if (!user) {
        toast.error('User not authenticated');
        return;
      }
      const [sub, ent] = await Promise.all([
        PaymentsService.getUserSubscription(user.id),
        PaymentsService.getUserEntitlements(user.id),
      ]);
      setSubscription(sub);
      setEntitlements(ent);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to load subscription', err, { action: 'loadSubscriptionData' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription) return;

    if (
      !confirm(
        'Are you sure you want to cancel your subscription? You will keep your benefits until the end of the current period.'
      )
    ) {
      return;
    }

    setCanceling(true);
    try {
      await PaymentsService.cancelSubscription(subscription.id, false);
      toast.success('Subscription canceled', {
        description: 'Your benefits will remain active until the end of your billing period.',
      });
      await loadSubscriptionData();
    } catch {
      toast.error('Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  };

  const getPlanIcon = (tier: string) => {
    switch (tier) {
      case 'premium':
        return <Sparkle size={32} weight="fill" className="text-primary" />;
      case 'elite':
        return <Crown size={32} weight="fill" className="text-accent" />;
      default:
        return <Lightning size={32} weight="regular" className="text-muted-foreground" />;
    }
  };

  if (isTruthy(loading)) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  const plan = subscription ? getPlanById(subscription.planId) : null;
  const isFreeTier = !subscription || entitlements?.planTier === 'free';

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateProgress = () => {
    if (!subscription) return 0;
    const start = new Date(subscription.currentPeriodStart).getTime();
    const end = new Date(subscription.currentPeriodEnd).getTime();
    const now = Date.now();
    const progress = ((now - start) / (end - start)) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getPlanIcon(entitlements?.planTier ?? 'free')}
              <div>
                <CardTitle className="text-2xl">{plan?.name ?? 'Free'} Plan</CardTitle>
                <CardDescription>{plan?.description ?? 'Basic matching features'}</CardDescription>
              </div>
            </div>
            {subscription && (
              <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                {subscription.status === 'trial' ? 'Free Trial' : subscription.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {subscription && !isFreeTier ? (
            <>
              {subscription.isComp && (
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-accent-foreground">
                    🎁 Complimentary Subscription
                  </p>
                  {subscription.compReason && (
                    <p className="text-xs text-muted-foreground mt-1">{subscription.compReason}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Billing Cycle</span>
                  <span className="font-medium">
                    {subscription.trialEnd && new Date(subscription.trialEnd) > new Date()
                      ? 'Trial Period'
                      : 'Monthly'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {subscription.cancelAtPeriodEnd ? 'Access Until' : 'Next Billing Date'}
                  </span>
                  <span className="font-medium">{formatDate(subscription.currentPeriodEnd)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Payment Method</span>
                  <span className="font-medium capitalize">{subscription.store}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Current Period</span>
                  <span>{Math.round(calculateProgress())}%</span>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
              </div>

              {subscription.cancelAtPeriodEnd && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm font-medium text-destructive">Subscription Canceled</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your benefits will remain active until{' '}
                    {formatDate(subscription.currentPeriodEnd)}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {!subscription.cancelAtPeriodEnd && !subscription.isComp && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => void handleCancelSubscription()}
                    disabled={canceling}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {canceling ? 'Canceling...' : 'Cancel Subscription'}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => { setPricingModalOpen(true); }}
                >
                  View All Plans
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upgrade to unlock premium features and find matches faster.
              </p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkle className="h-4 w-4 text-muted-foreground" />
                  <span>Unlimited swipes</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkle className="h-4 w-4 text-muted-foreground" />
                  <span>See who liked you</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkle className="h-4 w-4 text-muted-foreground" />
                  <span>Video calls with matches</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Sparkle className="h-4 w-4 text-muted-foreground" />
                  <span>Advanced filters</span>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={() => setPricingModalOpen(true)}>
                <Sparkle className="h-5 w-5 mr-2" weight="fill" />
                Upgrade to Premium
              </Button>
            </div>
          )}

          {entitlements && (
            <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Active Features</p>
              <div className="flex flex-wrap gap-2">
                {entitlements.entitlements.length === 0 ? (
                  <Badge variant="outline">Basic Features</Badge>
                ) : (
                  entitlements.entitlements.slice(0, 5).map((ent) => (
                    <Badge key={ent} variant="secondary">
                      {ent.replace(/_/g, ' ')}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          )}

          {entitlements &&
            (entitlements.consumables.boosts > 0 || entitlements.consumables.super_likes > 0) && (
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-2">Consumables</p>
                <div className="flex gap-4 text-sm">
                  {entitlements.consumables.boosts > 0 && (
                    <div className="flex items-center gap-2">
                      <Lightning weight="fill" className="h-4 w-4 text-accent" />
                      <span>{entitlements.consumables.boosts} Boosts</span>
                    </div>
                  )}
                  {entitlements.consumables.super_likes > 0 && (
                    <div className="flex items-center gap-2">
                      <Sparkle weight="fill" className="h-4 w-4 text-primary" />
                      <span>{entitlements.consumables.super_likes} Super Likes</span>
                    </div>
                  )}
                </div>
              </div>
            )}
        </CardContent>
      </Card>
      <PricingModal
        open={pricingModalOpen}
        onOpenChange={setPricingModalOpen}
        onSuccess={loadSubscriptionData}
      />
    </>
  );
}
