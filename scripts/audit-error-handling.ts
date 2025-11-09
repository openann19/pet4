#!/usr/bin/env tsx
/**
 * Audit script to find error handling gaps (floating promises, missing error boundaries, unhandled rejections)
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, relative } from 'path';
import { globby } from 'globby';

interface ErrorHandlingIssue {
  file: string;
  line: number;
  type: 'floating-promise' | 'missing-catch' | 'async-handler' | 'missing-error-boundary' | 'missing-null-check' | 'non-null-assertion';
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
  issues: ErrorHandlingIssue[];
  timestamp: string;
}

function findFloatingPromises(content: string, file: string): ErrorHandlingIssue[] {
  const issues: ErrorHandlingIssue[] = [];
  const lines = content.split('\n');

  // Pattern: Promise calls without await, void, or .catch()
  const promisePatterns = [
    /Promise\.(all|race|allSettled|any)\([^)]+\)(?!\s*(?:\.catch|\.then|await|void))/g,
    /\.then\([^)]+\)(?!\s*(?:\.catch|await|void))/g,
    /fetch\([^)]+\)(?!\s*(?:\.catch|\.then|await|void))/g,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comments and strings
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

    for (const pattern of promisePatterns) {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        // Check if it's in a try-catch or has error handling
        const hasErrorHandling = content.substring(0, content.indexOf(line)).includes('try') ||
                                 line.includes('.catch') ||
                                 line.includes('await') ||
                                 line.includes('void');

        if (!hasErrorHandling && match.index !== undefined) {
          issues.push({
            file: relative(process.cwd(), file),
            line: i + 1,
            type: 'floating-promise',
            severity: 'high',
            description: 'Floating promise without error handling',
            code: line.trim(),
            suggestion: 'Add await, void operator, or .catch() handler',
          });
        }
      }
    }
  }

  return issues;
}

function findAsyncHandlers(content: string, file: string): ErrorHandlingIssue[] {
  const issues: ErrorHandlingIssue[] = [];
  const lines = content.split('\n');

  // Pattern: Async functions used as event handlers without error handling
  const asyncHandlerPattern = /(onClick|onPress|onSubmit|onChange|onBlur|onFocus)\s*=\s*\{\s*async\s+\([^)]*\)\s*=>/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(asyncHandlerPattern);

    if (match) {
      // Check if handler has try-catch
      const handlerStart = content.indexOf(line);
      const handlerEnd = content.indexOf('\n', handlerStart + line.length);
      const handlerCode = content.substring(handlerStart, handlerEnd);

      if (!handlerCode.includes('try') && !handlerCode.includes('.catch')) {
        issues.push({
          file: relative(process.cwd(), file),
          line: i + 1,
          type: 'async-handler',
          severity: 'high',
          description: 'Async event handler without error handling',
          code: line.trim(),
          suggestion: 'Wrap handler in try-catch or use error boundary',
        });
      }
    }
  }

  return issues;
}

function findNonNullAssertions(content: string, file: string): ErrorHandlingIssue[] {
  const issues: ErrorHandlingIssue[] = [];
  const lines = content.split('\n');

  // Pattern: Non-null assertions (!.)
  const nonNullPattern = /[a-zA-Z_$][a-zA-Z0-9_$]*!\.[a-zA-Z_$]/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = line.matchAll(nonNullPattern);

    for (const match of matches) {
      issues.push({
        file: relative(process.cwd(), file),
        line: i + 1,
        type: 'non-null-assertion',
        severity: 'medium',
        description: 'Non-null assertion without null check',
        code: line.trim(),
        suggestion: 'Add null check or use optional chaining',
      });
    }
  }

  return issues;
}

function findMissingNullChecks(content: string, file: string): ErrorHandlingIssue[] {
  const issues: ErrorHandlingIssue[] = [];
  const lines = content.split('\n');

  // Pattern: Method calls that might need null checks
  const methodCallPattern = /\.(focus|click|submit|send|call|emit|trigger|play|pause)\(/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = line.matchAll(methodCallPattern);

    for (const match of matches) {
      // Check if there's a null check before this line
      const lineStart = content.indexOf(line);
      const precedingLines = content.substring(Math.max(0, lineStart - 500), lineStart);

      const hasNullCheck = precedingLines.includes('if') &&
                          (precedingLines.includes('null') || precedingLines.includes('undefined') ||
                           precedingLines.includes('?') || precedingLines.includes('&&'));

      if (!hasNullCheck && !line.includes('?')) {
        issues.push({
          file: relative(process.cwd(), file),
          line: i + 1,
          type: 'missing-null-check',
          severity: 'medium',
          description: 'Method call without null check',
          code: line.trim(),
          suggestion: 'Add null check or use optional chaining (?.)',
        });
      }
    }
  }

  return issues;
}

async function auditErrorHandling(): Promise<void> {
  console.log('🔍 Scanning for error handling gaps...\n');

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

  const issues: ErrorHandlingIssue[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');

      // Find different types of issues
      issues.push(...findFloatingPromises(content, file));
      issues.push(...findAsyncHandlers(content, file));
      issues.push(...findNonNullAssertions(content, file));
      issues.push(...findMissingNullChecks(content, file));
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
  const outputPath = join(logsDir, 'error-handling-audit.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log('✅ Error Handling Audit Complete\n');
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

auditErrorHandling().catch((error) => {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error('Audit failed:', err);
  process.exit(1);
});
