export function safeArrayAccess<T>(arr: T[] | undefined | null, index: number): T | undefined {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return undefined
  }
  return arr[index]
}
