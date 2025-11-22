#!/usr/bin/env node
/**
 * Verify Bundle Size Budget
 * Ensures bundle size stays within acceptable limits
 */

import { readdirSync, statSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

// Budget limits (in bytes)
const BUDGETS = {
  effects: {
    max: 500 * 1024, // 500 KB for all effects
    perFile: 50 * 1024, // 50 KB per file
  },
  chat: {
    max: 200 * 1024, // 200 KB for chat components
    perFile: 30 * 1024, // 30 KB per file
  },
}

let ERROR = 0

function die(msg) {
  process.stderr.write(`❌ ${msg}\n`)
  ERROR = 1
}

function checkDirectory(dir) {
  let totalSize = 0
  const files = []

  try {
    const ents = readdirSync(dir, { withFileTypes: true, recursive: true })

    for (const e of ents) {
      if (e.isFile() && /\.(ts|tsx|js|jsx)$/.test(e.name)) {
        const filePath = join(e.path, e.name)
        const size = statSync(filePath).size
        totalSize += size
        files.push({ path: filePath, size })
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
    return { totalSize: 0, files: [] }
  }

  return { totalSize, files }
}

// Check effects directory
const effectsDir = join(ROOT, 'src/effects')
const effectsStats = checkDirectory(effectsDir)

if (effectsStats.totalSize > BUDGETS.effects.max) {
  die(
    `Effects bundle exceeds budget: ${(effectsStats.totalSize / 1024).toFixed(2)} KB > ${(BUDGETS.effects.max / 1024).toFixed(2)} KB`
  )
}

for (const file of effectsStats.files) {
  if (file.size > BUDGETS.effects.perFile) {
    die(
      `File exceeds budget: ${file.path.replace(ROOT + '/', '')} (${(file.size / 1024).toFixed(2)} KB > ${(BUDGETS.effects.perFile / 1024).toFixed(2)} KB)`
    )
  }
}

// Check chat components directory
const chatDir = join(ROOT, 'src/components/chat')
const chatStats = checkDirectory(chatDir)

if (chatStats.totalSize > BUDGETS.chat.max) {
  die(
    `Chat bundle exceeds budget: ${(chatStats.totalSize / 1024).toFixed(2)} KB > ${(BUDGETS.chat.max / 1024).toFixed(2)} KB`
  )
}

for (const file of chatStats.files) {
  if (file.size > BUDGETS.chat.perFile) {
    die(
      `File exceeds budget: ${file.path.replace(ROOT + '/', '')} (${(file.size / 1024).toFixed(2)} KB > ${(BUDGETS.chat.perFile / 1024).toFixed(2)} KB)`
    )
  }
}

if (ERROR === 0) {
  process.stdout.write('✅ Bundle size budget verified\n')
  process.stdout.write(
    `   Effects: ${(effectsStats.totalSize / 1024).toFixed(2)} KB / ${(BUDGETS.effects.max / 1024).toFixed(2)} KB\n`
  )
  process.stdout.write(
    `   Chat: ${(chatStats.totalSize / 1024).toFixed(2)} KB / ${(BUDGETS.chat.max / 1024).toFixed(2)} KB\n`
  )
} else {
  process.exit(1)
}
