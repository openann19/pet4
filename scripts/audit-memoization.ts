#!/usr/bin/env tsx
/**
 * Audit script to identify components needing memoization
 * Scans for:
 * - List item components
 * - Pure presentational components
 * - Components receiving props that change frequently
 * - Components with expensive renders
 */

import { globby } from 'globby';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

interface MemoizationAuditResult {
  filePath: string;
  componentName: string;
  reason: string[];
  priority: 'high' | 'medium' | 'low';
  isMemoized: boolean;
  props: string[];
  hasChildren: boolean;
  isListItem: boolean;
  isPresentational: boolean;
}

const results: MemoizationAuditResult[] = [];

// Patterns to identify components that should be memoized
const LIST_ITEM_PATTERNS = [
  /Card\.tsx?$/,
  /Item\.tsx?$/,
  /Row\.tsx?$/,
  /ListItem\.tsx?$/,
  /Bubble\.tsx?$/,
  /Message\.tsx?$/,
  /Notification.*\.tsx?$/,
  /Story.*\.tsx?$/,
  /Post.*\.tsx?$/,
  /Adoption.*Card\.tsx?$/,
  /Match.*Card\.tsx?$/,
];

const PRESENTATIONAL_PATTERNS = [
  /Badge\.tsx?$/,
  /Avatar\.tsx?$/,
  /Button\.tsx?$/,
  /Icon\.tsx?$/,
  /Label\.tsx?$/,
  /Chip\.tsx?$/,
  /Tag\.tsx?$/,
];

async function auditComponent(filePath: string): Promise<void> {
  try {
    const fileName = filePath.split('/').pop() ?? '';
    const fileContent = readFileSync(filePath, 'utf-8');

    // Skip if already memoized
    const isMemoized = /React\.memo|memo\(/.test(fileContent);

    // Check if it's a React component
    const hasComponentExport = /export\s+(default\s+)?function\s+\w+|export\s+(default\s+)?const\s+\w+\s*=\s*\(/.test(fileContent);
    if (!hasComponentExport) return;

    // Extract component name
    const functionMatch = fileContent.match(/export\s+(default\s+)?function\s+(\w+)/);
    const constMatch = fileContent.match(/export\s+(default\s+)?const\s+(\w+)\s*=/);
    const componentName = functionMatch?.[2] || constMatch?.[2] || fileName.replace(/\.tsx?$/, '');

    // Check for props
    const propsMatch = fileContent.match(/(?:function|const)\s+\w+\s*[<{]([^>}]+)/);
    const props = propsMatch ? propsMatch[1].split(',').map(p => p.trim().split(':')[0].trim()) : [];

    // Check if it has children prop
    const hasChildren = /children\??\s*[:)]/.test(fileContent);

    // Check if it's a list item
    const isListItem = LIST_ITEM_PATTERNS.some(pattern => pattern.test(fileName));

    // Check if it's presentational
    const isPresentational = PRESENTATIONAL_PATTERNS.some(pattern => pattern.test(fileName)) ||
      (!/useState|useEffect|useCallback|useMemo|useRef|useContext/.test(fileContent) && props.length > 0);

    // Check for expensive operations
    const hasExpensiveOperations = /\.map\(|\.filter\(|\.reduce\(|\.sort\(|JSON\.parse|JSON\.stringify/.test(fileContent);

    // Determine priority
    let priority: 'high' | 'medium' | 'low' = 'low';
    const reasons: string[] = [];

    if (isListItem) {
      priority = 'high';
      reasons.push('List item component - re-renders frequently in lists');
    } else if (isPresentational && props.length > 0) {
      priority = 'medium';
      reasons.push('Presentational component with props');
    } else if (hasExpensiveOperations && !isMemoized) {
      priority = 'medium';
      reasons.push('Contains expensive operations');
    }

    // Check if component receives frequently changing props
    const hasCallbackProps = props.some(p => /on[A-Z]|handle[A-Z]|callback/i.test(p));
    if (hasCallbackProps && !isMemoized) {
      priority = priority === 'low' ? 'medium' : priority;
      reasons.push('Receives callback props that may change frequently');
    }

    // Check if used in .map() calls (indicates list item)
    if (fileContent.includes('.map(') && fileContent.includes(`<${componentName}`)) {
      priority = 'high';
      reasons.push('Used in map() calls - likely a list item');
    }

    if (priority !== 'low' || isListItem || isPresentational) {
      results.push({
        filePath,
        componentName,
        reason: reasons.length > 0 ? reasons : ['Component may benefit from memoization'],
        priority,
        isMemoized,
        props,
        hasChildren,
        isListItem,
        isPresentational,
      });
    }
  } catch (error) {
    // Skip files that can't be parsed
  }
}

async function main(): Promise<void> {
  console.log('🔍 Auditing components for memoization opportunities...\n');

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
    await auditComponent(file);
  }

  // Sort by priority
  results.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Generate report
  const report = {
    summary: {
      total: results.length,
      high: results.filter(r => r.priority === 'high').length,
      medium: results.filter(r => r.priority === 'medium').length,
      low: results.filter(r => r.priority === 'low').length,
      alreadyMemoized: results.filter(r => r.isMemoized).length,
      needsMemoization: results.filter(r => !r.isMemoized).length,
    },
    results,
    generatedAt: new Date().toISOString(),
  };

  // Write report
  const reportPath = join(process.cwd(), 'logs', 'memoization-audit.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('✅ Memoization audit complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   Total components: ${report.summary.total}`);
  console.log(`   High priority: ${report.summary.high}`);
  console.log(`   Medium priority: ${report.summary.medium}`);
  console.log(`   Low priority: ${report.summary.low}`);
  console.log(`   Already memoized: ${report.summary.alreadyMemoized}`);
  console.log(`   Needs memoization: ${report.summary.needsMemoization}`);
  console.log(`\n📄 Report written to: ${reportPath}\n`);

  // Show top 10 high-priority items
  const highPriority = results.filter(r => r.priority === 'high' && !r.isMemoized).slice(0, 10);
  if (highPriority.length > 0) {
    console.log('🔴 Top 10 High-Priority Components:\n');
    highPriority.forEach((result, index) => {
      console.log(`${index + 1}. ${result.componentName} (${result.filePath})`);
      console.log(`   Reasons: ${result.reason.join(', ')}`);
    });
  }
}

main().catch(console.error);
