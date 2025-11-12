/**
 * Codemod: Add focus-visible rings to all interactive elements
 * Addresses UI-0001 through UI-0019 (Focus/Outline issues)
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

const FOCUS_RING_CLASS = 'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-(--color-focus-ring)';
const FOCUS_OUTLINE_REMOVE = 'focus:outline-none';

let filesChanged = 0;
let elementsFixed = 0;

interface Match {
  type: 'button' | 'input' | 'link' | 'pressable';
  element: string;
  className: string | null;
  hasOutline: boolean;
  hasFocusRing: boolean;
}

function analyzeElement(line: string): Match | null {
  // Match button elements
  const buttonMatch = line.match(/<button([^>]*)>/);
  if (buttonMatch) {
    const attrs = buttonMatch[1];
    const classMatch = attrs.match(/className="([^"]*)"/);
    const className = classMatch ? classMatch[1] : null;
    const hasFocusRing = className?.includes('focus-visible:ring') || false;
    const hasOutline = className?.includes('focus:outline-none') || false;
    
    return {
      type: 'button',
      element: buttonMatch[0],
      className,
      hasOutline,
      hasFocusRing,
    };
  }
  
  // Match <a> link elements with onClick or role="button"
  const linkMatch = line.match(/<a([^>]*)>/);
  if (linkMatch && (linkMatch[1].includes('onClick') || linkMatch[1].includes('role="button"'))) {
    const attrs = linkMatch[1];
    const classMatch = attrs.match(/className="([^"]*)"/);
    const className = classMatch ? classMatch[1] : null;
    const hasFocusRing = className?.includes('focus-visible:ring') || false;
    const hasOutline = className?.includes('focus:outline-none') || false;
    
    return {
      type: 'link',
      element: linkMatch[0],
      className,
      hasOutline,
      hasFocusRing,
    };
  }
  
  // Match input/select/textarea elements
  const inputMatch = line.match(/<(input|select|textarea)([^>]*)>/);
  if (inputMatch) {
    const attrs = inputMatch[2];
    const classMatch = attrs.match(/className="([^"]*)"/);
    const className = classMatch ? classMatch[1] : null;
    const hasFocusRing = className?.includes('focus-visible:ring') || className?.includes('focus:ring') || false;
    const hasOutline = className?.includes('focus:outline-none') || false;
    
    return {
      type: 'input',
      element: inputMatch[0],
      className,
      hasOutline,
      hasFocusRing,
    };
  }
  
  // Match React Native Pressable/TouchableOpacity
  const pressableMatch = line.match(/<(Pressable|TouchableOpacity)([^>]*)>/);
  if (pressableMatch) {
    const attrs = pressableMatch[2];
    const classMatch = attrs.match(/className="([^"]*)"/);
    const className = classMatch ? classMatch[1] : null;
    const hasFocusRing = className?.includes('focus-visible:ring') || false;
    const hasOutline = className?.includes('focus:outline-none') || false;
    
    return {
      type: 'pressable',
      element: pressableMatch[0],
      className,
      hasOutline,
      hasFocusRing,
    };
  }
  
  return null;
}

function addFocusRing(element: Match): string {
  if (element.hasFocusRing) {
    return element.element; // Already has focus ring
  }
  
  const newClasses = [
    element.className || '',
    FOCUS_OUTLINE_REMOVE,
    FOCUS_RING_CLASS,
  ].filter(Boolean).join(' ').trim();
  
  if (element.className) {
    // Replace existing className
    return element.element.replace(
      /className="[^"]*"/,
      `className="${newClasses}"`
    );
  } else {
    // Add className attribute
    return element.element.replace('>', ` className="${newClasses}">`);
  }
}

function fixFocusRingsInFile(filePath: string, dryRun: boolean = false): boolean {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let changed = false;
  
  const newLines = lines.map((line, index) => {
    const element = analyzeElement(line);
    if (element && !element.hasFocusRing) {
      const newElement = addFocusRing(element);
      if (newElement !== element.element) {
        changed = true;
        elementsFixed++;
        if (dryRun) {
          console.log(`  Line ${index + 1}: ${element.type} → Adding focus ring`);
        }
        return line.replace(element.element, newElement);
      }
    }
    return line;
  });
  
  if (changed && !dryRun) {
    writeFileSync(filePath, newLines.join('\n'), 'utf-8');
    filesChanged++;
    return true;
  }
  
  return changed;
}

function processDirectory(dir: string, dryRun: boolean) {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!entry.includes('node_modules') && !entry.includes('.git') && !entry.includes('dist') && !entry.includes('build')) {
          processDirectory(fullPath, dryRun);
        }
      } else if (entry.match(/\.(tsx?|jsx?)$/) && !entry.includes('.test.') && !entry.includes('.spec.')) {
        const changed = fixFocusRingsInFile(fullPath, dryRun);
        if (changed) {
          console.log(`${dryRun ? '  Preview' : '✓'} ${fullPath}`);
        }
      }
    }
  } catch (error) {
    console.warn(`⚠ Skipping ${dir}:`, error);
  }
}

// Parse command line args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');

if (dryRun) {
  console.log('🔍 DRY RUN MODE - No files will be modified\n');
} else {
  console.log('🎯 Adding focus-visible rings to interactive elements...\n');
}

const webSrc = join(process.cwd(), 'apps/web/src');
const mobileSrc = join(process.cwd(), 'apps/mobile/src');

console.log('📁 Processing Web app...');
processDirectory(join(webSrc, 'components'), dryRun);
// Process App.tsx as a file, not directory
const appFile = join(webSrc, 'App.tsx');
try {
  const changed = fixFocusRingsInFile(appFile, dryRun);
  if (changed) {
    console.log(`${dryRun ? '  Preview' : '✓'} ${appFile}`);
  }
} catch (e) {
  // App.tsx might not exist or be in different location
}

console.log('\n📁 Processing Mobile app...');
try {
  processDirectory(join(mobileSrc, 'components'), dryRun);
  processDirectory(join(mobileSrc, 'screens'), dryRun);
} catch {
  console.log('Mobile directory not found, skipping...');
}

console.log(`\n${dryRun ? '📊 Preview' : '✅'} Complete!`);
console.log(`   Files ${dryRun ? 'to change' : 'changed'}: ${filesChanged}`);
console.log(`   Elements ${dryRun ? 'to fix' : 'fixed'}: ${elementsFixed}`);

if (dryRun) {
  console.log(`\n📝 To apply changes, run without --dry-run flag`);
} else {
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Review changes: git diff`);
  console.log(`   2. Test keyboard navigation: Tab through all interactive elements`);
  console.log(`   3. Run tests: pnpm test`);
  console.log(`   4. Commit: git add -A && git commit -m "fix(ui): add focus-visible rings for accessibility"`);
}
