/**
 * Process Type Definitions
 *
 * Type-safe access to process.env in shared code
 */

interface ProcessEnv {
  readonly [key: string]: string | undefined
}

interface Process {
  readonly env: ProcessEnv
}

type GlobalWithProcess = typeof globalThis & {
  process?: Process
}

/**
 * Type guard to check if process is available
 */
export function hasProcess(global: typeof globalThis): global is GlobalWithProcess {
  return 'process' in global && typeof (global as GlobalWithProcess).process !== 'undefined'
}

/**
 * Safely get environment variable value
 *
 * @param name - Environment variable name
 * @param fallback - Fallback value if not found
 * @returns Environment variable value or fallback
 */
export function getEnvVar(name: string, fallback: boolean): boolean {
  if (hasProcess(globalThis)) {
    const global = globalThis as GlobalWithProcess
    const proc = global.process
    if (proc?.env) {
      const val = proc.env[name]
      if (typeof val !== 'undefined') {
        const v = String(val).toLowerCase()
        return v === '1' || v === 'true' || v === 'on'
      }
    }
  }
  return fallback
}
