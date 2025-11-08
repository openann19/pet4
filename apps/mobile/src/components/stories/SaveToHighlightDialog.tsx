import React, { useState, useCallback } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Alert,
  AccessibilityInfo,
} from 'react-native'
import type { Story, StoryHighlight } from '@shared/types'
import { useUserStore } from '@/store/user-store'
import { useTheme } from '@/hooks/use-theme'
import {
  useStoryHighlights,
  useAddStoryToHighlight,
  useCreateHighlight,
} from '@/hooks/api/use-stories'
import { createLogger } from '@/utils/logger'

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

  const userPets = user?.pets ?? []

  const userHighlights = (highlights || []).filter((h: StoryHighlight) => h.userId === story.userId)
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
        Alert.alert('Story already in this highlight')
        return
      }
      setSelectedHighlightId(highlightId)
    },
    [storyAlreadyInHighlight]
  )

  const handleSaveToExisting = useCallback(async () => {
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
  }, [selectedHighlightId, story.id, addStoryMutation, onSaved, onClose])

  const handleCreateNew = useCallback(async () => {
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
  }, [newHighlightTitle, userPets, story, user, createHighlightMutation, onSaved, onClose])

  const resetState = useCallback(() => {
    setShowNewHighlight(false)
    setNewHighlightTitle('')
    setSelectedHighlightId(null)
  }, [])

  // Accessibility: focus management
  React.useEffect(() => {
    if (visible) {
      AccessibilityInfo.announceForAccessibility('Save to Highlight dialog opened')
    }
  }, [visible])

  const styles = getStyles(theme)

  if (highlightsLoading) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={onClose}
        accessible
        accessibilityLabel={'Save to Highlight Dialog'}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Loading highlights...</Text>
        </View>
      </Modal>
    )
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      accessible
      accessibilityLabel={'Save to Highlight Dialog'}
    >
      <View style={styles.container}>
        <Text style={styles.title} accessibilityRole="header">
          {'Save to Highlight'}
        </Text>
        {showNewHighlight ? (
          <View style={styles.newHighlightContainer}>
            <TextInput
              style={styles.input}
              value={newHighlightTitle}
              onChangeText={setNewHighlightTitle}
              placeholder={'Highlight Name'}
              maxLength={30}
              autoFocus
              accessibilityLabel={'Highlight Name'}
            />
            <Image
              source={{ uri: story.thumbnailUrl || story.mediaUrl }}
              style={styles.preview}
              accessibilityLabel={'Story preview'}
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setShowNewHighlight(false)}
                accessibilityRole="button"
              >
                <Text>{'Back'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, !newHighlightTitle.trim() && styles.buttonDisabled]}
                onPress={handleCreateNew}
                disabled={!newHighlightTitle.trim()}
                accessibilityRole="button"
              >
                <Text>{'Create Highlight'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <FlatList
            data={userHighlights}
            keyExtractor={(item: StoryHighlight) => item.id}
            style={styles.list}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text>{'No highlights yet. Create your first highlight to save this story.'}</Text>
              </View>
            }
            renderItem={({ item }: { item: StoryHighlight }) => {
              const alreadyInHighlight = storyAlreadyInHighlight(item.id)
              const isSelected = selectedHighlightId === item.id
              return (
                <TouchableOpacity
                  style={[
                    styles.highlightItem,
                    alreadyInHighlight && styles.disabledHighlight,
                    isSelected && styles.selectedHighlight,
                  ]}
                  onPress={() => !alreadyInHighlight && handleSelectHighlight(item.id)}
                  disabled={alreadyInHighlight}
                  accessibilityRole="button"
                  accessibilityLabel={'Highlight ' + item.title}
                >
                  <Image
                    source={{ uri: item.coverImage }}
                    style={styles.avatar}
                    accessibilityLabel={'Highlight cover image'}
                  />
                  <View style={styles.highlightInfo}>
                    <Text style={styles.highlightTitle}>{item.title}</Text>
                    <Text style={styles.highlightCount}>
                      {item.stories.length} {item.stories.length === 1 ? 'story' : 'stories'}
                    </Text>
                    {alreadyInHighlight && (
                      <Text style={styles.alreadyAdded}>{'Already added'}</Text>
                    )}
                  </View>
                  {isSelected && !alreadyInHighlight && <Text style={styles.check}>✔️</Text>}
                  {item.isPinned && <Text style={styles.pin}>📌</Text>}
                </TouchableOpacity>
              )
            }}
          />
        )}
        <View style={styles.footer}>
          {showNewHighlight ? null : (
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => setShowNewHighlight(true)}
                accessibilityRole="button"
              >
                <Text>{'New Highlight'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, !selectedHighlightId && styles.buttonDisabled]}
                onPress={handleSaveToExisting}
                disabled={!selectedHighlightId}
                accessibilityRole="button"
              >
                <Text>{'Save Story'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  )
}

// Styles will be created dynamically based on theme
const getStyles = (theme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: theme.colors.background,
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 16,
      color: theme.colors.textPrimary,
    },
    newHighlightContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    input: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 10,
      width: '80%',
      marginBottom: 16,
      borderColor: theme.colors.border,
      color: theme.colors.textPrimary,
      backgroundColor: theme.colors.card,
    },
    preview: {
      width: 120,
      height: 180,
      borderRadius: 12,
      marginBottom: 16,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '80%',
      marginTop: 16,
    },
    button: {
      padding: 12,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      marginHorizontal: 8,
    },
    buttonDisabled: {
      backgroundColor: theme.colors.foreground,
      opacity: 0.5,
    },
    list: {
      flex: 1,
    },
    emptyContainer: {
      alignItems: 'center',
      marginTop: 40,
    },
    highlightItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 10,
      marginBottom: 8,
      backgroundColor: theme.colors.card,
    },
    disabledHighlight: {
      opacity: 0.5,
    },
    selectedHighlight: {
      backgroundColor: theme.colors.foreground,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      marginRight: 12,
    },
    highlightInfo: {
      flex: 1,
    },
    highlightTitle: {
      fontWeight: 'bold',
      color: theme.colors.textPrimary,
    },
    highlightCount: {
      color: theme.colors.textSecondary,
    },
    alreadyAdded: {
      color: theme.colors.danger,
      fontSize: 12,
    },
    check: {
      fontSize: 20,
      color: theme.colors.primary,
      marginLeft: 8,
    },
    pin: {
      fontSize: 18,
      marginLeft: 8,
    },
    footer: {
      paddingVertical: 12,
    },
  })

export default React.memo(SaveToHighlightDialog)
