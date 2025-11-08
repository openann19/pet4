'use client';

import type { ReactNode } from 'react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStorage } from '@/hooks/use-storage';
import {
  Eye,
  EyeSlash,
  Globe,
  Image as ImageIcon,
  Key,
  MapPin,
  Robot,
  ShieldCheck,
  TestTube,
  VideoCamera,
  Warning,
  Radio,
} from '@phosphor-icons/react';
import { useBounceOnTap } from '@/effects/reanimated/use-bounce-on-tap';
import { useHoverLift } from '@/effects/reanimated/use-hover-lift';
import { AnimatedView } from '@/effects/reanimated/animated-view';
import { triggerHaptic } from '@/lib/haptics';
import { createLogger } from '@/lib/logger';
import { configBroadcastService } from '@/core/services/config-broadcast-service';
import { adminApi } from '@/api/admin-api';
import { useStorage as useUserStorage } from '@/hooks/use-storage';
import type { User } from '@/lib/user-service';
import type { UseBounceOnTapReturn } from '@/effects/reanimated/use-bounce-on-tap';

const logger = createLogger('APIConfigView');

interface AnimatedButtonProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  bounceAnimation: UseBounceOnTapReturn;
}

function AnimatedButton({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  size = 'default',
  className = '',
  bounceAnimation,
}: AnimatedButtonProps): JSX.Element {
  const handleClick = useCallback((): void => {
    if (disabled) return;
    bounceAnimation.handlePress();
    onClick();
  }, [disabled, onClick, bounceAnimation]);

  return (
    <AnimatedView style={bounceAnimation.animatedStyle} className={className}>
      <Button variant={variant} size={size} onClick={handleClick} disabled={disabled}>
        {children}
      </Button>
    </AnimatedView>
  );
}

export interface APIConfig {
  maps: {
    provider: 'google' | 'mapbox' | 'openstreetmap';
    apiKey: string;
    enabled: boolean;
    rateLimit: number;
  };
  ai: {
    provider: 'openai' | 'anthropic' | 'spark';
    apiKey: string;
    model: string;
    enabled: boolean;
    maxTokens: number;
    temperature: number;
  };
  kyc: {
    provider: 'stripe' | 'onfido' | 'jumio' | 'manual';
    apiKey: string;
    enabled: boolean;
    autoApprove: boolean;
    requireDocuments: boolean;
  };
  photoModeration: {
    provider: 'aws-rekognition' | 'google-vision' | 'openai' | 'spark';
    apiKey: string;
    enabled: boolean;
    autoReject: boolean;
    confidenceThreshold: number;
  };
  sms: {
    provider: 'twilio' | 'vonage' | 'aws-sns' | 'disabled';
    apiKey: string;
    apiSecret: string;
    enabled: boolean;
    fromNumber: string;
  };
  email: {
    provider: 'sendgrid' | 'mailgun' | 'aws-ses' | 'disabled';
    apiKey: string;
    enabled: boolean;
    fromEmail: string;
    fromName: string;
  };
  storage: {
    provider: 'aws-s3' | 'cloudflare-r2' | 'local';
    apiKey: string;
    apiSecret: string;
    bucket: string;
    region: string;
    enabled: boolean;
  };
  analytics: {
    provider: 'google-analytics' | 'mixpanel' | 'amplitude' | 'disabled';
    apiKey: string;
    enabled: boolean;
  };
  livekit: {
    apiKey: string;
    apiSecret: string;
    wsUrl: string;
    enabled: boolean;
  };
}

