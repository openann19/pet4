/**
 * Ribbon Shader for Swipe-to-Reply Effect
 *
 * GPU-accelerated ribbon effect with RuntimeEffect shader for reply/quote tethers.
 * Also includes utility functions for path-based ribbon rendering (backwards compatibility).
 *
 * Location: apps/mobile/src/effects/chat/shaders/ribbon.ts
 */

import {
  Canvas,
  Paint,
  Rect,
  Shader,
  Skia,
  type SkPaint,
  type SkPath,
} from '@shopify/react-native-skia'
import React, { useMemo, useState } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import { useAnimatedReaction } from '@petspark/motion'
import { createLogger } from '../../../utils/logger'
import { isTruthy } from '@petspark/shared';

const logger = createLogger('ribbon-shader')

/**
 * Ribbon point along the path
 */
export interface RibbonPoint {
  x: number
  y: number
  width: number // ribbon width at this point
  opacity: number // opacity at this point
}

/**
 * Ribbon configuration
 */
export interface RibbonConfig {
  width: number // base ribbon width
  color: string // ribbon color
  opacity: number // base opacity
  curveTension: number // curve tension (0-1)
}

/**
 * Default ribbon configuration
 */
const DEFAULT_RIBBON_CONFIG: RibbonConfig = {
  width: 4,
  color: '#3B82F6', // blue
  opacity: 0.8,
  curveTension: 0.5,
}

/**
 * Create a ribbon path from points
 *
 * Creates a smooth curved path through the points using cubic bezier
 *
 * @param points - Array of points along the ribbon path
 * @param config - Ribbon configuration
 * @returns Skia path
 */
export function createRibbonPath(
  points: Array<{ x: number; y: number }>,
  config: Partial<RibbonConfig> = {}
): SkPath {
  const finalConfig = { ...DEFAULT_RIBBON_CONFIG, ...config }

  if (points.length < 2) {
    throw new Error('Ribbon path requires at least 2 points')
  }

  const path = Skia.Path.Make()

  // Start at first point
  const firstPoint = points[0]
  if (!firstPoint) {
    throw new Error('Ribbon path requires at least one point')
  }
  path.moveTo(firstPoint.x, firstPoint.y)

  // Create smooth curve through points using cubic bezier
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]

    if (!prev || !curr) {
      continue
    }

    if (i === 1) {
      // First segment: use next point for control
      const cp1x = prev.x + (curr.x - prev.x) * finalConfig.curveTension
      const cp1y = prev.y + (curr.y - prev.y) * finalConfig.curveTension

      if (next) {
        const cp2x = curr.x - (next.x - curr.x) * finalConfig.curveTension
        const cp2y = curr.y - (next.y - curr.y) * finalConfig.curveTension
        path.cubicTo(cp1x, cp1y, cp2x, cp2y, curr.x, curr.y)
      } else {
        path.lineTo(curr.x, curr.y)
      }
    } else if (isTruthy(next)) {
      // Middle segments: use prev and next for control points
      const cp1x = prev.x + (curr.x - prev.x) * finalConfig.curveTension
      const cp1y = prev.y + (curr.y - prev.y) * finalConfig.curveTension
      const cp2x = curr.x - (next.x - curr.x) * finalConfig.curveTension
      const cp2y = curr.y - (next.y - curr.y) * finalConfig.curveTension
      path.cubicTo(cp1x, cp1y, cp2x, cp2y, curr.x, curr.y)
    } else {
      // Last segment: use prev point for control
      const cp1x = prev.x + (curr.x - prev.x) * finalConfig.curveTension
      const cp1y = prev.y + (curr.y - prev.y) * finalConfig.curveTension
      path.quadTo(cp1x, cp1y, curr.x, curr.y)
    }
  }

  logger.debug('Ribbon path created', {
    pointCount: points.length,
    width: finalConfig.width,
    color: finalConfig.color,
  })

  return path
}

/**
 * Create ribbon paint
 *
 * Creates a Skia paint configured for ribbon rendering
 */
export function createRibbonPaint(config: Partial<RibbonConfig> = {}): SkPaint {
  const finalConfig = { ...DEFAULT_RIBBON_CONFIG, ...config }

  const paint = Skia.Paint()
  paint.setColor(Skia.Color(finalConfig.color))
  paint.setStrokeWidth(finalConfig.width)
  paint.setStyle(1) // Stroke style (1 = Stroke)
  paint.setStrokeCap(1) // Round cap (1 = Round)
  paint.setStrokeJoin(1) // Round join (1 = Round)
  paint.setAlphaf(finalConfig.opacity)

  return paint
}

/**
 * Animate ribbon path following gesture
 *
 * Creates a path that follows finger movement with trailing effect
 */
