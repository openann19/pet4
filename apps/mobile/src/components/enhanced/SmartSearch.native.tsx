import React, { useState, useRef, useMemo, useCallback } from 'react'
import { View, TextInput, Text, StyleSheet, FlatList, Pressable, type ViewStyle, type TextStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'
import { useReducedMotionSV } from '@/effects/core/use-reduced-motion-sv'
import { useStorage } from '@/hooks/useStorage'

interface SmartSearchProps<T extends Record<string, unknown>> {
  placeholder?: string
  data: T[]
  searchKeys: (keyof T)[]
  onSelect?: (item: T) => void
  renderResult?: (item: T, highlight: string) => React.ReactNode
  style?: ViewStyle
  showTrending?: boolean
  showHistory?: boolean
  maxResults?: number
  testID?: string
}

const AnimatedView = Animated.createAnimatedComponent(View)

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
  testID = 'smart-search',
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
  const inputRef = useRef<TextInput>(null)
  const opacity = useSharedValue(0)
  const translateY = useSharedValue(-10)
  const reducedMotion = useReducedMotionSV()

  const results = useMemo(() => {
    if (!query.trim()) return []

    const lowerQuery = query.toLowerCase()
    
    return data
      .map((item) => {
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
          } else {
            const queryWords = lowerQuery.split(' ')
            const valueWords = value.split(' ')
            
            const matchingWords = queryWords.filter(qw =>
              valueWords.some(vw => vw.includes(qw))
            )
            
            if (matchingWords.length > 0) {
              score = Math.max(score, (matchingWords.length / queryWords.length) * 40)
              matchedKey = key as string
            }
          }
        }

        return score > 0 ? { item, score, matchedKey } : null
      })
      .filter((result): result is NonNullable<typeof result> => result !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
  }, [query, data, searchKeys, maxResults])

  React.useEffect(() => {
    const showDropdown = isFocused && (query.trim() || showHistory || showTrending)
    if (showDropdown) {
      if (reducedMotion.value) {
        opacity.value = withTiming(1, { duration: 200 })
        translateY.value = withTiming(0, { duration: 200 })
      } else {
        opacity.value = withSpring(1, { stiffness: 400, damping: 30 })
        translateY.value = withSpring(0, { stiffness: 400, damping: 30 })
      }
    } else {
      opacity.value = withTiming(0, { duration: 200 })
      translateY.value = withTiming(-10, { duration: 200 })
    }
  }, [isFocused, query, showHistory, showTrending, opacity, translateY, reducedMotion])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }))

  const handleSelect = useCallback((item: T, queryText: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    if (showHistory) {
      setSearchHistory((prev) => {
        const updated = [queryText, ...(prev || []).filter((q) => q !== queryText)].slice(0, 10)
        return updated
      })
    }
    
    onSelect?.(item)
    setQuery('')
    setIsFocused(false)
    inputRef.current?.blur()
  }, [showHistory, setSearchHistory, onSelect])

  const handleHistoryClick = useCallback((historyQuery: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setQuery(historyQuery)
    inputRef.current?.focus()
  }, [])

  const handleClearHistory = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSearchHistory([])
  }, [setSearchHistory])

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <Text key={i} style={styles.highlight}>
          {part}
        </Text>
      ) : (
        <Text key={i}>{part}</Text>
      )
    )
  }

  const showDropdown = isFocused && (query.trim() || showHistory || showTrending)

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.inputContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          ref={inputRef}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={placeholder}
          style={styles.input}
          placeholderTextColor="#9ca3af"
        />
        {query ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              setQuery('')
              inputRef.current?.focus()
            }}
            style={styles.clearButton}
          >
            <Text style={styles.clearIcon}>×</Text>
          </Pressable>
        ) : null}
      </View>

      {showDropdown && (
        <AnimatedView style={[styles.dropdown, animatedStyle]}>
          {query.trim() ? (
            <>
              {results.length > 0 ? (
                <View style={styles.resultsContainer}>
                  <Text style={styles.sectionHeader}>Results ({results.length})</Text>
                  <FlatList
                    data={results}
                    keyExtractor={(_, index) => `result-${index}`}
                    renderItem={({ item: { item, matchedKey } }) => (
                      <Pressable
                        onPress={() => handleSelect(item, query)}
                        style={styles.resultItem}
                      >
                        {renderResult ? (
                          renderResult(item, query)
                        ) : (
                          <Text style={styles.resultText}>
                            {highlightText(String(item[matchedKey]), query)}
                          </Text>
                        )}
                      </Pressable>
                    )}
                  />
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No results found for "{query}"</Text>
                </View>
              )}
            </>
          ) : (
            <>
              {showHistory && (searchHistory || []).length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionHeader}>Recent Searches</Text>
                    <Pressable onPress={handleClearHistory} style={styles.clearButton}>
                      <Text style={styles.clearText}>Clear</Text>
                    </Pressable>
                  </View>
                  <FlatList
                    data={(searchHistory || []).slice(0, 5)}
                    keyExtractor={(item, index) => `history-${index}`}
                    renderItem={({ item: historyQuery }) => (
                      <Pressable
                        onPress={() => handleHistoryClick(historyQuery)}
                        style={styles.historyItem}
                      >
                        <Text style={styles.historyIcon}>🕐</Text>
                        <Text style={styles.historyText}>{historyQuery}</Text>
                      </Pressable>
                    )}
                  />
                </View>
              )}

              {showTrending && (trendingSearches || []).length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionHeader}>Trending</Text>
                  <View style={styles.trendingContainer}>
                    {(trendingSearches || []).map((trending, index) => (
                      <Pressable
                        key={index}
                        onPress={() => handleHistoryClick(trending)}
                        style={styles.trendingBadge}
                      >
                        <Text style={styles.trendingText}>{trending}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </>
          )}
        </AnimatedView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  clearButton: {
    padding: 4,
  },
  clearIcon: {
    fontSize: 20,
    color: '#9ca3af',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 400,
    padding: 8,
  },
  resultsContainer: {
    maxHeight: 300,
  },
  section: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  resultItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  resultText: {
    fontSize: 14,
    color: '#111827',
  },
  highlight: {
    backgroundColor: '#dbeafe',
    color: '#3b82f6',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  historyIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  historyText: {
    fontSize: 14,
    color: '#111827',
  },
  trendingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trendingBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  trendingText: {
    fontSize: 12,
    color: '#111827',
  },
  clearText: {
    fontSize: 12,
    color: '#3b82f6',
  },
})

