export const isWeb =
  (typeof navigator !== 'undefined' && (navigator as { product?: string }).product === 'Gecko') ||
  typeof document !== 'undefined'
