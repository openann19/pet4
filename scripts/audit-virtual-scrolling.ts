#!/usr/bin/env tsx
/**
 * Audit script to identify lists needing virtualization
 * Scans for:
 * - Lists rendering >10 items
 * - Components using .map() without virtualization
 * - Lists that should use VirtualList/FlashList
 */

import { globby } from 'globby';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

interface VirtualScrollingAuditResult {
  filePath: string;
  componentName: string;
  reason: string[];
  priority: 'high' | 'medium' | 'low';
  isVirtualized: boolean;
  mapCallCount: number;
  estimatedItemCount: number;
  usesVirtualList: boolean;
  usesFlashList: boolean;
  usesFlatList: boolean;
  listType: 'vertical' | 'horizontal' | 'grid' | 'unknown';
}

const results: VirtualScrollingAuditResult[] = [];

async function auditComponent(filePath: string): Promise<void> {
  try {
    const fileName = filePath.split('/').pop() ?? '';
    const fileContent = readFileSync(filePath, 'utf-8');

    // Check if already virtualized
    const usesVirtualList = /VirtualList|useVirtualizer|@tanstack\/react-virtual/.test(fileContent);
    const usesFlashList = /FlashList|from '@shopify\/flash-list'/.test(fileContent);
    const usesFlatList = /FlatList|from 'react-native'/.test(fileContent) && /<FlatList/.test(fileContent);
    const isVirtualized = usesVirtualList || usesFlashList || usesFlatList;

    // Check for .map() calls
    const mapMatches = fileContent.match(/\.map\s*\(/g);
    const mapCallCount = mapMatches ? mapMatches.length : 0;

    if (mapCallCount === 0 && !isVirtualized) return;

    // Extract component name
    const functionMatch = fileContent.match(/export\s+(default\s+)?function\s+(\w+)/);
    const constMatch = fileContent.match(/export\s+(default\s+)?const\s+(\w+)\s*=/);
    const componentName = functionMatch?.[2] || constMatch?.[2] || fileName.replace(/\.tsx?$/, '');

    // Check for list patterns
    const hasListPattern = /List|Feed|Grid|Cards|Items|Posts|Messages|Notifications|Stories/.test(componentName) ||
      filePath.includes('List') || filePath.includes('Feed') || filePath.includes('Grid');

    // Estimate item count (look for array operations, length checks, etc.)
    let estimatedItemCount = 10; // Default assumption
    const lengthMatches = fileContent.match(/\.length\s*[><=]\s*(\d+)/g);
    if (lengthMatches) {
      const numbers = lengthMatches.map(m => parseInt(m.match(/\d+/)![0], 10));
      estimatedItemCount = Math.max(...numbers, estimatedItemCount);
    }

    // Check for data prop patterns
    const dataPropMatches = fileContent.match(/data\s*=\s*\{([^}]+)\}/g);
    if (dataPropMatches) {
      estimatedItemCount = Math.max(estimatedItemCount, 20); // Likely dynamic list
    }

    // Determine list type
    let listType: 'vertical' | 'horizontal' | 'grid' | 'unknown' = 'unknown';
    if (/horizontal|Horizontal|scrollDirection.*horizontal/i.test(fileContent)) {
      listType = 'horizontal';
    } else if (/grid|Grid|columns|numColumns/i.test(fileContent)) {
      listType = 'grid';
    } else if (mapCallCount > 0) {
      listType = 'vertical';
    }

    // Check for common list patterns
    const isChatList = filePath.includes('Chat') && (filePath.includes('List') || filePath.includes('Message'));
    const isPostList = filePath.includes('Post') && (filePath.includes('List') || filePath.includes('Feed'));
    const isNotificationList = filePath.includes('Notification') && filePath.includes('List');
    const isStoryList = filePath.includes('Story') && (filePath.includes('List') || filePath.includes('Bar'));
    const isAdoptionList = filePath.includes('Adoption') && (filePath.includes('List') || filePath.includes('View'));
    const isMatchList = filePath.includes('Match') && (filePath.includes('List') || filePath.includes('View'));

    // Determine priority
    let priority: 'high' | 'medium' | 'low' = 'low';
    const reasons: string[] = [];

    if (isChatList && !isVirtualized) {
      priority = 'high';
      reasons.push('Chat list - can have hundreds of messages');
    } else if (isPostList && !isVirtualized) {
      priority = 'high';
      reasons.push('Post feed - can have many posts');
    } else if (isNotificationList && !isVirtualized) {
      priority = 'high';
      reasons.push('Notification list - can grow large');
    } else if (isStoryList && !isVirtualized) {
      priority = 'medium';
      reasons.push('Story list - horizontal scrolling');
    } else if (isAdoptionList && !isVirtualized) {
      priority = 'high';
      reasons.push('Adoption listings - can have many items');
    } else if (isMatchList && !isVirtualized) {
      priority = 'medium';
      reasons.push('Match list - can have many matches');
    } else if (hasListPattern && mapCallCount > 0 && !isVirtualized) {
      priority = estimatedItemCount > 20 ? 'high' : 'medium';
      reasons.push(`List component with ${mapCallCount} map() call(s)`);
    } else if (mapCallCount > 2 && !isVirtualized) {
      priority = 'medium';
      reasons.push(`Multiple map() calls (${mapCallCount})`);
    }

    if (priority !== 'low' || (hasListPattern && mapCallCount > 0 && !isVirtualized)) {
      results.push({
        filePath,
        componentName,
        reason: reasons.length > 0 ? reasons : ['List component may benefit from virtualization'],
        priority,
        isVirtualized,
        mapCallCount,
        estimatedItemCount,
        usesVirtualList,
        usesFlashList,
        usesFlatList,
        listType,
      });
    }
  } catch {
    // Skip files that can't be parsed
  }
}

