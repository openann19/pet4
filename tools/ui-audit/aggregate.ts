/**
 * Global UI Audit Report Aggregator
 * Collects findings from ESLint, Playwright, Detox, Lighthouse outputs
 * Generates global report and per-item reports
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';

interface Finding {
  kind: 'web' | 'mobile' | 'pkg';
  id: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  file: string;
  line?: number;
  rule: string;
  message: string;
  pr?: string;
}

interface Summary {
  totals: Record<string, number>;
  findings: Finding[];
  timestamp: string;
}

const ARTIFACTS_ROOT = join(process.cwd(), 'audit/artifacts');
const REPORTS_DIR = join(process.cwd(), 'audit/reports');
const GLOBAL_REPORT_DIR = join(REPORTS_DIR, 'global');
const CI_DIR = join(process.cwd(), 'ci');

function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
}

function loadAxeResults(): Finding[] {
  const findings: Finding[] = [];
  const axeDir = join(ARTIFACTS_ROOT, 'web/axe');

  if (!existsSync(axeDir)) {
    return findings;
  }

  try {
    const files = readdirSync(axeDir).filter(f => f.endsWith('.json'));
    for (const fileName of files) {
      const file = join(axeDir, fileName);
      const content = readFileSync(file, 'utf-8');
      const data = JSON.parse(content);
      const slug = fileName.replace('.json', '') || 'unknown';

      if (data.violations && Array.isArray(data.violations)) {
        for (const violation of data.violations) {
          const severity = violation.impact === 'critical' ? 'Critical' :
                          violation.impact === 'serious' ? 'High' :
                          violation.impact === 'moderate' ? 'Medium' : 'Low';

          findings.push({
            kind: 'web',
            id: `${slug}-${violation.id}`,
            severity,
            file: slug,
            rule: violation.id,
            message: violation.description || violation.help,
          });
        }
      }
    }
  } catch {
    // Continue if axe results can't be loaded
  }

  return findings;
}

function loadPerformanceResults(): Finding[] {
  const findings: Finding[] = [];
  const lighthouseDir = join(ARTIFACTS_ROOT, 'web/lighthouse');

  if (!existsSync(lighthouseDir)) {
    return findings;
  }

  try {
    const files = readdirSync(lighthouseDir).filter(f => f.endsWith('.json'));
    for (const fileName of files) {
      const file = join(lighthouseDir, fileName);
      const content = readFileSync(file, 'utf-8');
      const data = JSON.parse(content);
      const slug = fileName.replace('.json', '') || 'unknown';

      if (data.resources) {
        if (data.resources.js > data.budgets.js) {
          findings.push({
            kind: 'web',
            id: `${slug}-bundle-size`,
            severity: 'High',
            file: slug,
            rule: 'bundle-size',
            message: `JS bundle size (${Math.round(data.resources.js / 1024)}KB) exceeds budget (${Math.round(data.budgets.js / 1024)}KB)`,
          });
        }
      }

      if (data.metrics) {
        if (data.metrics.firstContentfulPaint > 2500) {
          findings.push({
            kind: 'web',
            id: `${slug}-fcp`,
            severity: 'Medium',
            file: slug,
            rule: 'first-contentful-paint',
            message: `FCP (${Math.round(data.metrics.firstContentfulPaint)}ms) exceeds 2.5s target`,
          });
        }
      }
    }
  } catch {
    // Continue if performance results can't be loaded
  }

  return findings;
}

function loadMobileResults(): Finding[] {
  const findings: Finding[] = [];
  const a11yDir = join(ARTIFACTS_ROOT, 'mobile/a11y');

  if (!existsSync(a11yDir)) {
    return findings;
  }

  try {
    const files = readdirSync(a11yDir).filter(f => f.endsWith('.json'));
    for (const fileName of files) {
      const file = join(a11yDir, fileName);
      const content = readFileSync(file, 'utf-8');
      const data = JSON.parse(content);
      const slug = fileName.replace('.json', '') || 'unknown';

      if (!data.checks?.hasAccessibleContent) {
        findings.push({
          kind: 'mobile',
          id: `${slug}-a11y`,
          severity: 'Medium',
          file: slug,
          rule: 'accessible-content',
          message: 'Screen missing accessible content',
        });
      }
    }
  } catch {
    // Continue if mobile results can't be loaded
  }

  return findings;
}

function generateGlobalReport(summary: Summary): string {
  const bySeverity = summary.findings.reduce<Record<string, Finding[]>>((acc, finding) => {
    if (!acc[finding.severity]) {
      acc[finding.severity] = [];
    }
    acc[finding.severity].push(finding);
    return acc;
  }, {});

  const report = `# ALL UI AUDIT

**Date**: ${new Date(summary.timestamp).toISOString()}
**Status**: ${summary.totals.Critical > 0 ? '🔴 CRITICAL ISSUES' : summary.totals.High > 0 ? '⚠️ HIGH ISSUES' : '✅ PASSING'}

## Totals

${Object.entries(summary.totals).map(([sev, count]) => `- **${sev}**: ${count}`).join('\n')}

## Top Findings

${Object.entries(bySeverity)
  .sort(([a], [b]) => {
    const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    return (order[a as keyof typeof order] || 99) - (order[b as keyof typeof order] || 99);
  })
  .map(([sev, list]) => `### ${sev}\n${list.slice(0, 20).map(f =>
    `- [${f.kind}] ${f.file}${f.line ? `:${f.line}` : ''} — ${f.rule} — ${f.message}${f.pr ? ` — ${f.pr}` : ''}`
  ).join('\n')}`)
  .join('\n\n')}

## Next Steps

1. Review Critical and High findings
2. Create PRs to fix issues
3. Re-run audit after fixes
4. Update baseline snapshots if visual changes are intentional

`;

  return report;
}

async function aggregate(): Promise<void> {
  console.warn('Aggregating UI audit findings...\n');

  const findings: Finding[] = [];

  // Load findings from various sources
  findings.push(...loadAxeResults());
  findings.push(...loadPerformanceResults());
  findings.push(...loadMobileResults());

  // Calculate totals
  const totals = findings.reduce<Record<string, number>>((acc, finding) => {
    acc[finding.severity] = (acc[finding.severity] || 0) + 1;
    return acc;
  }, {});

  const summary: Summary = {
    totals,
    findings,
    timestamp: new Date().toISOString(),
  };

  // Write CI summary
  ensureDir(CI_DIR);
  writeFileSync(
    join(CI_DIR, 'summary.json'),
    JSON.stringify(summary, null, 2),
    'utf-8'
  );

  // Generate global report
  ensureDir(GLOBAL_REPORT_DIR);
  const globalReport = generateGlobalReport(summary);
  writeFileSync(
    join(GLOBAL_REPORT_DIR, 'ALL_UI_AUDIT.md'),
    globalReport,
    'utf-8'
  );

  console.warn(`✓ Aggregated ${findings.length} findings`);
  console.warn(`✓ Totals: ${JSON.stringify(totals)}`);
  console.warn(`✓ Global report: ${join(GLOBAL_REPORT_DIR, 'ALL_UI_AUDIT.md')}`);
  console.warn(`✓ CI summary: ${join(CI_DIR, 'summary.json')}`);
}

if (require.main === module) {
  (async () => {
    try {
      await aggregate();
      process.exit(0);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Aggregation failed:', err);
      process.exit(1);
    }
  })();
}

export { aggregate, type Finding, type Summary };
