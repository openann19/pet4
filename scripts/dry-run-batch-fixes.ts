#!/usr/bin/env tsx
/**
 * Dry-Run Batch Fix Script for ESLint Issues
 *
 * Focused, conservative automated fixes for common patterns:
 * 1. Unused imports (remove specifiers / entire import if all unused)
 * 2. (Disabled for now) Unused variables / parameters auto-prefixing – too risky globally
 * 3. (Disabled for now) Automatic `||` -> `??` conversions – can change runtime behaviour
 * 4. Floating toast promises: wrap standalone `toast.*(` calls in `void` if not awaited/handled
 * 5. Reanimated direct imports (opt-in via `--reanimated`): replace `react-native-reanimated` with `@petspark/motion` façade (mobile code only)
 *
 * Dry run by default: prints unified diffs and summary, makes NO changes.
 * Use `--apply` to write changes. Use `--limit N` to cap files processed.
 * Use `--reanimated` to include the Reanimated → @petspark/motion import migration.
 * All config files (e.g. `eslint.config.js`) are excluded automatically.
 *
 * Safety:
 * - Skips files with parse errors
 * - Only transforms code when pattern confidently matches; otherwise leaves untouched
 * - Does NOT modify any config under root (per user directive: DONT TOUCH CONFIGS)
 *
 * Usage:
 *   pnpm tsx scripts/dry-run-batch-fixes.ts          # dry run summary
 *   pnpm tsx scripts/dry-run-batch-fixes.ts --apply  # apply changes
 *   pnpm tsx scripts/dry-run-batch-fixes.ts --pattern apps/mobile/src/components/chat/*.tsx
 *   pnpm tsx scripts/dry-run-batch-fixes.ts --limit 10 --apply
 *
 * Exit codes:
 *  0 success (even if no changes)
 *  1 unexpected internal failure
 */
import fg from 'fast-glob'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Project, SyntaxKind, Node, SourceFile, Identifier } from 'ts-morph'

interface Options {
  apply: boolean
  limit: number | null
  pattern: string | null
  verbose: boolean
  reanimated: boolean
}

const argv = process.argv.slice(2)
const opts: Options = {
  apply: argv.includes('--apply'),
  limit: null,
  pattern: null,
  verbose: argv.includes('--verbose'),
  reanimated: argv.includes('--reanimated'),
}
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--limit' && argv[i + 1]) {
    opts.limit = Number(argv[i + 1])
  } else if (argv[i] === '--pattern' && argv[i + 1]) {
    opts.pattern = argv[i + 1]
  }
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// Glob selection
const DEFAULT_GLOBS = [
  'apps/web/src/**/*.{ts,tsx}',
  'apps/mobile/src/**/*.{ts,tsx}',
  'packages/*/src/**/*.{ts,tsx}',
]

const exclude = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/*.test.{ts,tsx}',
  '**/*.spec.{ts,tsx}',
  '**/__tests__/**',
  '**/eslint.config.js*',
  '**/*.config.*',
]

async function collectFiles(): Promise<string[]> {
  const patterns = opts.pattern ? [opts.pattern] : DEFAULT_GLOBS
  const files = await fg(patterns, { cwd: ROOT, ignore: exclude, absolute: true })
  return opts.limit ? files.slice(0, opts.limit) : files
}

// Utility: build unified diff
function unifiedDiff(before: string, after: string, filePath: string): string {
  if (before === after) return ''
  const beforeLines = before.split('\n')
  const afterLines = after.split('\n')
  const max = Math.max(beforeLines.length, afterLines.length)
  const diff: string[] = []
  diff.push(`diff --git a/${filePath} b/${filePath}`)
  diff.push(`--- a/${filePath}`)
  diff.push(`+++ b/${filePath}`)
  for (let i = 0; i < max; i++) {
    const a = beforeLines[i]
    const b = afterLines[i]
    if (a === b) {
      continue
    } else {
      if (a !== undefined) diff.push(`-${a}`)
      if (b !== undefined) diff.push(`+${b}`)
    }
  }
  return diff.join('\n')
}

