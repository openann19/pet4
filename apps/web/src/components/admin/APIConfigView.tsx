'use client';

import { useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import {
  Bell,
  ChartBar,
  Cloud,
  Database,
  Envelope,
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
import { triggerHaptic } from '@/lib/haptics';
import { useStorage as useUserStorage } from '@/hooks/use-storage';
import type { User } from '@/lib/user-service';
import { useAPIConfig } from '@/hooks/admin/use-api-config';
import type { APIConfig } from '@/api/api-config-api';

export default function APIConfigView() {
  const [currentUser] = useUserStorage<User | null>('current-user', null);
  const {
    config,
    loading,
    saving,
    showSecrets,
    testingService,
    broadcasting,
    updateConfig,
    toggleSecret,
    testConnection,
    resetToDefaults,
    handleBroadcast,
  } = useAPIConfig(currentUser);

  const handleToggleSecretWithHaptic = useCallback(
    (key: string): void => {
      triggerHaptic('light');
      toggleSecret(key);
    },
    [toggleSecret]
  );

  const handleUpdateConfigWithHaptic = useCallback(
    (section: keyof APIConfig, field: string, value: string | boolean | number): void => {
      triggerHaptic('selection');
      updateConfig(section, field, value);
    },
    [updateConfig]
  );

  const handleTestConnectionWithHaptic = useCallback(
    async (service: string): Promise<void> => {
      triggerHaptic('light');
      await testConnection(service);
      triggerHaptic('success');
    },
    [testConnection]
  );

  const handleResetToDefaultsWithHaptic = useCallback(
    (section: keyof APIConfig): void => {
      triggerHaptic('medium');
      resetToDefaults(section);
    },
    [resetToDefaults]
  );

  const handleBroadcastClick = useCallback(async (): Promise<void> => {
    triggerHaptic('light');
    await handleBroadcast();
  }, [handleBroadcast]);

  if (_loading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-6 py-8">
            <div className="space-y-4">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-6 w-96" />
            </div>
          </div>
        </div>
        <div className="flex-1 container mx-auto px-6 py-8 space-y-6 max-w-6xl">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                API Configuration
              </h1>
              <p className="text-lg text-muted-foreground">
                Configure external service integrations and API keys for your application
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Badge variant="outline" className="w-fit gap-2 px-3 py-1.5 font-medium">
                <Key size={18} weight="duotone" />
                <span>Secure Storage</span>
              </Badge>
              <Button
                onClick={() => {
                  void handleBroadcastClick().catch(() => {
                    // Error already handled in hook
                  });
                }}
                disabled={broadcasting || _saving}
                variant="default"
                size="default"
                className="w-full sm:w-auto gap-2"
              >
                {broadcasting ? (
                  <>
                    <Spinner size="sm" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Radio size={18} weight="duotone" />
                    Broadcast Config
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="container mx-auto px-6 py-8 space-y-8 max-w-6xl">
          <Alert variant="warning" className="border-2 shadow-lg">
            <Warning size={20} weight="fill" />
            <AlertTitle className="font-semibold">Security Notice</AlertTitle>
            <AlertDescription className="text-sm leading-relaxed">
              API keys and secrets are stored securely using Spark's KV storage. Never share these
              credentials or commit them to version control. All keys are encrypted at rest and
              transmitted over secure connections only.
            </AlertDescription>
          </Alert>

          <Tabs defaultValue="maps" className="space-y-6">
            <div className="w-full overflow-x-auto">
              <TabsList className="inline-flex w-fit min-w-full lg:min-w-0">
                <TabsTrigger value="maps" className="gap-2">
                  <MapPin size={16} />
                  <span className="hidden sm:inline">Maps</span>
                </TabsTrigger>
                <TabsTrigger value="ai" className="gap-2">
                  <Robot size={16} />
                  <span className="hidden sm:inline">AI</span>
                </TabsTrigger>
                <TabsTrigger value="kyc" className="gap-2">
                  <ShieldCheck size={16} />
                  <span className="hidden sm:inline">KYC</span>
                </TabsTrigger>
                <TabsTrigger value="moderation" className="gap-2">
                  <ImageIcon size={16} />
                  <span className="hidden sm:inline">Moderation</span>
                </TabsTrigger>
                <TabsTrigger value="sms" className="gap-2">
                  <Bell size={16} />
                  <span className="hidden sm:inline">SMS</span>
                </TabsTrigger>
                <TabsTrigger value="email" className="gap-2">
                  <Envelope size={16} />
                  <span className="hidden sm:inline">Email</span>
                </TabsTrigger>
                <TabsTrigger value="storage" className="gap-2">
                  <Database size={16} />
                  <span className="hidden sm:inline">Storage</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="gap-2">
                  <ChartBar size={16} />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
                <TabsTrigger value="livekit" className="gap-2">
                  <VideoCamera size={16} />
                  <span className="hidden sm:inline">LiveKit</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="maps" className="space-y-4">
              <Card className="shadow-sm border-border/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20">
                        <MapPin size={20} className="text-blue-600 dark:text-blue-400" weight="fill" />
                      </div>
                      <div className="space-y-0.5">
                        <CardTitle className="text-lg">Maps Service</CardTitle>
                        <CardDescription className="text-xs">
                          Configure map provider for location features
                        </CardDescription>
                      </div>
                    </div>
                    <Switch
                      checked={config?.maps?.enabled ?? true}
                      onCheckedChange={(checked) => handleUpdateConfigWithHaptic('maps', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="maps-provider">Provider</Label>
                    <Select
                      value={config?.maps?.provider ?? 'openstreetmap'}
                      onValueChange={(value) => handleUpdateConfigWithHaptic('maps', 'provider', value)}
                    >
                      <SelectTrigger id="maps-provider" className="w-full">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google Maps</SelectItem>
                        <SelectItem value="mapbox">Mapbox</SelectItem>
                        <SelectItem value="openstreetmap">OpenStreetMap (Free)</SelectItem>
                      </SelectContent>
                    </Select>
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
                            onChange={(e) => handleUpdateConfigWithHaptic('maps', 'apiKey', e.target.value)}
                            placeholder="sk_..."
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleSecretWithHaptic('maps-key')}
                          aria-label={showSecrets['maps-key'] ? 'Hide maps API key' : 'Show maps API key'}
                        >
                          {showSecrets['maps-key'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="maps-rate">Rate Limit (requests/min)</Label>
                    <Input
                      id="maps-rate"
                      type="number"
                      value={config?.maps?.rateLimit ?? 100}
                      onChange={(e) => handleUpdateConfigWithHaptic('maps', 'rateLimit', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        void handleTestConnectionWithHaptic('Maps').catch(() => {
                          // Error already handled in hook
                        });
                      }}
                      disabled={testingService === 'Maps'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'Maps' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button
                      onClick={() => handleResetToDefaultsWithHaptic('maps')}
                      variant="outline"
                    >
                      Reset
                    </Button>
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
                      onCheckedChange={(checked) => handleUpdateConfigWithHaptic('ai', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="ai-provider">Provider</Label>
                    <Select
                      value={config?.ai?.provider ?? 'spark'}
                      onValueChange={(value) => handleUpdateConfigWithHaptic('ai', 'provider', value)}
                    >
                      <SelectTrigger id="ai-provider" className="w-full">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spark">Spark AI (Included)</SelectItem>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                      </SelectContent>
                    </Select>
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
                            onChange={(e) => handleUpdateConfigWithHaptic('ai', 'apiKey', e.target.value)}
                            placeholder="sk_..."
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleSecretWithHaptic('ai-key')}
                          aria-label={showSecrets['ai-key'] ? 'Hide AI API key' : 'Show AI API key'}
                        >
                          {showSecrets['ai-key'] ? <EyeSlash size={20} /> : <Eye size={20} />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="ai-model">Model</Label>
                    <Select
                      value={config?.ai?.model ?? 'gpt-4o'}
                      onValueChange={(value) => handleUpdateConfigWithHaptic('ai', 'model', value)}
                    >
                      <SelectTrigger id="ai-model" className="w-full">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini (Faster)</SelectItem>
                        <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label htmlFor="ai-tokens">Max Tokens</Label>
                      <Input
                        id="ai-tokens"
                        type="number"
                        value={config?.ai?.maxTokens ?? 1000}
                        onChange={(e) => handleUpdateConfigWithHaptic('ai', 'maxTokens', parseInt(e.target.value))}
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
                          handleUpdateConfigWithHaptic('ai', 'temperature', parseFloat(e.target.value))
                        }
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        void handleTestConnectionWithHaptic('AI').catch(() => {
                          // Error already handled in hook
                        });
                      }}
                      disabled={testingService === 'AI'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'AI' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => handleResetToDefaultsWithHaptic('ai')}>
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
                      onCheckedChange={(checked) => handleUpdateConfigWithHaptic('kyc', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="kyc-provider">Provider</Label>
                    <Select
                      value={config?.kyc?.provider ?? 'manual'}
                      onValueChange={(value) => handleUpdateConfigWithHaptic('kyc', 'provider', value)}
                    >
                      <SelectTrigger id="kyc-provider" className="w-full">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual Review</SelectItem>
                        <SelectItem value="stripe">Stripe Identity</SelectItem>
                        <SelectItem value="onfido">Onfido</SelectItem>
                        <SelectItem value="jumio">Jumio</SelectItem>
                      </SelectContent>
                    </Select>
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
                            onChange={(e) => handleUpdateConfigWithHaptic('kyc', 'apiKey', e.target.value)}
                            placeholder="sk_..."
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleSecretWithHaptic('kyc-key')}
                          aria-label={showSecrets['kyc-key'] ? 'Hide KYC API key' : 'Show KYC API key'}
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
                        onCheckedChange={(checked) => handleUpdateConfigWithHaptic('kyc', 'autoApprove', checked)}
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
                          handleUpdateConfigWithHaptic('kyc', 'requireDocuments', checked)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        void handleTestConnectionWithHaptic('KYC').catch(() => {
                          // Error already handled in hook
                        });
                      }}
                      disabled={testingService === 'KYC'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'KYC' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => handleResetToDefaultsWithHaptic('kyc')}>
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
                        handleUpdateConfigWithHaptic('photoModeration', 'enabled', checked)
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="mod-provider">Provider</Label>
                    <Select
                      value={config?.photoModeration?.provider ?? 'spark'}
                      onValueChange={(value) => handleUpdateConfigWithHaptic('photoModeration', 'provider', value)}
                    >
                      <SelectTrigger id="mod-provider" className="w-full">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spark">Spark Moderation (Included)</SelectItem>
                        <SelectItem value="openai">OpenAI Vision</SelectItem>
                        <SelectItem value="google-vision">Google Cloud Vision</SelectItem>
                        <SelectItem value="aws-rekognition">AWS Rekognition</SelectItem>
                      </SelectContent>
                    </Select>
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
                              handleUpdateConfigWithHaptic('photoModeration', 'apiKey', e.target.value)
                            }
                            placeholder="sk_..."
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleSecretWithHaptic('mod-key')}
                          aria-label={showSecrets['mod-key'] ? 'Hide moderation API key' : 'Show moderation API key'}
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
                        handleUpdateConfigWithHaptic(
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
                        handleUpdateConfigWithHaptic('photoModeration', 'autoReject', checked)
                      }
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        void handleTestConnectionWithHaptic('Photo Moderation').catch(() => {
                          // Error already handled in hook
                        });
                      }}
                      disabled={testingService === 'Photo Moderation'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'Photo Moderation' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => handleResetToDefaultsWithHaptic('photoModeration')}>
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
                      onCheckedChange={(checked) => handleUpdateConfigWithHaptic('sms', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="sms-provider">Provider</Label>
                    <Select
                      value={config?.sms?.provider ?? 'disabled'}
                      onValueChange={(value) => handleUpdateConfigWithHaptic('sms', 'provider', value)}
                    >
                      <SelectTrigger id="sms-provider" className="w-full">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disabled">Disabled</SelectItem>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="vonage">Vonage (Nexmo)</SelectItem>
                        <SelectItem value="aws-sns">AWS SNS</SelectItem>
                      </SelectContent>
                    </Select>
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
                            onChange={(e) => handleUpdateConfigWithHaptic('sms', 'apiKey', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleSecretWithHaptic('sms-key')}
                            aria-label={showSecrets['sms-key'] ? 'Hide SMS API key' : 'Show SMS API key'}
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
                            onChange={(e) => handleUpdateConfigWithHaptic('sms', 'apiSecret', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleSecretWithHaptic('sms-secret')}
                            aria-label={showSecrets['sms-secret'] ? 'Hide SMS API secret' : 'Show SMS API secret'}
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
                          onChange={(e) => handleUpdateConfigWithHaptic('sms', 'fromNumber', e.target.value)}
                          placeholder="+1234567890"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        void handleTestConnectionWithHaptic('SMS').catch(() => {
                          // Error already handled in hook
                        });
                      }}
                      disabled={testingService === 'SMS' || config?.sms?.provider === 'disabled'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'SMS' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => handleResetToDefaultsWithHaptic('sms')}>
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
                      onCheckedChange={(checked) => handleUpdateConfigWithHaptic('email', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="email-provider">Provider</Label>
                    <Select
                      value={config?.email?.provider ?? 'disabled'}
                      onValueChange={(value) => handleUpdateConfigWithHaptic('email', 'provider', value)}
                    >
                      <SelectTrigger id="email-provider" className="w-full">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disabled">Disabled</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                        <SelectItem value="aws-ses">AWS SES</SelectItem>
                      </SelectContent>
                    </Select>
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
                            onChange={(e) => handleUpdateConfigWithHaptic('email', 'apiKey', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleSecretWithHaptic('email-key')}
                            aria-label={showSecrets['email-key'] ? 'Hide email API key' : 'Show email API key'}
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
                          onChange={(e) => handleUpdateConfigWithHaptic('email', 'fromEmail', e.target.value)}
                          placeholder="noreply@pawfectmatch.com"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="email-name">From Name</Label>
                        <Input
                          id="email-name"
                          value={config?.email?.fromName ?? 'PawfectMatch'}
                          onChange={(e) => handleUpdateConfigWithHaptic('email', 'fromName', e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        void handleTestConnectionWithHaptic('Email').catch(() => {
                          // Error already handled in hook
                        });
                      }}
                      disabled={
                        testingService === 'Email' || config?.email?.provider === 'disabled'
                      }
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'Email' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => handleResetToDefaultsWithHaptic('email')}>
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
                      onCheckedChange={(checked) => handleUpdateConfigWithHaptic('storage', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="storage-provider">Provider</Label>
                    <Select
                      value={config?.storage?.provider ?? 'local'}
                      onValueChange={(value) => handleUpdateConfigWithHaptic('storage', 'provider', value)}
                    >
                      <SelectTrigger id="storage-provider" className="w-full">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">Local Storage</SelectItem>
                        <SelectItem value="aws-s3">AWS S3</SelectItem>
                        <SelectItem value="cloudflare-r2">Cloudflare R2</SelectItem>
                      </SelectContent>
                    </Select>
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
                            onChange={(e) => handleUpdateConfigWithHaptic('storage', 'apiKey', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleSecretWithHaptic('storage-key')}
                            aria-label={showSecrets['storage-key'] ? 'Hide storage API key' : 'Show storage API key'}
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
                            onChange={(e) => handleUpdateConfigWithHaptic('storage', 'apiSecret', e.target.value)}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleToggleSecretWithHaptic('storage-secret')}
                            aria-label={showSecrets['storage-secret'] ? 'Hide storage secret key' : 'Show storage secret key'}
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
                            onChange={(e) => handleUpdateConfigWithHaptic('storage', 'bucket', e.target.value)}
                            placeholder="my-bucket"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label htmlFor="storage-region">Region</Label>
                          <Input
                            id="storage-region"
                            value={config?.storage?.region ?? 'us-east-1'}
                            onChange={(e) => handleUpdateConfigWithHaptic('storage', 'region', e.target.value)}
                            placeholder="us-east-1"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        void handleTestConnectionWithHaptic('Storage').catch(() => {
                          // Error already handled in hook
                        });
                      }}
                      disabled={testingService === 'Storage'}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'Storage' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => handleResetToDefaultsWithHaptic('storage')}>
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
                      onCheckedChange={(checked) => handleUpdateConfigWithHaptic('analytics', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="analytics-provider">Provider</Label>
                    <Select
                      value={config?.analytics?.provider ?? 'disabled'}
                      onValueChange={(value) => handleUpdateConfigWithHaptic('analytics', 'provider', value)}
                    >
                      <SelectTrigger id="analytics-provider" className="w-full">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="disabled">Disabled</SelectItem>
                        <SelectItem value="google-analytics">Google Analytics</SelectItem>
                        <SelectItem value="mixpanel">Mixpanel</SelectItem>
                        <SelectItem value="amplitude">Amplitude</SelectItem>
                      </SelectContent>
                    </Select>
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
                          onChange={(e) => handleUpdateConfigWithHaptic('analytics', 'apiKey', e.target.value)}
                          placeholder={
                            config?.analytics?.provider === 'google-analytics'
                              ? 'G-XXXXXXXXXX'
                              : 'api_key'
                          }
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleSecretWithHaptic('analytics-key')}
                          aria-label={showSecrets['analytics-key'] ? 'Hide analytics API key' : 'Show analytics API key'}
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
                      onClick={() => {
                        void handleTestConnectionWithHaptic('Analytics').catch(() => {
                          // Error already handled in hook
                        });
                      }}
                      disabled={
                        testingService === 'Analytics' || config?.analytics?.provider === 'disabled'
                      }
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'Analytics' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => handleResetToDefaultsWithHaptic('analytics')}>
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
                      onCheckedChange={(checked) => handleUpdateConfigWithHaptic('livekit', 'enabled', checked)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert variant="warning" className="shadow-sm">
                    <Warning size={20} weight="fill" />
                    <AlertTitle>Server-Side Implementation Required</AlertTitle>
                    <AlertDescription>
                      LiveKit tokens must be generated server-side for security. Configure these
                      credentials on your backend server and use them to sign tokens via API.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <Label htmlFor="livekit-key">API Key</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          id="livekit-key"
                          type={showSecrets['livekit-key'] ? 'text' : 'password'}
                          value={config?.livekit?.apiKey ?? ''}
                          onChange={(e) => handleUpdateConfigWithHaptic('livekit', 'apiKey', e.target.value)}
                          placeholder="APxxxxxxxxxxxx"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleToggleSecretWithHaptic('livekit-key')}
                        aria-label={showSecrets['livekit-key'] ? 'Hide LiveKit API key' : 'Show LiveKit API key'}
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
                          onChange={(e) => handleUpdateConfigWithHaptic('livekit', 'apiSecret', e.target.value)}
                          placeholder="secret_..."
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleToggleSecretWithHaptic('livekit-secret')}
                        aria-label={showSecrets['livekit-secret'] ? 'Hide LiveKit API secret' : 'Show LiveKit API secret'}
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
                      onChange={(e) => handleUpdateConfigWithHaptic('livekit', 'wsUrl', e.target.value)}
                      placeholder="wss://your-project.livekit.cloud"
                    />
                    <p className="text-xs text-muted-foreground">
                      Your LiveKit server WebSocket URL
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        void handleTestConnectionWithHaptic('LiveKit').catch(() => {
                          // Error already handled in hook
                        });
                      }}
                      disabled={testingService === 'LiveKit' || !config?.livekit?.enabled}
                      className="flex-1"
                    >
                      <TestTube size={20} className="mr-2" />
                      {testingService === 'LiveKit' ? 'Testing...' : 'Test Connection'}
                    </Button>
                    <Button variant="outline" onClick={() => handleResetToDefaultsWithHaptic('livekit')}>
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
