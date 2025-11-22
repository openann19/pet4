#!/usr/bin/env node
/**
 * Safe File Removal Script
 * 
 * Removes files identified as unused, with safety checks
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

// Read audit results
const auditData = JSON.parse(readFileSync(join(ROOT, 'tmp/unused-files-audit.json'), 'utf-8'))

// Categories of files to remove
const filesToRemove = {
  // Safe to remove: Documentation files
  docs: [],
  
  // Review before removing: Source files
  source: [],
  
  // Safe to remove: Unused dependencies (will update package.json)
  deps: []
}

// Filter out false positives from orphaned files
function isFalsePositive(file) {
  // Skip package files - they're imported via workspace references
  if (file.includes('../../packages/')) {
    return true
  }
  
  // Skip config files - they're used by build tools
  if (file.includes('.config.') || file.includes('config/')) {
    return true
  }
  
  // Skip test files
  if (file.includes('.test.') || file.includes('.spec.')) {
    return true
  }
  
  // Skip entry points
  if (file.includes('index.ts') || file.includes('main.ts') || file.includes('App.tsx')) {
    return true
  }
  
  // Skip API files - they might be used dynamically
  if (file.includes('/api/') && file.endsWith('-api.ts')) {
    // Check if it's actually used
    return false // Will check manually
  }
  
  return false
}

// Categorize files for removal
function categorizeFiles() {
  // 1. Documentation files - safe to remove
  for (const doc of auditData.duplicateDocs) {
    if (doc.file.endsWith('.md')) {
      const fullPath = join(ROOT, doc.file)
      if (existsSync(fullPath)) {
        filesToRemove.docs.push({
          path: doc.file,
          fullPath,
          reason: doc.reason,
          duplicateOf: doc.duplicateOf
        })
      }
    }
  }
  
  // 2. Source files - need review
  for (const file of auditData.orphanedFiles) {
    if (!isFalsePositive(file.file)) {
      const fullPath = join(ROOT, file.workspace, file.file)
      if (existsSync(fullPath)) {
        filesToRemove.source.push({
          path: file.file,
          fullPath,
          workspace: file.workspace,
          reason: file.reason
        })
      }
    }
  }
  
  // 3. Unused dependencies
  for (const [workspace, deps] of Object.entries(auditData.unusedDeps)) {
    filesToRemove.deps.push({
      workspace,
      dependencies: deps.dependencies || [],
      devDependencies: deps.devDependencies || []
    })
  }
}

// Generate removal plan
function generateRemovalPlan() {
  categorizeFiles()
  
  const plan = {
    timestamp: new Date().toISOString(),
    summary: {
      docsToRemove: filesToRemove.docs.length,
      sourceFilesToReview: filesToRemove.source.length,
      workspacesWithUnusedDeps: filesToRemove.deps.length
    },
    docs: filesToRemove.docs,
    sourceFiles: filesToRemove.source.slice(0, 100), // First 100 for review
    dependencies: filesToRemove.deps
  }
  
  writeFileSync(
    join(ROOT, 'tmp/removal-plan.json'),
    JSON.stringify(plan, null, 2)
  )
  
  // Generate markdown report
  let report = `# File Removal Plan\n\n`
  report += `**Generated:** ${plan.timestamp}\n\n`
  report += `## Summary\n\n`
  report += `- **Documentation files to remove:** ${plan.summary.docsToRemove}\n`
  report += `- **Source files to review:** ${plan.summary.sourceFilesToReview}\n`
  report += `- **Workspaces with unused dependencies:** ${plan.summary.workspacesWithUnusedDeps}\n\n`
  
  report += `## Documentation Files (Safe to Remove)\n\n`
  report += `These are duplicate or outdated documentation files:\n\n`
  for (const doc of plan.docs.slice(0, 50)) {
    report += `- \`${doc.path}\`\n`
    report += `  - Reason: ${doc.reason}\n`
    if (doc.duplicateOf) {
      report += `  - Duplicate of: \`${doc.duplicateOf}\`\n`
    }
    report += `\n`
  }
  if (plan.docs.length > 50) {
    report += `... and ${plan.docs.length - 50} more documentation files\n\n`
  }
  
  report += `## Source Files (Review Before Removing)\n\n`
  report += `These source files appear unused but need manual review:\n\n`
  for (const file of plan.sourceFiles.slice(0, 30)) {
    report += `- \`${file.path}\` (${file.workspace})\n`
    report += `  - Reason: ${file.reason}\n\n`
  }
  if (plan.sourceFiles.length > 30) {
    report += `... and ${plan.sourceFiles.length - 30} more files\n\n`
  }
  
  report += `## Unused Dependencies\n\n`
  for (const dep of plan.dependencies) {
    report += `### ${dep.workspace}\n\n`
    if (dep.dependencies.length > 0) {
      report += `**Dependencies:**\n`
      for (const d of dep.dependencies) {
        report += `- ${d}\n`
      }
      report += `\n`
    }
    if (dep.devDependencies.length > 0) {
      report += `**Dev Dependencies:**\n`
      for (const d of dep.devDependencies) {
        report += `- ${d}\n`
      }
      report += `\n`
    }
  }
  
  writeFileSync(
    join(ROOT, 'REMOVAL_PLAN.md'),
    report
  )
  
  console.log(`✅ Removal plan generated:`)
  console.log(`   - JSON: tmp/removal-plan.json`)
  console.log(`   - Markdown: REMOVAL_PLAN.md`)
  console.log(`\n📊 Summary:`)
  console.log(`   - ${plan.summary.docsToRemove} documentation files`)
  console.log(`   - ${plan.summary.sourceFilesToReview} source files to review`)
  console.log(`   - ${plan.summary.workspacesWithUnusedDeps} workspaces with unused deps`)
}

generateRemovalPlan()

