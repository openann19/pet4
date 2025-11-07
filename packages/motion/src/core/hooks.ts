/**
 * Core Animation Hooks
 * Platform-agnostic hooks for animation management
 */

import { useCallback, useEffect, useMemo } from 'react'
import { useSharedValue, type SharedValue } from 'react-native-reanimated'
import { AccessibilityInfo, Platform } from 'react-native'

import type { ReducedMotionConfig } from './types'
import { performanceBudgets } from './constants'

/**
 * Hook to track reduced motion preference
 */
export function useReducedMotion(): SharedValue<boolean> {
  const isReducedMotion = useSharedValue(false)
  
  useEffect(() => {
    const checkReducedMotion = async () => {
      try {
        const reducedMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled()
        isReducedMotion.value = reducedMotionEnabled
      } catch (err) {
        // Fail gracefully, assume reduced motion is disabled
        isReducedMotion.value = false 
      }
    }
    
    // Initial check
    checkReducedMotion()
    
    // Subscribe to changes
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        isReducedMotion.value = enabled
      }
    )
    
    return () => {
      subscription.remove()
    }
  }, [isReducedMotion])
  
  return isReducedMotion
}

/**
 * Hook to track animation performance metrics
 */
export function useAnimationPerformance() {
  const frameDrops = useSharedValue(0)
  const currentFPS = useSharedValue(0)
  
  const reset = useCallback(() => {
    frameDrops.value = 0
    currentFPS.value = 0
  }, [frameDrops, currentFPS])
  
  const recordFrameDrop = useCallback(() => {
    frameDrops.value += 1
  }, [frameDrops])
  
  const updateFPS = useCallback((fps: number) => {
    currentFPS.value = fps
  }, [currentFPS])
  
  const metrics = useMemo(() => ({
    frameDrops,
    currentFPS,
    isPerformant: currentFPS.value >= performanceBudgets.targetFPS * (1 - performanceBudgets.dropThreshold),
    dropRate: frameDrops.value / performanceBudgets.targetFPS,
  }), [frameDrops, currentFPS])
  
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
  const activeComplexAnimations = useSharedValue(0)
  const activeParticles = useSharedValue(0)
  
  const incrementComplexAnimations = useCallback(() => {
    activeComplexAnimations.value += 1
  }, [activeComplexAnimations])
  
  const decrementComplexAnimations = useCallback(() => {
    activeComplexAnimations.value = Math.max(0, activeComplexAnimations.value - 1)
  }, [activeComplexAnimations])
  
  const updateParticleCount = useCallback((count: number) => {
    activeParticles.value = count
  }, [activeParticles])
  
  const canAddComplexAnimation = useCallback(() => {
    return activeComplexAnimations.value < performanceBudgets.complexityBudget
  }, [activeComplexAnimations])
  
  const canAddParticles = useCallback((count: number) => {
    return (activeParticles.value + count) <= performanceBudgets.particleBudget
  }, [activeParticles])
  
  return {
    metrics: {
      activeComplexAnimations,
      activeParticles,
      complexityBudgetAvailable: performanceBudgets.complexityBudget - activeComplexAnimations.value,
      particleBudgetAvailable: performanceBudgets.particleBudget - activeParticles.value,
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
  
  // Compute animation configuration based on current state
  const config: ReducedMotionConfig = useMemo(() => ({
    enabled: isReducedMotion.value,
    durationMultiplier: isReducedMotion.value ? 0.5 : 1,
    disableSpringPhysics: isReducedMotion.value || !perfMetrics.isPerformant,
    simplifyEffects: isReducedMotion.value || !perfMetrics.isPerformant || budgetMetrics.activeComplexAnimations.value >= performanceBudgets.complexityBudget,
  }), [
    isReducedMotion.value,
    perfMetrics.isPerformant,
    budgetMetrics.activeComplexAnimations.value
  ])
  
  return config
}