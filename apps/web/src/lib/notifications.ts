import { toast } from 'sonner'
import { logger } from './logger'
import { isTruthy, isDefined } from '@/core/guards';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'promise'
export type NotificationPosition = 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'

export interface NotificationOptions {
  duration?: number
  position?: NotificationPosition
  action?: {
    label: string
    onClick: () => void
  }
  cancel?: {
    label: string
    onClick?: () => void
  }
  onDismiss?: () => void
  onAutoClose?: () => void
  important?: boolean
  closeButton?: boolean
}

export interface PromiseNotificationOptions<T> {
  loading: string
  success: string | ((data: T) => string)
  error: string | ((error: Error) => string)
  duration?: number
}

class NotificationManager {
  private queue: Array<() => void> = []
  private isProcessing = false
  private maxConcurrent = 3
  private activeCount = 0

  notify(
    type: NotificationType,
    message: string,
    description?: string,
    options: NotificationOptions = {}
  ): string | number {
    const {
      duration = 4000,
      action,
      cancel,
      onDismiss,
      onAutoClose,
      important = false,
      closeButton = true
    } = options

    // Using a custom type that extends the base toast options with our additional fields
    type ToastOptions = {
      duration?: number
      onDismiss?: () => void
      onAutoClose?: () => void
      closeButton?: boolean
      action?: { label: string; onClick: () => void }
      cancel?: { label: string; onClick?: () => void }
      important?: boolean
    }

    const toastOptions: ToastOptions = {
      ...(duration !== undefined ? { duration } : {}),
      ...(onDismiss ? { onDismiss } : {}),
      ...(onAutoClose ? { onAutoClose } : {}),
      ...(closeButton !== undefined ? { closeButton } : {}),
      ...(action ? {
        action: {
          label: action.label,
          onClick: action.onClick || (() => {}),
        },
      } : {}),
      ...(cancel ? {
        cancel: {
          label: cancel.label,
          ...(cancel.onClick ? { onClick: cancel.onClick } : {}),
        },
      } : {}),
      ...(important !== undefined ? { important } : {}),
    }

    switch (type) {
      case 'success':
        return toast.success(message, { description, ...toastOptions } as unknown as Parameters<typeof toast.success>[1])
      case 'error':
        return toast.error(message, { description, ...toastOptions, duration: duration || 6000 } as unknown as Parameters<typeof toast.error>[1])
      case 'warning':
        return toast.warning(message, { description, ...toastOptions } as unknown as Parameters<typeof toast.warning>[1])
      case 'info':
        return toast.info(message, { description, ...toastOptions } as unknown as Parameters<typeof toast.info>[1])
      default:
        return toast(message, { description, ...toastOptions } as unknown as Parameters<typeof toast>[1])
    }
  }

  success(message: string, description?: string, options?: NotificationOptions) {
    return this.notify('success', message, description, options)
  }

  error(message: string, description?: string, options?: NotificationOptions) {
    return this.notify('error', message, description, options)
  }

  warning(message: string, description?: string, options?: NotificationOptions) {
    return this.notify('warning', message, description, options)
  }

  info(message: string, description?: string, options?: NotificationOptions) {
    return this.notify('info', message, description, options)
  }

  promise<T>(
    promise: Promise<T>,
    options: PromiseNotificationOptions<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      toast.promise(promise, {
        loading: options.loading,
        success: (data) => {
          const message = typeof options.success === 'function'
            ? options.success(data)
            : options.success
          resolve(data)
          return message
        },
        error: (error) => {
          const message = typeof options.error === 'function'
            ? options.error(error)
            : options.error
          reject(error)
          return message
        },
        ...(options.duration !== undefined ? { duration: options.duration } : {}),
      })
    })
  }

  dismiss(id?: string | number) {
    if (isTruthy(id)) {
      toast.dismiss(id)
    } else {
      toast.dismiss()
    }
  }

  dismissAll() {
    toast.dismiss()
  }

  loading(message: string, description?: string): string | number {
    return toast.loading(message, { description })
  }

  custom(component: React.ReactNode, options?: NotificationOptions) {
    return toast(component as string, {
      ...(options?.duration !== undefined ? { duration: options.duration } : {}),
      ...(options?.onDismiss ? { onDismiss: options.onDismiss } : {}),
      ...(options?.onAutoClose ? { onAutoClose: options.onAutoClose } : {}),
    })
  }

  async queueNotification(fn: () => void) {
    this.queue.push(fn)
    this.processQueue()
  }

  private async processQueue() {
    if (this.isProcessing || this.activeCount >= this.maxConcurrent) {
      return
    }

    this.isProcessing = true

    while (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
      const notification = this.queue.shift()
      if (isTruthy(notification)) {
        this.activeCount++
        notification()
        await new Promise(resolve => setTimeout(resolve, 100))
        this.activeCount--
      }
    }

    this.isProcessing = false
  }
}

export const notifications = new NotificationManager()

export function showMatchNotification(petName: string, yourPetName: string) {
  return notifications.success(
    "It's a Match! 🎉",
    `${String(yourPetName ?? '')} and ${String(petName ?? '')} are now connected!`,
    {
      duration: 5000,
      important: true,
      action: {
        label: 'View Match',
        onClick: () => {
          logger.info('Navigate to matches', { action: 'viewMatch', petName, yourPetName })
        }
      }
    }
  )
}

export function showMessageNotification(senderName: string, message: string) {
  return notifications.info(
    `New message from ${String(senderName ?? '')}`,
    message.length > 50 ? message.substring(0, 50) + '...' : message,
    {
      duration: 4000,
      action: {
        label: 'Reply',
        onClick: () => {
          logger.info('Navigate to chat', { action: 'viewChat', senderName })
        }
      }
    }
  )
}

export function showErrorNotification(title: string, description?: string) {
  return notifications.error(title, description, {
    duration: 6000,
    closeButton: true
  })
}

export function showSuccessNotification(title: string, description?: string) {
  return notifications.success(title, description, {
    duration: 4000
  })
}

export function showLoadingNotification(message: string) {
  return notifications.loading(message)
}

export function confirmAction(
  message: string,
  onConfirm: () => void,
  onCancel?: () => void
) {
  return notifications.warning(message, undefined, {
    duration: Infinity,
    action: {
      label: 'Confirm',
      onClick: onConfirm,
    },
    ...(onCancel && {
      cancel: {
        label: 'Cancel',
        onClick: onCancel,
      }
    })
  })
}
