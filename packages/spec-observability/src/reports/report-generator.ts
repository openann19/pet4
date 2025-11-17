import { readFile, writeFile } from 'fs-extra'
import type { MergedSpec } from '@petspark/spec-core'

/**
 * Generate SPEC_REPORT.md
 */
export async function generateSpecReport(
  mergedSpecFile: string,
  outputFile: string
): Promise<void> {
  const content = await readFile(mergedSpecFile, 'utf-8')
  const mergedSpec = JSON.parse(content) as MergedSpec

  const report = `# Spec Report

Generated: ${new Date().toISOString()}

## Summary

- **Total Packs**: ${mergedSpec.metadata.totalPacks}
- **Merged At**: ${mergedSpec.mergedAt}
- **Merge Duration**: ${mergedSpec.metadata.mergeDuration ?? 0}ms
- **Hash**: ${mergedSpec.metadata.hash ?? 'N/A'}

## Packs

${mergedSpec.packs.map((pack) => `- \`${pack.packId}@${pack.version}\` (${pack.hash.substring(0, 16)}...)`).join('\n')}

## Configuration

### Environment Variables

${mergedSpec.configuration.env ? Object.keys(mergedSpec.configuration.env).length > 0 ? Object.keys(mergedSpec.configuration.env).map((key) => `- \`${key}\``).join('\n') : 'None' : 'None'}

### Feature Flags

${mergedSpec.configuration.featureFlags ? Object.keys(mergedSpec.configuration.featureFlags).length > 0 ? Object.entries(mergedSpec.configuration.featureFlags).map(([key, value]) => `- \`${key}\`: ${value}`).join('\n') : 'None' : 'None'}

### Compliance

${mergedSpec.configuration.compliance ? `
- **HIPAA**: ${mergedSpec.configuration.compliance.hipaa ? 'Enabled' : 'Disabled'}
- **PCI**: ${mergedSpec.configuration.compliance.pci ? 'Enabled' : 'Disabled'}
- **GDPR**: ${mergedSpec.configuration.compliance.gdpr ? 'Enabled' : 'Disabled'}
- **Certifications**: ${mergedSpec.configuration.compliance.certifications?.join(', ') ?? 'None'}
` : 'None'}

### Budgets

${mergedSpec.configuration.budgets ? `
- **Bundle Size**: ${mergedSpec.configuration.budgets.bundleSize ?? 'N/A'} bytes
- **Lighthouse Performance**: ${mergedSpec.configuration.budgets.lighthouse?.performance ?? 'N/A'}
- **Lighthouse Accessibility**: ${mergedSpec.configuration.budgets.lighthouse?.accessibility ?? 'N/A'}
- **Lighthouse Best Practices**: ${mergedSpec.configuration.budgets.lighthouse?.bestPractices ?? 'N/A'}
- **Lighthouse SEO**: ${mergedSpec.configuration.budgets.lighthouse?.seo ?? 'N/A'}
` : 'None'}

### Credentials

${mergedSpec.configuration.credentials ? `
- **Required**: ${mergedSpec.configuration.credentials.required?.join(', ') ?? 'None'}
- **Optional**: ${mergedSpec.configuration.credentials.optional?.join(', ') ?? 'None'}
` : 'None'}
`

  await writeFile(outputFile, report, 'utf-8')
}

/**
 * Generate AI_PROMPTS.md
 */
export async function generateAiPrompts(
  mergedSpecFile: string,
  outputFile: string
): Promise<void> {
  const content = await readFile(mergedSpecFile, 'utf-8')
  const mergedSpec = JSON.parse(content) as MergedSpec

  const prompts = `# AI Prompts

Generated: ${new Date().toISOString()}

## Pack Context

The following packs are active in this specification:

${mergedSpec.packs.map((pack) => `- **${pack.packId}** (v${pack.version})`).join('\n')}

## Configuration Summary

### Feature Flags

${mergedSpec.configuration.featureFlags ? Object.entries(mergedSpec.configuration.featureFlags).map(([key, value]) => `- \`${key}\`: ${value ? 'enabled' : 'disabled'}`).join('\n') : 'None configured'}

### Compliance Requirements

${mergedSpec.configuration.compliance ? `
- HIPAA: ${mergedSpec.configuration.compliance.hipaa ? 'required' : 'not required'}
- PCI: ${mergedSpec.configuration.compliance.pci ? 'required' : 'not required'}
- GDPR: ${mergedSpec.configuration.compliance.gdpr ? 'required' : 'not required'}
` : 'None'}

### Performance Budgets

${mergedSpec.configuration.budgets ? `
- Bundle Size: ${mergedSpec.configuration.budgets.bundleSize ?? 'not set'}
- Lighthouse Performance: ${mergedSpec.configuration.budgets.lighthouse?.performance ?? 'not set'}
- Lighthouse Accessibility: ${mergedSpec.configuration.budgets.lighthouse?.accessibility ?? 'not set'}
` : 'None'}

## Usage

When implementing features or making changes, ensure compliance with the above configuration and budgets.
`

  await writeFile(outputFile, prompts, 'utf-8')
}
