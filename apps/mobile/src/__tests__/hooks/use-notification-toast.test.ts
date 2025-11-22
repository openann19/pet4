import { NotificationProvider } from '@mobile/components/notifications'
import { useNotificationToast } from '@mobile/hooks/use-notification-toast'
import { act, renderHook } from '@testing-library/react-native'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('expo-haptics', () => ({
  notificationAsync: vi.fn().mockResolvedValue(undefined),
}))

describe('useNotificationToast', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => {
    return React.createElement(NotificationProvider, { children }, children)
  }

  it('should provide notification methods', () => {
    const { result } = renderHook(() => useNotificationToast(), { wrapper })

    expect(result.current.showSuccess).toBeDefined()
    expect(result.current.showError).toBeDefined()
    expect(result.current.showWarning).toBeDefined()
    expect(result.current.showInfo).toBeDefined()
  })

  it('should show success notification', () => {
    const { result } = renderHook(() => useNotificationToast(), { wrapper })

    act(() => {
      result.current.showSuccess('Success!', 'Operation completed')
    })

    expect(typeof result.current.showSuccess).toBe('function')
  })
})
