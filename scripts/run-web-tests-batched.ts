#!/usr/bin/env tsx
/**
 * Runs web tests in batches of 50 and exports failures to a txt file
 */

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const webAppRoot = join(projectRoot, 'apps', 'web');

interface TestFailure {
  testFile: string;
  error: string;
  batch: number;
}

function getAllTestFiles(): string[] {
  try {
    const result = execSync(
      `find ${webAppRoot}/src -type f \\( -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" \\)`,
      { encoding: 'utf-8', cwd: projectRoot }
    );
    const files = result
      .trim()
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => line.trim())
      .filter((file) => file.length > 0);
    return files;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to find test files: ${errorMessage}`);
  }
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

function runTestBatch(testFiles: string[], batchNumber: number): TestFailure[] {
  const failures: TestFailure[] = [];

  // Convert absolute paths to relative paths from webAppRoot
  const relativeTestFiles = testFiles.map((f) => f.replace(webAppRoot + '/', ''));

  process.stdout.write(
    `\n[Batch ${batchNumber}] Running ${testFiles.length} test files...\n`
  );

  const tempJsonFile = join(projectRoot, `temp-batch-${batchNumber}-results.json`);

  try {
    // Run vitest with JSON reporter - pass files as separate arguments
    // Vitest accepts multiple file patterns/globs
    const filesPattern = relativeTestFiles.join(' ');
    const command = `cd ${webAppRoot} && pnpm vitest run --reporter=json --reporter=verbose --outputFile="${tempJsonFile}" ${filesPattern} 2>&1 || true`;
    const output = execSync(command, {
      encoding: 'utf-8',
      cwd: projectRoot,
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large test outputs
    });

    // Try to parse JSON results if available
    try {
      if (existsSync(tempJsonFile)) {
        const jsonContent = readFileSync(tempJsonFile, 'utf-8');
        const results = JSON.parse(jsonContent);

        if (results.testFiles) {
          results.testFiles.forEach((testFile: { file: string; result?: { state?: string; errors?: unknown[] } }) => {
            if (testFile.result?.state === 'fail' || (testFile.result?.errors && testFile.result.errors.length > 0)) {
              const errorMessages = testFile.result?.errors
                ? JSON.stringify(testFile.result.errors, null, 2)
                : 'Test failed';

              failures.push({
                testFile: testFile.file,
                error: errorMessages,
                batch: batchNumber,
              });
            }
          });
        }

        // Clean up temp file
        try {
          unlinkSync(tempJsonFile);
        } catch {
          // Ignore cleanup errors
        }
      }
    } catch {
      // If JSON parsing fails, fall back to parsing text output
    }

    // If we didn't get failures from JSON, parse text output
    // Also parse text output to supplement JSON results with better error messages
    const hasFailuresInOutput = output.includes('FAIL') ||
                                 (output.includes('Test Files') && output.match(/\d+\s+failed/i)) ||
                                 (output.includes('Tests') && output.match(/\d+\s+failed/i)) ||
                                 output.includes('✖') ||
                                 output.includes('AssertionError') ||
                                 output.includes('Error:');

    // Parse text output if we have failures indicated but no JSON results, or to get better error details
    if (hasFailuresInOutput && failures.length === 0) {
      const failedFiles = new Set<string>();

      // Pattern 1: Look for FAIL markers with file paths
      const failPattern = /FAIL\s+.*?([^\s]+\.(test|spec)\.(ts|tsx))/gi;
      let failMatch: RegExpExecArray | null;
      while ((failMatch = failPattern.exec(output)) !== null) {
        if (failMatch[1]) {
          const filePath = failMatch[1].trim();
          // Resolve to absolute path if relative
          const absolutePath = filePath.startsWith('/')
            ? filePath
            : join(webAppRoot, filePath);
          failedFiles.add(absolutePath);
        }
      }

      // Pattern 2: Look for test file names near error indicators
      testFiles.forEach((file) => {
        const relativePath = file.replace(webAppRoot + '/', '');
        const fileName = file.split('/').pop() || '';

        // Check if this file appears in error context
        const fileIndex = output.indexOf(relativePath);
        if (fileIndex !== -1) {
          // Look for error indicators near this file
          const contextStart = Math.max(0, fileIndex - 500);
          const contextEnd = Math.min(output.length, fileIndex + 2000);
          const context = output.slice(contextStart, contextEnd);

          if (context.match(/FAIL|Error:|✖|AssertionError|TypeError|ReferenceError/i)) {
            failedFiles.add(file);
          }
        }

        // Also check for file name alone in error context
        if (output.includes(fileName)) {
          const fileNameIndex = output.indexOf(fileName);
          const contextStart = Math.max(0, fileNameIndex - 200);
          const contextEnd = Math.min(output.length, fileNameIndex + 1000);
          const context = output.slice(contextStart, contextEnd);

          if ((context.match(/FAIL|Error:|✖|failed/i)) && (context.includes('.test.') || context.includes('.spec.'))) {
            failedFiles.add(file);
          }
        }
      });

      // If we found failed files, extract their error details
      if (failedFiles.size > 0) {
        // Clear any existing failures since we're parsing from text
        failures.length = 0;

        // Extract error details for each failed file
        failedFiles.forEach((file) => {
          const relativePath = file.replace(webAppRoot + '/', '');
          const lines = output.split('\n');
          let errorLines: string[] = [];
          let inErrorBlock = false;

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.includes(relativePath) && (line.includes('FAIL') || line.includes('Error:'))) {
              inErrorBlock = true;
              errorLines = [line];
              continue;
            }

            if (inErrorBlock) {
              errorLines.push(line);
              // Stop collecting if we hit another test file or empty line followed by non-error content
              if (
                (line.trim() === '' && i < lines.length - 1 && !lines[i + 1].includes('Error') && !lines[i + 1].includes('at ')) ||
                (line.match(/^\s*PASS|^\s*RUN|^\s*✓/) && !line.includes(relativePath))
              ) {
                // Check if we have enough error context (at least 5 lines or until next test)
                if (errorLines.length > 5) {
                  inErrorBlock = false;
                  break;
                }
              }

              // Limit error collection to 50 lines per failure
              if (errorLines.length > 50) {
                inErrorBlock = false;
                break;
              }
            }
          }

          const errorText = errorLines.length > 0
            ? errorLines.slice(0, 100).join('\n')
            : output.slice(output.indexOf(relativePath), output.indexOf(relativePath) + 1000);

          failures.push({
            testFile: file,
            error: errorText,
            batch: batchNumber,
          });
        });
      } else if (hasFailuresInOutput) {
        // If we detected failures but couldn't identify specific files,
        // include a summary of the output
        failures.push({
          testFile: `Batch ${batchNumber} - Unknown test files`,
          error: output.slice(-5000), // Last 5000 chars of output
          batch: batchNumber,
        });
      }
    }

    process.stdout.write(
      `[Batch ${batchNumber}] Completed: ${testFiles.length} files, ${failures.length} failures\n`
    );
  } catch (error) {
    const errorOutput =
      error instanceof Error && 'stdout' in error
        ? (error as { stdout: string; stderr?: string }).stdout +
          ((error as { stderr?: string }).stderr || '')
        : error instanceof Error
          ? error.message
          : String(error);

    // If we got an error, try to extract which files failed
    const errorStr = errorOutput.toString();
    testFiles.forEach((file) => {
      const relativePath = file.replace(webAppRoot + '/', '');
      if (errorStr.includes(relativePath) || errorStr.includes('Error:')) {
        failures.push({
          testFile: file,
          error: errorStr.slice(0, 5000),
          batch: batchNumber,
        });
      }
    });

    // If no specific files identified, mark all as failed
    if (failures.length === 0) {
      process.stdout.write(
        `[Batch ${batchNumber}] Execution error - marking all tests as failed\n`
      );
      testFiles.forEach((file) => {
        failures.push({
          testFile: file,
          error: errorStr.slice(0, 5000),
          batch: batchNumber,
        });
      });
    }

    process.stdout.write(
      `[Batch ${batchNumber}] Error occurred: ${failures.length} files marked as failed\n`
    );
  } finally {
    // Clean up temp file
    try {
      if (existsSync(tempJsonFile)) {
        unlinkSync(tempJsonFile);
      }
    } catch {
      // Ignore cleanup errors
    }
  }

  return failures;
}

function formatFailuresReport(failures: TestFailure[]): string {
  let report = `WEB TEST FAILURES REPORT\n`;
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Total Failures: ${failures.length}\n`;
  report += `=${'='.repeat(80)}\n\n`;

  if (failures.length === 0) {
    report += '✅ No test failures found!\n';
    return report;
  }

  // Group by batch
  const failuresByBatch = new Map<number, TestFailure[]>();
  failures.forEach((failure) => {
    const batchFailures = failuresByBatch.get(failure.batch) || [];
    batchFailures.push(failure);
    failuresByBatch.set(failure.batch, batchFailures);
  });

  failuresByBatch.forEach((batchFailures, batchNumber) => {
    report += `\nBATCH ${batchNumber} (${batchFailures.length} failures)\n`;
    report += `-${'-'.repeat(80)}\n\n`;

    batchFailures.forEach((failure, index) => {
      report += `${index + 1}. ${failure.testFile}\n`;
      report += `   Batch: ${failure.batch}\n`;
      report += `   Error:\n`;
      const errorLines = failure.error.split('\n');
      errorLines.forEach((line) => {
        report += `   ${line}\n`;
      });
      report += `\n`;
    });
  });

  // Summary
  report += `\n${'='.repeat(80)}\n`;
  report += `SUMMARY\n`;
  report += `${'='.repeat(80)}\n`;
  report += `Total Batches: ${failuresByBatch.size}\n`;
  report += `Total Failures: ${failures.length}\n`;
  report += `\nFailed Test Files:\n`;
  const uniqueFiles = new Set(failures.map((f) => f.testFile));
  uniqueFiles.forEach((file) => {
    report += `  - ${file}\n`;
  });

  return report;
}

