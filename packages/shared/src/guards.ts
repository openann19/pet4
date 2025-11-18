// Minimal, pure, safe guards used by codemods (no runtime deps).
export function isDefined<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined;
}
export function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}
export function isTruthy<T>(v: T): v is Exclude<T, 0 | '' | false | null | undefined> {
  return !!v;
}
