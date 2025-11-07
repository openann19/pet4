import React, { useMemo } from 'react'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing
} from 'react-native-reanimated'
import { useReducedMotionSV } from '../../effects/chat/core/reduced-motion'
import { isTruthy, isDefined } from '@/core/guards';

export interface SmartSkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'avatar' | 'post'
  width?: number | string
  height?: number | string
  style?: StyleProp<ViewStyle>
  animate?: boolean
  count?: number
  testID?: string
}

const AnimatedShimmer = Animated.createAnimatedComponent(View)

export function SmartSkeleton({
  variant = 'text',
  width,
  height,
  style,
  animate = true,
  count = 1,
  testID = 'skeleton'
}: SmartSkeletonProps): React.JSX.Element {
  const reducedMotion = useReducedMotionSV()
  const shimmerTranslateX = useSharedValue(-200)
  const shimmerOpacity = useSharedValue(0.3)

  React.useEffect(() => {
    if (animate && !reducedMotion.value) {
      shimmerTranslateX.value = withRepeat(
        withTiming(200, {
          duration: 2000,
          easing: Easing.linear
        }),
        -1,
        false
      )
      shimmerOpacity.value = withRepeat(
        withTiming(0.3, {
          duration: 1000,
          easing: Easing.inOut(Easing.ease)
        }),
        -1,
        true
      )
    } else {
      shimmerTranslateX.value = -200
      shimmerOpacity.value = 0.3
    }
  }, [animate, reducedMotion, shimmerTranslateX, shimmerOpacity])

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerTranslateX.value }],
      opacity: shimmerOpacity.value
    }
  })

  const baseStyle = useMemo(() => {
    const base: ViewStyle = {
      backgroundColor: 'rgba(128, 128, 128, 0.2)',
      overflow: 'hidden'
    }

    if (isTruthy(width)) {
      base.width = typeof width === 'number' ? width : undefined
    }
    if (isTruthy(height)) {
      base.height = typeof height === 'number' ? height : undefined
    }

    return [base, style]
  }, [width, height, style])

  const skeletonElement = () => {
    switch (variant) {
      case 'circular': {
        const size = typeof width === 'number' ? width : typeof height === 'number' ? height : 40
        return (
          <View
            style={[
              baseStyle,
              {
                width: size,
                height: size,
                borderRadius: size / 2
              }
            ]}
            testID={`${String(testID ?? '')}-circular`}
          >
            {animate && (
              <AnimatedShimmer
                style={[
                  StyleSheet.absoluteFill,
                  shimmerStyle,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: size / 2
                  }
                ]}
              />
            )}
          </View>
        )
      }

      case 'rectangular': {
        return (
          <View
            style={[
              baseStyle,
              {
                width: (width || '100%') as any,
                height: (height || 200) as any,
                borderRadius: 8
              }
            ]}
            testID={`${String(testID ?? '')}-rectangular`}
          >
            {animate && (
              <AnimatedShimmer
                style={[
                  StyleSheet.absoluteFill,
                  shimmerStyle,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 8
                  }
                ]}
              />
            )}
          </View>
        )
      }

      case 'card': {
        return (
          <View style={[baseStyle, styles.card]} testID={`${String(testID ?? '')}-card`}>
            {animate && (
              <AnimatedShimmer
                style={[
                  StyleSheet.absoluteFill,
                  shimmerStyle,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 8
                  }
                ]}
              />
            )}
            <View style={styles.cardContent}>
              <View style={[styles.cardLine, { width: '75%' }]} />
              <View style={[styles.cardLine, { width: '100%' }]} />
              <View style={[styles.cardLine, { width: '83%' }]} />
              <View style={styles.cardActions}>
                <View style={styles.cardButton} />
                <View style={styles.cardButton} />
              </View>
            </View>
          </View>
        )
      }

      case 'avatar': {
        return (
          <View style={styles.avatarContainer} testID={`${String(testID ?? '')}-avatar`}>
            <View style={[baseStyle, styles.avatarCircle]}>
              {animate && (
                <AnimatedShimmer
                  style={[
                    StyleSheet.absoluteFill,
                    shimmerStyle,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: 20
                    }
                  ]}
                />
              )}
            </View>
            <View style={styles.avatarText}>
              <View style={[baseStyle, styles.avatarLine, { width: 96 }]}>
                {animate && (
                  <AnimatedShimmer
                    style={[
                      StyleSheet.absoluteFill,
                      shimmerStyle,
                      {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: 4
                      }
                    ]}
                  />
                )}
              </View>
              <View style={[baseStyle, styles.avatarLine, { width: 128 }]}>
                {animate && (
                  <AnimatedShimmer
                    style={[
                      StyleSheet.absoluteFill,
                      shimmerStyle,
                      {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: 4
                      }
                    ]}
                  />
                )}
              </View>
            </View>
          </View>
        )
      }

      case 'post': {
        return (
          <View style={[baseStyle, styles.post]} testID={`${String(testID ?? '')}-post`}>
            {animate && (
              <AnimatedShimmer
                style={[
                  StyleSheet.absoluteFill,
                  shimmerStyle,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 8
                  }
                ]}
              />
            )}
            <View style={styles.postHeader}>
              <View style={styles.postAvatar} />
              <View style={styles.postHeaderText}>
                <View style={styles.postTitle} />
                <View style={styles.postSubtitle} />
              </View>
            </View>
            <View style={styles.postContent}>
              <View style={styles.postLine} />
              <View style={[styles.postLine, { width: '80%' }]} />
            </View>
            <View style={styles.postImage} />
            <View style={styles.postActions}>
              <View style={styles.postAction} />
              <View style={styles.postAction} />
              <View style={styles.postAction} />
            </View>
          </View>
        )
      }

      default: {
        return (
          <View
            style={[
              baseStyle,
              {
                width: (width || '100%') as any,
                height: (height || 16) as any,
                borderRadius: 4
              }
            ]}
            testID={`${String(testID ?? '')}-text`}
          >
            {animate && (
              <AnimatedShimmer
                style={[
                  StyleSheet.absoluteFill,
                  shimmerStyle,
                  {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderRadius: 4
                  }
                ]}
              />
            )}
          </View>
        )
      }
    }
  }

  if (count > 1) {
    return (
      <View style={styles.container} testID={testID}>
        {Array.from({ length: count }).map((_, i) => (
          <View key={i} style={styles.item}>
            {skeletonElement()}
          </View>
        ))}
      </View>
    )
  }

  return <>{skeletonElement()}</>
}

