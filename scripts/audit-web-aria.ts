#!/usr/bin/env tsx
/**
 * Web ARIA Labels Audit Script
 *
 * Scans all web components for ARIA label compliance using regex patterns.
 * Checks for:
 * - aria-label or aria-labelledby on interactive elements
 * - Form inputs with associated labels
 * - Modal/dialog ARIA attributes
 * - Icon buttons with descriptive labels
 */

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'fs';
import { join, relative } from 'path';

interface AriaViolation {
  file: string;
  line: number;
  element: string;
  issue: string;
  severity: 'error' | 'warning';
  recommendation: string;
  codeSnippet: string;
}

interface AuditResult {
  totalComponents: number;
  violations: AriaViolation[];
  warnings: AriaViolation[];
  byComponent: Record<string, {
    violations: AriaViolation[];
    warnings: AriaViolation[];
  }>;
}

const COMPONENTS_DIR = join(process.cwd(), 'apps/web/src/components');
const EXCLUDED_DIRS = ['__tests__', 'node_modules', '.next', 'dist', 'build'];
const EXCLUDED_FILES = ['.test.tsx', '.spec.tsx', '.stories.tsx'];

function getAllComponentFiles(dir: string, fileList: string[] = []): string[] {
  try {
    const files = readdirSync(dir);

    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);

      if (stat.isDirectory()) {
        if (!EXCLUDED_DIRS.includes(file)) {
          getAllComponentFiles(filePath, fileList);
        }
      } else if (file.endsWith('.tsx') && !EXCLUDED_FILES.some(excluded => file.includes(excluded))) {
        fileList.push(filePath);
      }
    }
  } catch {
    // Directory might not exist or be inaccessible
  }

  return fileList;
}

