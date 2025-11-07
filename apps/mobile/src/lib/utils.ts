import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateCorrelationId(): string {
  return `${String(Date.now() ?? '')}-${String(Math.random().toString(36).substring(2, 11) ?? '')}`
}

export function generateULID(): string {
  const timestamp = Date.now()
  const randomness = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, '0')
  ).join('')
  return `${String(timestamp.toString(36) ?? '')}${String(randomness ?? '')}`.toUpperCase()
}
