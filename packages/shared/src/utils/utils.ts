import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateULID(): string {
  // Simple ULID generator fallback (replace with a proper lib if needed)
  return 'ulid-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}
