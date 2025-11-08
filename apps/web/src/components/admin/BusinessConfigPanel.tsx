/**
 * Business Config Panel
 *
 * Admin panel for managing prices, limits, and experiments.
 */

import { configBroadcastService } from '@/core/services/config-broadcast-service';
import { adminApi } from '@/api/admin-api';
import { useState, useEffect } from 'react';
import { CheckCircle, CurrencyDollar, Flask, Gear, Radio } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/contexts/AppContext';
import { getBusinessConfig, updateBusinessConfig } from '@/lib/purchase-service';
import type { BusinessConfig } from '@/lib/business-types';
import { toast } from 'sonner';
import { useStorage } from '@/hooks/use-storage';
import { logger } from '@/lib/logger';
import type { User } from '@/lib/user-service';

export default function BusinessConfigPanel() {
  const { t: _t } = useApp();
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [currentUser] = useStorage<User | null>('current-user', null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const cfg = await getBusinessConfig();
      if (cfg) {
        setConfig(cfg);
      } else {
        // Create default config
        const defaultConfig: BusinessConfig = {
          id: 'default',
          version: '1',
          prices: {
            premium: { monthly: 9.99, yearly: 99.99, currency: 'USD' },
            elite: { monthly: 19.99, yearly: 199.99, currency: 'USD' },
            boost: { price: 2.99, currency: 'USD' },
            superLike: { price: 0.99, currency: 'USD' },
          },
          limits: {
            free: { swipeDailyCap: 5, adoptionListingLimit: 1 },
            premium: { boostsPerWeek: 1, superLikesPerDay: 0 },
            elite: { boostsPerWeek: 2, superLikesPerDay: 10 },
          },
          experiments: {},
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.id || 'admin',
        };
        setConfig(defaultConfig);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Load config error', err, { action: 'loadConfig' });
      toast.error('Failed to load config');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config || !currentUser) return;

    setSaving(true);
    try {
      await updateBusinessConfig(config, currentUser.id || 'admin');
      toast.success('Business config updated successfully');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Save config error', err, { action: 'saveConfig' });
      toast.error('Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndBroadcast = async () => {
    if (!config || !currentUser) return;

    setSaving(true);
    setBroadcasting(true);
    try {
      // First save the config
      await updateBusinessConfig(config, currentUser.id || 'admin');

      // Then broadcast it
      await configBroadcastService.broadcastConfig(
        'business',
        config as unknown as Record<string, unknown>,
        currentUser.id || 'admin'
      );

      toast.success('Business config saved and broadcasted successfully');

      // Log audit entry
      await adminApi.createAuditLog({
        adminId: currentUser.id || 'admin',
        action: 'config_broadcast',
        targetType: 'business_config',
        targetId: config.id || 'default',
        details: JSON.stringify({ configType: 'business' }),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Save and broadcast config error', err, { action: 'saveAndBroadcastConfig' });
      toast.error('Failed to save and broadcast config');
    } finally {
      setSaving(false);
      setBroadcasting(false);
    }
  };

  const updatePrice = (path: string[], value: number): void => {
    if (!config) return;
    const newConfig = { ...config };
    let current: Record<string, unknown> = newConfig as Record<string, unknown>;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (key === undefined) return;
      const next = current[key];
      if (typeof next === 'object' && next !== null && !Array.isArray(next)) {
        current = next as Record<string, unknown>;
      } else {
        return;
      }
    }
    const lastKey = path[path.length - 1];
    if (lastKey !== undefined) {
      current[lastKey] = value;
    }
    setConfig(newConfig as BusinessConfig);
  };

  const updateLimit = (path: string[], value: number): void => {
    if (!config) return;
    const newConfig = { ...config };
    let current: Record<string, unknown> = newConfig as Record<string, unknown>;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (key === undefined) return;
      const next = current[key];
      if (typeof next === 'object' && next !== null && !Array.isArray(next)) {
        current = next as Record<string, unknown>;
      } else {
        return;
      }
    }
    const lastKey = path[path.length - 1];
    if (lastKey !== undefined) {
      current[lastKey] = value;
    }
    setConfig(newConfig as BusinessConfig);
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading config...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Configuration</h2>
          <p className="text-muted-foreground">Manage prices, limits, and experiments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || broadcasting} variant="outline">
            <CheckCircle size={20} className="mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          <Button onClick={handleSaveAndBroadcast} disabled={saving || broadcasting}>
            <Radio size={20} className="mr-2" />
            {broadcasting ? 'Broadcasting...' : 'Save & Broadcast'}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="prices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prices">
            <CurrencyDollar size={16} className="mr-2" />
            Prices
          </TabsTrigger>
          <TabsTrigger value="limits">
            <Gear size={16} className="mr-2" />
            Limits
          </TabsTrigger>
          <TabsTrigger value="experiments">
            <Flask size={16} className="mr-2" />
            Experiments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prices" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Premium Plan</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Price (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.prices.premium.monthly}
                  onChange={(e) =>
                    updatePrice(['prices', 'premium', 'monthly'], parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Yearly Price (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.prices.premium.yearly}
                  onChange={(e) =>
                    updatePrice(['prices', 'premium', 'yearly'], parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Elite Plan</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Monthly Price (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.prices.elite.monthly}
                  onChange={(e) =>
                    updatePrice(['prices', 'elite', 'monthly'], parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Yearly Price (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.prices.elite.yearly}
                  onChange={(e) =>
                    updatePrice(['prices', 'elite', 'yearly'], parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Consumables</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Boost Price (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.prices.boost.price}
                  onChange={(e) =>
                    updatePrice(['prices', 'boost', 'price'], parseFloat(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Super Like Price (USD)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={config.prices.superLike.price}
                  onChange={(e) =>
                    updatePrice(['prices', 'superLike', 'price'], parseFloat(e.target.value) || 0)
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Free Plan Limits</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Daily Swipe Cap</Label>
                <Input
                  type="number"
                  value={config.limits.free.swipeDailyCap}
                  onChange={(e) =>
                    updateLimit(['limits', 'free', 'swipeDailyCap'], parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Adoption Listing Limit</Label>
                <Input
                  type="number"
                  value={config.limits.free.adoptionListingLimit}
                  onChange={(e) =>
                    updateLimit(
                      ['limits', 'free', 'adoptionListingLimit'],
                      parseInt(e.target.value) || 0
                    )
                  }
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Premium Plan Limits</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Boosts Per Week</Label>
                <Input
                  type="number"
                  value={config.limits.premium.boostsPerWeek}
                  onChange={(e) =>
                    updateLimit(
                      ['limits', 'premium', 'boostsPerWeek'],
                      parseInt(e.target.value) || 0
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Super Likes Per Day</Label>
                <Input
                  type="number"
                  value={config.limits.premium.superLikesPerDay}
                  onChange={(e) =>
                    updateLimit(
                      ['limits', 'premium', 'superLikesPerDay'],
                      parseInt(e.target.value) || 0
                    )
                  }
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Elite Plan Limits</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Boosts Per Week</Label>
                <Input
                  type="number"
                  value={config.limits.elite.boostsPerWeek}
                  onChange={(e) =>
                    updateLimit(['limits', 'elite', 'boostsPerWeek'], parseInt(e.target.value) || 0)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Super Likes Per Day</Label>
                <Input
                  type="number"
                  value={config.limits.elite.superLikesPerDay}
                  onChange={(e) =>
                    updateLimit(
                      ['limits', 'elite', 'superLikesPerDay'],
                      parseInt(e.target.value) || 0
                    )
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="experiments" className="space-y-4">
          <Card className="p-6">
            <p className="text-muted-foreground">
              Experiment configuration UI coming soon. For now, experiments can be managed via API.
            </p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
