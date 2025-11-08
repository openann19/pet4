/**
 * Upload Queue Module
 *
 * Production-grade upload queue with retry logic, telemetry, and error handling
 * Location: apps/mobile/src/lib/upload-queue.ts
 */

import { storage } from './storage'
import { createLogger } from '../utils/logger'
import { telemetry } from '../utils/telemetry'

const logger = createLogger('upload-queue')

export type UploadJob = {
  id: string
  uri: string
  endpoint: string
  headers?: Record<string, string>
  tries: number
  nextAt: number // epoch ms
  error?: string // Last error message
  createdAt: number // Job creation timestamp
}

export type UploadResult = {
  success: boolean
  jobId: string
  error?: string
  tries: number
}

const KEY = 'upload-queue/v1'
const MAX_RETRIES = 6
const MAX_BACKOFF_MS = 60_000 // 60 seconds

function now(): number {
  return Date.now()
}

function load(): UploadJob[] {
  return storage.get<UploadJob[]>(KEY) ?? []
}

function save(jobs: UploadJob[]): void {
  storage.set(KEY, jobs)
}

/**
 * Enqueue an upload job
 */
export function enqueue(job: Omit<UploadJob, 'tries' | 'nextAt' | 'createdAt'>): void {
  const jobs = load()
  const newJob: UploadJob = {
    ...job,
    tries: 0,
    nextAt: now(),
    createdAt: now(),
  }
  jobs.push(newJob)
  save(jobs)

  logger.info('Upload job enqueued', {
    jobId: newJob.id,
    endpoint: newJob.endpoint,
  })

  telemetry.track({
    name: 'upload_enqueued',
    payload: {
      jobId: newJob.id,
      endpoint: newJob.endpoint,
    },
  })
}

/**
 * Flush pending uploads with retry logic and telemetry
 */
export async function flushPendingUploads(): Promise<boolean> {
  const jobs = load()
  const remaining: UploadJob[] = []
  const results: UploadResult[] = []

  for (const job of jobs) {
    if (job.nextAt > now()) {
      remaining.push(job)
      continue
    }

    // Skip if max retries exceeded
    if (job.tries >= MAX_RETRIES) {
      logger.warn('Upload job exceeded max retries', {
        jobId: job.id,
        tries: job.tries,
        endpoint: job.endpoint,
      })

      telemetry.trackError(
        new Error(`Upload failed after ${job.tries} tries: ${job.error || 'Unknown error'}`),
        {
          payload: {
            jobId: job.id,
            endpoint: job.endpoint,
            tries: job.tries,
          },
        }
      )

      results.push({
        success: false,
        jobId: job.id,
        error: job.error || 'Max retries exceeded',
        tries: job.tries,
      })
      continue
    }

    try {
      const body = new FormData()
      // Expo/React Native: File from URI
      body.append('file', {
        uri: job.uri,
        name: 'upload',
        type: 'application/octet-stream',
      })

      const startTime = Date.now()
      const res = await fetch(job.endpoint, {
        method: 'POST',
        ...(job.headers && { headers: job.headers }),
        body,
      })

      const duration = Date.now() - startTime

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      }

      // Success: drop job
      logger.info('Upload job completed', {
        jobId: job.id,
        endpoint: job.endpoint,
        tries: job.tries,
        duration,
      })

      telemetry.trackPerformance({
        name: 'upload_success',
        duration,
        metadata: {
          jobId: job.id,
          endpoint: job.endpoint,
          tries: job.tries,
        },
      })

      results.push({
        success: true,
        jobId: job.id,
        tries: job.tries,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      const tries = job.tries + 1
      const backoffMs = Math.min(MAX_BACKOFF_MS, 2 ** Math.min(tries, MAX_RETRIES) * 1000)

      logger.warn('Upload job failed, will retry', {
        jobId: job.id,
        endpoint: job.endpoint,
        tries,
        error: err.message,
        nextRetry: new Date(now() + backoffMs).toISOString(),
      })

      telemetry.trackError(err, {
        payload: {
          jobId: job.id,
          endpoint: job.endpoint,
          tries,
          nextRetry: now() + backoffMs,
        },
      })

      remaining.push({
        ...job,
        tries,
        nextAt: now() + backoffMs,
        error: err.message,
      })

      results.push({
        success: false,
        jobId: job.id,
        error: err.message,
        tries,
      })
    }
  }

  save(remaining)

  // Log summary
  const successCount = results.filter(r => r.success).length
  const failureCount = results.filter(r => !r.success).length
  const pendingCount = remaining.length

  if (successCount > 0 || failureCount > 0) {
    logger.info('Upload flush completed', {
      successCount,
      failureCount,
      pendingCount,
    })
  }

  return remaining.length === 0
}

/**
 * Get upload queue status
 */
export function getUploadQueueStatus(): {
  pending: number
  jobs: UploadJob[]
} {
  const jobs = load()
  const nowTime = now()
  const pending = jobs.filter(job => job.nextAt <= nowTime)

  return {
    pending: pending.length,
    jobs,
  }
}

/**
 * Clear failed uploads (jobs that exceeded max retries)
 */
export function clearFailedUploads(): number {
  const jobs = load()
  const active = jobs.filter(job => job.tries < MAX_RETRIES)
  const cleared = jobs.length - active.length

  if (cleared > 0) {
    save(active)
    logger.info('Cleared failed uploads', { count: cleared })
  }

  return cleared
}
