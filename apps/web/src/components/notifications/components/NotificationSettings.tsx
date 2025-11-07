/**
 * Notification Settings Component
 * 
 * Settings panel for notification preferences
 */

import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { MoonStars, Sparkle, Bell, BellRinging } from '@phosphor-icons/react'
import type { NotificationPreferences } from '../types'

export interface NotificationSettingsProps {
  preferences: NotificationPreferences | null
  onPreferencesChange: (preferences: NotificationPreferences) => void
}

export function NotificationSettings({
  preferences,
  onPreferencesChange
}: NotificationSettingsProps): JSX.Element {
  const updatePreferences = (updates: Partial<NotificationPreferences>) => {
    if (!preferences) return
    
    onPreferencesChange({
      ...preferences,
      ...updates
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="quiet-hours" className="text-sm font-medium">
          <MoonStars size={16} className="inline mr-2" />
          Quiet hours
        </Label>
        <Switch
          id="quiet-hours"
          checked={preferences?.quietHours.enabled ?? false}
          onCheckedChange={(enabled) => {
            updatePreferences({
              quietHours: {
                ...preferences!.quietHours,
                enabled
              }
            })
          }}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="group-similar" className="text-sm font-medium">
          <Sparkle size={16} className="inline mr-2" />
          Group similar
        </Label>
        <Switch
          id="group-similar"
          checked={preferences?.groupSimilar ?? false}
          onCheckedChange={(groupSimilar) => {
            updatePreferences({ groupSimilar })
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="show-previews" className="text-sm font-medium">
          <Bell size={16} className="inline mr-2" />
          Show previews
        </Label>
        <Switch
          id="show-previews"
          checked={preferences?.showPreviews ?? false}
          onCheckedChange={(showPreviews) => {
            updatePreferences({ showPreviews })
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="sound-enabled" className="text-sm font-medium">
          <BellRinging size={16} className="inline mr-2" />
          Sound enabled
        </Label>
        <Switch
          id="sound-enabled"
          checked={preferences?.soundEnabled ?? false}
          onCheckedChange={(soundEnabled) => {
            updatePreferences({ soundEnabled })
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="push-enabled" className="text-sm font-medium">
          <BellRinging size={16} className="inline mr-2" />
          Push notifications
        </Label>
        <Switch
          id="push-enabled"
          checked={preferences?.pushEnabled ?? false}
          onCheckedChange={(pushEnabled) => {
            updatePreferences({ pushEnabled })
          }}
        />
      </div>
    </div>
  )
}
