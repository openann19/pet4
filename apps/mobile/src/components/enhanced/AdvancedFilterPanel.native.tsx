/**
 * AdvancedFilterPanel - Mobile Native Implementation
 * Location: apps/mobile/src/components/enhanced/AdvancedFilterPanel.native.tsx
 */

import React, { useCallback } from 'react'
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  type ViewStyle,
} from 'react-native'
import * as Haptics from 'expo-haptics'
import { useFilters } from '@/hooks/useFilters'

export interface FilterOption {
  id: string
  label: string
  icon?: React.ReactNode
}

export interface FilterCategory {
  id: string
  label: string
  type: 'multi-select' | 'single-select' | 'range' | 'toggle'
  options?: FilterOption[]
  min?: number
  max?: number
  step?: number
  unit?: string
}

export interface AdvancedFilterPanelProps {
  categories: FilterCategory[]
  values: Record<string, unknown>
  onChange: (values: Record<string, unknown>) => void
  onClose?: () => void
  showActiveCount?: boolean
  style?: ViewStyle
}

export function AdvancedFilterPanel({
  categories,
  values,
  onChange,
  onClose,
  showActiveCount = true,
  style,
}: AdvancedFilterPanelProps): React.JSX.Element {
  const {
    values: localValues,
    activeFiltersCount,
    applyFilters,
    resetFilters,
    handleMultiSelect,
    handleSingleSelect,
    handleToggle,
  } = useFilters({
    categories,
    initialValues: values,
    onApply: (vals) => {
      onChange(vals)
      onClose?.()
    },
  })

  const handleApply = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    applyFilters()
  }, [applyFilters])

  const handleReset = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    resetFilters()
  }, [resetFilters])

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>Filters</Text>
          {showActiveCount && activeFiltersCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </View>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {categories.map((category) => (
          <View key={category.id} style={styles.category}>
            <Text style={styles.categoryLabel}>{category.label}</Text>

            {category.type === 'multi-select' && category.options && (
              <View style={styles.optionsContainer}>
                {category.options.map((option) => {
                  const isSelected = ((localValues[category.id] as string[]) ?? []).includes(option.id)
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => handleMultiSelect(category.id, option.id)}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            )}

            {category.type === 'single-select' && category.options && (
              <View style={styles.optionsContainer}>
                {category.options.map((option) => {
                  const isSelected = localValues[category.id] === option.id
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => handleSingleSelect(category.id, option.id)}
                      style={[
                        styles.optionButton,
                        isSelected && styles.optionButtonSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            )}

            {category.type === 'toggle' && (
              <Pressable
                onPress={() => handleToggle(category.id)}
                style={[
                  styles.toggle,
                  Boolean(localValues[category.id]) && styles.toggleActive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleText,
                    Boolean(localValues[category.id]) && styles.toggleTextActive,
                  ]}
                >
                  {localValues[category.id] ? 'Enabled' : 'Disabled'}
                </Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable onPress={handleReset} style={styles.resetButton}>
          <Text style={styles.resetText}>Reset</Text>
        </Pressable>
        <Pressable onPress={handleApply} style={styles.applyButton}>
          <Text style={styles.applyText}>Apply</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  badge: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    color: '#64748b',
  },
  content: {
    maxHeight: 400,
  },
  category: {
    marginBottom: 24,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#475569',
    marginBottom: 12,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionButtonSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  optionText: {
    fontSize: 14,
    color: '#475569',
  },
  optionTextSelected: {
    color: '#ffffff',
    fontWeight: '500',
  },
  toggle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignSelf: 'flex-start',
  },
  toggleActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  toggleText: {
    fontSize: 14,
    color: '#64748b',
  },
  toggleTextActive: {
    color: '#ffffff',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  resetText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#64748b',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  applyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
})

