#!/usr/bin/env node
/**
 * Migration Progress Tracker
 * 
 * Automatically tracks Framer Motion to React Reanimated migration progress
 * Run: node scripts/track-motion-migration.js
 */

import { readFileSync, writeFileSync } from 'fs'
import { execSync } from 'child_process'
import { join } from 'path'

const ROOT_DIR = process.cwd()
const WEB_SRC = join(ROOT_DIR, 'apps/web/src')

interface FileStatus {
  file: string
  status: 'migrated' | 'pending' | 'partial'
  framerMotionImports: number
  reanimatedImports: number
  motionComponents: string[]
  priority: 'P0' | 'P1' | 'P2' | 'P3'
  category: string
}

function getCategory(filePath: string): string {
  if (filePath.includes('/admin/')) return 'Admin'
  if (filePath.includes('/adoption/')) return 'Adoption'
  if (filePath.includes('/auth/')) return 'Auth'
  if (filePath.includes('/chat/')) return 'Chat'
  if (filePath.includes('/community/')) return 'Community'
  if (filePath.includes('/enhanced/')) return 'Enhanced'
  if (filePath.includes('/lost-found/')) return 'LostFound'
  if (filePath.includes('/maps/')) return 'Maps'
  if (filePath.includes('/notifications/')) return 'Notifications'
  if (filePath.includes('/playdate/')) return 'Playdate'
  if (filePath.includes('/stories/')) return 'Stories'
  if (filePath.includes('/streaming/')) return 'Streaming'
  if (filePath.includes('/verification/')) return 'Verification'
  if (filePath.includes('/views/')) return 'Views'
  if (filePath.includes('/effects/')) return 'Effects'
  if (filePath.includes('/ui/')) return 'UI'
  return 'Other'
}

function getPriority(filePath: string, category: string): 'P0' | 'P1' | 'P2' | 'P3' {
  // P0: Critical user-facing components
  if (category === 'Auth' || category === 'Views') return 'P0'
  if (filePath.includes('AuthScreen') || filePath.includes('WelcomeScreen')) return 'P0'
  if (filePath.includes('CreatePetDialog') || filePath.includes('PetDetailDialog')) return 'P0'
  if (filePath.includes('MatchCelebration') || filePath.includes('LoadingState')) return 'P0'
  if (filePath.includes('ChatWindowNew')) return 'P0'
  
  // P1: Important features
  if (category === 'Enhanced' || category === 'Stories' || category === 'Adoption') return 'P1'
  if (category === 'Verification' || category === 'Community') return 'P1'
  if (category === 'Chat' || category === 'Maps' || category === 'Playdate') return 'P1'
  
  // P2: Secondary features
  if (category === 'Effects' || category === 'UI') return 'P2'
  
  // P3: Admin and utilities
  if (category === 'Admin') return 'P3'
  
  return 'P1'
}

