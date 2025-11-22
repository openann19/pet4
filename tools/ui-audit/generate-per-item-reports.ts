/**
 * Per-Item Report Generator
 * Generates individual audit reports for each route/screen/module
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { Finding, Summary } from './aggregate';

const INVENTORY_DIR = join(process.cwd(), 'audit/inventory');
const REPORTS_DIR = join(process.cwd(), 'audit/reports');
const CI_DIR = join(process.cwd(), 'ci');

function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
}

function loadSummary(): Summary | null {
  const summaryPath = join(CI_DIR, 'summary.json');
  if (!existsSync(summaryPath)) {
    return null;
  }
  try {
    const content = readFileSync(summaryPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function getFindingsForItem(summary: Summary, itemId: string, kind: 'web' | 'mobile' | 'pkg'): Finding[] {
  return summary.findings.filter(f => f.kind === kind && (f.file === itemId || f.id.includes(itemId)));
}

function generateChecklist(findings: Finding[]): string {
  const hasCritical = findings.some(f => f.severity === 'Critical');
  const hasHigh = findings.some(f => f.severity === 'High');
  const hasMedium = findings.some(f => f.severity === 'Medium');
  const hasLow = findings.some(f => f.severity === 'Low');

  return `
## Checklist

### Quality
- [ ] No banned patterns (console.log, @ts-ignore, eslint-disable, any, framer-motion, dangerouslySetInnerHTML)
- [ ] Hooks stable (exhaustive-deps)
- [ ] No duplication
- [ ] File ≤ 300 lines, function ≤ 60 lines

### Performance
- [ ] Render count ≤ target
- [ ] Memoization applied where needed
- [ ] Images optimized
- [ ] Bundle size within budget

### Accessibility
- [ ] Roles/labels present
- [ ] Tab/focus management
- [ ] Contrast ratios meet WCAG 2.1 AA
- [ ] Reduced motion variants

### Security
- [ ] User input sanitized
- [ ] Links hardened (rel="noopener noreferrer")
- [ ] Analytics minimal (no PII)
- [ ] No secrets in client code

### Error Handling
- [ ] Error boundary present
- [ ] Typed errors
- [ ] Retry UX implemented
- [ ] Offline handling

### i18n
- [ ] No hardcoded strings
- [ ] Keys for en + bg

### Tests
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] A11y tests present
- [ ] E2E tests passing
- [ ] Visual regression snapshots green

### Documentation
- [ ] Props table documented
- [ ] Usage examples
- [ ] A11y notes

## Findings

${hasCritical ? '### 🔴 Critical\n' + findings.filter(f => f.severity === 'Critical').map(f => `- ${f.rule}: ${f.message}`).join('\n') + '\n' : ''}
${hasHigh ? '### ⚠️ High\n' + findings.filter(f => f.severity === 'High').map(f => `- ${f.rule}: ${f.message}`).join('\n') + '\n' : ''}
${hasMedium ? '### ⚠️ Medium\n' + findings.filter(f => f.severity === 'Medium').map(f => `- ${f.rule}: ${f.message}`).join('\n') + '\n' : ''}
${hasLow ? '### ℹ️ Low\n' + findings.filter(f => f.severity === 'Low').map(f => `- ${f.rule}: ${f.message}`).join('\n') + '\n' : ''}

${findings.length === 0 ? '✅ No findings' : ''}
`;
}

function generateWebReport(route: { path: string; slug: string; url: string }, summary: Summary): string {
  const findings = getFindingsForItem(summary, route.slug, 'web');
  const verdict = findings.some(f => f.severity === 'Critical') ? '❌' :
                 findings.some(f => f.severity === 'High') ? '⚠️' : '✅';

  return `# Route: ${route.path}

**URL**: ${route.url}
**Slug**: ${route.slug}
**Verdict**: ${verdict}

${generateChecklist(findings)}

## Artifacts

- Screenshots: \`audit/artifacts/web/snapshots/${route.slug}/\`
- Axe results: \`audit/artifacts/web/axe/${route.slug}.json\`
- Lighthouse: \`audit/artifacts/web/lighthouse/${route.slug}.json\`
- Bundles: \`audit/artifacts/web/bundles/${route.slug}.json\`
`;
}

function generateMobileReport(screen: { name: string; slug: string; testID: string }, summary: Summary): string {
  const findings = getFindingsForItem(summary, screen.slug, 'mobile');
  const verdict = findings.some(f => f.severity === 'Critical') ? '❌' :
                 findings.some(f => f.severity === 'High') ? '⚠️' : '✅';

  return `# Screen: ${screen.name}

**Test ID**: ${screen.testID}
**Slug**: ${screen.slug}
**Verdict**: ${verdict}

${generateChecklist(findings)}

## Artifacts

- Screenshots: \`audit/artifacts/mobile/snapshots/${screen.slug}.png\`
- A11y results: \`audit/artifacts/mobile/a11y/${screen.slug}.json\`
`;
}

function generateModuleReport(module: { path: string; name: string; package: string }, summary: Summary): string {
  const findings = getFindingsForItem(summary, module.name, 'pkg');
  const verdict = findings.some(f => f.severity === 'Critical') ? '❌' :
                 findings.some(f => f.severity === 'High') ? '⚠️' : '✅';

  return `# Module: ${module.name}

**Path**: ${module.path}
**Package**: ${module.package}
**Verdict**: ${verdict}

${generateChecklist(findings)}
`;
}

async function generatePerItemReports(): Promise<void> {
  console.warn('Generating per-item reports...\n');

  const summary = loadSummary();
  if (!summary) {
    console.warn('No summary found. Run aggregate first.');
    return;
  }

  // Load inventories
  const pagesPath = join(INVENTORY_DIR, 'pages.json');
  const screensPath = join(INVENTORY_DIR, 'screens.json');
  const modulesPath = join(INVENTORY_DIR, 'modules.json');

  const webReportsDir = join(REPORTS_DIR, 'web');
  const mobileReportsDir = join(REPORTS_DIR, 'mobile');
  const pkgReportsDir = join(REPORTS_DIR, 'pkg');

  ensureDir(webReportsDir);
  ensureDir(mobileReportsDir);
  ensureDir(pkgReportsDir);

  // Generate web reports
  if (existsSync(pagesPath)) {
    const pages = JSON.parse(readFileSync(pagesPath, 'utf-8'));
    const pagesList = Array.isArray(pages) ? pages : pages.routes || [];

    for (const page of pagesList) {
      const report = generateWebReport(page, summary);
      writeFileSync(join(webReportsDir, `${page.slug}.md`), report, 'utf-8');
    }
    console.warn(`✓ Generated ${pagesList.length} web reports`);
  }

  // Generate mobile reports
  if (existsSync(screensPath)) {
    const screens = JSON.parse(readFileSync(screensPath, 'utf-8'));
    const screensList = Array.isArray(screens) ? screens : screens.screens || [];

    for (const screen of screensList) {
      const report = generateMobileReport(screen, summary);
      writeFileSync(join(mobileReportsDir, `${screen.slug}.md`), report, 'utf-8');
    }
    console.warn(`✓ Generated ${screensList.length} mobile reports`);
  }

  // Generate module reports
  if (existsSync(modulesPath)) {
    const modules = JSON.parse(readFileSync(modulesPath, 'utf-8'));
    const modulesList = Array.isArray(modules) ? modules : modules.modules || [];

    for (const module of modulesList) {
      const report = generateModuleReport(module, summary);
      const moduleSlug = module.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      writeFileSync(join(pkgReportsDir, `${moduleSlug}.md`), report, 'utf-8');
    }
    console.warn(`✓ Generated ${modulesList.length} module reports`);
  }

  console.warn('\nPer-item reports generated successfully');
}

if (require.main === module) {
  (async () => {
    try {
      await generatePerItemReports();
      process.exit(0);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Report generation failed:', err);
      process.exit(1);
    }
  })();
}

export { generatePerItemReports };
