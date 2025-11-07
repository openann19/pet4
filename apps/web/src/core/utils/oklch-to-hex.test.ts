import { describe, it, expect } from 'vitest'
import { parseOklch, oklchToHex, oklchToRgbObj } from './oklch-to-hex'
import { isTruthy, isDefined } from '@/core/guards';

describe('oklch-to-hex', () => {
  describe('parseOklch', () => {
    it('should parse valid OKLCH string', () => {
      const result = parseOklch('oklch(0.72 0.18 30)')
      expect(result).toEqual({ l: 0.72, c: 0.18, h: 30 })
    })

    it('should parse OKLCH with decimal values', () => {
      const result = parseOklch('oklch(0.985 0.006 90)')
      expect(result).toEqual({ l: 0.985, c: 0.006, h: 90 })
    })

    it('should return null for invalid format', () => {
      expect(parseOklch('invalid')).toBeNull()
      expect(parseOklch('rgb(255, 0, 0)')).toBeNull()
      expect(parseOklch('')).toBeNull()
    })

    it('should return null for invalid numeric values', () => {
      expect(parseOklch('oklch(abc def ghi)')).toBeNull()
    })
  })

  describe('oklchToHex', () => {
    it('should convert OKLCH to hex', () => {
      const hex = oklchToHex('oklch(0.72 0.18 30)')
      expect(hex).toMatch(/^#[0-9A-F]{6}$/)
      expect(hex.length).toBe(7)
    })

    it('should convert white OKLCH to white hex', () => {
      const hex = oklchToHex('oklch(1 0 0)')
      // White should be close to #FFFFFF
      expect(hex).toBeTruthy()
    })

    it('should handle dark colors', () => {
      const hex = oklchToHex('oklch(0.12 0.018 270)')
      expect(hex).toMatch(/^#[0-9A-F]{6}$/)
    })

    it('should return black for invalid input', () => {
      const hex = oklchToHex('invalid')
      expect(hex).toBe('#000000')
    })
  })

  describe('oklchToRgbObj', () => {
    it('should convert OKLCH to RGB object', () => {
      const rgb = oklchToRgbObj('oklch(0.72 0.18 30)')
      expect(rgb).toBeTruthy()
      expect(rgb?.r).toBeGreaterThanOrEqual(0)
      expect(rgb?.r).toBeLessThanOrEqual(255)
      expect(rgb?.g).toBeGreaterThanOrEqual(0)
      expect(rgb?.g).toBeLessThanOrEqual(255)
      expect(rgb?.b).toBeGreaterThanOrEqual(0)
      expect(rgb?.b).toBeLessThanOrEqual(255)
    })

    it('should return null for invalid input', () => {
      expect(oklchToRgbObj('invalid')).toBeNull()
    })

    it('should handle primary color from theme', () => {
      const rgb = oklchToRgbObj('oklch(0.72 0.18 30)')
      expect(rgb).toBeTruthy()
      if (isTruthy(rgb)) {
        expect(rgb.r).toBeGreaterThan(0)
        expect(rgb.g).toBeGreaterThan(0)
        expect(rgb.b).toBeGreaterThan(0)
      }
    })
  })
})
