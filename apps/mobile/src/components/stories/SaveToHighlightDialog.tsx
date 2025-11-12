import React, { useState, useCallback, useMemo } from 'react'
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  Alert,
  AccessibilityInfo,
  TouchableOpacity,
  type ImageStyle,
} from 'react-native'
import { FlashList } from '@shopify/flash-list'
import Animated from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import type { Story, StoryHighlight } from '@shared/types'
import { useUserStore } from '@/store/user-store'
import { useTheme } from '@/hooks/use-theme'
import {
  useStoryHighlights,
  useAddStoryToHighlight,
  useCreateHighlight,
} from '@/hooks/api/use-stories'
import { createLogger } from '@/utils/logger'
import { PremiumModal } from '@/components/enhanced/overlays/PremiumModal'
import { PremiumCard } from '@/components/enhanced/PremiumCard'
import { PremiumButton } from '@/components/enhanced/PremiumButton'
import { useStaggeredItem } from '@/effects/reanimated/use-staggered-item'
import { useShimmer } from '@/effects/reanimated/use-shimmer'
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import { springConfigs } from '@/effects/reanimated/transitions'

const AnimatedView = Animated.View

const logger = createLogger('SaveToHighlightDialog')

interface SaveToHighlightDialogProps {
  visible: boolean
  onClose: () => void
  story: Story
  onSaved?: () => void
}

