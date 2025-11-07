import { useEffect, useMemo, useCallback } from 'react'
import { View, Text, Image, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  FadeIn,
  FadeOut
} from 'react-native-reanimated'
// TypingUser type definition for mobile
interface TypingUser {
  userId: string
  userName: string
  startedAt: string
  userAvatar?: string
}
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import { isTruthy, isDefined } from '@/core/guards';

const AnimatedView = Animated.createAnimatedComponent(View)

export interface TypingIndicatorProps {
  readonly users: readonly TypingUser[]
}

interface TypingDotProps {
  readonly index: number
  readonly reducedMotion: Animated.SharedValue<boolean>
}

function TypingDot({ index, reducedMotion }: TypingDotProps): JSX.Element {
  const opacity = useSharedValue(0.3)
  const translateY = useSharedValue(0)

  useEffect(() => {
    if (isTruthy(reducedMotion.value)) {
      opacity.value = 0.6
      translateY.value = 0
      return
    }

    const delay = index * 200

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 300 }),
          withTiming(0.3, { duration: 300 })
        ),
        -1,
        false
      )
    )

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-3, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        false
      )
    )
  }, [index, opacity, translateY, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }]
    }
  }, [opacity, translateY])

  return (
    <AnimatedView style={[styles.dot, animatedStyle]} />
  )
}

export default function TypingIndicator({ users }: TypingIndicatorProps): JSX.Element | null {
  const reducedMotion = useReducedMotionSV()
  const displayUsers = useMemo(() => users.slice(0, 3), [users])
  const containerOpacity = useSharedValue(0)
  const containerTranslateY = useSharedValue(-5)

  useEffect(() => {
    if (isTruthy(reducedMotion.value)) {
      containerOpacity.value = 1
      containerTranslateY.value = 0
      return
    }

    containerOpacity.value = withTiming(1, { duration: 300 })
    containerTranslateY.value = withTiming(0, { duration: 300 })
  }, [containerOpacity, containerTranslateY, reducedMotion])

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
      transform: [{ translateY: containerTranslateY.value }]
    }
  }, [containerOpacity, containerTranslateY])

  const typingText = useMemo(() => {
    if (users.length === 1) {
      const userName = users[0]?.userName?.trim()
      return `${String(userName || 'Someone' ?? '')} is typing`
    }
    if (users.length === 2) {
      const userName1 = users[0]?.userName?.trim()
      const userName2 = users[1]?.userName?.trim()
      return `${String(userName1 || 'Someone' ?? '')} and ${String(userName2 || 'Someone' ?? '')} are typing`
    }
    const firstName = users[0]?.userName?.trim()
    return `${String(firstName || 'Someone' ?? '')} and ${String(users.length - 1 ?? '')} others are typing`
  }, [users])

  const renderAvatar = useCallback((user: TypingUser, index: number) => {
    const userWithAvatar = user as TypingUser & { userAvatar?: string }
    return (
      <View key={user.userId} style={[styles.avatar, index > 0 && styles.avatarOverlap]}>
        {userWithAvatar.userAvatar ? (
          <Image
            source={{ uri: userWithAvatar.userAvatar }}
            style={styles.avatarImage}
            accessibilityLabel={user.userName}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarFallbackText}>
              {user.userName?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}
      </View>
    )
  }, [])

  if (users.length === 0) return null

  return (
    <AnimatedView
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={[styles.container, containerStyle]}
      accessibilityRole="text"
      accessibilityLabel={typingText}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.avatarsContainer}>
        {displayUsers.map((user, index) => renderAvatar(user, index))}
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.text}>{typingText}</Text>
        <View style={styles.dotsContainer} accessibilityElementsHidden>
          {[0, 1, 2].map((i) => (
            <TypingDot key={i} index={i} reducedMotion={reducedMotion} />
          ))}
        </View>
      </View>
    </AnimatedView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  avatarsContainer: {
    flexDirection: 'row',
    marginLeft: -8
  },
  avatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    backgroundColor: '#E5E7EB'
  },
  avatarOverlap: {
    marginLeft: -8
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover'
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3B82F6'
  },
  avatarFallbackText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  text: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500'
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 2,
    alignItems: 'center'
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3B82F6'
  }
})

