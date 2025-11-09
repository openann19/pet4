#!/usr/bin/env node
/**
 * Process audit results from grep output and generate JSON reports
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

// Ensure logs directory exists
const logsDir = join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Process TODO audit
function processTodoAudit() {
  console.log('🔍 Processing TODO/FIXME/HACK audit...\n');

  try {
    const result = execSync(
      `grep -rn "TODO\\|FIXME\\|HACK\\|XXX\\|STUB\\|PLACEHOLDER" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" apps/ packages/ 2>/dev/null | grep -v "node_modules\\|dist\\|build\\|html\\|\\.test\\.\\|\\.spec\\." || true`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );

    const lines = result.split('\n').filter(line => line.trim());
    const todos = [];

    for (const line of lines) {
      const match = line.match(/^([^:]+):(\d+):(.*)$/);
      if (match) {
        const [, file, lineNum, content] = match;
        const trimmedContent = content.trim();

        // Skip if it's just a placeholder in a string
        if (trimmedContent.includes('"') && (trimmedContent.includes('XXX') || trimmedContent.includes('PLACEHOLDER'))) {
          continue;
        }

        // Determine type
        let type = 'TODO';
        if (trimmedContent.toUpperCase().includes('FIXME')) type = 'FIXME';
        else if (trimmedContent.toUpperCase().includes('HACK')) type = 'HACK';
        else if (trimmedContent.toUpperCase().includes('XXX')) type = 'XXX';
        else if (trimmedContent.toUpperCase().includes('STUB')) type = 'STUB';
        else if (trimmedContent.toUpperCase().includes('PLACEHOLDER')) type = 'PLACEHOLDER';

        // Categorize
        const lowerContent = trimmedContent.toLowerCase();
        let category = 'review';
        let priority = 'medium';

        if (lowerContent.includes('security') || lowerContent.includes('crash') || lowerContent.includes('bug') || lowerContent.includes('broken')) {
          category = 'fix-immediately';
          priority = 'critical';
        } else if (lowerContent.includes('incomplete') || lowerContent.includes('missing') || lowerContent.includes('implement') || lowerContent.includes('implementation pending')) {
          category = 'fix-immediately';
          priority = 'high';
        } else if (lowerContent.includes('improve') || lowerContent.includes('optimize') || lowerContent.includes('refactor')) {
          category = 'convert-to-issue';
          priority = 'medium';
        } else if (lowerContent.includes('outdated') || lowerContent.includes('remove') || lowerContent.includes('deprecated')) {
          category = 'remove';
          priority = 'low';
        }

        todos.push({
          file,
          line: parseInt(lineNum, 10),
          content: trimmedContent,
          type,
          category,
          priority,
          description: trimmedContent.replace(/^(TODO|FIXME|HACK|XXX|STUB|PLACEHOLDER):?\s*/i, '').trim(),
        });
      }
    }

    const summary = {
      total: todos.length,
      byType: {},
      byCategory: {},
      byPriority: {},
    };

    for (const todo of todos) {
      summary.byType[todo.type] = (summary.byType[todo.type] || 0) + 1;
      summary.byCategory[todo.category] = (summary.byCategory[todo.category] || 0) + 1;
      summary.byPriority[todo.priority] = (summary.byPriority[todo.priority] || 0) + 1;
    }

    const results = {
      summary,
      items: todos,
      timestamp: new Date().toISOString(),
    };

    const outputPath = join(logsDir, 'todo-audit-results.json');
    writeFileSync(outputPath, JSON.stringify(results, null, 2));

    console.log('✅ TODO Audit Complete\n');
    console.log(`  Total: ${summary.total}`);
    console.log(`  By Type: ${JSON.stringify(summary.byType, null, 2)}`);
    console.log(`  By Category: ${JSON.stringify(summary.byCategory, null, 2)}`);
    console.log(`  By Priority: ${JSON.stringify(summary.byPriority, null, 2)}`);
    console.log(`\nResults written to: ${outputPath}\n`);

    return todos;
  } catch (error) {
    console.error('Error processing TODO audit:', error.message);
    return [];
  }
}

