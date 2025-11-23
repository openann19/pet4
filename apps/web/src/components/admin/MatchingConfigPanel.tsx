import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import type { MatchingConfig } from '@/core/domain/matching-config';
import {
  DEFAULT_MATCHING_WEIGHTS,
  WEIGHT_SAFE_RANGES,
  DEFAULT_HARD_GATES,
} from '@/core/domain/matching-config';
import { isTruthy } from '@petspark/shared';
import { matchingAPI } from '@/api/matching-api';
import type { UpdateMatchingConfigData } from '@/api/types';
import { toast } from 'sonner';
import { FloppyDisk, ArrowsClockwise } from '@phosphor-icons/react';
import { createLogger } from '@/lib/logger';
import { configBroadcastService } from '@/core/services/config-broadcast-service';
import { adminApi } from '@/api/admin-api';
import { useStorage } from '@/hooks/use-storage';
import type { User } from '@/lib/user-service';
import { Radio } from '@phosphor-icons/react';

const logger = createLogger('MatchingConfigPanel');

export function MatchingConfigPanel() {
  const [config, setConfig] = useState<MatchingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);
  const [currentUser] = useStorage<User | null>('current-user', null);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const currentConfig = await matchingAPI.getConfig();
      if (currentConfig) {
        setConfig(currentConfig);
      } else {
        const defaultConfig: MatchingConfig = {
          id: 'default',
          weights: DEFAULT_MATCHING_WEIGHTS,
          hardGates: DEFAULT_HARD_GATES,
          featureFlags: {
            MATCH_ALLOW_CROSS_SPECIES: false,
            MATCH_REQUIRE_VACCINATION: true,
            MATCH_DISTANCE_MAX_KM: 50,
            MATCH_AB_TEST_KEYS: [],
            MATCH_AI_HINTS_ENABLED: true,
          },
          updatedAt: new Date().toISOString(),
          updatedBy: 'admin',
        };
        setConfig(defaultConfig);
      }
    } catch (error) {
      void toast.error('Failed to load configuration');
      logger.error(
        'Failed to load configuration',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);

      const updateData: UpdateMatchingConfigData = {
        weights: config.weights,
        hardGates: config.hardGates,
        featureFlags: config.featureFlags,
      };

      const updatedConfig = await matchingAPI.updateConfig(updateData);
      setConfig(updatedConfig);
      void toast.success('Configuration saved successfully');
    } catch (error) {
      void toast.error('Failed to save configuration');
      logger.error(
        'Failed to save configuration',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndBroadcast = async () => {
    if (!config || !currentUser) return;

    try {
      setSaving(true);
      setBroadcasting(true);

      const updateData: UpdateMatchingConfigData = {
        weights: config.weights,
        hardGates: config.hardGates,
        featureFlags: config.featureFlags,
      };

      const updatedConfig = await matchingAPI.updateConfig(updateData);
      setConfig(updatedConfig);

      // Broadcast the config
      await configBroadcastService.broadcastConfig(
        'matching',
        updatedConfig satisfies Record<string, unknown>,
        currentUser.id || 'admin'
      );

      void toast.success('Configuration saved and broadcasted successfully');

      // Log audit entry
      await adminApi.createAuditLog({
        adminId: currentUser.id || 'admin',
        action: 'config_broadcast',
        targetType: 'matching_config',
        targetId: updatedConfig.id || 'default',
        details: JSON.stringify({ configType: 'matching' }),
      });
    } catch (error) {
      void toast.error('Failed to save and broadcast configuration');
      logger.error(
        'Failed to save and broadcast configuration',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setSaving(false);
      setBroadcasting(false);
    }
  };

  const handleWeightChange = (key: keyof typeof DEFAULT_MATCHING_WEIGHTS, value: number) => {
    if (!config) return;
    setConfig({
      ...config,
      weights: {
        ...config.weights,
        [key]: value,
      },
    });
  };

  const handleHardGateChange = (key: keyof typeof DEFAULT_HARD_GATES, value: boolean | number) => {
    if (!config) return;
    setConfig({
      ...config,
      hardGates: {
        ...config.hardGates,
        [key]: value,
      },
    });
  };

  const handleFeatureFlagChange = (key: string, value: boolean | number) => {
    if (!config) return;
    setConfig({
      ...config,
      featureFlags: {
        ...config.featureFlags,
        [key]: value,
      },
    });
  };

  const getTotalWeight = () => {
    const weightValues = Object.values(config?.weights ?? {}) as number[];
    return weightValues.reduce((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
  };

  if (isTruthy(loading)) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-2">
            <ArrowsClockwise className="animate-spin" size={20} />
            <span>Loading configuration...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!config) {
    return null;
  }

  const totalWeight = getTotalWeight();
  const isWeightValid = totalWeight === 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Matching Weights Configuration</CardTitle>
          <CardDescription>
            Adjust the scoring weights for different compatibility factors. Total must equal 100%.
          </CardDescription>
          <div className="text-sm font-medium mt-2">
            Total: {totalWeight}%{' '}
            {!isWeightValid && <span className="text-destructive">(Must be 100%)</span>}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(config.weights).map(([key, value]) => {
            const range = WEIGHT_SAFE_RANGES[key as keyof typeof config.weights];
            return (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={key} className="text-sm font-medium">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Label>
                  <span className="text-sm text-muted-foreground">{value}%</span>
                </div>
                <Slider
                  id={key}
                  min={range.min}
                  max={range.max}
                  step={1}
                  value={[value]}
                  onValueChange={([val]) => {
                    if (val !== undefined && typeof val === 'number') {
                      handleWeightChange(key as keyof typeof config.weights, val);
                    }
                  }}
                  className="w-full"
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Hard Gates Configuration</CardTitle>
          <CardDescription>
            Configure mandatory matching gates that block matches when not met.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="allowCrossSpecies">Allow Cross-Species Matching</Label>
              <p className="text-sm text-muted-foreground">Enable matching between dogs and cats</p>
            </div>
            <Switch
              id="allowCrossSpecies"
              checked={config.hardGates.allowCrossSpecies}
              onCheckedChange={(val) => { handleHardGateChange('allowCrossSpecies', val); }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="requireVaccinations">Require Up-to-Date Vaccinations</Label>
              <p className="text-sm text-muted-foreground">
                Block matches without current vaccinations
              </p>
            </div>
            <Switch
              id="requireVaccinations"
              checked={config.hardGates.requireVaccinations}
              onCheckedChange={(val) => { handleHardGateChange('requireVaccinations', val); }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="blockAggressionConflicts">Block Aggression Conflicts</Label>
              <p className="text-sm text-muted-foreground">Prevent matches with aggression flags</p>
            </div>
            <Switch
              id="blockAggressionConflicts"
              checked={config.hardGates.blockAggressionConflicts}
              onCheckedChange={(val) => { handleHardGateChange('blockAggressionConflicts', val); }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="requireApprovedMedia">Require Approved Media</Label>
              <p className="text-sm text-muted-foreground">Both pets must have approved photos</p>
            </div>
            <Switch
              id="requireApprovedMedia"
              checked={config.hardGates.requireApprovedMedia}
              onCheckedChange={(val) => { handleHardGateChange('requireApprovedMedia', val); }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enforceNeuterPolicy">Enforce Neuter Policy</Label>
              <p className="text-sm text-muted-foreground">Block breeding if neutered</p>
            </div>
            <Switch
              id="enforceNeuterPolicy"
              checked={config.hardGates.enforceNeuterPolicy}
              onCheckedChange={(val) => { handleHardGateChange('enforceNeuterPolicy', val); }}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="maxDistanceKm">Maximum Distance (km)</Label>
            <Input
              id="maxDistanceKm"
              type="number"
              min="1"
              max="1000"
              value={config.hardGates.maxDistanceKm}
              onChange={(e) =>
                handleHardGateChange('maxDistanceKm', parseInt(e.target.value, 10) || 50)
              }
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Feature Flags</CardTitle>
          <CardDescription>Toggle experimental features and system-wide settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="MATCH_ALLOW_CROSS_SPECIES">Cross-Species Matching</Label>
              <p className="text-sm text-muted-foreground">Global toggle for cross-species</p>
            </div>
            <Switch
              id="MATCH_ALLOW_CROSS_SPECIES"
              checked={config.featureFlags.MATCH_ALLOW_CROSS_SPECIES}
              onCheckedChange={(val) => { handleFeatureFlagChange('MATCH_ALLOW_CROSS_SPECIES', val); }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="MATCH_REQUIRE_VACCINATION">Vaccination Requirement</Label>
              <p className="text-sm text-muted-foreground">Globally require vaccinations</p>
            </div>
            <Switch
              id="MATCH_REQUIRE_VACCINATION"
              checked={config.featureFlags.MATCH_REQUIRE_VACCINATION}
              onCheckedChange={(val) => { handleFeatureFlagChange('MATCH_REQUIRE_VACCINATION', val); }}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="MATCH_AI_HINTS_ENABLED">AI Hints Enabled</Label>
              <p className="text-sm text-muted-foreground">Use AI-inferred breed/age data</p>
            </div>
            <Switch
              id="MATCH_AI_HINTS_ENABLED"
              checked={config.featureFlags.MATCH_AI_HINTS_ENABLED}
              onCheckedChange={(val) => { handleFeatureFlagChange('MATCH_AI_HINTS_ENABLED', val); }}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="MATCH_DISTANCE_MAX_KM">Default Max Distance (km)</Label>
            <Input
              id="MATCH_DISTANCE_MAX_KM"
              type="number"
              min="1"
              max="1000"
              value={config.featureFlags.MATCH_DISTANCE_MAX_KM}
              onChange={(e) =>
                handleFeatureFlagChange('MATCH_DISTANCE_MAX_KM', parseInt(e.target.value, 10) || 50)
              }
            />
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-4">
        <Button
          onClick={() => {
            void handleSave().catch((error) => {
              const err = error instanceof Error ? error : new Error(String(error));
              logger.error('Failed to save config', err, { action: 'handleSave' });
              void toast.error('Failed to save configuration');
            });
          }}
          disabled={!isWeightValid || saving || broadcasting}
          className="flex items-center gap-2"
          variant="outline"
        >
          {saving ? (
            <>
              <ArrowsClockwise className="animate-spin" size={18} />
              Saving...
            </>
          ) : (
            <>
              <FloppyDisk size={18} />
              Save Configuration
            </>
          )}
        </Button>

        <Button
          onClick={() => {
            void handleSaveAndBroadcast().catch((error) => {
              const err = error instanceof Error ? error : new Error(String(error));
              logger.error('Failed to save and broadcast config', err, {
                action: 'handleSaveAndBroadcast',
              });
              void toast.error('Failed to save and broadcast configuration');
            });
          }}
          disabled={!isWeightValid || saving || broadcasting}
          className="flex items-center gap-2"
        >
          {broadcasting ? (
            <>
              <ArrowsClockwise className="animate-spin" size={18} />
              Broadcasting...
            </>
          ) : (
            <>
              <Radio size={18} />
              Save & Broadcast
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={() => {
            void loadConfig().catch((error) => {
              const err = error instanceof Error ? error : new Error(String(error));
              logger.error('Failed to load config', err, { action: 'loadConfig' });
              void toast.error('Failed to load configuration');
            });
          }}
          disabled={saving || broadcasting}
        >
          Reset to Current
        </Button>
      </div>
      {config.updatedAt && (
        <p className="text-sm text-muted-foreground">
          Last updated: {new Date(config.updatedAt).toLocaleString()} by {config.updatedBy}
        </p>
      )}
    </div>
  );
}
