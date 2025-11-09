#!/usr/bin/env tsx
/**
 * Audit script to scan and categorize TODO/FIXME/HACK instances in code files
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, relative } from 'path';
import { globby } from 'globby';

interface TodoItem {
  file: string;
  line: number;
  content: string;
  type: 'TODO' | 'FIXME' | 'HACK' | 'XXX' | 'STUB' | 'PLACEHOLDER';
  category: 'fix-immediately' | 'convert-to-issue' | 'remove' | 'review';
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

interface AuditResults {
  summary: {
    total: number;
    byType: Record<string, number>;
    byCategory: Record<string, number>;
    byPriority: Record<string, number>;
  };
  items: TodoItem[];
  timestamp: string;
}

// Patterns to match TODO/FIXME/HACK comments
const TODO_PATTERNS = [
  /TODO:?\s*(.+)/i,
  /FIXME:?\s*(.+)/i,
  /HACK:?\s*(.+)/i,
  /XXX:?\s*(.+)/i,
  /STUB:?\s*(.+)/i,
  /PLACEHOLDER:?\s*(.+)/i,
];

// Keywords that indicate priority
const CRITICAL_KEYWORDS = ['security', 'crash', 'bug', 'broken', 'error', 'fail', 'critical'];
const HIGH_KEYWORDS = ['incomplete', 'missing', 'implement', 'fix', 'issue'];
const MEDIUM_KEYWORDS = ['improve', 'optimize', 'refactor', 'cleanup'];
const LOW_KEYWORDS = ['consider', 'maybe', 'suggest', 'nice-to-have'];

function categorizeTodo(content: string, file: string): {
  category: TodoItem['category'];
  priority: TodoItem['priority'];
  description: string;
} {
  const lowerContent = content.toLowerCase();

  // Check for critical issues
  if (CRITICAL_KEYWORDS.some(keyword => lowerContent.includes(keyword))) {
    return {
      category: 'fix-immediately',
      priority: 'critical',
      description: content.trim(),
    };
  }

  // Check for high priority
  if (HIGH_KEYWORDS.some(keyword => lowerContent.includes(keyword))) {
    return {
      category: 'fix-immediately',
      priority: 'high',
      description: content.trim(),
    };
  }

  // Check for implementation pending
  if (lowerContent.includes('implementation pending') || lowerContent.includes('not implemented')) {
    return {
      category: 'fix-immediately',
      priority: 'high',
      description: content.trim(),
    };
  }

  // Check for medium priority
  if (MEDIUM_KEYWORDS.some(keyword => lowerContent.includes(keyword))) {
    return {
      category: 'convert-to-issue',
      priority: 'medium',
      description: content.trim(),
    };
  }

  // Check for outdated or remove
  if (lowerContent.includes('outdated') || lowerContent.includes('remove') || lowerContent.includes('deprecated')) {
    return {
      category: 'remove',
      priority: 'low',
      description: content.trim(),
    };
  }

  // Check for low priority
  if (LOW_KEYWORDS.some(keyword => lowerContent.includes(keyword))) {
    return {
      category: 'convert-to-issue',
      priority: 'low',
      description: content.trim(),
    };
  }

  // Default to review
  return {
    category: 'review',
    priority: 'medium',
    description: content.trim(),
  };
}

function detectTodoType(line: string): { type: TodoItem['type']; content: string } | null {
  for (const pattern of TODO_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      const type = match[0].toUpperCase().includes('TODO') ? 'TODO' :
                   match[0].toUpperCase().includes('FIXME') ? 'FIXME' :
                   match[0].toUpperCase().includes('HACK') ? 'HACK' :
                   match[0].toUpperCase().includes('XXX') ? 'XXX' :
                   match[0].toUpperCase().includes('STUB') ? 'STUB' :
                   'PLACEHOLDER';
      return {
        type,
        content: match[1]?.trim() || '',
      };
    }
  }
  return null;
}

async function auditTodos(): Promise<void> {
  console.log('🔍 Scanning for TODO/FIXME/HACK instances...\n');

  // Find all TypeScript/JavaScript files in apps/ and packages/
  const files = await globby([
    'apps/**/*.{ts,tsx,js,jsx}',
    'packages/**/*.{ts,tsx,js,jsx}',
  ], {
    ignore: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/html/**',
      '**/*.test.{ts,tsx,js,jsx}',
      '**/*.spec.{ts,tsx,js,jsx}',
      '**/__tests__/**',
      '**/__mocks__/**',
    ],
    cwd: process.cwd(),
  });

  const todos: TodoItem[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const todo = detectTodoType(line);

        if (todo) {
          const { category, priority, description } = categorizeTodo(todo.content, file);

          todos.push({
            file: relative(process.cwd(), file),
            line: i + 1,
            content: line.trim(),
            type: todo.type,
            category,
            priority,
            description: description || todo.content,
          });
        }
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`Error reading ${file}: ${err.message}`);
    }
  }

  // Generate summary
  const summary = {
    total: todos.length,
    byType: todos.reduce((acc, todo) => {
      acc[todo.type] = (acc[todo.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byCategory: todos.reduce((acc, todo) => {
      acc[todo.category] = (acc[todo.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byPriority: todos.reduce((acc, todo) => {
      acc[todo.priority] = (acc[todo.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };

  const results: AuditResults = {
    summary,
    items: todos,
    timestamp: new Date().toISOString(),
  };

  // Ensure logs directory exists
  const logsDir = join(process.cwd(), 'logs');
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }

  // Write results to JSON
  const outputPath = join(logsDir, 'todo-audit-results.json');
  writeFileSync(outputPath, JSON.stringify(results, null, 2));

  console.log('✅ TODO Audit Complete\n');
  console.log('Summary:');
  console.log(`  Total: ${summary.total}`);
  console.log(`  By Type: ${JSON.stringify(summary.byType, null, 2)}`);
  console.log(`  By Category: ${JSON.stringify(summary.byCategory, null, 2)}`);
  console.log(`  By Priority: ${JSON.stringify(summary.byPriority, null, 2)}`);
  console.log(`\nResults written to: ${outputPath}`);

  // Print critical items
  const criticalItems = todos.filter(t => t.priority === 'critical');
  if (criticalItems.length > 0) {
    console.log(`\n⚠️  Found ${criticalItems.length} critical items:`);
    for (const item of criticalItems.slice(0, 10)) {
      console.log(`  - ${item.file}:${item.line} [${item.type}] ${item.description}`);
    }
    if (criticalItems.length > 10) {
      console.log(`  ... and ${criticalItems.length - 10} more`);
    }
  }
}

auditTodos().catch((error) => {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error('Audit failed:', err);
  process.exit(1);
});
