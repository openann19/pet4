#!/usr/bin/env node

import { readFile } from 'fs/promises'
import { generateSpecReport, generateAiPrompts } from '@petspark/spec-observability'

async function main(): Promise<void> {
  const mergedSpecFile = process.argv[2] ?? '.appspec.merged.json'

  try {
    await generateSpecReport(mergedSpecFile, 'SPEC_REPORT.md')
    await generateAiPrompts(mergedSpecFile, 'AI_PROMPTS.md')
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error('Failed to generate reports:', err.message)
    process.exit(1)
  }
}

void main()
