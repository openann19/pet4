#!/usr/bin/env node

import { readFileSync } from 'fs'
import { glob } from 'glob'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Forbidden patterns that should never reach production
const FORBIDDEN_PATTERNS = [
  {
    pattern: /\b(TODO|FIXME|HACK|XXX|SIMPLE)\s*:/gi,
    message: 'Temporary markers detected - complete implementation before production',
    severity: 'ERROR'
  },
  {
    pattern: /window\.spark\.kv/gi,
    message: 'spark.kv usage detected - migrate to real API endpoints',
    severity: 'ERROR'
  },
  {
    pattern: /spark\.kv\.(get|set|delete)/gi,
    message: 'spark.kv method calls detected - use APIClient instead',
    severity: 'ERROR'
  },
  {
    pattern: /console\.(log|warn|info|debug)/gi,
    message: 'Console usage detected - use structured logging instead',
    severity: 'ERROR'
  },
  {
    pattern: /@ts-ignore|@ts-expect-error/gi,
    message: 'TypeScript suppressions detected - fix type errors properly',
    severity: 'ERROR'
  },
  {
    pattern: /any\s*;/gi,
    message: 'Explicit any type detected - use proper typing',
    severity: 'WARNING'
  }
]

// Files to exclude from checks
const EXCLUDED_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/coverage/**',
  '**/.git/**',
  '**/spark-compat.ts',
  '**/spark-fallback.ts', 
  '**/spark-patch.ts',
  '**/forbid-words.mjs'
]

async function checkFiles() {
  const files = await glob('**/*.{ts,tsx,js,jsx}', {
    cwd: rootDir,
    ignore: EXCLUDED_PATTERNS,
    absolute: true
  })

  let errorCount = 0
  let warningCount = 0

  console.log(`🔍 Checking ${files.length} files for forbidden patterns...\n`)

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8')
      const relativePath = file.replace(rootDir + '/', '')

      for (const { pattern, message, severity } of FORBIDDEN_PATTERNS) {
        const matches = [...content.matchAll(pattern)]
        
        for (const match of matches) {
          const lines = content.substring(0, match.index).split('\n')
          const lineNumber = lines.length
          const column = lines[lines.length - 1].length + 1
          
          const icon = severity === 'ERROR' ? '❌' : '⚠️'
          const color = severity === 'ERROR' ? '\x1b[31m' : '\x1b[33m'
          const reset = '\x1b[0m'
          
          console.log(`${icon} ${color}${severity}${reset}: ${relativePath}:${lineNumber}:${column}`)
          console.log(`   Pattern: ${match[0]}`)
          console.log(`   Message: ${message}`)
          console.log()
          
          if (severity === 'ERROR') errorCount++
          else warningCount++
        }
      }
    } catch (error) {
      console.error(`❌ Failed to read ${file}:`, error.message)
      errorCount++
    }
  }

  // Summary
  if (errorCount > 0 || warningCount > 0) {
    console.log(`\n📊 Summary:`)
    if (errorCount > 0) console.log(`   ❌ ${errorCount} error(s)`)
    if (warningCount > 0) console.log(`   ⚠️  ${warningCount} warning(s)`)
    
    if (errorCount > 0) {
      console.log(`\n❌ BUILD FAILED: ${errorCount} error(s) must be fixed before production`)
      process.exit(1)
    }
    
    if (warningCount > 0) {
      console.log(`\n⚠️  BUILD WARNING: ${warningCount} warning(s) should be addressed`)
    }
  } else {
    console.log('✅ All checks passed - no forbidden patterns found')
  }
}

checkFiles().catch(error => {
  console.error('❌ Script failed:', error)
  process.exit(1)
})

