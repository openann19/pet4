/**
 * Worker Pool Manager
 * Manages a pool of Web Workers for CPU-intensive tasks with task queue, scheduling, progress reporting, and cancellation
 */

import { createLogger } from './logger';
import { WorkerTaskError as WorkerTaskErrorClass, createErrorContext } from './media-errors';

const logger = createLogger('WorkerPool');

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface WorkerTask<T = unknown> {
  readonly id: string;
  readonly type: string;
  readonly data: unknown;
  readonly priority?: number;
  readonly timeout?: number;
  readonly onProgress?: (progress: number) => void;
  readonly onComplete?: (result: T) => void;
  readonly onError?: (error: Error) => void;
}

export interface WorkerMessage<T = unknown> {
  readonly type: 'task' | 'result' | 'error' | 'progress' | 'cancel';
  readonly taskId?: string;
  readonly data?: T;
  readonly progress?: number;
  readonly error?: string;
}

export interface WorkerPoolOptions {
  readonly poolSize?: number;
  readonly workerScript?: string;
  readonly timeout?: number;
  readonly maxRetries?: number;
}

export interface WorkerPoolStats {
  readonly totalWorkers: number;
  readonly activeWorkers: number;
  readonly queueSize: number;
  readonly completedTasks: number;
  readonly failedTasks: number;
}

// ============================================================================
// Worker Pool Manager
// ============================================================================

export class WorkerPoolManager {
  private readonly workers: Worker[] = [];
  private readonly queue: WorkerTask[] = [];
  private readonly activeTasks = new Map<string, WorkerTask>();
  private readonly workerStates = new Map<Worker, boolean>(); // true = busy, false = idle
  private readonly poolSize: number;
  private readonly workerScript?: string;
  private readonly defaultTimeout: number;
  private readonly maxRetries: number;
  private completedTasks = 0;
  private failedTasks = 0;
  private taskIdCounter = 0;

  constructor(options: WorkerPoolOptions = {}) {
    this.poolSize = options.poolSize ?? Math.max(1, (navigator.hardwareConcurrency ?? 4) - 1);
    this.workerScript = options.workerScript;
    this.defaultTimeout = options.timeout ?? 30000; // 30 seconds
    this.maxRetries = options.maxRetries ?? 2;

    logger.info('Worker pool initialized', {
      poolSize: this.poolSize,
      workerScript: this.workerScript,
    });
  }

  /**
   * Initialize worker pool
   */
  initialize(): void {
    if (this.workers.length > 0) {
      return;
    }

    for (let i = 0; i < this.poolSize; i++) {
      this.createWorker();
    }
  }

