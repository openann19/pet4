#!/usr/bin/env node
/**
 * Framer Motion to React Reanimated Migration Script
 * 
 * This script helps migrate components from framer-motion to react-native-reanimated
 * by identifying patterns and suggesting replacements.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'
import logger from '@/core/logger';

interface MigrationPattern {
  from: RegExp
  to: string
  description: string
}

const MIGRATION_PATTERNS: MigrationPattern[] = [
  {
    from: /import\s+{\s*motion\s*}\s+from\s+['"]framer-motion['"]/g,
    to: "import { AnimatedView } from '@/effects/reanimated/animated-view'",
    description: 'Replace motion import with AnimatedView'
  },
  {
    from: /import\s+{\s*AnimatePresence\s*}\s+from\s+['"]framer-motion['"]/g,
    to: "import { Presence } from '@petspark/motion'",
    description: 'Replace AnimatePresence with Presence'
  },
  {
    from: /<motion\.div/g,
    to: '<AnimatedView',
    description: 'Replace motion.div with AnimatedView'
  },
  {
    from: /<motion\.span/g,
    to: '<AnimatedView',
    description: 'Replace motion.span with AnimatedView'
  },
  {
    from: /<motion\.button/g,
    to: '<AnimatedView as="button"',
    description: 'Replace motion.button with AnimatedView'
  },
  {
    from: /initial=\{[^}]+\}/g,
    to: '',
    description: 'Remove initial prop (use useSharedValue instead)'
  },
  {
    from: /animate=\{[^}]+\}/g,
    to: '',
    description: 'Remove animate prop (use useAnimatedStyle instead)'
  },
  {
    from: /whileHover=\{[^}]+\}/g,
    to: '',
    description: 'Remove whileHover (use useHoverLift hook)'
  },
  {
    from: /whileTap=\{[^}]+\}/g,
    to: '',
    description: 'Remove whileTap (use useBounceOnTap hook)'
  },
  {
    from: /transition=\{[^}]+\}/g,
    to: '',
    description: 'Remove transition (use springConfigs/timingConfigs)'
  },
  {
    from: /variants=\{[^}]+\}/g,
    to: '',
    description: 'Remove variants (use useAnimatedStyle directly)'
  },
]

function findFiles(dir: string, extensions: string[] = ['.tsx', '.ts']): string[] {
  const files: string[] = []
  const entries = readdirSync(dir)

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
      files.push(...findFiles(fullPath, extensions))
    } else if (stat.isFile() && extensions.includes(extname(entry))) {
      files.push(fullPath)
    }
  }

  return files
}

function checkFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8')
    return /framer-motion/.test(content)
  } catch {
    return false
  }
}

function generateMigrationReport(rootDir: string): void {
  const files = findFiles(rootDir)
  const framerMotionFiles = files.filter(checkFile)

  logger.info(`Found ${String(framerMotionFiles.length ?? '')} files using framer-motion:\n`)
  
  framerMotionFiles.forEach(file => {
    logger.info(`  - ${String(file.replace(rootDir, '') ?? '')}`)
  })

  logger.info(`\nMigration patterns to apply:`)
  MIGRATION_PATTERNS.forEach((pattern, index) => {
    logger.info(`  ${String(index + 1 ?? '')}. ${String(pattern.description ?? '')}`)
  })
}

if (require.main === module) {
  const rootDir = process.argv[2] || process.cwd()
  generateMigrationReport(rootDir)
}

export { generateMigrationReport, MIGRATION_PATTERNS }

