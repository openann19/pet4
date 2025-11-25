import { Image, Pressable, Text, View } from 'react-native'
import type { ReactNode } from 'react'
import { Animated } from '@petspark/motion'
import { useHeaderAnimation, useHeaderButtonAnimation } from '@mobile/effects/reanimated'

const AnimatedView = Animated.createAnimatedComponent(View)

type MinimalChatRoom = { matchedPetName?: string; matchedPetPhoto?: string }

export interface ChatHeaderProps {
  room: MinimalChatRoom
  typingIndicator: ReactNode
  onBack?: () => void
  awayMode: boolean
  setAwayMode: (next: boolean | ((p: boolean) => boolean)) => void
}

export function ChatHeader({
  room,
  typingIndicator,
  onBack,
  awayMode,
  setAwayMode,
}: ChatHeaderProps): JSX.Element {
  const headerAnimation = useHeaderAnimation({ delay: 0 })
  const backButtonAnimation = useHeaderButtonAnimation({
    hapticFeedback: true,
    scale: 1.1,
    translateY: -2,
  })
  const awayButtonAnimation = useHeaderButtonAnimation({
    hapticFeedback: true,
    scale: 1.05,
  })

  return (
    <AnimatedView
      style={[
        {
          padding: 12,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.2)',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
        headerAnimation.headerStyle,
      ]}
    >
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          onPress={onBack}
          onPressIn={backButtonAnimation.handlePressIn}
          onPressOut={backButtonAnimation.handlePressOut}
          style={{ padding: 4 }}
        >
          <Animated.View style={backButtonAnimation.buttonStyle}>
            <Text accessibilityLabel="Back">←</Text>
          </Animated.View>
        </Pressable>
      ) : null}

      {room.matchedPetPhoto ? (
        <Image
          source={{ uri: room.matchedPetPhoto }}
          style={{ width: 40, height: 40, borderRadius: 20 }}
        />
      ) : (
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#999',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: 'white' }}>{room.matchedPetName?.[0] || '?'}</Text>
        </View>
      )}

      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: 'bold' }}>{room.matchedPetName}</Text>
        {typingIndicator}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => setAwayMode(p => !p)}
        onPressIn={awayButtonAnimation.handlePressIn}
        onPressOut={awayButtonAnimation.handlePressOut}
        style={{
          paddingVertical: 6,
          paddingHorizontal: 10,
          borderRadius: 12,
          backgroundColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <Animated.View style={awayButtonAnimation.buttonStyle}>
          <Text>{awayMode ? '🟢 Available' : '🌙 Away'}</Text>
        </Animated.View>
      </Pressable>
    </AnimatedView>
  )
}
