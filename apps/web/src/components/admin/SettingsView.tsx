'use client'

import { useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { useStorage } from '@/hooks/useStorage'
import { toast } from 'sonner'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useHoverLift } from '@/effects/reanimated/use-hover-lift'
import { triggerHaptic } from '@/lib/haptics'
import { createLogger } from '@/lib/logger'

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

export default function SettingsView() {
  const [featureFlags, setFeatureFlags] = useStorage<FeatureFlags>('admin-feature-flags', {
    enableChat: true,
    enableVisualAnalysis: true,
    enableMatching: true,
    enableReporting: true,
    enableVerification: true
  })

  const [systemSettings, setSystemSettings] = useStorage<SystemSettings>('admin-system-settings', {
    maxReportsPerUser: 10,
    autoModeration: false,
    requireVerification: false,
    matchDistanceRadius: 50,
    messagingEnabled: true
  })

  const handleFeatureFlagChange = useCallback((key: keyof FeatureFlags, value: boolean): void => {
    try {
      triggerHaptic('selection')
      setFeatureFlags((current: FeatureFlags) => {
        if (!current) {
          logger.warn('Feature flags is null, using defaults')
          return {
            enableChat: true,
            enableVisualAnalysis: true,
            enableMatching: true,
            enableReporting: true,
            enableVerification: true
          }
        }
        return { ...current, [key]: value }
      })
      toast.success(`Feature ${String(value ? 'enabled' : 'disabled' ?? '')}`)
      logger.info('Feature flag updated', { key, value })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update feature flag', err, { key, value })
      toast.error('Failed to update feature flag')
    }
  }, [setFeatureFlags])

  const handleSystemSettingChange = useCallback((key: keyof SystemSettings, value: number | boolean): void => {
    try {
      triggerHaptic('light')
      setSystemSettings((current: SystemSettings) => {
        if (!current) {
          logger.warn('System settings is null, using defaults')
          return {
            maxReportsPerUser: 10,
            autoModeration: false,
            requireVerification: false,
            matchDistanceRadius: 50,
            messagingEnabled: true
          }
        }
        return { ...current, [key]: value }
      })
      toast.success('Setting updated')
      logger.info('System setting updated', { key, value })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to update system setting', err, { key, value })
      toast.error('Failed to update system setting')
    }
  }, [setSystemSettings])

  const featureFlagsCardHover = useHoverLift({ intensity: 1.02 })
  const systemSettingsCardHover = useHoverLift({ intensity: 1.02 })
  const systemInfoCardHover = useHoverLift({ intensity: 1.02 })

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
          <AnimatedView
            style={featureFlagsCardHover.animatedStyle}
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
                  checked={featureFlags?.enableChat ?? true}
                  onCheckedChange={(checked: boolean) => { handleFeatureFlagChange('enableChat', checked); }}
                />
              </div>

              <Separator />

              <div className="mb-6">
                <FeatureFlagItem
                  label="AI Visual Analysis"
                  description="Enable AI-powered pet photo analysis and attribute extraction"
                  checked={featureFlags?.enableVisualAnalysis ?? true}
                  onCheckedChange={(checked: boolean) => { handleFeatureFlagChange('enableVisualAnalysis', checked); }}
                />
              </div>

              <Separator />

              <div className="mb-6">
                <FeatureFlagItem
                  label="Matching System"
                  description="Allow users to swipe and match with compatible pets"
                  checked={featureFlags?.enableMatching ?? true}
                  onCheckedChange={(checked: boolean) => { handleFeatureFlagChange('enableMatching', checked); }}
                />
              </div>

              <Separator />

              <div className="mb-6">
                <FeatureFlagItem
                  label="Reporting System"
                  description="Allow users to report inappropriate content or behavior"
                  checked={featureFlags?.enableReporting ?? true}
                  onCheckedChange={(checked: boolean) => { handleFeatureFlagChange('enableReporting', checked); }}
                />
              </div>

              <Separator />

              <div className="mb-6">
                <FeatureFlagItem
                  label="Verification System"
                  description="Require users to verify their identity and pet ownership"
                  checked={featureFlags?.enableVerification ?? true}
                  onCheckedChange={(checked: boolean) => { handleFeatureFlagChange('enableVerification', checked); }}
                />
              </div>
            </CardContent>
          </Card>
          </AnimatedView>

          <AnimatedView
            style={systemSettingsCardHover.animatedStyle}
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
                    value={[systemSettings?.maxReportsPerUser ?? 10]}
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
                    {systemSettings?.maxReportsPerUser ?? 10}
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
                    value={[systemSettings?.matchDistanceRadius ?? 50]}
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
                    {systemSettings?.matchDistanceRadius ?? 50}
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
                  checked={systemSettings?.autoModeration ?? false}
                  onCheckedChange={(checked: boolean) => { handleSystemSettingChange('autoModeration', checked); }}
                />
              </div>

              <Separator />

              <div className="mb-6">
                <FeatureFlagItem
                  label="Require Verification"
                  description="Require all users to verify their identity before accessing features"
                  checked={systemSettings?.requireVerification ?? false}
                  onCheckedChange={(checked: boolean) => { handleSystemSettingChange('requireVerification', checked); }}
                />
              </div>

              <Separator />

              <div className="mb-6">
                <FeatureFlagItem
                  label="Messaging Enabled"
                  description="Allow users to send and receive messages (global toggle)"
                  checked={systemSettings?.messagingEnabled ?? true}
                  onCheckedChange={(checked: boolean) => { handleSystemSettingChange('messagingEnabled', checked); }}
                />
              </div>
            </CardContent>
          </Card>
          </AnimatedView>

          <AnimatedView
            style={systemInfoCardHover.animatedStyle}
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
          </AnimatedView>
        </div>
      </ScrollArea>
    </div>
  )
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
