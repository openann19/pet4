import AsyncStorage from '@react-native-async-storage/async-storage'
import type { FileSystemUploadOptions } from 'expo-file-system'
import { createLogger } from '../utils/logger'
import { apiClient } from '../utils/api-client'
import { getAuthToken } from '../utils/secure-storage'
import { isTruthy } from '@petspark/shared';

const logger = createLogger('upload-queue')

const QUEUE_STORAGE_KEY = 'petspark:upload-queue'

type HttpMethod = 'POST' | 'PUT' | 'PATCH'

export interface UploadTask {
  id: string
  uri: string
  endpoint: string
  method?: HttpMethod
  fieldName?: string
  headers?: Record<string, string>
  metadata?: Record<string, string>
}

async function readQueue(): Promise<UploadTask[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as UploadTask[]
    if (Array.isArray(parsed)) {
      return parsed.filter(task => isTruthy(task?.id) && isTruthy(task?.uri) && isTruthy(task?.endpoint))
    }
    return []
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to read upload queue', err)
    return []
  }
}

async function writeQueue(tasks: UploadTask[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(tasks))
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    logger.error('Failed to persist upload queue', err)
  }
}

export async function enqueueUpload(task: Omit<UploadTask, 'id'> & { id?: string }): Promise<UploadTask> {
  const queue = await readQueue()
  const resolvedTask: UploadTask = {
    id: task.id ?? generateId(),
    uri: task.uri,
    endpoint: task.endpoint,
    method: task.method ?? 'POST',
    fieldName: task.fieldName ?? 'file',
    headers: task.headers ?? {},
    metadata: task.metadata ?? {},
  }

  queue.push(resolvedTask)
  await writeQueue(queue)
  logger.debug('Upload task enqueued', { id: resolvedTask.id, endpoint: resolvedTask.endpoint })
  return resolvedTask
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2)
}

function resolveEndpoint(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint
  }

  const base = apiClient.getBaseUrl().replace(/\/$/, '')
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  return `${base}${normalizedEndpoint}`
}

async function performUpload(task: UploadTask): Promise<void> {
  const FileSystem = await import('expo-file-system')
  const uploadUrl = resolveEndpoint(task.endpoint)
  const headers: Record<string, string> = { ...(task.headers ?? {}) }

  const token = await getAuthToken().catch(() => null)
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`
  }

  const options: FileSystemUploadOptions = {
    httpMethod: task.method ?? 'POST',
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
    fieldName: task.fieldName ?? 'file',
    headers,
  }

  if (task.metadata && Object.keys(task.metadata).length > 0) {
    options.parameters = task.metadata
  }

  const result = await FileSystem.uploadAsync(uploadUrl, task.uri, options)

  if (result.status < 200 || result.status >= 300) {
    const error = new Error(`Upload failed with status ${String(result.status ?? '')}`)
    ;(error as Error & { body?: string }).body = result.body
    throw error
  }

  logger.info('Upload completed', { id: task.id, endpoint: task.endpoint, status: result.status })
}

export async function flushPendingUploads(): Promise<boolean> {
  const queue = await readQueue()
  if (queue.length === 0) {
    return true
  }

  let processedAny = false
  let remaining: UploadTask[] = []

  for (let index = 0; index < queue.length; index += 1) {
    const task = queue[index]
    try {
      await performUpload(task)
      processedAny = true
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logger.warn('Failed to process upload task, preserving in queue', err)
      remaining = queue.slice(index)
      break
    }
  }

  if (remaining.length > 0) {
    await writeQueue(remaining)
  } else {
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY)
  }

  return processedAny
}

export async function getPendingUploads(): Promise<UploadTask[]> {
  return readQueue()
}

export async function clearUploads(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_STORAGE_KEY)
}
