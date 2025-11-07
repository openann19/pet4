// ts-node scripts/verify-migration.ts
import fs from 'node:fs'
import path from 'node:path'
import logger from '@/core/logger';

type Check = { name: string; ok: () => boolean | string }
const root = process.cwd()

function glob(dir: string, exts = ['.ts','.tsx','.js','.mjs']) {
  const out: string[] = []
  const stack = [dir]
  while (stack.length) {
    const d = stack.pop()!
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      if (f.name === 'node_modules' || f.name.startsWith('.')) continue
      const p = path.join(d, f.name)
      if (f.isDirectory()) stack.push(p)
      else if (exts.includes(path.extname(p))) out.push(p)
    }
  }
  return out
}

function anyFileContains(files: string[], re: RegExp) {
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8')
    if (re.test(txt)) return f
  }
  return ''
}

const web = glob(path.join(root, 'apps/web'))
const mobile = glob(path.join(root, 'apps/mobile'))
const shared = glob(path.join(root, 'packages'))

const checks: Check[] = [
  {
    name: 'No framer-motion in shared/mobile',
    ok: () => {
      // Exclude web-only files under apps/web/src/components/**/web-only/
      const webOnlyPattern = /apps\/web\/src\/components\/.*\/web-only\//
      const offenders = [...shared, ...mobile].filter(f => {
        // Skip web-only files
        if (webOnlyPattern.test(f)) return false
        return /framer-motion/.test(fs.readFileSync(f, 'utf8'))
      })
      return offenders.length === 0 || `Found in:\n${String(offenders.join('\n') ?? '')}`
    }
  },
  {
    name: 'No spark.kv stubs',
    ok: () => {
      // Limit this check to actual source files to avoid false positives in config/lint files
      const webSrc = web.filter((f) => /apps\/web\/(src|app)\//.test(f))
      // Only flag concrete runtime usages, not comments or documentation; require window.spark.kv pattern
      const off = anyFileContains(webSrc, /\bwindow\.spark\.kv\b/)
      return off ? `Found in ${String(off ?? '')}` : true
    }
  },
  {
    name: 'QueryClientProvider present',
    ok: () => {
      const main = anyFileContains(web, /QueryClientProvider/)
      return main ? true : 'QueryClientProvider not found in web app'
    }
  },
  {
    name: 'React Query usage per domain',
    ok: () => {
      const need = ['use-pets','use-user','use-matches','use-chat','use-community','use-adoption']
      const hooksDir = path.join(root, 'apps/web/src/hooks/api')
      if (!fs.existsSync(hooksDir)) return `Missing hooks dir: ${String(hooksDir ?? '')}`
      const missing: string[] = []
      const noQuery: string[] = []
      const noMutation: string[] = []
      
      for (const n of need) {
        const p = path.join(hooksDir, `${String(n ?? '')}.ts`)
        if (!fs.existsSync(p)) {
          missing.push(p)
          continue
        }
        const txt = fs.readFileSync(p, 'utf8')
        if (!/useQuery\(|useInfiniteQuery\(/.test(txt)) {
          noQuery.push(p)
        }
        if (!/useMutation\(/.test(txt)) {
          noMutation.push(p)
        }
      }
      
      if (missing.length > 0) return `Missing files:\n${String(missing.join('\n') ?? '')}`
      if (noQuery.length > 0) return `No useQuery in:\n${String(noQuery.join('\n') ?? '')}`
      if (noMutation.length > 0) return `No useMutation in:\n${String(noMutation.join('\n') ?? '')}`
      return true
    }
  },
  {
    name: 'Offline cache wired (IndexedDB on web)',
    ok: () => {
      const off = anyFileContains(web, /react-query-persist-client|IndexedDB|idb-keyval/)
      return off ? true : 'Persist client not detected on web'
    }
  },
  {
    name: 'Mobile AsyncStorage adapter present',
    ok: () => {
      const adapter = anyFileContains(mobile, /AsyncStorage.*persist|@react-native-async-storage\/async-storage/)
      return adapter ? true : 'AsyncStorage persist not detected on mobile'
    }
  },
  {
    name: 'Virtualized list present',
    ok: () => {
      // Check web chat components
      const webChatFiles = web.filter(f => /chat.*\.(ts|tsx)$/.test(f) && !/\.test\./.test(f))
      const hasWebVirtual = anyFileContains(webChatFiles, /@tanstack\/react-virtual|useVirtualizer|VirtualMessageList/)
      
      // Check mobile chat components
      const mobileChatFiles = mobile.filter(f => /chat.*\.(ts|tsx)$/.test(f) && !/\.test\./.test(f))
      const hasMobileVirtual = anyFileContains(mobileChatFiles, /FlashList|@shopify\/flash-list/)
      
      if (!hasWebVirtual && !hasMobileVirtual) {
        return 'Virtualized list not found in chat components (web or mobile)'
      }
      if (!hasWebVirtual) {
        return 'Virtualized list not found on web chat'
      }
      if (!hasMobileVirtual) {
        return 'Virtualized list not found on mobile chat'
      }
      return true
    }
  },
  {
    name: 'Zero ESLint/TS errors marker (last run)',
    ok: () => {
      const report = path.join(root, 'tmp', 'last-quality.json')
      if (!fs.existsSync(report)) return 'No tmp/last-quality.json – run CI job that saves results'
      try {
        const j = JSON.parse(fs.readFileSync(report, 'utf8'))
        if (j.types === 0 && j.eslint === 0 && j.testsFailed === 0) return true
        return `Types:${String(j.types ?? '')} ESLint:${String(j.eslint ?? '')} TestsFailed:${String(j.testsFailed ?? '')}`
      } catch { return 'Malformed tmp/last-quality.json' }
    }
  }
]

let failed = false
for (const c of checks) {
  const r = c.ok()
  if (r === true) {
    logger.info(`✅ ${String(c.name ?? '')}`)
  } else {
    failed = true
    logger.error(`❌ ${String(c.name ?? '')} – ${String(r ?? '')}`)
  }
}
if (failed) process.exit(1)
logger.info('🎯 Migration verification passed.')
