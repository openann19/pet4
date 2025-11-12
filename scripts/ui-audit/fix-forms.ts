/**
 * Auto-Fix: Form Inputs & States
 * Standardizes form inputs, states, and accessibility
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SOURCE_DIRS = [
  join(process.cwd(), 'apps/web/src'),
  join(process.cwd(), 'apps/mobile/src'),
];

interface Fix {
  file: string;
  line: number;
  original: string;
  replacement: string;
}

function fixFormsInFile(filePath: string): Fix[] {
  const fixes: Fix[] = [];

  try {
    const content = readFileSync(filePath, 'utf-8');
    let newContent = content;
    let modified = false;

    // Pattern: Ensure inputs have labels
    const inputPattern = /<input\s+([^>]*)>/g;
    let match;

    while ((match = inputPattern.exec(content)) !== null) {
      const fullMatch = match[0];
      const attrs = match[1];

      // Check for id and aria-label
      const hasId = attrs.includes('id=');
      const hasAriaLabel = attrs.includes('aria-label=') || attrs.includes('aria-labelledby=');

      if (!hasId && !hasAriaLabel) {
        // Suggest adding label (would need AST for proper fix)
      }
    }

    // Pattern: Add focus-visible to inputs
    const inputWithClassPattern = /<input\s+([^>]*)(?:className|class)=["']([^"']*)["']([^>]*)>/g;

    while ((match = inputWithClassPattern.exec(content)) !== null) {
      const fullMatch = match[0];
      const className = match[2];

      if (!className.includes('focus-visible')) {
        const newClassName = className + ' focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-[var(--background)]';
        const replacement = fullMatch.replace(`class="${className}"`, `class="${newClassName}"`).replace(`className="${className}"`, `className="${newClassName}"`);

        fixes.push({
          file: filePath,
          line: content.slice(0, match.index).split('\n').length,
          original: fullMatch,
          replacement,
        });

        newContent = newContent.replace(fullMatch, replacement);
        modified = true;
      }
    }

    if (modified) {
      writeFileSync(filePath, newContent, 'utf-8');
    }
  } catch {
    // File might not be readable, skip
  }

  return fixes;
}

function processDirectory(dir: string, extensions: string[] = ['.ts', '.tsx', '.js', '.jsx']): Fix[] {
  const fixes: Fix[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!['node_modules', 'dist', 'build', '.next'].includes(entry.name)) {
          fixes.push(...processDirectory(fullPath, extensions));
        }
      } else if (entry.isFile()) {
        const ext = entry.name.slice(entry.name.lastIndexOf('.'));
        if (extensions.includes(ext)) {
          fixes.push(...fixFormsInFile(fullPath));
        }
      }
    }
  } catch {
    // Directory might not be accessible, skip
  }

  return fixes;
}

function runFix(): void {
  console.log('Running auto-fix: Form inputs & states...');

  const allFixes: Fix[] = [];

  for (const dir of SOURCE_DIRS) {
    console.log(`Processing: ${dir}`);
    allFixes.push(...processDirectory(dir));
  }

  console.log(`\nTotal fixes: ${allFixes.length}`);
}

if (require.main === module) {
  try {
    runFix();
    process.exit(0);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Form fix failed:', err);
    process.exit(1);
  }
}

export { runFix, fixFormsInFile };
