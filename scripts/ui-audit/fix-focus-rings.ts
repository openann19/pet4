/**
 * Auto-Fix: Focus Ring Standardization
 * Applies standardized focus rings to all interactive elements
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SOURCE_DIRS = [
  join(process.cwd(), 'apps/web/src'),
];

interface Fix {
  file: string;
  line: number;
  original: string;
  replacement: string;
}

function fixFocusRingsInFile(filePath: string): Fix[] {
  const fixes: Fix[] = [];

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let newContent = content;
    let modified = false;

    // Pattern 1: Remove outline-none without focus-visible replacement
    const outlineNonePattern = /(?:className|class)=["']([^"']*)\boutline-none\b([^"']*)["']/g;
    let match;

    while ((match = outlineNonePattern.exec(content)) !== null) {
      const fullMatch = match[0];
      const className = match[1] + match[2];

      // Check if focus-visible is already present
      if (!className.includes('focus-visible')) {
        const replacement = fullMatch.replace(
          /outline-none/,
          'outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-[var(--background)]'
        );

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

    // Pattern 2: Add focus-visible to buttons without it
    const buttonPattern = /<(?:button|a|input|select|textarea)\s+([^>]*)(?:className|class)=["']([^"']*)["']([^>]*)>/g;

    while ((match = buttonPattern.exec(content)) !== null) {
      const fullMatch = match[0];
      const className = match[2];

      if (!className.includes('focus-visible') && !className.includes('focus-ring')) {
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
          fixes.push(...fixFocusRingsInFile(fullPath));
        }
      }
    }
  } catch {
    // Directory might not be accessible, skip
  }

  return fixes;
}

function runFix(): void {
  console.log('Running auto-fix: Focus ring standardization...');

  const allFixes: Fix[] = [];

  for (const dir of SOURCE_DIRS) {
    console.log(`Processing: ${dir}`);
    allFixes.push(...processDirectory(dir));
  }

  console.log(`\nTotal fixes: ${allFixes.length}`);

  if (allFixes.length > 0) {
    console.log('\nFixes applied:');
    allFixes.slice(0, 10).forEach(f => {
      console.log(`  ${f.file}:${f.line}`);
    });
    if (allFixes.length > 10) {
      console.log(`  ... and ${allFixes.length - 10} more`);
    }
  }
}

if (require.main === module) {
  try {
    runFix();
    process.exit(0);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Focus ring fix failed:', err);
    process.exit(1);
  }
}

export { runFix, fixFocusRingsInFile };
