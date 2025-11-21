/// <reference types="@testing-library/jest-dom" />
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EnhancedErrorBoundary } from '../EnhancedErrorBoundary'
import { createLogger } from '../../lib/logger'

// Mock the logger
const mockLogger = {
    error: vi.fn(),
    debug: vi.fn(),
}

// Mock window.performance
const mockPerformance = {
    getEntriesByType: vi.fn(() => [
        {
            name: 'navigation',
            startTime: 0,
            duration: 1000,
        }
    ]),
}

Object.defineProperty(window, 'performance', {
    value: mockPerformance,
    writable: true,
})

// Mock window.location.reload
const mockReload = vi.fn()
Object.defineProperty(window.location, 'reload', {
    value: mockReload,
    writable: true,
    configurable: true,
})

// Mock import.meta.env.DEV
Object.defineProperty(import.meta, 'env', {
    value: { DEV: true },
    writable: true,
})

vi.mock('../../lib/logger', () => ({
    createLogger: vi.fn(() => mockLogger),
}))

describe('EnhancedErrorBoundary', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should render children when there is no error', () => {
        render(
            <EnhancedErrorBoundary>
                <div>Test Children</div>
            </EnhancedErrorBoundary>
        )

        expect(screen.getByText('Test Children')).toBeInTheDocument()
    })

    it('should render fallback UI when there is an error', () => {
        const ThrowError = () => {
            throw new Error('Test error')
        }

        render(
            <EnhancedErrorBoundary>
                <ThrowError />
            </EnhancedErrorBoundary>
        )

        expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
        expect(screen.getByText('We encountered an unexpected error. Don\'t worry, your data is safe.')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /reload app/i })).toBeInTheDocument()
    })

    it('should render custom fallback when provided', () => {
        const ThrowError = () => {
            throw new Error('Test error')
        }

        render(
            <EnhancedErrorBoundary fallback={<div>Custom Fallback</div>}>
                <ThrowError />
            </EnhancedErrorBoundary>
        )

        expect(screen.getByText('Custom Fallback')).toBeInTheDocument()
        expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
    })

    it('should log error when error occurs', () => {
        const ThrowError = () => {
            throw new Error('Test error')
        }

        render(
            <EnhancedErrorBoundary>
                <ThrowError />
            </EnhancedErrorBoundary>
        )

        expect(mockLogger.error).toHaveBeenCalledWith(
            'Error Boundary caught an error',
            expect.any(Error),
            expect.objectContaining({
                componentStack: expect.any(String),
                errorBoundary: true,
            })
        )
    })

    it('should log performance data in browser environment', () => {
        const ThrowError = () => {
            throw new Error('Test error')
        }

        render(
            <EnhancedErrorBoundary>
                <ThrowError />
            </EnhancedErrorBoundary>
        )

        expect(mockLogger.debug).toHaveBeenCalledWith(
            'Performance data at error',
            expect.objectContaining({
                perfData: expect.any(Array),
            })
        )
    })

    it('should display error message in development mode', () => {
        const ThrowError = () => {
            throw new Error('Test error message')
        }

        render(
            <EnhancedErrorBoundary>
                <ThrowError />
            </EnhancedErrorBoundary>
        )

        expect(screen.getByText('Test error message')).toBeInTheDocument()
    })

    it('should not display error message in production mode', () => {
        Object.defineProperty(import.meta, 'env', {
            value: { DEV: false },
            writable: true,
        })

        const ThrowError = () => {
            throw new Error('Test error message')
        }

        render(
            <EnhancedErrorBoundary>
                <ThrowError />
            </EnhancedErrorBoundary>
        )

        expect(screen.queryByText('Test error message')).not.toBeInTheDocument()
    })

    it('should reload page when reload button is clicked', () => {
        const ThrowError = () => {
            throw new Error('Test error')
        }

        render(
            <EnhancedErrorBoundary>
                <ThrowError />
            </EnhancedErrorBoundary>
        )

        const reloadButton = screen.getByRole('button', { name: /reload app/i })
        fireEvent.click(reloadButton)

        expect(mockReload).toHaveBeenCalled()
    })

    it('should have proper accessibility attributes', () => {
        const ThrowError = () => {
            throw new Error('Test error')
        }

        render(
            <EnhancedErrorBoundary>
                <ThrowError />
            </EnhancedErrorBoundary>
        )

        // Check for heading
        const heading = screen.getByRole('heading', { level: 1 })
        expect(heading).toBeInTheDocument()
        expect(heading).toHaveTextContent('Oops! Something went wrong')

        // Check for button
        const button = screen.getByRole('button')
        expect(button).toBeInTheDocument()
        expect(button).toHaveTextContent('Reload App')
    })

    it('should have proper CSS classes and styling', () => {
        const ThrowError = () => {
            throw new Error('Test error')
        }

        render(
            <EnhancedErrorBoundary>
                <ThrowError />
            </EnhancedErrorBoundary>
        )

        // Check main container
        const container = document.querySelector('.min-h-screen')
        expect(container).toHaveClass('flex', 'items-center', 'justify-center', 'p-4')

        // Check card
        const card = document.querySelector('.shadow-2xl')
        expect(card).toBeInTheDocument()
        expect(card).toHaveClass('max-w-md', 'w-full', 'p-8', 'text-center', 'space-y-6')

        // Check warning icon container
        const iconContainer = document.querySelector('.bg-destructive\\/10')
        expect(iconContainer).toBeInTheDocument()
        expect(iconContainer).toHaveClass('w-20', 'h-20', 'mx-auto', 'rounded-full', 'flex', 'items-center', 'justify-center')
    })

    it('should display warning icon', () => {
        const ThrowError = () => {
            throw new Error('Test error')
        }

        render(
            <EnhancedErrorBoundary>
                <ThrowError />
            </EnhancedErrorBoundary>
        )

        const warningIcon = document.querySelector('.text-destructive')
        expect(warningIcon).toBeInTheDocument()
    })

    it('should display help text', () => {
        const ThrowError = () => {
            throw new Error('Test error')
        }

        render(
            <EnhancedErrorBoundary>
                <ThrowError />
            </EnhancedErrorBoundary>
        )

        expect(screen.getByText(/if this problem persists/i)).toBeInTheDocument()
        expect(screen.getByText(/please clear your browser cache and try again/i)).toBeInTheDocument()
    })

    it('should handle async errors', async () => {
        const AsyncErrorComponent = () => {
            setTimeout(() => {
                throw new Error('Async error')
            }, 0)
            return <div>Async Component</div>
        }

        render(
            <EnhancedErrorBoundary>
                <AsyncErrorComponent />
            </EnhancedErrorBoundary>
        )

        // Initially should render children
        expect(screen.getByText('Async Component')).toBeInTheDocument()

        // Note: Async errors thrown in setTimeout won't be caught by error boundary
        // This is expected React behavior - error boundaries only catch sync errors
        // in render, lifecycle methods, and constructors
    })

    it('should reset error state correctly', () => {
        const ThrowError = () => {
            throw new Error('Test error')
        }

        const { rerender } = render(
            <EnhancedErrorBoundary>
                <ThrowError />
            </EnhancedErrorBoundary>
        )

        // Should show error state
        expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()

        // Click reload button
        const reloadButton = screen.getByRole('button', { name: /reload app/i })
        fireEvent.click(reloadButton)

        // Should have called reload
        expect(mockReload).toHaveBeenCalled()
    })

    it('should handle errors without stack traces', () => {
        const errorWithoutStack = new Error('Error without stack')
        delete errorWithoutStack.stack

        const ThrowError = () => {
            throw errorWithoutStack
        }

        render(
            <EnhancedErrorBoundary>
                <ThrowError />
            </EnhancedErrorBoundary>
        )

        expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
        expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should handle component errors gracefully', () => {
        const ProblematicComponent = ({ shouldThrow }: { shouldThrow: boolean }) => {
            if (shouldThrow) {
                throw new Error('Component error')
            }
            return <div>Normal Component</div>
        }

        const { rerender } = render(
            <EnhancedErrorBoundary>
                <ProblematicComponent shouldThrow={false} />
            </EnhancedErrorBoundary>
        )

        // Should render normally
        expect(screen.getByText('Normal Component')).toBeInTheDocument()

        // Rerender with error
        rerender(
            <EnhancedErrorBoundary>
                <ProblematicComponent shouldThrow={true} />
            </EnhancedErrorBoundary>
        )

        // Should show error boundary
        expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    })

    describe('error handling edge cases', () => {
        it('should handle null errors', () => {
            const ThrowNull = () => {
                throw null
            }

            expect(() => {
                render(
                    <EnhancedErrorBoundary>
                        <ThrowNull />
                    </EnhancedErrorBoundary>
                )
            }).not.toThrow()
        })

        it('should handle undefined errors', () => {
            const ThrowUndefined = () => {
                throw undefined
            }

            expect(() => {
                render(
                    <EnhancedErrorBoundary>
                        <ThrowUndefined />
                    </EnhancedErrorBoundary>
                )
            }).not.toThrow()
        })

        it('should handle string errors', () => {
            const ThrowString = () => {
                throw 'String error'
            }

            render(
                <EnhancedErrorBoundary>
                    <ThrowString />
                </EnhancedErrorBoundary>
            )

            expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
        })

        it('should handle object errors', () => {
            const ThrowObject = () => {
                throw { message: 'Object error', code: 500 }
            }

            render(
                <EnhancedErrorBoundary>
                    <ThrowObject />
                </EnhancedErrorBoundary>
            )

            expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
        })
    })

    describe('component lifecycle', () => {
        it('should initialize with correct state', () => {
            const { container } = render(
                <EnhancedErrorBoundary>
                    <div>Test Children</div>
                </EnhancedErrorBoundary>
            )

            expect(container.firstChild).toBeInstanceOf(HTMLDivElement)
            expect(screen.getByText('Test Children')).toBeInTheDocument()
        })

        it('should handle errors in nested components', () => {
            const NestedErrorComponent = () => {
                throw new Error('Nested error')
            }

            const ParentComponent = () => (
                <div>
                    <h1>Parent</h1>
                    <NestedErrorComponent />
                </div>
            )

            render(
                <EnhancedErrorBoundary>
                    <ParentComponent />
                </EnhancedErrorBoundary>
            )

            expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
            expect(screen.queryByText('Parent')).not.toBeInTheDocument()
        })
    })
})
