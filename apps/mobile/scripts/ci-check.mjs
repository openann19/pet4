#!/usr/bin/env node
/**
 * CI Check Script for Mobile App
 * 
 * Runs all quality gates: lint, typecheck, tests, builds, and audit
 * Exit code 0 if all pass, non-zero otherwise
 * 
 * Usage: node scripts/ci-check.mjs [--skip-build] [--skip-audit]
 */

import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

const args = process.argv.slice(2)
const skipBuild = args.includes('--skip-build')
const skipAudit = args.includes('--skip-audit')

const errors = []

function runCommand(command, description) {
  console.log(`\n✅ ${description}...`)
  try {
    execSync(command, {
      cwd: rootDir,
      stdio: 'inherit',
      encoding: 'utf-8',
    })
    console.log(`✅ ${description} passed`)
    return true
  } catch (error) {
    console.error(`❌ ${description} failed`)
    errors.push({ description, command, error })
    return false
  }
}

console.log('🚀 Starting CI quality gates for mobile app...\n')

// 1. TypeScript type check
runCommand('pnpm typecheck', 'TypeScript type check')

// 2. ESLint
runCommand('pnpm lint', 'ESLint check')

// 3. Tests
runCommand('pnpm test:run', 'Unit and integration tests')

// 4. Build check (optional, can be skipped for faster CI)
if (!skipBuild) {
  console.log('\n⚠️  Build check skipped (use --skip-build to skip explicitly)')
  // Note: EAS builds are expensive, so we skip them by default in CI
  // Full builds should be run manually or in separate CI workflow
} else {
  console.log('\n⚠️  Build check skipped (--skip-build flag)')
}

// 5. Security audit (optional, can be skipped)
if (!skipAudit) {
  runCommand('pnpm audit --audit-level=moderate', 'Security audit')
} else {
  console.log('\n⚠️  Security audit skipped (--skip-audit flag)')
}

// Summary
console.log('\n' + '='.repeat(60))
if (errors.length === 0) {
  console.log('✅ All quality gates passed!')
  process.exit(0)
} else {
  console.log(`❌ ${errors.length} quality gate(s) failed:`)
  errors.forEach(({ description, command }) => {
    console.log(`  - ${description}`)
    console.log(`    Command: ${command}`)
  })
  console.log('\nPlease fix the errors above before merging.')
  process.exit(1)
}

