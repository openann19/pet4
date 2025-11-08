'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'

export interface SliderProps {
  value: number | number[]
  onValueChange?: (value: number | number[]) => void
  onValueChangeEnd?: (value: number | number[]) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-valuetext'?: string
}

interface SliderState {
  isDragging: boolean
  activeThumb: number | null
  startX: number
  startValue: number | number[]
}

const DEFAULT_DURATION = 200
const SPRING_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function roundToStep(value: number, step: number, min: number): number {
  if (step <= 0) return value
  return Math.round((value - min) / step) * step + min
}

function getPercentage(value: number, min: number, max: number): number {
  if (max === min) return 0
  return ((value - min) / (max - min)) * 100
}

function getValueFromPercentage(
  percentage: number,
  min: number,
  max: number,
  step: number
): number {
  const rawValue = min + (percentage / 100) * (max - min)
  return step > 0 ? roundToStep(rawValue, step, min) : rawValue
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    if (typeof window.matchMedia !== 'function') return false
    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      return mediaQuery.matches
    } catch {
      return false
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (typeof window.matchMedia !== 'function') return

    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      if (!mediaQuery) {
        return
      }

      const handleChange = (event: Event): void => {
        const mediaEvent = event as MediaQueryListEvent
        setReduced(mediaEvent.matches)
      }

      if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', handleChange)
        return () => {
          if (mediaQuery && typeof mediaQuery.removeEventListener === 'function') {
            mediaQuery.removeEventListener('change', handleChange)
          }
        }
      }
    } catch {
      // Fallback for browsers that don't support matchMedia or test environments
    }

    return undefined
  }, [])

  return reduced
}

