// Shared feature flags for visual enhancements across web and mobile
// Toggle via env if desired; defaults are conservative true for demo

import { getEnvVar } from '../types/process'

export type FeatureFlags = {
  readonly HOLO_BACKGROUND: boolean
  readonly GLOW_TRAIL: boolean
  readonly MESSAGE_PEEK: boolean
  readonly SMART_IMAGE: boolean
  readonly AUDIO_SEND_PING: boolean
}

const env = (name: string, fallback: boolean): boolean => {
  return getEnvVar(name, fallback)
}

export const FLAGS: FeatureFlags = {
  HOLO_BACKGROUND: env('PS_HOLO_BACKGROUND', true),
  GLOW_TRAIL: env('PS_GLOW_TRAIL', true),
  MESSAGE_PEEK: env('PS_MESSAGE_PEEK', true),
  SMART_IMAGE: env('PS_SMART_IMAGE', true),
  AUDIO_SEND_PING: env('PS_AUDIO_SEND_PING', true),
}

export default FLAGS
