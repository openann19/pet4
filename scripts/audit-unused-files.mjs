#!/usr/bin/env node
/**
 * Comprehensive Unused Files Audit Script
 *
 * Combines ts-prune, depcheck, AST analysis, and documentation audit
 * to identify unused files, dead code, and duplicate documentation.
 */

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, statSync } from 'node:fs'
import { join, dirname, relative, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'
import { globby } from 'globby'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const WORKSPACES = [
  { name: 'web', path: 'apps/web', hasTsPrune: true },
  { name: 'mobile', path: 'apps/mobile', hasTsPrune: false },
  { name: 'packages/shared', path: 'packages/shared', hasTsPrune: false },
  { name: 'packages/motion', path: 'packages/motion', hasTsPrune: false },
  { name: 'packages/chat-core', path: 'packages/chat-core', hasTsPrune: false },
  { name: 'packages/config', path: 'packages/config', hasTsPrune: false },
]

const results = {
  timestamp: new Date().toISOString(),
  workspaces: {},
  orphanedFiles: [],
  deadCode: [],
  duplicateDocs: [],
  unusedDeps: {},
  summary: {
    totalFiles: 0,
    orphanedFiles: 0,
    deadCodeExports: 0,
    duplicateDocs: 0,
    unusedDeps: 0,
  }
}

/**
 * Run ts-prune on a workspace
 */
function runTsPrune(workspacePath) {
  try {
    const output = execSync(
      `cd ${join(ROOT, workspacePath)} && pnpm tsprune 2>&1 || true`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    )
    const lines = output.split('\n').filter(line => line.trim())
    const unusedExports = []

    for (const line of lines) {
      if (line.includes(' - ') && !line.includes('used in module')) {
        const [file, exportName] = line.split(' - ')
        if (file && exportName) {
          unusedExports.push({
            file: file.trim(),
            export: exportName.trim(),
            workspace: workspacePath
          })
        }
      }
    }

    return unusedExports
  } catch {
    return []
  }
}

/**
 * Run depcheck on a workspace
 */
function runDepcheck(workspacePath) {
  try {
    const output = execSync(
      `cd ${join(ROOT, workspacePath)} && pnpm depcheck --skip-missing=true 2>&1 || true`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    )

    const unusedDeps = {
      dependencies: [],
      devDependencies: []
    }

    let currentSection = null
    for (const line of output.split('\n')) {
      if (line.includes('Unused dependencies')) {
        currentSection = 'dependencies'
      } else if (line.includes('Unused devDependencies')) {
        currentSection = 'devDependencies'
      } else if (currentSection && line.trim().startsWith('*')) {
        const dep = line.trim().replace('*', '').trim()
        if (dep) {
          unusedDeps[currentSection].push(dep)
        }
      }
    }

    return unusedDeps
  } catch {
    return { dependencies: [], devDependencies: [] }
  }
}

/**
 * Build import graph using AST analysis
 */
function buildImportGraph(workspacePath) {
  const project = new Project({
    tsConfigFilePath: join(ROOT, workspacePath, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: false,
  })

  const sourceFiles = project.getSourceFiles()
  const importGraph = new Map() // file -> Set of files it imports
  const reverseGraph = new Map() // file -> Set of files that import it

  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath()
    const relativePath = relative(join(ROOT, workspacePath), filePath)

    if (!importGraph.has(relativePath)) {
      importGraph.set(relativePath, new Set())
    }
    if (!reverseGraph.has(relativePath)) {
      reverseGraph.set(relativePath, new Set())
    }

    // Get all imports
    const imports = sourceFile.getImportDeclarations()
    for (const imp of imports) {
      const moduleSpecifier = imp.getModuleSpecifierValue()

      // Skip node_modules and external packages
      if (moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('/')) {
        try {
          const resolved = sourceFile.resolveImportSource(imp)
          if (resolved) {
            const resolvedPath = relative(join(ROOT, workspacePath), resolved.getFilePath())
            importGraph.get(relativePath).add(resolvedPath)

            if (!reverseGraph.has(resolvedPath)) {
              reverseGraph.set(resolvedPath, new Set())
            }
            reverseGraph.get(resolvedPath).add(relativePath)
          }
        } catch {
          // Ignore resolution errors
        }
      }
    }
  }

  return { importGraph, reverseGraph, sourceFiles }
}

/**
 * Find orphaned files (never imported)
 */
function findOrphanedFiles(workspacePath, reverseGraph, sourceFiles) {
  const orphaned = []
  const entryPoints = new Set([
    'index.ts', 'index.tsx', 'main.ts', 'main.tsx',
    'App.tsx', 'app.tsx', 'App.ts', 'app.ts',
    'vite.config.ts', 'vitest.config.ts', 'playwright.config.ts',
    'next.config.js', 'next.config.ts',
  ])

  for (const sourceFile of sourceFiles) {
    const filePath = sourceFile.getFilePath()
    const relativePath = relative(join(ROOT, workspacePath), filePath)
    const fileName = basename(filePath)

    // Skip entry points, config files, and test files
    if (
      entryPoints.has(fileName) ||
      fileName.includes('.test.') ||
      fileName.includes('.spec.') ||
      fileName.includes('.stories.') ||
      fileName.includes('.config.') ||
      fileName.includes('vite-env.d.ts')
    ) {
      continue
    }

    const importers = reverseGraph.get(relativePath) || new Set()

    // If no one imports this file and it's not an entry point, it's orphaned
    if (importers.size === 0) {
      // Check if it exports anything
      const exports = sourceFile.getExportedDeclarations()
      const exportAssignments = sourceFile.getExportAssignments()

      if (exports.size > 0 || exportAssignments.length > 0) {
        orphaned.push({
          file: relativePath,
          workspace: workspacePath,
          exports: Array.from(exports.keys()),
          reason: 'No imports found'
        })
      }
    }
  }

  return orphaned
}

/**
 * Audit markdown files for duplicates
 */
async function auditMarkdownFiles() {
  const mdFiles = await globby('**/*.md', {
    cwd: ROOT,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
  })

  const fileGroups = new Map()
  const duplicates = []

  for (const file of mdFiles) {
    const content = readFileSync(join(ROOT, file), 'utf-8')
    const lines = content.split('\n').slice(0, 10).join('\n') // First 10 lines as signature
    const size = statSync(join(ROOT, file)).size

    const key = `${lines.substring(0, 200)}_${size}`

    if (!fileGroups.has(key)) {
      fileGroups.set(key, [])
    }
    fileGroups.get(key).push(file)
  }

  // Find groups with multiple files (potential duplicates)
  for (const [_key, files] of fileGroups.entries()) {
    if (files.length > 1) {
      // Sort by path depth and date (if in filename)
      const sorted = files.sort((a, b) => {
        const aDepth = a.split('/').length
        const bDepth = b.split('/').length
        if (aDepth !== bDepth) return aDepth - bDepth
        return a.localeCompare(b)
      })

      // Keep the first one, mark others as duplicates
      for (let i = 1; i < sorted.length; i++) {
        duplicates.push({
          file: sorted[i],
          duplicateOf: sorted[0],
          reason: 'Similar content and size'
        })
      }
    }
  }

  // Also check for outdated status/migration docs
  const statusPatterns = [
    /status/i,
    /migration/i,
    /progress/i,
    /complete/i,
    /summary/i,
    /implementation/i,
    /fixes/i,
  ]

  const outdatedDocs = []
  for (const file of mdFiles) {
    const fileName = basename(file)
    const isStatusDoc = statusPatterns.some(pattern => pattern.test(fileName))

    if (isStatusDoc && !file.includes('docs/')) {
      // Check if it's likely outdated (in root or apps/)
      const content = readFileSync(join(ROOT, file), 'utf-8')
      const hasDate = /\d{4}-\d{2}-\d{2}/.test(content)
      const isOld = hasDate && content.match(/\d{4}-\d{2}-\d{2}/)?.[0] < '2024-12-01'

      if (isOld || (!hasDate && file.startsWith('apps/'))) {
        outdatedDocs.push({
          file,
          reason: 'Status/migration doc in non-docs directory or outdated date'
        })
      }
    }
  }

  return { duplicates, outdatedDocs }
}

/**
 * Main audit function
 */
async function runAudit() {
  console.log('🔍 Starting comprehensive unused files audit...\n')

  // 1. Run ts-prune and depcheck on each workspace
  console.log('📊 Running ts-prune and depcheck on workspaces...')
  for (const workspace of WORKSPACES) {
    console.log(`  - ${workspace.name}...`)

    const workspaceResults = {
      tsPrune: [],
      depcheck: { dependencies: [], devDependencies: [] },
      orphanedFiles: []
    }

    if (workspace.hasTsPrune) {
      workspaceResults.tsPrune = runTsPrune(workspace.path)
      results.deadCode.push(...workspaceResults.tsPrune)
    }

    try {
      workspaceResults.depcheck = runDepcheck(workspace.path)
      if (workspaceResults.depcheck.dependencies.length > 0 ||
          workspaceResults.depcheck.devDependencies.length > 0) {
        results.unusedDeps[workspace.name] = workspaceResults.depcheck
      }
    } catch {
      // Skip if depcheck not available
    }

    // 2. Build import graph and find orphaned files
    try {
      const { reverseGraph, sourceFiles } = buildImportGraph(workspace.path)
      workspaceResults.orphanedFiles = findOrphanedFiles(workspace.path, reverseGraph, sourceFiles)
      results.orphanedFiles.push(...workspaceResults.orphanedFiles)
    } catch (error) {
      console.log(`    ⚠️  Could not analyze ${workspace.name}: ${error.message}`)
    }

    results.workspaces[workspace.name] = workspaceResults
  }

  // 3. Audit markdown files
  console.log('\n📝 Auditing markdown files...')
  const { duplicates, outdatedDocs } = await auditMarkdownFiles()
  results.duplicateDocs.push(...duplicates, ...outdatedDocs)

  // 4. Calculate summary
  results.summary.totalFiles = results.orphanedFiles.length + results.deadCode.length
  results.summary.orphanedFiles = results.orphanedFiles.length
  results.summary.deadCodeExports = results.deadCode.length
  results.summary.duplicateDocs = results.duplicateDocs.length
  results.summary.unusedDeps = Object.values(results.unusedDeps).reduce(
    (sum, deps) => sum + deps.dependencies.length + deps.devDependencies.length,
    0
  )

  // 5. Write results
  const reportPath = join(ROOT, 'tmp', 'unused-files-audit.json')
  writeFileSync(reportPath, JSON.stringify(results, null, 2))

  // 6. Generate markdown report
  generateMarkdownReport(results)

  console.log('\n✅ Audit complete!')
  console.log(`📄 JSON report: ${reportPath}`)
  console.log(`📄 Markdown report: ${join(ROOT, 'UNUSED_FILES_AUDIT_REPORT.md')}`)

  return results
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(data) {
  let report = `# Unused Files Audit Report\n\n`
  report += `**Generated:** ${data.timestamp}\n\n`
  report += `## Summary\n\n`
  report += `- **Orphaned Files:** ${data.summary.orphanedFiles}\n`
  report += `- **Dead Code Exports:** ${data.summary.deadCodeExports}\n`
  report += `- **Duplicate/Outdated Docs:** ${data.summary.duplicateDocs}\n`
  report += `- **Unused Dependencies:** ${data.summary.unusedDeps}\n\n`

  if (data.orphanedFiles.length > 0) {
    report += `## Orphaned Files (${data.orphanedFiles.length})\n\n`
    report += `Files that are never imported anywhere:\n\n`
    for (const file of data.orphanedFiles.slice(0, 50)) {
      report += `- \`${file.file}\` (${file.workspace}) - ${file.reason}\n`
    }
    if (data.orphanedFiles.length > 50) {
      report += `\n... and ${data.orphanedFiles.length - 50} more\n\n`
    }
  }

  if (data.deadCode.length > 0) {
    report += `## Dead Code Exports (${data.deadCode.length})\n\n`
    report += `Unused exports detected by ts-prune:\n\n`
    const grouped = new Map()
    for (const item of data.deadCode) {
      if (!grouped.has(item.file)) {
        grouped.set(item.file, [])
      }
      grouped.get(item.file).push(item.export)
    }

    for (const [file, exports] of Array.from(grouped.entries()).slice(0, 30)) {
      report += `- \`${file}\`\n`
      for (const exp of exports.slice(0, 5)) {
        report += `  - ${exp}\n`
      }
      if (exports.length > 5) {
        report += `  - ... and ${exports.length - 5} more\n`
      }
    }
    if (grouped.size > 30) {
      report += `\n... and ${grouped.size - 30} more files\n\n`
    }
  }

  if (data.duplicateDocs.length > 0) {
    report += `## Duplicate/Outdated Documentation (${data.duplicateDocs.length})\n\n`
    for (const doc of data.duplicateDocs.slice(0, 50)) {
      report += `- \`${doc.file}\` - ${doc.reason}`
      if (doc.duplicateOf) {
        report += ` (duplicate of \`${doc.duplicateOf}\`)`
      }
      report += `\n`
    }
    if (data.duplicateDocs.length > 50) {
      report += `\n... and ${data.duplicateDocs.length - 50} more\n\n`
    }
  }

  if (Object.keys(data.unusedDeps).length > 0) {
    report += `## Unused Dependencies\n\n`
    for (const [workspace, deps] of Object.entries(data.unusedDeps)) {
      if (deps.dependencies.length > 0 || deps.devDependencies.length > 0) {
        report += `### ${workspace}\n\n`
        if (deps.dependencies.length > 0) {
          report += `**Dependencies:**\n`
          for (const dep of deps.dependencies) {
            report += `- ${dep}\n`
          }
          report += `\n`
        }
        if (deps.devDependencies.length > 0) {
          report += `**Dev Dependencies:**\n`
          for (const dep of deps.devDependencies) {
            report += `- ${dep}\n`
          }
          report += `\n`
        }
      }
    }
  }

  const reportPath = join(ROOT, 'UNUSED_FILES_AUDIT_REPORT.md')
  writeFileSync(reportPath, report)
}

// Run audit
runAudit().catch(error => {
  console.error('❌ Audit failed:', error)
  process.exit(1)
})
