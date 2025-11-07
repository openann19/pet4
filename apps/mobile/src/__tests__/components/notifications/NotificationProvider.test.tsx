import { NotificationProvider, useNotifications } from '@mobile/components/notifications'
import { act, renderHook } from '@testing-library/react-native'
import { describe, expect, it } from 'vitest'

describe('NotificationProvider', () => {
  it('should provide notification context', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NotificationProvider>{children}</NotificationProvider>
    )

    const { result } = renderHook(() => useNotifications(), { wrapper })

    expect(result.current.showNotification).toBeDefined()
    expect(result.current.dismissNotification).toBeDefined()
    expect(result.current.clearAll).toBeDefined()
  })

  it('should show and dismiss notifications', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <NotificationProvider>{children}</NotificationProvider>
    )

    const { result } = renderHook(() => useNotifications(), { wrapper })

    act(() => {
      result.current.showNotification({
        type: 'success',
        title: 'Test',
      })
    })

    act(() => {
      result.current.clearAll()
    })
  })
})

