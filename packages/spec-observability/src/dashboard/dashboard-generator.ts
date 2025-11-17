import { readFile, writeFile } from 'fs-extra'
import type { MergedSpec } from '@petspark/spec-core'

/**
 * Dashboard data from merged spec
 */
export interface DashboardData {
  version: string
  mergedAt: string
  totalPacks: number
  packs: Array<{
    packId: string
    version: string
    hash: string
  }>
  configuration: {
    env?: Record<string, string>
    featureFlags?: Record<string, boolean>
    compliance?: {
      hipaa?: boolean
      pci?: boolean
      gdpr?: boolean
      certifications?: string[]
    }
    credentials?: {
      required?: string[]
      optional?: string[]
    }
    budgets?: {
      bundleSize?: number
      lighthouse?: {
        performance?: number
        accessibility?: number
        bestPractices?: number
        seo?: number
      }
    }
  }
  metadata: {
    hash?: string
    mergeDuration?: number
  }
}

/**
 * Load dashboard data from merged spec
 */
export async function loadDashboardData(
  mergedSpecFile: string
): Promise<DashboardData> {
  const content = await readFile(mergedSpecFile, 'utf-8')
  const mergedSpec = JSON.parse(content) as MergedSpec

  return {
    version: mergedSpec.version,
    mergedAt: mergedSpec.mergedAt,
    totalPacks: mergedSpec.metadata.totalPacks,
    packs: mergedSpec.packs,
    configuration: mergedSpec.configuration,
    metadata: mergedSpec.metadata,
  }
}

/**
 * Generate HTML dashboard
 */
export function generateDashboardHTML(data: DashboardData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Spec Dashboard</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 {
      margin-top: 0;
      color: #333;
    }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 20px 0;
    }
    .stat {
      padding: 15px;
      background: #f9f9f9;
      border-radius: 4px;
    }
    .stat-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 5px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }
    .section {
      margin: 30px 0;
    }
    .section h2 {
      color: #333;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background: #f9f9f9;
      font-weight: 600;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-success {
      background: #d4edda;
      color: #155724;
    }
    .badge-warning {
      background: #fff3cd;
      color: #856404;
    }
    .badge-danger {
      background: #f8d7da;
      color: #721c24;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Spec Dashboard</h1>

    <div class="stats">
      <div class="stat">
        <div class="stat-label">Total Packs</div>
        <div class="stat-value">${data.totalPacks}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Merged At</div>
        <div class="stat-value" style="font-size: 14px;">${new Date(data.mergedAt).toLocaleString()}</div>
      </div>
      <div class="stat">
        <div class="stat-label">Merge Duration</div>
        <div class="stat-value">${data.metadata.mergeDuration ?? 0}ms</div>
      </div>
    </div>

    <div class="section">
      <h2>Packs</h2>
      <table>
        <thead>
          <tr>
            <th>Pack ID</th>
            <th>Version</th>
            <th>Hash</th>
          </tr>
        </thead>
        <tbody>
          ${data.packs.map((pack) => `
            <tr>
              <td>${pack.packId}</td>
              <td>${pack.version}</td>
              <td><code>${pack.hash.substring(0, 16)}...</code></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    ${data.configuration.compliance ? `
    <div class="section">
      <h2>Compliance</h2>
      <table>
        <tbody>
          ${data.configuration.compliance.hipaa !== undefined ? `
            <tr>
              <td>HIPAA</td>
              <td><span class="badge ${data.configuration.compliance.hipaa ? 'badge-success' : 'badge-warning'}">${data.configuration.compliance.hipaa ? 'Enabled' : 'Disabled'}</span></td>
            </tr>
          ` : ''}
          ${data.configuration.compliance.pci !== undefined ? `
            <tr>
              <td>PCI</td>
              <td><span class="badge ${data.configuration.compliance.pci ? 'badge-success' : 'badge-warning'}">${data.configuration.compliance.pci ? 'Enabled' : 'Disabled'}</span></td>
            </tr>
          ` : ''}
          ${data.configuration.compliance.gdpr !== undefined ? `
            <tr>
              <td>GDPR</td>
              <td><span class="badge ${data.configuration.compliance.gdpr ? 'badge-success' : 'badge-warning'}">${data.configuration.compliance.gdpr ? 'Enabled' : 'Disabled'}</span></td>
            </tr>
          ` : ''}
          ${data.configuration.compliance.certifications && data.configuration.compliance.certifications.length > 0 ? `
            <tr>
              <td>Certifications</td>
              <td>${data.configuration.compliance.certifications.join(', ')}</td>
            </tr>
          ` : ''}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${data.configuration.budgets ? `
    <div class="section">
      <h2>Budgets</h2>
      <table>
        <tbody>
          ${data.configuration.budgets.bundleSize ? `
            <tr>
              <td>Bundle Size</td>
              <td>${data.configuration.budgets.bundleSize} bytes</td>
            </tr>
          ` : ''}
          ${data.configuration.budgets.lighthouse ? `
            <tr>
              <td>Lighthouse Performance</td>
              <td>${data.configuration.budgets.lighthouse.performance ?? 'N/A'}</td>
            </tr>
            <tr>
              <td>Lighthouse Accessibility</td>
              <td>${data.configuration.budgets.lighthouse.accessibility ?? 'N/A'}</td>
            </tr>
            <tr>
              <td>Lighthouse Best Practices</td>
              <td>${data.configuration.budgets.lighthouse.bestPractices ?? 'N/A'}</td>
            </tr>
            <tr>
              <td>Lighthouse SEO</td>
              <td>${data.configuration.budgets.lighthouse.seo ?? 'N/A'}</td>
            </tr>
          ` : ''}
        </tbody>
      </table>
    </div>
    ` : ''}
  </div>
</body>
</html>`
}

/**
 * Generate dashboard file
 */
export async function generateDashboard(
  mergedSpecFile: string,
  outputFile: string
): Promise<void> {
  const data = await loadDashboardData(mergedSpecFile)
  const html = generateDashboardHTML(data)
  await writeFile(outputFile, html, 'utf-8')
}
