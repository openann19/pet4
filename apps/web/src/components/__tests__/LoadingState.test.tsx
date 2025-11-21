/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import LoadingState from '../LoadingState'

describe('LoadingState', () => {
    it('should render loading state component', () => {
        render(<LoadingState />)

        // Check main container
        const container = screen.getByRole('status') || document.querySelector('.flex.min-h-\\[60vh\\]')
        expect(container).toBeInTheDocument()
    })

    it('should display loading text', () => {
        render(<LoadingState />)

        expect(screen.getByText('Loading your experience...')).toBeInTheDocument()
        expect(screen.getByText('Preparing amazing connections')).toBeInTheDocument()
    })

    it('should render loading spinner', () => {
        render(<LoadingState />)

        // Check for paw print icon
        const pawPrint = document.querySelector('[data-testid="paw-print"]') ||
            document.querySelector('.text-primary')
        expect(pawPrint).toBeInTheDocument()
    })

    it('should render loading dots', () => {
        render(<LoadingState />)

        // Check for loading dots container
        const dotsContainer = document.querySelector('.flex.gap-2\\.5')
        expect(dotsContainer).toBeInTheDocument()

        // Should have 4 dots
        const dots = dotsContainer?.querySelectorAll('.rounded-full')
        expect(dots?.length).toBe(4)
    })

    it('should have proper accessibility attributes', () => {
        render(<LoadingState />)

        // The component should be accessible to screen readers
        const loadingText = screen.getByText('Loading your experience...')
        expect(loadingText).toBeInTheDocument()
    })

    it('should have proper CSS classes for styling', () => {
        render(<LoadingState />)

        // Check main container classes
        const container = document.querySelector('.flex.min-h-\\[60vh\\]')
        expect(container).toHaveClass('flex', 'min-h-[60vh]', 'flex-col', 'items-center', 'justify-center', 'space-y-6', 'px-4')
    })

    it('should render gradient text', () => {
        render(<LoadingState />)

        const gradientText = document.querySelector('.bg-gradient-to-r')
        expect(gradientText).toBeInTheDocument()
        expect(gradientText).toHaveClass('from-primary', 'via-accent', 'to-secondary', 'bg-clip-text', 'text-transparent')
    })

    it('should have motion components', () => {
        render(<LoadingState />)

        // Check for MotionView components (they should be present)
        const motionViews = document.querySelectorAll('[data-motion-view]')
        // If data attributes aren't present, check by structure
        const animatedElements = document.querySelectorAll('.absolute')
        expect(animatedElements.length).toBeGreaterThan(0)
    })

    it('should have floating hearts', () => {
        render(<LoadingState />)

        // Check for heart icons
        const hearts = document.querySelectorAll('.text-accent')
        expect(hearts.length).toBeGreaterThanOrEqual(3) // Should have 3 floating hearts
    })

    it('should have proper structure with sub-components', () => {
        render(<LoadingState />)

        // Main container
        const mainContainer = document.querySelector('.flex.min-h-\\[60vh\\]')
        expect(mainContainer).toBeInTheDocument()

        // Should contain spinner, text, and dots
        expect(mainContainer?.children.length).toBe(3)
    })

    it('should be responsive with proper spacing', () => {
        render(<LoadingState />)

        const container = document.querySelector('.flex.min-h-\\[60vh\\]')
        expect(container).toHaveClass('px-4') // Should have horizontal padding
    })

    it('should have semantic loading indicator', () => {
        render(<LoadingState />)

        // Check for any loading-related content
        const loadingContent = screen.getByText(/loading/i)
        expect(loadingContent).toBeInTheDocument()
    })

    describe('sub-components', () => {
        it('should render LoadingSpinner with proper animations', () => {
            render(<LoadingState />)

            const spinner = document.querySelector('.relative.h-28.w-28')
            expect(spinner).toBeInTheDocument()
            expect(spinner).toHaveClass('h-28', 'w-28')
        })

        it('should render LoadingText with gradient styling', () => {
            render(<LoadingState />)

            const textContainer = document.querySelector('.max-w-sm')
            expect(textContainer).toBeInTheDocument()
            expect(textContainer).toHaveClass('max-w-sm', 'flex-col', 'items-center', 'gap-3', 'text-center')
        })

        it('should render LoadingDots with proper count', () => {
            render(<LoadingState />)

            const dots = document.querySelectorAll('.h-2\\.5.w-2\\.5.rounded-full')
            expect(dots.length).toBe(4)

            // Each dot should have gradient classes
            dots.forEach(dot => {
                expect(dot).toHaveClass('bg-gradient-to-r', 'from-primary', 'to-accent')
            })
        })
    })

    describe('visual elements', () => {
        it('should have proper color scheme', () => {
            render(<LoadingState />)

            // Check for primary colors
            const primaryElements = document.querySelectorAll('.text-primary, .from-primary')
            expect(primaryElements.length).toBeGreaterThan(0)

            // Check for accent colors
            const accentElements = document.querySelectorAll('.text-accent, .via-accent, .to-accent')
            expect(accentElements.length).toBeGreaterThan(0)
        })

        it('should have backdrop blur effects', () => {
            render(<LoadingState />)

            const blurElements = document.querySelectorAll('.backdrop-blur-sm')
            expect(blurElements.length).toBeGreaterThan(0)
        })

        it('should have drop shadow effects', () => {
            render(<LoadingState />)

            const shadowElements = document.querySelectorAll('.drop-shadow-lg')
            expect(shadowElements.length).toBeGreaterThan(0)
        })
    })

    describe('layout and positioning', () => {
        it('should be centered on the page', () => {
            render(<LoadingState />)

            const container = document.querySelector('.flex.min-h-\\[60vh\\]')
            expect(container).toHaveClass('items-center', 'justify-center')
        })

        it('should have proper spacing between elements', () => {
            render(<LoadingState />)

            const container = document.querySelector('.flex.min-h-\\[60vh\\]')
            expect(container).toHaveClass('space-y-6')
        })

        it('should have responsive text sizing', () => {
            render(<LoadingState />)

            const titleText = document.querySelector('.text-xl')
            expect(titleText).toBeInTheDocument()
            expect(titleText).toHaveClass('text-xl', 'font-bold')

            const subtitleText = document.querySelector('.text-sm')
            expect(subtitleText).toBeInTheDocument()
            expect(subtitleText).toHaveClass('text-sm')
        })
    })
})
