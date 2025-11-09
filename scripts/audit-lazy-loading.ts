#!/usr/bin/env tsx
/**
 * Audit script to identify heavy components and components that should be lazy loaded
 * Scans for:
 * - Large components (>50KB gzipped estimate)
 * - Complex components with many dependencies
 * - Components loaded but not immediately used
 * - Modal/dialog components
 * - Admin panels
 * - Media viewers/editors
 */

import { globby } from 'globby';
import { writeFileSync, statSync, readFileSync } from 'fs';
import { join } from 'path';

interface LazyLoadingAuditResult {
  filePath: string;
  componentName: string;
  reason: string[];
  priority: 'high' | 'medium' | 'low';
  isLazyLoaded: boolean;
  estimatedSize: number; // bytes
  dependencyCount: number;
  isModal: boolean;
  isAdmin: boolean;
  isViewer: boolean;
  isEditor: boolean;
}

const results: LazyLoadingAuditResult[] = [];

// Patterns to identify components that should be lazy loaded
const MODAL_PATTERNS = [
  /Modal\.tsx?$/,
  /Dialog\.tsx?$/,
  /Drawer\.tsx?$/,
  /Sheet\.tsx?$/,
  /Popup\.tsx?$/,
  /Overlay\.tsx?$/,
];

const ADMIN_PATTERNS = [
  /admin\/.*\.tsx?$/,
  /Admin.*\.tsx?$/,
];

const VIEWER_PATTERNS = [
  /Viewer\.tsx?$/,
  /MediaViewer\.tsx?$/,
  /StoryViewer\.tsx?$/,
  /ImageViewer\.tsx?$/,
  /VideoViewer\.tsx?$/,
];

const EDITOR_PATTERNS = [
  /Editor\.tsx?$/,
  /MediaEditor\.tsx?$/,
  /VideoEditor\.tsx?$/,
  /ImageEditor\.tsx?$/,
];

const HEAVY_PATTERNS = [
  /Dashboard\.tsx?$/,
  /Scheduler\.tsx?$/,
  /HealthDashboard\.tsx?$/,
  /Analytics\.tsx?$/,
  /LiveStreamRoom\.tsx?$/,
  /PlaydateScheduler\.tsx?$/,
];

