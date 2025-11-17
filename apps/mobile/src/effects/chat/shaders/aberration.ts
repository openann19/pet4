/**
 * Chromatic Aberration Shader for Chat Effects
 *
 * Creates subtle RGB separation effect for send warp trail.
 * Shifts red/blue channels slightly for a chromatic aberration effect.
 *
 * Location: apps/mobile/src/effects/chat/shaders/aberration.ts
 */

import { Skia, type SkShader } from '@shopify/react-native-skia'
import { createLogger } from '../../../utils/logger'
import { isTruthy } from '@petspark/shared';

const logger = createLogger('aberration-shader')

/**
 * Chromatic aberration configuration
 */
export interface AberrationConfig {
  amount: number // aberration amount in pixels (typically 0.5-2px)
  intensity: number // intensity multiplier (0-1)
}

/**
 * Default aberration configuration
 */
const DEFAULT_ABERRATION_CONFIG: AberrationConfig = {
  amount: 1.0, // 1px shift
  intensity: 0.3, // subtle effect
}

/**
 * Create a chromatic aberration shader
 *
 * Chromatic aberration shifts red and blue channels in opposite directions
 * creating a subtle color separation effect
 *
 * @param config - Aberration configuration
 * @returns Aberration shader
 */
export function createAberrationShader(config: Partial<AberrationConfig> = {}): SkShader {
  const finalConfig = { ...DEFAULT_ABERRATION_CONFIG, ...config }

  // Validate config
  if (finalConfig.amount < 0) {
    logger.warn('Invalid aberration amount, clamping to 0+', { amount: finalConfig.amount })
    finalConfig.amount = Math.max(0, finalConfig.amount)
  }

  if (finalConfig.intensity < 0 || finalConfig.intensity > 1) {
    logger.warn('Invalid aberration intensity, clamping to 0-1', {
      intensity: finalConfig.intensity,
    })
    finalConfig.intensity = Math.max(0, Math.min(1, finalConfig.intensity))
  }

  // Chromatic aberration shader source
  // This shifts RGB channels slightly
  const shaderSource = `
    uniform float uAmount;
    uniform float uIntensity;
    
    vec4 aberration(vec2 uv, sampler2D tex) {
      vec2 offset = (uv - 0.5) * uAmount * uIntensity;
      
      // Sample channels with slight offsets
      float r = texture2D(tex, uv + offset).r;
      float g = texture2D(tex, uv).g;
      float b = texture2D(tex, uv - offset).b;
      
      // Get original alpha
      float a = texture2D(tex, uv).a;
      
      return vec4(r, g, b, a);
    }
  `

  logger.debug('Aberration shader created', finalConfig)

  // Create a runtime effect shader using Skia.RuntimeEffect
  // This compiles the shader source and applies the aberration configuration

  try {
    const runtimeEffect = Skia.RuntimeEffect.Make(shaderSource)

    if (runtimeEffect) {
      const shader = runtimeEffect.makeShader([finalConfig.amount, finalConfig.intensity])

      if (shader) {
        return shader
      }
    }
  } catch (error) {
    logger.warn(
      'Failed to create aberration runtime effect, using fallback',
      error instanceof Error ? error : new Error(String(error))
    )
  }

  // Fallback: return a color shader
  return Skia.Shader.MakeColor(Skia.Color('white'))
}

/**
 * Get aberration shader configuration
 * Returns values for use in ImageFilter or custom shader
 */
export function getAberrationConfig(config: Partial<AberrationConfig> = {}): AberrationConfig {
  return { ...DEFAULT_ABERRATION_CONFIG, ...config }
}

/**
 * Apply chromatic aberration to coordinates
 *
 * Used to calculate UV offsets for shader sampling
 */
export function calculateAberrationOffset(
  uv: { x: number; y: number },
  amount: number,
  intensity: number
): {
  r: { x: number; y: number }
  g: { x: number; y: number }
  b: { x: number; y: number }
} {
  const centerX = 0.5

  const offsetX = (uv.x - centerX) * amount * intensity

  return {
    r: { x: uv.x + offsetX, y: uv.y },
    g: { x: uv.x, y: uv.y },
    b: { x: uv.x - offsetX, y: uv.y },
  }
}
