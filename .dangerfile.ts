/**
 * Dangerfile - PR Quality Gates
 * Requires: pnpm add -D danger @types/danger
 */

import { danger, fail, markdown } from 'danger'

const changed = danger.git.modified_files.concat(danger.git.created_files)
const touchedChat =
  changed.some(f => /(effects|features\/chat|chat)/.test(f)) ||
  changed.some(f => f.includes('effects/') || f.includes('chat/'))

if (touchedChat) {
  const body = danger.github?.pr?.body || ''
  const needs = ['perf report', 'reduced motion', '120hz', 'haptics']
  const misses = needs.filter(k => !new RegExp(k, 'i').test(body))

  if (misses.length > 0) {
    fail(
      `PR description missing: ${misses.join(', ')}. Include perf notes, Reduced Motion behavior, 120Hz test, and haptics decisions.`
    )
  }

  // Check for TODO/FIXME/HACK in changed files
  for (const file of changed) {
    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      const diff = danger.git.diffForFile(file)
      if (diff && /(TODO|FIXME|HACK|SIMULATION|PLACEHOLDER|IN PRODUCTION)/i.test(diff)) {
        fail(`File ${file} contains forbidden words: TODO/FIXME/HACK/SIMULATION/PLACEHOLDER`)
      }
    }
  }

  markdown(`
## Chat Effects Checklist

- [ ] Reduced Motion support verified
- [ ] 120Hz tested (if applicable)
- [ ] Haptics cooldown implemented (≥250ms)
- [ ] Performance verified (60fps)
- [ ] Bundle size within budget
- [ ] Web/Mobile parity checked
  `)
}
