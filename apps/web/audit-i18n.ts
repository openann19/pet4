import { translations } from './src/lib/i18n';
import { scriptLogger } from './src/lib/script-logger';

interface StringEntry {
  key: string;
  enLength: number;
  bgLength: number;
  enText: string;
  bgText: string;
  bucket: '0-30' | '31-60' | '61-120' | '120+';
}

function flattenObject(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } else if (typeof value === 'string') {
      result[newKey] = value;
    }
  }

  return result;
}

function getBucket(length: number): '0-30' | '31-60' | '61-120' | '120+' {
  if (length <= 30) return '0-30';
  if (length <= 60) return '31-60';
  if (length <= 120) return '61-120';
  return '120+';
}

function auditI18nStrings() {
  const enFlat = flattenObject(translations.en);
  const bgFlat = flattenObject(translations.bg);

  const entries: StringEntry[] = [];

  for (const key in enFlat) {
    const enText = enFlat[key] ?? '';
    const bgText = bgFlat[key] ?? '';
    const enLength = enText.length;
    const bgLength = bgText.length;
    const maxLength = Math.max(enLength, bgLength);

    entries.push({
      key,
      enLength,
      bgLength,
      enText,
      bgText,
      bucket: getBucket(maxLength),
    });
  }

  entries.sort((a, b) => {
    const maxA = Math.max(a.enLength, a.bgLength);
    const maxB = Math.max(b.enLength, b.bgLength);
    return maxB - maxA;
  });

  scriptLogger.writeLine('\n=== i18n String Length Audit ===\n');
  scriptLogger.writeLine('Key,EN Length,BG Length,Max Length,Bucket,EN Text,BG Text');

  for (const entry of entries) {
    const maxLength = Math.max(entry.enLength, entry.bgLength);
    scriptLogger.writeLine(
      `"${entry.key}",${entry.enLength},${entry.bgLength},${maxLength},"${entry.bucket}","${entry.enText.replace(/"/g, '""')}","${entry.bgText.replace(/"/g, '""')}"`
    );
  }

  const bucketCounts = entries.reduce(
    (acc, entry) => {
      acc[entry.bucket] = (acc[entry.bucket] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  scriptLogger.writeLine('\n=== Summary ===');
  scriptLogger.writeLine(`Total strings: ${entries.length}`);
  scriptLogger.writeLine(`0-30 chars: ${bucketCounts['0-30'] ?? 0}`);
  scriptLogger.writeLine(`31-60 chars: ${bucketCounts['31-60'] ?? 0}`);
  scriptLogger.writeLine(`61-120 chars: ${bucketCounts['61-120'] ?? 0}`);
  scriptLogger.writeLine(`120+ chars: ${bucketCounts['120+'] ?? 0}`);

  const longStrings = entries.filter((e) => Math.max(e.enLength, e.bgLength) > 60);
  if (longStrings.length > 0) {
    scriptLogger.warn(
      `\n⚠️  ${longStrings.length} strings exceed 60 characters and may cause UI overflow`
    );
  }

  const missingBg = entries.filter((e) => !e.bgText);
  if (missingBg.length > 0) {
    scriptLogger.warn(`\n⚠️  ${missingBg.length} strings missing BG translation:`);
    missingBg.forEach((e) => scriptLogger.writeLine(`  - ${e.key}`));
  }
}

auditI18nStrings();