// Process error handling audit
function processErrorHandlingAudit() {
  console.log('🔍 Processing error handling audit...\n');

  const issues = [];

  try {
    // Find floating promises
    const floatingPromiseResult = execSync(
      `grep -rn "Promise\\.(all|race|allSettled|any)\\|\.then(" --include="*.ts" --include="*.tsx" apps/ packages/ 2>/dev/null | grep -v "node_modules\\|dist\\|build\\|html\\|\\.test\\.\\|\\.spec\\." | grep -v "\\.catch\\|await\\|void" | head -100 || true`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );

    const floatingPromiseLines = floatingPromiseResult.split('\n').filter(line => line.trim());
    for (const line of floatingPromiseLines) {
      const match = line.match(/^([^:]+):(\d+):(.*)$/);
      if (match) {
        issues.push({
          file: match[1],
          line: parseInt(match[2], 10),
          type: 'floating-promise',
          severity: 'high',
          description: 'Potential floating promise without error handling',
          code: match[3].trim(),
          suggestion: 'Add await, void operator, or .catch() handler',
        });
      }
    }
  } catch (error) {
    // Ignore errors from grep
  }

  try {
    // Find async handlers
    const asyncHandlerResult = execSync(
      `grep -rn "onClick.*async\\|onPress.*async\\|onSubmit.*async" --include="*.tsx" apps/ packages/ 2>/dev/null | grep -v "node_modules\\|dist\\|build\\|html\\|\\.test\\.\\|\\.spec\\." | head -50 || true`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );

    const asyncHandlerLines = asyncHandlerResult.split('\n').filter(line => line.trim());
    for (const line of asyncHandlerLines) {
      const match = line.match(/^([^:]+):(\d+):(.*)$/);
      if (match) {
        issues.push({
          file: match[1],
          line: parseInt(match[2], 10),
          type: 'async-handler',
          severity: 'high',
          description: 'Async event handler without error handling',
          code: match[3].trim(),
          suggestion: 'Wrap handler in try-catch or use error boundary',
        });
      }
    }
  } catch (error) {
    // Ignore errors from grep
  }

  try {
    // Find non-null assertions
    const nonNullResult = execSync(
      `grep -rn "!\\." --include="*.ts" --include="*.tsx" apps/ packages/ 2>/dev/null | grep -v "node_modules\\|dist\\|build\\|html\\|\\.test\\.\\|\\.spec\\." | head -100 || true`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );

    const nonNullLines = nonNullResult.split('\n').filter(line => line.trim());
    for (const line of nonNullLines) {
      const match = line.match(/^([^:]+):(\d+):(.*)$/);
      if (match) {
        issues.push({
          file: match[1],
          line: parseInt(match[2], 10),
          type: 'non-null-assertion',
          severity: 'medium',
          description: 'Non-null assertion without null check',
          code: match[3].trim(),
          suggestion: 'Add null check or use optional chaining',
        });
      }
    }
  } catch (error) {
    // Ignore errors from grep
  }

  const summary = {
    total: issues.length,
    byType: {},
    bySeverity: {},
  };

  for (const issue of issues) {
    summary.byType[issue.type] = (summary.byType[issue.type] || 0) + 1;
    summary.bySeverity[issue.severity] = (summary.bySeverity[issue.severity] || 0) + 1;
  }

  const results = {
    summary,
    issues,
    timestamp: new Date().toISOString(),
  };

  const outputPath = join(logsDir, 'error-handling-audit.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log('✅ Error Handling Audit Complete\n');
  console.log(`  Total Issues: ${summary.total}`);
  console.log(`  By Type: ${JSON.stringify(summary.byType, null, 2)}`);
  console.log(`  By Severity: ${JSON.stringify(summary.bySeverity, null, 2)}`);
  console.log(`\nResults written to: ${outputPath}\n`);

  return issues;
}

// Process memory leak audit
function processMemoryLeakAudit() {
  console.log('🔍 Processing memory leak audit...\n');

  const issues = [];

  try {
    // Find setTimeout/setInterval without clearTimeout/clearInterval
    const timerResult = execSync(
      `grep -rn "setTimeout\\|setInterval" --include="*.ts" --include="*.tsx" apps/ packages/ 2>/dev/null | grep -v "node_modules\\|dist\\|build\\|html\\|\\.test\\.\\|\\.spec\\." | head -200 || true`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );

    const timerLines = timerResult.split('\n').filter(line => line.trim());
    for (const line of timerLines) {
      const match = line.match(/^([^:]+):(\d+):(.*)$/);
      if (match) {
        const file = match[1];
        const lineNum = parseInt(match[2], 10);
        const code = match[3].trim();

        // Check if file has corresponding clearTimeout/clearInterval
        try {
          const fileContent = readFileSync(file, 'utf-8');
          const hasClearTimeout = fileContent.includes('clearTimeout');
          const hasClearInterval = fileContent.includes('clearInterval');

          if (code.includes('setTimeout') && !hasClearTimeout) {
            issues.push({
              file,
              line: lineNum,
              type: 'timer-without-clear',
              severity: 'high',
              description: 'setTimeout without clearTimeout',
              code,
              suggestion: 'Add clearTimeout in cleanup function',
            });
          } else if (code.includes('setInterval') && !hasClearInterval) {
            issues.push({
              file,
              line: lineNum,
              type: 'timer-without-clear',
              severity: 'high',
              description: 'setInterval without clearInterval',
              code,
              suggestion: 'Add clearInterval in cleanup function',
            });
          }
        } catch (error) {
          // Skip if file can't be read
        }
      }
    }
  } catch (error) {
    // Ignore errors from grep
  }

  try {
    // Find addEventListener without removeEventListener
    const listenerResult = execSync(
      `grep -rn "addEventListener" --include="*.ts" --include="*.tsx" apps/ packages/ 2>/dev/null | grep -v "node_modules\\|dist\\|build\\|html\\|\\.test\\.\\|\\.spec\\." | head -200 || true`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );

    const listenerLines = listenerResult.split('\n').filter(line => line.trim());
    for (const line of listenerLines) {
      const match = line.match(/^([^:]+):(\d+):(.*)$/);
      if (match) {
        const file = match[1];

        // Check if file has corresponding removeEventListener
        try {
          const fileContent = readFileSync(file, 'utf-8');
          const hasRemoveEventListener = fileContent.includes('removeEventListener');

          if (!hasRemoveEventListener) {
            issues.push({
              file,
              line: parseInt(match[2], 10),
              type: 'listener-without-remove',
              severity: 'high',
              description: 'addEventListener without removeEventListener',
              code: match[3].trim(),
              suggestion: 'Add removeEventListener in cleanup function',
            });
          }
        } catch (error) {
          // Skip if file can't be read
        }
      }
    }
  } catch (error) {
    // Ignore errors from grep
  }

  try {
    // Find requestAnimationFrame without cancelAnimationFrame
    const rafResult = execSync(
      `grep -rn "requestAnimationFrame" --include="*.ts" --include="*.tsx" apps/ packages/ 2>/dev/null | grep -v "node_modules\\|dist\\|build\\|html\\|\\.test\\.\\|\\.spec\\." | head -100 || true`,
      { encoding: 'utf-8', cwd: process.cwd() }
    );

    const rafLines = rafResult.split('\n').filter(line => line.trim());
    for (const line of rafLines) {
      const match = line.match(/^([^:]+):(\d+):(.*)$/);
      if (match) {
        const file = match[1];

        // Check if file has corresponding cancelAnimationFrame
        try {
          const fileContent = readFileSync(file, 'utf-8');
          const hasCancelAnimationFrame = fileContent.includes('cancelAnimationFrame');

          if (!hasCancelAnimationFrame) {
            issues.push({
              file,
              line: parseInt(match[2], 10),
              type: 'animation-without-cancel',
              severity: 'high',
              description: 'requestAnimationFrame without cancelAnimationFrame',
              code: match[3].trim(),
              suggestion: 'Add cancelAnimationFrame in cleanup function',
            });
          }
        } catch (error) {
          // Skip if file can't be read
        }
      }
    }
  } catch (error) {
    // Ignore errors from grep
  }

  const summary = {
    total: issues.length,
    byType: {},
    bySeverity: {},
  };

  for (const issue of issues) {
    summary.byType[issue.type] = (summary.byType[issue.type] || 0) + 1;
    summary.bySeverity[issue.severity] = (summary.bySeverity[issue.severity] || 0) + 1;
  }

  const results = {
    summary,
    issues,
    timestamp: new Date().toISOString(),
  };

  const outputPath = join(logsDir, 'memory-leak-audit.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log('✅ Memory Leak Audit Complete\n');
  console.log(`  Total Issues: ${summary.total}`);
  console.log(`  By Type: ${JSON.stringify(summary.byType, null, 2)}`);
  console.log(`  By Severity: ${JSON.stringify(summary.bySeverity, null, 2)}`);
  console.log(`\nResults written to: ${outputPath}\n`);

  return issues;
}

// Main execution
console.log('🚀 Starting comprehensive audit...\n\n');

processTodoAudit();
processErrorHandlingAudit();
processMemoryLeakAudit();

console.log('✅ All audits complete!');
