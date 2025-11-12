/**
 * Fix icon buttons that are missing aria-labels
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

let filesChanged = 0;
let issuesFixed = 0;

function fixFile(filePath: string): boolean {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  let changed = false;
  
  const newLines = lines.map((line, idx) => {
    let newLine = line;
    
    // Pattern: <Button size="icon" without aria-label
    if (line.includes('size="icon"') && !line.includes('aria-label')) {
      // Look ahead for the icon component
      const nextLine = lines[idx + 1] || '';
      const iconMatch = nextLine.match(/<(\w+)\s/);
      
      if (iconMatch) {
        const iconName = iconMatch[1];
        // Convert icon name to readable label
        const label = iconName.replace(/([A-Z])/g, ' $1').trim();
        newLine = line.replace(/(<Button[^>]*)(>)/, `$1 aria-label="${label}"$2`);
        if (newLine !== line) {
          issuesFixed++;
          changed = true;
        }
      }
    }
    
    // Pattern: <button with icon inside but no aria-label
    if (line.includes('<button') && !line.includes('aria-label') && !line.includes('aria-labelledby')) {
      const hasIconPattern = line.includes('size={') || lines[idx + 1]?.includes('size={');
      if (hasIconPattern) {
        newLine = line.replace(/<button([^>]*)>/, '<button$1 aria-label="Button">');
        if (newLine !== line) {
          issuesFixed++;
          changed = true;
        }
      }
    }
    
    return newLine;
  });
  
  if (changed) {
    writeFileSync(filePath, newLines.join('\n'), 'utf-8');
    filesChanged++;
    return true;
  }
  
  return false;
}

function processDirectory(dir: string) {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!entry.includes('node_modules') && !entry.includes('.git') && !entry.includes('dist')) {
          processDirectory(fullPath);
        }
      } else if (entry.match(/\.tsx$/) && !entry.includes('.test.') && !entry.includes('.spec.')) {
        const changed = fixFile(fullPath);
        if (changed) {
          console.log(`✓ ${fullPath.replace(process.cwd(), '')}`);
        }
      }
    }
  } catch {}
}

console.log('🎯 Fixing icon buttons with missing aria-labels...\n');

const webSrc = join(process.cwd(), 'apps/web/src');
processDirectory(join(webSrc, 'components'));

console.log(`\n✅ Complete!`);
console.log(`   Files: ${filesChanged}`);
console.log(`   Fixed: ${issuesFixed}`);
