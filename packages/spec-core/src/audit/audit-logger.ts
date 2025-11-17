import { appendFile, ensureDir } from 'fs-extra'
import { dirname } from 'path'

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  timestamp: string
  action: string
  userId?: string
  packId?: string
  credentialKey?: string
  success: boolean
  error?: string
}

/**
 * Audit logger for credential flow
 */
export class AuditLogger {
  private readonly logFile: string

  constructor(logFile: string = 'spec-audit.log') {
    this.logFile = logFile
  }

  /**
   * Log credential prompt action
   */
  async logCredentialPrompt(
    credentialKey: string,
    userId?: string,
    success = true,
    error?: string
  ): Promise<void> {
    await this.writeLog({
      timestamp: new Date().toISOString(),
      action: 'credential_prompt',
      userId,
      credentialKey,
      success,
      error,
    })
  }

  /**
   * Log credential update
   */
  async logCredentialUpdate(
    credentialKey: string,
    userId?: string,
    success = true,
    error?: string
  ): Promise<void> {
    await this.writeLog({
      timestamp: new Date().toISOString(),
      action: 'credential_update',
      userId,
      credentialKey,
      success,
      error,
    })
  }

  /**
   * Write log entry
   */
  private async writeLog(entry: AuditLogEntry): Promise<void> {
    try {
      await ensureDir(dirname(this.logFile))
      const line = JSON.stringify(entry) + '\n'
      await appendFile(this.logFile, line, 'utf-8')
    } catch {
      // Silently fail if logging fails
    }
  }
}

/**
 * Create audit logger instance
 */
export function createAuditLogger(logFile?: string): AuditLogger {
  return new AuditLogger(logFile)
}



