import React, { useState, useMemo, useCallback, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TextInput,
  ScrollView,
  Dimensions,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated'
import { useStorage } from '../hooks/use-storage'
import {
  STICKER_CATEGORIES,
  STICKER_LIBRARY,
  getStickersByCategory,
  searchStickers,
  getPremiumStickers,
  getRecentStickers,
  type Sticker,
  type StickerCategory,
} from '../lib/sticker-library'
import { haptics } from '../lib/haptics'
import { isTruthy, isDefined } from '@/core/guards';

const { width } = Dimensions.get('window')
const STICKER_SIZE = (width - 60) / 4
const SPRING_CONFIG = { damping: 15, stiffness: 400 }

interface StickerPickerProps {
  visible: boolean
  onClose: () => void
  onSelectSticker: (sticker: Sticker) => void
}

export const StickerPicker: React.FC<StickerPickerProps> = ({
  visible,
  onClose,
  onSelectSticker,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [recentStickerIds, setRecentStickerIds] = useStorage<string[]>('recent-stickers', [])
  const [pressedSticker, setPressedSticker] = useState<string | null>(null)

  const containerOpacity = useSharedValue(0)
  const containerY = useSharedValue(100)

  const displayedStickers = useMemo(() => {
    if (searchQuery.trim()) {
      return searchStickers(searchQuery)
    }

    if (selectedCategory === 'all') {
      return STICKER_LIBRARY
    }

    if (selectedCategory === 'recent') {
      return getRecentStickers(recentStickerIds || [])
    }

    if (selectedCategory === 'premium') {
      return getPremiumStickers()
    }

    return getStickersByCategory(selectedCategory)
  }, [searchQuery, selectedCategory, recentStickerIds])

  const handleStickerClick = useCallback((sticker: Sticker) => {
    haptics.impact('medium')

    const updatedRecent = [
      sticker.id,
      ...(recentStickerIds || []).filter((id: string) => id !== sticker.id),
    ].slice(0, 24)
    setRecentStickerIds(updatedRecent)

    onSelectSticker(sticker)
    onClose()
  }, [recentStickerIds, setRecentStickerIds, onSelectSticker, onClose])

  const handleCategoryChange = useCallback((categoryId: string) => {
    haptics.impact('light')
    setSelectedCategory(categoryId)
    setSearchQuery('')
  }, [])

  const recentCount = recentStickerIds?.length || 0

  useEffect(() => {
    if (isTruthy(visible)) {
      containerOpacity.value = withTiming(1, { duration: 300 })
      containerY.value = withSpring(0, SPRING_CONFIG)
    } else {
      containerOpacity.value = withTiming(0, { duration: 200 })
      containerY.value = withTiming(100, { duration: 200 })
    }
  }, [visible, containerOpacity, containerY])

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: containerOpacity.value,
      transform: [{ translateY: containerY.value }],
    }
  })

  const handleClose = useCallback(() => {
    haptics.impact('light')
    containerOpacity.value = withTiming(0, { duration: 200 })
    containerY.value = withTiming(100, { duration: 200 })
    setTimeout(() => {
      onClose()
    }, 200)
  }, [containerOpacity, containerY, onClose])

  const renderSticker = useCallback(({ item, index }: { item: Sticker; index: number }) => {
    return (
      <StickerButton
        sticker={item}
        index={index}
        isPressed={pressedSticker === item.id}
        onPress={() => { handleStickerClick(item); }}
        onPressIn={() => { setPressedSticker(item.id); }}
        onPressOut={() => { setPressedSticker(null); }}
      />
    )
  }, [pressedSticker, handleStickerClick])

  return (
    <Modal
      visible={visible}
      animationType="none"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <Animated.View style={[styles.container, containerStyle]}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Stickers</Text>
            {displayedStickers.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{displayedStickers.length}</Text>
              </View>
            )}
          </View>
          <Pressable onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
        </View>

        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search stickers..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => { setSearchQuery(''); }}>
              <Text style={styles.clearButton}>✕</Text>
            </Pressable>
          )}
        </View>

        {!searchQuery && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            <Pressable
              style={[
                styles.categoryButton,
                selectedCategory === 'all' && styles.categoryButtonActive,
              ]}
              onPress={() => { handleCategoryChange('all'); }}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === 'all' && styles.categoryButtonTextActive,
                ]}
              >
                All
              </Text>
            </Pressable>

            {recentCount > 0 && (
              <Pressable
                style={[
                  styles.categoryButton,
                  selectedCategory === 'recent' && styles.categoryButtonActive,
                ]}
                onPress={() => { handleCategoryChange('recent'); }}
              >
                <Text style={styles.categoryEmoji}>🕐</Text>
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === 'recent' && styles.categoryButtonTextActive,
                  ]}
                >
                  Recent
                </Text>
              </Pressable>
            )}

            <Pressable
              style={[
                styles.categoryButton,
                selectedCategory === 'premium' && styles.categoryButtonActive,
              ]}
              onPress={() => { handleCategoryChange('premium'); }}
            >
              <Text style={styles.categoryEmoji}>👑</Text>
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === 'premium' && styles.categoryButtonTextActive,
                ]}
              >
                Premium
              </Text>
            </Pressable>

            {STICKER_CATEGORIES.map((category: StickerCategory) => (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.id && styles.categoryButtonActive,
                ]}
                onPress={() => { handleCategoryChange(category.id); }}
              >
                <Text style={styles.categoryEmoji}>{category.emoji}</Text>
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category.id && styles.categoryButtonTextActive,
                  ]}
                >
                  {category.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {displayedStickers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>🔍</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery ? 'No stickers found' : 'No stickers in this category'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayedStickers}
            renderItem={renderSticker}
            keyExtractor={item => item.id}
            numColumns={4}
            contentContainerStyle={styles.stickerGrid}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews
            maxToRenderPerBatch={20}
            windowSize={10}
          />
        )}
      </Animated.View>
    </Modal>
  )
}

