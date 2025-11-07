import { describe, it, expect } from 'vitest'
import { ParticleEffect } from '../visual/particle-effect'

describe('ParticleEffect', () => {
  it('should be defined', () => {
    expect(ParticleEffect).toBeDefined()
  })

  it('should be a function component', () => {
    expect(typeof ParticleEffect).toBe('function')
  })
})

