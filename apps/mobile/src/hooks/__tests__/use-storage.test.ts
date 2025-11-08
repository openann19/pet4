/**
 * useStorage Hook Tests (Mobile)
 * Location: apps/mobile/src/hooks/__tests__/use-storage.test.ts
 */

import { renderHook, act, waitFor } from '@testing-library/react-native'
import { useStorage } from '../use-storage'
import AsyncStorage from '@react-native-async-storage/async-storage'

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
}))

vi.mock('../utils/logger', () => ({
  createLogger: () => ({
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  }),
}))

const mockAsyncStorage = vi.mocked(AsyncStorage)

describe('useStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('returns default value when storage is empty', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null)

    const { result } = renderHook(() => useStorage<string>('test-key', 'default'))

    await waitFor(() => {
      expect(result.current[0]).toBe('default')
    })
  })

  it('returns stored value when available', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify('stored-value'))

    const { result } = renderHook(() => useStorage<string>('test-key', 'default'))

    await waitFor(() => {
      expect(result.current[0]).toBe('stored-value')
    })
  })

  it('sets value correctly', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null)
    mockAsyncStorage.setItem.mockResolvedValue()

    const { result } = renderHook(() => useStorage<string>('test-key', 'default'))

    await waitFor(() => {
      expect(result.current[0]).toBe('default')
    })

    await act(async () => {
      await result.current[1]('new-value')
    })

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'))
    expect(result.current[0]).toBe('new-value')
  })

  it('supports functional updates', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(5))
    mockAsyncStorage.setItem.mockResolvedValue()

    const { result } = renderHook(() => useStorage<number>('test-key', 0))

    await waitFor(() => {
      expect(result.current[0]).toBe(5)
    })

    await act(async () => {
      await result.current[1](prev => prev + 1)
    })

    expect(mockAsyncStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(6))
    expect(result.current[0]).toBe(6)
  })

  it('deletes value correctly', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify('value'))
    mockAsyncStorage.removeItem.mockResolvedValue()

    const { result } = renderHook(() => useStorage<string>('test-key', 'default'))

    await waitFor(() => {
      expect(result.current[0]).toBe('value')
    })

    await act(async () => {
      await result.current[2]()
    })

    expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('test-key')
    expect(result.current[0]).toBe('default')
  })

  it('handles JSON parse errors gracefully', async () => {
    mockAsyncStorage.getItem.mockResolvedValue('invalid-json')

    const { result } = renderHook(() => useStorage<string>('test-key', 'default'))

    await waitFor(() => {
      expect(result.current[0]).toBe('default')
    })
  })

  it('handles storage errors gracefully', async () => {
    mockAsyncStorage.getItem.mockRejectedValue(new Error('Storage error'))
    mockAsyncStorage.setItem.mockRejectedValue(new Error('Storage error'))

    const { result } = renderHook(() => useStorage<string>('test-key', 'default'))

    await waitFor(() => {
      expect(result.current[0]).toBe('default')
    })

    await act(async () => {
      try {
        await result.current[1]('new-value')
      } catch {
        // Expected to throw
      }
    })

    // Should revert to default on error
    expect(result.current[0]).toBe('default')
  })

  it('returns 3-element tuple', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null)

    const { result } = renderHook(() => useStorage<string>('test-key', 'default'))

    await waitFor(() => {
      expect(result.current).toHaveLength(3)
      expect(typeof result.current[0]).toBe('string')
      expect(typeof result.current[1]).toBe('function')
      expect(typeof result.current[2]).toBe('function')
    })
  })

  it('updates when key changes', async () => {
    mockAsyncStorage.getItem.mockResolvedValue(null)

    const { result, rerender } = renderHook<
      [string, (value: string | ((prev: string) => string)) => Promise<void>, () => Promise<void>],
      { key: string }
    >(({ key }: { key: string }) => useStorage<string>(key, 'default'), {
      initialProps: { key: 'key1' },
    })

    await waitFor(() => {
      expect(result.current[0]).toBe('default')
    })

    mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify('value2'))

    rerender({ key: 'key2' })

    await waitFor(() => {
      expect(result.current[0]).toBe('value2')
    })
  })
})