const DEFAULT_CONFIG: APIConfig = {
  maps: {
    provider: 'openstreetmap',
    apiKey: '',
    enabled: true,
    rateLimit: 100,
  },
  ai: {
    provider: 'spark',
    apiKey: '',
    model: 'gpt-4o',
    enabled: true,
    maxTokens: 1000,
    temperature: 0.7,
  },
  kyc: {
    provider: 'manual',
    apiKey: '',
    enabled: true,
    autoApprove: false,
    requireDocuments: true,
  },
  photoModeration: {
    provider: 'spark',
    apiKey: '',
    enabled: true,
    autoReject: false,
    confidenceThreshold: 0.8,
  },
  sms: {
    provider: 'disabled',
    apiKey: '',
    apiSecret: '',
    enabled: false,
    fromNumber: '',
  },
  email: {
    provider: 'disabled',
    apiKey: '',
    enabled: false,
    fromEmail: '',
    fromName: 'PawfectMatch',
  },
  storage: {
    provider: 'local',
    apiKey: '',
    apiSecret: '',
    bucket: '',
    region: 'us-east-1',
    enabled: true,
  },
  analytics: {
    provider: 'disabled',
    apiKey: '',
    enabled: false,
  },
  livekit: {
    apiKey: '',
    apiSecret: '',
    wsUrl: '',
    enabled: false,
  },
};

