#!/usr/bin/env node
/**
 * Framer Motion Migration Tracker
 *
 * Audits all files using Framer Motion or @petspark/motion
 * Categorizes them and generates migration status report
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const MIGRATED_FILES = new Set([
  'apps/web/src/App.tsx',
  'apps/web/src/components/views/DiscoverView.tsx',
  'apps/web/src/components/views/CommunityView.tsx',
  'apps/web/src/components/views/ProfileView.tsx',
  'apps/web/src/components/chat/AdvancedChatWindow.tsx',
  'apps/web/src/components/chat/components/ChatFooter.tsx',
  'apps/web/src/components/chat/components/MessageItem.tsx',
  'apps/web/src/components/stories/StoryViewer.tsx',
  'apps/web/src/components/enhanced/ProgressiveImage.tsx',
])

const CATEGORY_PATTERNS = {
  'Core Views': [
    /\/views\/(Matches|Adoption|LostFound|Map|Notifications|SavedPosts|UserPosts|AdoptionMarketplace)View\.tsx$/,
  ],
  'Chat Components': [
    /\/chat\/.*\.tsx$/,
  ],
  'Enhanced Components': [
    /\/enhanced\/.*\.tsx$/,
  ],
  'Admin Panels': [
    /\/admin\/.*\.tsx$/,
  ],
  'Stories': [
    /\/stories\/.*\.tsx$/,
  ],
  'Adoption': [
    /\/adoption\/.*\.tsx$/,
  ],
  'Verification': [
    /\/verification\/.*\.tsx$/,
    /\/Verification.*\.tsx$/,
  ],
  'Auth': [
    /\/auth\/.*\.tsx$/,
    /\/AuthScreen\.tsx$/,
    /\/AgeGateModal\.tsx$/,
  ],
  'Community': [
    /\/community\/.*\.tsx$/,
  ],
  'Maps': [
    /\/maps\/.*\.tsx$/,
  ],
  'Playdate': [
    /\/playdate\/.*\.tsx$/,
  ],
  'Effects/Utils': [
    /\/effects\/.*\.tsx?$/,
  ],
  'Other Components': [
    // Catch-all for remaining components
  ],
}

const PRIORITY_MAP = {
  'Core Views': 1,
  'Chat Components': 2,
  'Enhanced Components': 3,
  'Admin Panels': 4,
  'Stories': 5,
  'Adoption': 6,
  'Verification': 7,
  'Auth': 8,
  'Community': 9,
  'Maps': 10,
  'Playdate': 11,
  'Effects/Utils': 12,
  'Other Components': 13,
}

function findFiles(dir, extensions = ['.tsx', '.ts']) {
  const files = []

  try {
    const entries = readdirSync(dir)

    for (const entry of entries) {
      const fullPath = join(dir, entry)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        // Skip node_modules and other ignored directories
        if (['node_modules', '.git', 'dist', 'build', '.next'].includes(entry)) {
          continue
        }
        files.push(...findFiles(fullPath, extensions))
      } else if (stat.isFile()) {
        const ext = entry.substring(entry.lastIndexOf('.'))
        if (extensions.includes(ext)) {
          files.push(fullPath)
        }
      }
    }
  } catch {
    // Skip directories we can't read
  }

  return files
}

function analyzeFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const relativePath = relative(process.cwd(), filePath).replace(/\\/g, '/')

    // Check for Framer Motion imports
    const framerMotionPattern = /from\s+['"]framer-motion['"]|import\s+.*\s+from\s+['"]framer-motion['"]/g
    const petsparkMotionPattern = /from\s+['"]@petspark\/motion['"]|import\s+.*\s+from\s+['"]@petspark\/motion['"]/g

    const hasFramerMotion = framerMotionPattern.test(content)
    const hasPetsparkMotion = petsparkMotionPattern.test(content)

    if (!hasFramerMotion && !hasPetsparkMotion) {
      return null
    }

    // Extract imports
    const imports = []
    const importMatches = [
      ...content.matchAll(/import\s+{([^}]+)}\s+from\s+['"](framer-motion|@petspark\/motion)['"]/g),
      ...content.matchAll(/import\s+(\w+)\s+from\s+['"](framer-motion|@petspark\/motion)['"]/g),
    ]

    for (const match of importMatches) {
      if (match[1]) {
        const imported = match[1].split(',').map(s => s.trim())
        imports.push(...imported)
      }
    }

    // Count usage
    const motionUsagePatterns = [
      /<MotionView/g,
      /<MotionText/g,
      /<Presence/g,
      /<motion\./g,
      /<AnimatePresence/g,
      /MotionView/g,
      /MotionText/g,
      /Presence/g,
      /motion\./g,
    ]

    let usageCount = 0
    for (const pattern of motionUsagePatterns) {
      const matches = content.match(new RegExp(pattern.source, 'g'))
      if (matches) {
        usageCount += matches.length
      }
    }

    // Determine category
    let category = 'Other Components'
    for (const [cat, patterns] of Object.entries(CATEGORY_PATTERNS)) {
      if (patterns.length === 0 && category === 'Other Components') {
        continue // Skip catch-all for now
      }
      for (const pattern of patterns) {
        if (pattern.test(relativePath)) {
          category = cat
          break
        }
      }
      if (category !== 'Other Components') break
    }

    // Check if migrated (uses Reanimated)
    const hasReanimated = /from\s+['"]@\/effects\/reanimated|from\s+['"]react-native-reanimated['"]/g.test(content)
    const status = hasReanimated && !hasFramerMotion && !hasPetsparkMotion ? 'migrated' : 'pending'

    // Extract dependencies (simplified - look for component imports)
    const dependencies = []
    const componentImports = content.matchAll(/import\s+.*\s+from\s+['"](\.\.?\/.*)['"]/g)
    for (const match of componentImports) {
      dependencies.push(match[1])
    }

    return {
      path: relativePath,
      imports: [...new Set(imports)],
      usageCount,
      category,
      priority: PRIORITY_MAP[category] || 99,
      status: MIGRATED_FILES.has(relativePath) || status === 'migrated' ? 'migrated' : 'pending',
      dependencies,
    }
  } catch {
    return null
  }
}

function categorizeFiles(files) {
  const categorized = new Map()

  for (const file of files) {
    if (!categorized.has(file.category)) {
      categorized.set(file.category, [])
    }
    const categoryFiles = categorized.get(file.category)
    if (categoryFiles) {
      categoryFiles.push(file)
    }
  }

  return categorized
}

function calculateStats(files) {
  const total = files.length
  const migrated = files.filter(f => f.status === 'migrated').length
  const pending = total - migrated
  const progress = total > 0 ? Math.round((migrated / total) * 100) : 0

  return { total, migrated, pending, progress }
}

function generateReport(files) {
  const categorized = categorizeFiles(files)
  const overallStats = calculateStats(files)

  let report = '# Framer Motion Migration Status Report\n\n'
  report += `**Generated**: ${new Date().toISOString()}\n\n`
  report += `## Overall Progress\n\n`
  report += `- **Total Files**: ${overallStats.total}\n`
  report += `- **Migrated**: ${overallStats.migrated} (${overallStats.progress}%)\n`
  report += `- **Pending**: ${overallStats.pending} (${100 - overallStats.progress}%)\n\n`

  report += `## Breakdown by Category\n\n`
  report += `| Category | Total | Migrated | Pending | Progress |\n`
  report += `|----------|-------|----------|---------|----------|\n`

  const sortedCategories = Array.from(categorized.entries()).sort(
    (a, b) => PRIORITY_MAP[a[0]] - PRIORITY_MAP[b[0]]
  )

  for (const [category, categoryFiles] of sortedCategories) {
    const stats = calculateStats(categoryFiles)
    report += `| ${category} | ${stats.total} | ${stats.migrated} | ${stats.pending} | ${stats.progress}% |\n`
  }

  report += `\n## Detailed File List\n\n`

  for (const [category, categoryFiles] of sortedCategories) {
    const sortedFiles = categoryFiles.sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === 'migrated' ? -1 : 1
      }
      return a.priority - b.priority
    })

    report += `### ${category}\n\n`

    for (const file of sortedFiles) {
      const statusIcon = file.status === 'migrated' ? '✅' : '⏳'
      report += `- ${statusIcon} **${file.path}**\n`
      report += `  - Status: ${file.status}\n`
      report += `  - Imports: ${file.imports.join(', ') || 'none'}\n`
      report += `  - Usage Count: ${file.usageCount}\n`
      report += `  - Priority: ${file.priority}\n`
      if (file.dependencies.length > 0) {
        report += `  - Dependencies: ${file.dependencies.slice(0, 3).join(', ')}${file.dependencies.length > 3 ? '...' : ''}\n`
      }
      report += `\n`
    }
  }

  report += `\n## Migration Checklist\n\n`

  const pendingFiles = files.filter(f => f.status === 'pending')
  report += `### High Priority Files (${pendingFiles.filter(f => f.priority <= 3).length} files)\n\n`
  for (const file of pendingFiles.filter(f => f.priority <= 3).slice(0, 10)) {
    report += `- [ ] ${file.path}\n`
  }

  report += `\n### All Pending Files\n\n`
  for (const file of pendingFiles) {
    report += `- [ ] ${file.path}\n`
  }

  return report
}

function main() {
  const srcDir = join(process.cwd(), 'apps/web/src')
  const files = findFiles(srcDir)

  const fileInfos = []

  for (const file of files) {
    const info = analyzeFile(file)
    if (info) {
      fileInfos.push(info)
    }
  }

  // Sort by priority and status
  fileInfos.sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === 'migrated' ? -1 : 1
    }
    if (a.priority !== b.priority) {
      return a.priority - b.priority
    }
    return a.path.localeCompare(b.path)
  })

  const report = generateReport(fileInfos)

  console.log(report)

  // Write to file
  const reportPath = join(process.cwd(), 'MIGRATION_STATUS_REPORT.md')
  require('fs').writeFileSync(reportPath, report, 'utf-8')
  console.log(`\n✅ Report written to: ${reportPath}`)

  // Summary
  const stats = calculateStats(fileInfos)
  console.log(`\n📊 Summary:`)
  console.log(`   Total: ${stats.total} files`)
  console.log(`   Migrated: ${stats.migrated} (${stats.progress}%)`)
  console.log(`   Pending: ${stats.pending} (${100 - stats.progress}%)`)
}

main()
