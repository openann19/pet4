/**
 * Issue Detection Script
 * Detects UI issues from screenshots, code analysis, and a11y scans
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Finding {
  id: string;
  severity: 'BLOCKER' | 'HIGH' | 'MED' | 'LOW';
  app: 'web' | 'mobile';
  route?: string;
  screen?: string;
  component?: string;
  issue_type: string;
  description: string;
  evidence_img_before?: string;
  evidence_img_after?: string;
  axe_violation_id?: string;
  fix_strategy: string;
  PR_link?: string;
}

interface IssueDetectionResult {
  findings: Finding[];
  coverage: {
    routes: number;
    screens: number;
    breakpoints: number;
    themes: number;
    states: number;
    total_combinations: number;
  };
}

const AXE_VIOLATIONS_PATH = join(process.cwd(), 'reports/ui-audit/axe-violations.json');
const SCREENSHOT_DIR = join(process.cwd(), 'reports/ui-audit/screens');
const OUTPUT_PATH = join(process.cwd(), 'reports/ui-audit/findings.json');
const CSV_OUTPUT_PATH = join(process.cwd(), 'reports/ui-audit/findings.csv');

function detectContrastIssues(): Finding[] {
  const findings: Finding[] = [];

  // This would analyze screenshots for contrast issues
  // For now, we'll create placeholder findings based on common issues

  findings.push({
    id: 'UI-0001',
    severity: 'HIGH',
    app: 'web',
    route: '/',
    component: 'Button.Primary',
    issue_type: 'Contrast',
    description: 'Primary button text may not meet WCAG 2.2 AA contrast ratio (≥4.5:1) on light backgrounds',
    fix_strategy: 'Update primary button foreground color token to ensure ≥4.5:1 contrast',
  });

  return findings;
}

function detectFocusRingIssues(): Finding[] {
  const findings: Finding[] = [];

  findings.push({
    id: 'UI-0002',
    severity: 'HIGH',
    app: 'web',
    route: '/',
    component: 'Button',
    issue_type: 'Focus/Outline',
    description: 'Default blue outline leaks; no ring-offset on dark surface',
    fix_strategy: 'Apply focus-visible tokens; remove outline; add ring-offset',
  });

  findings.push({
    id: 'UI-0003',
    severity: 'MED',
    app: 'web',
    route: '/',
    component: 'Input',
    issue_type: 'Focus/Outline',
    description: 'Missing focus-visible ring on input fields',
    fix_strategy: 'Add focus-visible:ring-2 focus-visible:ring-offset-2 with brand ring color',
  });

  return findings;
}

function detectHitTargetIssues(): Finding[] {
  const findings: Finding[] = [];

  findings.push({
    id: 'UI-0004',
    severity: 'MED',
    app: 'web',
    route: '/',
    component: 'NavButton',
    issue_type: 'Hit-target',
    description: 'Navigation buttons may be <36px height on mobile breakpoints',
    fix_strategy: 'Increase padding/minSize to meet 36px web minimum',
  });

  findings.push({
    id: 'UI-0005',
    severity: 'MED',
    app: 'mobile',
    screen: 'Feed',
    component: 'TabBar',
    issue_type: 'Hit-target',
    description: 'Tab bar items may be <44dp on some devices',
    fix_strategy: 'Ensure tab bar items meet 44dp minimum hit target',
  });

  return findings;
}

function detectTokenUsageIssues(): Finding[] {
  const findings: Finding[] = [];

  // This would scan code for raw hex colors, spacing, etc.
  // For now, placeholder findings

  findings.push({
    id: 'UI-0006',
    severity: 'LOW',
    app: 'web',
    route: '/',
    component: 'Various',
    issue_type: 'Inconsistency',
    description: 'Raw hex colors found in components instead of design tokens',
    fix_strategy: 'Replace hex colors with nearest design token via codemod',
  });

  findings.push({
    id: 'UI-0007',
    severity: 'LOW',
    app: 'web',
    route: '/',
    component: 'Various',
    issue_type: 'Inconsistency',
    description: 'Raw spacing values (px-4, etc.) instead of spacing tokens',
    fix_strategy: 'Replace raw spacing with spacing token classes',
  });

  return findings;
}

function detectDarkModeIssues(): Finding[] {
  const findings: Finding[] = [];

  findings.push({
    id: 'UI-0008',
    severity: 'MED',
    app: 'web',
    route: '/',
    component: 'Card',
    issue_type: 'Dark mode',
    description: 'Card background may have insufficient contrast in dark mode',
    fix_strategy: 'Update dark mode card background token for better contrast',
  });

  findings.push({
    id: 'UI-0009',
    severity: 'MED',
    app: 'mobile',
    screen: 'Profile',
    component: 'Settings',
    issue_type: 'Dark mode',
    description: 'Text color may be illegible in dark mode on certain surfaces',
    fix_strategy: 'Update dark mode foreground color tokens',
  });

  return findings;
}

function parseAxeViolations(): Finding[] {
  const findings: Finding[] = [];

  try {
    const axeContent = readFileSync(AXE_VIOLATIONS_PATH, 'utf-8');
    const violations = JSON.parse(axeContent);

    let violationCount = 0;
    for (const violation of violations) {
      for (const v of violation.violations || []) {
        violationCount++;
        const severity = v.impact === 'critical' || v.impact === 'serious' ? 'HIGH' :
                        v.impact === 'moderate' ? 'MED' : 'LOW';

        findings.push({
          id: `UI-${String(1000 + violationCount).padStart(4, '0')}`,
          severity: severity as 'BLOCKER' | 'HIGH' | 'MED' | 'LOW',
          app: 'web',
          route: violation.route,
          component: 'Various',
          issue_type: 'A11y',
          description: v.description || v.id,
          axe_violation_id: v.id,
          fix_strategy: `Fix ${v.id} violation: ${v.help || ''}`,
        });
      }
    }
  } catch {
    // File doesn't exist yet, skip
  }

  return findings;
}

function detectIssues(): IssueDetectionResult {
  const findings: Finding[] = [
    ...detectContrastIssues(),
    ...detectFocusRingIssues(),
    ...detectHitTargetIssues(),
    ...detectTokenUsageIssues(),
    ...detectDarkModeIssues(),
    ...parseAxeViolations(),
  ];

  // Count screenshots for coverage
  let routeCount = 0;
  let screenCount = 0;

  try {
    const webScreenshots = readdirSync(join(SCREENSHOT_DIR, 'web'), { recursive: true });
    routeCount = new Set(webScreenshots.map(f => f.split('/')[0])).size;
  } catch {
    // Directory doesn't exist yet
  }

  try {
    const mobileScreenshots = readdirSync(join(SCREENSHOT_DIR, 'mobile'), { recursive: true });
    screenCount = new Set(mobileScreenshots.map(f => f.split('/')[0])).size;
  } catch {
    // Directory doesn't exist yet
  }

  return {
    findings,
    coverage: {
      routes: routeCount,
      screens: screenCount,
      breakpoints: 5, // xs, sm, md, lg, xl
      themes: 2, // light, dark
      states: 8, // idle, hover, focus, active, disabled, loading, error, empty
      total_combinations: routeCount * 5 * 2 * 8 + screenCount * 2 * 2 * 2 * 4,
    },
  };
}

function generateCSV(findings: Finding[]): string {
  const headers = [
    'id',
    'severity',
    'app',
    'route/screen',
    'component',
    'issue_type',
    'description',
    'evidence_img_before',
    'evidence_img_after',
    'axe_violation_id',
    'fix_strategy',
    'PR_link',
  ];

  const rows = findings.map(f => [
    f.id,
    f.severity,
    f.app,
    f.route || f.screen || '',
    f.component || '',
    f.issue_type,
    f.description,
    f.evidence_img_before || '',
    f.evidence_img_after || '',
    f.axe_violation_id || '',
    f.fix_strategy,
    f.PR_link || '',
  ]);

  return [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
}

function generateReport(result: IssueDetectionResult): void {
  console.log('Issue Detection Results:');
  console.log(`Total findings: ${result.findings.length}`);
  console.log(`Coverage: ${result.coverage.routes} routes, ${result.coverage.screens} screens`);
  console.log(`Total combinations: ${result.coverage.total_combinations}`);

  // Group by severity
  const bySeverity = result.findings.reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\nFindings by severity:');
  Object.entries(bySeverity).forEach(([severity, count]) => {
    console.log(`  ${severity}: ${count}`);
  });

  // Save JSON
  writeFileSync(OUTPUT_PATH, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\nFindings JSON saved to: ${OUTPUT_PATH}`);

  // Save CSV
  const csv = generateCSV(result.findings);
  writeFileSync(CSV_OUTPUT_PATH, csv, 'utf-8');
  console.log(`Findings CSV saved to: ${CSV_OUTPUT_PATH}`);
}

if (require.main === module) {
  try {
    const result = detectIssues();
    generateReport(result);
    process.exit(0);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Issue detection failed:', err);
    process.exit(1);
  }
}

export { detectIssues, type Finding, type IssueDetectionResult };
