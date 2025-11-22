/**
 * Navigation Audit Tests
 *
 * Crawls all routes, tests client-side navigation, and asserts no navigation errors.
 * Catches: pageerror, console errors, HTTP ≥400, hydration errors, ChunkLoadError.
 *
 * Location: apps/web/e2e/nav/navigation.spec.ts
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const BASE = process.env.BASE_URL ?? 'http://localhost:5173';
const MAX_PAGES = Number(process.env.NAV_MAX_PAGES ?? 400);

interface NavigationError {
  kind: string;
  t: number;
  message?: string;
  stack?: string;
  src?: string;
  note?: string;
  reason?: string;
  url?: string;
  status?: number;
  failure?: string;
}

interface NavigationReport {
  timestamp: string;
  baseUrl: string;
  totalPagesVisited: number;
  errors: {
    navErrors: NavigationError[];
    httpErrors: NavigationError[];
    consoleErrors: string[];
    hydrationErrors: string[];
    chunkErrors: string[];
  };
  routes: Array<{
    url: string;
    visited: boolean;
    errors: NavigationError[];
  }>;
}

test.describe('Navigation audit', () => {
  test('crawl, client-nav, and assert no nav errors', async ({ page }) => {
    const visited = new Set<string>();
    const queue: string[] = [BASE];
    const navErrors: NavigationError[] = [];
    const httpErrors: NavigationError[] = [];
    const consoleErrors: string[] = [];
    const routes: Array<{ url: string; visited: boolean; errors: NavigationError[] }> = [];

    page.on('pageerror', (err) => {
      navErrors.push({
        kind: 'pageerror',
        t: Date.now(),
        message: err.message,
        stack: err.stack,
      });
    });

    page.on('console', (msg) => {
      const type = msg.type();
      if (type === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
      }
    });

    page.on('requestfailed', (req) => {
      httpErrors.push({
        kind: 'requestfailed',
        t: Date.now(),
        url: req.url(),
        failure: req.failure()?.errorText,
      });
    });

    page.on('response', async (res) => {
      const status = res.status();
      if (status >= 400) {
        httpErrors.push({
          kind: 'http-error',
          t: Date.now(),
          url: res.url(),
          status,
        });
      }
    });

    const seen = (u: string): boolean => {
      return visited.has(u) || !u.startsWith(BASE);
    };

    while (queue.length > 0 && visited.size < MAX_PAGES) {
      const url = queue.shift();
      if (!url || seen(url)) {
        continue;
      }

      visited.add(url);
      const routeErrors: NavigationError[] = [];

      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

        const trapped = await page.evaluate(() => {
          return (window as { __NAV_ERRORS__?: NavigationError[] }).__NAV_ERRORS__ ?? [];
        });

        trapped.forEach((t: NavigationError) => {
          navErrors.push(t);
          routeErrors.push(t);
        });

        const bodyText = await page.locator('body').textContent();
        const isErrorPage =
          bodyText?.includes('Application error') ||
          bodyText?.includes('Route error') ||
          bodyText?.includes('404') ||
          bodyText?.includes('Not found');

        if (isErrorPage) {
          routeErrors.push({
            kind: 'error-page-detected',
            t: Date.now(),
            message: `Error page detected at ${url}`,
            url,
          });
        }

        routes.push({
          url,
          visited: true,
          errors: routeErrors,
        });

        const hrefs = await page.$$eval('a[href]', (as) =>
          as.map((a) => (a as HTMLAnchorElement).href)
        );

        for (const h of hrefs) {
          if (!seen(h)) {
            queue.push(h);
          }
        }

        const internalLinks = hrefs.filter((h) => h.startsWith(BASE)).slice(0, 10);

        for (const h of internalLinks) {
          try {
            const pathname = new URL(h).pathname;
            const linkSelector = `a[href="${pathname}"], a[href="${h}"]`;

            await Promise.all([
              page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {}),
              page.click(linkSelector).catch(() => {}),
            ]);

            await page.waitForTimeout(500);

            const currentBodyText = await page.locator('body').textContent();
            const isCurrentErrorPage =
              currentBodyText?.includes('Application error') ||
              currentBodyText?.includes('Route error') ||
              (currentBodyText?.includes('404') && currentBodyText?.includes('Not found'));

            if (isCurrentErrorPage) {
              routeErrors.push({
                kind: 'client-nav-error-page',
                t: Date.now(),
                message: `Error page after client navigation to ${h}`,
                url: h,
              });
            }
          } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            routeErrors.push({
              kind: 'client-nav-exception',
              t: Date.now(),
              message: error.message,
              stack: error.stack,
              url: h,
            });
          }
        }

        const axe = await new AxeBuilder({ page }).analyze();
        const critical = axe.violations.filter((v) =>
          ['critical', 'serious'].includes(v.impact ?? '')
        );

        if (critical.length > 0) {
          routeErrors.push({
            kind: 'a11y-violation',
            t: Date.now(),
            message: `A11y critical/serious violations at ${url}: ${JSON.stringify(critical.map((v) => v.id))}`,
            url,
          });
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        routeErrors.push({
          kind: 'navigation-exception',
          t: Date.now(),
          message: error.message,
          stack: error.stack,
          url,
        });
        navErrors.push(routeErrors[routeErrors.length - 1]);
      }
    }

    const hydrationErrors = consoleErrors.filter((t) =>
      /Hydration failed|hydration/i.test(t)
    );

    const chunkErrors = [
      ...consoleErrors,
      ...navErrors.map((n) => n.message || n.note).filter(Boolean),
    ]
      .filter(Boolean)
      .filter((t) => /ChunkLoadError|Loading chunk failed|chunkload/i.test(String(t)));

    const report: NavigationReport = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE,
      totalPagesVisited: visited.size,
      errors: {
        navErrors,
        httpErrors,
        consoleErrors,
        hydrationErrors,
        chunkErrors,
      },
      routes,
    };

    const reportDir = join(process.cwd(), 'playwright-report', 'nav-audit');
    mkdirSync(reportDir, { recursive: true });

    const reportPath = join(reportDir, `navigation-report-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    const htmlReport = generateHTMLReport(report);
    const htmlPath = join(reportDir, `navigation-report-${Date.now()}.html`);
    writeFileSync(htmlPath, htmlReport);

    expect(
      navErrors,
      `Runtime nav errors found:\n${JSON.stringify(navErrors, null, 2)}\n\nReport saved to: ${reportPath}`
    ).toEqual([]);

    expect(
      httpErrors,
      `HTTP errors found:\n${JSON.stringify(httpErrors, null, 2)}\n\nReport saved to: ${reportPath}`
    ).toEqual([]);

    expect(
      hydrationErrors,
      `Hydration mismatches found:\n${hydrationErrors.join('\n')}\n\nReport saved to: ${reportPath}`
    ).toEqual([]);

    expect(
      chunkErrors,
      `Chunk load errors found:\n${chunkErrors.join('\n')}\n\nReport saved to: ${reportPath}`
    ).toEqual([]);
  });
});

function generateHTMLReport(report: NavigationReport): string {
  const errorCount =
    report.errors.navErrors.length +
    report.errors.httpErrors.length +
    report.errors.hydrationErrors.length +
    report.errors.chunkErrors.length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Navigation Audit Report</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      color: #333;
    }
    .stat-label {
      color: #666;
      font-size: 0.9em;
    }
    .error {
      color: #d32f2f;
    }
    .success {
      color: #388e3c;
    }
    .section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .error-item {
      background: #ffebee;
      padding: 10px;
      margin: 10px 0;
      border-radius: 4px;
      border-left: 4px solid #d32f2f;
    }
    pre {
      background: #f5f5f5;
      padding: 10px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.85em;
    }
    .route-item {
      padding: 10px;
      margin: 5px 0;
      border-radius: 4px;
      background: #f9f9f9;
    }
    .route-item.has-errors {
      background: #ffebee;
      border-left: 4px solid #d32f2f;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Navigation Audit Report</h1>
    <p><strong>Timestamp:</strong> ${report.timestamp}</p>
    <p><strong>Base URL:</strong> ${report.baseUrl}</p>
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="stat-value ${errorCount === 0 ? 'success' : 'error'}">${errorCount}</div>
      <div class="stat-label">Total Errors</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${report.totalPagesVisited}</div>
      <div class="stat-label">Pages Visited</div>
    </div>
    <div class="stat-card">
      <div class="stat-value ${report.errors.navErrors.length === 0 ? 'success' : 'error'}">${report.errors.navErrors.length}</div>
      <div class="stat-label">Navigation Errors</div>
    </div>
    <div class="stat-card">
      <div class="stat-value ${report.errors.httpErrors.length === 0 ? 'success' : 'error'}">${report.errors.httpErrors.length}</div>
      <div class="stat-label">HTTP Errors</div>
    </div>
    <div class="stat-card">
      <div class="stat-value ${report.errors.hydrationErrors.length === 0 ? 'success' : 'error'}">${report.errors.hydrationErrors.length}</div>
      <div class="stat-label">Hydration Errors</div>
    </div>
    <div class="stat-card">
      <div class="stat-value ${report.errors.chunkErrors.length === 0 ? 'success' : 'error'}">${report.errors.chunkErrors.length}</div>
      <div class="stat-label">Chunk Errors</div>
    </div>
  </div>

  ${report.errors.navErrors.length > 0 ? `
  <div class="section">
    <h2>Navigation Errors</h2>
    ${report.errors.navErrors.map(
      (err) => `
      <div class="error-item">
        <strong>${err.kind}</strong> - ${err.message || 'No message'}
        ${err.url ? `<br><small>URL: ${err.url}</small>` : ''}
        ${err.stack ? `<pre>${err.stack}</pre>` : ''}
      </div>
    `
    ).join('')}
  </div>
  ` : ''}

  ${report.errors.httpErrors.length > 0 ? `
  <div class="section">
    <h2>HTTP Errors</h2>
    ${report.errors.httpErrors.map(
      (err) => `
      <div class="error-item">
        <strong>${err.kind}</strong> - ${err.status || 'No status'}
        <br><small>URL: ${err.url}</small>
        ${err.failure ? `<br><small>Failure: ${err.failure}</small>` : ''}
      </div>
    `
    ).join('')}
  </div>
  ` : ''}

  ${report.errors.hydrationErrors.length > 0 ? `
  <div class="section">
    <h2>Hydration Errors</h2>
    ${report.errors.hydrationErrors.map((err) => `<div class="error-item">${err}</div>`).join('')}
  </div>
  ` : ''}

  ${report.errors.chunkErrors.length > 0 ? `
  <div class="section">
    <h2>Chunk Load Errors</h2>
    ${report.errors.chunkErrors.map((err) => `<div class="error-item">${err}</div>`).join('')}
  </div>
  ` : ''}

  <div class="section">
    <h2>Routes Visited (${report.routes.length})</h2>
    ${report.routes.map(
      (route) => `
      <div class="route-item ${route.errors.length > 0 ? 'has-errors' : ''}">
        <strong>${route.url}</strong>
        ${route.errors.length > 0 ? `<br><small>Errors: ${route.errors.length}</small>` : ''}
      </div>
    `
    ).join('')}
  </div>
</body>
</html>`;
}
