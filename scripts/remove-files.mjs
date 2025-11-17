#!/usr/bin/env node
/**
 * Safe File Removal Script
 * 
 * Removes files identified as unused, with safety checks
 */

import { readFileSync, unlinkSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

// Read removal plan
const plan = JSON.parse(readFileSync(join(ROOT, 'tmp/removal-plan.json'), 'utf-8'))

let removedCount = 0
let skippedCount = 0
const errors = []

console.log('🗑️  Starting safe file removal...\n')

// Remove documentation files (safe)
console.log(`📝 Removing ${plan.docs.length} documentation files...`)
for (const doc of plan.docs) {
  try {
    if (existsSync(doc.fullPath)) {
      unlinkSync(doc.fullPath)
      removedCount++
      if (removedCount % 10 === 0) {
        process.stdout.write(`  Removed ${removedCount} files...\r`)
      }
    } else {
      skippedCount++
    }
  } catch (error) {
    errors.push({ file: doc.path, error: error.message })
  }
}

console.log(`\n✅ Removed ${removedCount} documentation files`)
if (skippedCount > 0) {
  console.log(`⚠️  Skipped ${skippedCount} files (not found)`)
}
if (errors.length > 0) {
  console.log(`❌ Errors: ${errors.length}`)
  for (const err of errors) {
    console.log(`   - ${err.file}: ${err.error}`)
  }
}

console.log('\n📊 Summary:')
console.log(`   - Documentation files removed: ${removedCount}`)
console.log(`   - Source files need manual review: ${plan.summary.sourceFilesToReview}`)
console.log(`   - Unused dependencies: See REMOVAL_PLAN.md`)

