#!/usr/bin/env node
/**
 * Verify Web/Mobile Parity
 * Ensures chat effects have equivalent implementations on both platforms
 */

import { readdirSync, readFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..', '..', '..')

const chatEffects = [
  'bubbles',
  'reactions',
  'gestures',
  'typing',
  'media',
  'shaders',
]

let ERROR = 0

function die(msg) {
  process.stderr.write(`❌ ${msg}\n`)
  ERROR = 1
}

function walk(dir, out = []) {
  try {
    const ents = readdirSync(dir, { withFileTypes: true })
    for (const e of ents) {
      const p = join(dir, e.name)
      if (e.isDirectory()) {
        walk(p, out)
      } else if (e.isFile() && /\.(ts|tsx)$/.test(e.name)) {
        out.push(p.replace(ROOT + '/', ''))
      }
    }
  } catch {
    // Ignore errors
  }
  return out
}

function hasFile(path) {
  try {
    readFileSync(join(ROOT, path))
    return true
  } catch {
    return false
  }
}

// Check for parity in key effect directories
for (const effect of chatEffects) {
  const mobilePath = `apps/mobile/src/effects/chat/${effect}`
  const webPath = `apps/web/src/effects/chat/${effect}`

  const mobileFiles = walk(join(ROOT, mobilePath))
  const webFiles = walk(join(ROOT, webPath))

  // Check if mobile has effects but web doesn't (or vice versa)
  if (mobileFiles.length > 0 && webFiles.length === 0) {
    die(
      `Missing web parity: ${effect} exists in mobile but not in web. Expected: ${webPath}`
    )
  }

  // Check for reduced-motion parity
  if (hasFile(`${mobilePath}/reduced-motion.ts`) && !hasFile(`${webPath}/reduced-motion.ts`)) {
    die(`Missing web reduced-motion: ${webPath}/reduced-motion.ts`)
  }
}

// Check for shared transition configs
const mobileTransitions = hasFile('apps/mobile/src/effects/reanimated/transitions.ts')
const webTransitions = hasFile('apps/web/src/effects/reanimated/transitions.ts')

if (mobileTransitions && !webTransitions) {
  die('Missing web transitions.ts parity')
}

if (webTransitions && !mobileTransitions) {
  die('Missing mobile transitions.ts parity')
}

// Check reanimated hooks parity using bash script
try {
  const parityScript = join(ROOT, 'scripts', 'check_mobile_parity.sh')
  execSync(`bash ${parityScript}`, { 
    stdio: 'inherit',
    cwd: ROOT 
  })
} catch (_e) {
  die('Reanimated hooks parity check failed. Run: bash scripts/check_mobile_parity.sh')
  ERROR = 1
}

if (ERROR === 0) {
  process.stdout.write('✅ Web/Mobile parity verified\n')
} else {
  process.exit(1)
}
