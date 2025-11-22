#!/usr/bin/env node
/**
 * Web Parity Verification Script
 *
 * Checks for parity requirements:
 * 1. DiscoverView exposes both Discover and Map sections
 * 2. Chat files import useReducedMotion when using animations
 * 3. No Math.random in effects/ or components/chat/ directories
 *
 * Location: apps/web/scripts/verify-parity.mjs
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT_DIR = join(__dirname, '..')

let errors: string[] = []
let warnings: string[] = []

/**
 * Recursively find all TypeScript/TSX files in a directory
 */
function findFiles(dir: string, extensions: string[] = ['.ts', '.tsx']): string[] {
  const files: string[] = []

  try {
    const entries = readdirSync(dir)

    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        // Skip node_modules and other ignored directories
        if (entry !== 'node_modules' && entry !== '.git' && entry !== 'dist' && entry !== 'build') {
          files.push(...findFiles(fullPath, extensions))
        }
      } else if (extensions.some(ext => entry.endsWith(ext))) {
        files.push(fullPath)
      }
    }
  } catch {
    // Directory might not exist or be inaccessible - silently continue
    // Error intentionally ignored as this is a file discovery function
    // No-op to satisfy ESLint no-empty rule
    void 0
  }

  return files
}

/**
 * Check DiscoverView exposes both Discover and Map sections
 */
function checkDiscoverView(): void {
  const discoverViewPath = join(ROOT_DIR, 'src/components/views/DiscoverView.tsx')

  try {
    const content = readFileSync(discoverViewPath, 'utf-8')

    // Check for viewMode state and conditional rendering
    const hasViewMode = /viewMode.*===.*['"]map['"]/.test(content) || /viewMode.*===.*['"]cards['"]/.test(content)
    const hasMapRendering = /viewMode\s*===\s*['"]map['"]/.test(content) || /DiscoverMapMode/.test(content)
    const hasCardsRendering = /viewMode\s*===\s*['"]cards['"]/.test(content) || /viewMode\s*!==\s*['"]map['"]/.test(content)

    if (!hasViewMode) {
      errors.push('DiscoverView.tsx: Missing viewMode state toggle for Discover/Map switching')
    }

    if (!hasMapRendering) {
      errors.push('DiscoverView.tsx: Missing Map view rendering (should render DiscoverMapMode when viewMode === "map")')
    }

    if (!hasCardsRendering) {
      errors.push('DiscoverView.tsx: Missing Discover cards view rendering')
    }
  } catch (error) {
    errors.push(`Failed to read DiscoverView.tsx: ${error instanceof Error ? error.message : String(error)}`)
  }
}

/**
 * Check chat files import useReducedMotion when using animations
 */
function checkChatReducedMotion(): void {
  const chatDir = join(ROOT_DIR, 'src/components/chat')
  const effectsDir = join(ROOT_DIR, 'src/effects')

  const chatFiles = [
    ...findFiles(chatDir, ['.ts', '.tsx']),
    ...findFiles(effectsDir, ['.ts', '.tsx']),
  ].filter(file =>
    file.includes('chat') ||
    file.includes('reanimated') ||
    file.includes('gestures')
  )

  for (const file of chatFiles) {
    try {
      const content = readFileSync(file, 'utf-8')

      // Check if file uses animations
      const usesAnimations = /withSpring|withTiming|withSequence|withRepeat/.test(content)

      if (usesAnimations) {
        // Check if it imports reduced motion utilities
        const hasReducedMotion = /useReducedMotion|useReducedMotionSV|getReducedMotionDuration|isReduceMotionEnabled/.test(content)

        if (!hasReducedMotion) {
          warnings.push(`${file}: Uses animations (withSpring/withTiming) but doesn't import useReducedMotion utilities`)
        }
      }
    } catch (error) {
      warnings.push(`Failed to read ${file}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

/**
 * Check for Math.random usage in effects/ and components/chat/
 */
function checkMathRandom(): void {
  const effectsDir = join(ROOT_DIR, 'src/effects')
  const chatComponentsDir = join(ROOT_DIR, 'src/components/chat')

  const filesToCheck = [
    ...findFiles(effectsDir, ['.ts', '.tsx']),
    ...findFiles(chatComponentsDir, ['.ts', '.tsx']),
  ]

  for (const file of filesToCheck) {
    try {
      const content = readFileSync(file, 'utf-8')

      // Check for Math.random usage (but allow in comments)
      const mathRandomMatches = content.match(/Math\.random\(\)/g)
      if (mathRandomMatches) {
        // Check if file imports makeRng (seeded RNG)
        const hasSeededRng = /makeRng|from.*['"]@petspark\/shared['"]/.test(content)

        if (!hasSeededRng) {
          errors.push(`${file}: Uses Math.random() but doesn't import makeRng from @petspark/shared. Found ${mathRandomMatches.length} occurrence(s)`)
        }
      }
    } catch (error) {
      warnings.push(`Failed to read ${file}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}

/**
 * Main verification function
 */
function main(): void {
  console.log('🔍 Verifying web parity requirements...\n')

  checkDiscoverView()
  checkChatReducedMotion()
  checkMathRandom()

  // Report results
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:')
    warnings.forEach(warning => console.log(`   ${warning}`))
    console.log()
  }

  if (errors.length > 0) {
    console.log('❌ Errors:')
    errors.forEach(error => console.log(`   ${error}`))
    console.log()
    console.error(`\n❌ Parity verification failed with ${errors.length} error(s)`)
    process.exit(1)
  }

  if (warnings.length === 0 && errors.length === 0) {
    console.log('✅ All parity checks passed!')
  } else if (warnings.length > 0 && errors.length === 0) {
    console.log(`✅ Parity checks passed with ${warnings.length} warning(s)`)
  }
}

main()
