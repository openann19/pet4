declare module '@petspark/shared' {
  // Minimal stubs used by @petspark/motion to avoid cross-package type inclusion during typecheck
  export function isTruthy<T>(value: T): boolean
  export function isDefined<T>(value: T | undefined | null): value is T
  export function makeRng(seed?: number): () => number

  // Allow any other named imports without failing the typecheck
  export type AnyObject = Record<string, unknown>
  export const REACTION_EMOJIS: unknown
}