function analyzeFile(filePath: string): FileStatus {
  const content = readFileSync(filePath, 'utf-8')
  
  const framerMotionImports = (content.match(/from\s+['"]framer-motion['"]/g) || []).length
  const petsparkMotionImports = (content.match(/from\s+['"]@petspark\/motion['"]/g) || []).length
  const reanimatedImports = (content.match(/from\s+['"]@\/effects\/reanimated|from\s+['"]react-native-reanimated['"]/g) || []).length
  
  const motionComponents: string[] = []
  if (content.includes('MotionView')) motionComponents.push('MotionView')
  if (content.includes('MotionText')) motionComponents.push('MotionText')
  if (content.includes('AnimatePresence') || content.includes('Presence')) motionComponents.push('Presence')
  if (content.includes('motion.')) motionComponents.push('motion.*')
  
  const category = getCategory(filePath)
  const priority = getPriority(filePath, category)
  
  let status: 'migrated' | 'pending' | 'partial' = 'pending'
  if (framerMotionImports === 0 && petsparkMotionImports === 0 && reanimatedImports > 0) {
    status = 'migrated'
  } else if (reanimatedImports > 0 && (framerMotionImports > 0 || petsparkMotionImports > 0)) {
    status = 'partial'
  }
  
  return {
    file: filePath.replace(ROOT_DIR + '/', ''),
    status,
    framerMotionImports: framerMotionImports + petsparkMotionImports,
    reanimatedImports,
    motionComponents,
    priority,
    category
  }
}

function findMotionFiles(): string[] {
  try {
    const result = execSync(
      `grep -r "from ['\"]framer-motion['\"]\\|from ['\"]@petspark/motion['\"]" ${WEB_SRC} --include="*.tsx" --include="*.ts" | grep -v "\\.test\\." | grep -v "\\.native\\." | cut -d: -f1 | sort -u`,
      { encoding: 'utf-8', cwd: ROOT_DIR }
    )
    return result.trim().split('\n').filter(Boolean)
  } catch (error) {
    return []
  }
}

function generateReport(statuses: FileStatus[]): string {
  const byStatus = {
    migrated: statuses.filter(s => s.status === 'migrated'),
    partial: statuses.filter(s => s.status === 'partial'),
    pending: statuses.filter(s => s.status === 'pending')
  }
  
  const byCategory = statuses.reduce((acc, status) => {
    if (!acc[status.category]) acc[status.category] = []
    acc[status.category].push(status)
    return acc
  }, {} as Record<string, FileStatus[]>)
  
  const byPriority = statuses.reduce((acc, status) => {
    if (!acc[status.priority]) acc[status.priority] = []
    acc[status.priority].push(status)
    return acc
  }, {} as Record<string, FileStatus[]>)
  
  const total = statuses.length
  const migrated = byStatus.migrated.length
  const partial = byStatus.partial.length
  const pending = byStatus.pending.length
  const progress = ((migrated / total) * 100).toFixed(1)
  
  let report = `# Migration Progress Report\n\n`
  report += `**Generated:** ${new Date().toISOString()}\n\n`
  report += `## Summary\n\n`
  report += `- **Total Files:** ${total}\n`
  report += `- **Migrated:** ${migrated} (${progress}%)\n`
  report += `- **Partially Migrated:** ${partial}\n`
  report += `- **Pending:** ${pending}\n\n`
  
  report += `## By Priority\n\n`
  for (const [priority, files] of Object.entries(byPriority).sort()) {
    const migratedCount = files.filter(f => f.status === 'migrated').length
    report += `### ${priority} (${files.length} files, ${migratedCount} migrated)\n\n`
  }
  
  report += `## By Category\n\n`
  for (const [category, files] of Object.entries(byCategory).sort()) {
    const migratedCount = files.filter(f => f.status === 'migrated').length
    report += `### ${category} (${files.length} files, ${migratedCount} migrated)\n\n`
    for (const file of files) {
      const statusIcon = file.status === 'migrated' ? '✅' : file.status === 'partial' ? '🚧' : '⏳'
      report += `- ${statusIcon} \`${file.file}\` [${file.priority}]\n`
    }
    report += '\n'
  }
  
  report += `## Pending Files Detail\n\n`
  for (const file of byStatus.pending) {
    report += `### ${file.file}\n\n`
    report += `- **Category:** ${file.category}\n`
    report += `- **Priority:** ${file.priority}\n`
    report += `- **Framer Motion Imports:** ${file.framerMotionImports}\n`
    report += `- **Motion Components:** ${file.motionComponents.join(', ') || 'None'}\n\n`
  }
  
  return report
}

function main() {
  console.log('🔍 Scanning for Framer Motion usage...\n')
  
  const files = findMotionFiles()
  console.log(`Found ${files.length} files with Framer Motion usage\n`)
  
  console.log('📊 Analyzing files...\n')
  const statuses = files.map(analyzeFile)
  
  const report = generateReport(statuses)
  
  const reportPath = join(ROOT_DIR, 'MIGRATION_PROGRESS_REPORT.md')
  writeFileSync(reportPath, report)
  
  console.log(`✅ Report generated: ${reportPath}\n`)
  
  // Print summary
  const migrated = statuses.filter(s => s.status === 'migrated').length
  const partial = statuses.filter(s => s.status === 'partial').length
  const pending = statuses.filter(s => s.status === 'pending').length
  
  console.log('📈 Summary:')
  console.log(`   ✅ Migrated: ${migrated}`)
  console.log(`   🚧 Partial: ${partial}`)
  console.log(`   ⏳ Pending: ${pending}`)
  console.log(`   📊 Progress: ${((migrated / statuses.length) * 100).toFixed(1)}%\n`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

