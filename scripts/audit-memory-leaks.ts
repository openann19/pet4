#!/usr/bin/env tsx
/**
 * Audit script to find memory leak risks (missing cleanup in useEffect, timers, event listeners, animations)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, relative } from 'path';
import { globby } from 'globby';

interface MemoryLeakIssue {
  file: string;
  line: number;
  type: 'missing-cleanup' | 'timer-without-clear' | 'listener-without-remove' | 'animation-without-cancel' | 'subscription-without-unsubscribe';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  code: string;
  suggestion: string;
}

interface AuditResults {
  summary: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  issues: MemoryLeakIssue[];
  timestamp: string;
}

function findUseEffectWithoutCleanup(content: string, file: string): MemoryLeakIssue[] {
  const issues: MemoryLeakIssue[] = [];
  const lines = content.split('\n');

  // Find useEffect hooks
  const useEffectPattern = /useEffect\s*\(/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(useEffectPattern);

    if (match) {
      // Find the useEffect block
      let braceCount = 0;
      let inUseEffect = false;
      let useEffectStart = i;
      let useEffectEnd = i;

      for (let j = i; j < lines.length; j++) {
        const currentLine = lines[j];

        // Count braces to find the end of useEffect
        for (const char of currentLine) {
          if (char === '{') {
            braceCount++;
            inUseEffect = true;
          } else if (char === '}') {
            braceCount--;
            if (inUseEffect && braceCount === 0) {
              useEffectEnd = j;
              break;
            }
          }
        }

        if (inUseEffect && braceCount === 0) break;
      }

      // Extract useEffect body
      const useEffectBody = lines.slice(useEffectStart, useEffectEnd + 1).join('\n');

      // Check for side effects that need cleanup
      const hasSideEffects = useEffectBody.includes('addEventListener') ||
                            useEffectBody.includes('setTimeout') ||
                            useEffectBody.includes('setInterval') ||
                            useEffectBody.includes('requestAnimationFrame') ||
                            useEffectBody.includes('subscribe') ||
                            useEffectBody.includes('WebSocket') ||
                            useEffectBody.includes('EventEmitter');

      // Check if there's a return statement with cleanup
      const hasCleanup = useEffectBody.includes('return') &&
                        (useEffectBody.includes('removeEventListener') ||
                         useEffectBody.includes('clearTimeout') ||
                         useEffectBody.includes('clearInterval') ||
                         useEffectBody.includes('cancelAnimationFrame') ||
                         useEffectBody.includes('unsubscribe') ||
                         useEffectBody.includes('disconnect'));

      if (hasSideEffects && !hasCleanup) {
        issues.push({
          file: relative(process.cwd(), file),
          line: i + 1,
          type: 'missing-cleanup',
          severity: 'high',
          description: 'useEffect with side effects but no cleanup function',
          code: line.trim(),
          suggestion: 'Add cleanup function to remove listeners, clear timers, etc.',
        });
      }
    }
  }

  return issues;
}

function findTimersWithoutCleanup(content: string, file: string): MemoryLeakIssue[] {
  const issues: MemoryLeakIssue[] = [];
  const lines = content.split('\n');

  // Find setTimeout/setInterval
  const timerPattern = /(setTimeout|setInterval)\s*\(/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(timerPattern);

    if (match) {
      const timerType = match[0].includes('Timeout') ? 'setTimeout' : 'setInterval';
      const clearType = timerType === 'setTimeout' ? 'clearTimeout' : 'clearInterval';

      // Check if there's a corresponding clear in the file
      const fileContent = content;
      const timerIndex = fileContent.indexOf(line);
      const afterTimer = fileContent.substring(timerIndex);

      // Check if there's a cleanup in a return statement or cleanup function
      const hasCleanup = afterTimer.includes(clearType) &&
                        (afterTimer.includes('return') || afterTimer.includes('cleanup') || afterTimer.includes('useEffect'));

      if (!hasCleanup) {
        issues.push({
          file: relative(process.cwd(), file),
          line: i + 1,
          type: 'timer-without-clear',
          severity: 'high',
          description: `${timerType} without corresponding ${clearType}`,
          code: line.trim(),
          suggestion: `Add ${clearType} in cleanup function`,
        });
      }
    }
  }

  return issues;
}

function findListenersWithoutCleanup(content: string, file: string): MemoryLeakIssue[] {
  const issues: MemoryLeakIssue[] = [];
  const lines = content.split('\n');

  // Find addEventListener
  const listenerPattern = /\.addEventListener\s*\(/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(listenerPattern);

    if (match) {
      // Extract event name
      const eventMatch = line.match(/addEventListener\s*\(\s*['"]([^'"]+)['"]/);
      const eventName = eventMatch ? eventMatch[1] : 'event';

      // Check if there's a corresponding removeEventListener
      const fileContent = content;
      const listenerIndex = fileContent.indexOf(line);
      const afterListener = fileContent.substring(listenerIndex);

      const hasCleanup = afterListener.includes('removeEventListener') &&
                        (afterListener.includes('return') || afterListener.includes('cleanup') || afterListener.includes('useEffect'));

      if (!hasCleanup) {
        issues.push({
          file: relative(process.cwd(), file),
          line: i + 1,
          type: 'listener-without-remove',
          severity: 'high',
          description: `addEventListener('${eventName}') without removeEventListener`,
          code: line.trim(),
          suggestion: 'Add removeEventListener in cleanup function',
        });
      }
    }
  }

  return issues;
}

function findAnimationsWithoutCleanup(content: string, file: string): MemoryLeakIssue[] {
  const issues: MemoryLeakIssue[] = [];
  const lines = content.split('\n');

  // Find requestAnimationFrame
  const rafPattern = /requestAnimationFrame\s*\(/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(rafPattern);

    if (match) {
      // Check if there's a corresponding cancelAnimationFrame
      const fileContent = content;
      const rafIndex = fileContent.indexOf(line);
      const afterRaf = fileContent.substring(rafIndex);

      const hasCleanup = afterRaf.includes('cancelAnimationFrame') &&
                        (afterRaf.includes('return') || afterRaf.includes('cleanup') || afterRaf.includes('useEffect'));

      if (!hasCleanup) {
        issues.push({
          file: relative(process.cwd(), file),
          line: i + 1,
          type: 'animation-without-cancel',
          severity: 'high',
          description: 'requestAnimationFrame without cancelAnimationFrame',
          code: line.trim(),
          suggestion: 'Add cancelAnimationFrame in cleanup function',
        });
      }
    }
  }

  return issues;
}

async function auditMemoryLeaks(): Promise<void> {
  console.log('🔍 Scanning for memory leak risks...\n');

  // Find all TypeScript/JavaScript files
  const files = await globby([
    'apps/**/*.{ts,tsx}',
    'packages/**/*.{ts,tsx}',
  ], {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/html/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/__tests__/**',
      '**/__mocks__/**',
    ],
    cwd: process.cwd(),
  });

  const issues: MemoryLeakIssue[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');

      // Find different types of issues
      issues.push(...findUseEffectWithoutCleanup(content, file));
      issues.push(...findTimersWithoutCleanup(content, file));
      issues.push(...findListenersWithoutCleanup(content, file));
      issues.push(...findAnimationsWithoutCleanup(content, file));
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`Error reading ${file}: ${err.message}`);
    }
  }

  // Generate summary
  const summary = {
    total: issues.length,
    byType: issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    bySeverity: issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  const results: AuditResults = {
    summary,
    issues,
    timestamp: new Date().toISOString(),
  };

  // Ensure logs directory exists
  const logsDir = join(process.cwd(), 'logs');
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }

  // Write results to JSON
  const outputPath = join(logsDir, 'memory-leak-audit.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log('✅ Memory Leak Audit Complete\n');
  console.log('Summary:');
  console.log(`  Total Issues: ${summary.total}`);
  console.log(`  By Type: ${JSON.stringify(summary.byType, null, 2)}`);
  console.log(`  By Severity: ${JSON.stringify(summary.bySeverity, null, 2)}`);
  console.log(`\nResults written to: ${outputPath}`);

  // Print critical issues
  const criticalIssues = issues.filter(i => i.severity === 'critical' || i.severity === 'high');
  if (criticalIssues.length > 0) {
    console.log(`\n⚠️  Found ${criticalIssues.length} critical/high severity issues:`);
    for (const issue of criticalIssues.slice(0, 10)) {
      console.log(`  - ${issue.file}:${issue.line} [${issue.type}] ${issue.description}`);
    }
    if (criticalIssues.length > 10) {
      console.log(`  ... and ${criticalIssues.length - 10} more`);
    }
  }
}

auditMemoryLeaks().catch((error) => {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error('Audit failed:', err);
  process.exit(1);
});
