'use client'

import { useCallback, useMemo, useEffect } from 'react'
import { MonitorPlay, Check } from '@phosphor-icons/react'
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { VideoQuality } from '@/lib/call-types'
import { haptics } from '@/lib/haptics'
import { AnimatedView } from '@/effects/reanimated/animated-view'
import { useHoverTap } from '@/effects/reanimated'
import { springConfigs } from '@/effects/reanimated/transitions'
import type { AnimatedStyle } from '@/effects/reanimated/animated-view'

interface VideoQualitySettingsProps {
  currentQuality: VideoQuality
  onQualityChange: (quality: VideoQuality) => void
}

interface QualityOption {
  value: VideoQuality
  label: string
  resolution: string
  description: string
  badge?: string
}

const qualityOptions: QualityOption[] = [
  {
    value: '4k',
    label: '4K Ultra HD',
    resolution: '3840 × 2160',
    description: 'Highest quality, requires high-speed connection',
    badge: 'Premium'
  },
  {
    value: '1080p',
    label: 'Full HD',
    resolution: '1920 × 1080',
    description: 'Excellent quality, recommended for most users',
    badge: 'Recommended'
  },
  {
    value: '720p',
    label: 'HD',
    resolution: '1280 × 720',
    description: 'Good quality, suitable for moderate connections'
  },
  {
    value: '480p',
    label: 'SD',
    resolution: '854 × 480',
    description: 'Basic quality, best for slow connections'
  }
]

interface QualityButtonProps {
  option: QualityOption
  isSelected: boolean
  onSelect: (quality: VideoQuality) => void
}

function QualityButton({ option, isSelected, onSelect }: QualityButtonProps): JSX.Element {
  const hoverTap = useHoverTap({
    hoverScale: 1.02,
    tapScale: 0.98,
    damping: 15,
    stiffness: 400
  })

  const checkProgress = useSharedValue(isSelected ? 1 : 0)

  const checkAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: checkProgress.value }],
      opacity: checkProgress.value
    }
  }) as AnimatedStyle

  useEffect(() => {
    if (isSelected) {
      checkProgress.value = withSpring(1, springConfigs.bouncy)
    } else {
      checkProgress.value = withSpring(0, springConfigs.smooth)
    }
  }, [isSelected, checkProgress])

  const handleClick = useCallback(() => {
    hoverTap.handlePress()
    onSelect(option.value)
  }, [hoverTap, onSelect, option.value])

  return (
    <AnimatedView
      style={hoverTap.animatedStyle}
      onMouseEnter={hoverTap.handleMouseEnter}
      onMouseLeave={hoverTap.handleMouseLeave}
    >
      <Button
        variant={isSelected ? 'default' : 'outline'}
        className={`w-full h-auto py-4 px-4 justify-between ${
          isSelected
            ? 'bg-gradient-to-r from-primary to-accent border-primary/50'
            : 'hover:bg-muted/50'
        }`}
        onClick={handleClick}
      >
        <div className="flex flex-col items-start gap-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-base">{option.label}</span>
            {option.badge && (
              <Badge
                variant={isSelected ? 'secondary' : 'outline'}
                className="text-xs"
              >
                {option.badge}
              </Badge>
            )}
          </div>
          <span className="text-sm font-mono opacity-80">{option.resolution}</span>
          <span className="text-xs opacity-70 text-left">{option.description}</span>
        </div>
        <AnimatedView style={checkAnimatedStyle}>
          <Check size={24} weight="bold" />
        </AnimatedView>
      </Button>
    </AnimatedView>
  )
}

export default function VideoQualitySettings({
  currentQuality,
  onQualityChange
}: VideoQualitySettingsProps): JSX.Element {
  const handleQualitySelect = useCallback(
    (quality: VideoQuality) => {
      haptics.trigger('selection')
      onQualityChange(quality)
    },
    [onQualityChange]
  )

  const qualityButtons = useMemo(
    () =>
      qualityOptions.map((option) => (
        <QualityButton
          key={option.value}
          option={option}
          isSelected={currentQuality === option.value}
          onSelect={handleQualitySelect}
        />
      )),
    [currentQuality, handleQualitySelect]
  )

  return (
    <Card className="glass-effect border-border/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MonitorPlay size={24} weight="fill" className="text-primary" />
          <CardTitle>Video Quality</CardTitle>
        </div>
        <CardDescription>
          Choose your preferred video call quality. Higher quality requires more bandwidth.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {qualityButtons}

        <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> The actual quality may vary based on your device capabilities and network conditions.
            The system will automatically adjust to the best available quality.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