function auditFile(filePath: string): AriaViolation[] {
  const violations: AriaViolation[] = [];
  const relativePath = relative(process.cwd(), filePath);
  let content: string;

  try {
    content = readFileSync(filePath, 'utf-8');
  } catch {
    return violations;
  }

  const lines = content.split('\n');

  // Pattern 1: Icon buttons without aria-label
  // Match: <Button size="icon" or <IconButton or buttons with icon classes
  const iconButtonPattern = /<(Button|IconButton|button)[^>]*(size\s*=\s*["']icon["']|className[^>]*icon)[^>]*>/gi;
  let match;
  while ((match = iconButtonPattern.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const elementContent = match[0];

    // Check if aria-label exists
    if (!/aria-label\s*=/i.test(elementContent)) {
      // Check if it's followed by aria-label in next lines (multiline)
      const nextLines = lines.slice(lineNumber - 1, Math.min(lineNumber + 5, lines.length));
      const hasAriaLabelNearby = nextLines.some(line => /aria-label\s*=/i.test(line));

      if (!hasAriaLabelNearby) {
        violations.push({
          file: relativePath,
          line: lineNumber,
          element: 'IconButton/Button',
          issue: 'Icon button missing aria-label',
          severity: 'error',
          recommendation: 'Add aria-label prop with descriptive text (e.g., "Close dialog", "Send message")',
          codeSnippet: elementContent.substring(0, 100),
        });
      }
    }
  }

  // Pattern 2: Input elements without labels
  const inputPattern = /<(input|textarea|select)([^>]*?)>/gi;
  while ((match = inputPattern.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const elementContent = match[0];
    const attributes = match[2] || '';

    // Skip if it's a hidden input
    if (/type\s*=\s*["']hidden["']/i.test(attributes)) {
      continue;
    }

    // Check for aria-label, aria-labelledby, or id (which might be associated with label)
    const hasAriaLabel = /aria-label\s*=/i.test(attributes);
    const hasAriaLabelledBy = /aria-labelledby\s*=/i.test(attributes);
    const _hasId = /id\s*=\s*["'][^"']+["']/i.test(attributes);

    // Check if there's a label element with htmlFor pointing to this input
    const idMatch = attributes.match(/id\s*=\s*["']([^"']+)["']/i);
    const hasLabel = idMatch ? new RegExp(`htmlFor\\s*=\\s*["']${idMatch[1]}["']`, 'i').test(content) : false;

    if (!hasAriaLabel && !hasAriaLabelledBy && !hasLabel) {
      violations.push({
        file: relativePath,
        line: lineNumber,
        element: match[1],
        issue: 'Form input missing label or aria-label',
        severity: 'error',
        recommendation: 'Add htmlFor/id relationship, aria-label, or aria-labelledby',
        codeSnippet: elementContent.substring(0, 100),
      });
    }
  }

  // Pattern 3: Buttons without aria-label or visible text
  const buttonPattern = /<(Button|button)([^>]*?)>(.*?)(?:<\/Button>|<\/button>)/gis;
  while ((match = buttonPattern.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const elementContent = match[0];
    const attributes = match[2] || '';
    const children = match[3] || '';

    // Skip if it has aria-label
    if (/aria-label\s*=/i.test(attributes)) {
      continue;
    }

    // Skip if it's an icon button (handled above)
    if (/size\s*=\s*["']icon["']/i.test(attributes)) {
      continue;
    }

    // Check if button has visible text content
    const hasText = /[A-Za-z0-9]{2,}/.test(children.replace(/<[^>]+>/g, '').trim());

    // Check for icon-only buttons (common patterns)
    const isIconOnly = /<[A-Z][^>]*Icon[^>]*>|<svg/i.test(children) && !hasText;

    if (isIconOnly || (!hasText && children.trim().length < 10)) {
      violations.push({
        file: relativePath,
        line: lineNumber,
        element: 'Button',
        issue: 'Button missing aria-label or visible text',
        severity: 'warning',
        recommendation: 'Add aria-label prop or ensure button has visible text content',
        codeSnippet: elementContent.substring(0, 150),
      });
    }
  }

  // Pattern 4: Modal/Dialog elements without proper ARIA
  const modalPattern = /<(Dialog|DialogContent|Modal|dialog)([^>]*?)>/gi;
  while ((match = modalPattern.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const elementContent = match[0];
    const attributes = match[2] || '';

    const issues: string[] = [];
    if (!/role\s*=\s*["']dialog["']/i.test(attributes) && !/role\s*=\s*["']alertdialog["']/i.test(attributes)) {
      issues.push('Missing role="dialog"');
    }
    if (!/aria-modal\s*=\s*["']true["']/i.test(attributes)) {
      issues.push('Missing aria-modal="true"');
    }
    if (!/aria-labelledby\s*=/i.test(attributes)) {
      issues.push('Missing aria-labelledby');
    }

    if (issues.length > 0) {
      violations.push({
        file: relativePath,
        line: lineNumber,
        element: match[1],
        issue: `Modal/dialog missing ARIA attributes: ${issues.join(', ')}`,
        severity: 'error',
        recommendation: 'Add role="dialog", aria-modal="true", aria-labelledby, and optionally aria-describedby',
        codeSnippet: elementContent.substring(0, 150),
      });
    }
  }

  // Pattern 5: Links without accessible text
  const linkPattern = /<(a|Link)([^>]*?)>(.*?)(?:<\/a>|<\/Link>)/gis;
  while ((match = linkPattern.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const attributes = match[2] || '';
    const children = match[3] || '';

    // Skip if it has aria-label
    if (/aria-label\s*=/i.test(attributes)) {
      continue;
    }

    // Check if link has visible text or image with alt text
    const hasText = /[A-Za-z0-9]{2,}/.test(children.replace(/<[^>]+>/g, '').trim());
    const hasImageWithAlt = /<img[^>]*alt\s*=\s*["'][^"']+["']/i.test(children);

    if (!hasText && !hasImageWithAlt) {
      violations.push({
        file: relativePath,
        line: lineNumber,
        element: 'Link',
        issue: 'Link missing aria-label or accessible text',
        severity: 'warning',
        recommendation: 'Add aria-label prop or ensure link has visible text or image with alt text',
        codeSnippet: match[0].substring(0, 150),
      });
    }
  }

  // Pattern 6: Interactive elements with onClick but no ARIA
  const onClickPattern = /<([A-Z][a-zA-Z]*|\w+)([^>]*onClick[^>]*?)>/g;
  while ((match = onClickPattern.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    const elementName = match[1];
    const attributes = match[2] || '';

    // Skip known interactive elements (button, a, input)
    if (['button', 'a', 'input', 'Button', 'Link'].includes(elementName)) {
      continue;
    }

    // Skip if it has role="button" or aria-label
    if (/role\s*=\s*["']button["']/i.test(attributes) || /aria-label\s*=/i.test(attributes)) {
      continue;
    }

    // Check if it's a known component that handles accessibility
    if (['div', 'span'].includes(elementName.toLowerCase())) {
      violations.push({
        file: relativePath,
        line: lineNumber,
        element: elementName,
        issue: 'Interactive element (onClick) missing role="button" or aria-label',
        severity: 'warning',
        recommendation: 'Add role="button" and aria-label, or use a proper button element',
        codeSnippet: match[0].substring(0, 150),
      });
    }
  }

  return violations;
}

function generateReport(results: AuditResult): string {
  const { totalComponents, violations, warnings, byComponent } = results;
  const errorCount = violations.length;
  const warningCount = warnings.length;

  let report = '# Web ARIA Labels Audit Report\n\n';
  report += `**Generated**: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total Components Audited**: ${totalComponents}\n`;
  report += `- **Total Violations**: ${errorCount} errors, ${warningCount} warnings\n`;
  report += `- **Compliance Rate**: ${totalComponents > 0 ? ((totalComponents - errorCount) / totalComponents * 100).toFixed(1) : 0}%\n\n`;

  if (errorCount === 0 && warningCount === 0) {
    report += `## ✅ All Clear\n\n`;
    report += `All components have proper ARIA labels and accessibility attributes.\n\n`;
    return report;
  }

  report += `## Violations by Severity\n\n`;

  if (errorCount > 0) {
    report += `### Errors (${errorCount})\n\n`;
    report += `| File | Line | Element | Issue | Recommendation |\n`;
    report += `|------|------|---------|-------|----------------|\n`;

    for (const violation of violations) {
      const fileDisplay = violation.file.replace(/^apps\/web\/src\/components\//, '');
      report += `| \`${fileDisplay}\` | ${violation.line} | \`${violation.element}\` | ${violation.issue} | ${violation.recommendation} |\n`;
    }
    report += `\n`;
  }

  if (warningCount > 0) {
    report += `### Warnings (${warningCount})\n\n`;
    report += `| File | Line | Element | Issue | Recommendation |\n`;
    report += `|------|------|---------|-------|----------------|\n`;

    for (const warning of warnings) {
      const fileDisplay = warning.file.replace(/^apps\/web\/src\/components\//, '');
      report += `| \`${fileDisplay}\` | ${warning.line} | \`${warning.element}\` | ${warning.issue} | ${warning.recommendation} |\n`;
    }
    report += `\n`;
  }

  report += `## Violations by Component\n\n`;

  const componentEntries = Object.entries(byComponent).sort((a, b) => {
    const aTotal = a[1].violations.length + a[1].warnings.length;
    const bTotal = b[1].violations.length + b[1].warnings.length;
    return bTotal - aTotal;
  });

  for (const [component, issues] of componentEntries) {
    if (issues.violations.length === 0 && issues.warnings.length === 0) {
      continue;
    }

    report += `### ${component}\n\n`;
    report += `- **Errors**: ${issues.violations.length}\n`;
    report += `- **Warnings**: ${issues.warnings.length}\n\n`;

    if (issues.violations.length > 0) {
      report += `#### Errors:\n\n`;
      for (const violation of issues.violations) {
        report += `- **Line ${violation.line}**: ${violation.issue}\n`;
        report += `  - Recommendation: ${violation.recommendation}\n`;
        report += `  - Code: \`${violation.codeSnippet}\`\n\n`;
      }
    }

    if (issues.warnings.length > 0) {
      report += `#### Warnings:\n\n`;
      for (const warning of issues.warnings) {
        report += `- **Line ${warning.line}**: ${warning.issue}\n`;
        report += `  - Recommendation: ${warning.recommendation}\n`;
        report += `  - Code: \`${warning.codeSnippet}\`\n\n`;
      }
    }
  }

  report += `## Recommendations\n\n`;
  report += `1. **Icon Buttons**: All icon-only buttons must have \`aria-label\` prop\n`;
  report += `2. **Form Inputs**: All inputs must have associated labels via \`htmlFor\`/\`id\` or \`aria-label\`\n`;
  report += `3. **Modals/Dialogs**: Must have \`role="dialog"\`, \`aria-modal="true"\`, and \`aria-labelledby\`\n`;
  report += `4. **Interactive Elements**: Buttons, links, and custom interactive elements need \`aria-label\` or visible text\n`;
  report += `5. **Live Regions**: Dynamic content should use \`aria-live\` regions for screen reader announcements\n\n`;

  return report;
}

function main(): void {
  console.log('🔍 Starting Web ARIA Labels Audit...\n');

  const files = getAllComponentFiles(COMPONENTS_DIR);
  console.log(`Found ${files.length} component files to audit\n`);

  const results: AuditResult = {
    totalComponents: files.length,
    violations: [],
    warnings: [],
    byComponent: {},
  };

  for (const file of files) {
    const relativePath = relative(process.cwd(), file);
    const componentName = relativePath.split('/').pop()?.replace('.tsx', '') || 'Unknown';

    const violations = auditFile(file);

    const errors = violations.filter(v => v.severity === 'error');
    const warnings = violations.filter(v => v.severity === 'warning');

    results.violations.push(...errors);
    results.warnings.push(...warnings);

    if (errors.length > 0 || warnings.length > 0) {
      results.byComponent[componentName] = {
        violations: errors,
        warnings: warnings,
      };
    }
  }

  console.log(`\n✅ Audit complete!\n`);
  console.log(`- Total violations: ${results.violations.length} errors, ${results.warnings.length} warnings\n`);

  // Generate report
  const report = generateReport(results);
  const reportDir = join(process.cwd(), 'docs/accessibility');
  const reportPath = join(reportDir, 'web-aria-audit-report.md');

  // Ensure docs/accessibility directory exists
  try {
    mkdirSync(reportDir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  writeFileSync(reportPath, report, 'utf-8');
  console.log(`📄 Report saved to: ${reportPath}\n`);

  // Print summary
  if (results.violations.length > 0) {
    console.log(`❌ Found ${results.violations.length} errors that need to be fixed.\n`);
  }
  if (results.warnings.length > 0) {
    console.log(`⚠️  Found ${results.warnings.length} warnings to review.\n`);
  }
  if (results.violations.length === 0 && results.warnings.length === 0) {
    console.log(`✅ No violations found! All components are compliant.\n`);
  }
}

// Run main function
main();