export function createAnimatedRibbonPath(
  gesturePoints: Array<{ x: number; y: number; timestamp: number }>,
  currentTime: number,
  trailDuration: number = 180, // 180ms trail
  config: Partial<RibbonConfig> = {}
): SkPath {
  const finalConfig = { ...DEFAULT_RIBBON_CONFIG, ...config }

  // Filter points within trail duration
  const cutoffTime = currentTime - trailDuration
  const activePoints = gesturePoints.filter(p => p.timestamp >= cutoffTime)

  if (activePoints.length < 2) {
    // Return empty path if not enough points
    return Skia.Path.Make()
  }

  // Convert to points for path creation
  const points = activePoints.map(p => ({ x: p.x, y: p.y }))

  // Create path with varying width based on age
  const path = createRibbonPath(points, finalConfig)

  logger.debug('Animated ribbon path created', {
    pointCount: activePoints.length,
    trailDuration,
    currentTime,
  })

  return path
}

/**
 * Get ribbon configuration
 */
export function getRibbonConfig(config: Partial<RibbonConfig> = {}): RibbonConfig {
  return { ...DEFAULT_RIBBON_CONFIG, ...config }
}

/**
 * SkSL: Reply Ribbon
 * Draws a soft glowing band along segment (p0->p1).
 * Uniforms:
 *  - resolution: vec2
 *  - p0, p1: vec2 (px)
 *  - thickness: float (px, center thickness)
 *  - glow: float (px, Gaussian falloff)
 *  - progress: float [0..1] visible length
 *  - color: vec3 (0..1)
 *  - alpha: float (0..1)
 */
const RIBBON_SKSL = `
uniform float2 resolution;
uniform float2 p0;
uniform float2 p1;
uniform float thickness;
uniform float glow;
uniform float progress;
uniform float3 color;
uniform float alpha;

float sdSegmentProgress(float2 p, float2 a, float2 b, float t) {
  // clamp segment by progress
  float2 ab = (b - a) * t + a - a; // end point at t
  float2 q = p - a;
  float2 d = (b - a) * t;
  float h = clamp(dot(q, d) / dot(d, d + 1e-6), 0.0, 1.0);
  float2 proj = a + d * h;
  return length(p - proj);
}

half4 main(float2 xy) {
  float2 p = xy;
  float d = sdSegmentProgress(p, p0, p1, progress);
  float core = smoothstep(thickness, thickness - 1.0, d);
  float halo = exp(- (d*d) / (2.0 * glow * glow + 1e-6));
  float a = clamp(core + 0.85 * halo, 0.0, 1.0) * alpha;
  half3 col = half3(color.r, color.g, color.b);
  // subtle inner highlight
  float inner = smoothstep(thickness * 0.5, 0.0, d);
  col = mix(col, half3(1.0), half(0.15 * inner));
  return half4(col, half(a));
}
`

const ribbonEffect = Skia.RuntimeEffect.Make(RIBBON_SKSL)

type Vec2 = { x: number; y: number }

export interface RibbonFXProps {
  width: number
  height: number
  p0: SharedValue<Vec2>
  p1: SharedValue<Vec2>
  thickness: SharedValue<number>
  glow: SharedValue<number>
  progress: SharedValue<number> // 0..1
  color?: [number, number, number]
  alpha: SharedValue<number> // 0..1
  borderRadius?: number
}

/**
 * RibbonFX Component
 * GPU-accelerated ribbon effect for reply/quote tethers
 */
export function RibbonFX({
  width,
  height,
  p0,
  p1,
  thickness,
  glow,
  progress,
  color = [0.2, 0.8, 1.0],
  alpha,
  borderRadius: _borderRadius = 0,
}: RibbonFXProps): React.ReactElement | null {
  const [p0Val, setP0Val] = useState({ x: 0, y: 0 })
  const [p1Val, setP1Val] = useState({ x: 0, y: 0 })
  const [thVal, setThVal] = useState(8)
  const [glowVal, setGlowVal] = useState(18)
  const [progVal, setProgVal] = useState(1)
  const [alphaVal, setAlphaVal] = useState(1)

  // Sync SharedValues to state
  useAnimatedReaction(
    () => p0.value,
    value => {
      setP0Val(value)
    }
  )
  useAnimatedReaction(
    () => p1.value,
    value => {
      setP1Val(value)
    }
  )
  useAnimatedReaction(
    () => thickness.value,
    value => {
      setThVal(value)
    }
  )
  useAnimatedReaction(
    () => glow.value,
    value => {
      setGlowVal(value)
    }
  )
  useAnimatedReaction(
    () => progress.value,
    value => {
      setProgVal(value)
    }
  )
  useAnimatedReaction(
    () => alpha.value,
    value => {
      setAlphaVal(value)
    }
  )

  const uniforms = useMemo(
    () => ({
      resolution: [width, height] as [number, number],
      p0: [p0Val.x, p0Val.y] as [number, number],
      p1: [p1Val.x, p1Val.y] as [number, number],
      thickness: thVal,
      glow: glowVal,
      progress: progVal,
      color,
      alpha: alphaVal,
    }),
    [color, height, alphaVal, glowVal, p0Val, p1Val, progVal, thVal, width]
  )

  if (!ribbonEffect) {
    return null
  }

  return (
    <Canvas style={{ width, height }}>
      <Paint>
        <Shader source={ribbonEffect} uniforms={uniforms} />
      </Paint>
      <Rect x={0} y={0} width={width} height={height} />
    </Canvas>
  )
}
