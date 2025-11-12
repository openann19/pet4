/**
 * Design Token Audit Script
 * Audits design token coverage and identifies missing tokens
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface TokenAudit {
  tokens: {
    spacing: { present: boolean; keys: string[] };
    radii: { present: boolean; keys: string[] };
    shadows: { present: boolean; keys: string[] };
    zIndex: { present: boolean; keys: string[] };
    typography: { present: boolean; keys: string[] };
    colors: { present: boolean; keys: string[] };
    gradients: { present: boolean; keys: string[] };
    motion: { present: boolean; keys: string[] };
    hitArea: { present: boolean; keys: string[] };
    breakpoints: { present: boolean; keys: string[] };
  };
  missing: {
    buttonSizes: string[];
    focusRings: string[];
    other: string[];
  };
  recommendations: string[];
}

const TOKENS_JSON_PATH = join(process.cwd(), 'apps/web/design-system/tokens.json');
const OUTPUT_PATH = join(process.cwd(), 'scripts/ui-audit/token-audit.json');

function auditTokens(): TokenAudit {
  const tokensContent = readFileSync(TOKENS_JSON_PATH, 'utf-8');
  const tokens = JSON.parse(tokensContent);

  const audit: TokenAudit = {
    tokens: {
      spacing: {
        present: !!tokens.spacing,
        keys: tokens.spacing ? Object.keys(tokens.spacing) : [],
      },
      radii: {
        present: !!tokens.radii,
        keys: tokens.radii ? Object.keys(tokens.radii) : [],
      },
      shadows: {
        present: !!tokens.shadows,
        keys: tokens.shadows ? Object.keys(tokens.shadows).filter(k => k !== 'glow') : [],
      },
      zIndex: {
        present: !!tokens.zIndex,
        keys: tokens.zIndex ? Object.keys(tokens.zIndex) : [],
      },
      typography: {
        present: !!tokens.typography,
        keys: tokens.typography ? Object.keys(tokens.typography) : [],
      },
      colors: {
        present: !!tokens.colors,
        keys: tokens.colors ? Object.keys(tokens.colors.light || {}) : [],
      },
      gradients: {
        present: !!tokens.gradients,
        keys: tokens.gradients ? Object.keys(tokens.gradients).filter(k => !['radial', 'ambient'].includes(k)) : [],
      },
      motion: {
        present: !!tokens.motion,
        keys: tokens.motion ? Object.keys(tokens.motion.duration || {}).concat(Object.keys(tokens.motion.easing || {})) : [],
      },
      hitArea: {
        present: !!tokens.hitArea,
        keys: tokens.hitArea ? Object.keys(tokens.hitArea) : [],
      },
      breakpoints: {
        present: !!tokens.breakpoints,
        keys: tokens.breakpoints ? Object.keys(tokens.breakpoints) : [],
      },
    },
    missing: {
      buttonSizes: [],
      focusRings: [],
      other: [],
    },
    recommendations: [],
  };

  // Check for button size tokens (sm=36px, md=44px, lg=48px)
  const spacing = tokens.spacing || {};
  const hasButtonSm = spacing['9'] === '36px';
  const hasButtonMd = spacing['10'] === '40px' || spacing['11'] === '44px';
  const hasButtonLg = spacing['12'] === '48px';

  if (!hasButtonSm) {
    audit.missing.buttonSizes.push('sm (36px)');
  }
  if (!hasButtonMd) {
    audit.missing.buttonSizes.push('md (44px)');
  }
  if (!hasButtonLg) {
    audit.missing.buttonSizes.push('lg (48px)');
  }

  // Check for focus ring tokens
  if (!tokens.shadows || !tokens.shadows.focus) {
    audit.missing.focusRings.push('focus ring shadow');
  }
  if (!tokens.spacing || !tokens.spacing['ring-offset']) {
    audit.missing.focusRings.push('ring-offset spacing');
  }

  // Generate recommendations
  if (audit.missing.buttonSizes.length > 0) {
    audit.recommendations.push(
      `Add button size tokens: ${audit.missing.buttonSizes.join(', ')}`
    );
  }

  if (audit.missing.focusRings.length > 0) {
    audit.recommendations.push(
      `Add focus ring tokens: ${audit.missing.focusRings.join(', ')}`
    );
  }

  if (!tokens.colors?.light?.ring || !tokens.colors?.dark?.ring) {
    audit.recommendations.push('Ensure --ring color token exists for focus rings');
  }

  return audit;
}

function generateAuditReport(audit: TokenAudit): void {
  console.log('Design Token Audit Results:');
  console.log('\nToken Coverage:');
  Object.entries(audit.tokens).forEach(([key, value]) => {
    console.log(`  ${key}: ${value.present ? '✓' : '✗'} (${value.keys.length} keys)`);
  });

  console.log('\nMissing Tokens:');
  if (audit.missing.buttonSizes.length > 0) {
    console.log(`  Button sizes: ${audit.missing.buttonSizes.join(', ')}`);
  }
  if (audit.missing.focusRings.length > 0) {
    console.log(`  Focus rings: ${audit.missing.focusRings.join(', ')}`);
  }
  if (audit.missing.other.length > 0) {
    console.log(`  Other: ${audit.missing.other.join(', ')}`);
  }

  console.log('\nRecommendations:');
  audit.recommendations.forEach(rec => {
    console.log(`  - ${rec}`);
  });

  writeFileSync(OUTPUT_PATH, JSON.stringify(audit, null, 2), 'utf-8');
  console.log(`\nAudit report saved to: ${OUTPUT_PATH}`);
}

if (require.main === module) {
  try {
    const audit = auditTokens();
    generateAuditReport(audit);
    process.exit(0);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Token audit failed:', err);
    process.exit(1);
  }
}

export { auditTokens, type TokenAudit };
