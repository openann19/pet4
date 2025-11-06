/**
 * SendPing Audio Effect
 * 
 * Subtle audio feedback for message send
 * Volume-aware and feature-flagged
 */

let featureFlags: { enableSendPing: boolean } | null = null

function getFeatureFlags() {
  if (featureFlags) {
    return featureFlags
  }
  
  // Lazy load to avoid circular dependencies
  try {
    const flags = require('@/config/feature-flags')
    featureFlags = flags.getFeatureFlags()
    return featureFlags
  } catch {
    return { enableSendPing: true }
  }
}

/**
 * Play send ping sound effect
 */
export function sendPing(): void {
  const flags = getFeatureFlags()
  
  if (!flags.enableSendPing) {
    return
  }
  
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    
    o.type = 'triangle'
    o.frequency.value = 660
    
    g.gain.value = 0.0001
    o.connect(g)
    g.connect(ctx.destination)
    
    o.start()
    
    const now = ctx.currentTime
    g.gain.exponentialRampToValueAtTime(0.05, now + 0.02)
    o.frequency.exponentialRampToValueAtTime(990, now + 0.08)
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15)
    
    o.stop(now + 0.16)
  } catch (error) {
    // Silently fail if audio context is not available
    if (error instanceof Error && error.name !== 'NotAllowedError') {
      // Only log non-permission errors
    }
  }
}