export interface PostSkeletonProps {
  count?: number
  testID?: string
}

export function PostSkeleton({ count = 3, testID = 'post-skeleton' }: PostSkeletonProps): React.JSX.Element {
  return (
    <View style={styles.postContainer} testID={testID}>
      {Array.from({ length: count }).map((_, i) => (
        <SmartSkeleton key={i} variant="post" testID={`${String(testID ?? '')}-${String(i ?? '')}`} />
      ))}
    </View>
  )
}

export interface CardGridSkeletonProps {
  count?: number
  testID?: string
}

export function CardGridSkeleton({ count = 6, testID = 'card-grid-skeleton' }: CardGridSkeletonProps): React.JSX.Element {
  return (
    <View style={styles.gridContainer} testID={testID}>
      {Array.from({ length: count }).map((_, i) => (
        <SmartSkeleton key={i} variant="card" testID={`${String(testID ?? '')}-${String(i ?? '')}`} />
      ))}
    </View>
  )
}

export interface ListSkeletonProps {
  count?: number
  testID?: string
}

export function ListSkeleton({ count = 5, testID = 'list-skeleton' }: ListSkeletonProps): React.JSX.Element {
  return (
    <View style={styles.listContainer} testID={testID}>
      {Array.from({ length: count }).map((_, i) => (
        <SmartSkeleton key={i} variant="avatar" testID={`${String(testID ?? '')}-${String(i ?? '')}`} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 12
  },
  item: {
    marginBottom: 12
  },
  card: {
    borderRadius: 8,
    padding: 16,
    gap: 12
  },
  cardContent: {
    gap: 8
  },
  cardLine: {
    height: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 4
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16
  },
  cardButton: {
    width: 80,
    height: 32,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 4
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20
  },
  avatarText: {
    flex: 1,
    gap: 8
  },
  avatarLine: {
    height: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 4
  },
  post: {
    borderRadius: 8,
    padding: 16,
    gap: 16
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(128, 128, 128, 0.1)'
  },
  postHeaderText: {
    flex: 1,
    gap: 8
  },
  postTitle: {
    width: 128,
    height: 16,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 4
  },
  postSubtitle: {
    width: 96,
    height: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 4
  },
  postContent: {
    gap: 8
  },
  postLine: {
    height: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 4,
    width: '100%'
  },
  postImage: {
    height: 192,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 8
  },
  postActions: {
    flexDirection: 'row',
    gap: 16
  },
  postAction: {
    width: 64,
    height: 32,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    borderRadius: 4
  },
  postContainer: {
    gap: 16
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  listContainer: {
    gap: 12
  }
})

