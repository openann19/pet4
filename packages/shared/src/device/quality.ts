/**
 * Device Quality Tier Detection
 * 
 * Determines device performance tier based on hardware capabilities.
 * Used to scale visual effects, particle counts, and GPU-intensive features.
 * 
 * Location: packages/shared/src/device/quality.ts
 */

export type QualityTier = 'low' | 'mid' | 'high'

export interface DeviceMetrics {
  memoryMB?: number
  cpuScore?: number
  gpuScore?: number
}

/**
 * Determine device quality tier based on hardware capabilities
 * 
 * @param metrics - Device hardware metrics
 * @returns Quality tier ('low', 'mid', or 'high')
 * 
 * Scoring:
 * - CPU: 1-3 based on core count
 * - GPU: 1-3 based on renderer complexity
 * - Memory: 1-3 based on GB available
 * - Total score >= 6: high, >= 3: mid, < 3: low
 * 
 * @example
 * ```typescript
 * const tier = pickTier({ memoryMB: 4096, cpuScore: 2, gpuScore: 2 })
 * // Returns 'mid' or 'high' depending on total score
 * ```
 */
export function pickTier(metrics: DeviceMetrics): QualityTier {
  const { memoryMB = 1024, cpuScore = 1, gpuScore = 1 } = metrics
  
  // Normalize memory to score (1GB = 1 point, max 3)
  const memoryScore = Math.min(3, Math.floor((memoryMB ?? 1024) / 1024))
  
  // Calculate total score
  const totalScore = (cpuScore ?? 1) + (gpuScore ?? 1) + memoryScore
  
  // Determine tier
  if (totalScore >= 6) {
    return 'high'
  }
  if (totalScore >= 3) {
    return 'mid'
  }
  return 'low'
}

/**
 * Get quality-based configuration values
 * 
 * @param tier - Quality tier
 * @returns Configuration object with tier-specific values
 */
export function getQualityConfig(tier: QualityTier): {
  maxParticles: number
  blurRadius: number
  enableBloom: boolean
  enableShadows: boolean
  shaderComplexity: 'simple' | 'medium' | 'complex'
} {
  switch (tier) {
    case 'high':
      return {
        maxParticles: 200,
        blurRadius: 16,
        enableBloom: true,
        enableShadows: true,
        shaderComplexity: 'complex'
      }
    case 'mid':
      return {
        maxParticles: 120,
        blurRadius: 12,
        enableBloom: true,
        enableShadows: true,
        shaderComplexity: 'medium'
      }
    case 'low':
      return {
        maxParticles: 60,
        blurRadius: 8,
        enableBloom: false,
        enableShadows: false,
        shaderComplexity: 'simple'
      }
  }
}

