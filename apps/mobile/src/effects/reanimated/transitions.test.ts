/**
 * Tests for spring configuration validation
 * Ensures all spring configs comply with ultra-premium chat effects spec
 */

import { describe, expect, it } from 'vitest'
import {
    SPRING_RANGES,
    springConfigs,
    validateSpringConfig,
} from './transitions'

describe('Spring Configuration Ranges', () => {
  it('should enforce correct stiffness range', () => {
    const s = SPRING_RANGES
    expect(s.stiffnessMin).toBeGreaterThanOrEqual(200)
    expect(s.stiffnessMax).toBeLessThanOrEqual(400)
  })

  it('should enforce correct damping range', () => {
    const s = SPRING_RANGES
    expect(s.dampingMin).toBeGreaterThanOrEqual(12)
    expect(s.dampingMax).toBeLessThanOrEqual(30)
  })

  it('should enforce mass value', () => {
    const s = SPRING_RANGES
    expect(s.mass).toBe(1)
  })
})

describe('Predefined Spring Configs', () => {
  it('should validate all smooth config values', () => {
    const config = springConfigs.smooth
    const validation = validateSpringConfig(config)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('should validate all bouncy config values', () => {
    const config = springConfigs.bouncy
    const validation = validateSpringConfig(config)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('should validate all gentle config values', () => {
    const config = springConfigs.gentle
    const validation = validateSpringConfig(config)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('should validate all snappy config values', () => {
    const config = springConfigs.snappy
    const validation = validateSpringConfig(config)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('should validate all airCushion config values', () => {
    const config = springConfigs.airCushion
    const validation = validateSpringConfig(config)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('should validate all snapBack config values', () => {
    const config = springConfigs.snapBack
    const validation = validateSpringConfig(config)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })
})

describe('validateSpringConfig', () => {
  it('should accept valid config', () => {
    const config = { stiffness: 280, damping: 20, mass: 1 }
    const result = validateSpringConfig(config)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should reject stiffness below minimum', () => {
    const config = { stiffness: 150, damping: 20, mass: 1 }
    const result = validateSpringConfig(config)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors.some((e) => e.includes('below minimum'))).toBe(true)
  })

  it('should reject stiffness above maximum', () => {
    const config = { stiffness: 500, damping: 20, mass: 1 }
    const result = validateSpringConfig(config)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors.some((e) => e.includes('above maximum'))).toBe(true)
  })

  it('should reject damping below minimum', () => {
    const config = { stiffness: 280, damping: 5, mass: 1 }
    const result = validateSpringConfig(config)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors.some((e) => e.includes('below minimum'))).toBe(true)
  })

  it('should reject damping above maximum', () => {
    const config = { stiffness: 280, damping: 50, mass: 1 }
    const result = validateSpringConfig(config)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors.some((e) => e.includes('above maximum'))).toBe(true)
  })

  it('should reject incorrect mass', () => {
    const config = { stiffness: 280, damping: 20, mass: 0.5 }
    const result = validateSpringConfig(config)
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors.some((e) => e.includes('Mass'))).toBe(true)
  })

  it('should accept partial configs', () => {
    const config = { stiffness: 280 }
    const result = validateSpringConfig(config)
    expect(result.valid).toBe(true)
  })
})

