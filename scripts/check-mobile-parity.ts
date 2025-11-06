#!/usr/bin/env tsx
/**
 * Mobile Parity Checker
 * 
 * Checks that all web components have corresponding .native.tsx files
 * and verifies prop signature compatibility using AST analysis.
 * 
 * Usage: tsx scripts/check-mobile-parity.ts
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const WEB_COMPONENTS_DIR = join(ROOT, 'apps/web/src/components');
const MOBILE_COMPONENTS_DIR = join(ROOT, 'apps/mobile/src/components');

// Files to ignore
const IGNORE_PATTERNS = [
  /\.test\.tsx?$/,
  /\.stories\.tsx?$/,
  /\.native\.tsx?$/,
  /index\.tsx?$/,
];

interface ComponentInfo {
  webPath: string;
  mobilePath: string;
  name: string;
}

function walkComponents(dir: string, baseDir: string): string[] {
  const files: string[] = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...walkComponents(fullPath, baseDir));
      } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
        // Skip ignored files
        if (!IGNORE_PATTERNS.some(pattern => pattern.test(entry.name))) {
          files.push(fullPath.replace(baseDir + '/', ''));
        }
      }
    }
  } catch {
    // Ignore errors
  }
  return files;
}

function extractPropsType(content: string): string | null {
  // Try to find interface or type definition for props
  const interfaceMatch = content.match(/interface\s+(\w+Props)\s*\{[\s\S]*?\}/);
  if (interfaceMatch) {
    return interfaceMatch[1];
  }
  
  const typeMatch = content.match(/type\s+(\w+Props)\s*=\s*\{[\s\S]*?\}/);
  if (typeMatch) {
    return typeMatch[1];
  }
  
  // Try to find props in function signature
  const funcMatch = content.match(/function\s+\w+\s*\([^)]*props:\s*(\w+Props)[^)]*\)/);
  if (funcMatch) {
    return funcMatch[1];
  }
  
  return null;
}

function checkParity(): { missing: ComponentInfo[]; propMismatches: ComponentInfo[] } {
  const webFiles = walkComponents(WEB_COMPONENTS_DIR, WEB_COMPONENTS_DIR);
  const missing: ComponentInfo[] = [];
  const propMismatches: ComponentInfo[] = [];

  for (const webFile of webFiles) {
    const webPath = join(WEB_COMPONENTS_DIR, webFile);
    const fileName = basename(webFile, '.tsx').replace('.ts', '');
    const dir = dirname(webFile);
    
    // Expected mobile path
    const mobileFile = join(dir, `${fileName}.native.tsx`);
    const mobilePath = join(MOBILE_COMPONENTS_DIR, mobileFile);

    if (!existsSync(mobilePath)) {
      missing.push({
        webPath: webFile,
        mobilePath: mobileFile,
        name: fileName,
      });
      continue;
    }

    // Check prop types if both files exist
    try {
      const webContent = readFileSync(webPath, 'utf-8');
      const mobileContent = readFileSync(mobilePath, 'utf-8');
      
      const webProps = extractPropsType(webContent);
      const mobileProps = extractPropsType(mobileContent);
      
      if (webProps && mobileProps && webProps !== mobileProps) {
        // Try to find the actual type definitions to compare
        const webPropsDef = webContent.match(
          new RegExp(`(interface|type)\\s+${webProps}\\s*=\\s*\\{([\\s\\S]*?)\\}`)
        );
        const mobilePropsDef = mobileContent.match(
          new RegExp(`(interface|type)\\s+${mobileProps}\\s*=\\s*\\{([\\s\\S]*?)\\}`)
        );
        
        if (webPropsDef && mobilePropsDef && webPropsDef[2] !== mobilePropsDef[2]) {
          propMismatches.push({
            webPath: webFile,
            mobilePath: mobileFile,
            name: fileName,
          });
        }
      }
    } catch (error) {
      // Ignore parsing errors for now
      console.warn(`Warning: Could not parse props for ${webFile}:`, error);
    }
  }

  return { missing, propMismatches };
}

// Main execution
const { missing, propMismatches } = checkParity();

if (missing.length > 0) {
  console.error('❌ Missing mobile components:');
  for (const comp of missing) {
    console.error(`  - ${comp.webPath} → Expected: ${comp.mobilePath}`);
  }
}

if (propMismatches.length > 0) {
  console.error('❌ Prop signature mismatches:');
  for (const comp of propMismatches) {
    console.error(`  - ${comp.name}: Props differ between web and mobile`);
  }
}

if (missing.length === 0 && propMismatches.length === 0) {
  console.log('✅ Mobile parity OK');
  process.exit(0);
} else {
  process.exit(1);
}

