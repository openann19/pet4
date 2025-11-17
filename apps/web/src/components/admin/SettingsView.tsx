'use client'

import { MotionView } from "@petspark/motion";
import { useCallback, useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useHoverLift } from '@/effects/reanimated/use-hover-lift'
import { triggerHaptic } from '@/lib/haptics'
import { createLogger } from '@/lib/logger'
import { adminApi } from '@/api/admin-api'
import { useCurrentUser } from '@/contexts/AuthContext'
import { configBroadcastService } from '@/core/services/config-broadcast-service'

const logger = createLogger('SettingsView')

interface FeatureFlags {
  enableChat: boolean
  enableVisualAnalysis: boolean
  enableMatching: boolean
  enableReporting: boolean
  enableVerification: boolean
}

interface SystemSettings {
  maxReportsPerUser: number
  autoModeration: boolean
  requireVerification: boolean
  matchDistanceRadius: number
  messagingEnabled: boolean
}

interface SystemConfig {
  featureFlags: FeatureFlags
  systemSettings: SystemSettings
  maintenanceMode?: boolean
  registrationEnabled?: boolean
  moderationEnabled?: boolean
}

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableChat: true,
  enableVisualAnalysis: true,
  enableMatching: true,
  enableReporting: true,
  enableVerification: true
}

const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  maxReportsPerUser: 10,
  autoModeration: false,
  requireVerification: false,
  matchDistanceRadius: 50,
  messagingEnabled: true
}

