/**
 * OKLCH to Hex Converter
 * 
 * Converts OKLCH color format to hex for CSS variables
 */

/**
 * Convert OKLCH to RGB
 */
function oklchToRgb(l: number, c: number, h: number): { r: number; g: number; b: number } {
  // Convert OKLCH to linear RGB via Lab
  const a = c * Math.cos((h * Math.PI) / 180)
  const bValue = c * Math.sin((h * Math.PI) / 180)

  // Convert OKLab to linear RGB
  const l_ = l + 0.3963377774 * a + 0.2158037573 * bValue
  const m_ = l - 0.1055613458 * a - 0.0638541728 * bValue
  const s_ = l - 0.0894841775 * a - 1.291485548 * bValue

  const l2 = l_ * l_ * l_
  const m2 = m_ * m_ * m_
  const s2 = s_ * s_ * s_

  const r =
    +4.0767416621 * l2 - 3.3077115913 * m2 + 0.2309699292 * s2
  const g =
    -1.2684380046 * l2 + 2.6097574011 * m2 - 0.3413193965 * s2
  const bl =
    -0.0041960863 * l2 - 0.7034186147 * m2 + 1.707614701 * s2

  // Apply gamma correction
  return {
    r: Math.max(0, Math.min(255, Math.round(255 * (r <= 0.0031308 ? 12.92 * r : 1.055 * Math.pow(r, 1 / 2.4) - 0.055)))),
    g: Math.max(0, Math.min(255, Math.round(255 * (g <= 0.0031308 ? 12.92 * g : 1.055 * Math.pow(g, 1 / 2.4) - 0.055)))),
    b: Math.max(0, Math.min(255, Math.round(255 * (bl <= 0.0031308 ? 12.92 * bl : 1.055 * Math.pow(bl, 1 / 2.4) - 0.055)))),
  }
}

/**
 * Parse OKLCH string (e.g., "oklch(0.72 0.18 30)")
 */
export function parseOklch(oklch: string): { l: number; c: number; h: number } | null {
  const match = oklch.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)\)/)
  if (!match || !match[1] || !match[2] || !match[3]) return null

  const l = parseFloat(match[1])
  const c = parseFloat(match[2])
  const h = parseFloat(match[3])

  if (isNaN(l) || isNaN(c) || isNaN(h)) return null

  return { l, c, h }
}

/**
 * Convert OKLCH string to hex
 */
export function oklchToHex(oklch: string): string {
  const parsed = parseOklch(oklch)
  if (!parsed) return '#000000'

  const rgb = oklchToRgb(parsed.l, parsed.c, parsed.h)
  return `#${String([rgb.r, rgb.g, rgb.b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase() ?? '')}`
}

/**
 * Convert OKLCH string to RGB object
 */
export function oklchToRgbObj(oklch: string): { r: number; g: number; b: number } | null {
  const parsed = parseOklch(oklch)
  if (!parsed) return null

  return oklchToRgb(parsed.l, parsed.c, parsed.h)
}
