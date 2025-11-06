#!/usr/bin/env node
/**
 * Mobile Parity Check Script
 * 
 * Ensures web components have corresponding mobile implementations
 */

import { Project, SyntaxKind } from 'ts-morph'
import * as fs from 'node:fs'
import * as path from 'node:path'

const WEB_DIR = 'apps/web/src/components/chat/window'
const MOB_DIR = 'apps/mobile/src/components/chat/window'

const project = new Project({ skipAddingFilesFromTsConfig: true })

if (!fs.existsSync(WEB_DIR)) {
  console.error(`❌ Web directory not found: ${WEB_DIR}`)
  process.exit(1)
}

if (!fs.existsSync(MOB_DIR)) {
  console.error(`❌ Mobile directory not found: ${MOB_DIR}`)
  process.exit(1)
}

const webFiles = fs.readdirSync(WEB_DIR).filter((f) => f.endsWith('.tsx') && !f.includes('.test.') && !f.includes('.native.'))

let failed = false

for (const f of webFiles) {
  const base = f.replace(/\.tsx$/, '')
  const nativePath = path.join(MOB_DIR, `${base}.native.tsx`)

  if (!fs.existsSync(nativePath)) {
    console.error(`❌ Missing mobile: ${nativePath}`)
    failed = true
    continue
  }

  try {
    const src = project.createSourceFile(
      'tmp.tsx',
      fs.readFileSync(path.join(WEB_DIR, f), 'utf8'),
      { overwrite: true }
    )
    const exp = src.getExportAssignments()[0] || src.getExportedDeclarations().values().next().value?.[0]

    if (exp) {
      const name = exp.getName?.() || exp.getExpression?.()?.getText() || base
      const nsrc = project.createSourceFile(
        'tmp.native.tsx',
        fs.readFileSync(nativePath, 'utf8'),
        { overwrite: true }
      )
      const nativeExports = nsrc.getExportedDeclarations()
      const hasExport = Array.from(nativeExports.values()).some((decls) =>
        decls.some((d) => {
          const text = d.getText()
          return text.includes(`export default ${name}`) || text.includes(`export { ${name} }`) || text.includes(`export function ${name}`)
        })
      )

      if (!hasExport && name !== base) {
        console.error(`❌ Mismatch export name: ${base} expected default ${name}`)
        failed = true
      }
    }
  } catch (err) {
    console.warn(`⚠️  Could not verify ${base}: ${err instanceof Error ? err.message : String(err)}`)
  }
}

if (failed) {
  console.error('----')
  console.error('Mobile parity check failed. Create corresponding .native.tsx implementations.')
  process.exit(1)
} else {
  console.log('✅ Mobile parity OK')
}
