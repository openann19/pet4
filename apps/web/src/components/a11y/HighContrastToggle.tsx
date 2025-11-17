/**
 * High Contrast Toggle Component (Web)
 *
 * Provides a toggle button for enabling/disabling high contrast mode.
 * Integrates with the high contrast theme system.
 *
 * Location: apps/web/src/components/a11y/HighContrastToggle.tsx
 */

import { useCallback } from 'react'
import { useHighContrast } from '@/hooks/accessibility/use-high-contrast'
import { Button } from '@/components/ui/button'
import { createLogger } from '@/lib/logger'

const logger = createLogger('HighContrastToggle')

/**
 * High contrast toggle props
 */
export interface HighContrastToggleProps {
    readonly className?: string
    readonly showLabel?: boolean
    readonly label?: string
    readonly variant?: 'button' | 'switch' | 'icon'
}

/**
 * High Contrast Toggle Component
 *
 * @example
 * ```tsx
 * <HighContrastToggle showLabel={true} variant="switch" />
 * ```
 */
export function HighContrastToggle({
    className = '',
    showLabel = false,
    label = 'High Contrast',
    variant = 'button',
}: HighContrastToggleProps): JSX.Element {
    const { isActive, toggleMode, mode } = useHighContrast()

    const handleToggle = useCallback(() => {
        toggleMode()
        logger.debug('High contrast toggled', { mode, isActive: !isActive })
    }, [toggleMode, mode, isActive])

    if (variant === 'icon') {
        return (
            <button
                type="button"
                onClick={handleToggle}
                aria-label={isActive ? 'Disable high contrast' : 'Enable high contrast'}
                aria-pressed={isActive}
                className={`high-contrast-toggle-icon ${className}`}
            >
                <span className="sr-only">{label}</span>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a15 15 0 0 0 0 20 15 15 0 0 0 0-20" />
                    <path d="M12 6a6 6 0 0 0 0 12 6 6 0 0 0 0-12" />
                </svg>
            </button>
        )
    }

    if (variant === 'switch') {
        return (
            <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
                <input
                    type="checkbox"
                    checked={isActive}
                    onChange={handleToggle}
                    className="sr-only"
                    aria-label={label}
                />
                <span
                    className={`relative inline-block w-11 h-6 rounded-full transition-colors ${isActive ? 'bg-primary' : 'bg-muted'
                        }`}
                    role="switch"
                    aria-checked={isActive}
                >
                    <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0'
                            }`}
                    />
                </span>
                {showLabel && <span className="text-sm">{label}</span>}
            </label>
        )
    }

    return (
        <Button
            type="button"
            onClick={handleToggle}
            variant={isActive ? 'primary' : 'outline'}
            aria-pressed={isActive}
            className={`high-contrast-toggle ${className}`}
        >
            {showLabel ? label : ''}
            <span className="sr-only">{isActive ? 'Disable high contrast' : 'Enable high contrast'}</span>
        </Button>
    )
}
