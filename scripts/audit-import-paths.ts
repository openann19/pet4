/**
 * Import Path Audit Script
 *
 * Identifies files using relative imports that should use @/ aliases
 * Helps standardize import paths across the codebase
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, relative, dirname } from 'path';

interface ImportIssue {
  file: string;
  line: number;
  importPath: string;
  suggestedPath: string;
  type: 'relative' | 'inconsistent';
}

const issues: ImportIssue[] = [];
const srcDir = join(process.cwd(), 'apps/web/src');

/**
 * Check if a relative import should use @/ alias
 */
function shouldUseAlias(filePath: string, importPath: string): boolean {
  // Skip if already using @/ alias
  if (importPath.startsWith('@/')) {
    return false;
  }

  // Skip node_modules and external packages
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    return false;
  }

  // Skip relative imports within the same directory (./)
  if (importPath.startsWith('./')) {
    return false;
  }

  // Relative imports going up directories (../) should use @/ if they go outside the immediate parent
  if (importPath.startsWith('../')) {
    const fileDir = dirname(filePath);
    const resolvedPath = join(fileDir, importPath);
    const relativeToSrc = relative(srcDir, resolvedPath);

    // If the resolved path is still within src, suggest using @/ alias
    if (!relativeToSrc.startsWith('..')) {
      return true;
    }
  }

  return false;
}

/**
 * Convert relative import to @/ alias
 */
function convertToAlias(filePath: string, importPath: string): string {
  const fileDir = dirname(filePath);
  const resolvedPath = join(fileDir, importPath);
  const relativeToSrc = relative(srcDir, resolvedPath);

  // Remove file extension
  const withoutExt = relativeToSrc.replace(/\.(ts|tsx|js|jsx)$/, '');

  return `@/${withoutExt}`;
}

/**
 * Process a single file
 */
async function processFile(filePath: string): Promise<void> {
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const relativePath = relative(process.cwd(), filePath);

    lines.forEach((line, index) => {
      // Match import statements
      const importMatch = line.match(/^import\s+.*from\s+['"]([^'"]+)['"]/);
      if (importMatch) {
        const importPath = importMatch[1];

        if (shouldUseAlias(filePath, importPath)) {
          const suggestedPath = convertToAlias(filePath, importPath);
          issues.push({
            file: relativePath,
            line: index + 1,
            importPath,
            suggestedPath,
            type: 'relative',
          });
        }
      }
    });
  } catch (error) {
    // Skip files that can't be read
  }
}

/**
 * Recursively process directory
 */
async function processDirectory(dir: string): Promise<void> {
  try {
    const entries = await readdir(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const statInfo = await stat(fullPath);

      if (statInfo.isDirectory()) {
        // Skip node_modules, dist, build, etc.
        if (!['node_modules', 'dist', 'build', '.next', 'coverage'].includes(entry)) {
          await processDirectory(fullPath);
        }
      } else if (statInfo.isFile()) {
        // Process TypeScript/JavaScript files
        if (/\.(ts|tsx|js|jsx)$/.test(entry)) {
          await processFile(fullPath);
        }
      }
    }
  } catch (error) {
    // Skip directories that can't be read
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('Auditing import paths...\n');

  await processDirectory(srcDir);

  if (issues.length === 0) {
    console.log('✅ No import path issues found!');
    return;
  }

  console.log(`Found ${issues.length} import path issue(s):\n`);

  // Group by file
  const byFile = new Map<string, ImportIssue[]>();
  issues.forEach((issue) => {
    const fileIssues = byFile.get(issue.file) || [];
    fileIssues.push(issue);
    byFile.set(issue.file, fileIssues);
  });

  // Print results
  byFile.forEach((fileIssues, file) => {
    console.log(`📄 ${file}:`);
    fileIssues.forEach((issue) => {
      console.log(`   Line ${issue.line}: "${issue.importPath}" → "${issue.suggestedPath}"`);
    });
    console.log();
  });

  console.log(`\n💡 Tip: Use find-and-replace to update these imports.`);
  console.log(`   Most IDEs support regex find-and-replace for bulk updates.`);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
