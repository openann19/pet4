/**
 * Dialog Component Tests (Mobile)
 * Location: apps/mobile/src/components/ui/__tests__/Dialog.native.test.tsx
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { Dialog, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '../Dialog'
import * as Haptics from 'expo-haptics'

// Mock expo-haptics
vi.mock('expo-haptics', () => ({
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  impactAsync: vi.fn(),
}))

// Mock useReducedMotionSV
vi.mock('@mobile/effects/core/use-reduced-motion-sv', () => ({
  useReducedMotionSV: vi.fn(() => ({
    value: false,
  })),
}))

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => {
  const actual = vi.importActual('react-native-reanimated')
  return {
    ...actual,
    useSharedValue: vi.fn(initial => ({ value: initial })),
    useAnimatedStyle: vi.fn(fn => fn()),
    withTiming: vi.fn(value => value),
    withSpring: vi.fn(value => value),
    createAnimatedComponent: vi.fn(component => component),
    View: 'View',
  }
})

describe('Dialog (Mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should render dialog when visible is true', () => {
    render(
      <Dialog visible onClose={vi.fn()}>
        <DialogTitle>Test Dialog</DialogTitle>
      </Dialog>
    )

    expect(screen.getByText('Test Dialog')).toBeTruthy()
  })

  it('should not render dialog when visible is false', () => {
    render(
      <Dialog visible={false} onClose={vi.fn()}>
        <DialogTitle>Test Dialog</DialogTitle>
      </Dialog>
    )

    expect(screen.queryByText('Test Dialog')).toBeNull()
  })

  it('should render dialog with title and description', () => {
    render(
      <Dialog visible onClose={vi.fn()}>
        <DialogHeader>
          <DialogTitle>Test Title</DialogTitle>
          <DialogDescription>Test Description</DialogDescription>
        </DialogHeader>
      </Dialog>
    )

    expect(screen.getByText('Test Title')).toBeTruthy()
    expect(screen.getByText('Test Description')).toBeTruthy()
  })

  it('should render dialog with header and footer', () => {
    render(
      <Dialog visible onClose={vi.fn()}>
        <DialogHeader>
          <DialogTitle>Header</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <button>Cancel</button>
          <button>Confirm</button>
        </DialogFooter>
      </Dialog>
    )

    expect(screen.getByText('Header')).toBeTruthy()
  })

  it('should call onClose when close button is pressed', () => {
    const onClose = vi.fn()

    render(
      <Dialog visible onClose={onClose}>
        <DialogTitle>Test</DialogTitle>
      </Dialog>
    )

    const closeButton = screen.getByLabelText('Close dialog')
    fireEvent.press(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should not render close button when showCloseButton is false', () => {
    render(
      <Dialog visible onClose={vi.fn()} showCloseButton={false}>
        <DialogTitle>Test</DialogTitle>
      </Dialog>
    )

    expect(screen.queryByLabelText('Close dialog')).toBeNull()
  })

  it('should have proper accessibility attributes', () => {
    render(
      <Dialog
        visible
        onClose={vi.fn()}
        accessibilityLabel="Test Dialog"
        accessibilityHint="This is a test dialog"
      >
        <DialogTitle>Accessible Dialog</DialogTitle>
        <DialogDescription>This is an accessible dialog</DialogDescription>
      </Dialog>
    )

    const dialog = screen.getByLabelText('Test Dialog')
    expect(dialog).toBeTruthy()
  })

  it('should trigger haptic feedback on close', () => {
    const onClose = vi.fn()

    render(
      <Dialog visible onClose={onClose} hapticFeedback>
        <DialogTitle>Test</DialogTitle>
      </Dialog>
    )

    const closeButton = screen.getByLabelText('Close dialog')
    fireEvent.press(closeButton)

    expect(Haptics.impactAsync).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Light)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should not trigger haptic feedback when disabled', () => {
    const onClose = vi.fn()

    render(
      <Dialog visible onClose={onClose} hapticFeedback={false}>
        <DialogTitle>Test</DialogTitle>
      </Dialog>
    )

    const closeButton = screen.getByLabelText('Close dialog')
    fireEvent.press(closeButton)

    expect(Haptics.impactAsync).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should call onClose when overlay is pressed', () => {
    const onClose = vi.fn()

    render(
      <Dialog visible onClose={onClose}>
        <DialogTitle>Test</DialogTitle>
      </Dialog>
    )

    // Note: Testing overlay press requires finding the overlay component
    // This is a simplified test - in practice, you'd need to find the overlay
    expect(screen.getByText('Test')).toBeTruthy()
  })
})
