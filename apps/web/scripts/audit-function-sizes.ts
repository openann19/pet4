/**
 * Function Size Audit Script
 *
 * Identifies all functions exceeding the max-lines-per-function limit (60 lines).
 * Outputs a prioritized list for refactoring.
 */

import { readdir, readFile, stat } from 'fs/promises';
import { join, extname } from 'path';

interface FunctionViolation {
  file: string;
  functionName: string;
  lineCount: number;
  startLine: number;
  endLine: number;
  priority: 'critical' | 'high' | 'medium';
}

const MAX_LINES = 60;
const CRITICAL_THRESHOLD = 200;
const HIGH_THRESHOLD = 100;

async function getFilesRecursive(dir: string, extensions: string[]): Promise<string[]> {
  const files: string[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '.next' && entry.name !== 'dist' && entry.name !== 'coverage') {
          files.push(...(await getFilesRecursive(fullPath, extensions)));
        }
      } else if (extensions.includes(extname(entry.name))) {
        files.push(fullPath);
      }
    }
  } catch {
    // Ignore permission errors
  }
  return files;
}

function countFunctionLines(content: string, startLine: number): { endLine: number; lineCount: number } {
  const lines = content.split('\n');
  let braceCount = 0;
  let inFunction = false;
  let endLine = startLine;

  for (let i = startLine - 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const openBraces = (line.match(/{/g) || []).length;
    const closeBraces = (line.match(/}/g) || []).length;

    if (!inFunction && openBraces > 0) {
      inFunction = true;
    }

    braceCount += openBraces - closeBraces;
    endLine = i + 1;

    if (inFunction && braceCount === 0) {
      break;
    }
  }

  return { endLine, lineCount: endLine - startLine + 1 };
}

function findFunctionViolations(content: string, filePath: string): FunctionViolation[] {
  const violations: FunctionViolation[] = [];
  const lines = content.split('\n');

  // Patterns to match function declarations
  const functionPatterns = [
    /^(export\s+)?(async\s+)?function\s+(\w+)\s*\(/,
    /^(export\s+)?const\s+(\w+)\s*[:=]\s*(async\s+)?\(/,
    /^(export\s+)?const\s+(\w+)\s*[:=]\s*(async\s+)?function/,
    /^(\w+)\s*[:=]\s*(async\s+)?\(/,
    /^(\w+)\s*[:=]\s*(async\s+)?function/,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    for (const pattern of functionPatterns) {
      const match = line.match(pattern);
      if (match) {
        const functionName = match[3] || match[2] || match[1] || 'anonymous';
        const { endLine, lineCount } = countFunctionLines(content, i + 1);

        if (lineCount > MAX_LINES) {
          let priority: 'critical' | 'high' | 'medium';
          if (lineCount >= CRITICAL_THRESHOLD) {
            priority = 'critical';
          } else if (lineCount >= HIGH_THRESHOLD) {
            priority = 'high';
          } else {
            priority = 'medium';
          }

          violations.push({
            file: filePath,
            functionName,
            lineCount,
            startLine: i + 1,
            endLine,
            priority,
          });
        }
        break;
      }
    }
  }

  return violations;
}

async function auditFunctions(srcDir: string): Promise<void> {
  const files = await getFilesRecursive(srcDir, ['.ts', '.tsx']);
  const allViolations: FunctionViolation[] = [];

  for (const file of files) {
    try {
      const content = await readFile(file, 'utf-8');
      const violations = findFunctionViolations(content, file);
      allViolations.push(...violations);
    } catch {
      // Ignore read errors
    }
  }

  // Sort by priority and line count
  allViolations.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.lineCount - a.lineCount;
  });

  // Group by priority
  const critical = allViolations.filter((v) => v.priority === 'critical');
  const high = allViolations.filter((v) => v.priority === 'high');
  const medium = allViolations.filter((v) => v.priority === 'medium');

  console.log('\n📊 Function Size Audit Results\n');
  console.log(`Total violations: ${allViolations.length}`);
  console.log(`Critical (≥${CRITICAL_THRESHOLD} lines): ${critical.length}`);
  console.log(`High (≥${HIGH_THRESHOLD} lines): ${high.length}`);
  console.log(`Medium (${MAX_LINES + 1}-${HIGH_THRESHOLD - 1} lines): ${medium.length}\n`);

  if (critical.length > 0) {
    console.log('🚨 CRITICAL PRIORITY (≥200 lines):\n');
    critical.slice(0, 20).forEach((v, i) => {
      console.log(`${i + 1}. ${v.file}:${v.startLine}`);
      console.log(`   Function: ${v.functionName}`);
      console.log(`   Lines: ${v.lineCount} (${v.startLine}-${v.endLine})\n`);
    });
  }

  if (high.length > 0) {
    console.log(`\n⚠️  HIGH PRIORITY (≥${HIGH_THRESHOLD} lines):\n`);
    high.slice(0, 20).forEach((v, i) => {
      console.log(`${i + 1}. ${v.file}:${v.startLine}`);
      console.log(`   Function: ${v.functionName}`);
      console.log(`   Lines: ${v.lineCount} (${v.startLine}-${v.endLine})\n`);
    });
  }

  // Write detailed report to file
  const reportPath = join(process.cwd(), 'function-size-audit-report.json');
  await import('fs/promises').then((fs) =>
    fs.writeFile(
      reportPath,
      JSON.stringify({ violations: allViolations, summary: { total: allViolations.length, critical: critical.length, high: high.length, medium: medium.length } }, null, 2)
    )
  );

  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

const srcDir = process.argv[2] || join(process.cwd(), 'src');
auditFunctions(srcDir).catch((error) => {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error('Audit failed:', err.message);
  process.exit(1);
});