  /**
   * Create a new worker
   */
  private createWorker(): Worker {
    let worker: Worker;

    if (this.workerScript) {
      worker = new Worker(this.workerScript, { type: 'module' });
    } else {
      // Create inline worker with basic task handler
      const workerCode = `
        self.onmessage = function(e) {
          const { type, taskId, data } = e.data;

          if (type === 'task') {
            try {
              // Basic task processing - override in actual worker script
              self.postMessage({
                type: 'result',
                taskId,
                data: data
              });
            } catch (error) {
              self.postMessage({
                type: 'error',
                taskId,
                error: error.message
              });
            }
          } else if (type === 'cancel') {
            // Handle cancellation
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      worker = new Worker(URL.createObjectURL(blob));
    }

    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      this.handleWorkerMessage(worker, event.data);
    };

    worker.onerror = (error: ErrorEvent) => {
      this.handleWorkerError(worker, error);
    };

    this.workers.push(worker);
    this.workerStates.set(worker, false);

    return worker;
  }

  /**
   * Handle worker message
   */
  private handleWorkerMessage(worker: Worker, message: WorkerMessage): void {
    if (!message.taskId) {
      return;
    }

    const task = this.activeTasks.get(message.taskId);
    if (!task) {
      return;
    }

    switch (message.type) {
      case 'result': {
        this.workerStates.set(worker, false);
        this.activeTasks.delete(message.taskId);
        this.completedTasks++;

        if (task.onComplete) {
          task.onComplete(message.data);
        }

        this.processQueue();
        break;
      }

      case 'error': {
        this.workerStates.set(worker, false);
        this.activeTasks.delete(message.taskId);
        this.failedTasks++;

        const error = new WorkerTaskErrorClass(
          message.error ?? 'Worker task failed',
          createErrorContext('worker-task', {
            taskId: message.taskId,
            taskType: task.type,
          }),
          false
        );

        if (task.onError) {
          task.onError(error);
        }

        this.processQueue();
        break;
      }

      case 'progress': {
        if (task.onProgress && message.progress !== undefined) {
          task.onProgress(message.progress);
        }
        break;
      }

      default:
        break;
    }
  }

  /**
   * Handle worker error
   */
  private handleWorkerError(worker: Worker, error: ErrorEvent): void {
    logger.error('Worker error', error.error, {
      workerIndex: this.workers.indexOf(worker),
    });

    // Find active task for this worker
    for (const [taskId, task] of this.activeTasks.entries()) {
      // Check if task is assigned to this worker (simplified - in real implementation, track worker-task mapping)
      if (task.onError) {
        const workerError = new WorkerTaskErrorClass(
          error.message ?? 'Worker error',
          createErrorContext('worker-error', {
            taskId,
            taskType: task.type,
          }),
          false
        );
        task.onError(workerError);
      }
      this.activeTasks.delete(taskId);
      this.failedTasks++;
    }

    this.workerStates.set(worker, false);
    this.processQueue();
  }

  /**
   * Submit task to worker pool
   */
  submitTask<T>(task: Omit<WorkerTask<T>, 'id'>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const taskId = `task_${++this.taskIdCounter}_${Date.now()}`;
      const fullTask: WorkerTask<unknown> = {
        ...task,
        id: taskId,
        onComplete: (result: unknown) => {
          if (task.onComplete) {
            task.onComplete(result as T);
          }
          resolve(result as T);
        },
        onError: (error: Error) => {
          if (task.onError) {
            task.onError(error);
          }
          reject(error);
        },
      };

      this.queue.push(fullTask);
      this.queue.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

      // Set timeout
      const timeout = task.timeout ?? this.defaultTimeout;
      const timeoutId = setTimeout(() => {
        if (this.activeTasks.has(taskId)) {
          this.cancelTask(taskId);
          const error = new WorkerTaskErrorClass(
            'Task timeout',
            createErrorContext('worker-task-timeout', {
              taskId,
              taskType: task.type,
              timeout,
            }),
            false
          );
          reject(error);
        }
      }, timeout);

      // Store original onComplete to clear timeout
      const originalOnComplete = fullTask.onComplete;
      // Create a wrapper that clears timeout
      const wrappedOnComplete = (result: unknown): void => {
        clearTimeout(timeoutId);
        if (originalOnComplete) {
          originalOnComplete(result);
        }
      };
      // Replace onComplete in the task object
      (fullTask as { onComplete?: (result: unknown) => void }).onComplete = wrappedOnComplete;

      this.processQueue();
    });
  }

  /**
   * Process task queue
   */
  private processQueue(): void {
    if (this.queue.length === 0) {
      return;
    }

    // Find idle worker
    const idleWorker = this.workers.find((worker) => !this.workerStates.get(worker));
    if (!idleWorker) {
      return;
    }

    // Get next task from queue
    const task = this.queue.shift();
    if (!task) {
      return;
    }

    // Assign task to worker
    this.workerStates.set(idleWorker, true);
    this.activeTasks.set(task.id, task);

    // Send task to worker
    idleWorker.postMessage({
      type: 'task',
      taskId: task.id,
      data: task.data,
    } as WorkerMessage);

    // Process next task
    this.processQueue();
  }

  /**
   * Cancel task
   */
  cancelTask(taskId: string): boolean {
    // Remove from queue
    const queueIndex = this.queue.findIndex((task) => task.id === taskId);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
      return true;
    }

    // Cancel active task
    const task = this.activeTasks.get(taskId);
    if (task) {
      // Find worker with this task (simplified - in real implementation, track worker-task mapping)
      for (const worker of this.workers) {
        if (this.workerStates.get(worker)) {
          worker.postMessage({
            type: 'cancel',
            taskId,
          } as WorkerMessage);
        }
      }

      this.activeTasks.delete(taskId);
      const busyWorker = this.workers.find((w) => this.workerStates.get(w));
      if (busyWorker) {
        this.workerStates.set(busyWorker, false);
      }

      this.processQueue();
      return true;
    }

    return false;
  }

  /**
   * Get pool statistics
   */
  getStats(): WorkerPoolStats {
    const activeWorkers = this.workers.filter((worker) => this.workerStates.get(worker)).length;

    return {
      totalWorkers: this.workers.length,
      activeWorkers,
      queueSize: this.queue.length,
      completedTasks: this.completedTasks,
      failedTasks: this.failedTasks,
    };
  }

  /**
   * Cleanup worker pool
   */
  cleanup(): void {
    logger.info('Cleaning up worker pool', {
      workers: this.workers.length,
      activeTasks: this.activeTasks.size,
      queueSize: this.queue.length,
    });

    // Cancel all active tasks
    for (const taskId of this.activeTasks.keys()) {
      this.cancelTask(taskId);
    }

    // Clear queue
    this.queue.length = 0;

    // Terminate all workers
    for (const worker of this.workers) {
      worker.terminate();
    }

    this.workers.length = 0;
    this.workerStates.clear();
    this.activeTasks.clear();
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let poolInstance: WorkerPoolManager | null = null;

export function getWorkerPool(options?: WorkerPoolOptions): WorkerPoolManager {
  if (!poolInstance) {
    poolInstance = new WorkerPoolManager(options);
    poolInstance.initialize();
  }
  return poolInstance;
}
