/**
 * Generate UI Audit Report
 * Creates the main INDEX.md report with executive summary and findings
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
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

const FINDINGS_PATH = join(process.cwd(), 'reports/ui-audit/findings.json');
const REPORT_DIR = join(process.cwd(), 'reports/ui-audit');

function generateReport(): void {
  // Read findings
  let findings: Finding[] = [];
  let coverage = {
    routes: 0,
    screens: 0,
    breakpoints: 5,
    themes: 2,
    states: 8,
    total_combinations: 0,
  };

  try {
    const findingsContent = readFileSync(FINDINGS_PATH, 'utf-8');
    const result: IssueDetectionResult = JSON.parse(findingsContent);
    findings = result.findings;
    coverage = result.coverage;
  } catch {
    // File doesn't exist yet, use defaults
  }

  // Generate timestamp
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const reportDir = join(REPORT_DIR, timestamp);
  mkdirSync(reportDir, { recursive: true });

  // Group findings by severity
  const blocker = findings.filter(f => f.severity === 'BLOCKER');
  const high = findings.filter(f => f.severity === 'HIGH');
  const med = findings.filter(f => f.severity === 'MED');
  const low = findings.filter(f => f.severity === 'LOW');

  // Group by issue type
  const byType = findings.reduce((acc, f) => {
    acc[f.issue_type] = (acc[f.issue_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by app
  const byApp = findings.reduce((acc, f) => {
    acc[f.app] = (acc[f.app] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top risks
  const topRisks = [...blocker, ...high].slice(0, 10);

  // Generate markdown report
  const report = `# UI Audit Report

**Generated:** ${now.toISOString()}
**Audit ID:** ${timestamp}

## Executive Summary

### Top Risks

${topRisks.length > 0 ? topRisks.map(f => `- **${f.id}** (${f.severity}): ${f.description}`).join('\n') : 'No critical risks identified.'}

### Pages Impacted

- **Web routes:** ${coverage.routes}
- **Mobile screens:** ${coverage.screens}
- **Total combinations tested:** ${coverage.total_combinations}

### Coverage Matrix

| Dimension | Count |
|-----------|-------|
| Routes | ${coverage.routes} |
| Screens | ${coverage.screens} |
| Breakpoints | ${coverage.breakpoints} |
| Themes | ${coverage.themes} |
| States | ${coverage.states} |

### Findings Summary

| Severity | Count |
|----------|-------|
| BLOCKER | ${blocker.length} |
| HIGH | ${high.length} |
| MED | ${med.length} |
| LOW | ${low.length} |
| **Total** | **${findings.length}** |

### Findings by Issue Type

${Object.entries(byType).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

### Findings by App

${Object.entries(byApp).map(([app, count]) => `- ${app}: ${count}`).join('\n')}

## Findings Table

| ID | Severity | App | Route/Screen | Component | Issue Type | Description | Fix Strategy |
|----|----------|-----|--------------|-----------|------------|-------------|--------------|
${findings.map(f => `| ${f.id} | ${f.severity} | ${f.app} | ${f.route || f.screen || ''} | ${f.component || ''} | ${f.issue_type} | ${f.description} | ${f.fix_strategy} |`).join('\n')}

## Coverage Details

### Routes Tested

${coverage.routes > 0 ? `- ${coverage.routes} routes captured` : 'No routes captured yet'}

### Screens Tested

${coverage.screens > 0 ? `- ${coverage.screens} screens captured` : 'No screens captured yet'}

## Next Steps

1. Review findings by severity (start with BLOCKER and HIGH)
2. Apply auto-fixes from Wave 1 (token enforcement, focus rings, buttons)
3. Apply auto-fixes from Wave 2 (forms, dark mode, hit-targets)
4. Re-capture screenshots after fixes
5. Update findings with before/after evidence
6. Create PRs for each category

## Files

- Findings JSON: \`findings.json\`
- Findings CSV: \`findings.csv\`
- Axe Violations: \`axe-violations.json\`
- Screenshots: \`screens/\`

`;

  const indexPath = join(reportDir, 'INDEX.md');
  writeFileSync(indexPath, report, 'utf-8');
  console.log(`Report generated: ${indexPath}`);
}

if (require.main === module) {
  try {
    generateReport();
    process.exit(0);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Report generation failed:', err);
    process.exit(1);
  }
}

export { generateReport };
