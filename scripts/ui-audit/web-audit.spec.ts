/**
 * Comprehensive Web UI Audit with Playwright
 * Captures screenshots, runs accessibility scans, and generates findings
 */
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Configuration
const REPORT_DIR = join(process.cwd(), 'reports/ui-audit/20250112-0545');
const SCREENSHOTS_DIR = join(REPORT_DIR, 'screens/web');
const ROUTE_MAP = JSON.parse(readFileSync(join(REPORT_DIR, 'route-map.json'), 'utf-8'));

const BREAKPOINTS = [
  { name: 'xs', width: 375, height: 667 },
  { name: 'sm', width: 640, height: 900 },
  { name: 'md', width: 768, height: 1024 },
  { name: 'lg', width: 1024, height: 768 },
  { name: 'xl', width: 1440, height: 900 },
];

const THEMES = ['light', 'dark'];
const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:5173';

interface Finding {
  id: string;
  severity: 'BLOCKER' | 'HIGH' | 'MED' | 'LOW';
  app: 'web' | 'mobile';
  route: string;
  component: string;
  issue_type: string;
  description: string;
  evidence_img_before: string;
  evidence_img_after?: string;
  axe_violation_id?: string;
  fix_strategy: string;
  pr_link?: string;
}

const findings: Finding[] = [];
let findingCounter = 1;

function addFinding(finding: Omit<Finding, 'id'>) {
  findings.push({
    id: `UI-${String(findingCounter).padStart(4, '0')}`,
    ...finding,
  });
  findingCounter++;
}

// Utility: Setup theme
async function setTheme(page: Page, theme: 'light' | 'dark') {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.toggle('dark', t === 'dark');
  }, theme);
  await page.waitForTimeout(100); // Let theme transition settle
}

// Utility: Check contrast
function checkContrast(fg: string, bg: string): { ratio: number; passes: boolean } {
  // Simplified WCAG contrast calculation
  // In production, use a proper color contrast library
  const getLuminance = (hex: string): number => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = ((rgb >> 16) & 0xff) / 255;
    const g = ((rgb >> 8) & 0xff) / 255;
    const b = (rgb & 0xff) / 255;
    
    const [rs, gs, bs] = [r, g, b].map(c => 
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const l1 = getLuminance(fg);
  const l2 = getLuminance(bg);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return {
    ratio,
    passes: ratio >= 4.5, // AA for normal text
  };
}

// Test: Audit all routes
test.describe('Web UI Comprehensive Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Create screenshot directories
    mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  });

  for (const breakpoint of BREAKPOINTS) {
    for (const theme of THEMES) {
      test(`Audit root route - ${breakpoint.name} - ${theme}`, async ({ page }) => {
        await page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
        await page.goto(BASE_URL);
        await setTheme(page, theme);

        // Wait for initial load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(500);

        const screenshotPath = join(
          SCREENSHOTS_DIR,
          `root/${breakpoint.name}-${theme}-idle.png`
        );
        await page.screenshot({ path: screenshotPath, fullPage: true });

        // Run accessibility scan
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();

        // Process violations
        for (const violation of accessibilityScanResults.violations) {
          const severity = 
            violation.impact === 'critical' ? 'BLOCKER' :
            violation.impact === 'serious' ? 'HIGH' :
            violation.impact === 'moderate' ? 'MED' : 'LOW';

          addFinding({
            severity,
            app: 'web',
            route: '/',
            component: violation.nodes[0]?.target.join(' > ') || 'Unknown',
            issue_type: 'A11y',
            description: `${violation.help}: ${violation.description}`,
            evidence_img_before: screenshotPath,
            axe_violation_id: violation.id,
            fix_strategy: violation.helpUrl,
          });
        }

        // Check focus rings
        const buttons = await page.locator('button, a[role="button"]').all();
        for (let i = 0; i < Math.min(buttons.length, 10); i++) {
          const button = buttons[i];
          await button.focus();
          const outline = await button.evaluate(el => {
            const computed = window.getComputedStyle(el, ':focus-visible');
            return {
              outline: computed.outline,
              outlineColor: computed.outlineColor,
              boxShadow: computed.boxShadow,
            };
          });

          if (outline.outline === 'none' && outline.boxShadow === 'none') {
            addFinding({
              severity: 'HIGH',
              app: 'web',
              route: '/',
              component: await button.evaluate(el => el.tagName + (el.className ? `.${el.className.split(' ')[0]}` : '')),
              issue_type: 'Focus/Outline',
              description: 'No visible focus indicator',
              evidence_img_before: screenshotPath,
              fix_strategy: 'Add focus-visible:ring-2 ring-offset-2 with brand ring color',
            });
          }
        }

        // Check hit targets (mobile only)
        if (breakpoint.width <= 640) {
          const interactiveElements = await page.locator('button, a, input, select, textarea').all();
          for (const elem of interactiveElements) {
            const box = await elem.boundingBox();
            if (box && (box.width < 44 || box.height < 44)) {
              addFinding({
                severity: 'MED',
                app: 'web',
                route: '/',
                component: await elem.evaluate(el => el.tagName + (el.className ? `.${el.className.split(' ')[0]}` : '')),
                issue_type: 'Hit-target',
                description: `Interactive element too small: ${Math.round(box.width)}×${Math.round(box.height)}px (min 44×44)`,
                evidence_img_before: screenshotPath,
                fix_strategy: 'Increase padding or min-height/min-width to meet 44×44dp',
              });
            }
          }
        }
      });
    }
  }

  test.afterAll(() => {
    // Write findings to JSON and CSV
    const jsonPath = join(REPORT_DIR, 'findings.json');
    const csvPath = join(REPORT_DIR, 'findings.csv');

    writeFileSync(jsonPath, JSON.stringify(findings, null, 2));

    const csvHeaders = [
      'id', 'severity', 'app', 'route', 'component', 'issue_type',
      'description', 'evidence_img_before', 'evidence_img_after',
      'axe_violation_id', 'fix_strategy', 'pr_link'
    ].join(',');

    const csvRows = findings.map(f => [
      f.id,
      f.severity,
      f.app,
      f.route,
      f.component,
      f.issue_type,
      `"${f.description.replace(/"/g, '""')}"`,
      f.evidence_img_before,
      f.evidence_img_after || '',
      f.axe_violation_id || '',
      `"${f.fix_strategy.replace(/"/g, '""')}"`,
      f.pr_link || '',
    ].join(','));

    writeFileSync(csvPath, [csvHeaders, ...csvRows].join('\n'));

    console.log(`\n✅ Audit complete: ${findings.length} findings`);
    console.log(`📊 Report: ${jsonPath}`);
    console.log(`📊 CSV: ${csvPath}`);
  });
});