function main() {
  const batchSize = 50;
  const outputFile = join(projectRoot, 'web-test-failures.txt');

  process.stdout.write('🔍 Discovering test files...\n');
  const allTestFiles = getAllTestFiles();
  process.stdout.write(`Found ${allTestFiles.length} test files\n`);

  if (allTestFiles.length === 0) {
    process.stdout.write('⚠️  No test files found!\n');
    writeFileSync(
      outputFile,
      'No test files found in apps/web/src\n',
      'utf-8'
    );
    process.exit(0);
  }

  const batches = chunkArray(allTestFiles, batchSize);
  process.stdout.write(
    `📦 Split into ${batches.length} batches of ${batchSize} tests each\n`
  );

  const allFailures: TestFailure[] = [];

  batches.forEach((batch, index) => {
    const batchNumber = index + 1;
    const failures = runTestBatch(batch, batchNumber);
    allFailures.push(...failures);

    // Small delay between batches to avoid overwhelming the system
    if (index < batches.length - 1) {
      process.stdout.write('   Waiting 2 seconds before next batch...\n');
      execSync('sleep 2', { cwd: projectRoot });
    }
  });

  process.stdout.write('\n📝 Generating failure report...\n');
  const report = formatFailuresReport(allFailures);

  // Ensure directory exists
  mkdirSync(join(projectRoot), { recursive: true });

  writeFileSync(outputFile, report, 'utf-8');
  process.stdout.write(`\n✅ Report written to: ${outputFile}\n`);
  process.stdout.write(`   Total failures: ${allFailures.length}\n`);

  if (allFailures.length > 0) {
    process.stdout.write(`\n❌ Some tests failed. Check ${outputFile} for details.\n`);
    process.exit(1);
  } else {
    process.stdout.write(`\n✅ All tests passed!\n`);
    process.exit(0);
  }
}

main();
