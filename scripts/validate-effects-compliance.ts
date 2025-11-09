#!/usr/bin/env tsx
/**
 * Validate Effects Compliance Script
 *
 * Validates that all components use ABSOLUTE_MAX_UI_MODE configuration
 * and comply with ultra-premium UI standards.
 *
 * Usage: pnpm tsx scripts/validate-effects-compliance.ts
 *
 * Location: scripts/validate-effects-compliance.ts
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

interface ValidationResult {
  file: string;
  errors: string[];
  warnings: string[];
}

interface ValidationSummary {
  total: number;
  passed: number;
  failed: number;
  errors: number;
  warnings: number;
  results: ValidationResult[];
}

/**
 * Components that must use ABSOLUTE_MAX_UI_MODE
 */
const REQUIRED_COMPONENT_PATHS = [
  'apps/web/src/components/enhanced',
  'apps/mobile/src/components/enhanced',
  'apps/web/src/components/chat',
  'apps/mobile/src/components/chat',
  'apps/web/src/effects',
  'apps/mobile/src/effects',
];

/**
 * Patterns that indicate non-compliance
 * Reserved for future use in validation logic
 */
const _NON_COMPLIANCE_PATTERNS = [
  // Hardcoded animation values instead of using config
  /duration:\s*\d+/i,
  /stiffness:\s*\d+/i,
  /damping:\s*\d+/i,
  // Missing useUIConfig usage
  /useUIConfig|ABSOLUTE_MAX_UI_MODE/,
  // Console.log statements (should use logger)
  /console\.(log|warn|error|info)/,
  // Missing reduced motion support
  /useReducedMotion|isReduceMotionEnabled/,
];
void _NON_COMPLIANCE_PATTERNS;

/**
 * Patterns that indicate compliance
 * Reserved for future use in validation logic
 */
const _COMPLIANCE_PATTERNS = [
  /useUIConfig\(\)/,
  /ABSOLUTE_MAX_UI_MODE/,
  /useReducedMotion\(\)/,
  /isReduceMotionEnabled\(\)/,
  /createLogger\(/,
];
void _COMPLIANCE_PATTERNS;

/**
 * Check if file is a TypeScript/TSX file
 */
function isTypeScriptFile(file: string): boolean {
  return /\.(ts|tsx)$/.test(file);
}

/**
 * Check if file should be validated
 */
function shouldValidateFile(filePath: string): boolean {
  // Skip test files, stories, and config files
  if (
    filePath.includes('.test.') ||
    filePath.includes('.stories.') ||
    filePath.includes('.config.') ||
    filePath.includes('__tests__') ||
    filePath.includes('__snapshots__')
  ) {
    return false;
  }

  return isTypeScriptFile(filePath);
}

/**
 * Validate a single file
 */
function validateFile(filePath: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let relativePath = filePath;

  try {
    const content = readFileSync(filePath, 'utf-8');
    try {
      relativePath = relative(process.cwd(), filePath);
    } catch {
      // If relative fails, use absolute path
      relativePath = filePath;
    }

    // Check for console statements
    if (/console\.(log|warn|error|info)/.test(content)) {
      errors.push('Contains console.* statements (should use logger)');
    }

    // Check if component file uses useUIConfig
    const isComponentFile = /\.(tsx|jsx)$/.test(filePath);
    const isEffectFile = filePath.includes('/effects/');
    const isEnhancedComponent = filePath.includes('/enhanced/') || filePath.includes('/chat/');

    if (isComponentFile && (isEffectFile || isEnhancedComponent)) {
      const hasUIConfig = /useUIConfig\(\)/.test(content);
      const hasAbsoluteMaxUI = /ABSOLUTE_MAX_UI_MODE/.test(content);

      if (!hasUIConfig && !hasAbsoluteMaxUI) {
        warnings.push('Should use useUIConfig() or ABSOLUTE_MAX_UI_MODE for UI configuration');
      }
    }

    // Check for hardcoded animation values
    if (isEffectFile || isEnhancedComponent) {
      const hasHardcodedDuration = /duration:\s*\d+/.test(content);
      const hasHardcodedStiffness = /stiffness:\s*\d+/.test(content);
      const hasHardcodedDamping = /damping:\s*\d+/.test(content);

      if (hasHardcodedDuration || hasHardcodedStiffness || hasHardcodedDamping) {
        warnings.push('Contains hardcoded animation values (consider using config)');
      }
    }

    // Check for reduced motion support in animation files
    if (isEffectFile) {
      const hasReducedMotion = /useReducedMotion|isReduceMotionEnabled/.test(content);
      if (!hasReducedMotion) {
        warnings.push('Should support reduced motion preferences');
      }
    }

    // Check for proper logging
    if (!/createLogger\(/.test(content) && /console\./.test(content)) {
      errors.push('Uses console.* instead of structured logger');
    }
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    errors.push(`Failed to read file: ${error.message}`);
  }

  return {
    file: relativePath,
    errors,
    warnings,
  };
}

/**
 * Recursively get all files in directory
 */
function getFilesInDirectory(dir: string, fileList: string[] = []): string[] {
  try {
    const files = readdirSync(dir);

    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);

      if (stat.isDirectory()) {
        getFilesInDirectory(filePath, fileList);
      } else if (shouldValidateFile(filePath)) {
        fileList.push(filePath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or can't be read - skip
  }

  return fileList;
}

/**
 * Main validation function
 */
function validateCompliance(): ValidationSummary {
  const results: ValidationResult[] = [];
  let total = 0;
  let passed = 0;
  let failed = 0;
  let totalErrors = 0;
  let totalWarnings = 0;

  // Validate all required component paths
  for (const path of REQUIRED_COMPONENT_PATHS) {
    const fullPath = join(process.cwd(), path);
    const files = getFilesInDirectory(fullPath);

    for (const file of files) {
      total++;
      const result = validateFile(file);
      results.push(result);

      if (result.errors.length > 0 || result.warnings.length > 0) {
        failed++;
        totalErrors += result.errors.length;
        totalWarnings += result.warnings.length;
      } else {
        passed++;
      }
    }
  }

  return {
    total,
    passed,
    failed,
    errors: totalErrors,
    warnings: totalWarnings,
    results,
  };
}

/**
 * Print validation results
 */
function printResults(summary: ValidationSummary): void {
  console.log('\n🔍 Effects Compliance Validation\n');
  console.log(`Total files: ${summary.total}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`🚨 Errors: ${summary.errors}`);
  console.log(`⚠️  Warnings: ${summary.warnings}\n`);

  if (summary.failed > 0) {
    console.log('❌ Failed Files:\n');
    for (const result of summary.results) {
      if (result.errors.length > 0 || result.warnings.length > 0) {
        console.log(`  ${result.file}`);
        for (const error of result.errors) {
          console.log(`    🚨 Error: ${error}`);
        }
        for (const warning of result.warnings) {
          console.log(`    ⚠️  Warning: ${warning}`);
        }
        console.log('');
      }
    }
  }

  if (summary.errors > 0) {
    console.log('\n❌ Validation failed with errors\n');
    process.exit(1);
  } else if (summary.warnings > 0) {
    console.log('\n⚠️  Validation passed with warnings\n');
    process.exit(0);
  } else {
    console.log('\n✅ All files comply with ABSOLUTE_MAX_UI_MODE standards\n');
    process.exit(0);
  }
}

// Run validation if this is the main module
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  const summary = validateCompliance();
  printResults(summary);
}

export { validateCompliance, validateFile, ValidationResult, ValidationSummary };
