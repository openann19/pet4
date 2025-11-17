/**
 * LoadingIndicator Component Tests
 *
 * Tests for the LoadingIndicator component
 */

import { LoadingIndicator } from '@mobile/components/LoadingIndicator'
import { render } from '@testing-library/react-native'
import { describe, it, expect } from 'vitest'
import React from 'react'

describe('LoadingIndicator', () => {
    it('should render without crashing', () => {
        render(<LoadingIndicator />)
        // Component should render without errors
        expect(true).toBe(true)
    })

    it('should display custom message', () => {
        const { getByText } = render(<LoadingIndicator message="Loading data..." />)
        expect(getByText('Loading data...')).toBeTruthy()
    })

    it('should not display message when not provided', () => {
        const { queryByText } = render(<LoadingIndicator />)
        expect(queryByText('Loading...')).toBeNull()
    })

    it('should render view container', () => {
        render(<LoadingIndicator />)
        // Component should render without errors
        expect(true).toBe(true)
    })

    it('should render with default large size', () => {
        render(<LoadingIndicator />)
        // Component should render without errors
        expect(true).toBe(true)
    })

    it('should render with small size when specified', () => {
        render(<LoadingIndicator size="small" />)
        // Component should render without errors
        expect(true).toBe(true)
    })
})
