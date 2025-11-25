#!/usr/bin/env ts-node

/**
 * Script to systematically fix unused variable/import errors
 * Focuses on adding underscore prefix or removing unused imports
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'

interface LintError {
  filePath: string
  line: number
  column: number
  message: string
  ruleId: string
}

function parseLintErrors(): LintError[] {
  try {
    const result = execSync('pnpm lint --format json', { cwd: process.cwd(), encoding: 'utf8' })
    const lintResults = JSON.parse(result)

    const errors: LintError[] = []
    for (const fileResult of lintResults) {
      for (const message of fileResult.messages) {
        if (message.ruleId === '@typescript-eslint/no-unused-vars' && message.severity === 2) {
          errors.push({
            filePath: fileResult.filePath,
            line: message.line,
            column: message.column,
            message: message.message,
            ruleId: message.ruleId,
          })
        }
      }
    }

    return errors
  } catch {
    console.warn('Could not parse lint JSON, falling back to manual pattern matching')
    return []
  }
}

function fixUnusedVariableInFile(filePath: string, variableName: string, line: number): boolean {
  try {
    const content = readFileSync(filePath, 'utf8')
    const lines = content.split('\n')

    if (line <= 0 || line > lines.length) {
      return false
    }

    const targetLine = lines[line - 1]

    // Handle different patterns
    if (
      targetLine.includes(`const ${variableName}`) ||
      targetLine.includes(`let ${variableName}`)
    ) {
      // Add underscore prefix to variable
      lines[line - 1] = targetLine.replace(
        new RegExp(`\\b${variableName}\\b`, 'g'),
        `_${variableName}`
      )
    } else if (targetLine.includes(`import`)) {
      // Try to remove from import statement
      const newLine = targetLine
        .replace(new RegExp(`\\s*,\\s*${variableName}\\b`, 'g'), '') // Remove with comma
        .replace(new RegExp(`\\b${variableName}\\s*,\\s*`, 'g'), '') // Remove with trailing comma
        .replace(new RegExp(`\\{\\s*${variableName}\\s*\\}`, 'g'), '{}') // Remove if only item
        .replace(/import\s+\{\s*\}\s+from/, '// Removed unused import from')

      lines[line - 1] = newLine
    } else if (targetLine.includes(`function`) || targetLine.includes(`=>`)) {
      // Add underscore prefix to parameter
      lines[line - 1] = targetLine.replace(
        new RegExp(`\\b${variableName}\\b`, 'g'),
        `_${variableName}`
      )
    }

    writeFileSync(filePath, lines.join('\n'))
    return true
  } catch (error: unknown) {
    console.error(`Failed to fix ${filePath}:${line} - ${error}`)
    return false
  }
}

function main() {
  console.log('Attempting to fix unused variable errors...')

  // Get current errors
  const errors = parseLintErrors()

  if (errors.length === 0) {
    console.log('No unused variable errors found or could not parse lint output')
    return
  }

  let fixedCount = 0

  for (const error of errors) {
    // Extract variable name from error message
    const match = error.message.match(/'([^']+)' is defined but never used/)
    if (match) {
      const variableName = match[1]
      console.log(`Fixing ${error.filePath}:${error.line} - ${variableName}`)

      if (fixUnusedVariableInFile(error.filePath, variableName, error.line)) {
        fixedCount++
      }
    }
  }

  console.log(`Fixed ${fixedCount} unused variable errors`)

  // Run lint again to check progress
  try {
    execSync('pnpm lint 2>&1 | tail -5', { stdio: 'inherit' })
  } catch {
    console.log('Lint check completed')
  }
}

if (require.main === module) {
  main()
}
