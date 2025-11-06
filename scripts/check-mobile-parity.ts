#!/usr/bin/env tsx
/**
 * Mobile Prop Parity Checker (ts-morph)
 * 
 * Checks that all web components have corresponding .native.tsx files
 * and verifies exported component name and destructured prop key parity.
 * Also checks for reduced motion support and Reanimated usage.
 * 
 * Usage: tsx scripts/check-mobile-parity.ts
 */

import { Project, SyntaxKind, SourceFile, Node } from 'ts-morph'
import { globby } from 'globby'
import * as path from 'node:path'

const WEB_ROOT = 'apps/web/src/components'
const MOB_ROOT = 'apps/mobile/src/components'

const project = new Project({ tsConfigFilePath: 'tsconfig.json' })

function getExportedComponentName(sf: SourceFile): string | null {
  // Prefer first exported function with PascalCase name
  const exports = sf.getExportedDeclarations()
  for (const [name, decs] of exports) {
    for (const d of decs) {
      if (Node.isFunctionDeclaration(d) || Node.isVariableDeclaration(d)) {
        const nm = name || (Node.isFunctionDeclaration(d) ? d.getName() : d.getName())
        if (nm && /^[A-Z]/.test(nm)) return nm
      }
    }
  }
  // default export fallback: try to infer identifier
  const def = sf.getDefaultExportSymbol()
  if (def) {
    const decl = def.getDeclarations()[0]
    if (Node.isFunctionDeclaration(decl) && decl.getName()) return decl.getName()!
  }
  return null
}

function getDestructuredPropKeys(sf: SourceFile, compName: string): string[] {
  // Find the exported function component and read its first parameter destructuring keys
  const funcs = sf.getFunctions().filter((f) => f.isExported() || f.isDefaultExport() || f.getName() === compName)
  const vars  = sf.getVariableDeclarations().filter((v) => v.isExported() || v.getName() === compName)
  const candidates = [...funcs.map((f) => f), ...vars.map((v) => v)]
  for (const c of candidates) {
    // Function form
    if (Node.isFunctionDeclaration(c)) {
      const p = c.getParameters()[0]
      if (!p) continue
      try {
        const binding = p.getBindingPattern()
        if (binding) {
          return binding.getElements().map((el) => el.getNameNode().getText())
        }
      } catch {
        // Parameter doesn't have binding pattern, skip
      }
      // If typed param without destructuring, skip (cannot infer easily)
    }
    // const Comp = ({ x, y }: Props) => ...
    if (Node.isVariableDeclaration(c)) {
      const init = c.getInitializer()
      if (!init) continue
      const arrow = init.getFirstDescendantByKind(SyntaxKind.ArrowFunction)
      if (!arrow) continue
      const p = arrow.getParameters()[0]
      if (!p) continue
      try {
        const binding = p.getBindingPattern()
        if (binding) {
          return binding.getElements().map((el) => el.getNameNode().getText())
        }
      } catch {
        // Parameter doesn't have binding pattern, skip
      }
    }
  }
  return []
}

function hasReducedMotionSupport(sf: SourceFile): boolean {
  const text = sf.getFullText()
  // Check for useReducedMotion imports/usage
  return /useReducedMotion|useReducedMotionSV|getReducedMotionDuration|@petspark\/motion.*reduced-motion/.test(text)
}

function hasReanimatedUsage(sf: SourceFile): boolean {
  const text = sf.getFullText()
  // Check for Reanimated imports
  return /react-native-reanimated|@petspark\/motion/.test(text)
}

function hasFramerMotionUsage(sf: SourceFile): boolean {
  const text = sf.getFullText()
  // Check for framer-motion imports (should not be in mobile)
  return /from\s+['"]framer-motion['"]/.test(text)
}

function hasMathRandomUsage(sf: SourceFile): boolean {
  const text = sf.getFullText()
  // Check for Math.random() usage (should use seeded RNG)
  return /Math\.random\(\)/.test(text)
}

function nativePathFor(webPath: string): string {
  const rel = path.relative(WEB_ROOT, webPath)
  const out = path.join(MOB_ROOT, rel).replace(/\.tsx$/, '.native.tsx')
  return out
}

async function main(): Promise<void> {
  const webFiles = await globby(`${WEB_ROOT}/**/[A-Z]*.tsx`, {
    ignore: ['**/*.native.tsx', '**/*.stories.tsx', '**/*.test.tsx'],
  })

  let failures = 0
  let motionWarnings = 0

  for (const wf of webFiles) {
    const native = nativePathFor(wf)
    const web = project.addSourceFileAtPathIfExists(wf)
    const mob = project.addSourceFileAtPathIfExists(native)

    if (!mob) {
      console.error(`❌ Missing mobile file for: ${path.relative(process.cwd(), wf)} -> ${native}`)
      failures++
      continue
    }

    if (!web) {
      console.error(`❌ Cannot read web file: ${wf}`)
      failures++
      continue
    }

    const webName = getExportedComponentName(web)
    const mobName = getExportedComponentName(mob)
    if (!webName || !mobName) {
      console.error(`❌ Cannot determine export names: ${wf} / ${native}`)
      failures++
      continue
    }
    if (webName !== mobName) {
      console.error(`❌ Export name mismatch: ${path.basename(wf)} exports "${webName}" but native has "${mobName}"`)
      failures++
    }

    // Compare destructured props (order-insensitive)
    const webKeys = new Set(getDestructuredPropKeys(web, webName))
    const mobKeys = new Set(getDestructuredPropKeys(mob, mobName))

    // Only validate when both sides destructure (non-empty)
    if (webKeys.size && mobKeys.size) {
      const aOnly = [...webKeys].filter(k => !mobKeys.has(k))
      const bOnly = [...mobKeys].filter(k => !webKeys.has(k))
      if (aOnly.length || bOnly.length) {
        console.error(`❌ Prop key mismatch for ${webName}:\n  Web-only: ${aOnly.join(', ') || '—'}\n  Mobile-only: ${bOnly.join(', ') || '—'}`)
        failures++
      }
    }

    // Motion checks
    const webHasMotion = hasReanimatedUsage(web) || hasReducedMotionSupport(web)
    const mobHasMotion = hasReanimatedUsage(mob) || hasReducedMotionSupport(mob)
    
    // If web has motion, mobile should too (or vice versa for shared components)
    if (webHasMotion && !mobHasMotion) {
      console.warn(`⚠️  Motion parity: ${webName} uses Reanimated/reduced-motion on web but not on mobile`)
      motionWarnings++
    }

    // Check for framer-motion in mobile (should not be there)
    if (hasFramerMotionUsage(mob)) {
      console.error(`❌ Motion violation: ${mobName} uses framer-motion (should use @petspark/motion)`)
      failures++
    }

    // Check for Math.random in both (should use seeded RNG)
    if (hasMathRandomUsage(web)) {
      console.warn(`⚠️  Determinism: ${webName} uses Math.random() (should use seeded RNG)`)
      motionWarnings++
    }
    if (hasMathRandomUsage(mob)) {
      console.warn(`⚠️  Determinism: ${mobName} uses Math.random() (should use seeded RNG)`)
      motionWarnings++
    }
  }

  if (failures) {
    console.error(`\n⛔ Mobile parity check failed with ${failures} issue(s).`)
    process.exit(1)
  }
  
  if (motionWarnings > 0) {
    console.warn(`\n⚠️  Found ${motionWarnings} motion-related warning(s) (non-blocking).`)
  }
  
  console.log('✅ Mobile parity OK (files + names + destructured prop keys + motion checks)')
}

main().catch((e) => { 
  console.error(e)
  process.exit(1)
})