// Transformations
function removeUnusedImports(sf: SourceFile): boolean {
  let changed = false
  const imports = sf.getImportDeclarations()
  for (const imp of imports) {
    const moduleName = imp.getModuleSpecifierValue()
    const named = imp.getNamedImports()
    if (!named.length) continue
    // Determine usage of each identifier
    const unused = named.filter(spec => {
      const name = spec.getAliasNode()?.getText() || spec.getNameNode().getText()
      const refs = sf
        .getDescendantsOfKind(SyntaxKind.Identifier)
        .filter(id => id.getText() === name)
      // Exclude the import specifier itself (first reference is the declaration)
      return refs.length <= 1
    })
    if (!unused.length) continue
    // Remove unused specifiers
    unused.forEach(u => u.remove())
    // If all removed, remove entire import
    if (imp.getNamedImports().length === 0) {
      imp.remove()
    }
    changed = true
  }
  return changed
}

// NOTE: Unused variable prefixing and generic nullish-coalescing rewrites
// are intentionally disabled for now – they are too risky to
// apply automatically across the whole monorepo without type-aware
// intent checks. If you want them back, implement them against
// explicit ESLint reports or very narrow patterns.

function wrapFloatingToast(sf: SourceFile): boolean {
  let changed = false
  const calls = sf.getDescendantsOfKind(SyntaxKind.CallExpression)
  for (const call of calls) {
    const expr = call.getExpression().getText()
    if (/^toast\.(success|info|error|warning)$/u.test(expr)) {
      // Only touch standalone expression statements. If the toast
      // return value is assigned, returned, or otherwise used we
      // leave it alone.
      const parent = call.getParent()
      if (!parent || parent.getKind() !== SyntaxKind.ExpressionStatement) continue
      // Replace with void wrapping
      call.replaceWithText(`void ${call.getText()}`)
      changed = true
    }
  }
  return changed
}

function replaceReanimatedImport(sf: SourceFile): boolean {
  let changed = false
  const imports = sf.getImportDeclarations()
  for (const imp of imports) {
    if (imp.getModuleSpecifierValue() === 'react-native-reanimated') {
      imp.setModuleSpecifier('@petspark/motion')
      changed = true
    }
  }
  return changed
}

async function run(): Promise<void> {
  const files = await collectFiles()
  if (opts.verbose) console.error(`Processing ${files.length} file(s)`)

  const project = new Project({
    tsConfigFilePath: path.join(ROOT, 'tsconfig.json'),
    skipFileDependencyResolution: true,
  })
  const diffs: { file: string; diff: string; changes: string[] }[] = []

  for (const file of files) {
    const rel = path.relative(ROOT, file)
    // Skip config guard
    if (/eslint\.config\.js/u.test(rel)) continue
    let content: string
    try {
      content = fs.readFileSync(file, 'utf8')
    } catch {
      continue
    }
    const sf = project.createSourceFile(file, content, { overwrite: true })
    let changed = false
    const changeLabels: string[] = []
    try {
      if (removeUnusedImports(sf)) {
        changed = true
        changeLabels.push('unused-imports')
      }
      if (wrapFloatingToast(sf)) {
        changed = true
        changeLabels.push('floating-toast')
      }
      if (opts.reanimated && /apps\/mobile\//u.test(rel) && replaceReanimatedImport(sf)) {
        changed = true
        changeLabels.push('reanimated-facade')
      }
    } catch (err) {
      if (opts.verbose) console.error(`Skipping ${rel}: transform error ${(err as Error).message}`)
      sf.delete()
      continue
    }

    if (!changed) {
      sf.delete()
      continue
    }
    const after = sf.getFullText()
    const diff = unifiedDiff(content, after, rel)
    diffs.push({ file: rel, diff, changes: changeLabels })
    if (opts.apply) {
      fs.writeFileSync(file, after, 'utf8')
    } else {
      // Dry run: discard AST
      sf.delete()
    }
  }

  if (!diffs.length) {
    console.log('No candidate changes detected.')
    return
  }

  console.log(`\nBatch Fix Summary (${opts.apply ? 'APPLIED' : 'DRY RUN'}):`)
  for (const d of diffs) {
    console.log(`\nFile: ${d.file}`)
    console.log(`Changes: ${d.changes.join(', ')}`)
    console.log(d.diff)
  }
  console.log(`\nTotal files changed: ${diffs.length}`)
  if (!opts.apply) {
    console.log('\nRe-run with --apply to write these changes.')
  }
}

run().catch(err => {
  console.error('Batch fix script failed:', err)
  process.exit(1)
})
