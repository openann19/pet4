/**
 * Auto-Fix: Hit-Target & Safe Areas
 * Ensures all interactive elements meet minimum hit target sizes
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

function fixHitTargetsInFile(filePath: string): Fix[] {
  const fixes: Fix[] = [];

  try {
    const content = readFileSync(filePath, 'utf-8');
    let newContent = content;
    let modified = false;

    // Pattern: Ensure buttons have minimum size
    // Web: 36px, Mobile: 44dp
    const buttonPattern = /<(?:button|Pressable|TouchableOpacity)\s+([^>]*)(?:className|class|style)=["']([^"']*)["']([^>]*)>/g;
    let match;

    while ((match = buttonPattern.exec(content)) !== null) {
      const fullMatch = match[0];
      const className = match[2];

      // Check if min-h or min-w is present
      const hasMinH = className.includes('min-h-') || className.includes('min-h-[');
      const hasMinW = className.includes('min-w-') || className.includes('min-w-[');

      if (!hasMinH || !hasMinW) {
        // Add minimum sizes
        const isMobile = filePath.includes('mobile');
        const minSize = isMobile ? '44' : '36';
        const newClassName = className + ` min-h-[${minSize}px] min-w-[${minSize}px]`;
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
          fixes.push(...fixHitTargetsInFile(fullPath));
        }
      }
    }
  } catch {
    // Directory might not be accessible, skip
  }

  return fixes;
}

function runFix(): void {
  console.log('Running auto-fix: Hit-targets & safe areas...');

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
    console.error('Hit-target fix failed:', err);
    process.exit(1);
  }
}

export { runFix, fixHitTargetsInFile };
