/**
 * Static analysis scanner for UI consistency issues
 * Scans component source code for common problems
 */
import { readdirSync, readFileSync, writeFileSync, statSync, mkdirSync } from 'fs';
import { join, relative } from 'path';

interface ScanResult {
  file: string;
  line: number;
  issue: string;
  severity: 'BLOCKER' | 'HIGH' | 'MED' | 'LOW';
  type: string;
  fix: string;
}

const results: ScanResult[] = [];
const WEB_SRC = join(process.cwd(), 'apps/web/src');
const MOBILE_SRC = join(process.cwd(), 'apps/mobile/src');

// Patterns to detect
const ISSUES = [
  {
    pattern: /#[0-9a-fA-F]{3,8}(?![\w-])/g,
    type: 'Hardcoded Color',
    severity: 'HIGH' as const,
    fix: 'Replace with CSS variable or design token',
    exclude: ['test', 'setup.ts', '.stories.'],
  },
  {
    pattern: /className="[^"]*(?:w-\[(?!var\()|h-\[(?!var\()|p-\[(?!var\()|m-\[(?!var\()[^)]*\d+px)/g,
    type: 'Hardcoded Spacing',
    severity: 'MED' as const,
    fix: 'Use spacing tokens (--space-*)',
    exclude: ['test'],
  },
  {
    pattern: /rounded-\[(?!var\()[^\]]*\d+px\]/g,
    type: 'Hardcoded Radius',
    severity: 'MED' as const,
    fix: 'Use radius tokens (--radius-*)',
    exclude: ['test'],
  },
  {
    pattern: /font-size:\s*\d+px/g,
    type: 'Hardcoded Font Size',
    severity: 'MED' as const,
    fix: 'Use typography scale (text-sm/md/lg/xl)',
    exclude: ['test'],
  },
  {
    pattern: /border:\s*1px\s+solid\s+#/g,
    type: 'Hardcoded Border',
    severity: 'MED' as const,
    fix: 'Use border color tokens',
    exclude: ['test'],
  },
  {
    pattern: /<button(?![^>]*aria-label)(?![^>]*title)/g,
    type: 'Missing A11y Label (button)',
    severity: 'HIGH' as const,
    fix: 'Add aria-label or title attribute',
    exclude: ['test'],
  },
  {
    pattern: /<img(?![^>]*alt)/g,
    type: 'Missing Alt Text',
    severity: 'BLOCKER' as const,
    fix: 'Add alt attribute',
    exclude: ['test', 'Icon'],
  },
  {
    pattern: /onClick.*(?!aria-)/g,
    type: 'Interactive without role',
    severity: 'MED' as const,
    fix: 'Ensure proper semantic HTML or role/aria attributes',
    exclude: ['button', 'a href', 'test'],
  },
];

function scanFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  for (const issue of ISSUES) {
    // Skip if file matches exclusion patterns
    if (issue.exclude?.some(ex => filePath.includes(ex))) {
      continue;
    }

    lines.forEach((line, index) => {
      const matches = line.matchAll(issue.pattern);
      for (const match of matches) {
        results.push({
          file: relative(process.cwd(), filePath),
          line: index + 1,
          issue: match[0],
          severity: issue.severity,
          type: issue.type,
          fix: issue.fix,
        });
      }
    });
  }
}

function scanDirectory(dir: string) {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!entry.includes('node_modules') && !entry.includes('.git')) {
          scanDirectory(fullPath);
        }
      } else if (entry.match(/\.(tsx?|jsx?)$/) && !entry.includes('.test.') && !entry.includes('.spec.')) {
        scanFile(fullPath);
      }
    }
  } catch (error) {
    console.warn(`Skipping ${dir}:`, error);
  }
}

// Run scan
console.log('🔍 Scanning Web components...');
scanDirectory(join(WEB_SRC, 'components'));
scanDirectory(join(WEB_SRC, 'views'));

console.log('🔍 Scanning Mobile components...');
try {
  scanDirectory(join(MOBILE_SRC, 'components'));
  scanDirectory(join(MOBILE_SRC, 'screens'));
} catch {
  console.log('Mobile directory not found, skipping...');
}

// Generate report
const reportDir = join(process.cwd(), 'reports/ui-audit/20250112-0545');
mkdirSync(reportDir, { recursive: true });

// Group by severity
const grouped = results.reduce((acc, r) => {
  acc[r.severity] = (acc[r.severity] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

// Write findings
const jsonPath = join(reportDir, 'static-scan-findings.json');
const csvPath = join(reportDir, 'static-scan-findings.csv');

writeFileSync(jsonPath, JSON.stringify(results, null, 2));

const csvHeaders = ['file', 'line', 'severity', 'type', 'issue', 'fix'].join(',');
const csvRows = results.map(r => 
  [r.file, r.line, r.severity, r.type, `"${r.issue.replace(/"/g, '""')}"`, `"${r.fix}"`].join(',')
);
writeFileSync(csvPath, [csvHeaders, ...csvRows].join('\n'));

console.log('\n📊 Static Scan Results:');
console.log(`   BLOCKER: ${grouped.BLOCKER || 0}`);
console.log(`   HIGH: ${grouped.HIGH || 0}`);
console.log(`   MED: ${grouped.MED || 0}`);
console.log(`   LOW: ${grouped.LOW || 0}`);
console.log(`   Total: ${results.length} issues found`);
console.log(`\n📄 Reports saved:`);
console.log(`   ${jsonPath}`);
console.log(`   ${csvPath}`);
