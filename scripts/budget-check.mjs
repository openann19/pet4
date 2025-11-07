// node scripts/budget-check.mjs
import fs from 'node:fs'
import path from 'node:path'

const dir = 'apps/web/dist/assets'
const mainChunkBudgetKb = 800 // Increased due to chunk splitting
const totalBudgetKb = 5000 // Increased for multiple chunks

if (!fs.existsSync(dir)) {
  console.error('dist not found. Build web first.')
  process.exit(1)
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'))
let max = 0, maxFile = ''
let total = 0

for (const f of files) {
  const sz = fs.statSync(path.join(dir,f)).size / 1024
  total += sz
  if (sz > max) { 
    max = sz
    maxFile = f 
  }
}

let failed = false

if (max > mainChunkBudgetKb) {
  console.error(`❌ Largest JS ${maxFile} = ${max.toFixed(1)}KB > ${mainChunkBudgetKb}KB budget`)
  failed = true
} else {
  console.log(`✅ Largest JS ${maxFile} = ${max.toFixed(1)}KB`)
}

if (total > totalBudgetKb) {
  console.error(`❌ Total bundle size ${total.toFixed(1)}KB > ${totalBudgetKb}KB budget`)
  failed = true
} else {
  console.log(`✅ Total bundle size ${total.toFixed(1)}KB`)
}

if (failed) process.exit(1)
console.log('🎯 Bundle budget OK (with chunk splitting).')