interface StickerButtonProps {
  sticker: Sticker
  index: number
  isPressed: boolean
  onPress: () => void
  onPressIn: () => void
  onPressOut: () => void
}

function StickerButton({
  sticker,
  index,
  isPressed,
  onPress,
  onPressIn,
  onPressOut,
}: StickerButtonProps) {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.8)
  const pressScale = useSharedValue(1)

  useEffect(() => {
    const delay = index * 10
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }))
    scale.value = withDelay(delay, withSpring(1, SPRING_CONFIG))
  }, [index, opacity, scale])

  useEffect(() => {
    if (isTruthy(isPressed)) {
      pressScale.value = withSpring(0.9, SPRING_CONFIG)
    } else {
      pressScale.value = withSpring(1, SPRING_CONFIG)
    }
  }, [isPressed, pressScale])

  const animatedStyle = useAnimatedStyle(() => {
    const combinedScale = scale.value * pressScale.value
    return {
      opacity: opacity.value,
      transform: [{ scale: combinedScale }],
    }
  })

  return (
    <Animated.View style={[styles.stickerItem, animatedStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.stickerPressable}
      >
        <Text style={styles.stickerEmoji}>{sticker.emoji}</Text>
        {sticker.premium && (
          <View style={styles.premiumBadge}>
            <Text style={styles.premiumBadgeText}>👑</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  badge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6b7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    fontSize: 16,
    color: '#9ca3af',
    padding: 4,
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  categoriesContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  categoryButtonActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },
  stickerGrid: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stickerItem: {
    width: STICKER_SIZE,
    aspectRatio: 1,
    marginRight: 12,
    marginBottom: 12,
  },
  stickerPressable: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  stickerEmoji: {
    fontSize: 32,
  },
  premiumBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#fbbf24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadgeText: {
    fontSize: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
})
