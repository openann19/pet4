/**
 * ErrorScreen Component Tests
 *
 * Tests for the ErrorScreen component
 */

import { ErrorScreen } from '@mobile/components/ErrorScreen'
import { render, fireEvent } from '@testing-library/react-native'
import { describe, it, expect, vi } from 'vitest'
import React from 'react'

describe('ErrorScreen', () => {
    it('should render without crashing', () => {
        const { getByText } = render(<ErrorScreen />)
        expect(getByText('Oops! Something went wrong')).toBeTruthy()
    })

    it('should display custom title', () => {
        const { getByText } = render(<ErrorScreen title="Custom Error Title" />)
        expect(getByText('Custom Error Title')).toBeTruthy()
    })

    it('should display custom message', () => {
        const { getByText } = render(<ErrorScreen message="Custom error message" />)
        expect(getByText('Custom error message')).toBeTruthy()
    })

    it('should display error message from Error object', () => {
        const error = new Error('Network error')
        const { getByText } = render(<ErrorScreen error={error} />)
        expect(getByText('Network error')).toBeTruthy()
    })

    it('should display error message from string', () => {
        const { getByText } = render(<ErrorScreen error="String error" />)
        expect(getByText('String error')).toBeTruthy()
    })

    it('should display retry button when onRetry is provided', () => {
        const onRetry = vi.fn()
        const { getByText } = render(<ErrorScreen onRetry={onRetry} />)
        expect(getByText('Retry')).toBeTruthy()
    })

    it('should not display retry button when onRetry is not provided', () => {
        const { queryByText } = render(<ErrorScreen />)
        expect(queryByText('Retry')).toBeNull()
    })

    it('should call onRetry when retry button is pressed', () => {
        const onRetry = vi.fn()
        const { getByText } = render(<ErrorScreen onRetry={onRetry} />)
        const retryButton = getByText('Retry')
        fireEvent.press(retryButton)
        expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('should have proper accessibility label when retry button is present', () => {
        const onRetry = vi.fn()
        const { getByLabelText } = render(<ErrorScreen onRetry={onRetry} />)
        expect(getByLabelText('Retry')).toBeTruthy()
    })
})
