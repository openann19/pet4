import type { ReactNode } from 'react';
import React from 'react';
import { toast } from 'sonner';
import type { ExternalToast } from 'sonner';
import { logger } from './logger';

export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'promise';
export type NotificationPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface NotificationOptions {
  duration?: number;
  position?: NotificationPosition;
  action?: {
    label: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  };
  cancel?: {
    label: string;
    onClick?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  };
  onDismiss?: () => void;
  onAutoClose?: () => void;
  important?: boolean;
  closeButton?: boolean;
}

export interface PromiseNotificationOptions<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: Error) => string);
  duration?: number;
}

class NotificationManager {
  private queue: (() => void)[] = [];
  private isProcessing = false;
  private maxConcurrent = 3;
  private activeCount = 0;

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
      important: _important = false,
      closeButton = true,
    } = options;

    // Build toast options compatible with sonner's ExternalToast
    const toastOptions: ExternalToast = {};

    if (duration !== undefined) {
      toastOptions.duration = duration;
    }
    if (onDismiss) {
      toastOptions.onDismiss = onDismiss;
    }
    if (onAutoClose) {
      toastOptions.onAutoClose = onAutoClose;
    }
    if (closeButton !== undefined) {
      toastOptions.closeButton = closeButton;
    }
    if (action) {
      toastOptions.action = {
        label: action.label,
        onClick: action.onClick,
      };
    }
    if (cancel) {
      toastOptions.cancel = {
        label: cancel.label,
        onClick: cancel.onClick ? cancel.onClick : (() => {
          // default no-op so Action.onClick is always defined
        }),
      };
    }
    // Note: 'important' is not a standard sonner property, removing it

    // Build the complete options with description
    const completeOptions: ExternalToast = {
      ...toastOptions,
    };
    if (description !== undefined) {
      completeOptions.description = description;
    }

    switch (type) {
      case 'success':
        return toast.success(message, completeOptions);
      case 'error': {
        const errorOptions: ExternalToast = {
          ...completeOptions,
          duration: duration ?? 6000,
        };
        return toast.error(message, errorOptions);
      }
      case 'warning':
        return toast.warning(message, completeOptions);
      case 'info':
        return toast.info(message, completeOptions);
      default:
        return toast(message, completeOptions);
    }
  }

  success(message: string, description?: string, options?: NotificationOptions) {
    return this.notify('success', message, description, options);
  }

  error(message: string, description?: string, options?: NotificationOptions) {
    return this.notify('error', message, description, options);
  }

  warning(message: string, description?: string, options?: NotificationOptions) {
    return this.notify('warning', message, description, options);
  }

  info(message: string, description?: string, options?: NotificationOptions) {
    return this.notify('info', message, description, options);
  }

  promise<T>(promise: Promise<T>, options: PromiseNotificationOptions<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      toast.promise(promise, {
        loading: options.loading,
        success: (data) => {
          const message =
            typeof options.success === 'function' ? options.success(data) : options.success;
          resolve(data);
          return message;
        },
        error: (err) => {
          const error = err instanceof Error ? err : new Error(String(err));
          const message =
            typeof options.error === 'function' ? options.error(error) : options.error;
          reject(error);
          return message;
        },
        ...(options.duration !== undefined ? { duration: options.duration } : {}),
      });
    });
  }

  dismiss(id?: string | number) {
    if (id) {
      toast.dismiss(id);
    } else {
      toast.dismiss();
    }
  }

  dismissAll() {
    toast.dismiss();
  }

  loading(message: string, description?: string): string | number {
    return toast.loading(message, { description });
  }

  custom(component: ReactNode, options?: NotificationOptions): string | number {
    const toastOptions: ExternalToast = {};
    if (options?.duration !== undefined) {
      toastOptions.duration = options.duration;
    }
    if (options?.onDismiss) {
      toastOptions.onDismiss = options.onDismiss;
    }
    if (options?.onAutoClose) {
      toastOptions.onAutoClose = options.onAutoClose;
    }
    // toast.custom expects a function that returns ReactElement, so wrap the component
    if (typeof component === 'function') {
      return toast.custom(component as (id: string | number) => React.ReactElement, toastOptions);
    }
    // If it's a ReactElement or ReactNode, wrap it in a function
    const componentFunction = () => {
      if (React.isValidElement(component)) {
        return component;
      }
      // Fallback: wrap in a div if it's not a valid element
      return React.createElement('div', {}, component);
    };
    return toast.custom(componentFunction, toastOptions);
  }

  queueNotification(fn: () => void): void {
    this.queue.push(fn);
    void this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.activeCount >= this.maxConcurrent) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0 && this.activeCount < this.maxConcurrent) {
      const notification = this.queue.shift();
      if (notification) {
        this.activeCount++;
        notification();
        await new Promise((resolve) => setTimeout(resolve, 100));
        this.activeCount--;
      }
    }

    this.isProcessing = false;
  }
}

export const notifications = new NotificationManager();

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
          logger.info('Navigate to matches', { action: 'viewMatch', petName, yourPetName });
        },
      },
    }
  );
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
          logger.info('Navigate to chat', { action: 'viewChat', senderName });
        },
      },
    }
  );
}

export function showErrorNotification(title: string, description?: string) {
  return notifications.error(title, description, {
    duration: 6000,
    closeButton: true,
  });
}

export function showSuccessNotification(title: string, description?: string) {
  return notifications.success(title, description, {
    duration: 4000,
  });
}

export function showLoadingNotification(message: string) {
  return notifications.loading(message);
}

export function confirmAction(message: string, onConfirm: () => void, onCancel?: () => void) {
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
      },
    }),
  });
}
