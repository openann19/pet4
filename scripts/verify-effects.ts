// ts-node scripts/verify-effects.ts
import fs from 'node:fs'
import path from 'node:path'
import logger from '@/core/logger';

const root = process.cwd()
function filesUnder(d: string) {
  const out: string[] = []
  const st = [d]
  while (st.length) {
    const x = st.pop()!
    for (const e of fs.readdirSync(x, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue
      const p = path.join(x, e.name)
      if (e.isDirectory()) st.push(p)
      else if (/\.(ts|tsx)$/.test(p)) out.push(p)
    }
  }
  return out
}

const effects = [
  path.join(root, 'apps/web/src/effects'),
  path.join(root, 'apps/mobile/src/effects'),
].flatMap(p => (fs.existsSync(p) ? filesUnder(p) : []))

let bad = false

function fail(msg: string) {
  bad = true
  console.error(`❌ ${msg}`)
}
function pass(msg: string) {
  console.log(`✅ ${msg}`)
}

// Check for Math.random usage (but allow if seeded RNG is imported)
const rnd = effects.filter(f => {
  const content = fs.readFileSync(f, 'utf8')
  if (!/Math\.random\(/.test(content)) return false
  // Allow if seeded RNG is imported
  const hasSeededRng =
    /makeRng|SeededRNG|from.*['"]@petspark\/shared.*rng|from.*['"]@\/lib\/seeded-rng|from.*['"]@\/effects.*seeded-rng/.test(
      content
    )
  return !hasSeededRng
})
if (rnd.length) {
  fail(`Random usage in effects (without seeded RNG):\n${String(rnd.join('\n') ?? '')}`)
} else {
  pass('No Math.random() in effects (or using seeded RNG)')
}

// Check for reduced-motion checks
const rm = effects.filter(f => {
  const content = fs.readFileSync(f, 'utf8')
  return /prefers-reduced-motion|useReducedMotion|useReducedMotionSV|getReducedMotionDuration|getReducedMotionMultiplier/.test(
    content
  )
})
if (rm.length === 0) {
  fail('No reduced-motion checks found in effects')
} else {
  pass(`Reduced-motion checks present in ${String(rm.length ?? '')} effect file(s)`)
}

// Check for haptics usage (with cooldown check)
const hap = effects.filter(f => {
  const content = fs.readFileSync(f, 'utf8')
  return /haptics\.|HapticManager/.test(content)
})
if (hap.length === 0) {
  fail('No haptics usage detected in effects')
} else {
  // Check if cooldown logic is present
  const hapWithCooldown = hap.filter(f => {
    const content = fs.readFileSync(f, 'utf8')
    return /cooldown|throttle|debounce|lastHapticTime|hapticCooldown/i.test(content)
  })
  if (hapWithCooldown.length === 0 && hap.length > 0) {
    logger.warn(`⚠️  Haptics used in ${String(hap.length ?? '')} file(s) but cooldown logic not detected`)
  }
  pass(`Haptics wired in ${String(hap.length ?? '')} effect file(s)`)
}

// Check for Reanimated usage
const ra = effects.filter(f => {
  const content = fs.readFileSync(f, 'utf8')
  return /from ['"]react-native-reanimated['"]/.test(content)
})
if (ra.length === 0) {
  fail('No reanimated imports in effects')
} else {
  pass(`Reanimated used in ${String(ra.length ?? '')} effect file(s)`)
}

if (bad) process.exit(1)
logger.info('🎯 Effects verification passed.')
