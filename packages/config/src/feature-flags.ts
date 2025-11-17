/**
 * Feature Flags Configuration
 *
 * Zod-validated feature flags with safe defaults.
 * Loads from server JSON with fallback defaults.
 * Invalid payloads are rejected.
 */

import { z } from 'zod'

export const FlagsSchema = z
  .object({
    chat: z
      .object({
        confetti: z.boolean(),
        reactionBurst: z.boolean(),
        auroraRing: z.boolean(),
        virtualization: z.boolean(),
      })
      .strict(),
  })
  .strict()

export type Flags = z.infer<typeof FlagsSchema>

/**
 * Safe default flags (all false initially)
 */
const DEFAULT_FLAGS: Flags = {
  chat: {
    confetti: false,
    reactionBurst: false,
    auroraRing: false,
    virtualization: false,
  },
}

let FLAGS: Flags = DEFAULT_FLAGS

/**
 * Load flags from server JSON with validation
 * Invalid payloads are rejected and defaults are used
 */
export function loadFlags(json: unknown): Flags {
  try {
    const parsed = FlagsSchema.parse(json)
    FLAGS = parsed
    return parsed
  } catch {
    // Invalid payloads are rejected and safe defaults are used
    // No logging to comply with zero-warning policy
    FLAGS = DEFAULT_FLAGS
    return DEFAULT_FLAGS
  }
}

/**
 * Get current flags
 */
export function flags(): Flags {
  return FLAGS
}

/**
 * Get a specific flag value
 */
export function getFlag(key: keyof Flags['chat']): boolean {
  return FLAGS.chat[key]
}

/**
 * Reset flags to defaults
 */
export function resetFlags(): void {
  FLAGS = DEFAULT_FLAGS
}
