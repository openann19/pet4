/**
 * Tests for Device Quality Tier Detection
 * 
 * Location: packages/shared/src/device/quality.test.ts
 */

import { describe, expect, it } from 'vitest'
import { getQualityConfig, pickTier } from './quality'

describe('pickTier', () => {
  it('should return high tier for powerful devices', () => {
    const tier = pickTier({
      memoryMB: 8192,
      cpuScore: 3,
      gpuScore: 3
    })
    
    expect(tier).toBe('high')
  })

  it('should return mid tier for moderate devices', () => {
    const tier = pickTier({
      memoryMB: 4096,
      cpuScore: 2,
      gpuScore: 1
    })
    
    expect(tier).toBe('mid')
  })

  it('should return low tier for low-end devices', () => {
    const tier = pickTier({
      memoryMB: 1024,
      cpuScore: 1,
      gpuScore: 1
    })
    
    expect(tier).toBe('low')
  })

  it('should handle missing metrics with defaults', () => {
    const tier = pickTier({})
    expect(tier).toBe('low')
  })

  it('should calculate memory score correctly', () => {
    const tier1 = pickTier({ memoryMB: 1024, cpuScore: 1, gpuScore: 1 })
    const tier2 = pickTier({ memoryMB: 2048, cpuScore: 1, gpuScore: 1 })
    const tier3 = pickTier({ memoryMB: 4096, cpuScore: 1, gpuScore: 1 })
    
    expect(tier1).toBe('low')
    expect(tier2).toBe('low')
    expect(tier3).toBe('mid')
  })
})

describe('getQualityConfig', () => {
  it('should return high tier config', () => {
    const config = getQualityConfig('high')
    
    expect(config.maxParticles).toBe(200)
    expect(config.blurRadius).toBe(16)
    expect(config.enableBloom).toBe(true)
    expect(config.enableShadows).toBe(true)
    expect(config.shaderComplexity).toBe('complex')
  })

  it('should return mid tier config', () => {
    const config = getQualityConfig('mid')
    
    expect(config.maxParticles).toBe(120)
    expect(config.blurRadius).toBe(12)
    expect(config.enableBloom).toBe(true)
    expect(config.enableShadows).toBe(true)
    expect(config.shaderComplexity).toBe('medium')
  })

  it('should return low tier config', () => {
    const config = getQualityConfig('low')
    
    expect(config.maxParticles).toBe(60)
    expect(config.blurRadius).toBe(8)
    expect(config.enableBloom).toBe(false)
    expect(config.enableShadows).toBe(false)
    expect(config.shaderComplexity).toBe('simple')
  })
})

