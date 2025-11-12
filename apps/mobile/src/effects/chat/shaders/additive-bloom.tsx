/**
 * Additive Bloom Component
 *
 * Fast additive glow effect for send trails/reactions.
 * Uses Skia blur + blend mode for GPU-accelerated rendering.
 *
 * Location: apps/mobile/src/effects/chat/shaders/additiveBloom.tsx
 */

import { Canvas, Group, Paint, Rect, Skia } from '@shopify/react-native-skia'
import React, { useMemo, useState } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import { useAnimatedReaction } from 'react-native-reanimated'

/**
 * Draws a circular additive glow. Cheap and pretty.
 *
 * Props:
 *  - centerX, centerY: px
 *  - radius: px
 *  - intensity: 0..1 (opacity)
 *  - color: [r,g,b] 0..1
 */
export interface AdditiveBloomProps {
  width: number
  height: number
  centerX: SharedValue<number>
  centerY: SharedValue<number>
  radius: SharedValue<number>
  intensity: SharedValue<number>
  color?: [number, number, number]
}

/**
 * Convert normalized color [0..1] to hex string
 */
function colorToHex([r, g, b]: [number, number, number], a = 1): string {
  const to = (v: number): number => Math.max(0, Math.min(255, Math.round(v * 255)))
  const rr = to(r)
  const gg = to(g)
  const bb = to(b)
  const aa = to(a)
  const hex = (aa << 24) | (rr << 16) | (gg << 8) | bb
  return `#${String(hex.toString(16).padStart(8, '0') ?? '')}`
}

export function AdditiveBloom({
  width,
  height,
  centerX,
  centerY,
  radius,
  intensity,
  color = [0.2, 0.8, 1.0],
}: AdditiveBloomProps): React.ReactElement {
  const [xVal, setXVal] = useState(0)
  const [yVal, setYVal] = useState(0)
  const [rVal, setRVal] = useState(32)
  const [aVal, setAVal] = useState(0.8)

  // Sync SharedValues to state
  useAnimatedReaction(
    () => centerX.value,
    value => {
      setXVal(value)
    }
  )
  useAnimatedReaction(
    () => centerY.value,
    value => {
      setYVal(value)
    }
  )
  useAnimatedReaction(
    () => radius.value,
    value => {
      setRVal(value)
    }
  )
  useAnimatedReaction(
    () => intensity.value,
    value => {
      setAVal(value)
    }
  )

  const blurPaint = useMemo(() => {
    const p = Skia.Paint()
    const blurRadius = Math.max(1, Math.min(24, rVal))
    // Use numeric constant for Clamp tile mode (0 = Clamp)
    p.setImageFilter(Skia.ImageFilter.MakeBlur(blurRadius, blurRadius, 0, null))
    p.setAlphaf(Math.max(0, Math.min(1, aVal)))
    return p
  }, [rVal, aVal])

  return (
    <Canvas style={{ width, height }}>
      <Group blendMode="plus">
        {/* core */}
        <Paint color={Skia.Color(colorToHex(color, 0.6))} />
        <Rect x={xVal} y={yVal} width={1} height={1} />

        {/* soft halo via image filter blur */}
        <Group layer={blurPaint}>
          <Paint color={Skia.Color(colorToHex(color, 1))} />
          <Rect x={xVal} y={yVal} width={1} height={1} />
        </Group>
      </Group>
    </Canvas>
  )
}
