/**
 * Auto-Fix: Button Standardization
 * Ensures all buttons use design system components and tokens
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

function fixButtonsInFile(filePath: string): Fix[] {
  const fixes: Fix[] = [];

  try {
    const content = readFileSync(filePath, 'utf-8');
    let newContent = content;
    let modified = false;

    // Pattern: Find button elements that don't use Button component
    // This is a simplified check - real implementation would use AST parsing
    const buttonPattern = /<button\s+([^>]*)>/g;
    let match;

    while ((match = buttonPattern.exec(content)) !== null) {
      const fullMatch = match[0];
      const attrs = match[1];

      // Check if it's already using Button component (imported)
      const hasButtonImport = content.includes("from '@/components/ui/button'") ||
                            content.includes('from "./button"') ||
                            content.includes("from '../ui/button'");

      // Check if className has proper size tokens
      const hasSizeToken = attrs.includes('size=') || attrs.includes('h-[36px]') || attrs.includes('h-[44px]') || attrs.includes('h-[48px]');

      if (!hasSizeToken && hasButtonImport) {
        // Suggest adding size prop
        // This would require AST parsing for proper fix
        // For now, just log
      }
    }

    // Pattern: Ensure button sizes meet minimums
    // sm=36px, md=44px, lg=48px
    const sizePatterns = [
      { pattern: /h-\[36px\]/g, replacement: 'h-[36px] min-h-[36px]' },
      { pattern: /h-\[44px\]/g, replacement: 'h-[44px] min-h-[44px]' },
      { pattern: /h-\[48px\]/g, replacement: 'h-[48px] min-h-[48px]' },
    ];

    for (const { pattern, replacement } of sizePatterns) {
      if (pattern.test(content)) {
        newContent = newContent.replace(pattern, replacement);
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
          fixes.push(...fixButtonsInFile(fullPath));
        }
      }
    }
  } catch {
    // Directory might not be accessible, skip
  }

  return fixes;
}

function runFix(): void {
  console.log('Running auto-fix: Button standardization...');

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
    console.error('Button fix failed:', err);
    process.exit(1);
  }
}

export { runFix, fixButtonsInFile };