export default function SettingsView() {
  const currentUser = useCurrentUser()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS)
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS)

  // Load config from backend
  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true)
      try {
        const config = await adminApi.getSystemConfig()
        if (config) {
          const systemConfig = config as unknown as SystemConfig
          if (systemConfig.featureFlags) {
            setFeatureFlags({ ...DEFAULT_FEATURE_FLAGS, ...systemConfig.featureFlags })
          }
          if (systemConfig.systemSettings) {
            setSystemSettings({ ...DEFAULT_SYSTEM_SETTINGS, ...systemConfig.systemSettings })
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error('Failed to load system config', err)
        toast.error('Failed to load system configuration')
      } finally {
        setLoading(false)
      }
    }
    void loadConfig()
  }, [])

  // Save config to backend
  const saveConfig = useCallback(async () => {
    if (!currentUser) {
      toast.error('User not authenticated')
      return
    }

    setSaving(true)
    try {
      const config: SystemConfig = {
        featureFlags,
        systemSettings,
        maintenanceMode: false,
        registrationEnabled: true,
        moderationEnabled: true,
      }
      await adminApi.updateSystemConfig(config as unknown as Record<string, unknown>, currentUser.id || 'admin')
      toast.success('System configuration saved successfully')
      logger.info('System config saved', { featureFlags, systemSettings })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to save system config', err)
      toast.error('Failed to save system configuration')
    } finally {
      setSaving(false)
    }
  }, [featureFlags, systemSettings, currentUser])

  const handleFeatureFlagChange = useCallback((key: keyof FeatureFlags, value: boolean): void => {
    try {
      triggerHaptic('selection')
      setFeatureFlags((current: FeatureFlags) => ({ ...current, [key]: value }))
      // Auto-save to backend
      void saveConfig().catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error('Failed to save after feature flag change', err, { key, value })
      })
      toast.success(`Feature ${value ? 'enabled' : 'disabled'}`)
      logger.info('Feature flag updated', { key, value })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update feature flag', err, { key, value })
      toast.error('Failed to update feature flag')
    }
  }, [saveConfig])

  const handleSystemSettingChange = useCallback((key: keyof SystemSettings, value: number | boolean): void => {
    try {
      triggerHaptic('light')
      setSystemSettings((current: SystemSettings) => ({ ...current, [key]: value }))
      // Auto-save to backend
      void saveConfig().catch((error) => {
        const err = error instanceof Error ? error : new Error(String(error))
        logger.error('Failed to save after system setting change', err, { key, value })
      })
      toast.success('Setting updated')
      logger.info('System setting updated', { key, value })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update system setting', err, { key, value })
      toast.error('Failed to update system setting')
    }
  }, [saveConfig])

  const handleBroadcast = useCallback(async (): Promise<void> => {
    if (!currentUser) {
      toast.error('User not authenticated')
      return
    }

    try {
      setSaving(true)
      // Save config first
      await saveConfig()

      const config: SystemConfig = {
        featureFlags,
        systemSettings,
        maintenanceMode: false,
        registrationEnabled: true,
        moderationEnabled: true,
      }

      await configBroadcastService.broadcastConfig(
        'system',
        config as unknown as Record<string, unknown>,
        currentUser.id || 'admin'
      )

      await adminApi.createAuditLog({
        adminId: currentUser.id || 'admin',
        action: 'config_broadcast',
        targetType: 'system_config',
        targetId: 'system-config',
        details: JSON.stringify({ configType: 'system' }),
      })

      toast.success('System configuration saved and broadcasted successfully')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to broadcast system config', err)
      toast.error('Failed to broadcast system configuration')
    } finally {
      setSaving(false)
    }
  }, [featureFlags, systemSettings, currentUser, saveConfig])

  const featureFlagsCardHover = useHoverLift({ scale: 1.02, translateY: -8 })
  const systemSettingsCardHover = useHoverLift({ scale: 1.02, translateY: -8 })
  const systemInfoCardHover = useHoverLift({ scale: 1.02, translateY: -8 })

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-muted-foreground">Loading system configuration...</div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-border p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure system settings and feature flags
          </p>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6 max-w-4xl">
          <MotionView
            variants={featureFlagsCardHover.variants}
            initial="rest"
            whileHover="hover"
            onMouseEnter={featureFlagsCardHover.handleEnter}
            onMouseLeave={featureFlagsCardHover.handleLeave}
          >
            <Card>
              <CardHeader>
                <CardTitle>Feature Flags</CardTitle>
                <CardDescription>
                  Enable or disable platform features
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-6">
              <div className="mb-6">
                <FeatureFlagItem
                  label="Chat System"
                  description="Allow users to send messages to matched pets"
                  checked={featureFlags.enableChat}
                  onCheckedChange={(checked: boolean) => { handleFeatureFlagChange('enableChat', checked); }}
                />
              </div>

              <Separator />

              <div className="mb-6">
                <FeatureFlagItem
                  label="AI Visual Analysis"
                  description="Enable AI-powered pet photo analysis and attribute extraction"
                  checked={featureFlags.enableVisualAnalysis}
                  onCheckedChange={(checked: boolean) => { handleFeatureFlagChange('enableVisualAnalysis', checked); }}
                />
              </div>

              <Separator />

              <div className="mb-6">
                <FeatureFlagItem
                  label="Matching System"
                  description="Allow users to swipe and match with compatible pets"
                  checked={featureFlags.enableMatching}
                  onCheckedChange={(checked: boolean) => { handleFeatureFlagChange('enableMatching', checked); }}
                />
              </div>

              <Separator />

              <div className="mb-6">
                <FeatureFlagItem
                  label="Reporting System"
                  description="Allow users to report inappropriate content or behavior"
                  checked={featureFlags.enableReporting}
                  onCheckedChange={(checked: boolean) => { handleFeatureFlagChange('enableReporting', checked); }}
                />
              </div>

              <Separator />

              <div className="mb-6">
                <FeatureFlagItem
                  label="Verification System"
                  description="Require users to verify their identity and pet ownership"
                  checked={featureFlags.enableVerification}
                  onCheckedChange={(checked: boolean) => { handleFeatureFlagChange('enableVerification', checked); }}
                />
              </div>
            </CardContent>
          </Card>
          </MotionView>

          <MotionView
            variants={systemSettingsCardHover.variants}
            initial="rest"
            whileHover="hover"
            onMouseEnter={systemSettingsCardHover.handleEnter}
            onMouseLeave={systemSettingsCardHover.handleLeave}
          >
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>
                  Configure platform behavior and limits
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-6">
              <div className="mb-6 space-y-3">
                <Label>Max Reports Per User (Daily)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[systemSettings.maxReportsPerUser]}
                    onValueChange={([value]) => {
                      if (value !== undefined) {
                        handleSystemSettingChange('maxReportsPerUser', value)
                      }
                    }}
                    min={1}
                    max={50}
                    step={1}
                    className="flex-1"
                  />
                  <span className="w-12 text-right font-medium">
                    {systemSettings.maxReportsPerUser}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Maximum number of reports a user can submit per day
                </p>
              </div>

              <Separator />

              <div className="mb-6 space-y-3">
                <Label>Match Distance Radius (km)</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[systemSettings.matchDistanceRadius]}
                    onValueChange={([value]) => {
                      if (value !== undefined) {
                        handleSystemSettingChange('matchDistanceRadius', value)
                      }
                    }}
                    min={1}
                    max={200}
                    step={5}
                    className="flex-1"
                  />
                  <span className="w-12 text-right font-medium">
                    {systemSettings.matchDistanceRadius}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Maximum distance for pet matching suggestions
                </p>
              </div>

              <Separator />

              <div className="mb-6">
                <FeatureFlagItem
                  label="Auto Moderation"
                  description="Automatically flag and hide potentially inappropriate content using AI"
                  checked={systemSettings.autoModeration}
                  onCheckedChange={(checked: boolean) => { handleSystemSettingChange('autoModeration', checked); }}
                />
              </div>

              <Separator />

              <div className="mb-6">
                <FeatureFlagItem
                  label="Require Verification"
                  description="Require all users to verify their identity before accessing features"
                  checked={systemSettings.requireVerification}
                  onCheckedChange={(checked: boolean) => { handleSystemSettingChange('requireVerification', checked); }}
                />
              </div>

              <Separator />

              <div className="mb-6">
                <FeatureFlagItem
                  label="Messaging Enabled"
                  description="Allow users to send and receive messages (global toggle)"
                  checked={systemSettings.messagingEnabled}
                  onCheckedChange={(checked: boolean) => { handleSystemSettingChange('messagingEnabled', checked); }}
                />
              </div>
            </CardContent>
          </Card>
          </MotionView>

          <MotionView transition={{ delay: 0.2 }}>
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
                <CardDescription>
                  Save and broadcast configuration changes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4">
                  <button
                    onClick={() => { void saveConfig(); }}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => { void handleBroadcast(); }}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Broadcasting...' : 'Save & Broadcast'}
                  </button>
                </div>
              </CardContent>
            </Card>
          </MotionView>

          <MotionView
            variants={systemInfoCardHover.variants}
            initial="rest"
            whileHover="hover"
            onMouseEnter={systemInfoCardHover.handleEnter}
            onMouseLeave={systemInfoCardHover.handleLeave}
          >
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
                <CardDescription>
                  Platform version and environment details
                </CardDescription>
              </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="Version" value="1.0.0" />
              <Separator />
              <InfoRow label="Environment" value="Development" />
              <Separator />
              <InfoRow label="API Endpoint" value="/api/v1" />
              <Separator />
              <InfoRow label="Build" value={new Date().toISOString().split('T')[0] ?? new Date().toISOString()} />
            </CardContent>
          </Card>
          </MotionView>
        </div>
      </ScrollArea>
    </div>
  );
}

interface FeatureFlagItemProps {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

function FeatureFlagItem({ label, description, checked, onCheckedChange }: FeatureFlagItemProps): JSX.Element {
  const handleChange = useCallback((newChecked: boolean): void => {
    triggerHaptic('light')
    onCheckedChange(newChecked)
  }, [onCheckedChange])

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-1 flex-1">
        <Label className="text-base">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={handleChange} aria-checked={checked} />
    </div>
  )
}

interface InfoRowProps {
  label: string
  value: string
}

function InfoRow({ label, value }: InfoRowProps): JSX.Element {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm text-muted-foreground">{value}</span>
    </div>
  )
}
