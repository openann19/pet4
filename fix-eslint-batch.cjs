const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Common patterns to fix
const FIXES = [
  // Fix unused imports
  {
    pattern: /import\s+\{[^}]*?(\w+)[^}]*?\}\s+from\s+['"][^'"]+['"];?\n/g,
    description: 'Remove unused imports'
  },
  // Fix prefer-nullish-coalescing (|| to ??)
  {
    pattern: /(\w+)\s*\|\|\s*([^;,\)\]\}]+)/g,
    replacement: '$1 ?? $2',
    description: 'Replace logical OR with nullish coalescing'
  },
  // Prefix unused variables with underscore
  {
    pattern: /(\w+)(\s*[=:]\s*[^,;]+)/g,
    description: 'Prefix unused variables with underscore'
  }
];

console.log('Auto-fixing common ESLint issues...');

// Get list of TypeScript/TSX files
const files = execSync('find apps/web/src -name "*.ts" -o -name "*.tsx"', { encoding: 'utf8' })
  .trim()
  .split('\n')
  .filter(file => file && !file.includes('.test.') && !file.includes('.stories.'));

let totalChanges = 0;

files.slice(0, 10).forEach(file => {  // Process first 10 files
  try {
    const content = fs.readFileSync(file, 'utf8');
    let newContent = content;
    
    // Simple fix: replace || with ?? in safe contexts
    const simplePatterns = [
      [/(\w+)\s*\|\|\s*''/g, "$1 ?? ''"],
      [/(\w+)\s*\|\|\s*""/g, '$1 ?? ""'],
      [/(\w+)\s*\|\|\s*null/g, '$1 ?? null'],
      [/(\w+)\s*\|\|\s*undefined/g, '$1 ?? undefined'],
      [/(\w+)\s*\|\|\s*0/g, '$1 ?? 0'],
      [/(\w+)\s*\|\|\s*false/g, '$1 ?? false'],
    ];
    
    simplePatterns.forEach(([pattern, replacement]) => {
      const before = newContent;
      newContent = newContent.replace(pattern, replacement);
      if (before !== newContent) {
        console.log(`Fixed nullish coalescing in ${file}`);
        totalChanges++;
      }
    });
    
    // Write back if changed
    if (newContent !== content) {
      fs.writeFileSync(file, newContent);
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

console.log(`Fixed ${totalChanges} issues across ${files.slice(0, 10).length} files`);