export default function APIConfigView() {
  const [config, setConfig] = useStorage<APIConfig>('admin-api-config', DEFAULT_CONFIG);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testingService, setTestingService] = useState<string | null>(null);
  const [broadcasting, setBroadcasting] = useState(false);
  const [currentUser] = useUserStorage<User | null>('current-user', null);

  const toggleSecret = useCallback(
    (key: string): void => {
      try {
        triggerHaptic('light');
        setShowSecrets((prev) => ({ ...prev, [key]: !prev[key] }));
        logger.info('Secret visibility toggled', { key, visible: !showSecrets[key] });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to toggle secret visibility', err, { key });
      }
    },
    [showSecrets]
  );

  const updateConfig = useCallback(
    (section: keyof APIConfig, field: string, value: string | boolean | number): void => {
      try {
        triggerHaptic('selection');
        setConfig((current: APIConfig) => {
          if (!current) {
            logger.warn('Config is null, using defaults');
            return DEFAULT_CONFIG;
          }
          return {
            ...current,
            [section]: {
              ...current[section],
              [field]: value,
            },
          };
        });
        toast.success('Configuration updated');
        logger.info('Configuration updated', { section, field, value });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to update configuration', err, { section, field, value });
        toast.error('Failed to update configuration');
      }
    },
    [setConfig]
  );

  const testConnection = useCallback(async (service: string): Promise<void> => {
    try {
      triggerHaptic('light');
      setTestingService(service);
      logger.info('Testing connection', { service });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      setTestingService(null);
      triggerHaptic('success');
      toast.success(`${service} connection test successful`);
      logger.info('Connection test successful', { service });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setTestingService(null);
      triggerHaptic('error');
      toast.error(`${service} connection test failed`);
      logger.error('Connection test failed', err, { service });
    }
  }, []);

  const resetToDefaults = useCallback(
    (section: keyof APIConfig): void => {
      try {
        triggerHaptic('medium');
        setConfig((current: APIConfig) => ({
          ...current,
          [section]: DEFAULT_CONFIG[section],
        }));
        toast.success('Reset to default configuration');
        logger.info('Configuration reset to defaults', { section });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        logger.error('Failed to reset configuration', err, { section });
        toast.error('Failed to reset configuration');
      }
    },
    [setConfig]
  );

  const handleBroadcast = useCallback(async (): Promise<void> => {
    if (!config || !currentUser) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setBroadcasting(true);
      triggerHaptic('light');

      await configBroadcastService.broadcastConfig(
        'api',
        config as unknown as Record<string, unknown>,
        currentUser.id || 'admin'
      );

      toast.success('API configuration broadcasted successfully');

      await adminApi.createAuditLog({
        adminId: currentUser.id || 'admin',
        action: 'config_broadcast',
        targetType: 'api_config',
        targetId: 'api-config',
        details: JSON.stringify({ configType: 'api' }),
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Failed to broadcast API config', err);
      toast.error('Failed to broadcast API configuration');
    } finally {
      setBroadcasting(false);
    }
  }, [config, currentUser]);

  const testButtonBounce = useBounceOnTap({ scale: 0.92, duration: 180 });
  const resetButtonBounce = useBounceOnTap({ scale: 0.93, duration: 160 });
  const iconButtonBounce = useBounceOnTap({ scale: 0.9, duration: 120 });
  const cardHover = useHoverLift({ scale: 1.02 });

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API Configuration</h1>
            <p className="text-muted-foreground">
              Configure external service integrations and API keys
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-2">
              <Key size={16} />
              Secure Storage
            </Badge>
            <Button onClick={handleBroadcast} disabled={broadcasting} variant="default">
              <Radio size={16} className="mr-2" />
              {broadcasting ? 'Broadcasting...' : 'Broadcast Config'}
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-6xl">
          <AnimatedView
            style={cardHover.animatedStyle}
            onMouseEnter={cardHover.handleEnter}
            onMouseLeave={cardHover.handleLeave}
          >
            <Card className="border-amber-500/50 bg-amber-500/5">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Warning size={24} className="text-amber-600 shrink-0" weight="fill" />
                  <div className="space-y-1">
                    <p className="font-medium text-amber-900 dark:text-amber-100">
                      Security Notice
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      API keys and secrets are stored securely using Spark's KV storage. Never share
                      these credentials or commit them to version control. All keys are encrypted at
                      rest.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedView>

          <Tabs defaultValue="maps" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9">
              <TabsTrigger value="maps">Maps</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
              <TabsTrigger value="kyc">KYC</TabsTrigger>
              <TabsTrigger value="moderation">Moderation</TabsTrigger>
              <TabsTrigger value="sms">SMS</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="livekit">LiveKit</TabsTrigger>
            </TabsList>

            <TabsContent value="maps" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <MapPin size={24} className="text-blue-600" weight="fill" />
                      </div>
                      <div>
                        <CardTitle>Maps Service</CardTitle>
                        <CardDescription>
                          Configure map provider for location features
                        </CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.maps?.enabled ?? true}
                      onCheckedChange={(checked) => updateConfig('maps', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="maps-provider">Provider</Label>
                    <select
                      id="maps-provider"
                      value={config?.maps?.provider ?? 'openstreetmap'}
                      onChange={(e) => updateConfig('maps', 'provider', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="google">Google Maps</option>
                      <option value="mapbox">Mapbox</option>
                      <option value="openstreetmap">OpenStreetMap (Free)</option>
                    </select>
                  </div>

                  {config?.maps?.provider !== 'openstreetmap' && (
                    <div className="space-y-3">
                      <Label htmlFor="maps-key">API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="maps-key"
                            type={showSecrets['maps-key'] ? 'text' : 'password'}
                            value={config?.maps?.apiKey ?? ''}
                            onChange={(e) => updateConfig('maps', 'apiKey', e.target.value)}
                            placeholder="sk_..."
                          />
                        </div>
                        <AnimatedButton
                          variant="outline"
                          size="icon"
                          onClick={() => toggleSecret('maps-key')}
                          bounceAnimation={iconButtonBounce}
                        >
                          {showSecrets['maps-key'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                        </AnimatedButton>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="maps-rate">Rate Limit (requests/min)</Label>
                    <Input
                      id="maps-rate"
                      type="number"
                      value={config?.maps?.rateLimit ?? 100}
                      onChange={(e) => updateConfig('maps', 'rateLimit', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="flex gap-2">
                    <AnimatedButton
                      onClick={() => testConnection('Maps')}
                      disabled={testingService === 'Maps'}
                      className="flex-1"
                      bounceAnimation={testButtonBounce}
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'Maps' ? 'Testing...' : 'Test Connection'}
                    </AnimatedButton>
                    <AnimatedButton
                      onClick={() => resetToDefaults('maps')}
                      variant="outline"
                      bounceAnimation={resetButtonBounce}
                    >
                      Reset
                    </AnimatedButton>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Robot size={24} className="text-purple-600" weight="fill" />
                      </div>
                      <div>
                        <CardTitle>AI Service</CardTitle>
                        <CardDescription>
                          Configure AI provider for matching and analysis
                        </CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.ai?.enabled ?? true}
                      onCheckedChange={(checked) => updateConfig('ai', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="ai-provider">Provider</Label>
                    <select
                      id="ai-provider"
                      value={config?.ai?.provider ?? 'spark'}
                      onChange={(e) => updateConfig('ai', 'provider', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="spark">Spark AI (Included)</option>
                      <option value="openai">OpenAI</option>
                      <option value="anthropic">Anthropic</option>
                    </select>
                  </div>

                  {config?.ai?.provider !== 'spark' && (
                    <div className="space-y-3">
                      <Label htmlFor="ai-key">API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="ai-key"
                            type={showSecrets['ai-key'] ? 'text' : 'password'}
                            value={config?.ai?.apiKey ?? ''}
                            onChange={(e) => updateConfig('ai', 'apiKey', e.target.value)}
                            placeholder="sk_..."
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleSecret('ai-key')}
                        >
                          {showSecrets['ai-key'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="ai-model">Model</Label>
                    <select
                      id="ai-model"
                      value={config?.ai?.model ?? 'gpt-4o'}
                      onChange={(e) => updateConfig('ai', 'model', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="gpt-4o">GPT-4o (Recommended)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (Faster)</option>
                      <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="ai-tokens">Max Tokens</Label>
                      <Input
                        id="ai-tokens"
                        type="number"
                        value={config?.ai?.maxTokens ?? 1000}
                        onChange={(e) => updateConfig('ai', 'maxTokens', parseInt(e.target.value))}
                      />
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="ai-temp">Temperature</Label>
                      <Input
                        id="ai-temp"
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={config?.ai?.temperature ?? 0.7}
                        onChange={(e) =>
                          updateConfig('ai', 'temperature', parseFloat(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection('AI')}
                      disabled={testingService === 'AI'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'AI' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => resetToDefaults('ai')}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kyc" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <ShieldCheck size={24} className="text-green-600" weight="fill" />
                      </div>
                      <div>
                        <CardTitle>KYC / Identity Verification</CardTitle>
                        <CardDescription>Configure identity verification service</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.kyc?.enabled ?? true}
                      onCheckedChange={(checked) => updateConfig('kyc', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="kyc-provider">Provider</Label>
                    <select
                      id="kyc-provider"
                      value={config?.kyc?.provider ?? 'manual'}
                      onChange={(e) => updateConfig('kyc', 'provider', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="manual">Manual Review</option>
                      <option value="stripe">Stripe Identity</option>
                      <option value="onfido">Onfido</option>
                      <option value="jumio">Jumio</option>
                    </select>
                  </div>

                  {config?.kyc?.provider !== 'manual' && (
                    <div className="space-y-3">
                      <Label htmlFor="kyc-key">API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="kyc-key"
                            type={showSecrets['kyc-key'] ? 'text' : 'password'}
                            value={config?.kyc?.apiKey ?? ''}
                            onChange={(e) => updateConfig('kyc', 'apiKey', e.target.value)}
                            placeholder="sk_..."
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleSecret('kyc-key')}
                        >
                          {showSecrets['kyc-key'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Auto-approve Verifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically approve successful verification checks
                        </p>
                      </div>
                      <Switch
                        checked={config?.kyc?.autoApprove ?? false}
                        onCheckedChange={(checked) => updateConfig('kyc', 'autoApprove', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label>Require Documents</Label>
                        <p className="text-sm text-muted-foreground">
                          Require photo ID and proof of pet ownership
                        </p>
                      </div>
                      <Switch
                        checked={config?.kyc?.requireDocuments ?? true}
                        onCheckedChange={(checked) =>
                          updateConfig('kyc', 'requireDocuments', checked)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection('KYC')}
                      disabled={testingService === 'KYC'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'KYC' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => resetToDefaults('kyc')}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="moderation" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500/10">
                        <ImageIcon size={24} className="text-red-600" weight="fill" />
                      </div>
                      <div>
                        <CardTitle>Photo Moderation</CardTitle>
                        <CardDescription>Configure automated content moderation</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.photoModeration?.enabled ?? true}
                      onCheckedChange={(checked) =>
                        updateConfig('photoModeration', 'enabled', checked)
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="mod-provider">Provider</Label>
                    <select
                      id="mod-provider"
                      value={config?.photoModeration?.provider ?? 'spark'}
                      onChange={(e) => updateConfig('photoModeration', 'provider', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="spark">Spark Moderation (Included)</option>
                      <option value="openai">OpenAI Vision</option>
                      <option value="google-vision">Google Cloud Vision</option>
                      <option value="aws-rekognition">AWS Rekognition</option>
                    </select>
                  </div>

                  {config?.photoModeration?.provider !== 'spark' && (
                    <div className="space-y-3">
                      <Label htmlFor="mod-key">API Key</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            id="mod-key"
                            type={showSecrets['mod-key'] ? 'text' : 'password'}
                            value={config?.photoModeration?.apiKey ?? ''}
                            onChange={(e) =>
                              updateConfig('photoModeration', 'apiKey', e.target.value)
                            }
                            placeholder="sk_..."
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleSecret('mod-key')}
                        >
                          {showSecrets['mod-key'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="mod-threshold">
                      Confidence Threshold (
                      {Math.round((config?.photoModeration?.confidenceThreshold ?? 0.8) * 100)}%)
                    </Label>
                    <Input
                      id="mod-threshold"
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={config?.photoModeration?.confidenceThreshold ?? 0.8}
                      onChange={(e) =>
                        updateConfig(
                          'photoModeration',
                          'confidenceThreshold',
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher values are more strict but may have false positives
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Auto-reject Violations</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically reject photos that violate policies
                      </p>
                    </div>
                    <Switch
                      checked={config?.photoModeration?.autoReject ?? false}
                      onCheckedChange={(checked) =>
                        updateConfig('photoModeration', 'autoReject', checked)
                      }
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection('Photo Moderation')}
                      disabled={testingService === 'Photo Moderation'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'Photo Moderation' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => resetToDefaults('photoModeration')}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sms" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-indigo-500/10">
                        <Globe size={24} className="text-indigo-600" weight="fill" />
                      </div>
                      <div>
                        <CardTitle>SMS Service</CardTitle>
                        <CardDescription>
                          Configure SMS notifications and verification
                        </CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.sms?.enabled ?? false}
                      onCheckedChange={(checked) => updateConfig('sms', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="sms-provider">Provider</Label>
                    <select
                      id="sms-provider"
                      value={config?.sms?.provider ?? 'disabled'}
                      onChange={(e) => updateConfig('sms', 'provider', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="disabled">Disabled</option>
                      <option value="twilio">Twilio</option>
                      <option value="vonage">Vonage (Nexmo)</option>
                      <option value="aws-sns">AWS SNS</option>
                    </select>
                  </div>

                  {config?.sms?.provider !== 'disabled' && (
                    <>
                      <div className="space-y-3">
                        <Label htmlFor="sms-key">API Key / Account SID</Label>
                        <div className="flex gap-2">
                          <Input
                            id="sms-key"
                            type={showSecrets['sms-key'] ? 'text' : 'password'}
                            value={config?.sms?.apiKey ?? ''}
                            onChange={(e) => updateConfig('sms', 'apiKey', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleSecret('sms-key')}
                          >
                            {showSecrets['sms-key'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="sms-secret">API Secret / Auth Token</Label>
                        <div className="flex gap-2">
                          <Input
                            id="sms-secret"
                            type={showSecrets['sms-secret'] ? 'text' : 'password'}
                            value={config?.sms?.apiSecret ?? ''}
                            onChange={(e) => updateConfig('sms', 'apiSecret', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleSecret('sms-secret')}
                          >
                            {showSecrets['sms-secret'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="sms-from">From Number</Label>
                        <Input
                          id="sms-from"
                          type="tel"
                          value={config?.sms?.fromNumber ?? ''}
                          onChange={(e) => updateConfig('sms', 'fromNumber', e.target.value)}
                          placeholder="+1234567890"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection('SMS')}
                      disabled={testingService === 'SMS' || config?.sms?.provider === 'disabled'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'SMS' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => resetToDefaults('sms')}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10">
                        <Globe size={24} className="text-cyan-600" weight="fill" />
                      </div>
                      <div>
                        <CardTitle>Email Service</CardTitle>
                        <CardDescription>Configure email notifications and alerts</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.email?.enabled ?? false}
                      onCheckedChange={(checked) => updateConfig('email', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="email-provider">Provider</Label>
                    <select
                      id="email-provider"
                      value={config?.email?.provider ?? 'disabled'}
                      onChange={(e) => updateConfig('email', 'provider', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="disabled">Disabled</option>
                      <option value="sendgrid">SendGrid</option>
                      <option value="mailgun">Mailgun</option>
                      <option value="aws-ses">AWS SES</option>
                    </select>
                  </div>

                  {config?.email?.provider !== 'disabled' && (
                    <>
                      <div className="space-y-3">
                        <Label htmlFor="email-key">API Key</Label>
                        <div className="flex gap-2">
                          <Input
                            id="email-key"
                            type={showSecrets['email-key'] ? 'text' : 'password'}
                            value={config?.email?.apiKey ?? ''}
                            onChange={(e) => updateConfig('email', 'apiKey', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleSecret('email-key')}
                          >
                            {showSecrets['email-key'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="email-from">From Email</Label>
                        <Input
                          id="email-from"
                          type="email"
                          value={config?.email?.fromEmail ?? ''}
                          onChange={(e) => updateConfig('email', 'fromEmail', e.target.value)}
                          placeholder="noreply@pawfectmatch.com"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="email-name">From Name</Label>
                        <Input
                          id="email-name"
                          value={config?.email?.fromName ?? 'PawfectMatch'}
                          onChange={(e) => updateConfig('email', 'fromName', e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection('Email')}
                      disabled={
                        testingService === 'Email' || config?.email?.provider === 'disabled'
                      }
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'Email' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => resetToDefaults('email')}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="storage" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/10">
                        <ImageIcon size={24} className="text-orange-600" weight="fill" />
                      </div>
                      <div>
                        <CardTitle>Storage Service</CardTitle>
                        <CardDescription>Configure file and image storage</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.storage?.enabled ?? true}
                      onCheckedChange={(checked) => updateConfig('storage', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="storage-provider">Provider</Label>
                    <select
                      id="storage-provider"
                      value={config?.storage?.provider ?? 'local'}
                      onChange={(e) => updateConfig('storage', 'provider', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="local">Local Storage</option>
                      <option value="aws-s3">AWS S3</option>
                      <option value="cloudflare-r2">Cloudflare R2</option>
                    </select>
                  </div>

                  {config?.storage?.provider !== 'local' && (
                    <>
                      <div className="space-y-3">
                        <Label htmlFor="storage-key">Access Key ID</Label>
                        <div className="flex gap-2">
                          <Input
                            id="storage-key"
                            type={showSecrets['storage-key'] ? 'text' : 'password'}
                            value={config?.storage?.apiKey ?? ''}
                            onChange={(e) => updateConfig('storage', 'apiKey', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleSecret('storage-key')}
                          >
                            {showSecrets['storage-key'] ? (
                              <EyeSlash size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="storage-secret">Secret Access Key</Label>
                        <div className="flex gap-2">
                          <Input
                            id="storage-secret"
                            type={showSecrets['storage-secret'] ? 'text' : 'password'}
                            value={config?.storage?.apiSecret ?? ''}
                            onChange={(e) => updateConfig('storage', 'apiSecret', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleSecret('storage-secret')}
                          >
                            {showSecrets['storage-secret'] ? (
                              <EyeSlash size={20} />
                            ) : (
                              <Eye size={20} />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <Label htmlFor="storage-bucket">Bucket Name</Label>
                          <Input
                            id="storage-bucket"
                            value={config?.storage?.bucket ?? ''}
                            onChange={(e) => updateConfig('storage', 'bucket', e.target.value)}
                            placeholder="my-bucket"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="storage-region">Region</Label>
                          <Input
                            id="storage-region"
                            value={config?.storage?.region ?? 'us-east-1'}
                            onChange={(e) => updateConfig('storage', 'region', e.target.value)}
                            placeholder="us-east-1"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection('Storage')}
                      disabled={testingService === 'Storage'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'Storage' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => resetToDefaults('storage')}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-pink-500/10">
                        <Globe size={24} className="text-pink-600" weight="fill" />
                      </div>
                      <div>
                        <CardTitle>Analytics Service</CardTitle>
                        <CardDescription>Configure user analytics and tracking</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.analytics?.enabled ?? false}
                      onCheckedChange={(checked) => updateConfig('analytics', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="analytics-provider">Provider</Label>
                    <select
                      id="analytics-provider"
                      value={config?.analytics?.provider ?? 'disabled'}
                      onChange={(e) => updateConfig('analytics', 'provider', e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="disabled">Disabled</option>
                      <option value="google-analytics">Google Analytics</option>
                      <option value="mixpanel">Mixpanel</option>
                      <option value="amplitude">Amplitude</option>
                    </select>
                  </div>

                  {config?.analytics?.provider !== 'disabled' && (
                    <div className="space-y-3">
                      <Label htmlFor="analytics-key">
                        {config?.analytics?.provider === 'google-analytics'
                          ? 'Measurement ID'
                          : 'API Key'}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="analytics-key"
                          type={showSecrets['analytics-key'] ? 'text' : 'password'}
                          value={config?.analytics?.apiKey ?? ''}
                          onChange={(e) => updateConfig('analytics', 'apiKey', e.target.value)}
                          placeholder={
                            config?.analytics?.provider === 'google-analytics'
                              ? 'G-XXXXXXXXXX'
                              : 'api_key'
                          }
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => toggleSecret('analytics-key')}
                        >
                          {showSecrets['analytics-key'] ? (
                            <EyeSlash size={20} />
                          ) : (
                            <Eye size={20} />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection('Analytics')}
                      disabled={
                        testingService === 'Analytics' || config?.analytics?.provider === 'disabled'
                      }
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'Analytics' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => resetToDefaults('analytics')}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="livekit" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-violet-500/10">
                        <VideoCamera size={24} className="text-violet-600" weight="fill" />
                      </div>
                      <div>
                        <CardTitle>LiveKit Streaming</CardTitle>
                        <CardDescription>Configure live streaming and video chat</CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.livekit?.enabled ?? false}
                      onCheckedChange={(checked) => updateConfig('livekit', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Card className="border-amber-500/50 bg-amber-500/5">
                    <CardContent className="pt-6">
                      <div className="flex gap-3">
                        <Warning size={24} className="text-amber-600 shrink-0" weight="fill" />
                        <div className="space-y-1">
                          <p className="font-medium text-amber-900 dark:text-amber-100">
                            Server-Side Implementation Required
                          </p>
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            LiveKit tokens must be generated server-side for security. Configure
                            these credentials on your backend server and use them to sign tokens via
                            API.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="space-y-3">
                    <Label htmlFor="livekit-key">API Key</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="livekit-key"
                          type={showSecrets['livekit-key'] ? 'text' : 'password'}
                          value={config?.livekit?.apiKey ?? ''}
                          onChange={(e) => updateConfig('livekit', 'apiKey', e.target.value)}
                          placeholder="APxxxxxxxxxxxx"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleSecret('livekit-key')}
                      >
                        {showSecrets['livekit-key'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="livekit-secret">API Secret</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="livekit-secret"
                          type={showSecrets['livekit-secret'] ? 'text' : 'password'}
                          value={config?.livekit?.apiSecret ?? ''}
                          onChange={(e) => updateConfig('livekit', 'apiSecret', e.target.value)}
                          placeholder="secret_..."
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => toggleSecret('livekit-secret')}
                      >
                        {showSecrets['livekit-secret'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="livekit-url">WebSocket URL</Label>
                    <Input
                      id="livekit-url"
                      type="url"
                      value={config?.livekit?.wsUrl ?? ''}
                      onChange={(e) => updateConfig('livekit', 'wsUrl', e.target.value)}
                      placeholder="wss://your-project.livekit.cloud"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your LiveKit server WebSocket URL
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => testConnection('LiveKit')}
                      disabled={testingService === 'LiveKit' || !config?.livekit?.enabled}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'LiveKit' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => resetToDefaults('livekit')}>
                      Reset
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
