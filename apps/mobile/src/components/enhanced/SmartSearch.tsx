/**
 * SmartSearch - Mobile Native Implementation
 * Location: apps/mobile/src/components/enhanced/SmartSearch.tsx
 */

import React, { useState, useMemo } from 'react'
import {
  View,
  TextInput,
  FlatList,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native'
import { Animated, useSharedValue, useAnimatedStyle, withTiming } from '@petspark/motion'
import * as Haptics from 'expo-haptics'
import { useStorage } from '@/hooks/use-storage'
import { timingConfigs } from '@/effects/reanimated/transitions'
import { isTruthy } from '@petspark/shared';

const AnimatedView = Animated.createAnimatedComponent(View)

export interface SmartSearchProps<T> {
  placeholder?: string
  data: T[]
  searchKeys: (keyof T)[]
  onSelect?: (item: T) => void
  renderResult?: (item: T, highlight: string) => React.ReactNode
  style?: ViewStyle
  showTrending?: boolean
  showHistory?: boolean
  maxResults?: number
}

export function SmartSearch<T extends Record<string, unknown>>({
  placeholder = 'Search...',
  data,
  searchKeys,
  onSelect,
  renderResult,
  style,
  showTrending = true,
  showHistory = true,
  maxResults = 10,
}: SmartSearchProps<T>): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [searchHistory, setSearchHistory] = useStorage<string[]>('search-history', [])
  const [trendingSearches] = useStorage<string[]>('trending-searches', [
    'Golden Retriever',
    'Playful',
    'Small dogs',
    'Near me',
  ])

  const dropdownOpacity = useSharedValue(0)
  const dropdownTranslateY = useSharedValue(-10)

  const results = useMemo(() => {
    if (!query.trim()) return []

    const lowerQuery = query.toLowerCase()

    return data
      .map(item => {
        let score = 0
        let matchedKey = ''

        for (const key of searchKeys) {
          const value = String(item[key]).toLowerCase()

          if (value === lowerQuery) {
            score = 100
            matchedKey = key as string
            break
          } else if (value.startsWith(lowerQuery)) {
            score = Math.max(score, 80)
            matchedKey = key as string
          } else if (value.includes(lowerQuery)) {
            score = Math.max(score, 60)
            matchedKey = key as string
          }
        }

        return score > 0 ? { item, score, matchedKey } : null
      })
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
  }, [query, data, searchKeys, maxResults])

  const showDropdown = isFocused && (query.trim() || showHistory || showTrending)

  React.useEffect(() => {
    if (isTruthy(showDropdown)) {
      dropdownOpacity.value = withTiming(1, timingConfigs.smooth)
      dropdownTranslateY.value = withTiming(0, timingConfigs.smooth)
    } else {
      dropdownOpacity.value = withTiming(0, timingConfigs.smooth)
      dropdownTranslateY.value = withTiming(-10, timingConfigs.smooth)
    }
  }, [showDropdown, dropdownOpacity, dropdownTranslateY])

  const dropdownStyle = useAnimatedStyle(() => ({
    opacity: dropdownOpacity.value,
    transform: [{ translateY: dropdownTranslateY.value }],
  }))

  const handleSelect = (item: T, queryText: string): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)

    if (showHistory) {
      setSearchHistory(prev => {
        const updated = [queryText, ...(prev || []).filter(q => q !== queryText)].slice(0, 10)
        return updated
      })
    }

    onSelect?.(item)
    setQuery('')
    setIsFocused(false)
  }

  const handleHistoryClick = (historyQuery: string): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setQuery(historyQuery)
  }

  const renderItem = ({
    item: result,
  }: {
    item: { item: T; score: number; matchedKey: string }
  }): React.JSX.Element => {
    if (renderResult) {
      return (
        <Pressable onPress={() => handleSelect(result.item, query)} style={styles.resultItem}>
          {renderResult(result.item, query)}
        </Pressable>
      )
    }

    const displayValue = String(result.item[result.matchedKey] || '')
    return (
      <Pressable onPress={() => handleSelect(result.item, query)} style={styles.resultItem}>
        <Text style={styles.resultText}>{displayValue}</Text>
      </Pressable>
    )
  }

  const renderHistoryItem = ({ item: historyQuery }: { item: string }): React.JSX.Element => (
    <Pressable onPress={() => handleHistoryClick(historyQuery)} style={styles.historyItem}>
      <Text style={styles.historyText}>{historyQuery}</Text>
    </Pressable>
  )

  const renderTrendingItem = ({ item: trending }: { item: string }): React.JSX.Element => (
    <Pressable onPress={() => handleHistoryClick(trending)} style={styles.trendingItem}>
      <Text style={styles.trendingText}>{trending}</Text>
    </Pressable>
  )

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputContainer}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => { setIsFocused(true); }}
          onBlur={() => setTimeout(() => { setIsFocused(false); }, 200)}
          placeholder={placeholder}
          style={styles.input}
          placeholderTextColor="#94a3b8"
        />
      </View>

      {showDropdown && (
        <AnimatedView style={[styles.dropdown, dropdownStyle]}>
          {query.trim() && results.length > 0 && (
            <FlatList
              data={results}
              renderItem={renderItem}
              keyExtractor={(_, index) => `result-${String(index ?? '')}`}
              style={styles.resultsList}
            />
          )}

          {showHistory && searchHistory.length > 0 && !query.trim() && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Searches</Text>
              <FlatList
                data={searchHistory}
                renderItem={renderHistoryItem}
                keyExtractor={(_item, index) => `history-${String(index ?? '')}`}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          {showTrending && trendingSearches.length > 0 && !query.trim() && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Trending</Text>
              <FlatList
                data={trendingSearches}
                renderItem={renderTrendingItem}
                keyExtractor={(_item, index) => `trending-${String(index ?? '')}`}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}
        </AnimatedView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  inputContainer: {
    position: 'relative',
  },
  input: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'var(--color-bg-overlay)',
    borderRadius: 12,
    marginTop: 8,
    maxHeight: 400,
    shadowColor: 'var(--color-fg)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1001,
  },
  resultsList: {
    maxHeight: 300,
  },
  resultItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  resultText: {
    fontSize: 16,
    color: '#1e293b',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  historyItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    marginRight: 8,
  },
  historyText: {
    fontSize: 14,
    color: '#475569',
  },
  trendingItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 16,
    marginRight: 8,
  },
  trendingText: {
    fontSize: 14,
    color: '#92400e',
    fontWeight: '500',
  },
})