export function Slider({
  value,
  onValueChange,
  onValueChangeEnd,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-valuetext': ariaValueText,
}: SliderProps): JSX.Element {
  const reducedMotion = useReducedMotion()
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<SliderState>({
    isDragging: false,
    activeThumb: null,
    startX: 0,
    startValue: value,
  })

  const isRange = Array.isArray(value)
  const currentValues = isRange ? value : [value]
  const minValue = isRange ? Math.min(...currentValues) : (value as number)
  const maxValue = isRange ? Math.max(...currentValues) : (value as number)

  const getSliderRect = useCallback((): DOMRect | null => {
    return containerRef.current?.getBoundingClientRect() ?? null
  }, [])

  const getValueFromEvent = useCallback(
    (clientX: number): number => {
      const rect = getSliderRect()
      if (!rect) return min

      const percentage = clamp(((clientX - rect.left) / rect.width) * 100, 0, 100)
      return getValueFromPercentage(percentage, min, max, step)
    },
    [min, max, step, getSliderRect]
  )

  const updateValue = useCallback(
    (newValue: number, thumbIndex: number): void => {
      if (disabled) return

      const clampedValue = clamp(newValue, min, max)
      const steppedValue = step > 0 ? roundToStep(clampedValue, step, min) : clampedValue

      if (isRange) {
        const values = [...(value as number[])]
        values[thumbIndex] = steppedValue

        if (thumbIndex === 0 && values[0]! > values[1]!) {
          values[0] = values[1]!
        } else if (thumbIndex === 1 && values[1]! < values[0]!) {
          values[1] = values[0]!
        }

        const sortedValues = [
          Math.min(values[0]!, values[1]!),
          Math.max(values[0]!, values[1]!),
        ] as [number, number]
        onValueChange?.(sortedValues)
      } else {
        onValueChange?.(steppedValue)
      }
    },
    [disabled, min, max, step, isRange, value, onValueChange]
  )

  const handleStart = useCallback(
    (clientX: number, thumbIndex: number): void => {
      if (disabled) return

      setState({
        isDragging: true,
        activeThumb: thumbIndex,
        startX: clientX,
        startValue: value,
      })
    },
    [disabled, value]
  )

  const handleMove = useCallback(
    (clientX: number): void => {
      if (!state.isDragging || state.activeThumb === null || disabled) return

      const newValue = getValueFromEvent(clientX)
      updateValue(newValue, state.activeThumb)
    },
    [state.isDragging, state.activeThumb, disabled, getValueFromEvent, updateValue]
  )

  const handleEnd = useCallback((): void => {
    if (!state.isDragging) return

    setState(() => ({
      isDragging: false,
      activeThumb: null,
      startX: 0,
      startValue: value,
    }))

    onValueChangeEnd?.(value)
  }, [state.isDragging, value, onValueChangeEnd])

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>, thumbIndex: number): void => {
      event.preventDefault()
      event.stopPropagation()
      handleStart(event.clientX, thumbIndex)
    },
    [handleStart]
  )

  const handleTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>, thumbIndex: number): void => {
      event.preventDefault()
      event.stopPropagation()
      const touch = event.touches[0]
      if (touch) {
        handleStart(touch.clientX, thumbIndex)
      }
    },
    [handleStart]
  )

  useEffect(() => {
    if (!state.isDragging) return
    if (typeof document === 'undefined') return

    const handleMouseMove = (event: Event): void => {
      const mouseEvent = event as MouseEvent
      mouseEvent.preventDefault()
      handleMove(mouseEvent.clientX)
    }

    const handleTouchMove = (event: Event): void => {
      const touchEvent = event as TouchEvent
      touchEvent.preventDefault()
      const touch = touchEvent.touches[0]
      if (touch) {
        handleMove(touch.clientX)
      }
    }

    const handleMouseUp = (): void => {
      handleEnd()
    }

    const handleTouchEnd = (): void => {
      handleEnd()
    }

    document.addEventListener('mousemove', handleMouseMove, { passive: false })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('touchend', handleTouchEnd)
    document.addEventListener('touchcancel', handleTouchEnd)

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchend', handleTouchEnd)
        document.removeEventListener('touchcancel', handleTouchEnd)
      }
    }
  }, [state.isDragging, handleMove, handleEnd])

  const handleTrackClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      if (disabled || state.isDragging) return

      event.stopPropagation()
      const newValue = getValueFromEvent(event.clientX)

      if (isRange) {
        const values = value as number[]
        const distanceToMin = Math.abs(newValue - values[0]!)
        const distanceToMax = Math.abs(newValue - values[1]!)
        const thumbIndex = distanceToMin < distanceToMax ? 0 : 1
        updateValue(newValue, thumbIndex)
      } else {
        updateValue(newValue, 0)
      }
    },
    [disabled, state.isDragging, getValueFromEvent, isRange, value, updateValue]
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, thumbIndex: number): void => {
      if (disabled) return

      const currentValue = isRange ? (value as number[])[thumbIndex]! : (value as number)
      let newValue = currentValue

      switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowDown':
          event.preventDefault()
          newValue = currentValue - step
          break
        case 'ArrowRight':
        case 'ArrowUp':
          event.preventDefault()
          newValue = currentValue + step
          break
        case 'Home':
          event.preventDefault()
          newValue = min
          break
        case 'End':
          event.preventDefault()
          newValue = max
          break
        case 'PageDown':
          event.preventDefault()
          newValue = currentValue - step * 10
          break
        case 'PageUp':
          event.preventDefault()
          newValue = currentValue + step * 10
          break
        default:
          return
      }

      updateValue(newValue, thumbIndex)
    },
    [disabled, isRange, value, step, min, max, updateValue]
  )

  const trackProgress = getPercentage(isRange ? minValue : (value as number), min, max)
  const thumbPosition = getPercentage(isRange ? maxValue : (value as number), min, max)
  const minThumbPosition = isRange ? getPercentage(minValue, min, max) : 0

  const animationDuration = reducedMotion ? 0 : DEFAULT_DURATION
  const transition = reducedMotion ? 'none' : `all ${animationDuration}ms ${SPRING_EASING}`

  const getAriaValueText = (): string => {
    if (ariaValueText) return ariaValueText
    if (isRange) {
      return `${minValue} to ${maxValue}`
    }
    return String(value)
  }

  const getAriaLabel = (): string | undefined => {
    if (ariaLabel) return ariaLabel
    if (ariaLabelledBy) return undefined
    return 'Slider'
  }

  const containerClasses =
    `slider-container ${disabled ? 'slider-disabled' : ''} ${className}`.trim()
  const trackClasses = 'slider-track'
  const fillClasses = 'slider-fill'
  const thumbClasses = 'slider-thumb'

  const minThumbScale = state.isDragging && state.activeThumb === 0 ? 1.15 : 1
  const maxThumbScale = state.isDragging && state.activeThumb === (isRange ? 1 : 0) ? 1.15 : 1

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      role={isRange ? undefined : 'slider'}
      aria-label={!isRange ? getAriaLabel() : undefined}
      aria-labelledby={!isRange ? ariaLabelledBy : undefined}
      aria-valuemin={!isRange ? min : undefined}
      aria-valuemax={!isRange ? max : undefined}
      aria-valuenow={!isRange ? (value as number) : undefined}
      aria-valuetext={!isRange ? getAriaValueText() : undefined}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={!isRange ? e => handleKeyDown(e, 0) : undefined}
      style={{
        position: 'relative',
        width: '100%',
        height: '24px',
        touchAction: 'none',
        userSelect: 'none',
        cursor: disabled ? 'not-allowed' : 'default',
        padding: '2px 0',
      }}
    >
      <div
        className={trackClasses}
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: '4px',
          transform: 'translateY(-50%)',
          backgroundColor: disabled ? '#e0e0e0' : '#e0e0e0',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
        onClick={handleTrackClick}
      >
        <div
          className={fillClasses}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${clamp(trackProgress, 0, 100)}%`,
            backgroundColor: disabled ? '#bdbdbd' : '#007bff',
            borderRadius: '2px',
            transition,
          }}
        />
        {isRange && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: `${clamp(minThumbPosition, 0, 100)}%`,
              width: `${clamp(thumbPosition - minThumbPosition, 0, 100)}%`,
              height: '100%',
              backgroundColor: disabled ? '#bdbdbd' : '#007bff',
              borderRadius: '2px',
              transition,
            }}
          />
        )}
      </div>

      {isRange && (
        <div
          className={`${thumbClasses} slider-thumb-min`}
          style={{
            position: 'absolute',
            top: '50%',
            left: `${clamp(minThumbPosition, 0, 100)}%`,
            width: '20px',
            height: '20px',
            transform: `translate(-50%, -50%) scale(${minThumbScale})`,
            backgroundColor: disabled ? '#bdbdbd' : '#007bff',
            borderRadius: '50%',
            cursor: disabled
              ? 'not-allowed'
              : state.isDragging && state.activeThumb === 0
                ? 'grabbing'
                : 'grab',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            transition,
            zIndex: state.activeThumb === 0 ? 2 : 1,
            outline: 'none',
          }}
          onMouseDown={e => handleMouseDown(e, 0)}
          onTouchStart={e => handleTouchStart(e, 0)}
          onKeyDown={e => handleKeyDown(e, 0)}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={minValue}
          aria-valuetext={String(minValue)}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
        />
      )}

      <div
        className={`${thumbClasses} ${isRange ? 'slider-thumb-max' : ''}`}
        style={{
          position: 'absolute',
          top: '50%',
          left: `${clamp(thumbPosition, 0, 100)}%`,
          width: '20px',
          height: '20px',
          transform: `translate(-50%, -50%) scale(${maxThumbScale})`,
          backgroundColor: disabled ? '#bdbdbd' : '#007bff',
          borderRadius: '50%',
          cursor: disabled
            ? 'not-allowed'
            : state.isDragging && state.activeThumb === (isRange ? 1 : 0)
              ? 'grabbing'
              : 'grab',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          transition,
          zIndex: state.activeThumb === (isRange ? 1 : 0) ? 2 : 1,
          outline: 'none',
        }}
        onMouseDown={e => handleMouseDown(e, isRange ? 1 : 0)}
        onTouchStart={e => handleTouchStart(e, isRange ? 1 : 0)}
        onKeyDown={isRange ? e => handleKeyDown(e, 1) : e => handleKeyDown(e, 0)}
        role={isRange ? 'slider' : undefined}
        aria-valuemin={isRange ? min : undefined}
        aria-valuemax={isRange ? max : undefined}
        aria-valuenow={isRange ? maxValue : undefined}
        aria-valuetext={isRange ? String(maxValue) : undefined}
        aria-disabled={isRange ? disabled : undefined}
        tabIndex={disabled ? -1 : 0}
      />
    </div>
  )
}
