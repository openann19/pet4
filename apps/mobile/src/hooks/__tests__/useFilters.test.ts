/**
 * Filters Hook Tests (Mobile)
 * Location: apps/mobile/src/hooks/__tests../use-filters.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react-native'
import { useFilters } from '../use-filters'
import { haptics } from '@/lib/haptics'

// Mock haptics
vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
  },
}))

const mockHaptics = vi.mocked(haptics)

describe('useFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with initial values', () => {
    const categories = [
      {
        id: 'category1',
        label: 'Category 1',
        type: 'multi-select' as const,
        options: [
          { id: 'option1', label: 'Option 1' },
          { id: 'option2', label: 'Option 2' },
        ],
      },
    ]

    const initialValues = {
      category1: ['option1'],
    }

    const { result } = renderHook(() =>
      useFilters({
        categories,
        initialValues,
      })
    )

    expect(result.current.values).toEqual(initialValues)
  })

  it('should calculate active filters count', () => {
    const categories = [
      {
        id: 'category1',
        label: 'Category 1',
        type: 'multi-select' as const,
        options: [
          { id: 'option1', label: 'Option 1' },
          { id: 'option2', label: 'Option 2' },
        ],
      },
      {
        id: 'category2',
        label: 'Category 2',
        type: 'toggle' as const,
      },
    ]

    const initialValues = {
      category1: ['option1'],
      category2: true,
    }

    const { result } = renderHook(() =>
      useFilters({
        categories,
        initialValues,
      })
    )

    expect(result.current.activeFiltersCount).toBe(2)
  })

  it('should handle multi-select', () => {
    const categories = [
      {
        id: 'category1',
        label: 'Category 1',
        type: 'multi-select' as const,
        options: [
          { id: 'option1', label: 'Option 1' },
          { id: 'option2', label: 'Option 2' },
        ],
      },
    ]

    const { result } = renderHook(() =>
      useFilters({
        categories,
      })
    )

    act(() => {
      result.current.handleMultiSelect('category1', 'option1')
    })

    expect(result.current.values.category1).toEqual(['option1'])
    expect(mockHaptics.impact).toHaveBeenCalledWith('light')

    act(() => {
      result.current.handleMultiSelect('category1', 'option2')
    })

    expect(result.current.values.category1).toEqual(['option1', 'option2'])

    act(() => {
      result.current.handleMultiSelect('category1', 'option1')
    })

    expect(result.current.values.category1).toEqual(['option2'])
  })

  it('should handle single-select', () => {
    const categories = [
      {
        id: 'category1',
        label: 'Category 1',
        type: 'single-select' as const,
        options: [
          { id: 'option1', label: 'Option 1' },
          { id: 'option2', label: 'Option 2' },
        ],
      },
    ]

    const { result } = renderHook(() =>
      useFilters({
        categories,
      })
    )

    act(() => {
      result.current.handleSingleSelect('category1', 'option1')
    })

    expect(result.current.values.category1).toBe('option1')
    expect(mockHaptics.impact).toHaveBeenCalledWith('light')

    act(() => {
      result.current.handleSingleSelect('category1', 'option1')
    })

    expect(result.current.values.category1).toBeNull()
  })

  it('should handle range change', () => {
    const categories = [
      {
        id: 'category1',
        label: 'Category 1',
        type: 'range' as const,
        min: 0,
        max: 100,
        step: 1,
      },
    ]

    const { result } = renderHook(() =>
      useFilters({
        categories,
      })
    )

    act(() => {
      result.current.handleRangeChange('category1', [50])
    })

    expect(result.current.values.category1).toBe(50)
  })

  it('should handle toggle', () => {
    const categories = [
      {
        id: 'category1',
        label: 'Category 1',
        type: 'toggle' as const,
      },
    ]

    const { result } = renderHook(() =>
      useFilters({
        categories,
      })
    )

    act(() => {
      result.current.handleToggle('category1')
    })

    expect(result.current.values.category1).toBe(true)
    expect(mockHaptics.impact).toHaveBeenCalledWith('light')

    act(() => {
      result.current.handleToggle('category1')
    })

    expect(result.current.values.category1).toBe(false)
  })

  it('should apply filters', () => {
    const categories = [
      {
        id: 'category1',
        label: 'Category 1',
        type: 'multi-select' as const,
        options: [{ id: 'option1', label: 'Option 1' }],
      },
    ]

    const onApply = vi.fn()

    const { result } = renderHook(() =>
      useFilters({
        categories,
        onApply,
      })
    )

    act(() => {
      result.current.handleMultiSelect('category1', 'option1')
    })

    act(() => {
      result.current.applyFilters()
    })

    expect(onApply).toHaveBeenCalledWith({ category1: ['option1'] })
    expect(mockHaptics.impact).toHaveBeenCalledWith('medium')
  })

  it('should reset filters', () => {
    const categories = [
      {
        id: 'category1',
        label: 'Category 1',
        type: 'multi-select' as const,
        options: [{ id: 'option1', label: 'Option 1' }],
      },
      {
        id: 'category2',
        label: 'Category 2',
        type: 'range' as const,
        min: 0,
        max: 100,
      },
      {
        id: 'category3',
        label: 'Category 3',
        type: 'toggle' as const,
      },
    ]

    const { result } = renderHook(() =>
      useFilters({
        categories,
        initialValues: {
          category1: ['option1'],
          category2: 50,
          category3: true,
        },
      })
    )

    act(() => {
      result.current.resetFilters()
    })

    expect(result.current.values.category1).toEqual([])
    expect(result.current.values.category2).toBe(0)
    expect(result.current.values.category3).toBe(false)
    expect(mockHaptics.impact).toHaveBeenCalledWith('light')
  })

  it('should set values directly', () => {
    const categories = [
      {
        id: 'category1',
        label: 'Category 1',
        type: 'multi-select' as const,
        options: [{ id: 'option1', label: 'Option 1' }],
      },
    ]

    const { result } = renderHook(() =>
      useFilters({
        categories,
      })
    )

    act(() => {
      result.current.setValues({ category1: ['option1'] })
    })

    expect(result.current.values.category1).toEqual(['option1'])
  })
})