const SaveToHighlightDialog: React.FC<SaveToHighlightDialogProps> = ({
  visible,
  onClose,
  story,
  onSaved,
}) => {
  const user = useUserStore(state => state.user)
  const { theme } = useTheme()
  const { data: highlights = [], isLoading: highlightsLoading } = useStoryHighlights(story.userId)
  const addStoryMutation = useAddStoryToHighlight()
  const createHighlightMutation = useCreateHighlight()

  const [showNewHighlight, setShowNewHighlight] = useState<boolean>(false)
  const [newHighlightTitle, setNewHighlightTitle] = useState<string>('')
  const [selectedHighlightId, setSelectedHighlightId] = useState<string | null>(null)

  const userPets = React.useMemo(() => user?.pets ?? [], [user?.pets])

  const userHighlights = React.useMemo(
    () => (highlights || []).filter((h: StoryHighlight) => h.userId === story.userId),
    [highlights, story.userId]
  )

  const resetState = useCallback((): void => {
    setShowNewHighlight(false)
    setNewHighlightTitle('')
    setSelectedHighlightId(null)
  }, [])

  const storyAlreadyInHighlight = useCallback(
    (highlightId: string): boolean => {
      const highlight = userHighlights.find((h: StoryHighlight) => h.id === highlightId)
      return highlight?.stories.some((s: Story) => s.id === story.id) || false
    },
    [userHighlights, story.id]
  )

  const handleSelectHighlight = useCallback(
    (highlightId: string) => {
      if (storyAlreadyInHighlight(highlightId)) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
        Alert.alert('Story already in this highlight')
        return
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setSelectedHighlightId(highlightId)
    },
    [storyAlreadyInHighlight]
  )

  const handleSaveToExisting = useCallback(async (): Promise<void> => {
    if (!selectedHighlightId) return

    try {
      await addStoryMutation.mutateAsync({
        highlightId: selectedHighlightId,
        storyId: story.id,
      })
      onSaved?.()
      onClose()
      resetState()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to save story to highlight', err)
      Alert.alert('Error', 'Failed to save story to highlight. Please try again.')
    }
  }, [addStoryMutation, onClose, onSaved, resetState, selectedHighlightId, story.id])

  const handleSaveToExistingWrapper = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    void handleSaveToExisting().catch((error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Unhandled error in handleSaveToExisting', err)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    })
  }, [handleSaveToExisting])

  const handleCreateNew = useCallback(async (): Promise<void> => {
    if (!newHighlightTitle.trim()) {
      Alert.alert('Please enter a highlight title')
      return
    }

    if (!user) {
      Alert.alert('Error', 'User not found')
      return
    }

    const firstPet = userPets[0]
    const petId = firstPet?.id || story.petId
    const coverImage = story.thumbnailUrl || story.mediaUrl

    try {
      await createHighlightMutation.mutateAsync({
        userId: story.userId,
        petId,
        title: newHighlightTitle.trim(),
        coverImage,
        storyIds: [story.id],
      })
      onSaved?.()
      onClose()
      resetState()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Failed to create highlight', err)
      Alert.alert('Error', 'Failed to create highlight. Please try again.')
    }
  }, [
    createHighlightMutation,
    newHighlightTitle,
    onClose,
    onSaved,
    resetState,
    story,
    user,
    userPets,
  ])

  const handleCreateNewWrapper = useCallback((): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    void handleCreateNew().catch((error: unknown) => {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.error('Unhandled error in handleCreateNew', err)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    })
  }, [handleCreateNew])

  // Accessibility: focus management
  React.useEffect(() => {
    if (visible) {
      AccessibilityInfo.announceForAccessibility('Save to Highlight dialog opened')
    }
  }, [visible])

  const shimmer = useShimmer({ enabled: highlightsLoading })

  const styles = getStyles(theme)

  const highlightItemStyles = useMemo(() => getHighlightItemStyles(theme), [theme])

  const newHighlightFormStyles = useMemo((): NewHighlightFormStyles => {
    if (!styles.newHighlightContainer || !styles.input || !styles.preview || !styles.buttonRow) {
      throw new Error('Required styles missing')
    }
    return {
      newHighlightContainer: styles.newHighlightContainer,
      input: styles.input,
      preview: styles.preview as ImageStyle,
      buttonRow: styles.buttonRow,
    }
  }, [styles])

  const renderHighlightItem = useCallback(
    ({ item, index }: { item: StoryHighlight; index: number }) => {
      return (
        <HighlightItem
          item={item}
          index={index}
          isSelected={selectedHighlightId === item.id}
          alreadyInHighlight={storyAlreadyInHighlight(item.id)}
          onSelect={handleSelectHighlight}
          styles={highlightItemStyles}
        />
      )
    },
    [selectedHighlightId, storyAlreadyInHighlight, handleSelectHighlight, highlightItemStyles]
  )

  const renderLoadingState = useCallback((): React.JSX.Element => {
    return (
      <View style={styles.loadingContainer}>
        <AnimatedView style={[styles.shimmerContainer, shimmer.animatedStyle]}>
          <View style={styles.shimmerBar} />
        </AnimatedView>
        <Text style={styles.loadingText}>Loading highlights...</Text>
      </View>
    )
  }, [shimmer, styles])

  const renderEmptyState = useCallback((): React.JSX.Element => {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          {'No highlights yet. Create your first highlight to save this story.'}
        </Text>
      </View>
    )
  }, [styles])

  const footerContent = useMemo((): React.JSX.Element | null => {
    if (showNewHighlight) {
      return null
    }

    return (
      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          <PremiumButton
            variant="secondary"
            size="md"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setShowNewHighlight(true)
            }}
          >
            {'New Highlight'}
          </PremiumButton>
          <PremiumButton
            variant="primary"
            size="md"
            onPress={handleSaveToExistingWrapper}
            disabled={!selectedHighlightId}
          >
            {'Save Story'}
          </PremiumButton>
        </View>
      </View>
    )
  }, [showNewHighlight, selectedHighlightId, handleSaveToExistingWrapper, styles])

  return (
    <PremiumModal
      visible={visible}
      onClose={onClose}
      title="Save to Highlight"
      variant="glass"
      size="full"
      footer={footerContent}
    >
      {highlightsLoading ? (
        renderLoadingState()
      ) : showNewHighlight ? (
        <NewHighlightForm
          story={story}
          newHighlightTitle={newHighlightTitle}
          setNewHighlightTitle={setNewHighlightTitle}
          onBack={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            setShowNewHighlight(false)
          }}
          onCreate={handleCreateNewWrapper}
          styles={newHighlightFormStyles}
          theme={theme}
        />
      ) : (
        <FlashList
          data={userHighlights}
          keyExtractor={(item: StoryHighlight) => item.id}
          renderItem={renderHighlightItem}
          estimatedItemSize={80}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContent as never}
        />
      )}
    </PremiumModal>
  )
}

