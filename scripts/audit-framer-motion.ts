#!/usr/bin/env node
/**
 * Audit script to inventory framer-motion usage across the codebase
 * Generates a JSON inventory of all framer-motion imports and usage patterns
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { globby } from 'globby'
import path from 'node:path'

interface FramerMotionUsage {
  file: string
  imports: string[]
  usagePatterns: {
    motionComponents: string[]
    animatePresence: boolean
    variants: boolean
    whileHover: boolean
    whileTap: boolean
    drag: boolean
    layout: boolean
    complex: boolean
  }
  lineCount: number
  category: 'simple' | 'medium' | 'complex'
}

interface Inventory {
  totalFiles: number
  totalViolations: number
  files: FramerMotionUsage[]
  summary: {
    byCategory: Record<string, number>
    byPattern: Record<string, number>
  }
}

async function auditFramerMotion(): Promise<Inventory> {
  const files = await globby('**/*.{ts,tsx}', {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
    ],
    cwd: process.cwd(),
  })

  const violations: FramerMotionUsage[] = []

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8')

      // Check for framer-motion imports
      const framerMotionImport = /from\s+['"]framer-motion['"]/g
      if (!framerMotionImport.test(content)) {
        continue
      }

      const imports: string[] = []
      const importMatches = content.matchAll(/import\s+{([^}]+)}\s+from\s+['"]framer-motion['"]/g)
      for (const match of importMatches) {
        const imported = match[1]
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
        imports.push(...imported)
      }

      const usagePatterns = {
        motionComponents: [] as string[],
        animatePresence: /AnimatePresence/.test(content),
        variants: /variants\s*[:=]/.test(content),
        whileHover: /whileHover/.test(content),
        whileTap: /whileTap/.test(content),
        drag: /\bdrag\b/.test(content),
        layout: /\blayout\b/.test(content),
        complex: false,
      }

      // Detect motion.* components
      const motionComponentMatches = content.matchAll(/<motion\.(\w+)/g)
      for (const match of motionComponentMatches) {
        if (!usagePatterns.motionComponents.includes(match[1])) {
          usagePatterns.motionComponents.push(match[1])
        }
      }

      // Determine complexity
      const complexityScore =
        (usagePatterns.animatePresence ? 2 : 0) +
        (usagePatterns.variants ? 2 : 0) +
        (usagePatterns.drag ? 3 : 0) +
        (usagePatterns.layout ? 2 : 0) +
        (usagePatterns.whileHover ? 1 : 0) +
        (usagePatterns.whileTap ? 1 : 0) +
        usagePatterns.motionComponents.length

      usagePatterns.complex = complexityScore >= 5

      const category: 'simple' | 'medium' | 'complex' =
        complexityScore >= 5 ? 'complex' : complexityScore >= 2 ? 'medium' : 'simple'

      const lineCount = content.split('\n').length

      violations.push({
        file,
        imports,
        usagePatterns,
        lineCount,
        category,
      })
    } catch {
      // Skip files that can't be read
      continue
    }
  }

  // Generate summary
  const byCategory: Record<string, number> = {
    simple: 0,
    medium: 0,
    complex: 0,
  }

  const byPattern: Record<string, number> = {
    animatePresence: 0,
    variants: 0,
    whileHover: 0,
    whileTap: 0,
    drag: 0,
    layout: 0,
  }

  for (const violation of violations) {
    byCategory[violation.category]++
    if (violation.usagePatterns.animatePresence) byPattern.animatePresence++
    if (violation.usagePatterns.variants) byPattern.variants++
    if (violation.usagePatterns.whileHover) byPattern.whileHover++
    if (violation.usagePatterns.whileTap) byPattern.whileTap++
    if (violation.usagePatterns.drag) byPattern.drag++
    if (violation.usagePatterns.layout) byPattern.layout++
  }

  return {
    totalFiles: files.length,
    totalViolations: violations.length,
    files: violations,
    summary: {
      byCategory,
      byPattern,
    },
  }
}

async function main() {
  const inventory = await auditFramerMotion()

  const outputPath = path.join(process.cwd(), 'audit', 'framer-motion-inventory.json')
  const outputDir = path.dirname(outputPath)

  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  writeFileSync(outputPath, JSON.stringify(inventory, null, 2), 'utf-8')

  // Print summary
  console.log('Framer Motion Audit Complete')
  console.log(`Total files scanned: ${inventory.totalFiles}`)
  console.log(`Files with framer-motion: ${inventory.totalViolations}`)
  console.log('\nBy Category:')
  for (const [category, count] of Object.entries(inventory.summary.byCategory)) {
    console.log(`  ${category}: ${count}`)
  }
  console.log('\nBy Pattern:')
  for (const [pattern, count] of Object.entries(inventory.summary.byPattern)) {
    console.log(`  ${pattern}: ${count}`)
  }
  console.log(`\nInventory saved to: ${outputPath}`)
}

main().catch(error => {
  console.error('Error running audit:', error)
  process.exit(1)
})