async function auditComponent(filePath: string): Promise<void> {
  try {
    const fileName = filePath.split('/').pop() ?? '';
    const fileContent = readFileSync(filePath, 'utf-8');
    const fileSize = statSync(filePath).size;

    // Check if already lazy loaded
    const isLazyLoaded = /React\.lazy|lazy\(/.test(fileContent) ||
      filePath.includes('lazy-exports') ||
      fileContent.includes('createLazyNamed') ||
      fileContent.includes('createLazyDefault');

    // Extract component name
    const functionMatch = fileContent.match(/export\s+(default\s+)?function\s+(\w+)/);
    const constMatch = fileContent.match(/export\s+(default\s+)?const\s+(\w+)\s*=/);
    const componentName = functionMatch?.[2] || constMatch?.[2] || fileName.replace(/\.tsx?$/, '');

    // Count imports/dependencies
    const importCount = (fileContent.match(/^import\s+/gm) || []).length;
    const dependencyCount = importCount;

    // Check patterns
    const isModal = MODAL_PATTERNS.some(pattern => pattern.test(fileName)) ||
      filePath.includes('modal') || filePath.includes('dialog') || filePath.includes('drawer');

    const isAdmin = ADMIN_PATTERNS.some(pattern => pattern.test(filePath)) ||
      filePath.includes('/admin/');

    const isViewer = VIEWER_PATTERNS.some(pattern => pattern.test(fileName)) ||
      filePath.includes('viewer') || filePath.includes('Viewer');

    const isEditor = EDITOR_PATTERNS.some(pattern => pattern.test(fileName)) ||
      filePath.includes('editor') || filePath.includes('Editor');

    const isHeavy = HEAVY_PATTERNS.some(pattern => pattern.test(fileName)) ||
      filePath.includes('Dashboard') || filePath.includes('Scheduler') || filePath.includes('Analytics');

    // Check for heavy operations
    const hasHeavyOperations = /canvas|video|audio|WebGL|three\.js|d3\.js|chart\.js|recharts/.test(fileContent);
    const hasManyHooks = (fileContent.match(/use[A-Z]\w+/g) || []).length > 10;
    const hasComplexLogic = fileContent.split('\n').length > 500;

    // Estimate size (rough calculation)
    // Minified + gzipped is typically ~30% of original size
    const estimatedSize = fileSize;

    // Determine priority
    let priority: 'high' | 'medium' | 'low' = 'low';
    const reasons: string[] = [];

    if (isModal && !isLazyLoaded) {
      priority = 'high';
      reasons.push('Modal/Dialog component - not always visible');
    } else if (isAdmin && !isLazyLoaded) {
      priority = 'high';
      reasons.push('Admin panel - not used by regular users');
    } else if (isViewer && !isLazyLoaded) {
      priority = 'high';
      reasons.push('Media viewer - loaded on demand');
    } else if (isEditor && !isLazyLoaded) {
      priority = 'high';
      reasons.push('Editor component - loaded on demand');
    } else if (isHeavy && !isLazyLoaded) {
      priority = 'high';
      reasons.push('Heavy component - complex functionality');
    } else if (estimatedSize > 50000 && !isLazyLoaded) {
      priority = 'medium';
      reasons.push(`Large file size: ${(estimatedSize / 1024).toFixed(2)}KB`);
    } else if (dependencyCount > 15 && !isLazyLoaded) {
      priority = 'medium';
      reasons.push(`Many dependencies: ${dependencyCount} imports`);
    } else if (hasHeavyOperations && !isLazyLoaded) {
      priority = 'medium';
      reasons.push('Contains heavy operations (canvas, video, WebGL, etc.)');
    } else if (hasManyHooks && !isLazyLoaded) {
      priority = 'medium';
      reasons.push('Many React hooks - complex component');
    } else if (hasComplexLogic && !isLazyLoaded) {
      priority = 'medium';
      reasons.push('Complex logic - large file');
    }

    if (priority !== 'low' || isModal || isAdmin || isViewer || isEditor) {
      results.push({
        filePath,
        componentName,
        reason: reasons.length > 0 ? reasons : ['Component may benefit from lazy loading'],
        priority,
        isLazyLoaded,
        estimatedSize,
        dependencyCount,
        isModal,
        isAdmin,
        isViewer,
        isEditor,
      });
    }
  } catch (error) {
    // Skip files that can't be parsed or don't exist
  }
}

async function main(): Promise<void> {
  console.log('🔍 Auditing components for lazy loading opportunities...\n');

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

  // Sort by priority and size
  results.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return b.estimatedSize - a.estimatedSize;
  });

  // Generate report
  const report = {
    summary: {
      total: results.length,
      high: results.filter(r => r.priority === 'high').length,
      medium: results.filter(r => r.priority === 'medium').length,
      low: results.filter(r => r.priority === 'low').length,
      alreadyLazyLoaded: results.filter(r => r.isLazyLoaded).length,
      needsLazyLoading: results.filter(r => !r.isLazyLoaded).length,
      modals: results.filter(r => r.isModal).length,
      admin: results.filter(r => r.isAdmin).length,
      viewers: results.filter(r => r.isViewer).length,
      editors: results.filter(r => r.isEditor).length,
    },
    results,
    generatedAt: new Date().toISOString(),
  };

  // Write report
  const reportPath = join(process.cwd(), 'logs', 'lazy-loading-audit.json');
  writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('✅ Lazy loading audit complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   Total components: ${report.summary.total}`);
  console.log(`   High priority: ${report.summary.high}`);
  console.log(`   Medium priority: ${report.summary.medium}`);
  console.log(`   Low priority: ${report.summary.low}`);
  console.log(`   Already lazy loaded: ${report.summary.alreadyLazyLoaded}`);
  console.log(`   Needs lazy loading: ${report.summary.needsLazyLoading}`);
  console.log(`   Modals: ${report.summary.modals}`);
  console.log(`   Admin panels: ${report.summary.admin}`);
  console.log(`   Viewers: ${report.summary.viewers}`);
  console.log(`   Editors: ${report.summary.editors}`);
  console.log(`\n📄 Report written to: ${reportPath}\n`);

  // Show top 10 high-priority items
  const highPriority = results.filter(r => r.priority === 'high' && !r.isLazyLoaded).slice(0, 10);
  if (highPriority.length > 0) {
    console.log('🔴 Top 10 High-Priority Components:\n');
    highPriority.forEach((result, index) => {
      console.log(`${index + 1}. ${result.componentName} (${result.filePath})`);
      console.log(`   Size: ${(result.estimatedSize / 1024).toFixed(2)}KB, Dependencies: ${result.dependencyCount}`);
      console.log(`   Reasons: ${result.reason.join(', ')}`);
    });
  }
}

main().catch(console.error);