async function main(): Promise<void> {
  console.log('🔍 Auditing components for virtual scrolling opportunities...\n');

  // Find all component files
  const componentFiles = await globby([
    'apps/web/src/components/**/*.{ts,tsx}',
    'apps/mobile/src/components/**/*.{ts,tsx}',
    'apps/web/src/components/views/**/*.{ts,tsx}',
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
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.mapCallCount - a.mapCallCount;
  });

  // Generate report
  const report = {
    summary: {
      total: results.length,
      high: results.filter(r => r.priority === 'high').length,
      medium: results.filter(r => r.priority === 'medium').length,
      low: results.filter(r => r.priority === 'low').length,
      alreadyVirtualized: results.filter(r => r.isVirtualized).length,
      needsVirtualization: results.filter(r => !r.isVirtualized).length,
      vertical: results.filter(r => r.listType === 'vertical').length,
      horizontal: results.filter(r => r.listType === 'horizontal').length,
      grid: results.filter(r => r.listType === 'grid').length,
    },
    results,
    generatedAt: new Date().toISOString(),
  };

  // Write report
  const reportPath = join(process.cwd(), 'logs', 'virtual-scrolling-audit.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('✅ Virtual scrolling audit complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   Total lists: ${report.summary.total}`);
  console.log(`   High priority: ${report.summary.high}`);
  console.log(`   Medium priority: ${report.summary.medium}`);
  console.log(`   Low priority: ${report.summary.low}`);
  console.log(`   Already virtualized: ${report.summary.alreadyVirtualized}`);
  console.log(`   Needs virtualization: ${report.summary.needsVirtualization}`);
  console.log(`   Vertical: ${report.summary.vertical}`);
  console.log(`   Horizontal: ${report.summary.horizontal}`);
  console.log(`   Grid: ${report.summary.grid}`);
  console.log(`\n📄 Report written to: ${reportPath}\n`);

  // Show top 10 high-priority items
  const highPriority = results.filter(r => r.priority === 'high' && !r.isVirtualized).slice(0, 10);
  if (highPriority.length > 0) {
    console.log('🔴 Top 10 High-Priority Lists:\n');
    highPriority.forEach((result, index) => {
      console.log(`${index + 1}. ${result.componentName} (${result.filePath})`);
      console.log(`   Map calls: ${result.mapCallCount}, Type: ${result.listType}`);
      console.log(`   Reasons: ${result.reason.join(', ')}`);
    });
  }
}

main().catch(console.error);