interface HighlightItemStyles {
  highlightItem: ReturnType<typeof StyleSheet.create>['highlightItem']
  highlightItemContent: ReturnType<typeof StyleSheet.create>['highlightItemContent']
  disabledHighlight: ReturnType<typeof StyleSheet.create>['disabledHighlight']
  avatar: ImageStyle
  highlightInfo: ReturnType<typeof StyleSheet.create>['highlightInfo']
  highlightTitle: ReturnType<typeof StyleSheet.create>['highlightTitle']
  highlightCount: ReturnType<typeof StyleSheet.create>['highlightCount']
  alreadyAdded: ReturnType<typeof StyleSheet.create>['alreadyAdded']
  checkContainer: ReturnType<typeof StyleSheet.create>['checkContainer']
  check: ReturnType<typeof StyleSheet.create>['check']
  pinContainer: ReturnType<typeof StyleSheet.create>['pinContainer']
  pin: ReturnType<typeof StyleSheet.create>['pin']
}

interface HighlightItemProps {
  item: StoryHighlight
  index: number
  isSelected: boolean
  alreadyInHighlight: boolean
  onSelect: (highlightId: string) => void
  styles: HighlightItemStyles
}

const HighlightItem: React.FC<HighlightItemProps> = React.memo(
  ({ item, index, isSelected, alreadyInHighlight, onSelect, styles: itemStyles }) => {
    const staggeredAnimation = useStaggeredItem({ index, staggerDelay: 50 })
    const selectionScale = useSharedValue(isSelected ? 1.02 : 1)
    const borderOpacity = useSharedValue(isSelected ? 1 : 0)

    React.useEffect(() => {
      selectionScale.value = withSpring(isSelected ? 1.02 : 1, springConfigs.smooth)
      borderOpacity.value = withSpring(isSelected ? 1 : 0, springConfigs.smooth)
    }, [isSelected, selectionScale, borderOpacity])

    const selectionStyle = useAnimatedStyle(() => {
      const opacity = interpolate(borderOpacity.value, [0, 1], [0, 1], Extrapolation.CLAMP)
      return {
        transform: [{ scale: selectionScale.value }],
        borderWidth: isSelected ? 2 : 0,
        borderColor: `rgba(59, 130, 246, ${opacity})`,
      }
    }, [isSelected, borderOpacity, selectionScale])

    const handlePress = useCallback((): void => {
      if (!alreadyInHighlight) {
        onSelect(item.id)
      }
    }, [alreadyInHighlight, onSelect, item.id])

    return (
      <AnimatedView style={[staggeredAnimation.itemStyle]}>
        <PremiumCard
          variant={isSelected ? 'elevated' : 'default'}
          hover={!alreadyInHighlight}
          glow={isSelected}
          style={
            [itemStyles.highlightItem, alreadyInHighlight && itemStyles.disabledHighlight] as never
          }
        >
          <AnimatedView style={selectionStyle}>
            <View style={itemStyles.highlightItemContent}>
              <Image
                source={{ uri: item.coverImage }}
                style={itemStyles.avatar}
                accessibilityLabel={'Highlight cover image'}
              />
              <View style={itemStyles.highlightInfo}>
                <Text style={itemStyles.highlightTitle}>{item.title}</Text>
                <Text style={itemStyles.highlightCount}>
                  {item.stories.length} {item.stories.length === 1 ? 'story' : 'stories'}
                </Text>
                {alreadyInHighlight && (
                  <Text style={itemStyles.alreadyAdded}>{'Already added'}</Text>
                )}
              </View>
              {isSelected && !alreadyInHighlight && (
                <View style={itemStyles.checkContainer}>
                  <Text style={itemStyles.check}>✓</Text>
                </View>
              )}
              {item.isPinned && (
                <View style={itemStyles.pinContainer}>
                  <Text style={itemStyles.pin}>📌</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={StyleSheet.absoluteFill}
              onPress={handlePress}
              activeOpacity={0.9}
              disabled={alreadyInHighlight}
            />
          </AnimatedView>
        </PremiumCard>
      </AnimatedView>
    )
  }
)

HighlightItem.displayName = 'HighlightItem'

interface NewHighlightFormStyles {
  newHighlightContainer: ReturnType<typeof StyleSheet.create>['newHighlightContainer']
  input: ReturnType<typeof StyleSheet.create>['input']
  preview: ImageStyle
  buttonRow: ReturnType<typeof StyleSheet.create>['buttonRow']
}

interface NewHighlightFormProps {
  story: Story
  newHighlightTitle: string
  setNewHighlightTitle: (title: string) => void
  onBack: () => void
  onCreate: () => void
  styles: NewHighlightFormStyles
  theme: ReturnType<typeof useTheme>['theme']
}

const NewHighlightForm: React.FC<NewHighlightFormProps> = React.memo(
  ({
    story,
    newHighlightTitle,
    setNewHighlightTitle,
    onBack,
    onCreate,
    styles: formStyles,
    theme,
  }) => {
    const entryAnimation = useStaggeredItem({ index: 0, staggerDelay: 0 })

    return (
      <AnimatedView style={[formStyles.newHighlightContainer, entryAnimation.itemStyle]}>
        <TextInput
          style={[
            formStyles.input,
            {
              borderColor: theme.colors.border,
              color: theme.colors.textPrimary,
              backgroundColor: theme.colors.card,
            },
          ]}
          value={newHighlightTitle}
          onChangeText={setNewHighlightTitle}
          placeholder={'Highlight Name'}
          placeholderTextColor={theme.colors.textSecondary}
          maxLength={30}
          autoFocus
          accessibilityLabel={'Highlight Name'}
        />
        <Image
          source={{ uri: story.thumbnailUrl || story.mediaUrl }}
          style={formStyles.preview}
          accessibilityLabel={'Story preview'}
        />
        <View style={formStyles.buttonRow}>
          <PremiumButton variant="secondary" size="md" onPress={onBack}>
            {'Back'}
          </PremiumButton>
          <PremiumButton
            variant="primary"
            size="md"
            onPress={onCreate}
            disabled={!newHighlightTitle.trim()}
          >
            {'Create Highlight'}
          </PremiumButton>
        </View>
      </AnimatedView>
    )
  }
)

NewHighlightForm.displayName = 'NewHighlightForm'

// Styles for highlight items
const getHighlightItemStyles = (theme: ReturnType<typeof useTheme>['theme']): HighlightItemStyles =>
  StyleSheet.create({
    highlightItem: {
      marginBottom: 12,
      overflow: 'hidden',
    },
    highlightItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 4,
    },
    disabledHighlight: {
      opacity: 0.5,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      marginRight: 16,
    } as ImageStyle,
    highlightInfo: {
      flex: 1,
    },
    highlightTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.textPrimary,
      marginBottom: 4,
    },
    highlightCount: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    alreadyAdded: {
      fontSize: 12,
      color: theme.colors.danger,
      marginTop: 4,
    },
    checkContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    check: {
      fontSize: 16,
      color: 'var(--color-bg-overlay)',
      fontWeight: 'bold',
    },
    pinContainer: {
      marginLeft: 8,
    },
    pin: {
      fontSize: 18,
    },
  })

// Styles will be created dynamically based on theme
const getStyles = (
  theme: ReturnType<typeof useTheme>['theme']
): ReturnType<typeof StyleSheet.create> =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    shimmerContainer: {
      width: '100%',
      height: 60,
      backgroundColor: theme.colors.card,
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
    },
    shimmerBar: {
      width: '60%',
      height: '100%',
      backgroundColor: theme.colors.foreground,
      opacity: 0.3,
    },
    loadingText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 16,
    },
    listContent: {
      padding: 16,
    },
    newHighlightContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    input: {
      borderWidth: 2,
      borderRadius: 12,
      padding: 16,
      width: '100%',
      marginBottom: 24,
      fontSize: 16,
    },
    preview: {
      width: 140,
      height: 200,
      borderRadius: 16,
      marginBottom: 24,
    } as ImageStyle,
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      gap: 12,
    },
    emptyContainer: {
      alignItems: 'center',
      marginTop: 60,
      padding: 20,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    footer: {
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
  })

export default React.memo(SaveToHighlightDialog)
