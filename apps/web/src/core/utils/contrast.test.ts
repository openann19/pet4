import { describe, it, expect } from 'vitest'
import {
  hexToRgb,
  getLuminance,
  getContrastRatio,
  meetsAANormal,
  meetsAALarge,
  meetsAAUI,
  getAccessibleTextColor,
  verifyButtonContrast,
} from './contrast'

describe('contrast', () => {
  describe('hexToRgb', () => {
    it('should convert hex to RGB', () => {
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 })
      expect(hexToRgb('#3B82F6')).toEqual({ r: 59, g: 130, b: 246 })
    })

    it('should handle hex without hash', () => {
      expect(hexToRgb('FFFFFF')).toEqual({ r: 255, g: 255, b: 255 })
      expect(hexToRgb('000000')).toEqual({ r: 0, g: 0, b: 0 })
    })
  })

  describe('getLuminance', () => {
    it('should calculate luminance for white', () => {
      const white = hexToRgb('#FFFFFF')
      const luminance = getLuminance(white)
      expect(luminance).toBeCloseTo(1.0, 2)
    })

    it('should calculate luminance for black', () => {
      const black = hexToRgb('#000000')
      const luminance = getLuminance(black)
      expect(luminance).toBeCloseTo(0.0, 2)
    })

    it('should calculate luminance for gray', () => {
      const gray = hexToRgb('#808080')
      const luminance = getLuminance(gray)
      expect(luminance).toBeGreaterThan(0.0)
      expect(luminance).toBeLessThan(1.0)
    })
  })

  describe('getContrastRatio', () => {
    it('should return 21:1 for white on black', () => {
      const ratio = getContrastRatio('#FFFFFF', '#000000')
      expect(ratio).toBeCloseTo(21.0, 1)
    })

    it('should return 21:1 for black on white', () => {
      const ratio = getContrastRatio('#000000', '#FFFFFF')
      expect(ratio).toBeCloseTo(21.0, 1)
    })

    it('should return 1:1 for same colors', () => {
      const ratio = getContrastRatio('#FF0000', '#FF0000')
      expect(ratio).toBeCloseTo(1.0, 2)
    })

    it('should return valid ratio for blue on white', () => {
      const ratio = getContrastRatio('#3B82F6', '#FFFFFF')
      expect(ratio).toBeGreaterThan(3.0)
      expect(ratio).toBeLessThan(21.0)
    })
  })

  describe('meetsAANormal', () => {
    it('should return true for high contrast', () => {
      expect(meetsAANormal('#000000', '#FFFFFF')).toBe(true)
      expect(meetsAANormal('#FFFFFF', '#000000')).toBe(true)
    })

    it('should return true for 4.5:1 contrast', () => {
      expect(meetsAANormal('#000000', '#FFFFFF')).toBe(true)
      expect(meetsAANormal('#1E40AF', '#FFFFFF')).toBe(true)
    })

    it('should return false for low contrast', () => {
      expect(meetsAANormal('#808080', '#808080')).toBe(false)
      expect(meetsAANormal('#CCCCCC', '#DDDDDD')).toBe(false)
    })
  })

  describe('meetsAALarge', () => {
    it('should return true for 3:1 contrast', () => {
      expect(meetsAALarge('#3B82F6', '#FFFFFF')).toBe(true)
      expect(meetsAALarge('#000000', '#FFFFFF')).toBe(true)
    })

    it('should return false for very low contrast', () => {
      expect(meetsAALarge('#808080', '#808080')).toBe(false)
    })
  })

  describe('meetsAAUI', () => {
    it('should return true for 3:1 contrast', () => {
      expect(meetsAAUI('#3B82F6', '#FFFFFF')).toBe(true)
      expect(meetsAAUI('#000000', '#FFFFFF')).toBe(true)
      expect(meetsAAUI('#475569', '#FFFFFF')).toBe(true)
    })

    it('should return false for low contrast', () => {
      expect(meetsAAUI('#808080', '#808080')).toBe(false)
    })
  })

  describe('getAccessibleTextColor', () => {
    it('should return white for dark backgrounds', () => {
      expect(getAccessibleTextColor('#000000')).toBe('#FFFFFF')
      expect(getAccessibleTextColor('#1E293B')).toBe('#FFFFFF')
    })

    it('should return black for light backgrounds', () => {
      expect(getAccessibleTextColor('#FFFFFF')).toBe('#000000')
      expect(getAccessibleTextColor('#F1F5F9')).toBe('#000000')
    })

    it('should handle custom light/dark text options', () => {
      const lightText = '#F0F0F0'
      const darkText = '#111111'
      expect(getAccessibleTextColor('#000000', lightText, darkText)).toBe(lightText)
      expect(getAccessibleTextColor('#FFFFFF', lightText, darkText)).toBe(darkText)
    })
  })

  describe('verifyButtonContrast', () => {
    it('should verify high contrast passes', () => {
      const result = verifyButtonContrast('#FFFFFF', '#000000')
      expect(result.passes).toBe(true)
      expect(result.meetsAA).toBe(true)
      expect(result.ratio).toBeGreaterThan(3.0)
    })

    it('should verify low contrast fails', () => {
      const result = verifyButtonContrast('#808080', '#808080')
      expect(result.passes).toBe(false)
      expect(result.meetsAA).toBe(false)
      expect(result.ratio).toBeCloseTo(1.0, 2)
    })

    it('should include color information in result', () => {
      const result = verifyButtonContrast('#FFFFFF', '#000000')
      expect(result.foreground).toBe('#FFFFFF')
      expect(result.background).toBe('#000000')
      expect(result.ratio).toBeGreaterThan(0)
    })
  })
})
