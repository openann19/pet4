#!/usr/bin/env node
/**
 * CI Performance Budget Checker
 * Checks bundle sizes and fails CI if budgets are exceeded
 * Usage: node scripts/check-performance-budget.mjs
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { gzipSync } from 'zlib'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')
const DIST_DIR = join(ROOT, 'dist')

// Import performance budget config
// Note: This is a simplified version for CI - actual config is in TypeScript
// Based on Core Web Vitals targets: LCP < 2.5s, FID < 100ms, CLS < 0.1
const BUDGETS = {
  initial: 200, // KB (gzipped) - Target for fast LCP
  total: 1000, // KB (gzipped) - Total bundle size limit
  chunk: 300, // KB (gzipped) - Individual chunk limit
  vendor: 500, // KB (gzipped) - Vendor chunk limit
}

let errors = 0
let warnings = 0

function error(message) {
  console.error(`❌ ${message}`)
  errors++
}

function warn(message) {
  console.warn(`⚠️  ${message}`)
  warnings++
}

function getGzippedSize(filePath) {
  try {
    const content = readFileSync(filePath)
    const gzipped = gzipSync(content)
    return Math.round(gzipped.length / 1024) // Convert to KB
  } catch (err) {
    console.error(`Failed to read ${filePath}:`, err)
    return 0
  }
}

// File size calculation removed - not used in this script

function analyzeBundles() {
  /** @type {Record<string, number>} */
  const chunks = {}
  /** @type {Record<string, number>} */
  const vendors = {}
  let total = 0
  let initial = 0

  if (!statSync(DIST_DIR).isDirectory()) {
    error(`Dist directory not found: ${DIST_DIR}`)
    return { initial: 0, total: 0, chunks, vendors }
  }

  // Recursively list all files under dist
  /**
   * @param {string} dir
   * @returns {string[]}
   */
  function walk(dir) {
    const entries = readdirSync(dir, { withFileTypes: true })
    /** @type {string[]} */
    const results = []
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...walk(full))
      } else {
        results.push(full)
      }
    }
    return results
  }

  const files = walk(DIST_DIR).filter((file) => file.endsWith('.js'))

  for (const file of files) {
    const filePath = file
    const size = getGzippedSize(file)

    total += size

    // Identify initial bundle (usually index or main)
    const base = filePath.split('/').pop() || ''
    if (base.includes('index') || base.includes('main') || base.match(/^[a-f0-9]+\.js$/)) {
      if (initial === 0 || size > initial) {
        initial = size
      }
    }

    // Identify vendor chunks
    if (base.includes('vendor') || base.includes('chunk')) {
      const chunkName = base.replace('.js', '')
      if (base.includes('vendor')) {
        vendors[chunkName] = size
      } else {
        chunks[chunkName] = size
      }
    } else {
      chunks[base.replace('.js', '')] = size
    }
  }

  return { initial, total, chunks, vendors }
}

function checkPerformanceBudget() {
  console.log('\n📊 Checking Performance Budget\n')
  console.log('='.repeat(50))

  const metrics = analyzeBundles()

  console.log(`\nBundle Metrics:`)
  console.log(`  Initial: ${metrics.initial} KB (budget: ${BUDGETS.initial} KB)`)
  console.log(`  Total: ${metrics.total} KB (budget: ${BUDGETS.total} KB)`)
  console.log(`  Chunks: ${Object.keys(metrics.chunks).length}`)
  console.log(`  Vendors: ${Object.keys(metrics.vendors).length}`)

  // Check initial bundle
  if (metrics.initial > BUDGETS.initial) {
    error(
      `Initial bundle size ${metrics.initial}KB exceeds budget of ${BUDGETS.initial}KB (${((metrics.initial / BUDGETS.initial - 1) * 100).toFixed(1)}% over)`
    )
  }

  // Check total bundle
  if (metrics.total > BUDGETS.total) {
    error(
      `Total bundle size ${metrics.total}KB exceeds budget of ${BUDGETS.total}KB (${((metrics.total / BUDGETS.total - 1) * 100).toFixed(1)}% over)`
    )
  }

  // Check individual chunks
  for (const [chunkName, size] of Object.entries(metrics.chunks)) {
    if (size > BUDGETS.chunk) {
      warn(`Chunk "${chunkName}" size ${size}KB exceeds budget of ${BUDGETS.chunk}KB`)
    }
  }

  // Check vendor chunks
  for (const [vendorName, size] of Object.entries(metrics.vendors)) {
    if (size > BUDGETS.vendor) {
      warn(`Vendor chunk "${vendorName}" size ${size}KB exceeds budget of ${BUDGETS.vendor}KB`)
    }
  }

  console.log('\n' + '='.repeat(50))

  if (errors === 0 && warnings === 0) {
    console.log('\n✅ All performance budgets met!')
    process.exit(0)
  } else {
    if (errors > 0) {
      console.error(`\n❌ Found ${errors} error(s)`)
    }
    if (warnings > 0) {
      console.warn(`\n⚠️  Found ${warnings} warning(s)`)
    }
    console.log('\n💡 Consider:')
    console.log('   • Code splitting large dependencies')
    console.log('   • Lazy loading heavy components')
    console.log('   • Tree-shaking unused code')
    console.log('   • Optimizing images and assets')
    console.log('   • Using dynamic imports for routes\n')

    // Fail CI on errors, but allow warnings
    process.exit(errors > 0 ? 1 : 0)
  }
}

// Run the check
checkPerformanceBudget()
