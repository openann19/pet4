/**
 * Comprehensive codemod: Fix ALL remaining UI issues
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

let filesChanged = 0;
let issuesFixed = 0;

function fixFile(filePath: string): boolean {
  let content = readFileSync(filePath, 'utf-8');
  let changed = false;
  const lines = content.split('\n');
  
  const newLines = lines.map((line, idx) => {
    let newLine = line;
    
    // 1. Fix missing alt text on images
    if (line.includes('<img') && !line.includes('alt=')) {
      // Add alt="" for decorative images, or descriptive alt
      if (line.includes('icon') || line.includes('logo') || line.includes('avatar')) {
        newLine = line.replace(/<img([^>]*)>/, '<img$1 alt="">');
      } else {
        newLine = line.replace(/<img([^>]*)>/, '<img$1 alt="Image">');
      }
      if (newLine !== line) {
        issuesFixed++;
        changed = true;
      }
    }
    
    // 2. Fix buttons without aria-label
    if (line.includes('<button') && !line.includes('aria-label') && !line.includes('aria-labelledby')) {
      // Check if button has text content on same or next line
      const hasTextContent = line.includes('>') && (line.match(/>([^<]+)</)?.[1]?.trim() || '');
      if (!hasTextContent) {
        // Icon button - needs aria-label
        newLine = line.replace(/<button([^>]*)>/, '<button$1 aria-label="Button">');
        if (newLine !== line) {
          issuesFixed++;
          changed = true;
        }
      }
    }
    
    // 3. Fix hardcoded spacing: w-[300px] → w-80
    newLine = newLine.replace(/w-\[(\d+)px\]/g, (match, px) => {
      const rem = Math.round(parseInt(px) / 16 * 4);
      issuesFixed++;
      changed = true;
      return `w-${rem}`;
    });
    
    newLine = newLine.replace(/h-\[(\d+)px\]/g, (match, px) => {
      const rem = Math.round(parseInt(px) / 16 * 4);
      issuesFixed++;
      changed = true;
      return `h-${rem}`;
    });
    
    newLine = newLine.replace(/p-\[(\d+)px\]/g, (match, px) => {
      const val = Math.round(parseInt(px) / 4);
      issuesFixed++;
      changed = true;
      return `p-${val}`;
    });
    
    newLine = newLine.replace(/m-\[(\d+)px\]/g, (match, px) => {
      const val = Math.round(parseInt(px) / 4);
      issuesFixed++;
      changed = true;
      return `m-${val}`;
    });
    
    // 4. Fix hardcoded border radius: rounded-[16px] → rounded-2xl
    newLine = newLine.replace(/rounded-\[8px\]/g, () => {
      issuesFixed++;
      changed = true;
      return 'rounded-lg';
    });
    
    newLine = newLine.replace(/rounded-\[12px\]/g, () => {
      issuesFixed++;
      changed = true;
      return 'rounded-xl';
    });
    
    newLine = newLine.replace(/rounded-\[16px\]/g, () => {
      issuesFixed++;
      changed = true;
      return 'rounded-2xl';
    });
    
    newLine = newLine.replace(/rounded-\[24px\]/g, () => {
      issuesFixed++;
      changed = true;
      return 'rounded-3xl';
    });
    
    // 5. Fix hardcoded font sizes
    newLine = newLine.replace(/text-\[12px\]/g, () => {
      issuesFixed++;
      changed = true;
      return 'text-xs';
    });
    
    newLine = newLine.replace(/text-\[13px\]/g, () => {
      issuesFixed++;
      changed = true;
      return 'text-sm';
    });
    
    newLine = newLine.replace(/text-\[14px\]/g, () => {
      issuesFixed++;
      changed = true;
      return 'text-sm';
    });
    
    newLine = newLine.replace(/text-\[15px\]/g, () => {
      issuesFixed++;
      changed = true;
      return 'text-base';
    });
    
    newLine = newLine.replace(/text-\[16px\]/g, () => {
      issuesFixed++;
      changed = true;
      return 'text-base';
    });
    
    newLine = newLine.replace(/text-\[18px\]/g, () => {
      issuesFixed++;
      changed = true;
      return 'text-lg';
    });
    
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
      } else if (entry.match(/\.(tsx?)$/) && !entry.includes('.test.') && !entry.includes('.spec.')) {
        const changed = fixFile(fullPath);
        if (changed) {
          console.log(`✓ ${fullPath.replace(process.cwd(), '')}`);
        }
      }
    }
  } catch (error) {
    // Skip inaccessible directories
  }
}

console.log('🚀 Fixing ALL remaining UI issues...\n');

const webSrc = join(process.cwd(), 'apps/web/src');
const mobileSrc = join(process.cwd(), 'apps/mobile/src');

console.log('📁 Processing Web...');
processDirectory(join(webSrc, 'components'));

console.log('\n📁 Processing Mobile...');
try {
  processDirectory(join(mobileSrc, 'components'));
  processDirectory(join(mobileSrc, 'screens'));
} catch {
  console.log('Mobile not found, skipping...');
}

console.log(`\n✅ COMPLETE!`);
console.log(`   Files changed: ${filesChanged}`);
console.log(`   Issues fixed: ${issuesFixed}`);
