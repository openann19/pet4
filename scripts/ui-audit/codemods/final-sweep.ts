/**
 * Final sweep: Fix all remaining patterns
 */
import { readdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join } from 'path';

let filesChanged = 0;
let issuesFixed = 0;

function fixFile(filePath: string): boolean {
  let content = readFileSync(filePath, 'utf-8');
  let changed = false;
  
  // Fix min-h-[Npx] → min-h-N
  content = content.replace(/min-h-\[(\d+)px\]/g, (match, px) => {
    const val = Math.round(parseInt(px) / 16 * 4);
    issuesFixed++;
    changed = true;
    return `min-h-${val}`;
  });
  
  // Fix max-h-[Npx] → max-h-N
  content = content.replace(/max-h-\[(\d+)px\]/g, (match, px) => {
    const val = Math.round(parseInt(px) / 16 * 4);
    issuesFixed++;
    changed = true;
    return `max-h-${val}`;
  });
  
  // Fix min-w-[Npx] → min-w-N
  content = content.replace(/min-w-\[(\d+)px\]/g, (match, px) => {
    const val = Math.round(parseInt(px) / 16 * 4);
    issuesFixed++;
    changed = true;
    return `min-w-${val}`;
  });
  
  // Fix max-w-[Npx] → max-w-N (keep large values as-is)
  content = content.replace(/max-w-\[(\d+)px\]/g, (match, px) => {
    const pxVal = parseInt(px);
    if (pxVal <= 64) {
      const val = Math.round(pxVal / 16 * 4);
      issuesFixed++;
      changed = true;
      return `max-w-${val}`;
    }
    return match;
  });
  
  // Fix px-[Npx], py-[Npx], pl-[Npx], pr-[Npx], pt-[Npx], pb-[Npx]
  content = content.replace(/p([xylrtb])-\[(\d+)px\]/g, (match, dir, px) => {
    const val = Math.round(parseInt(px) / 4);
    issuesFixed++;
    changed = true;
    return `p${dir}-${val}`;
  });
  
  // Fix mx-[Npx], my-[Npx], ml-[Npx], mr-[Npx], mt-[Npx], mb-[Npx]
  content = content.replace(/m([xylrtb])-\[(\d+)px\]/g, (match, dir, px) => {
    const val = Math.round(parseInt(px) / 4);
    issuesFixed++;
    changed = true;
    return `m${dir}-${val}`;
  });
  
  // Fix gap-[Npx]
  content = content.replace(/gap-\[(\d+)px\]/g, (match, px) => {
    const val = Math.round(parseInt(px) / 4);
    issuesFixed++;
    changed = true;
    return `gap-${val}`;
  });
  
  // Fix space-x-[Npx], space-y-[Npx]
  content = content.replace(/space-([xy])-\[(\d+)px\]/g, (match, dir, px) => {
    const val = Math.round(parseInt(px) / 4);
    issuesFixed++;
    changed = true;
    return `space-${dir}-${val}`;
  });
  
  // Fix top-[Npx], bottom-[Npx], left-[Npx], right-[Npx] (small values only)
  content = content.replace(/(top|bottom|left|right)-\[(\d+)px\]/g, (match, dir, px) => {
    const pxVal = parseInt(px);
    if (pxVal <= 64) {
      const val = Math.round(pxVal / 4);
      issuesFixed++;
      changed = true;
      return `${dir}-${val}`;
    }
    return match;
  });
  
  if (changed) {
    writeFileSync(filePath, content, 'utf-8');
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
  } catch {}
}

console.log('🔥 Final sweep: fixing all remaining spacing patterns...\n');

const webSrc = join(process.cwd(), 'apps/web/src');
const mobileSrc = join(process.cwd(), 'apps/mobile/src');

processDirectory(join(webSrc, 'components'));
try {
  processDirectory(join(mobileSrc, 'components'));
  processDirectory(join(mobileSrc, 'screens'));
} catch {}

console.log(`\n✅ Final sweep complete!`);
console.log(`   Files: ${filesChanged}`);
console.log(`   Fixed: ${issuesFixed}`);
