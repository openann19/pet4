/**
 * Tests for ErrorBoundary component
 * Location: src/__tests__/components/ErrorBoundary.test.tsx
 */

import { fireEvent, render } from '@testing-library/react-native'
import React from 'react'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from '../../components/ErrorBoundary'

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }): React.JSX.Element => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <>{'No error'}</>
}

describe('ErrorBoundary', () => {
  // Suppress console.error for these tests using vitest's spy
  beforeAll(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterAll(() => {
    vi.restoreAllMocks()
  })

  it('should render children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(getByText('No error')).toBeTruthy()
  })

  it('should render error UI when error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(getByText('Oops! Something went wrong')).toBeTruthy()
    expect(getByText('Test error')).toBeTruthy()
  })

  it('should render custom fallback when provided', () => {
    const fallback = <>{'Custom error message'}</>
    const { getByText } = render(
      <ErrorBoundary fallback={fallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(getByText('Custom error message')).toBeTruthy()
  })

  it('should reset error state when Try Again is pressed', () => {
    const { getByText, rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(getByText('Oops! Something went wrong')).toBeTruthy()

    const tryAgainButton = getByText('Try Again')
    fireEvent.press(tryAgainButton)

    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    )

    expect(getByText('No error')).toBeTruthy()
  })
})
