#!/usr/bin/env tsx
/**
 * Audit script to find render optimization opportunities
 * Scans for:
 * - .map() calls without memoization
 * - Event handlers not wrapped in useCallback
 * - Expensive computations not memoized
 * - Props/state dependencies not optimized
 */

import { globby } from 'globby';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

interface RenderOptimizationAuditResult {
  filePath: string;
  componentName: string;
  issues: Array<{
    type: 'map-without-memo' | 'handler-without-callback' | 'computation-without-memo' | 'unstable-deps';
    line: number;
    code: string;
    suggestion: string;
  }>;
  priority: 'high' | 'medium' | 'low';
  mapCallCount: number;
  handlerCount: number;
  computationCount: number;
  hasUseCallback: boolean;
  hasUseMemo: boolean;
}

const results: RenderOptimizationAuditResult[] = [];

function auditComponent(filePath: string): void {
  try {
    const fileName = filePath.split('/').pop() ?? '';
    const fileContent = readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');

    // Skip test files and non-component files
    if (fileName.includes('.test.') || fileName.includes('.spec.')) return;

    // Extract component name
    const functionMatch = fileContent.match(/export\s+(default\s+)?function\s+(\w+)/);
    const constMatch = fileContent.match(/export\s+(default\s+)?const\s+(\w+)\s*=/);
    const componentName = functionMatch?.[2] || constMatch?.[2] || fileName.replace(/\.tsx?$/, '');

    // Check if it's a React component
    if (!/export\s+(default\s+)?(function|const)\s+\w+/.test(fileContent)) return;

    const issues: RenderOptimizationAuditResult['issues'] = [];
    let mapCallCount = 0;
    let handlerCount = 0;
    let computationCount = 0;

    // Check for useCallback and useMemo
    const hasUseCallback = /useCallback\(/.test(fileContent);
    const hasUseMemo = /useMemo\(/.test(fileContent);

    // Find .map() calls without memoization
    const mapRegex = /\.map\s*\(/g;
    let mapMatch;
    while ((mapMatch = mapRegex.exec(fileContent)) !== null) {
      mapCallCount++;
      const lineNumber = fileContent.substring(0, mapMatch.index).split('\n').length;
      const lineContent = lines[lineNumber - 1]?.trim() || '';

      // Check if the array being mapped is memoized
      const arrayVarMatch = lineContent.match(/(\w+)\s*\.map/);
      if (arrayVarMatch) {
        const arrayVar = arrayVarMatch[1];
        // Check if this variable is memoized
        const isMemoized = new RegExp(`const\\s+${arrayVar}\\s*=\\s*useMemo|const\\s+${arrayVar}\\s*=\\s*React\\.useMemo`).test(fileContent);

        // Check if it's in a render function that would benefit from memoization
        const isInRender = /return\s+\(|return\s+\w|<\w+.*>/.test(lines.slice(Math.max(0, lineNumber - 10), lineNumber).join('\n'));

        if (!isMemoized && isInRender && arrayVar !== 'items' && arrayVar !== 'data') {
          issues.push({
            type: 'map-without-memo',
            line: lineNumber,
            code: lineContent.substring(0, 80),
            suggestion: `Memoize ${arrayVar} array with useMemo before mapping`,
          });
        }
      }
    }

    // Find event handlers not wrapped in useCallback
    const handlerRegex = /(?:const|function)\s+(\w+)\s*[=:]\s*(?:\([^)]*\)\s*=>|\([^)]*\)\s*\{)/g;
    let handlerMatch;
    const handlers = new Set<string>();

    while ((handlerMatch = handlerRegex.exec(fileContent)) !== null) {
      const handlerName = handlerMatch[1];
      if (handlerName.startsWith('handle') || handlerName.startsWith('on')) {
        handlers.add(handlerName);
        handlerCount++;
      }
    }

    // Check if handlers are wrapped in useCallback
    for (const handler of handlers) {
      const handlerDef = new RegExp(`(?:const|function)\\s+${handler}\\s*[=:]`).exec(fileContent);
      if (handlerDef) {
        const lineNumber = fileContent.substring(0, handlerDef.index).split('\n').length;
        const handlerBlock = fileContent.substring(handlerDef.index, handlerDef.index + 500);

        // Check if it's wrapped in useCallback
        const isWrapped = new RegExp(`useCallback\\s*\\(\\s*(?:\([^)]*\)\\s*=>|\([^)]*\)\\s*\\{).*${handler}`).test(fileContent) ||
          handlerBlock.includes('useCallback');

        // Check if it's passed as prop (indicates it should be memoized)
        const isPassedAsProp = new RegExp(`(on\\w+|handle\\w+)\\s*=\\s*\\{?${handler}\\b`).test(fileContent);

        if (!isWrapped && isPassedAsProp) {
          issues.push({
            type: 'handler-without-callback',
            line: lineNumber,
            code: lines[lineNumber - 1]?.trim().substring(0, 80) || '',
            suggestion: `Wrap ${handler} in useCallback to prevent unnecessary re-renders`,
          });
        }
      }
    }

    // Find expensive computations (filter, sort, reduce, etc.)
    const computationRegex = /\.(filter|sort|reduce|find|some|every|flatMap)\s*\(/g;
    let computationMatch;
    while ((computationMatch = computationRegex.exec(fileContent)) !== null) {
      computationCount++;
      const lineNumber = fileContent.substring(0, computationMatch.index).split('\n').length;
      const lineContent = lines[lineNumber - 1]?.trim() || '';

      // Check if the result is memoized
      const resultVarMatch = lineContent.match(/(\w+)\s*=\s*.+\.(filter|sort|reduce|find|some|every|flatMap)/);
      if (resultVarMatch) {
        const resultVar = resultVarMatch[1];
        const isMemoized = new RegExp(`const\\s+${resultVar}\\s*=\\s*useMemo`).test(fileContent);

        if (!isMemoized) {
          issues.push({
            type: 'computation-without-memo',
            line: lineNumber,
            code: lineContent.substring(0, 80),
            suggestion: `Memoize ${resultVar} computation with useMemo`,
          });
        }
      }
    }

    // Find unstable dependencies (object/array literals in dependency arrays)
    const useEffectRegex = /useEffect\s*\(\s*\([^)]*\)\s*=>\s*\{[^}]*\},\s*\[([^\]]+)\]/g;
    let effectMatch;
    while ((effectMatch = useEffectRegex.exec(fileContent)) !== null) {
      const deps = effectMatch[1];
      if (/\[|\{|\(/.test(deps)) {
        const lineNumber = fileContent.substring(0, effectMatch.index).split('\n').length;
        issues.push({
          type: 'unstable-deps',
          line: lineNumber,
          code: lines[lineNumber - 1]?.trim().substring(0, 80) || '',
          suggestion: 'Object/array literal in dependency array causes effect to run on every render',
        });
      }
    }

    // Determine priority
    let priority: 'high' | 'medium' | 'low' = 'low';
    if (issues.length > 5) {
      priority = 'high';
    } else if (issues.length > 2) {
      priority = 'medium';
    } else if (issues.length > 0) {
      priority = 'low';
    }

    if (issues.length > 0) {
      results.push({
        filePath,
        componentName,
        issues,
        priority,
        mapCallCount,
        handlerCount,
        computationCount,
        hasUseCallback,
        hasUseMemo,
      });
    }
  } catch (error) {
    // Skip files that can't be parsed
  }
}

async function main(): Promise<void> {
  console.log('🔍 Auditing components for render optimization opportunities...\n');

  // Find all component files
  const componentFiles = await globby([
    'apps/web/src/components/**/*.{ts,tsx}',
    'apps/mobile/src/components/**/*.{ts,tsx}',
  ], {
    ignore: [
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
      '**/*.stories.{ts,tsx}',
      '**/node_modules/**',
    ],
  });

  console.log(`Found ${componentFiles.length} component files\n`);

  // Audit each component
  for (const file of componentFiles) {
    auditComponent(file);
  }

  // Sort by priority and issue count
  results.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.issues.length - a.issues.length;
  });

  // Generate report
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const report = {
    summary: {
      total: results.length,
      high: results.filter(r => r.priority === 'high').length,
      medium: results.filter(r => r.priority === 'medium').length,
      low: results.filter(r => r.priority === 'low').length,
      totalIssues,
      mapWithoutMemo: results.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'map-without-memo').length, 0),
      handlerWithoutCallback: results.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'handler-without-callback').length, 0),
      computationWithoutMemo: results.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'computation-without-memo').length, 0),
      unstableDeps: results.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'unstable-deps').length, 0),
    },
    results,
    generatedAt: new Date().toISOString(),
  };

  // Write report
  const reportPath = join(process.cwd(), 'logs', 'render-optimization-audit.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('✅ Render optimization audit complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   Total components: ${report.summary.total}`);
  console.log(`   High priority: ${report.summary.high}`);
  console.log(`   Medium priority: ${report.summary.medium}`);
  console.log(`   Low priority: ${report.summary.low}`);
  console.log(`   Total issues: ${report.summary.totalIssues}`);
  console.log(`   Map without memo: ${report.summary.mapWithoutMemo}`);
  console.log(`   Handler without callback: ${report.summary.handlerWithoutCallback}`);
  console.log(`   Computation without memo: ${report.summary.computationWithoutMemo}`);
  console.log(`   Unstable dependencies: ${report.summary.unstableDeps}`);
  console.log(`\n📄 Report written to: ${reportPath}\n`);

  // Show top 10 high-priority items
  const highPriority = results.filter(r => r.priority === 'high').slice(0, 10);
  if (highPriority.length > 0) {
    console.log('🔴 Top 10 High-Priority Components:\n');
    highPriority.forEach((result, index) => {
      console.log(`${index + 1}. ${result.componentName} (${result.filePath})`);
      console.log(`   Issues: ${result.issues.length}`);
      result.issues.slice(0, 3).forEach(issue => {
        console.log(`   - ${issue.type} (line ${issue.line}): ${issue.suggestion}`);
      });
    });
  }
}

main().catch(console.error);
