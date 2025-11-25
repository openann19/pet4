/**
 * Core Animation Hooks
 * Platform-agnostic hooks for animation management - Web Implementation
 */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useMotionValue, type MotionValue } from 'framer-motion'

import type { ReducedMotionConfig } from './types'
import { performanceBudgets } from './constants'

/**
 * Hook to track reduced motion preference
 */
export function useReducedMotion(): MotionValue<boolean> {
  const isReducedMotion = useMotionValue(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      // Server-side or unsupported environment
      isReducedMotion.set(false)
      return undefined
    }

    try {
      // Check CSS media query for reduced motion preference
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      isReducedMotion.set(mediaQuery.matches)

      // Listen for changes
      const handleChange = ((event: unknown) => {
        const mqEvent = event as MediaQueryListEvent
        isReducedMotion.set(mqEvent.matches)
      }) as EventListener

      // Use modern API
      mediaQuery.addEventListener?.('change', handleChange)

      return () => {
        mediaQuery.removeEventListener?.('change', handleChange)
      }
    } catch (_err) {
      // Fail gracefully, assume reduced motion is disabled
      isReducedMotion.set(false)
      return undefined
    }
  }, [isReducedMotion])

  return isReducedMotion
}

/**
 * Hook to track animation performance metrics
 */
export function useAnimationPerformance() {
  const frameDrops = useMotionValue(0)
  const currentFPS = useMotionValue(0)

  const reset = useCallback(() => {
    frameDrops.set(0)
    currentFPS.set(0)
  }, [frameDrops, currentFPS])

  const recordFrameDrop = useCallback(() => {
    frameDrops.set(frameDrops.get() + 1)
  }, [frameDrops])

  const updateFPS = useCallback(
    (fps: number) => {
      currentFPS.set(fps)
    },
    [currentFPS]
  )

  const metrics = useMemo(
    () => ({
      frameDrops,
      currentFPS,
      isPerformant:
        currentFPS.get() >= performanceBudgets.targetFPS * (1 - performanceBudgets.dropThreshold),
      dropRate: frameDrops.get() / performanceBudgets.targetFPS,
    }),
    [frameDrops, currentFPS]
  )

  return {
    metrics,
    reset,
    recordFrameDrop,
    updateFPS,
  }
}

/**
 * Hook to manage animation complexity budgets
 */
export function useAnimationBudget() {
  const activeComplexAnimations = useMotionValue(0)
  const activeParticles = useMotionValue(0)

  const incrementComplexAnimations = useCallback(() => {
    activeComplexAnimations.set(activeComplexAnimations.get() + 1)
  }, [activeComplexAnimations])

  const decrementComplexAnimations = useCallback(() => {
    activeComplexAnimations.set(Math.max(0, activeComplexAnimations.get() - 1))
  }, [activeComplexAnimations])

  const updateParticleCount = useCallback(
    (count: number) => {
      activeParticles.set(count)
    },
    [activeParticles]
  )

  const canAddComplexAnimation = useCallback(() => {
    return activeComplexAnimations.get() < performanceBudgets.complexityBudget
  }, [activeComplexAnimations])

  const canAddParticles = useCallback(
    (count: number) => {
      return activeParticles.get() + count <= performanceBudgets.particleBudget
    },
    [activeParticles]
  )

  return {
    metrics: {
      activeComplexAnimations,
      activeParticles,
      complexityBudgetAvailable:
        performanceBudgets.complexityBudget - activeComplexAnimations.get(),
      particleBudgetAvailable: performanceBudgets.particleBudget - activeParticles.get(),
    },
    incrementComplexAnimations,
    decrementComplexAnimations,
    updateParticleCount,
    canAddComplexAnimation,
    canAddParticles,
  }
}

/**
 * Hook to manage animation configuration based on platform and preferences
 */
export function useAnimationConfig() {
  const isReducedMotion = useReducedMotion()
  const { metrics: perfMetrics } = useAnimationPerformance()
  const { metrics: budgetMetrics } = useAnimationBudget()

  // Use state to track the current reduced motion value
  const [reducedMotionState, setReducedMotionState] = useState(false)

  useEffect(() => {
    const unsubscribe = isReducedMotion.on('change', value => {
      setReducedMotionState(value)
    })

    // Set initial value
    setReducedMotionState(isReducedMotion.get())

    return unsubscribe
  }, [isReducedMotion])

  // Compute animation configuration based on current state
  const config: ReducedMotionConfig = useMemo(
    () => ({
      enabled: reducedMotionState,
      durationMultiplier: reducedMotionState ? 0.5 : 1,
      disableSpringPhysics: reducedMotionState || !perfMetrics.isPerformant,
      simplifyEffects:
        reducedMotionState ||
        !perfMetrics.isPerformant ||
        budgetMetrics.activeComplexAnimations.get() >= performanceBudgets.complexityBudget,
    }),
    [reducedMotionState, perfMetrics.isPerformant, budgetMetrics.activeComplexAnimations]
  )

  return config
}
