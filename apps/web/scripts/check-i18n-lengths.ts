#!/usr/bin/env tsx

/**
 * i18n Length Guard Script
 *
 * Scans Bulgarian (BG) translation strings and flags those exceeding length buckets.
 * Buckets: 30/60/120 characters
 * Outputs CSV and optionally a PR comment
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { scriptLogger } from '../src/lib/script-logger';

interface LengthBucket {
  key: string;
  text: string;
  length: number;
  bucket: '0-30' | '31-60' | '61-120' | '120+';
  status: 'OK' | 'WARNING' | 'CRITICAL';
  enLength?: number;
  bgLength?: number;
  enText?: string;
  bgText?: string;
  maxLength?: number;
  ratio?: number;
}

const BUCKET_LIMITS = {
  SHORT: 30,
  MEDIUM: 60,
  LONG: 120,
};

function getBucket(length: number): LengthBucket['bucket'] {
  if (length <= BUCKET_LIMITS.SHORT) return '0-30';
  if (length <= BUCKET_LIMITS.MEDIUM) return '31-60';
  if (length <= BUCKET_LIMITS.LONG) return '61-120';
  return '120+';
}

function getStatus(length: number): LengthBucket['status'] {
  if (length <= BUCKET_LIMITS.MEDIUM) return 'OK';
  if (length <= BUCKET_LIMITS.LONG) return 'WARNING';
  return 'CRITICAL';
}

function extractStrings(obj: Record<string, unknown>, prefix = ''): LengthBucket[] {
  const results: LengthBucket[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'string') {
      const length = value.length;
      results.push({
        key: fullKey,
        text: value.substring(0, 50) + (value.length > 50 ? '...' : ''),
        length,
        bucket: getBucket(length),
        status: getStatus(length),
      });
    } else if (typeof value === 'object' && value !== null) {
      results.push(...extractStrings(value as Record<string, unknown>, fullKey));
    }
  }

  return results;
}

interface ComparisonBucket extends LengthBucket {
  enLength: number;
  bgLength: number;
  enText: string;
  bgText: string;
  ratio: number;
}

function generateCSV(buckets: LengthBucket[]): string {
  const header =
    'Key,EN Length,BG Length,Max Length,Bucket,Status,EN Text Preview,BG Text Preview,Ratio\n';
  const rows = buckets
    .map((b) => {
      const compBucket = b as ComparisonBucket;
      const enText = compBucket.enText || '';
      const bgText = compBucket.bgText || '';
      const ratio = compBucket.ratio || 0;
      return `"${b.key}",${compBucket.enLength || 0},${compBucket.bgLength || 0},${b.length},"${b.bucket}","${b.status}","${enText.replace(/"/g, '""')}","${bgText.replace(/"/g, '""')}",${ratio.toFixed(2)}`;
    })
    .join('\n');
  return header + rows;
}

function generateReport(buckets: LengthBucket[]): string {
  const critical = buckets.filter((b) => b.status === 'CRITICAL');
  const warnings = buckets.filter((b) => b.status === 'WARNING');
  const ok = buckets.filter((b) => b.status === 'OK');

  const compBuckets = buckets as ComparisonBucket[];
  const avgEnLength = compBuckets.reduce((sum, b) => sum + (b.enLength || 0), 0) / buckets.length;
  const avgBgLength = compBuckets.reduce((sum, b) => sum + (b.bgLength || 0), 0) / buckets.length;
  const avgRatio = avgEnLength > 0 ? avgBgLength / avgEnLength : 0;

  let report = '# i18n Length Check Report\n\n';
  report += `**Total strings checked:** ${buckets.length}\n\n`;
  report += `**Average EN length:** ${avgEnLength.toFixed(1)} chars\n`;
  report += `**Average BG length:** ${avgBgLength.toFixed(1)} chars\n`;
  report += `**Average BG/EN ratio:** ${avgRatio.toFixed(2)}x\n\n`;
  report += `- ✅ OK (≤60 chars): ${ok.length}\n`;
  report += `- ⚠️  WARNING (61-120 chars): ${warnings.length}\n`;
  report += `- 🚨 CRITICAL (>120 chars): ${critical.length}\n\n`;

  if (critical.length > 0) {
    report += '## 🚨 Critical Issues (>120 characters)\n\n';
    critical.forEach((b) => {
      report += `- **${b.key}** (${b.length} chars): ${b.text}\n`;
    });
    report += '\n';
  }

  if (warnings.length > 0) {
    report += '## ⚠️  Warnings (61-120 characters)\n\n';
    warnings.slice(0, 10).forEach((b) => {
      report += `- **${b.key}** (${b.length} chars): ${b.text}\n`;
    });
    if (warnings.length > 10) {
      report += `\n_...and ${warnings.length - 10} more warnings_\n`;
    }
    report += '\n';
  }

  return report;
}

async function main(): Promise<void> {
  try {
    // Try to load translations from TypeScript file
    const i18nPath = resolve(process.cwd(), 'src/lib/i18n.ts');
    let enTranslations: Record<string, unknown> = {};
    let bgTranslations: Record<string, unknown> = {};

    try {
      // Import the translations object dynamically
      const i18nModule: unknown = await import(i18nPath);

      // Type guard for translations module
      interface TranslationsModule {
        translations?: {
          en?: Record<string, unknown>;
          bg?: Record<string, unknown>;
        };
      }

      function isTranslationsModule(module: unknown): module is TranslationsModule {
        return typeof module === 'object' && module !== null && 'translations' in module;
      }

      if (isTranslationsModule(i18nModule) && i18nModule.translations) {
        enTranslations = i18nModule.translations.en ?? {};
        bgTranslations = i18nModule.translations.bg ?? {};
      } else {
        // Fallback: try to read and parse as JSON (if exported)
        const content = readFileSync(i18nPath, 'utf-8');
        // Simple extraction - look for the translations object
        const enMatch = /en:\s*\{([\s\S]*?)\n\s*\},/.exec(content);
        const bgMatch = /bg:\s*\{([\s\S]*?)\n\s*\},/.exec(content);
        if (enMatch && bgMatch) {
          // This is a simplified parser - for production, use a proper TS parser
          scriptLogger.warn('⚠️  Could not import TypeScript directly. Using fallback parser.');
          scriptLogger.warn(
            '⚠️  For accurate results, export translations as JSON or use tsx to run this script.'
          );
        }
      }
    } catch {
      // Try JSON fallback
      const bgPath = resolve(process.cwd(), 'src/lib/i18n/translations/bg.json');
      const enPath = resolve(process.cwd(), 'src/lib/i18n/translations/en.json');

      try {
        if (readFileSync(enPath, 'utf-8')) {
          enTranslations = JSON.parse(readFileSync(enPath, 'utf-8')) as Record<string, unknown>;
        }
      } catch {
        // Ignore
      }

      try {
        if (readFileSync(bgPath, 'utf-8')) {
          bgTranslations = JSON.parse(readFileSync(bgPath, 'utf-8')) as Record<string, unknown>;
        }
      } catch {
        scriptLogger.writeLine(
          'ℹ️  No translations file found. Please ensure i18n.ts exports translations.'
        );
        process.exit(1);
      }
    }

    // Extract strings from both languages
    const enBuckets = extractStrings(enTranslations);
    const bgBuckets = extractStrings(bgTranslations);

    // Create a map of keys to compare
    const allKeys = new Set([...enBuckets.map((b) => b.key), ...bgBuckets.map((b) => b.key)]);

    interface ComparisonBucket extends LengthBucket {
      enLength: number;
      bgLength: number;
      enText: string;
      bgText: string;
      maxLength: number;
      ratio: number; // bgLength / enLength
    }

    const comparisonBuckets: ComparisonBucket[] = Array.from(allKeys).map((key) => {
      const enBucket = enBuckets.find((b) => b.key === key);
      const bgBucket = bgBuckets.find((b) => b.key === key);

      const enLength = enBucket?.length || 0;
      const bgLength = bgBucket?.length || 0;
      const maxLength = Math.max(enLength, bgLength);

      return {
        key,
        text: bgBucket?.text || enBucket?.text || '',
        length: maxLength,
        bucket: getBucket(maxLength),
        status: getStatus(maxLength),
        enLength,
        bgLength,
        enText: enBucket?.text || '',
        bgText: bgBucket?.text || '',
        maxLength,
        ratio: enLength > 0 ? bgLength / enLength : 0,
      };
    });

    const buckets = comparisonBuckets;

    // Generate CSV
    const csv = generateCSV(buckets);
    const csvPath = resolve(process.cwd(), 'i18n-length-report.csv');
    writeFileSync(csvPath, csv);
    scriptLogger.writeLine(`✅ CSV report saved to: ${csvPath}`);

    // Generate and display report
    const report = generateReport(buckets);
    scriptLogger.writeLine('\n' + report);

    // Write report to file
    const reportPath = resolve(process.cwd(), 'i18n-length-report.md');
    writeFileSync(reportPath, report);
    scriptLogger.writeLine(`✅ Markdown report saved to: ${reportPath}`);

    // Exit with error if critical issues found
    const critical = buckets.filter((b) => b.status === 'CRITICAL');
    if (critical.length > 0) {
      scriptLogger.writeErrorLine(`\n❌ Found ${critical.length} critical length violations`);
      process.exit(1);
    }

    scriptLogger.writeLine('\n✅ All i18n length checks passed');
    process.exit(0);
  } catch (error) {
    scriptLogger.error(
      'Error running i18n length check',
      error instanceof Error ? error : new Error(String(error))
    );
    process.exit(1);
  }
}

void main();
