/**
 * Chromatic Aberration Runtime Shader Component
 *
 * GPU-accelerated chromatic aberration effect with per-channel RGB offset.
 * Creates a center-weighted distortion effect for premium visual polish.
 *
 * Location: apps/mobile/src/effects/chat/shaders/chromaticAberration.tsx
 */

import {
  Canvas,
  ImageShader,
  Paint,
  Rect,
  Shader,
  Skia,
  useImage,
} from '@shopify/react-native-skia'
import React, { useMemo, useState } from 'react'
import type { SharedValue } from 'react-native-reanimated'
import { useAnimatedReaction } from '@petspark/motion'

/**
 * SkSL: Chromatic Aberration
 * Uniforms:
 *  - image: child shader (the layer to distort)
 *  - resolution: vec2(width, height)
 *  - center: vec2(px)
 *  - radius: float (px at image edge)
 *  - intensity: float [0..1]
 */
const CHROMA_SKSL = `
uniform shader image;
uniform float2 resolution;
uniform float2 center;
uniform float radius;
uniform float intensity;

half4 main(float2 xy) {
  float2 uv = xy / resolution;
  float2 c  = center / resolution;
  float2 dir = normalize(uv - c + 1e-6);
  float falloff = length(uv - c);      // stronger near edges
  float rpx = radius * intensity * falloff;
  float2 off = dir * (rpx / resolution);
  half4 base = image.eval(xy);
  half rr = image.eval(xy + off).r;
  half gg = image.eval(xy).g;
  half bb = image.eval(xy - off).b;
  // Preserve original alpha; slight mix to avoid harsh fringing
  half3 rgb = mix(base.rgb, half3(rr, gg, bb), half(0.8 * intensity));
  return half4(rgb, base.a);
}
`

const effect = Skia.RuntimeEffect.Make(CHROMA_SKSL)

type Vec2 = { x: number; y: number }

export interface ChromaticAberrationFXProps {
  uri: string
  width: number
  height: number
  center: SharedValue<Vec2> // px in image space
  radius: SharedValue<number> // px max offset at edge
  intensity: SharedValue<number> // 0..1
  borderRadius?: number
}

export function ChromaticAberrationFX({
  uri,
  width,
  height,
  center,
  radius,
  intensity,
  borderRadius: _borderRadius = 0,
}: ChromaticAberrationFXProps): React.ReactElement | null {
  const img = useImage(uri)
  const [centerVal, setCenterVal] = useState({ x: width / 2, y: height / 2 })
  const [radiusVal, setRadiusVal] = useState(0)
  const [intensityVal, setIntensityVal] = useState(0)

  // Sync SharedValues to state for Skia uniforms
  useAnimatedReaction(
    () => center.value,
    value => {
      setCenterVal(value)
    }
  )
  useAnimatedReaction(
    () => radius.value,
    value => {
      setRadiusVal(value)
    }
  )
  useAnimatedReaction(
    () => intensity.value,
    value => {
      setIntensityVal(value)
    }
  )

  const uniforms = useMemo(
    () => ({
      resolution: [width, height] as [number, number],
      center: [centerVal.x, centerVal.y] as [number, number],
      radius: radiusVal,
      intensity: intensityVal,
    }),
    [height, centerVal, radiusVal, intensityVal, width]
  )

  if (!img || !effect) {
    return null
  }

  return (
    <Canvas style={{ width, height }}>
      <Paint>
        <Shader source={effect} uniforms={uniforms}>
          <ImageShader image={img} fit="cover" />
        </Shader>
      </Paint>
      <Rect x={0} y={0} width={width} height={height} />
    </Canvas>
  )
}
