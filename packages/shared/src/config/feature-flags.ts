// Shared feature flags for visual enhancements across web and mobile
// Toggle via env if desired; defaults are conservative true for demo

import { getEnvVar } from '../types/process'

export interface FeatureFlags {
  readonly HOLO_BACKGROUND: boolean
  readonly GLOW_TRAIL: boolean
  readonly MESSAGE_PEEK: boolean
  readonly SMART_IMAGE: boolean
  readonly AUDIO_SEND_PING: boolean
  readonly CHAT_REACTIONS: boolean
  readonly CHAT_STICKERS: boolean
  readonly CHAT_VOICE_MESSAGES: boolean
  readonly CHAT_LOCATION_SHARE: boolean
  readonly CHAT_TRANSLATION: boolean
  readonly CHAT_SMART_SUGGESTIONS: boolean
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
  CHAT_REACTIONS: env('PS_CHAT_REACTIONS', true),
  CHAT_STICKERS: env('PS_CHAT_STICKERS', true),
  CHAT_VOICE_MESSAGES: env('PS_CHAT_VOICE_MESSAGES', true),
  CHAT_LOCATION_SHARE: env('PS_CHAT_LOCATION_SHARE', true),
  CHAT_TRANSLATION: env('PS_CHAT_TRANSLATION', true),
  CHAT_SMART_SUGGESTIONS: env('PS_CHAT_SMART_SUGGESTIONS', true),
}

export default FLAGS
