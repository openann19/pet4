'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAPIConfig } from '@/hooks/admin/use-api-config';
import { useStorage as useUserStorage } from '@/hooks/use-storage';
import { triggerHaptic } from '@/lib/haptics';
import type { User } from '@/lib/user-service';
import type { APIConfig } from '@/api/api-config-api';
import {
  Bell,
  ChartBar,
  Database,
  Envelope,
  Key,
  MapPin,
  Radio,
  Robot,
  ShieldCheck,
  Image as ImageIcon,
  VideoCamera,
  Warning,
} from '@phosphor-icons/react';
import { useCallback } from 'react';
import {
  MapsServiceSection,
  AIServiceSection,
  KYCSection,
  ModerationSection,
  SMSSection,
  EmailSection,
  StorageSection,
  AnalyticsSection,
  LiveKitSection,
} from './api-config/service-sections';

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

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
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

  const sectionProps = {
    config,
    showSecrets,
    onToggleSecret: handleToggleSecretWithHaptic,
    onUpdateConfig: handleUpdateConfigWithHaptic,
    onTest: handleTestConnectionWithHaptic,
    onReset: handleResetToDefaultsWithHaptic,
    testingService,
    triggerHaptic,
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
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
                disabled={broadcasting || saving}
                variant="primary"
                size="md"
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
              <MapsServiceSection {...sectionProps} />
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <AIServiceSection {...sectionProps} />
            </TabsContent>

            <TabsContent value="kyc" className="space-y-4">
              <KYCSection {...sectionProps} />
            </TabsContent>

            <TabsContent value="moderation" className="space-y-4">
              <ModerationSection {...sectionProps} />
            </TabsContent>

            <TabsContent value="sms" className="space-y-4">
              <SMSSection {...sectionProps} />
            </TabsContent>

            <TabsContent value="email" className="space-y-4">
              <EmailSection {...sectionProps} />
            </TabsContent>

            <TabsContent value="storage" className="space-y-4">
              <StorageSection {...sectionProps} />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <AnalyticsSection {...sectionProps} />
            </TabsContent>

            <TabsContent value="livekit" className="space-y-4">
              <LiveKitSection {...sectionProps} />
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}
